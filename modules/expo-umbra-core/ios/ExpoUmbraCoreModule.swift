import ExpoModulesCore

// ─────────────────────────────────────────────────────────────────────────────
// C FFI declarations — these match the Rust `#[no_mangle] extern "C"` functions
// in umbra-core/src/ffi/c_api.rs and types.rs
// ─────────────────────────────────────────────────────────────────────────────

// FfiResult struct — mirrors the Rust #[repr(C)] FfiResult
struct FfiResult {
    let success: Int32
    let errorCode: Int32
    let errorMessage: UnsafeMutablePointer<CChar>?
    let data: UnsafeMutablePointer<CChar>?
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
@_silgen_name("umbra_init")
func umbra_init(_ storagePath: UnsafePointer<CChar>?) -> FfiResult

@_silgen_name("umbra_shutdown")
func umbra_shutdown() -> FfiResult

@_silgen_name("umbra_version")
func umbra_version() -> UnsafeMutablePointer<CChar>?

// ── Identity ─────────────────────────────────────────────────────────────────
@_silgen_name("umbra_identity_create")
func umbra_identity_create(_ displayName: UnsafePointer<CChar>?) -> FfiResult

@_silgen_name("umbra_identity_restore")
func umbra_identity_restore(_ recoveryPhrase: UnsafePointer<CChar>?, _ displayName: UnsafePointer<CChar>?) -> FfiResult

@_silgen_name("umbra_identity_get_did")
func umbra_identity_get_did() -> FfiResult

@_silgen_name("umbra_identity_get_profile")
func umbra_identity_get_profile() -> FfiResult

@_silgen_name("umbra_identity_update_profile")
func umbra_identity_update_profile(_ json: UnsafePointer<CChar>?) -> FfiResult

// ── Network ──────────────────────────────────────────────────────────────────
@_silgen_name("umbra_network_start")
func umbra_network_start(_ configJson: UnsafePointer<CChar>?) -> FfiResult

@_silgen_name("umbra_network_stop")
func umbra_network_stop() -> FfiResult

@_silgen_name("umbra_network_status")
func umbra_network_status() -> FfiResult

@_silgen_name("umbra_network_connect")
func umbra_network_connect(_ addr: UnsafePointer<CChar>?) -> FfiResult

// ── Discovery ────────────────────────────────────────────────────────────────
@_silgen_name("umbra_discovery_get_connection_info")
func umbra_discovery_get_connection_info() -> FfiResult

@_silgen_name("umbra_discovery_connect_with_info")
func umbra_discovery_connect_with_info(_ info: UnsafePointer<CChar>?) -> FfiResult

@_silgen_name("umbra_discovery_lookup_peer")
func umbra_discovery_lookup_peer(_ did: UnsafePointer<CChar>?) -> FfiResult

// ── Friends ──────────────────────────────────────────────────────────────────
@_silgen_name("umbra_friends_send_request")
func umbra_friends_send_request(_ did: UnsafePointer<CChar>?, _ message: UnsafePointer<CChar>?) -> FfiResult

@_silgen_name("umbra_friends_accept_request")
func umbra_friends_accept_request(_ requestId: UnsafePointer<CChar>?) -> FfiResult

@_silgen_name("umbra_friends_reject_request")
func umbra_friends_reject_request(_ requestId: UnsafePointer<CChar>?) -> FfiResult

@_silgen_name("umbra_friends_list")
func umbra_friends_list() -> FfiResult

@_silgen_name("umbra_friends_pending_requests")
func umbra_friends_pending_requests() -> FfiResult

// ── Messaging ────────────────────────────────────────────────────────────────
@_silgen_name("umbra_messaging_send_text")
func umbra_messaging_send_text(_ recipientDid: UnsafePointer<CChar>?, _ text: UnsafePointer<CChar>?) -> FfiResult

@_silgen_name("umbra_messaging_get_conversations")
func umbra_messaging_get_conversations() -> FfiResult

@_silgen_name("umbra_messaging_get_messages")
func umbra_messaging_get_messages(_ conversationId: UnsafePointer<CChar>?, _ limit: Int32, _ beforeId: UnsafePointer<CChar>?) -> FfiResult

// ── Memory Management ────────────────────────────────────────────────────────
@_silgen_name("umbra_free_result")
func umbra_free_result(_ result: FfiResult)

@_silgen_name("umbra_free_string")
func umbra_free_string(_ ptr: UnsafeMutablePointer<CChar>?)


// ─────────────────────────────────────────────────────────────────────────────
// Expo Module Definition
// ─────────────────────────────────────────────────────────────────────────────

public class ExpoUmbraCoreModule: Module {

    // MARK: - Helpers

