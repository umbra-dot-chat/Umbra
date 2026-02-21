package expo.modules.umbracore

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Expo native module wrapping the Umbra Core Rust library for Android.
 *
 * Calls into libumbra_core.so via JNI. The JNI functions are defined in
 * umbra-core/src/ffi/jni.rs and follow the naming convention:
 *   Java_expo_modules_umbracore_ExpoUmbraCoreModule_native<Method>
 *
 * Note: The JNI function names must match the package + class name exactly.
 * If the Rust JNI layer uses a different class path (e.g., com.umbra.core.UmbraCore),
 * we use a thin Kotlin JNI bridge that delegates to the Rust functions.
 */
class ExpoUmbraCoreModule : Module() {

    companion object {
        private var libraryLoaded = false

        fun loadNativeLibrary() {
            if (!libraryLoaded) {
                try {
                    System.loadLibrary("umbra_core")
                    libraryLoaded = true
                } catch (e: UnsatisfiedLinkError) {
                    android.util.Log.e(
                        "ExpoUmbraCore",
                        "Failed to load libumbra_core.so: ${e.message}. " +
                        "Run scripts/build-mobile.sh to compile the Rust library."
                    )
                }
            }
        }
    }

    // ── JNI declarations ─────────────────────────────────────────────────────
    // These map to the Rust `#[no_mangle] extern "C"` functions.
    // We use @JvmStatic external functions that call through to the C FFI.

    private external fun nativeInit(storagePath: String): String
    private external fun nativeShutdown(): String
    private external fun nativeVersion(): String

    private external fun nativeIdentityCreate(displayName: String): String
    private external fun nativeIdentityRestore(recoveryPhrase: String, displayName: String): String
    private external fun nativeIdentityGetDid(): String
    private external fun nativeIdentityGetProfile(): String
    private external fun nativeIdentityUpdateProfile(json: String): String

    private external fun nativeNetworkStart(configJson: String?): String
    private external fun nativeNetworkStop(): String
    private external fun nativeNetworkStatus(): String
    private external fun nativeNetworkConnect(addr: String): String

    private external fun nativeDiscoveryGetConnectionInfo(): String
    private external fun nativeDiscoveryConnectWithInfo(info: String): String
    private external fun nativeDiscoveryLookupPeer(did: String): String

    private external fun nativeFriendsSendRequest(did: String, message: String?): String
    private external fun nativeFriendsAcceptRequest(requestId: String): String
    private external fun nativeFriendsRejectRequest(requestId: String): String
    private external fun nativeFriendsList(): String
    private external fun nativeFriendsPendingRequests(): String

    private external fun nativeMessagingSendText(recipientDid: String, text: String): String
    private external fun nativeMessagingGetConversations(): String
    private external fun nativeMessagingGetMessages(conversationId: String, limit: Int, beforeId: String?): String

    // ── Generic Dispatcher ──────────────────────────────────────────────────
    private external fun nativeCall(method: String, args: String): String

    // ── Helpers ──────────────────────────────────────────────────────────────

    private val context: Context
        get() = appContext.reactContext ?: throw IllegalStateException("React context not available")

    private fun getStoragePath(): String {
        val dir = context.filesDir.resolve("umbra_data")
        if (!dir.exists()) dir.mkdirs()
        return dir.absolutePath
    }

    // ── Module Definition ────────────────────────────────────────────────────

    override fun definition() = ModuleDefinition {
        Name("ExpoUmbraCore")

        OnCreate {
            loadNativeLibrary()
        }

        // ── Lifecycle ────────────────────────────────────────────────────────

        Function("initialize") { storagePath: String ->
            val path = if (storagePath.isEmpty()) getStoragePath() else storagePath
            nativeInit(path)
        }

        Function("shutdown") {
            nativeShutdown()
        }

        Function("version") {
            nativeVersion()
        }

        // ── Identity ─────────────────────────────────────────────────────────

        Function("identityCreate") { displayName: String ->
            nativeIdentityCreate(displayName)
        }

        Function("identityRestore") { recoveryPhrase: String, displayName: String ->
            nativeIdentityRestore(recoveryPhrase, displayName)
        }

        Function("identityGetDid") {
            nativeIdentityGetDid()
        }

        Function("identityGetProfile") {
            nativeIdentityGetProfile()
        }

        Function("identityUpdateProfile") { json: String ->
            nativeIdentityUpdateProfile(json)
        }

        // ── Network ──────────────────────────────────────────────────────────

        AsyncFunction("networkStart") { configJson: String? ->
            nativeNetworkStart(configJson)
        }

        AsyncFunction("networkStop") {
            nativeNetworkStop()
        }

        Function("networkStatus") {
            nativeNetworkStatus()
        }

        AsyncFunction("networkConnect") { addr: String ->
            nativeNetworkConnect(addr)
        }

        // ── Discovery ────────────────────────────────────────────────────────

        Function("discoveryGetConnectionInfo") {
            nativeDiscoveryGetConnectionInfo()
        }

        AsyncFunction("discoveryConnectWithInfo") { info: String ->
            nativeDiscoveryConnectWithInfo(info)
        }

        AsyncFunction("discoveryLookupPeer") { did: String ->
            nativeDiscoveryLookupPeer(did)
        }

        // ── Friends ──────────────────────────────────────────────────────────

        Function("friendsSendRequest") { did: String, message: String? ->
            nativeFriendsSendRequest(did, message)
        }

        Function("friendsAcceptRequest") { requestId: String ->
            nativeFriendsAcceptRequest(requestId)
        }

        Function("friendsRejectRequest") { requestId: String ->
            nativeFriendsRejectRequest(requestId)
        }

        Function("friendsList") {
            nativeFriendsList()
        }

        Function("friendsPendingRequests") {
            nativeFriendsPendingRequests()
        }

        // ── Messaging ────────────────────────────────────────────────────────

        AsyncFunction("messagingSendText") { recipientDid: String, text: String ->
            nativeMessagingSendText(recipientDid, text)
        }

        Function("messagingGetConversations") {
            nativeMessagingGetConversations()
        }

        Function("messagingGetMessages") { conversationId: String, limit: Int, beforeId: String? ->
            nativeMessagingGetMessages(conversationId, limit, beforeId)
        }

        // ── Generic Dispatcher ───────────────────────────────────────────

        AsyncFunction("call") { method: String, args: String ->
            nativeCall(method, args)
        }
    }
}
