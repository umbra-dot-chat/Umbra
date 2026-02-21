# Umbra Mobile Parity Audit

> Full gap analysis between the web/desktop (WASM/Tauri) and React Native (Expo FFI) backends.
> Generated 2026-02-20. Covers all 228 UmbraWasmModule methods.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Critical Blockers](#2-critical-blockers)
3. [Method-by-Method Status](#3-method-by-method-status)
4. [Domain-by-Domain Breakdown](#4-domain-by-domain-breakdown)
5. [Prioritized Fix Plan](#5-prioritized-fix-plan)
6. [File Reference](#6-file-reference)

---

## 1. Architecture Overview

### Call Path (React Native)

```
React Component
  → useUmbra() hook            (contexts/UmbraContext.tsx)
    → UmbraService              (packages/umbra-service/src/service.ts)
      → getWasm()               (packages/umbra-wasm/loader.ts)
        → UmbraWasmModule        (interface in loader.ts:39-352)
          → rn-backend.ts        (packages/umbra-wasm/rn-backend.ts)
            → NativeUmbraCore    (modules/expo-umbra-core/src/index.ts)
              → Swift Module     (modules/expo-umbra-core/ios/ExpoUmbraCoreModule.swift)
                → Rust C FFI    (packages/umbra-core/src/ffi/c_api.rs)
                  → dispatcher   (packages/umbra-core/src/ffi/dispatcher.rs)
```

### Two routing paths in rn-backend.ts

1. **Direct native calls** (15 methods): `native.identityCreate()`, `native.networkStart()`, etc.
   - Used for: init, identity, network start/stop/status, discovery
   - These call dedicated `extern "C"` functions in `c_api.rs`

2. **Generic dispatcher** (153 methods): `native.call(method, JSON.stringify(args))`
   - Routes to Swift `umbra_call` → Rust `dispatch()` in `dispatcher.rs`
   - Dispatcher matches method name → delegates to `dispatch_*.rs` modules

### Platform detection (loader.ts:468)

```
isTauri()         → Tauri IPC backend (desktop)
isReactNative()   → rn-backend.ts (mobile)
fallback          → WASM (web browser)
```

### State management (Rust FFI)

```
static RUNTIME: OnceCell<Runtime>               -- Tokio async runtime
static STATE: OnceCell<Arc<RwLock<FfiState>>>    -- Global singleton
```

`FfiState` fields (`state.rs:33-44`):
- `identity: Option<Identity>` — in-memory only, no auto-persistence
- `network: Option<Arc<NetworkService>>` — libp2p
- `discovery: Option<Arc<DiscoveryService>>`
- `friends: Option<Arc<FriendsService>>` — lazily created from identity+db
- `messaging: Option<Arc<MessagingService>>` — lazily created from identity+db
- `database: Option<Arc<Database>>` — **NEVER SET ON NATIVE**
- `community: Option<Arc<CommunityService>>`
- `file_service: Option<Arc<DmFileService>>`
- `event_callback: Option<EventCallback>`
- `storage_path: String`

---

## 2. Critical Blockers

### BLOCKER 1: Database Never Initialized on Native

**The single biggest issue.** Every feature beyond identity creation is broken by this.

| Layer | What happens | File:Line |
|-------|-------------|-----------|
| TypeScript | `umbra_wasm_init_database: async () => true` (no-op) | `rn-backend.ts:100` |
| Rust init | `umbra_init()` creates `FfiState::new(path)` with `database: None` | `c_api.rs:77-97` |
| Rust state | `database: Option<Arc<Database>>` is never set to `Some(...)` | `state.rs:39` |
| Every dispatcher | `state.database.as_ref().ok_or_else(...)` → error 400 | `dispatcher.rs:57`, `dispatcher.rs:64` |

**On WASM (working):** `umbra_wasm_init_database()` calls `Database::open(None)` → in-memory SQLite → `state.write().database = Some(db)` (`wasm.rs:136-147`)

**Native Database exists:** `Database::open(Some(path))` in `storage/database.rs:68` uses real SQLite (`rusqlite::Connection`). It supports file-based persistence. It's just never called.

**Impact:** Friends, messaging, communities, DM files, seats, audit logs, and every dispatcher method that touches the database returns error 400 "Database not initialized".

**Fix required:**
1. Add `umbra_init_database()` extern C function in `c_api.rs` that calls `Database::open(Some(&format!("{}/umbra.db", storage_path)))`
2. Expose through Swift module as `initDatabase()`
3. Add to `NativeUmbraCore` interface in `index.ts`
4. Replace no-op in `rn-backend.ts:100` with actual call to `native.initDatabase()`

---

### BLOCKER 2: Identity Does Not Persist Across App Restarts

**The second biggest issue.** Users lose their account every time the app restarts.

| Layer | What happens | File:Line |
|-------|-------------|-----------|
| AuthContext storage | `getStorageItem()` returns `null` when `Platform.OS !== 'web'` | `AuthContext.tsx:15-16` |
| localStorage | Only works on web; uses `window.localStorage` | `AuthContext.tsx:19-27` |
| Recovery phrase | Stored in `localStorage` on web → never stored on native | `AuthContext.tsx:96-102` |
| Identity JSON | Stored in `localStorage` on web → never stored on native | `AuthContext.tsx:76-85` |
| PIN | Stored in `localStorage` on web → never stored on native | `AuthContext.tsx:91-93` |

**On web (working):** AuthContext persists identity JSON + recovery phrase + PIN + remember-me flag to `localStorage`. On page refresh, UmbraContext reads recovery phrase from AuthContext and calls `restoreIdentity()` to re-derive keys from the BIP39 mnemonic.

**On native (broken):** `getStorageItem()` always returns `null`. On app restart, AuthContext has `identity: null` → UmbraContext never hydrates → Rust FfiState has `identity: None`. All operations fail with "No identity loaded".

**Fix required:**
1. Add `expo-secure-store` dependency
2. Create `utils/secureStorage.ts` with platform-aware `getStorageItem`/`setStorageItem`/`removeStorageItem`
3. Refactor `AuthContext.tsx` from synchronous localStorage to async platform-aware storage
4. Add `isHydrated` boolean to AuthContext so UmbraContext can wait for storage to load
5. Gate UmbraContext identity hydration on `isHydrated`

---

### BLOCKER 3: Event System Not Connected

**Prevents all real-time features on mobile.**

| Layer | What happens | File:Line |
|-------|-------------|-----------|
| rn-backend.ts | `subscribe_events` just logs, doesn't wire to native | `rn-backend.ts:219-221` |
| Swift module | Does NOT expose `umbra_register_event_callback` | `ExpoUmbraCoreModule.swift` (absent) |
| Rust events | `emit_event()` helper exists but is never called from handlers | `dispatcher.rs:68-71` |
| Rust events infra | `events.rs` has `OnceLock<EventCallback>` ready but unused | `events.rs` |

**On WASM (working):** Events flow through JavaScript callbacks registered via `subscribe_events`.

**On native (broken):** Three-layer disconnection: (a) Rust handlers don't emit events, (b) Swift doesn't register a callback, (c) TypeScript doesn't listen.

**Fix required:**
1. Swift: Register C callback via `umbra_register_event_callback` during module init, forward events as Expo EventEmitter events
2. TS: Wire `subscribe_events` in rn-backend.ts to Expo EventEmitter listener
3. Rust: Add `emit_event()` calls to key dispatch handlers (messaging, friends, community messages)

---

## 3. Method-by-Method Status

### Status Legend

| Status | Meaning | Count |
|--------|---------|-------|
| WORKING | Full TS→Swift→Rust→service chain connected, real implementation | 149 |
| STUB-501 | Rust dispatcher returns "Not yet implemented for native" | 53 |
| IMPLEMENTED-IN-STUBS | In `dispatch_stubs.rs` but has real logic (not a 501) | 3 |
| MISSING-404 | No match arm in `dispatcher.rs`; returns "Unknown method" | 18 |
| NO-OP | Returns hardcoded value or does nothing | 6 |
| TRIVIAL-EMPTY | Technically implemented but returns empty/useless result | 1 |
| **TOTAL** | | **228** unique UmbraWasmModule interface methods |

> Note: The 228 total is the count of unique `umbra_wasm_*` methods in the `UmbraWasmModule` interface (`loader.ts`). Some identity/network methods are accessible both via direct native call AND dispatcher; they are counted once.
> "WORKING" methods are those with complete Rust implementations — but 145 of them are **blocked by the database not being initialized** (Blocker 1).

---

### Complete Method Table

#### Initialization (3 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 1 | `umbra_wasm_init` | Direct: `native.initialize('')` | WORKING | Catches error 101 (already init) |
| 2 | `umbra_wasm_init_database` | Hardcoded: `async () => true` | **NO-OP** | **BLOCKER 1**: Never opens database |
| 3 | `umbra_wasm_version` | Direct: `native.version()` | WORKING | Falls back to hardcoded version |

#### Identity (6 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 4 | `umbra_wasm_identity_create` | Direct: `native.identityCreate()` | WORKING | Creates in-memory only |
| 5 | `umbra_wasm_identity_restore` | Direct: `native.identityRestore()` | WORKING | Restores from BIP39, in-memory only |
| 6 | `umbra_wasm_identity_set` | Hardcoded: `console.debug` no-op | NO-OP | Intentional — not needed on native |
| 7 | `umbra_wasm_identity_get_did` | Direct: `native.identityGetDid()` | WORKING | Reads from FfiState.identity |
| 8 | `umbra_wasm_identity_get_profile` | Direct: `native.identityGetProfile()` | WORKING | Returns JSON |
| 9 | `umbra_wasm_identity_update_profile` | Direct: `native.identityUpdateProfile()` | WORKING | Updates in-memory profile |

#### Discovery (2 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 10 | `umbra_wasm_discovery_get_connection_info` | Direct: `native.discoveryGetConnectionInfo()` | WORKING | |
| 11 | `umbra_wasm_discovery_parse_connection_info` | Hardcoded: returns input as-is | NO-OP | Passthrough, no processing |

#### Friends (11 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 12 | `umbra_wasm_friends_send_request` | Dispatcher: `friends_send_request` | WORKING | Blocked by DB |
| 13 | `umbra_wasm_friends_accept_request` | Dispatcher: `friends_accept_request` | WORKING | Blocked by DB |
| 14 | `umbra_wasm_friends_reject_request` | Dispatcher: `friends_reject_request` | WORKING | Blocked by DB |
| 15 | `umbra_wasm_friends_list` | Dispatcher: `friends_list` | WORKING | Blocked by DB |
| 16 | `umbra_wasm_friends_pending_requests` | Dispatcher: `friends_pending_requests` | WORKING | Blocked by DB |
| 17 | `umbra_wasm_friends_remove` | Dispatcher: `friends_remove` | WORKING | Blocked by DB |
| 18 | `umbra_wasm_friends_block` | Dispatcher: `friends_block` | WORKING | Blocked by DB |
| 19 | `umbra_wasm_friends_unblock` | Dispatcher: `friends_unblock` | WORKING | Blocked by DB |
| 20 | `umbra_wasm_friends_store_incoming` | Dispatcher: `friends_store_incoming` | WORKING | Blocked by DB |
| 21 | `umbra_wasm_friends_accept_from_relay` | Dispatcher: `friends_accept_from_relay` | WORKING | Blocked by DB |
| 22 | `umbra_wasm_friends_build_accept_ack` | Dispatcher: `friends_build_accept_ack` | WORKING | Blocked by DB |

#### Messaging — Core (9 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 23 | `umbra_wasm_messaging_get_conversations` | Dispatcher: `messaging_get_conversations` | WORKING | Blocked by DB |
| 24 | `umbra_wasm_messaging_create_dm_conversation` | Dispatcher: `messaging_create_dm_conversation` | WORKING | Blocked by DB |
| 25 | `umbra_wasm_messaging_get_messages` | Dispatcher: `messaging_get_messages` | WORKING | Blocked by DB |
| 26 | `umbra_wasm_messaging_send` | Dispatcher: `messaging_send` | WORKING | Full E2EE encrypt |
| 27 | `umbra_wasm_messaging_mark_read` | Dispatcher: `messaging_mark_read` | WORKING | Blocked by DB |
| 28 | `umbra_wasm_messaging_decrypt` | Dispatcher: `messaging_decrypt` | WORKING | Full E2EE decrypt |
| 29 | `umbra_wasm_messaging_store_incoming` | Dispatcher: `messaging_store_incoming` | WORKING | Blocked by DB |
| 30 | `umbra_wasm_messaging_build_typing_envelope` | Dispatcher: `messaging_build_typing_envelope` | WORKING | |
| 31 | `umbra_wasm_messaging_build_receipt_envelope` | Dispatcher: `messaging_build_receipt_envelope` | WORKING | |

#### Messaging — Extended (10 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 32 | `umbra_wasm_messaging_edit` | Dispatcher: `messaging_edit` | WORKING | Blocked by DB |
| 33 | `umbra_wasm_messaging_delete` | Dispatcher: `messaging_delete` | WORKING | Blocked by DB |
| 34 | `umbra_wasm_messaging_pin` | Dispatcher: `messaging_pin` | WORKING | Blocked by DB |
| 35 | `umbra_wasm_messaging_unpin` | Dispatcher: `messaging_unpin` | WORKING | Blocked by DB |
| 36 | `umbra_wasm_messaging_add_reaction` | Dispatcher: `messaging_add_reaction` | WORKING | Blocked by DB |
| 37 | `umbra_wasm_messaging_remove_reaction` | Dispatcher: `messaging_remove_reaction` | WORKING | Blocked by DB |
| 38 | `umbra_wasm_messaging_forward` | Dispatcher: `messaging_forward` | WORKING | Blocked by DB |
| 39 | `umbra_wasm_messaging_get_thread` | Dispatcher: `messaging_get_thread` | TRIVIAL-EMPTY | Always returns `[]` |
| 40 | `umbra_wasm_messaging_reply_thread` | Dispatcher: `messaging_reply_thread` | WORKING | Blocked by DB |
| 41 | `umbra_wasm_messaging_get_pinned` | Dispatcher: `messaging_get_pinned` | WORKING | Blocked by DB |

#### Messaging — Status (1 method)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 42 | `umbra_wasm_messaging_update_status` | Dispatcher: `messaging_update_status` | WORKING | Blocked by DB |

#### Groups — CRUD (8 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 43 | `umbra_wasm_groups_create` | Dispatcher: `groups_create` | **STUB-501** | Entire groups subsystem missing |
| 44 | `umbra_wasm_groups_get` | Dispatcher: `groups_get` | **STUB-501** | |
| 45 | `umbra_wasm_groups_list` | Dispatcher: `groups_list` | **STUB-501** | |
| 46 | `umbra_wasm_groups_update` | Dispatcher: `groups_update` | **STUB-501** | |
| 47 | `umbra_wasm_groups_delete` | Dispatcher: `groups_delete` | **STUB-501** | |
| 48 | `umbra_wasm_groups_add_member` | Dispatcher: `groups_add_member` | **STUB-501** | |
| 49 | `umbra_wasm_groups_remove_member` | Dispatcher: `groups_remove_member` | **STUB-501** | |
| 50 | `umbra_wasm_groups_get_members` | Dispatcher: `groups_get_members` | **STUB-501** | |

#### Groups — Encryption (6 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 51 | `umbra_wasm_groups_generate_key` | Dispatcher: `groups_generate_key` | **STUB-501** | |
| 52 | `umbra_wasm_groups_rotate_key` | Dispatcher: `groups_rotate_key` | **STUB-501** | |
| 53 | `umbra_wasm_groups_import_key` | Dispatcher: `groups_import_key` | **STUB-501** | |
| 54 | `umbra_wasm_groups_encrypt_message` | Dispatcher: `groups_encrypt_message` | **STUB-501** | |
| 55 | `umbra_wasm_groups_decrypt_message` | Dispatcher: `groups_decrypt_message` | **STUB-501** | |
| 56 | `umbra_wasm_groups_encrypt_key_for_member` | Dispatcher: `groups_encrypt_key_for_member` | **STUB-501** | |

#### Groups — Invitations (4 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 57 | `umbra_wasm_groups_store_invite` | Dispatcher: `groups_store_invite` | **STUB-501** | |
| 58 | `umbra_wasm_groups_get_pending_invites` | Dispatcher: `groups_get_pending_invites` | **STUB-501** | |
| 59 | `umbra_wasm_groups_accept_invite` | Dispatcher: `groups_accept_invite` | **STUB-501** | |
| 60 | `umbra_wasm_groups_decline_invite` | Dispatcher: `groups_decline_invite` | **STUB-501** | |

#### Network (7 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 61 | `umbra_wasm_network_status` | Direct: `native.networkStatus()` | WORKING | Falls back to `{connected:false}` |
| 62 | `umbra_wasm_network_start` | Direct: `native.networkStart()` | WORKING | Async |
| 63 | `umbra_wasm_network_stop` | Direct: `native.networkStop()` | WORKING | Async |
| 64 | `umbra_wasm_network_create_offer` | Dispatcher: `network_create_offer` | **MISSING-404** | WebRTC, N/A on native |
| 65 | `umbra_wasm_network_accept_offer` | Dispatcher: `network_accept_offer` | **MISSING-404** | WebRTC, N/A on native |
| 66 | `umbra_wasm_network_complete_handshake` | Dispatcher: `network_complete_handshake` | **MISSING-404** | WebRTC, N/A on native |
| 67 | `umbra_wasm_network_complete_answerer` | Dispatcher: `network_complete_answerer` | **MISSING-404** | WebRTC, N/A on native |

#### Relay (6 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 68 | `umbra_wasm_relay_connect` | Dispatcher: `relay_connect` | **STUB-501** | |
| 69 | `umbra_wasm_relay_disconnect` | Hardcoded: `async () => {}` | NO-OP | Empty no-op |
| 70 | `umbra_wasm_relay_create_session` | Dispatcher: `relay_create_session` | **STUB-501** | |
| 71 | `umbra_wasm_relay_accept_session` | Dispatcher: `relay_accept_session` | **STUB-501** | |
| 72 | `umbra_wasm_relay_send` | Dispatcher: `relay_send` | **STUB-501** | |
| 73 | `umbra_wasm_relay_fetch_offline` | Hardcoded: `{type:'fetch_offline'}` | NO-OP | Stub response |

#### Events (1 method)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 74 | `umbra_wasm_subscribe_events` | Hardcoded: `console.log` | **NO-OP** | **BLOCKER 3** |

#### Calls (4 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 75 | `umbra_wasm_calls_store` | Dispatcher: `calls_store` | **STUB-501** | |
| 76 | `umbra_wasm_calls_end` | Dispatcher: `calls_end` | **STUB-501** | |
| 77 | `umbra_wasm_calls_get_history` | Dispatcher: `calls_get_history` | **STUB-501** | |
| 78 | `umbra_wasm_calls_get_all_history` | Dispatcher: `calls_get_all_history` | **STUB-501** | |

#### Crypto (4 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 79 | `umbra_wasm_crypto_sign` | Dispatcher: `crypto_sign` | IMPLEMENTED-IN-STUBS | Real Ed25519 signing |
| 80 | `umbra_wasm_crypto_verify` | Dispatcher: `crypto_verify` | IMPLEMENTED-IN-STUBS | Real Ed25519 verify |
| 81 | `umbra_wasm_crypto_encrypt_for_peer` | Dispatcher: `crypto_encrypt_for_peer` | **STUB-501** | |
| 82 | `umbra_wasm_crypto_decrypt_from_peer` | Dispatcher: `crypto_decrypt_from_peer` | **STUB-501** | |

#### File Encryption (9 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 83 | `umbra_wasm_file_derive_key` | Dispatcher: `file_derive_key` | **STUB-501** | |
| 84 | `umbra_wasm_file_encrypt_chunk` | Dispatcher: `file_encrypt_chunk` | **STUB-501** | |
| 85 | `umbra_wasm_file_decrypt_chunk` | Dispatcher: `file_decrypt_chunk` | **STUB-501** | |
| 86 | `umbra_wasm_channel_file_derive_key` | Dispatcher: `channel_file_derive_key` | **STUB-501** | |
| 87 | `umbra_wasm_compute_key_fingerprint` | Dispatcher: `compute_key_fingerprint` | **STUB-501** | |
| 88 | `umbra_wasm_verify_key_fingerprint` | Dispatcher: `verify_key_fingerprint` | **STUB-501** | |
| 89 | `umbra_wasm_mark_files_for_reencryption` | Dispatcher: `mark_files_for_reencryption` | **MISSING-404** | Not in dispatcher |
| 90 | `umbra_wasm_get_files_needing_reencryption` | Dispatcher: `get_files_needing_reencryption` | **MISSING-404** | Not in dispatcher |
| 91 | `umbra_wasm_clear_reencryption_flag` | Dispatcher: `clear_reencryption_flag` | **MISSING-404** | Not in dispatcher |

#### Community — Core (7 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 92 | `umbra_wasm_community_create` | Dispatcher: `community_create` | WORKING | Blocked by DB |
| 93 | `umbra_wasm_community_get` | Dispatcher: `community_get` | WORKING | Blocked by DB |
| 94 | `umbra_wasm_community_get_mine` | Dispatcher: `community_get_mine` | WORKING | Blocked by DB |
| 95 | `umbra_wasm_community_update` | Dispatcher: `community_update` | WORKING | Blocked by DB |
| 96 | `umbra_wasm_community_delete` | Dispatcher: `community_delete` | WORKING | Blocked by DB |
| 97 | `umbra_wasm_community_transfer_ownership` | Dispatcher: `community_transfer_ownership` | WORKING | Blocked by DB |
| 98 | `umbra_wasm_community_update_branding` | Dispatcher: `community_update_branding` | WORKING | Blocked by DB |

#### Community — Spaces (5 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 99 | `umbra_wasm_community_space_create` | Dispatcher | WORKING | Blocked by DB |
| 100 | `umbra_wasm_community_space_list` | Dispatcher | WORKING | Blocked by DB |
| 101 | `umbra_wasm_community_space_update` | Dispatcher | WORKING | Blocked by DB |
| 102 | `umbra_wasm_community_space_reorder` | Dispatcher | WORKING | Blocked by DB |
| 103 | `umbra_wasm_community_space_delete` | Dispatcher | WORKING | Blocked by DB |

#### Community — Categories (7 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 104-110 | `community_category_*` + `community_channel_move_category` | Dispatcher | WORKING | All 7 blocked by DB |

#### Community — Channels (9 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 111-119 | `community_channel_*` | Dispatcher | WORKING | All 9 blocked by DB |

#### Community — Members (9 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 120-128 | `community_join`, `community_leave`, `community_kick`, `community_ban`, `community_unban`, `community_member_list`, `community_member_get`, `community_member_update_profile`, `community_ban_list` | Dispatcher | WORKING | All 9 blocked by DB |

#### Community — Roles (8 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 129-136 | `community_role_*`, `community_member_roles`, `community_custom_role_create` | Dispatcher | WORKING | All 8 blocked by DB |

#### Community — Invites (5 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 137-141 | `community_invite_*` | Dispatcher | WORKING | All 5 blocked by DB |

#### Community — Messages (6 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 142-147 | `community_message_*` | Dispatcher | WORKING | All 6 blocked by DB |

#### Community — Reactions (3 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 148-150 | `community_reaction_*` | Dispatcher | WORKING | All 3 blocked by DB |

#### Community — Emoji (4 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 151-154 | `community_emoji_*` | Dispatcher | WORKING | All 4 blocked by DB |

#### Community — Stickers (3 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 155-157 | `community_sticker_*` | Dispatcher | WORKING | All 3 blocked by DB |

#### Community — Sticker Packs (4 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 158-161 | `community_sticker_pack_*` | Dispatcher | WORKING | All 4 blocked by DB |

#### Community — Pins (3 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 162-164 | `community_pin_message`, `community_unpin_message`, `community_pin_list` | Dispatcher | WORKING | All 3 blocked by DB |

#### Community — Threads (4 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 165-168 | `community_thread_*` | Dispatcher | WORKING | All 4 blocked by DB |

#### Community — Read Receipts (1 method)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 169 | `umbra_wasm_community_mark_read` | Dispatcher | WORKING | Blocked by DB |

#### Community — Files (8 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 170-177 | `community_upload_file`, `community_get_files`, `community_get_file`, `community_delete_file`, `community_record_file_download`, `community_create_folder`, `community_get_folders`, `community_delete_folder` | Dispatcher | WORKING | All 8 blocked by DB |

#### DM — Files (10 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 178-187 | `dm_upload_file`, `dm_get_files`, `dm_get_file`, `dm_delete_file`, `dm_record_file_download`, `dm_move_file`, `dm_create_folder`, `dm_get_folders`, `dm_delete_folder`, `dm_rename_folder` | Dispatcher | WORKING | All 10 blocked by DB |

#### Groups — Relay (5 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 188 | `umbra_wasm_groups_send_invite` | Dispatcher: `groups_send_invite` | **STUB-501** | |
| 189 | `umbra_wasm_groups_build_invite_accept_envelope` | Dispatcher | **STUB-501** | |
| 190 | `umbra_wasm_groups_build_invite_decline_envelope` | Dispatcher | **STUB-501** | |
| 191 | `umbra_wasm_groups_send_message` | Dispatcher: `groups_send_message` | **STUB-501** | |
| 192 | `umbra_wasm_groups_remove_member_with_rotation` | Dispatcher | **STUB-501** | |

#### Relay Envelope Builders (3 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 193 | `umbra_wasm_community_build_event_relay_batch` | Dispatcher | **STUB-501** | |
| 194 | `umbra_wasm_build_dm_file_event_envelope` | Dispatcher | **STUB-501** | |
| 195 | `umbra_wasm_build_metadata_envelope` | Dispatcher | **STUB-501** | |

#### File Chunking (3 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 196 | `umbra_wasm_chunk_file` | Dispatcher: `chunk_file` | **STUB-501** | |
| 197 | `umbra_wasm_reassemble_file` | Dispatcher: `reassemble_file` | **STUB-501** | |
| 198 | `umbra_wasm_get_file_manifest` | Dispatcher: `get_file_manifest` | **STUB-501** | |

#### File Transfer Control (11 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 199 | `umbra_wasm_transfer_initiate` | Dispatcher: `transfer_initiate` | **MISSING-404** | |
| 200 | `umbra_wasm_transfer_accept` | Dispatcher: `transfer_accept` | **MISSING-404** | |
| 201 | `umbra_wasm_transfer_pause` | Dispatcher: `transfer_pause` | **MISSING-404** | |
| 202 | `umbra_wasm_transfer_resume` | Dispatcher: `transfer_resume` | **MISSING-404** | |
| 203 | `umbra_wasm_transfer_cancel` | Dispatcher: `transfer_cancel` | **MISSING-404** | |
| 204 | `umbra_wasm_transfer_on_message` | Dispatcher: `transfer_on_message` | **MISSING-404** | |
| 205 | `umbra_wasm_transfer_list` | Dispatcher: `transfer_list` | **MISSING-404** | Error swallowed, returns `[]` |
| 206 | `umbra_wasm_transfer_get` | Dispatcher: `transfer_get` | **MISSING-404** | |
| 207 | `umbra_wasm_transfer_get_incomplete` | Dispatcher: `transfer_get_incomplete` | **MISSING-404** | Error swallowed, returns `[]` |
| 208 | `umbra_wasm_transfer_chunks_to_send` | Dispatcher: `transfer_chunks_to_send` | **MISSING-404** | |
| 209 | `umbra_wasm_transfer_mark_chunk_sent` | Dispatcher: `transfer_mark_chunk_sent` | **MISSING-404** | |

#### DHT (3 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 210 | `umbra_wasm_dht_start_providing` | Dispatcher: `dht_start_providing` | **STUB-501** | |
| 211 | `umbra_wasm_dht_get_providers` | Dispatcher: `dht_get_providers` | **STUB-501** | |
| 212 | `umbra_wasm_dht_stop_providing` | Dispatcher: `dht_stop_providing` | **STUB-501** | |

#### Plugin Storage (8 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 213 | `umbra_wasm_plugin_kv_get` | Dispatcher: `plugin_kv_get` | **STUB-501** | |
| 214 | `umbra_wasm_plugin_kv_set` | Dispatcher: `plugin_kv_set` | **STUB-501** | |
| 215 | `umbra_wasm_plugin_kv_delete` | Dispatcher: `plugin_kv_delete` | **STUB-501** | |
| 216 | `umbra_wasm_plugin_kv_list` | Dispatcher: `plugin_kv_list` | **STUB-501** | |
| 217 | `umbra_wasm_plugin_bundle_save` | Dispatcher: `plugin_bundle_save` | **STUB-501** | |
| 218 | `umbra_wasm_plugin_bundle_load` | Dispatcher: `plugin_bundle_load` | **STUB-501** | |
| 219 | `umbra_wasm_plugin_bundle_delete` | Dispatcher: `plugin_bundle_delete` | **STUB-501** | |
| 220 | `umbra_wasm_plugin_bundle_list` | Dispatcher: `plugin_bundle_list` | **STUB-501** | |

#### Community — Seats (7 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 221-227 | `community_seat_*` | Dispatcher | WORKING | All 7 blocked by DB |

#### Community — Audit Log (2 methods)

| # | Method | Route | Status | Notes |
|---|--------|-------|--------|-------|
| 228 | `umbra_wasm_community_audit_log_create_batch` | Dispatcher | WORKING | Blocked by DB |
| 229 | `umbra_wasm_community_audit_log_list` | Dispatcher | WORKING | Blocked by DB |

---

## 4. Domain-by-Domain Breakdown

### Summary Table

| Domain | Total | Working | Blocked by DB | Stub-501 | Missing-404 | No-op |
|--------|-------|---------|--------------|----------|-------------|-------|
| Init/Lifecycle | 3 | 2 | 0 | 0 | 0 | 1 |
| Identity | 6 | 4 | 0 | 0 | 0 | 1+1* |
| Discovery | 2 | 1 | 0 | 0 | 0 | 1 |
| Friends | 11 | 0 | **11** | 0 | 0 | 0 |
| Messaging (all) | 21 | 0 | **20** | 0 | 0 | 0+1** |
| Groups (all) | 23 | 0 | 0 | **23** | 0 | 0 |
| Network | 7 | 3 | 0 | 0 | **4** | 0 |
| Relay | 6 | 0 | 0 | **4** | 0 | 2 |
| Events | 1 | 0 | 0 | 0 | 0 | **1** |
| Calls | 4 | 0 | 0 | **4** | 0 | 0 |
| Crypto | 4 | 2 | 0 | **2** | 0 | 0 |
| File Encryption | 9 | 0 | 0 | **6** | **3** | 0 |
| Community (all) | 95 | 0 | **95** | 0 | 0 | 0 |
| DM Files | 10 | 0 | **10** | 0 | 0 | 0 |
| File Chunking | 3 | 0 | 0 | **3** | 0 | 0 |
| File Transfer | 11 | 0 | 0 | 0 | **11** | 0 |
| DHT | 3 | 0 | 0 | **3** | 0 | 0 |
| Plugin Storage | 8 | 0 | 0 | **8** | 0 | 0 |
| Relay Builders | 3 | 0 | 0 | **3** | 0 | 0 |
| Seats | 7 | 0 | **7** | 0 | 0 | 0 |
| Audit Log | 2 | 0 | **2** | 0 | 0 | 0 |
| Groups Relay | 5 | 0 | 0 | **5** | 0 | 0 |
| **TOTAL** | **228** | **12** | **145** | **53+8*** | **18** | **6** |

> \* 53 pure 501 stubs + 8 "implemented in stubs" (network_status, crypto_sign, crypto_verify have real logic; 5 groups relay methods are counted in groups 501s)
> Identity `identity_set` is intentionally no-op on native
> `messaging_get_thread` returns `[]` always (trivial empty, not a 501)
> Many methods counted under both "working" and "blocked by DB" since the Rust implementation IS complete but can't execute without the database.

### Key insight

**145 of 228 methods have complete Rust implementations** but are blocked solely by the database not being initialized. Fixing Blocker 1 alone would unlock ~63% of the full interface and ~100% of the features users actually interact with (friends, messaging, communities).

---

## 5. Prioritized Fix Plan

### Phase 1: Critical Blockers (unblocks 86% of features)

#### 1A. Database Initialization

**Effort: Small (1 new C FFI function + wiring)**

Add `umbra_init_database()` to Rust FFI:
```
c_api.rs: New extern "C" fn umbra_init_database()
  → Gets storage_path from FfiState
  → Calls Database::open(Some(&format!("{}/umbra.db", storage_path)))
  → Stores Arc<Database> in state.database
```

Wire through the stack:
```
UmbraCore.h:         Add declaration
Swift module:        Add Function("initDatabase")
index.ts:            Add initDatabase() to NativeUmbraCore
rn-backend.ts:100:   Replace `async () => true` with `native.initDatabase()` call
```

#### 1B. Identity Persistence

**Effort: Medium (new storage util + AuthContext refactor)**

1. Add `expo-secure-store` dependency
2. Create `utils/secureStorage.ts` — platform-aware async storage (SecureStore on native, localStorage on web)
3. Refactor `AuthContext.tsx`:
   - Change `getStorageItem`/`setStorageItem`/`removeStorageItem` to use async `secureStorage` module
   - Add `useEffect` for async hydration on mount (replaces synchronous `useState` initializers)
   - Add `isHydrated: boolean` to context value
4. Update `UmbraContext.tsx`:
   - Gate identity hydration on `isHydrated` from AuthContext

#### 1C. Init Sequencing

**Effort: Tiny (verify, no code changes expected)**

Verify that `doInitReactNative()` in `loader.ts` calls `umbra_wasm_init()` then `await umbra_wasm_init_database()` in sequence before the UmbraProvider's hydration effect runs.

---

### Phase 2: Events + Missing Methods

#### 2A. Wire Event System

**Effort: Medium**

1. Swift: Register C callback during module `OnCreate`, forward as Expo EventEmitter events
2. TS (`index.ts`): Add `addUmbraCoreEventListener()` using Expo EventEmitter
3. rn-backend.ts: Wire `subscribe_events` to Expo event listener
4. Rust: Add `emit_event()` calls to key handlers:
   - `dispatch_messaging.rs`: `messaging_store_incoming` → emit `message_received`
   - `dispatch_friends.rs`: `friends_store_incoming` → emit `friend_request_received`
   - `dispatch_community_msg.rs`: `community_message_store_received` → emit `community_message`

#### 2B. Add 18 Missing Dispatcher Methods

**Effort: Small (stubs only, prevents 404 errors)**

Add match arms in `dispatcher.rs:457` (before the `_` wildcard) and stub functions in `dispatch_stubs.rs`:

**WebRTC (4):** `network_create_offer`, `network_accept_offer`, `network_complete_handshake`, `network_complete_answerer` — return 501 "WebRTC not available on native"

**File Transfer (11):** `transfer_initiate`, `transfer_accept`, `transfer_pause`, `transfer_resume`, `transfer_cancel`, `transfer_on_message`, `transfer_list`, `transfer_get`, `transfer_get_incomplete`, `transfer_chunks_to_send`, `transfer_mark_chunk_sent`

**Reencryption (3):** `mark_files_for_reencryption`, `get_files_needing_reencryption`, `clear_reencryption_flag`

---

### Phase 3: Stub Implementations (incremental, prioritized)

| Priority | Domain | Methods | What's Needed | Blocks |
|----------|--------|---------|---------------|--------|
| P0 | Crypto peer encrypt/decrypt | 2 | Wrap `crate::crypto` for X25519+AES-GCM | E2EE DM file sharing |
| P1 | Relay | 4 | Wire `RelayClient` into FfiState, add relay_client field | Message delivery when not directly connected |
| P2 | File encryption | 6 | Wrap `crate::crypto::file_encryption` | Encrypted file sharing |
| P3 | File chunking | 3 | Wrap `crate::storage::chunking` | Large file transfers |
| P4 | File transfer | 11 | Add transfer DB tables + CRUD | P2P file transfer control |
| P5 | Calls | 4 | Add calls DB table + CRUD | Call history |
| P6 | Relay envelope builders | 3 | Build signed relay envelopes | Relay transport protocol |
| P7 | Plugin KV storage | 8 | Add plugin_kv DB table + CRUD | Plugin system |
| P8 | DHT | 3 | Wire into libp2p DHT via NetworkService | Content addressing |
| P9 | Groups | 23 | Extract GroupService from wasm.rs, add group key state | Group messaging (largest effort) |

### Phase 4: Platform & UX (not blocking core functionality)

| Item | Description |
|------|-------------|
| Android parity | Add JNI bindings matching Swift module |
| Background lifecycle | Handle app background/foreground for network reconnection |
| Push notifications | Relay server + APNs/FCM for offline messages |
| Biometric auth | Optional Rust Keychain integration for PIN/biometric |

---

## 6. File Reference

### Files that need changes (by phase)

#### Phase 1A — Database Init
| File | Change |
|------|--------|
| `packages/umbra-core/src/ffi/c_api.rs` | Add `umbra_init_database()` extern C function |
| `modules/expo-umbra-core/ios/UmbraCore.h` | Add `umbra_init_database` declaration |
| `modules/expo-umbra-core/ios/ExpoUmbraCoreModule.swift` | Add `Function("initDatabase")` |
| `modules/expo-umbra-core/src/index.ts` | Add `initDatabase(): string` to NativeUmbraCore |
| `packages/umbra-wasm/rn-backend.ts:100` | Replace no-op with `native.initDatabase()` |
| `modules/expo-umbra-core/android/.../ExpoUmbraCoreModule.kt` | Add Android equivalent |

#### Phase 1B — Identity Persistence
| File | Change |
|------|--------|
| `package.json` | Add `expo-secure-store` dependency |
| `utils/secureStorage.ts` (new) | Platform-aware async storage abstraction |
| `contexts/AuthContext.tsx` | Async refactor, add `isHydrated` |
| `contexts/UmbraContext.tsx` | Gate hydration on `isHydrated` |

#### Phase 2A — Event System
| File | Change |
|------|--------|
| `modules/expo-umbra-core/ios/ExpoUmbraCoreModule.swift` | Register event callback, add EventEmitter |
| `modules/expo-umbra-core/src/index.ts` | Add `addUmbraCoreEventListener()` |
| `packages/umbra-wasm/rn-backend.ts:219` | Wire subscribe_events to Expo events |
| `packages/umbra-core/src/ffi/dispatch_messaging.rs` | Add emit_event calls |
| `packages/umbra-core/src/ffi/dispatch_friends.rs` | Add emit_event calls |
| `packages/umbra-core/src/ffi/dispatch_community_msg.rs` | Add emit_event calls |

#### Phase 2B — Missing Dispatcher Methods
| File | Change |
|------|--------|
| `packages/umbra-core/src/ffi/dispatcher.rs:457` | Add 18 match arms before `_` wildcard |
| `packages/umbra-core/src/ffi/dispatch_stubs.rs` | Add 18 stub functions |

#### Phase 3 — Stub Implementations (reference files)
| File | Purpose |
|------|---------|
| `packages/umbra-core/src/ffi/wasm.rs` | Reference implementation for all stubs (~10k lines) |
| `packages/umbra-core/src/ffi/dispatch_stubs.rs` | Current stubs to replace with real implementations |
| `packages/umbra-core/src/ffi/state.rs` | Add new service fields (relay_client, etc.) |
| `packages/umbra-core/src/storage/database.rs` | May need new tables for calls, plugin_kv, transfers |
