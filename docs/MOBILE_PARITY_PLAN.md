# Umbra Mobile Parity Plan

> Task-level implementation guide for achieving iOS mobile parity with the web/desktop app.
> Companion to `docs/MOBILE_PARITY_AUDIT.md` (full gap analysis).

---

## Context

The React Native (Expo) app is broken beyond the signup flow.

**Root causes:**
1. SQLite database never initialized on native → 145 methods return error 400
2. Identity/recovery phrase never persisted on native → account lost on every restart
3. Event system disconnected at 3 layers → no real-time updates
4. 18 methods missing from dispatcher → 404 errors
5. 53 methods return 501 stubs

**Design decisions:**
- **Identity persistence:** Use existing Rust `SecureStore` (iOS Keychain) exposed via dispatcher route
- **WebRTC methods:** Return 501 stub ("not applicable on native — direct P2P used")
- **Android:** Skipped for this plan (rebuild from scratch in a future effort)
- **Events:** Full coverage from the start (all domains)
- **SecureStore FFI:** Dispatcher route (`native.call()`) — no new Swift functions needed

---

## PHASE 1: Critical Blockers (iOS)

> Unblocks ~86% of features (friends, messaging, communities, files, seats, audit logs).

### Task 1.1 — Database initialization on native FFI

- [ ] **`packages/umbra-core/src/ffi/c_api.rs`** — Add `umbra_init_database()` extern C function
- [ ] **`modules/expo-umbra-core/ios/UmbraCore.h`** — Add C declaration
- [ ] **`modules/expo-umbra-core/ios/ExpoUmbraCoreModule.swift`** — Add `Function("initDatabase")`
- [ ] **`modules/expo-umbra-core/src/index.ts`** — Add `initDatabase(): string` to NativeUmbraCore
- [ ] **`packages/umbra-wasm/rn-backend.ts:100`** — Replace `async () => true` with real call

**Implementation:**

1. In `c_api.rs`, add:
   ```rust
   #[no_mangle]
   pub extern "C" fn umbra_init_database() -> FfiResult {
       let rt = get_runtime();
       rt.block_on(async {
           let state = match get_state() {
               Ok(s) => s,
               Err(e) => return FfiResult::err(e.code(), e.to_string()),
           };
           let storage_path = { state.read().storage_path.clone() };
           let db_path = format!("{}/umbra.db", storage_path);
           match Database::open(Some(&db_path)).await {
               Ok(database) => {
                   state.write().database = Some(Arc::new(database));
                   tracing::info!("Database initialized at: {}", db_path);
                   FfiResult::ok_empty()
               }
               Err(e) => FfiResult::err(400, format!("Failed to init database: {}", e)),
           }
       })
   }
   ```
2. In `UmbraCore.h`: `UmbraCoreResult umbra_init_database(void);`
3. In Swift module: `Function("initDatabase") { () -> String in try self.processResult(umbra_init_database()) }`
4. In `index.ts`: Add `initDatabase(): string;` to NativeUmbraCore
5. In `rn-backend.ts:100`:
   ```typescript
   umbra_wasm_init_database: async () => {
     try { native.initDatabase(); return true; }
     catch (e) { console.error('[rn-backend] DB init failed:', e); return false; }
   },
   ```

**Acceptance:** `native.call('friends_list')` returns `[]` instead of error 400.

---

### Task 1.2 — Expose Rust SecureStore via dispatcher

- [ ] **`packages/umbra-core/src/ffi/state.rs`** — Add `secure_store: Option<SecureStore>` to FfiState
- [ ] **`packages/umbra-core/src/ffi/c_api.rs`** — Initialize SecureStore during `umbra_init()`
- [ ] **`packages/umbra-core/src/ffi/dispatcher.rs`** — Add 4 match arms
- [ ] **`packages/umbra-core/src/ffi/dispatch_secure_store.rs`** (new) — 4 handler functions
- [ ] **`packages/umbra-core/src/ffi/mod.rs`** — Register new module

**Implementation:**

1. In `state.rs`, add `pub secure_store: Option<SecureStore>` to FfiState, `None` in `FfiState::new()`
2. In `c_api.rs` `umbra_init()`, after `init_state(FfiState::new(path))`:
   ```rust
   if let Ok(state) = get_state() {
       state.write().secure_store = Some(SecureStore::new());
   }
   ```
