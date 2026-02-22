import ExpoModulesCore

// ─────────────────────────────────────────────────────────────────────────────
// Expo Module Definition
//
// All C FFI declarations (UmbraCoreResult, umbra_init, umbra_call, etc.)
// come from UmbraCore.h which CocoaPods includes in the umbrella header.
// The C header guarantees the struct layout matches Rust's #[repr(C)] FfiResult
// and uses the correct C calling convention for struct returns.
// ─────────────────────────────────────────────────────────────────────────────

// Global weak reference to the module so the C callback can reach it.
// This is safe because the module lives for the entire app lifetime.
private weak var sharedModule: ExpoUmbraCoreModule?

// Track whether any JS listener has been added for the event.
// sendEvent() before a listener is attached throws an NSException in the
// TurboModule bridge (performVoidMethodInvocation) → SIGABRT.
private var hasEventListeners = false

// C-compatible callback for Rust events.
// Called from Rust's async runtime thread — must dispatch to main for Expo.
private let umbraEventCallback: UmbraEventCallback = { eventType, data in
    guard let eventType = eventType, let data = data else { return }
    let typeStr = String(cString: eventType)
    let dataStr = String(cString: data)

    DispatchQueue.main.async {
        guard hasEventListeners, let module = sharedModule else { return }
        // Wrap in ObjC exception handler to prevent TurboModule bridge crashes.
        // sendEvent can still throw if the bridge is torn down during a hot-reload.
        let result = ObjCExceptionHelper.tryCatch {
            module.sendEvent("onUmbraCoreEvent", [
                "type": typeStr,
                "data": dataStr,
            ])
        }
        if let error = result {
            NSLog("[ExpoUmbraCore] sendEvent failed (non-fatal): %@", error.localizedDescription)
        }
    }
}

public class ExpoUmbraCoreModule: Module {

    // MARK: - Helpers

    /// Convert UmbraCoreResult (C struct) to a Swift String, freeing C memory.
    /// Returns a JSON error string instead of throwing to avoid NSException
    /// crashes in the Hermes/TurboModule bridge during concurrent execution.
    private func processResult(_ result: UmbraCoreResult) -> String {
        defer {
            if result.error_message != nil {
                umbra_free_string(result.error_message)
            }
            if result.data != nil {
                umbra_free_string(result.data)
            }
        }

        if result.success == 1 {
            if let data = result.data {
                return String(cString: data)
            }
            return "{}"
        } else {
            let errorMessage: String
            if let errMsg = result.error_message {
                errorMessage = String(cString: errMsg)
            } else {
                errorMessage = "Unknown error"
            }
            // Return error as JSON instead of throwing.
            // Throwing NSError from synchronous Expo Module functions causes
            // the TurboModule bridge to convert it to an NSException, which
            // can corrupt the Hermes heap during concurrent microtask draining
            // and crash the app on startup (EXC_BAD_ACCESS in HiddenClass::findProperty).
            let code = Int(result.error_code)
            let escapedMsg = errorMessage
                .replacingOccurrences(of: "\\", with: "\\\\")
                .replacingOccurrences(of: "\"", with: "\\\"")
            return "{\"error\": true, \"error_code\": \(code), \"error_message\": \"\(escapedMsg)\"}"
        }
    }

    /// Get the app's Documents directory for Rust storage
    private func getStoragePath() -> String {
        let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
        return paths[0].appendingPathComponent("umbra_data").path
    }

    // MARK: - Module Definition