    /// Convert FfiResult to a Swift String, freeing the C memory.
    /// Throws if the FFI call returned an error.
    private func processResult(_ result: FfiResult) throws -> String {
        defer {
            // Free the C-allocated strings
            if let errMsg = result.errorMessage {
                umbra_free_string(errMsg)
            }
            if let data = result.data {
                umbra_free_string(data)
            }
        }

        if result.success == 1 {
            if let data = result.data {
                return String(cString: data)
            }
            return "{}"
        } else {
            let errorMessage = result.errorMessage.map { String(cString: $0) } ?? "Unknown error"
            throw NSError(
                domain: "UmbraCore",
                code: Int(result.errorCode),
                userInfo: [NSLocalizedDescriptionKey: errorMessage]
            )
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

        // ── Lifecycle ────────────────────────────────────────────────────────

        Function("init") { (storagePath: String?) -> String in
            let path = storagePath ?? self.getStoragePath()

            // Ensure the storage directory exists
            try? FileManager.default.createDirectory(
                atPath: path,
                withIntermediateDirectories: true,
                attributes: nil
            )

            let result = path.withCString { cPath in
                umbra_init(cPath)
            }
            return try self.processResult(result)
        }

        Function("shutdown") { () -> String in
            let result = umbra_shutdown()
            return try self.processResult(result)
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
            return try self.processResult(result)
        }

        Function("identityRestore") { (recoveryPhrase: String, displayName: String) -> String in
            let result = recoveryPhrase.withCString { cPhrase in
                displayName.withCString { cName in
                    umbra_identity_restore(cPhrase, cName)
                }
            }
            return try self.processResult(result)
        }

        Function("identityGetDid") { () -> String in
            let result = umbra_identity_get_did()
            return try self.processResult(result)
        }

        Function("identityGetProfile") { () -> String in
            let result = umbra_identity_get_profile()
            return try self.processResult(result)
        }

        Function("identityUpdateProfile") { (json: String) -> String in
            let result = json.withCString { cJson in
                umbra_identity_update_profile(cJson)
            }
            return try self.processResult(result)
        }

        // ── Network ──────────────────────────────────────────────────────────

        // Network operations are async because they involve Tokio runtime
        AsyncFunction("networkStart") { (configJson: String?) -> String in
            if let config = configJson {
                let result = config.withCString { cConfig in
                    umbra_network_start(cConfig)
                }
                return try self.processResult(result)
            } else {
                let result = umbra_network_start(nil)
                return try self.processResult(result)
            }
        }

        AsyncFunction("networkStop") { () -> String in
            let result = umbra_network_stop()
            return try self.processResult(result)
        }

        Function("networkStatus") { () -> String in
            let result = umbra_network_status()
            return try self.processResult(result)
        }

        AsyncFunction("networkConnect") { (addr: String) -> String in
            let result = addr.withCString { cAddr in
                umbra_network_connect(cAddr)
            }
            return try self.processResult(result)
        }

        // ── Discovery ────────────────────────────────────────────────────────

        Function("discoveryGetConnectionInfo") { () -> String in
            let result = umbra_discovery_get_connection_info()
            return try self.processResult(result)
        }

        AsyncFunction("discoveryConnectWithInfo") { (info: String) -> String in
            let result = info.withCString { cInfo in
                umbra_discovery_connect_with_info(cInfo)
            }
            return try self.processResult(result)
        }

        AsyncFunction("discoveryLookupPeer") { (did: String) -> String in
            let result = did.withCString { cDid in
                umbra_discovery_lookup_peer(cDid)
            }
            return try self.processResult(result)
        }

        // ── Friends ──────────────────────────────────────────────────────────

        Function("friendsSendRequest") { (did: String, message: String?) -> String in
            let result: FfiResult
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
            return try self.processResult(result)
        }

        Function("friendsAcceptRequest") { (requestId: String) -> String in
            let result = requestId.withCString { cId in
                umbra_friends_accept_request(cId)
            }
            return try self.processResult(result)
        }

        Function("friendsRejectRequest") { (requestId: String) -> String in
            let result = requestId.withCString { cId in
                umbra_friends_reject_request(cId)
            }
            return try self.processResult(result)
        }

        Function("friendsList") { () -> String in
            let result = umbra_friends_list()
            return try self.processResult(result)
        }

        Function("friendsPendingRequests") { () -> String in
            let result = umbra_friends_pending_requests()
            return try self.processResult(result)
        }

        // ── Messaging ────────────────────────────────────────────────────────

        AsyncFunction("messagingSendText") { (recipientDid: String, text: String) -> String in
            let result = recipientDid.withCString { cDid in
                text.withCString { cText in
                    umbra_messaging_send_text(cDid, cText)
                }
            }
            return try self.processResult(result)
        }

        Function("messagingGetConversations") { () -> String in
            let result = umbra_messaging_get_conversations()
            return try self.processResult(result)
        }

        Function("messagingGetMessages") { (conversationId: String, limit: Int, beforeId: String?) -> String in
            let result: FfiResult
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
            return try self.processResult(result)
        }
    }
}