3. Create `dispatch_secure_store.rs` with 4 functions:
   - `secure_store(args)` — parse `{ "key": "...", "value": "..." }`, store UTF-8 bytes
   - `secure_retrieve(args)` — parse `{ "key": "..." }`, return `{ "value": "..." | null }`
   - `secure_delete(args)` — parse `{ "key": "..." }`, return `{ "deleted": bool }`
   - `secure_exists(args)` — parse `{ "key": "..." }`, return `{ "exists": bool }`
4. In `dispatcher.rs` add 4 match arms before `_ =>`:
   ```rust
   "secure_store" => dispatch_secure_store::secure_store(args),
   "secure_retrieve" => dispatch_secure_store::secure_retrieve(args),
   "secure_delete" => dispatch_secure_store::secure_delete(args),
   "secure_exists" => dispatch_secure_store::secure_exists(args),
   ```
5. In `mod.rs`: `mod dispatch_secure_store;`

**Acceptance:** `native.call('secure_store', '{"key":"test","value":"hello"}')` succeeds; `native.call('secure_retrieve', '{"key":"test"}')` returns `{"value":"hello"}`.

---

### Task 1.3 — Identity persistence on mobile via SecureStore

- [ ] **`contexts/AuthContext.tsx`** — Async storage refactor with Rust SecureStore on native
- [ ] **`contexts/UmbraContext.tsx`** — Gate hydration on `isHydrated`

**Implementation:**

1. Replace synchronous `getStorageItem`/`setStorageItem`/`removeStorageItem` in AuthContext with async versions:
   - **Web:** Keep `localStorage` (wrapped in async)
   - **Native:** Call `NativeUmbraCore.call('secure_retrieve', JSON.stringify({key}))` and `NativeUmbraCore.call('secure_store', JSON.stringify({key, value}))` directly. The native module is available immediately after `native.initialize()`, before WASM init completes — this avoids circular dependency with UmbraContext.
   - Create a small helper: `utils/nativeSecureStorage.ts` that imports `getExpoUmbraCore()` and wraps the `call('secure_store', ...)` / `call('secure_retrieve', ...)` pattern.

2. Refactor AuthContext state initialization:
   - Start all state with `null`/`false` defaults (no synchronous localStorage reads)
   - Add `useEffect` on mount → async reads from storage → set state
   - Add `isHydrated: boolean` (starts `false`, set `true` after reads complete)
   - Export `isHydrated` in context value

3. Persist these keys to SecureStore on native:
   - `umbra_identity` — identity JSON (`{ did, displayName, ... }`)
   - `umbra_recovery` — recovery phrase (JSON array of 24 words)
   - `umbra_remember_me` — `"true"` or absent
   - `umbra_pin` — PIN string

4. In `UmbraContext.tsx`:
   - Destructure `isHydrated` from `useAuth()`
   - Gate identity hydration: `if (!isReady || !isHydrated || !identity) return;`

**Acceptance:** Create identity → force-quit → reopen → identity auto-restores from Keychain recovery phrase. No auth screen shown.

---

### Task 1.4 — Verify init sequencing

- [ ] Verify `loader.ts:doInitReactNative()` sequence: `umbra_wasm_init()` → `await umbra_wasm_init_database()`
- [ ] Verify `ExpoUmbraCoreModule.swift` creates `Documents/umbra_data` directory
- [ ] Verify database file appears at `Documents/umbra_data/umbra.db` after init
- [ ] Verify UmbraContext hydration waits for both WASM init + AuthContext `isHydrated`

---

## PHASE 2: Event System + Missing Methods

> Enables real-time updates and eliminates all 404 errors.

### Task 2.1 — Wire event system: Rust → Swift → Expo EventEmitter → TS

- [ ] **`modules/expo-umbra-core/ios/ExpoUmbraCoreModule.swift`** — Register C callback, emit Expo events
- [ ] **`modules/expo-umbra-core/ios/UmbraCore.h`** — Ensure `umbra_register_event_callback` declared
- [ ] **`modules/expo-umbra-core/src/index.ts`** — Add `addUmbraCoreEventListener()` export
- [ ] **`packages/umbra-wasm/rn-backend.ts:219`** — Wire `subscribe_events` to Expo events

**Implementation:**