    public func definition() -> ModuleDefinition {
        Name("ExpoUmbraCore")

        // ── Events ──────────────────────────────────────────────────────────
        Events("onUmbraCoreEvent")

        OnStartObserving {
            hasEventListeners = true
        }

        OnStopObserving {
            hasEventListeners = false
        }

        OnCreate {
            // Store weak reference so the C callback can reach sendEvent
            sharedModule = self

            // Register C callback with Rust event system
            umbra_register_event_callback(umbraEventCallback)
        }

        // ── Lifecycle ────────────────────────────────────────────────────────

        Function("initialize") { (storagePath: String) -> String in
            let path = storagePath.isEmpty ? self.getStoragePath() : storagePath

            try? FileManager.default.createDirectory(
                atPath: path,
                withIntermediateDirectories: true,
                attributes: nil
            )

            let result = path.withCString { cPath in
                umbra_init(cPath)
            }
            return self.processResult(result)
        }

        Function("initDatabase") { () -> String in
            let result = umbra_init_database()
            return self.processResult(result)
        }

        Function("shutdown") { () -> String in
            let result = umbra_shutdown()
            return self.processResult(result)
        }

        Function("version") { () -> String in
            guard let cStr = umbra_version() else {
                return "unknown"
            }
            let version = String(cString: cStr)
            umbra_free_string(cStr)
            return version
        }

        // ── Identity ─────────────────────────────────────────────────────────

        Function("identityCreate") { (displayName: String) -> String in
            let result = displayName.withCString { cName in
                umbra_identity_create(cName)
            }
            return self.processResult(result)
        }

        Function("identityRestore") { (recoveryPhrase: String, displayName: String) -> String in
            let result = recoveryPhrase.withCString { cPhrase in
                displayName.withCString { cName in
                    umbra_identity_restore(cPhrase, cName)
                }
            }
            return self.processResult(result)
        }

        Function("identityGetDid") { () -> String in
            let result = umbra_identity_get_did()
            return self.processResult(result)
        }

        Function("identityGetProfile") { () -> String in
            let result = umbra_identity_get_profile()
            return self.processResult(result)
        }

        Function("identityUpdateProfile") { (json: String) -> String in
            let result = json.withCString { cJson in
                umbra_identity_update_profile(cJson)
            }
            return self.processResult(result)
        }

        // ── Network ──────────────────────────────────────────────────────────

        AsyncFunction("networkStart") { (configJson: String?) -> String in
            if let config = configJson {
                let result = config.withCString { cConfig in
                    umbra_network_start(cConfig)
                }
                return self.processResult(result)
            } else {
                let result = umbra_network_start(nil)
                return self.processResult(result)
            }
        }

        AsyncFunction("networkStop") { () -> String in
            let result = umbra_network_stop()
            return self.processResult(result)
        }

        Function("networkStatus") { () -> String in
            let result = umbra_network_status()
            return self.processResult(result)
        }

        AsyncFunction("networkConnect") { (addr: String) -> String in
            let result = addr.withCString { cAddr in
                umbra_network_connect(cAddr)
            }
            return self.processResult(result)
        }

        // ── Discovery ────────────────────────────────────────────────────────

        Function("discoveryGetConnectionInfo") { () -> String in
            let result = umbra_discovery_get_connection_info()
            return self.processResult(result)
        }

        AsyncFunction("discoveryConnectWithInfo") { (info: String) -> String in
            let result = info.withCString { cInfo in
                umbra_discovery_connect_with_info(cInfo)
            }
            return self.processResult(result)
        }

        AsyncFunction("discoveryLookupPeer") { (did: String) -> String in
            let result = did.withCString { cDid in
                umbra_discovery_lookup_peer(cDid)
            }
            return self.processResult(result)
        }

        // ── Friends ──────────────────────────────────────────────────────────

        Function("friendsSendRequest") { (did: String, message: String?) -> String in
            let result: UmbraCoreResult
            if let msg = message {
                result = did.withCString { cDid in
                    msg.withCString { cMsg in
                        umbra_friends_send_request(cDid, cMsg)
                    }
                }
            } else {
                result = did.withCString { cDid in
                    umbra_friends_send_request(cDid, nil)
                }
            }
            return self.processResult(result)
        }

        Function("friendsAcceptRequest") { (requestId: String) -> String in
            let result = requestId.withCString { cId in
                umbra_friends_accept_request(cId)
            }
            return self.processResult(result)
        }

        Function("friendsRejectRequest") { (requestId: String) -> String in
            let result = requestId.withCString { cId in
                umbra_friends_reject_request(cId)
            }
            return self.processResult(result)
        }

        Function("friendsList") { () -> String in
            let result = umbra_friends_list()
            return self.processResult(result)
        }

        Function("friendsPendingRequests") { () -> String in
            let result = umbra_friends_pending_requests()
            return self.processResult(result)
        }

        // ── Messaging ────────────────────────────────────────────────────────

        AsyncFunction("messagingSendText") { (recipientDid: String, text: String) -> String in
            let result = recipientDid.withCString { cDid in
                text.withCString { cText in
                    umbra_messaging_send_text(cDid, cText)
                }
            }
            return self.processResult(result)
        }

        Function("messagingGetConversations") { () -> String in
            let result = umbra_messaging_get_conversations()
            return self.processResult(result)
        }

        Function("messagingGetMessages") { (conversationId: String, limit: Int, beforeId: String?) -> String in
            let result: UmbraCoreResult
            if let before = beforeId {
                result = conversationId.withCString { cId in
                    before.withCString { cBefore in
                        umbra_messaging_get_messages(cId, Int32(limit), cBefore)
                    }
                }
            } else {
                result = conversationId.withCString { cId in
                    umbra_messaging_get_messages(cId, Int32(limit), nil)
                }
            }
            return self.processResult(result)
        }

        // ── Generic Dispatcher ───────────────────────────────────────────

        AsyncFunction("call") { (method: String, args: String) -> String in
            let result = method.withCString { cMethod in
                args.withCString { cArgs in
                    umbra_call(cMethod, cArgs)
                }
            }
            return self.processResult(result)
        }
    }
}
