// UmbraCore.h — C header for Rust FFI types and functions.
// This header is imported by Swift via the module map so that struct layouts
// and calling conventions match exactly between Rust (#[repr(C)]) and Swift.

#ifndef UMBRA_CORE_H
#define UMBRA_CORE_H

#include <stdint.h>

// ── FFI Result ──────────────────────────────────────────────────────────────

/// Matches Rust's `#[repr(C)] pub struct FfiResult` in ffi/types.rs
typedef struct {
    int32_t success;          // 1 = ok, 0 = error
    int32_t error_code;       // 0 when success
    char   *error_message;    // NULL when success — caller must free via umbra_free_string
    char   *data;             // NULL when error  — caller must free via umbra_free_string
} UmbraCoreResult;

// ── Lifecycle ───────────────────────────────────────────────────────────────

UmbraCoreResult umbra_init(const char *storage_path);
UmbraCoreResult umbra_init_database(void);
UmbraCoreResult umbra_shutdown(void);
char           *umbra_version(void);

// ── Identity ────────────────────────────────────────────────────────────────

UmbraCoreResult umbra_identity_create(const char *display_name);
UmbraCoreResult umbra_identity_restore(const char *recovery_phrase, const char *display_name);
UmbraCoreResult umbra_identity_get_did(void);
UmbraCoreResult umbra_identity_get_profile(void);
UmbraCoreResult umbra_identity_update_profile(const char *json);

// ── Network ─────────────────────────────────────────────────────────────────

UmbraCoreResult umbra_network_start(const char *config_json);
UmbraCoreResult umbra_network_stop(void);
UmbraCoreResult umbra_network_status(void);
UmbraCoreResult umbra_network_connect(const char *addr);

// ── Discovery ───────────────────────────────────────────────────────────────

UmbraCoreResult umbra_discovery_get_connection_info(void);
UmbraCoreResult umbra_discovery_connect_with_info(const char *info);
UmbraCoreResult umbra_discovery_lookup_peer(const char *did);

// ── Friends ─────────────────────────────────────────────────────────────────

UmbraCoreResult umbra_friends_send_request(const char *did, const char *message);
UmbraCoreResult umbra_friends_accept_request(const char *request_id);
UmbraCoreResult umbra_friends_reject_request(const char *request_id);
UmbraCoreResult umbra_friends_list(void);
UmbraCoreResult umbra_friends_pending_requests(void);

// ── Messaging ───────────────────────────────────────────────────────────────

UmbraCoreResult umbra_messaging_send_text(const char *recipient_did, const char *text);
UmbraCoreResult umbra_messaging_get_conversations(void);
UmbraCoreResult umbra_messaging_get_messages(const char *conversation_id, int32_t limit, const char *before_id);

// ── Generic Dispatcher ──────────────────────────────────────────────────────

UmbraCoreResult umbra_call(const char *method, const char *args);

// ── Event Callback ──────────────────────────────────────────────────────────

typedef void (*UmbraEventCallback)(const char *event_type, const char *data);
void umbra_register_event_callback(UmbraEventCallback cb);

// ── Memory Management ───────────────────────────────────────────────────────

void umbra_free_string(char *ptr);
void umbra_free_result(UmbraCoreResult result);

#endif /* UMBRA_CORE_H */