1. Swift module — add event registration:
   ```swift
   Events("onUmbraCoreEvent")

   OnCreate {
     let callback: @convention(c) (UnsafePointer<CChar>?, UnsafePointer<CChar>?) -> Void = {
       eventType, data in
       guard let eventType = eventType, let data = data else { return }
       let typeStr = String(cString: eventType)
       let dataStr = String(cString: data)
       NotificationCenter.default.post(name: .init("UmbraCoreEvent"), object: nil,
         userInfo: ["type": typeStr, "data": dataStr])
     }
     umbra_register_event_callback(callback)
   }
   ```
   Observe notification → call `sendEvent("onUmbraCoreEvent", [...])`

2. TS `index.ts` — add listener:
   ```typescript
   export function addUmbraCoreEventListener(
     callback: (event: { type: string; data: string }) => void
   ) {
     return emitter.addListener('onUmbraCoreEvent', callback);
   }
   ```

3. `rn-backend.ts:219` — wire subscription:
   ```typescript
   umbra_wasm_subscribe_events: (callback) => {
     const { addUmbraCoreEventListener } = require('../../modules/expo-umbra-core/src');
     addUmbraCoreEventListener((event) => callback(event.data));
   },
   ```

**Acceptance:** JS event listener fires when Rust dispatcher emits an event.

---

### Task 2.2 — Add emit_event calls to ALL dispatch handlers

- [ ] **`dispatch_friends.rs`** — 7 emit points (domain `"friend"`)
- [ ] **`dispatch_messaging.rs`** — 10 emit points (domain `"message"`)
- [ ] **`dispatch_community.rs`** — 25+ emit points (domain `"community"`)
- [ ] **`dispatch_community_msg.rs`** — 10 emit points (domain `"community"`)
- [ ] **`dispatch_community_ext.rs`** — 15+ emit points (domain `"community"`)
- [ ] **`dispatch_dm_files.rs`** — 4 emit points (domain `"message"`)

**Event catalog:**

