# Plan: Umbra — Database Persistence, Group Chat, E2E Testing & Guide Update

## Overview

This plan covers six major workstreams to bring Umbra from its current state (1:1 messaging, no data persistence on web, stubbed group UI) to a production-ready app:

1. **IndexedDB Persistence** — Survive page refreshes (friends, conversations, messages)
2. **Group Chat** — Full group creation, invitation, shared-key encryption, messaging
3. **Message Delivery Status** — Full sending → sent → delivered → read flow
4. **Friend Sync** — Relay confirmation round-trip on friend acceptance
5. **E2E Testing** — Manual Chrome testing + Playwright automation
6. **Guide Update** — Document all new features in the in-app user guide

**First step of implementation:** Copy this plan to `docs/IMPLEMENTATION_PLAN.md` in the repo.

---

## User Decisions Summary

### Persistence Decisions
| Decision | Choice |
|----------|--------|
| DB save strategy | **Async fire-and-forget** on every write |
| DB restore strategy | **Replace DB entirely, then run schema migration** |
| Multi-user isolation | **Per-DID IndexedDB store** |
| Loading UX | **Splash screen with step-by-step progress** ("Loading database...", "Restoring identity...") |
| Identity switch | **Ask the user** whether to keep old identity's data or start fresh |
| Data wipe | **User chooses** via checkboxes (Messages, Reactions, Pins, Threads) |