| File | Handler | Domain | Event Type |
|------|---------|--------|------------|
| `dispatch_friends.rs` | `friends_send_request` | `friend` | `friendRequestSent` |
| | `friends_store_incoming` | `friend` | `friendRequestReceived` |
| | `friends_accept_request` | `friend` | `friendAdded` |
| | `friends_accept_from_relay` | `friend` | `friendRequestAccepted` |
| | `friends_reject_request` | `friend` | `friendRequestRejected` |
| | `friends_remove` | `friend` | `friendRemoved` |
| | `friends_block` | `friend` | `userBlocked` |
| `dispatch_messaging.rs` | `messaging_send` | `message` | `messageSent` |
| | `messaging_store_incoming` | `message` | `messageReceived` |
| | `messaging_edit` | `message` | `messageEdited` |
| | `messaging_delete` | `message` | `messageDeleted` |
| | `messaging_pin` | `message` | `messagePinned` |
| | `messaging_unpin` | `message` | `messageUnpinned` |
| | `messaging_add_reaction` | `message` | `reactionAdded` |
| | `messaging_remove_reaction` | `message` | `reactionRemoved` |
| | `messaging_mark_read` | `message` | `conversationRead` |
| | `messaging_update_status` | `message` | `messageStatusUpdated` |
| `dispatch_community.rs` | `community_create` | `community` | `communityCreated` |
| | `community_update` | `community` | `communityUpdated` |
| | `community_delete` | `community` | `communityDeleted` |
| | `community_transfer_ownership` | `community` | `ownershipTransferred` |
| | `community_update_branding` | `community` | `communityBrandingUpdated` |
| | `community_space_create` | `community` | `spaceCreated` |
| | `community_space_update` | `community` | `spaceUpdated` |
| | `community_space_delete` | `community` | `spaceDeleted` |
| | `community_category_create` | `community` | `categoryCreated` |
| | `community_category_update` | `community` | `categoryUpdated` |
| | `community_category_delete` | `community` | `categoryDeleted` |
| | `community_channel_create` | `community` | `channelCreated` |
| | `community_channel_update` | `community` | `channelUpdated` |
| | `community_channel_delete` | `community` | `channelDeleted` |
| | `community_join` | `community` | `memberJoined` |
| | `community_leave` | `community` | `memberLeft` |
| | `community_kick` | `community` | `memberKicked` |
| | `community_ban` | `community` | `memberBanned` |
| | `community_unban` | `community` | `memberUnbanned` |
| | `community_role_assign` | `community` | `roleAssigned` |
| | `community_role_unassign` | `community` | `roleUnassigned` |
| | `community_custom_role_create` | `community` | `communityRoleCreated` |
| | `community_role_update` | `community` | `communityRoleUpdated` |
| | `community_role_update_permissions` | `community` | `communityRolePermissionsUpdated` |
| | `community_role_delete` | `community` | `communityRoleDeleted` |
| | `community_invite_create` | `community` | `inviteCreated` |
| | `community_invite_use` | `community` | `inviteUsed` |
| | `community_invite_delete` | `community` | `inviteDeleted` |
| `dispatch_community_msg.rs` | `community_message_send` | `community` | `communityMessageSent` |
| | `community_message_edit` | `community` | `communityMessageEdited` |
| | `community_message_delete` | `community` | `communityMessageDeleted` |
| | `community_reaction_add` | `community` | `communityReactionAdded` |
| | `community_reaction_remove` | `community` | `communityReactionRemoved` |
| | `community_pin_message` | `community` | `communityMessagePinned` |
| | `community_unpin_message` | `community` | `communityMessageUnpinned` |
| | `community_thread_create` | `community` | `communityThreadCreated` |
| | `community_mark_read` | `community` | `communityRead` |
| `dispatch_community_ext.rs` | `community_emoji_create` | `community` | `communityEmojiCreated` |
| | `community_emoji_delete` | `community` | `communityEmojiDeleted` |
| | `community_sticker_create` | `community` | `communityStickerCreated` |
| | `community_sticker_delete` | `community` | `communityStickerDeleted` |
| | `community_upload_file` | `community` | `communityFileUploaded` |
| | `community_delete_file` | `community` | `communityFileDeleted` |
| | `community_create_folder` | `community` | `communityFolderCreated` |
| | `community_delete_folder` | `community` | `communityFolderDeleted` |
| | `community_seat_claim` | `community` | `seatClaimed` |
| | `community_seat_delete` | `community` | `seatDeleted` |
| | `community_seat_create_batch` | `community` | `seatsCreated` |
| `dispatch_dm_files.rs` | `dm_upload_file` | `message` | `fileUploaded` |
| | `dm_delete_file` | `message` | `fileDeleted` |
| | `dm_create_folder` | `message` | `folderCreated` |
| | `dm_delete_folder` | `message` | `folderDeleted` |

**Pattern for each:**
```rust
let result_json = /* existing result */;
super::dispatcher::emit_event("friend", &serde_json::json!({
    "type": "friendRequestReceived",
    "request": { /* relevant fields */ }
}));
Ok(result_json)
```

**Reference:** Mirror event types/fields from `wasm.rs` (`emit_event` appears 60+ times).

**Acceptance:** All mutating operations emit events through the Task 2.1 pipeline.

---

### Task 2.3 — Add 18 missing dispatcher match arms

- [ ] **`packages/umbra-core/src/ffi/dispatcher.rs`** — Add 18 match arms before `_ =>`
- [ ] **`packages/umbra-core/src/ffi/dispatch_stubs.rs`** — Add 18 stub functions

**Methods to add:**

| Group | Methods | Return |
|-------|---------|--------|
| WebRTC (N/A on native) | `network_create_offer`, `network_accept_offer`, `network_complete_handshake`, `network_complete_answerer` | 501 "Not applicable on native — direct P2P used" |
| File Transfer | `transfer_initiate`, `transfer_accept`, `transfer_pause`, `transfer_resume`, `transfer_cancel`, `transfer_on_message`, `transfer_get`, `transfer_chunks_to_send`, `transfer_mark_chunk_sent` | 501 "Not yet implemented" |
| File Transfer (list) | `transfer_list`, `transfer_get_incomplete` | `Ok("[]".to_string())` (empty arrays) |
| Reencryption | `mark_files_for_reencryption`, `get_files_needing_reencryption`, `clear_reencryption_flag` | 501 "Not yet implemented" |

**Acceptance:** All 18 methods return 501 or `[]` instead of 404 "Unknown method".

---

## PHASE 3: Stub Implementations (incremental)

> Each task replaces 501 stubs with real implementations. Reference `wasm.rs` for all patterns.

| Task | Domain | Methods | What's Needed | Effort |
|------|--------|---------|---------------|--------|
| 3.1 | Crypto peer encrypt/decrypt | 2 | Wrap `crate::crypto` X25519+AES-GCM | Small |
| 3.2 | Relay | 4 | Add `relay_client` to FfiState, wire `RelayClient` | Medium |
| 3.3 | File encryption | 6 | Wrap `crate::crypto::file_encryption` | Small |
| 3.4 | File chunking | 3 | Wrap `crate::storage::chunking` | Small |
| 3.5 | Calls history | 4 | Add calls DB table + CRUD | Small |
| 3.6 | Plugin KV storage | 8 | Add plugin_kv DB table + CRUD | Small |
| 3.7 | Relay envelope builders | 3 | Build signed relay envelopes | Small |
| 3.8 | DHT | 3 | Wire into libp2p DHT | Medium |
| 3.9 | File transfer control | 11 | Add transfer DB tables + CRUD | Large |
| 3.10 | Groups | 23 | Extract GroupService from wasm.rs, group key state | Large |

---

## Verification Checklist

### After Phase 1
- [ ] Build iOS with `scripts/build-mobile.sh`
- [ ] Create identity → database file appears at `Documents/umbra_data/umbra.db`
- [ ] Force-quit → reopen → identity auto-restores (no auth screen)
- [ ] Navigate to friends → empty list loads (no error 400)
- [ ] Navigate to communities → empty list loads
- [ ] `native.call('secure_store', ...)` and `native.call('secure_retrieve', ...)` round-trip correctly

### After Phase 2
- [ ] JS event listener receives `communityCreated` event after creating a community
- [ ] JS event listener receives `friendRequestReceived` after storing incoming request
- [ ] `native.call('network_create_offer')` → 501 (not 404)
- [ ] `native.call('transfer_list')` → `[]` (not 404)

### After Phase 3 (per task)
- [ ] Each stub replacement: call method with test data → real result instead of 501

---

## File Reference (all files across all phases)

### Rust FFI
| File | Changes |
|------|---------|
| `packages/umbra-core/src/ffi/c_api.rs` | `umbra_init_database()`, SecureStore init in `umbra_init()` |
| `packages/umbra-core/src/ffi/state.rs` | Add `secure_store` field |
| `packages/umbra-core/src/ffi/dispatcher.rs` | 22 new match arms (4 secure_store + 18 missing) |
| `packages/umbra-core/src/ffi/dispatch_stubs.rs` | 18 new stub functions |
| `packages/umbra-core/src/ffi/dispatch_secure_store.rs` (new) | 4 SecureStore handlers |
| `packages/umbra-core/src/ffi/dispatch_friends.rs` | emit_event calls (7 points) |
| `packages/umbra-core/src/ffi/dispatch_messaging.rs` | emit_event calls (10 points) |
| `packages/umbra-core/src/ffi/dispatch_community.rs` | emit_event calls (25+ points) |
| `packages/umbra-core/src/ffi/dispatch_community_msg.rs` | emit_event calls (10 points) |
| `packages/umbra-core/src/ffi/dispatch_community_ext.rs` | emit_event calls (15+ points) |
| `packages/umbra-core/src/ffi/dispatch_dm_files.rs` | emit_event calls (4 points) |
| `packages/umbra-core/src/ffi/mod.rs` | Register `dispatch_secure_store` |

### Swift/Expo Module
| File | Changes |
|------|---------|
| `modules/expo-umbra-core/ios/UmbraCore.h` | `umbra_init_database` declaration |
| `modules/expo-umbra-core/ios/ExpoUmbraCoreModule.swift` | `initDatabase()`, event callback registration + EventEmitter |
| `modules/expo-umbra-core/src/index.ts` | `initDatabase` interface, `addUmbraCoreEventListener` export |

### TypeScript App
| File | Changes |
|------|---------|
| `packages/umbra-wasm/rn-backend.ts` | Fix `init_database` (line 100), fix `subscribe_events` (line 219) |
| `contexts/AuthContext.tsx` | Async storage refactor with Rust SecureStore |
| `contexts/UmbraContext.tsx` | Gate hydration on `isHydrated` |
| `utils/nativeSecureStorage.ts` (new) | Helper for AuthContext to call SecureStore on native |