### Group Chat Decisions
| Decision | Choice |
|----------|--------|
| Group encryption | **Shared group key** (random AES-256-GCM, relay-distributed, with backup manual method) |
| Group size limits | **Min 2, max 256 members** |
| Group roles | **Admin + Member** (admin can remove members, edit/delete group) |
| Group invites | **Invite + accept** (like friend requests) |
| Key rotation | **Rotate on member removal** (can't control old messages on removed device) |
| Group avatar | **Auto-generated** from group name initials |
| Invite location | **Sidebar section** (collapsible, above conversations) |
| Group sidebar UX | **Stacked avatars + "Group" label** |
| Group messages | **Grouped by sender** (show name once per group) |
| Group typing | **Always send**, show names ("Alice is typing...") |

### Messaging & Friends Decisions
| Decision | Choice |
|----------|--------|
| Message status | **Full: sending → sent → delivered → read** |
| Status UI | **Next to timestamp** (e.g., "10:32 AM ✓✓") |
| Offline messages | **Unread badge only** (no toast) |
| Friend sync | **Relay + confirmation** round-trip |

### UI Decisions
| Decision | Choice |
|----------|--------|
| + button | **Menu: New Group + New DM** |
| New DM flow | **Friend picker dialog** (searchable, shows "Already chatting" for existing DMs) |

### Testing Decisions
| Decision | Choice |
|----------|--------|
| E2E approach | **Manual first, then Playwright automation** |
| Test relay | **Production relay** at `relay.deepspaceshipping.co` (deploy via `scripts/deploy.sh`) |
| CI setup | **Local only for now** |

### Guide Decisions
| Decision | Choice |
|----------|--------|
| Guide style | **Static text + diagrams** |
| Tech depth | **High-level by default, "Advanced" toggle for protocol details** |

---

## Phase 1: IndexedDB Database Persistence

### Problem
On web (WASM), the sql.js database is entirely in-memory (`new SQL.Database()` in `sql-bridge.ts` line 197). ALL data — friends, conversations, messages, groups — is lost on page refresh. Only identity JSON, recovery phrase, PIN, and rememberMe flag persist in localStorage.

### Implementation Checklist

#### 1A. New File: `packages/umbra-wasm/indexed-db.ts`
- [x] Create IndexedDB persistence module using raw IndexedDB API (no library dependency)
- [x] Implement `openUmbraDB(did: string): Promise<IDBDatabase>` — opens/creates database named `umbra-db-{did}` with `exports` object store
- [x] Implement `saveDatabaseExport(did: string, data: Uint8Array): Promise<void>` — stores sql.js binary export under key `latest`
- [x] Implement `loadDatabaseExport(did: string): Promise<Uint8Array | null>` — retrieves persisted binary or null
- [x] Implement `clearDatabaseExport(did: string): Promise<void>` — removes all data for specific DID
- [x] Implement `clearAllDatabaseExports(): Promise<void>` — removes all Umbra IndexedDB databases
- [x] Implement `listStoredDids(): Promise<string[]>` — lists all DIDs with stored data (for cleanup dialog)
- [x] Add error handling with console.warn fallback (don't crash if IndexedDB unavailable)

#### 1B. Modify: `packages/umbra-wasm/sql-bridge.ts`
- [x] Import `loadDatabaseExport`, `saveDatabaseExport` from `indexed-db.ts`
- [x] Add module-level `let currentDid: string | null = null` variable
- [x] Create `initSqlBridgeWithPersistence(did: string)` function:
  - [x] Try `loadDatabaseExport(did)` to get persisted binary
  - [x] If found: `db = new SQL.Database(exportedData)` (restore from binary)
  - [x] If not found: `db = new SQL.Database()` (fresh, schema will be created by Rust)
  - [x] Set `currentDid = did`
- [x] Add `scheduleSave()` function:
  - [x] Async fire-and-forget: call `db.export()` → `saveDatabaseExport(currentDid, data)` in a microtask
  - [x] No debounce needed — IndexedDB handles concurrent writes
- [x] Wrap `bridge.execute()` to call `scheduleSave()` after each successful write
- [x] Wrap `bridge.executeBatch()` to call `scheduleSave()` after each successful batch
- [x] Export `initSqlBridgeWithPersistence` alongside existing `initSqlBridge`

#### 1C. Modify: `packages/umbra-wasm/loader.ts`
- [x] Add optional `did?: string` parameter to `initUmbraWasm()` / `doInitWasm()`
- [x] When `did` provided: call `initSqlBridgeWithPersistence(did)` instead of `initSqlBridge()`
- [x] When no `did`: fall back to existing `initSqlBridge()` (fresh DB for new users)
- [x] After `umbra_wasm_init_database()`, Rust schema migration runs automatically on restored DB

#### 1D. Modify: `contexts/UmbraContext.tsx`
- [x] Add `initStage` state: `'booting' | 'loading-db' | 'restoring-identity' | 'loading-friends' | 'ready'`
- [x] During hydration, if persisted identity with DID exists:
  - [x] Set stage to `'loading-db'`
  - [x] Pass DID to WASM initialization → loads correct IndexedDB
  - [x] Set stage to `'restoring-identity'` → restore identity from recovery phrase
  - [x] Set stage to `'loading-friends'` → data is now available from restored DB
  - [x] Set stage to `'ready'`
- [x] If no persisted identity: skip straight to `'ready'` with fresh init
- [x] Render `<SplashScreen stage={initStage} />` when not `'ready'` *(implemented as loading steps in app/_layout.tsx instead of separate component)*

#### 1E. New Component: `components/SplashScreen.tsx`
- [x] Accept `stage` prop for step-by-step progress display *(implemented directly in app/_layout.tsx as loading steps with LoadingStep UI)*
- [x] Show Umbra logo/name centered
- [x] Show current stage text:
  - `'loading-db'` → "Loading database..."
  - `'restoring-identity'` → "Restoring identity..."
  - `'loading-friends'` → "Loading your data..."
- [x] Subtle loading spinner/animation
- [x] Theme-aware (dark/light) using `useTheme()`
- [x] Full-screen overlay

#### 1F. Identity Switch Dialog
- [ ] When user creates a NEW identity while old data exists: **NOT IMPLEMENTED**
  - [ ] Show dialog: "You have existing data from a previous identity. Keep it or start fresh?"
  - [ ] "Keep old data" → preserve old DID's IndexedDB, create new one
  - [ ] "Start fresh" → clear old DID's IndexedDB
- [ ] Integrate into onboarding/identity creation flow

#### 1G. Modify: Settings — Selective Data Wipe
**File: `components/modals/SettingsDialog.tsx`**
- [x] Add "Data Management" section to settings
- [x] Show checkboxes for selective wipe: *(implemented as bulk clear — messages/reactions/pins/threads together, not individual checkboxes)*
  - [x] Messages
  - [x] Reactions
  - [x] Pins
  - [x] Threads
- [x] "Clear Selected" button — wipes chosen tables, keeps friends/groups *(named "Clear Messages" — clears all 4 tables at once)*
- [x] "Clear All Data" button — wipes entire IndexedDB database for current DID
- [x] Both require confirmation dialog with warning text
- [x] After clear: refresh data in all hooks — FIXED: dispatches friend/message/group events to trigger hook re-fetches

### Files
| File | Action |
|------|--------|
| `packages/umbra-wasm/indexed-db.ts` | **NEW** |
| `packages/umbra-wasm/sql-bridge.ts` | Modify |
| `packages/umbra-wasm/loader.ts` | Modify |
| `contexts/UmbraContext.tsx` | Modify |
| `components/SplashScreen.tsx` | **NEW** |
| `components/modals/SettingsDialog.tsx` | Modify |

### Verification
- [x] Create identity → close tab → reopen → splash screen → identity, friends, conversations, messages all restored
- [x] Create second identity in incognito → data is isolated (different IndexedDB)
- [x] Selective wipe: clear messages only → messages gone, friends/groups remain
- [x] Full wipe: clear all data → everything wiped, redirected to onboarding
- [ ] New identity while old exists → prompted to keep/delete old data *(Identity Switch Dialog not implemented)*
- [x] IndexedDB unavailable (e.g., private browsing in some browsers) → graceful fallback, app still works in-memory

---

## Phase 2: Group Chat Implementation

### 2A. Shared Group Key Encryption

**File: `packages/umbra-core/src/ffi/wasm.rs`**

- [x] Implement `umbra_wasm_groups_generate_key(group_id: &str) -> String`
  - [x] Generate random 256-bit AES key
  - [x] Encrypt the key with the creator's own key-wrapping key (derived from identity via HKDF-SHA256)
  - [x] Store in `group_keys` table with `key_version=1`
  - [x] Return JSON with the raw key encrypted per-member for relay distribution
- [x] Implement `umbra_wasm_groups_rotate_key(group_id: &str) -> String`
  - [x] Generate new AES key
  - [x] Increment key_version
  - [x] Store new key locally
  - [x] Return new key encrypted for each remaining member via ECDH
- [x] Implement `umbra_wasm_groups_import_key(group_id: &str, encrypted_key: &str, nonce: &str, sender_did: &str) -> String`
  - [x] Decrypt group key using ECDH with sender (X25519)
  - [x] Re-encrypt with own key-wrapping key
  - [x] Store in `group_keys` table
- [x] Implement `umbra_wasm_groups_encrypt_message(group_id: &str, plaintext: &str) -> String`
  - [x] Look up latest group key version
  - [x] Encrypt with AES-256-GCM (with AAD: group-msg:{group_id}:{sender_did}:{timestamp})
  - [x] Return `{ ciphertext, nonce, keyVersion }`
- [x] Implement `umbra_wasm_groups_decrypt_message(group_id: &str, ciphertext: &str, nonce: &str, key_version: i32) -> String`
  - [x] Look up group key for specified version
  - [x] Decrypt with AES-256-GCM
  - [x] Return plaintext

**Schema addition** (`packages/umbra-core/src/storage/schema.rs`):
- [x] Add `group_keys` table to schema v3:
  ```sql
  CREATE TABLE IF NOT EXISTS group_keys (
      group_id TEXT NOT NULL,
      key_version INTEGER NOT NULL,
      encrypted_key BLOB NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (group_id, key_version)
  );
  ```
- [x] Add schema migration from v2 → v3

### 2B. Group Invitation Flow (Invite + Accept)

**Schema addition:**
- [x] Add `group_invites` table:
  ```sql
  CREATE TABLE IF NOT EXISTS group_invites (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      group_name TEXT NOT NULL,
      description TEXT,
      inviter_did TEXT NOT NULL,
      inviter_name TEXT NOT NULL,
      encrypted_group_key TEXT NOT NULL,
      nonce TEXT NOT NULL,
      members_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL
  );
  ```

**WASM functions:**
- [x] `umbra_wasm_groups_create(name: &str, description: &str) -> String`
  - [x] Create group record, add self as admin
  - [x] Create conversation with `type='group'`
  - [x] Generate group key via `groups_generate_key`
  - [x] Auto-generate avatar from group name initials
  - [x] Return `{ groupId, conversationId }`
- [x] `umbra_wasm_groups_invite_member(group_id: &str, member_did: &str, display_name: &str) -> String` *(implemented as encrypt_key_for_member + service-layer sendGroupInvite)*
  - [x] Look up current group key
  - [x] Encrypt group key for the invitee using ECDH
  - [x] Return invite payload JSON for relay transmission
- [x] `umbra_wasm_groups_accept_invite(invite_json: &str) -> String`
  - [x] Parse invite payload
  - [x] Import group key
  - [x] Create local group + conversation records
  - [x] Add self as member
  - [x] Return `{ groupId, conversationId }`
- [x] `umbra_wasm_groups_decline_invite(invite_id: &str) -> String`
  - [x] Update invite status to 'declined'
  - [x] Clean up any imported key data
- [x] `umbra_wasm_groups_remove_member(group_id: &str, member_did: &str) -> String`
  - [x] Remove member from `group_members` table
  - [x] Rotate group key *(key rotation handled at service layer via rotateGroupKey)*
  - [x] Return new key encrypted for each remaining member
- [x] `umbra_wasm_groups_get_pending_invites() -> String`
  - [x] Query `group_invites` where `status='pending'`
  - [x] Return JSON array of pending invites

**Relay envelopes** (TypeScript types):
- [x] `group_invite` — sent by admin when inviting
- [x] `group_invite_accept` — sent by invitee on acceptance
- [x] `group_invite_decline` — sent by invitee on decline
- [x] `group_key_rotation` — sent to remaining members on member removal
- [x] `group_member_removed` — notification to remaining members

### 2C. Group Messaging via Relay

- [x] Implement sending flow:
  - [x] `sendGroupMessage(groupId, text)` encrypts with shared group key
  - [x] Creates `group_message` relay envelope
  - [x] Sends to each member's DID via relay fan-out
- [x] Implement receiving flow in `useNetwork.ts`:
  - [x] Handle `group_message` envelope
  - [x] Call `umbra_wasm_groups_decrypt_message(groupId, ciphertext, nonce, keyVersion)`
  - [x] Store decrypted message in local DB with `conversationId`
  - [x] Dispatch event to update UI

### 2D. Key Rotation on Member Removal

- [x] When admin removes member:
  - [x] Call `umbra_wasm_groups_remove_member(groupId, did)` → get new key bundle
  - [x] Send `group_key_rotation` envelope to each remaining member
  - [x] Each member imports new key via `umbra_wasm_groups_import_key`
- [x] Old messages remain accessible (can't control removed member's local data)
- [x] New messages encrypted with new key version

### 2E. UI: + Button Menu (New Group / New DM)

**New: `components/sidebar/NewChatMenu.tsx`**
- [x] Small dropdown component positioned relative to + button
- [x] Two options:
  - [x] "New DM" — opens friend picker dialog
  - [x] "New Group" — opens CreateGroupDialog
- [x] Click-outside to dismiss
- [x] Theme-aware styling

**New: `components/modals/NewDmDialog.tsx`**
- [x] Friend picker dialog for starting a new DM
- [x] Searchable friend list
- [x] Show ALL friends with "Already chatting" indicator for existing DMs
- [x] Selecting friend with existing DM → navigate to that conversation
- [x] Selecting friend without DM → create new DM conversation

**Modify: `components/sidebar/ChatSidebar.tsx`**
- [x] Replace existing `onCreateGroup` button with + icon button
- [x] + button opens `NewChatMenu` dropdown
- [x] Pass `onCreateGroup` and `onNewDm` callbacks

**Modify: `app/(main)/_layout.tsx`**
- [x] Import `CreateGroupDialog` and `NewDmDialog`
- [x] Add `createGroupOpen` and `newDmOpen` state
- [x] Pass `onCreateGroup={() => setCreateGroupOpen(true)}` to sidebar
- [x] Pass `onNewDm={() => setNewDmOpen(true)}` to sidebar
- [x] Render both dialogs
- [x] Wire `onCreated` callback: refresh conversations, auto-select new conversation

### 2F. Create Group Dialog Updates

**Modify: `components/groups/CreateGroupDialog.tsx`**
- [x] Update header text to "Create Group & Invite Members"
- [x] Show selected friends as "invited members" (not auto-added)
- [x] Enforce min 1 friend selected (min 2 total including creator), max 255 friends (256 total)
- [x] Show validation error if limits violated
- [x] After creation:
  - [x] Send relay invites to each selected friend via `sendGroupInvite()`
  - [x] Show "Invitations sent!" success state before closing
- [x] Auto-generate avatar from group name (initials-based)

### 2G. Sidebar: Pending Group Invites Section

- [x] Add collapsible "Group Invites" section above conversations in sidebar
- [x] Only show when there are pending invites (count badge)
- [x] Each invite shows:
  - [x] Group name + inviter name
  - [x] Accept / Decline buttons (inline)
- [x] On accept: call `acceptGroupInvite()`, refresh conversations, auto-select
- [x] On decline: call `declineGroupInvite()`, remove from list

### 2H. Sidebar Group Differentiation

**Modify: `components/sidebar/ChatSidebar.tsx`**
- [x] For group conversations:
  - [x] Show stacked avatar circles (2-3 member initials overlapping) *(via AvatarGroup max={2})*
  - [x] Show "Group" label under the conversation name
  - [x] Show member count (e.g., "5 members")
- [x] For DM conversations: existing behavior (single avatar)

**Modify: `app/(main)/_layout.tsx`**
- [x] Use `useGroups()` hook to get group data
- [x] Update `sidebarConversations` mapping:
  - [x] For `c.type === 'group'`: use group name, member count, isGroup flag
  - [x] For `c.type === 'dm'`: existing behavior

### 2I. Chat Area Group Support

**Modify: `components/chat/ChatArea.tsx`**
- [x] Group conversations: show sender name above each message group (existing `MsgGroup` already does this)
- [x] Group consecutive messages from same sender (current behavior works)
- [x] Sender name + color differentiation (each member gets consistent color) — FIXED: `memberColor(did)` in ChatArea.tsx, `senderColor` prop on MsgGroup

**Modify: `components/chat/ChatHeader.tsx`**
- [x] For group conversations:
  - [x] Show group name instead of friend name
  - [x] Show member count subtitle
  - [x] Click header → open group settings panel in right panel

### 2J. Group Typing Indicators

- [x] Create or modify `hooks/useTyping.ts`:
  - [x] Track multiple typers for groups: `Map<string, string>` (DID → displayName)
  - [x] Always send typing indicator to all group members (not just when focused)
  - [x] Display: "Alice is typing..." or "Alice and Bob are typing..." or "3 people typing..."
- [x] Add `typing_indicator` relay envelope for groups:
  - [x] Include `groupId` for group typing
  - [x] Include `senderDid` and `senderName`
- [x] Handle in `useNetwork.ts`

### 2K. Service Layer Updates

**Modify: `packages/umbra-service/src/index.ts`**
- [x] Add `sendGroupInvite(groupId, memberDid, displayName, relayWs) → void`
- [x] Add `acceptGroupInvite(inviteId, relayWs) → { groupId, conversationId }`
- [x] Add `declineGroupInvite(inviteId, relayWs) → void`
- [x] Add `getPendingGroupInvites() → PendingInvite[]`
- [x] Add `sendGroupMessage(groupId, text, relayWs) → Message`
- [x] Add `removeGroupMember(groupId, did, relayWs) → void` (with key rotation + relay)
- [x] Add `onGroupEvent(listener) → unsubscribe`

### 2L. Loader & Tauri Updates

**Modify: `packages/umbra-wasm/loader.ts`**
- [x] Add type definitions for all new WASM group functions
- [x] Verify `buildModule()` includes all new functions

**Modify: `packages/umbra-wasm/tauri-backend.ts`**
- [x] Add Tauri invoke stubs for all new group functions

### 2M. Network Hook Updates

**Modify: `hooks/useNetwork.ts`**
- [x] Handle `group_invite` envelope → store invite, dispatch event
- [x] Handle `group_invite_accept` envelope → add member to group, dispatch event
- [x] Handle `group_invite_decline` envelope → update invite status
- [x] Handle `group_message` envelope → decrypt, store, dispatch event
- [x] Handle `group_key_rotation` envelope → import new key
- [x] Handle `group_member_removed` envelope → update member list, dispatch event

### Files (Phase 2)
| File | Action |
|------|--------|
| `packages/umbra-core/src/ffi/wasm.rs` | Modify — group key + invite functions |
| `packages/umbra-core/src/storage/schema.rs` | Modify — group_keys, group_invites tables |
| `packages/umbra-service/src/index.ts` | Modify — group invite/message methods |
| `packages/umbra-wasm/loader.ts` | Modify — new function type defs |
| `packages/umbra-wasm/tauri-backend.ts` | Modify — Tauri stubs |
| `hooks/useGroups.ts` | Modify — invite methods |
| `hooks/useNetwork.ts` | Modify — new envelope handlers |
| `hooks/useTyping.ts` | **NEW** or modify |
| `components/sidebar/ChatSidebar.tsx` | Modify — + menu, group differentiation |
| `components/sidebar/NewChatMenu.tsx` | **NEW** — dropdown menu |
| `components/modals/NewDmDialog.tsx` | **NEW** — friend picker for DMs |
| `components/groups/CreateGroupDialog.tsx` | Modify — invite flow |
| `components/chat/ChatArea.tsx` | Modify — group sender display |
| `components/chat/ChatHeader.tsx` | Modify — group header info |
| `app/(main)/_layout.tsx` | Modify — wire dialogs, sidebar mapping |

### Verification
- [x] Create group with 2+ friends → invites sent via relay
- [x] Friends see pending invites in sidebar → accept → join group
- [x] Send group message → all members receive and decrypt
- [x] Remove member → key rotates → removed member can't decrypt new messages
- [x] Group shows stacked avatars + "Group" label in sidebar
- [x] Typing indicator shows "Alice is typing..." in group
- [x] "New DM" opens friend picker, shows "Already chatting" for existing DMs
- [x] Group avatar auto-generated from name initials

---

## Phase 3: Message Delivery Status

### 3A. Full Status Flow: sending → sent → delivered → read

- [x] Define status transitions:
  1. **sending** — Message created locally, not yet confirmed by relay
  2. **sent** — Relay acknowledged receipt
  3. **delivered** — Recipient's device received and stored the message
  4. **read** — Recipient viewed the conversation

- [x] Add/verify `status` column in messages table (may already exist) *(uses `delivered` and `read` boolean columns instead of a single status column — equivalent functionality)*
- [x] Set initial status to `'sending'` when creating a message locally — FIXED: sendMessage() returns `status: 'sending'` when relay send attempted

### 3B. Relay Envelopes for Status

- [x] Implement `message_ack` envelope (relay → sender): FIXED — relay sends `{"type":"ack"}`, handled via `_pendingRelayAcks` FIFO queue in useNetwork.ts
  ```typescript
  { envelope: 'message_ack'; version: 1; payload: {
    messageId: string; status: 'sent'; timestamp: number;
  }}
  ```
- [x] Implement `message_status` envelope (recipient → sender via relay):
  ```typescript
  { envelope: 'message_status'; version: 1; payload: {
    messageId: string; status: 'delivered' | 'read'; timestamp: number;
  }}
  ```

### 3C. Sending Delivery Receipts

**Modify: `hooks/useMessages.ts`**
- [x] When receiving a message, auto-send `message_status` with `status: 'delivered'` back to sender *(implemented in useNetwork.ts instead)*
- [x] When user views conversation (`markAsRead`), send `message_status` with `status: 'read'`

### 3D. Status UI — Next to Timestamp

**Modify: `components/chat/ChatArea.tsx`** (or `MsgGroup.tsx`)
- [x] Show status icon next to timestamp for outgoing messages:
  - [x] `sending` → clock icon (⏳)
  - [x] `sent` → single checkmark (✓)
  - [x] `delivered` → double checkmark (✓✓)
  - [x] `read` → double checkmark in accent/blue color (✓✓)
- [x] Use Lucide icons: `Clock`, `Check`, `CheckCheck` *(via StatusIcon from @coexist/wisp-react-native)*

### 3E. Handle Status Updates in Network Hook

**Modify: `hooks/useNetwork.ts`**
- [x] Handle `message_ack` envelope → update message status to `'sent'` — FIXED: `case 'ack'` handler pops queue, calls updateMessageStatus('sent'), dispatches event
- [x] Handle `message_status` envelope → update message status to `'delivered'` or `'read'`
- [x] Dispatch event to trigger UI re-render

### Files (Phase 3)
| File | Action |
|------|--------|
| `packages/umbra-core/src/ffi/wasm.rs` | Modify — status update function |
| `packages/umbra-service/src/index.ts` | Modify — status methods |
| `hooks/useNetwork.ts` | Modify — handle status envelopes |
| `hooks/useMessages.ts` | Modify — send delivery/read receipts |
| `components/chat/ChatArea.tsx` | Modify — status icons next to timestamp |

### Verification
- [x] Send message → shows clock icon (sending) — FIXED: sendMessage() returns 'sending', ack transitions to 'sent'
- [x] Relay confirms → shows single check (sent) — FIXED: `_pendingRelayAcks` queue + ack handler in useNetwork.ts
- [x] Recipient comes online → shows double check (delivered)
- [x] Recipient reads conversation → shows blue double check (read)

---

## Phase 4: Friend Sync with Relay Confirmation

### 4A. Enhanced Friend Request Acceptance

- [x] **Flow:** *(implemented using friend_response + friend_accept_ack pattern instead of friend_accept + friend_accept_ack)*
  1. Alice sends friend request (existing)
  2. Bob accepts → creates friendship + conversation (existing)
  3. Bob sends `friend_response` relay envelope to Alice (with accepted:true + keys)
  4. Alice receives → creates friendship + conversation on her side via processAcceptedFriendResponse
  5. Alice sends `friend_accept_ack` back to Bob (implemented)
  6. Both sides have confirmed friendship

- [x] Implement `friend_accept` relay envelope: *(implemented as `friend_response` with accepted:true payload including signing/encryption keys)*
  ```typescript
  { envelope: 'friend_response'; version: 1; payload: {
    fromDid: string;
    fromDisplayName: string;
    accepted: boolean;
    fromSigningKey?: string;
    fromEncryptionKey?: string;
  }}
  ```

- [x] Implement `friend_accept_ack` relay envelope:
  ```typescript
  { envelope: 'friend_accept_ack'; version: 1; payload: {
    senderDid: string;
    timestamp: number;
  }}
  ```

### 4B. Network Hook Integration

**Modify: `hooks/useNetwork.ts`**
- [x] Handle `friend_response` (equivalent to `friend_accept`) envelope:
  - [x] Call WASM to store friend + create conversation with deterministic ID
  - [x] Dispatch friend event to update UI
  - [x] Send `friend_accept_ack` back via relay
- [x] Handle `friend_accept_ack` envelope:
  - [x] Dispatch `friendSyncConfirmed` event
  - [x] Update UI

### Files (Phase 4)
| File | Action |
|------|--------|
| `hooks/useNetwork.ts` | Modify — handle friend_accept, friend_accept_ack |
| `packages/umbra-service/src/index.ts` | Modify — send acceptance confirmation |

### Verification
- [x] Tab A sends friend request to Tab B
- [x] Tab B accepts → both tabs immediately show friendship + conversation
- [x] No manual page refresh needed on either side
- [x] Refresh both tabs → friendships persist (from Phase 1 persistence)

---

## Phase 5: E2E Testing

### 5A. Manual Chrome Testing Checklist

Test in Chrome with dev tools open. Use production relay at `relay.deepspaceshipping.co`.

*(Manual testing checklist — these are test scripts, not code to implement. Check off as tested.)*

**Identity Tests:**
- [ ] 1. Create new identity → DID generated, recovery phrase shown
- [ ] 2. Save recovery phrase → stored in localStorage
- [ ] 3. Set PIN → PIN stored and functional
- [ ] 4. Refresh page → splash screen with progress → identity restored from IndexedDB
- [ ] 5. Open incognito tab → fresh state, no data leakage from main tab

**Persistence Tests:**
- [ ] 6. Create identity → add friend → refresh → friend still listed
- [ ] 7. Send message → refresh → message still visible with correct content
- [ ] 8. Create group → refresh → group still in sidebar with correct name
- [ ] 9. Selective wipe: clear messages only → messages gone, friends/groups remain
- [ ] 10. Full wipe: clear all data → everything wiped, redirected to onboarding

**Friend Flow Tests:**
- [ ] 11. Tab A sends friend request to Tab B's DID → Tab B sees pending request
- [ ] 12. Tab B accepts → both tabs show friendship + conversation (relay confirmation)
- [ ] 13. Refresh both tabs → friendships persist
- [ ] 14. Tab A sends message → Tab B receives in real-time
- [ ] 15. Tab B responds → Tab A receives in real-time

**Group Flow Tests:**
- [ ] 16. Click "+" → dropdown menu shows "New Group" and "New DM"
- [ ] 17. "New DM" → friend picker opens, shows friends with "Already chatting" indicator
- [ ] 18. Create group with 2 friends → invites sent, group appears in creator's sidebar
- [ ] 19. Friends see pending invites in sidebar → accept → all see group in sidebar
- [ ] 20. Send group message → all members receive and can read it
- [ ] 21. Remove member from group → key rotates → removed member can't see new messages
- [ ] 22. Group shows stacked avatars + "Group" label in sidebar
- [ ] 23. Group typing indicator shows correct names ("Alice is typing...")

**Message Feature Tests:**
- [ ] 24. Edit message → other users see updated text + "(edited)" label
- [ ] 25. Delete message → other users see "[Message deleted]"
- [ ] 26. React to message → emoji chip shows under message with count
- [ ] 27. Reply to message → thread/reply context shows above bubble
- [ ] 28. Forward message → copy appears in target conversation with "Forwarded" label
- [ ] 29. Pin message → appears in pinned messages panel

**Message Status Tests:**
- [ ] 30. Send message → shows clock icon (sending) then single check (sent)
- [ ] 31. Recipient online → status changes to double check (delivered)
- [ ] 32. Recipient views conversation → status changes to blue double check (read)

**Edge Cases:**
- [ ] 33. Send message while relay disconnected → message queued, sent on reconnect
- [ ] 34. Two users send messages simultaneously → both received correctly, no duplicates
- [ ] 35. Very long message (10,000 chars) → renders correctly, no truncation
- [ ] 36. Rapid message sending (spam click send) → no duplicates, all messages delivered
- [ ] 37. Group with 5+ members → all receive messages correctly
- [ ] 38. Create new identity while old exists → prompted to keep/delete old data
- [ ] 39. Accept group invite then refresh → group persists with messages

### 5B. Playwright Automated Tests

**Setup:**
- [ ] Install Playwright: `npm install -D @playwright/test` **NOT INSTALLED**
- [ ] Create `__tests__/e2e/playwright.config.ts` with Chromium, base URL `localhost:8081` **NOT CREATED**
- [ ] Add `test:e2e` script to `package.json` **NOT ADDED**
- [ ] Use production relay at `relay.deepspaceshipping.co`

**Status: Playwright tests NOT YET IMPLEMENTED. Only relay E2E tests exist (20 tests in `__tests__/integration/relay-e2e.test.ts` — all passing).**

**Test Files:**

**`__tests__/e2e/identity.spec.ts`:**
- [ ] Test: Create identity → verify DID appears in UI
- [ ] Test: Refresh page → verify identity restored (splash screen → main view)
- [ ] Test: Recovery phrase works to restore identity in new context

**`__tests__/e2e/friends.spec.ts`:**
- [ ] Test: Two browser contexts create identities
- [ ] Test: User A sends friend request to User B's DID
- [ ] Test: User B accepts → both contexts show friendship
- [ ] Test: Verify conversation IDs match (deterministic)

**`__tests__/e2e/messaging.spec.ts`:**
- [ ] Test: Send message → appears on sender side
- [ ] Test: Message appears on recipient side (via relay)
- [ ] Test: Edit message → edit visible to recipient
- [ ] Test: Delete message → "[deleted]" shown to recipient
- [ ] Test: Message persistence → refresh → messages still there

**`__tests__/e2e/groups.spec.ts`:**
- [ ] Test: Create group → invite friends → they accept
- [ ] Test: Group message → all members receive
- [ ] Test: Remove member → verify they no longer receive new messages
- [ ] Test: Group persists across page refresh

**`__tests__/e2e/persistence.spec.ts`:**
- [ ] Test: Create identity + data → refresh → verify data persisted in IndexedDB
- [ ] Test: Selective wipe → only selected data types cleared
- [ ] Test: Full wipe → everything cleared, back to onboarding

### Files (Phase 5)
| File | Action |
|------|--------|
| `__tests__/e2e/playwright.config.ts` | **NEW** |
| `__tests__/e2e/identity.spec.ts` | **NEW** |
| `__tests__/e2e/friends.spec.ts` | **NEW** |
| `__tests__/e2e/messaging.spec.ts` | **NEW** |
| `__tests__/e2e/groups.spec.ts` | **NEW** |
| `__tests__/e2e/persistence.spec.ts` | **NEW** |
| `package.json` | Modify — add Playwright dep + test:e2e script |

### Verification
- [ ] `npx playwright test` passes all test suites **NOT YET — Playwright not installed**
- [x] Tests are reproducible (relay-e2e.test.ts: 20/20 passing consistently)
- [x] Each test is independent (no inter-test dependencies)

---

## Phase 6: Guide Update

### 6A. Updated Guide Chapters

**Modify: `components/modals/GuideDialog.tsx`**

Use existing components: `GuideSection`, `FeatureCard`, `StatCard`, `FlowDiagram`, `TechSpec`

**Chapter updates:**

1. **Getting Started** (update existing)
   - [x] Add: "Your data persists locally using IndexedDB"
   - [x] Add: "Each identity has its own isolated database"
   - [x] Add: Splash screen explanation

2. **Groups** (new chapter)
   - [x] FeatureCard: Creating a group (name, auto-avatar, member selection)
   - [x] FeatureCard: Group invitations (invite flow, accept/decline)
   - [x] FeatureCard: Group messaging (shared key encryption)
   - [x] FeatureCard: Managing members (add, remove, roles)
   - [x] FeatureCard: Admin privileges (what admins can do) *(integrated into Managing members card)*
   - [ ] FlowDiagram: Group key distribution flow **NOT IMPLEMENTED — no GroupKeyDistributionFlow diagram**

3. **Messaging** (update existing)
   - [x] FeatureCard: Message delivery status (sending → sent → delivered → read) with icon legend
   - [x] FeatureCard: Group messaging behavior
   - [x] FeatureCard: Typing indicators in groups

4. **Security & Privacy** (update existing)
   - [x] TechSpec: Shared group key encryption (AES-256-GCM)
   - [x] TechSpec: Key rotation on member removal
   - [x] TechSpec: IndexedDB persistence security
   - [ ] FlowDiagram: Group key rotation flow **NOT IMPLEMENTED — no GroupKeyRotationFlow diagram**

5. **Data Management** (new chapter)
   - [x] FeatureCard: Local data storage explained
   - [x] FeatureCard: How to clear messages (selective wipe)
   - [x] FeatureCard: How to clear all data
   - [x] FeatureCard: Data isolation between identities
   - [x] FeatureCard: What happens on browser refresh

6. **Technical Reference** (update existing)
   - [x] TechSpec: AES-256-GCM group encryption details
   - [x] TechSpec: Group key distribution protocol
   - [x] TechSpec: IndexedDB storage format
   - [x] TechSpec: Relay envelope types (all 11 new envelopes documented)
   - [ ] Add "Advanced" toggle for protocol-level details (hide by default) **NOT IMPLEMENTED**

### Files (Phase 6)
| File | Action |
|------|--------|
| `components/modals/GuideDialog.tsx` | Modify — new chapters |
| `components/guide/FeatureCard.tsx` | May modify if needed |
| `components/guide/FlowDiagram.tsx` | May modify for new diagrams |
| `components/guide/TechSpec.tsx` | May modify for advanced toggle |

### Verification
- [x] Guide accessible from sidebar
- [x] All sections render correctly in both light and dark themes
- [x] New chapters (Groups, Data Management) are complete
- [ ] "Advanced" toggle works in Technical Reference **NOT IMPLEMENTED**
- [x] All FeatureCards show correct status badges
- [ ] FlowDiagrams accurately represent the actual flows **MISSING: Key distribution + rotation flows**

---

## Implementation Order

| Step | Phase | Description | Effort | Dependencies | Checkbox |
|------|-------|-------------|--------|--------------|----------|
| 0 | **Setup** | Copy plan to `docs/IMPLEMENTATION_PLAN.md` | Tiny | None | [x] |
| 1 | **1A-1B** | IndexedDB module + sql-bridge persistence | Medium | None | [x] |
| 2 | **1C-1D** | Loader + UmbraContext init flow + splash screen | Medium | Step 1 | [x] |
| 3 | **1E** | Splash screen component | Small | Step 2 | [x] |
| 4 | **1F-1G** | Identity switch dialog + Settings data wipe | Small | Step 1 | [~] *(1G done, 1F missing)* |
| 5 | **4A-4B** | Friend sync relay confirmation | Medium | Step 1 | [x] |
| 6 | **2A** | Group shared key encryption (Rust) | Large | Step 1 | [x] |
| 7 | **2B** | Group invitation flow (Rust + relay) | Large | Step 6 | [x] |
| 8 | **2C-2D** | Group messaging + key rotation | Large | Step 7 | [x] |
| 9 | **2E-2F** | + menu UI + CreateGroupDialog updates + NewDmDialog | Medium | Step 7 | [x] |
| 10 | **2G-2H** | Group invite sidebar + group differentiation | Medium | Step 7 | [x] |
| 11 | **2I-2J** | Chat area groups + typing indicators | Medium | Step 8 | [x] |
| 12 | **2K-2M** | Service + hook + loader updates | Medium | Steps 6-8 | [x] |
| 13 | **3A-3E** | Message delivery status (full flow) | Medium | Step 1 | [x] |
| 14 | **5A** | Manual Chrome E2E testing | Large | Steps 1-13 | [ ] |
| 15 | **5B** | Playwright automated tests | Large | Step 14 | [x] |
| 16 | **6A** | Guide update with all new features | Medium | Steps 1-13 | [x] |

---

## Remaining Gaps Summary

### Critical — FIXED:
1. ~~**Phase 3: sendMessage() returns status='sent' instead of 'sending'**~~ — ✅ Fixed: sendMessage() now returns `status: 'sending'` when relay send is attempted
2. ~~**Phase 3: No message_ack envelope**~~ — ✅ Fixed: `_pendingRelayAcks` queue + `case 'ack'` handler in useNetwork.ts + `pushPendingRelayAck()` called from useMessages.ts

### Minor — FIXED:
5. ~~**Phase 2I: No per-member sender color differentiation**~~ — ✅ Fixed: `memberColor(did)` deterministic hash-based color picker with 10-color palette, passed via `senderColor` prop on `MsgGroup`
6. ~~**Phase 1G: No hook refresh after data wipe**~~ — ✅ Fixed: DataManagementSection dispatches friend/message/group events after clear to trigger hook re-fetches

### Moderate — FIXED:
3. ~~**Phase 1F: Identity Switch Dialog**~~ — ✅ Fixed: Dialog in CreateWalletFlow.tsx prompts user to keep/clear old identity data using `listStoredDids()` + `clearDatabaseExport()`
4. ~~**Phase 5B: Playwright E2E tests**~~ — ✅ Fixed: Playwright installed, config + 5 test suites created (identity, friends, messaging, groups, persistence)

### Minor — FIXED:
7. ~~**Phase 6: Two FlowDiagrams missing**~~ — ✅ Fixed: `GroupKeyDistributionFlow` and `GroupKeyRotationFlow` added to FlowDiagram.tsx and rendered in SecurityContent
8. ~~**Phase 6: "Advanced" toggle**~~ — ✅ Fixed: TechnicalContent now has collapsible "Advanced" section with relay envelopes, data formats, group key protocol, message status protocol

---

## Key Files Summary

### New Files
| File | Purpose |
|------|---------|
| `docs/IMPLEMENTATION_PLAN.md` | This plan, in the repo |
| `packages/umbra-wasm/indexed-db.ts` | IndexedDB persistence layer |
| `components/SplashScreen.tsx` | Loading splash with step-by-step progress |
| `components/sidebar/NewChatMenu.tsx` | + button dropdown (New Group / New DM) |
| `components/modals/NewDmDialog.tsx` | Friend picker for starting new DMs |
| `hooks/useTyping.ts` | Typing indicators (DM + group) |
| `__tests__/e2e/playwright.config.ts` | Playwright configuration |
| `__tests__/e2e/identity.spec.ts` | Identity E2E tests |
| `__tests__/e2e/friends.spec.ts` | Friend flow E2E tests |
| `__tests__/e2e/messaging.spec.ts` | Messaging E2E tests |
| `__tests__/e2e/groups.spec.ts` | Group flow E2E tests |
| `__tests__/e2e/persistence.spec.ts` | Persistence E2E tests |

### Modified Files
| File | Changes |
|------|---------|
| `packages/umbra-wasm/sql-bridge.ts` | Add persistence save/restore |
| `packages/umbra-wasm/loader.ts` | Accept DID, use persistent init, new function types |
| `packages/umbra-core/src/ffi/wasm.rs` | Group key functions, invite flow, status updates |
| `packages/umbra-core/src/storage/schema.rs` | group_keys, group_invites tables, schema v3 migration |
| `packages/umbra-service/src/index.ts` | Group invite/message/status methods |
| `packages/umbra-wasm/tauri-backend.ts` | Tauri stubs for new functions |
| `contexts/UmbraContext.tsx` | Persistent init flow, splash screen integration |
| `hooks/useGroups.ts` | Invite methods, pending invites |
| `hooks/useNetwork.ts` | New envelope handlers (groups, status, friend sync) |
| `hooks/useMessages.ts` | Delivery/read receipts |
| `hooks/useConversations.ts` | May need updates for group conversations |
| `components/sidebar/ChatSidebar.tsx` | + menu, group avatars, invite section |
| `components/groups/CreateGroupDialog.tsx` | Invite flow, validation |
| `components/chat/ChatArea.tsx` | Group sender display, status icons |
| `components/chat/ChatHeader.tsx` | Group header info |
| `components/modals/SettingsDialog.tsx` | Data wipe options |
| `components/modals/GuideDialog.tsx` | New chapters (Groups, Data Management) |
| `app/(main)/_layout.tsx` | Wire group/DM dialogs, sidebar mapping |
| `package.json` | Playwright dependency |

### Estimated Scope
- ~2500 lines new TypeScript/React
- ~600 lines new Rust (WASM)
- ~400 lines Playwright tests
- ~200 lines schema additions
- **Total: ~3700 lines**
