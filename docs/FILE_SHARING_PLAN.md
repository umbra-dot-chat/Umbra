# P2P Encrypted File Sharing System — Comprehensive Plan

## Overview

Build a complete, real (no mocks) P2P encrypted file sharing system spanning all layers of the Umbra stack: Rust core, WASM bindings, TypeScript service, Wisp design system (React + React Native), and application UI. This includes community file channels, DM file sharing, shared folders between users, and a top-level Dropbox-like Files page.

**Nothing is mocked** — all functionality is backed by real Rust WASM, real E2EE, and real P2P transfers via WebRTC DataChannels + relay fallback + libp2p Kademlia DHT.

---

## Design Decisions (User-Confirmed)

These decisions were confirmed through detailed Q&A with the user and drive all implementation choices below.

### Chunking & Storage
- **Chunk size:** User-configurable. Default 256KB. Setting accessible in app preferences.
- **File size limits:** No hard limit on desktop (Tauri). Web: 2GB limit with warning to download desktop app for larger files.
- **Storage:** SQLite for metadata + OPFS (web) / filesystem (desktop) for raw chunk data. Content-addressed chunks.
- **OPFS layout:** Hybrid — SQLite tracks chunk locations and metadata, OPFS/filesystem stores raw bytes.

### P2P Transfer
- **Transfer flow:** Hybrid — store locally AND push to relay as temporary cache (configurable lifespan). Files >1GB skip relay caching. Relay file lifespan is configurable.
- **Transport fallback:** Default: try WebRTC first, configurable timeout (2s default), fall back to relay. User can set preference in settings. Show transport tag (e.g., "Direct" or "Relay") on transfers for transparency.
- **Concurrent limits:** Default 3 uploads + 3 downloads. Configurable up to 10 in settings. Desktop may default higher.
- **Flow control:** Adaptive sliding window. Start with 2, grow to 8 based on ACKs/latency. Shrink on timeouts (TCP-like congestion control).
- **Transfer encoding:** MessagePack for binary serialization of transfer protocol messages.
- **Resume:** Persist transfer state to SQLite on every state change. On restart, query for incomplete transfers and offer to resume.
- **Speed display:** Adaptive detail level — default shows speed + transport tag. Click/expand for full details (peer address, chunk progress, retry count). Settings toggle for technical details.
- **P2P discovery:** libp2p Kademlia DHT for decentralized peer and content discovery without relay dependency.
- **libp2p scope:** Use libp2p where it makes sense (DHT, transport), keep existing relay where it makes sense. Update relay code as needed. Pragmatic adoption.
- **DHT bootstrap:** Relay servers double as DHT bootstrap nodes. No new infrastructure needed.
- **Tiered storage:** Relay (hot) for small + recent files. Boost nodes (warm) for older/larger files. Time-based migration: files move from relay to boost after 24h.
- **File caching:** Relay handles small file cache. Boost nodes handle larger files. Server-side configuration for cache policies.

### Sync Protocol
- **Community file sync:** Hybrid — real-time relay events for online peers + periodic Merkle tree sync (every 5 min + on reconnect) to catch missed events.
- **Event format:** Real-time events contain essential fields for instant rendering. Merkle sync ensures consistency for missed events.

### File Organization
- **Community channels:** Dedicated "files" channel type only. Text channels do not support file management.
- **DM files:** Both inline in chat (combined text + file card) AND accessible via sidebar panel (like member list). DM file list is flat with type-based filters (not folders).
- **Community folder uploads:** Preserve full folder structure when uploading directories.
- **Auto-versioning:** If a file with the same name exists in the folder, automatically create a new version. Otherwise it's a new file.
- **File search:** Name + metadata search (filename, type, uploader, date range). SQLite LIKE queries.

### Permissions & Notifications
- **File permissions:** Full integration with community role/permission system. Basic set: UPLOAD_FILES, DELETE_OWN_FILES, DELETE_ANY_FILE, MANAGE_FOLDERS. 4 new permission bits. Admins/mods have all by default.
- **Community notifications:** Quiet update + badge. No push notification for uploads. Badge count on channel shows new files.
- **DM file type restrictions:** Configurable allowlist per user in settings. Default allows everything except executables.
- **Shared folder invites:** DM-based invite. Sender creates folder, sends special DM message. Recipient accepts/declines in chat. Folder appears in their Files page on accept.

### Encryption
- **DM file encryption:** HKDF(shared_secret, file_id) — unique key per file derived from DM shared secret. Both parties independently derive the same key.
- **Community key rotation:** Re-encrypt on key rotation via on-access strategy. Files are re-encrypted lazily when next accessed/downloaded.
- **AAD (Additional Authenticated Data):** file_id + chunk_index. Prevents chunk reordering and cross-file substitution.
- **Encryption visibility:** Lock icon on all encrypted files. Click shows: algorithm, key version, encrypted timestamp.
- **Key verification:** Automatic verification between peers. Warning shown if verification fails (MITM suspected). No manual verification needed.
- **Desktop (Tauri):** Native Rust crypto (ring/RustCrypto) for AES-256-GCM + HKDF. Same algorithms as WASM but with native performance. No WASM crypto on desktop.

### UI/UX
- **Files page placement:** Navigation rail icon between Home and Communities.
- **Files page layout:** Dashboard — top: active transfers bar. Middle: shared folder cards grid. Bottom: storage meter + quick actions.
- **Files page focus:** Shared Folders hub with on-demand sync. Manifest (file list) synced automatically, actual file contents downloaded on demand.
- **Shared folder creation:** Both from DM conversations AND from top-level Files page.
- **Storage manager:** Full suite — smart one-click cleanup, configurable auto-cleanup rules, AND detailed manual cleanup with per-folder usage breakdown.
- **Transfer state visualization:** Stepped progress indicator like a shipment tracker: Requesting → Negotiating → Transferring → Complete. Each step is a dot/segment.
- **Upload progress:** Ring indicator around Files nav icon while uploading. Hover shows popup with upload progress details.
- **Sync indicator:** Progress ring around folder icon showing sync percentage. Fills as files sync. Green ring when complete.
- **Detail panel:** Tabbed sections — Info (metadata, preview), Versions (history), Sharing (who has file, sync status).
- **Conflict resolution:** Prompt user to choose when sync conflicts detected: Keep yours / Keep theirs / Keep both.
- **Transfer panel:** Top bar in channel view for channel-specific transfers.
- **DM file message format:** New MessageContent variant with essential fields: file_id, filename, file_size, mime_type, optional text_content. Full file details fetched separately if needed.

### Components & Architecture
- **Wisp components:** Purely presentational. All logic in hooks/app layer. Full React + React Native parity from start.
- **Wisp website:** Match existing component registry pattern exactly for new components.
- **Rich previews:** Phased rollout. Phase 1: client-side image rendering + file type icons. Phase 2: PDF + audio. Phase 3: code highlighting + video.
- **Image thumbnails:** Client-side browser rendering via native image loading + CSS object-fit. No server-side generation.
- **Drag-and-drop:** Pragmatic Drag and Drop (web) + react-native-gesture-handler + Reanimated (mobile).
- **Storybook stories:** Interactive controls + separate stories for each state. Full prop documentation.
- **Offline behavior:** Smart queue with priority. Smallest files first. Files stored locally immediately, queue syncs when online.
- **Hook error handling:** Error state + retry pattern. Hooks return { error, retry } alongside data. Components show error UI with retry button. Error auto-clears on success.

### Testing
- **Strategy:** Comprehensive from start + integration tests + Chrome manual testing.
- **E2E:** Playwright multi-tab for automated P2P transfer testing.
- **Test structure:** Feature-based test files (community-files.spec.ts, dm-files.spec.ts, shared-folders.spec.ts, transfers.spec.ts).

### Implementation Priority
1. **Phase 2 (NEXT):** Service + Hooks — fix dm-files.ts, verify community.ts, rewrite useCommunityFiles, create useDmFiles. Gets existing UI working with real WASM data.
2. Phase 3: App integration — remove mocks, real uploads/downloads
3. Wisp components — build new components (can parallel with above)
4. Phase 4: P2P transfer protocol + libp2p
5. Phase 5: E2EE + top-level Files page
6. Phase 6: Full test suite

---

## Section 1: Rust Core — File Chunking & Storage

**Complexity: L | Dependencies: None (foundational)**
**Status: COMPLETED (Steps 1.1-1.5)**

### Steps

- [x] **1.1** Create chunking module at `umbra-core/src/storage/chunking.rs`
  - `FileChunk` struct: `chunk_id` (SHA-256 hex), `chunk_index`, `total_chunks`, `data`, `file_id`
  - `ChunkManifest` struct: `file_id`, `filename`, `total_size`, `chunk_size` (256KB default), `total_chunks`, `chunks: Vec<ChunkRef>`, `file_hash` (SHA-256 of full file)
  - `ChunkRef` struct: `chunk_id`, `chunk_index`, `size`, `hash`
  - `chunk_file(data, chunk_size) -> (ChunkManifest, Vec<FileChunk>)` — split, hash each chunk, hash full file
  - `reassemble_file(manifest, chunks) -> Vec<u8>` — sort by index, verify hashes, concatenate, verify final hash
  - `verify_chunk_hash(data, expected_hash) -> bool`
  - User-configurable chunk size: parameter passed through WASM, default 256KB
  - 11 unit tests: round-trip, 0-byte files, large files, corrupt detection, out-of-order, content addressing, serialization

- [x] **1.2** Add database schema migration for chunk storage + DM files
  - `file_chunks` table: `chunk_id TEXT PK`, `file_id`, `chunk_index`, `data BLOB`, `size`, `created_at`
  - `file_manifests` table: `file_id TEXT PK`, `filename`, `total_size`, `chunk_size`, `total_chunks`, `chunks_json`, `file_hash`, `encrypted`, `encryption_key_id`, `created_at`
  - `dm_shared_files` table: mirrors `community_files` with `conversation_id` + `encrypted_metadata`, `encryption_nonce`
  - `dm_shared_folders` table: mirrors `community_file_folders` with `conversation_id`
  - Schema version bumped 8 → 9

- [x] **1.3** Implement chunk storage + DM file Database methods
  - Chunk methods: `store_chunk`, `get_chunk`, `get_chunks_for_file`, `delete_chunks_for_file`
  - Manifest methods: `store_manifest`, `get_manifest`, `delete_manifest`
  - DM file methods: `store_dm_shared_file`, `get_dm_shared_files`, `get_dm_shared_file`, `increment_dm_file_download_count`, `delete_dm_shared_file`, `move_dm_shared_file`
  - DM folder methods: `create_dm_shared_folder`, `get_dm_shared_folders`, `delete_dm_shared_folder`, `rename_dm_shared_folder`
  - Both native (database.rs) and WASM (wasm_database.rs) implementations
  - WASM uses base64 encoding for BLOB chunk data

- [x] **1.4** Create DM file service at `umbra-core/src/messaging/files.rs`
  - `DmFileService` with `Arc<Database>`
  - File operations: `upload_file`, `get_files`, `get_file`, `record_download`, `delete_file`, `move_file`
  - Folder operations: `create_folder`, `get_folders`, `delete_folder`, `rename_folder`

- [x] **1.5** Re-export chunking module from `storage/mod.rs`

### New Step (from user decisions)

- [ ] **1.6** Add OPFS storage adapter for web chunk storage
  - Create `storage/opfs.rs` (WASM-only) — wraps OPFS File System API via js-sys
  - `store_chunk_opfs(chunk_id, data) -> Result<()>`
  - `get_chunk_opfs(chunk_id) -> Result<Vec<u8>>`
  - `delete_chunk_opfs(chunk_id) -> Result<()>`
  - `get_storage_usage() -> Result<u64>` — total bytes in OPFS
  - SQLite stores metadata; OPFS stores raw chunk bytes
  - Desktop: use standard filesystem in app data directory
  - **Verification:** Chunk store → retrieve round-trip in Chrome

- [ ] **1.7** Add file size limit enforcement
  - Web: 2GB hard limit, warn at 1.5GB suggesting desktop app
  - Desktop: no limit
  - Check in `chunk_file()` before processing
  - **Verification:** Web rejects >2GB, desktop accepts any size

- [ ] **1.8** Add auto-versioning logic
  - When uploading to community channel: check if filename exists in same folder
  - If exists: increment version, link to previous version ID
  - Store version chain in `file_manifests` (add `previous_version_id` field)
  - **Verification:** Upload same-name file twice → version 2 created, version 1 accessible

- [ ] **1.9** Add transfer state persistence
  - `transfer_sessions` table: `transfer_id TEXT PK`, `file_id`, `manifest_json`, `direction`, `peer_did`, `state`, `chunks_completed`, `bytes_transferred`, `started_at`, `updated_at`
  - DB methods: `store_transfer_session`, `get_transfer_session`, `get_incomplete_transfers`, `update_transfer_progress`, `delete_transfer_session`
  - **Verification:** Persist → restart → query returns incomplete transfers

---

## Section 2: Rust Core — P2P File Transfer Protocol

**Complexity: XL | Dependencies: Section 1**

### Steps

- [ ] **2.1** Define transfer protocol types at `umbra-core/src/network/file_transfer.rs`
  - `TransferState` enum: Requesting, Negotiating, Transferring, Paused, Completed, Failed, Cancelled
  - `TransferSession` struct: transfer_id, file_id, manifest, direction, peer_did, state, chunks_completed, bytes_transferred, speed_bps, started_at, transport_type
  - `TransferDirection` enum: Upload, Download
  - `TransportType` enum: WebRtcDirect, Relay, Libp2p
  - **Verification:** Compiles

- [ ] **2.2** Define transfer protocol messages (MessagePack serialized)
  - `FileTransferMessage` enum: TransferRequest, TransferAccept, TransferReject, ChunkData, ChunkAck, PauseTransfer, ResumeTransfer, CancelTransfer, TransferComplete, ChunkAvailability
  - Serialize with MessagePack (rmp-serde crate)
  - **Verification:** Serialization round-trip tests pass

- [ ] **2.3** Implement TransferManager — central coordinator
  - `HashMap<String, TransferSession>` keyed by transfer_id
  - `initiate_transfer(file_id, peer_did, manifest) -> transfer_id`
  - `accept_transfer(transfer_id)`, `pause_transfer`, `resume_transfer`, `cancel_transfer`
  - `on_message(from_did, FileTransferMessage)` — dispatch handler
  - Adaptive flow control: start with window of 2, grow to 8 based on ACK latency, shrink on timeouts
  - Speed calculation: rolling average over last 10 chunks
  - Concurrent limits: configurable max uploads + downloads (default 3+3, max 10+10)
  - Resume: persist state to DB, restart from `last_completed_chunk_index`
  - **Verification:** Rust unit tests for state machine, pause/resume, cancel, concurrent limits, adaptive window

- [ ] **2.4** Implement transport selection with fallback
  - Try WebRTC DataChannel first (configurable timeout, default 2s)
  - If WebRTC fails or times out, fall back to relay
  - Record which transport is active in `TransferSession.transport_type`
  - Emit transport type in progress events for UI transparency
  - Relay mode: smaller chunks (56KB) vs direct mode (256KB user-configurable)
  - **Files:** Modify `network/mod.rs`, `network/webrtc_transport.rs`
  - **Verification:** Transfer works via both WebRTC and relay in Chrome

- [ ] **2.5** Add relay signaling for file transfers
  - File transfer requests go through relay to reach NAT-blocked peers
  - Relay-cached files: configurable lifespan, skip for files >1GB
  - **Files:** Modify `network/relay_client.rs`
  - **Verification:** File transfer request arrives via relay

- [ ] **2.6** Emit progress events via event bridge
  - `{ domain: "file_transfer", type: "progress", transferId, chunksCompleted, totalChunks, bytesTransferred, speedBps, transportType }`
  - `{ domain: "file_transfer", type: "state_change", transferId, fromState, toState }`
  - `{ domain: "file_transfer", type: "complete", transferId, fileId }`
  - `{ domain: "file_transfer", type: "failed", transferId, error }`
  - `{ domain: "file_transfer", type: "request", transferId, fileId, manifest, fromDid }`
  - **Verification:** Events fire in browser console during transfer

- [ ] **2.7** Integrate libp2p Kademlia DHT for peer/content discovery
  - Add `rust-libp2p` dependency with kademlia, identify, and noise protocols
  - `DhtService` struct: bootstrap, put_provider, get_providers, find_peer
  - Content routing: register file manifests as DHT providers
  - Peer discovery: find peers by DID without relay
  - **Bootstrap:** Relay servers double as DHT bootstrap nodes. Peers connect to relay → join DHT. No new infrastructure.
  - Run as background task in WASM (via wasm-bindgen-futures)
  - **Files:** Create `network/dht.rs`, modify `network/mod.rs`
  - **Verification:** Two WASM instances discover each other via DHT bootstrap nodes

- [ ] **2.8** Implement tiered file caching (relay hot + boost warm)
  - **Relay (hot tier):** Small + recent files. Default 24h TTL. Files >1GB skip relay.
  - **Boost nodes (warm tier):** Larger/older files. Files migrate from relay to boost after 24h (time-based).
  - Boost nodes store encrypted chunks with configurable TTL per community
  - Integration with existing boost node infrastructure (`community/boost_nodes.rs`)
  - **Files:** Modify `network/relay_client.rs`, `community/boost_nodes.rs`
  - **Verification:** Upload file → appears on relay → after TTL migrates to boost node

- [ ] **2.9** Implement hybrid sync protocol for community files
  - **Real-time:** Broadcast `community_file_event` via relay for online peers (instant)
  - **Periodic Merkle:** Build Merkle tree of file records per channel. Compare roots every 5 min + on reconnect.
  - `MerkleSyncService`: compute_tree, compare_trees, identify_differences, exchange_records
  - Handles: missed events, offline peers, network partitions
  - **Files:** Create `community/file_sync.rs`
  - **Verification:** Two peers with different file states → sync → both converge

---

## Section 3: Rust WASM Bindings

**Complexity: L | Dependencies: Sections 1, 2**

### Steps

- [x] **3.1** Export community file WASM functions in `ffi/wasm.rs`
  - 8 functions: upload_file, get_files, get_file, delete_file, record_file_download, create_folder, get_folders, delete_folder
  - JSON helper functions: `community_file_to_json`, `community_folder_to_json`

- [x] **3.2** Export DM file WASM functions
  - 11 functions: upload_file, get_files, get_file, delete_file, record_file_download, move_file, create_folder, get_folders, delete_folder, rename_folder
  - JSON helpers: `dm_file_to_json`, `dm_folder_to_json`

- [x] **3.3** Export chunking WASM functions
  - `umbra_wasm_chunk_file(json)` — chunks + stores chunks + manifest in DB
  - `umbra_wasm_reassemble_file(json)` — reads from DB, verifies, returns base64
  - `umbra_wasm_get_file_manifest(json)` — reads manifest from DB

- [ ] **3.4** Export transfer control WASM functions
  - `umbra_wasm_transfer_initiate(json) -> Promise`
  - `umbra_wasm_transfer_accept(transfer_id) -> Promise`
  - `umbra_wasm_transfer_pause(transfer_id) -> String`
  - `umbra_wasm_transfer_resume(transfer_id) -> Promise`
  - `umbra_wasm_transfer_cancel(transfer_id) -> String`
  - `umbra_wasm_transfer_list() -> String`
  - `umbra_wasm_transfer_get(transfer_id) -> String`
  - `umbra_wasm_transfer_get_incomplete() -> String` — for resume on restart
  - **Verification:** Transfer lifecycle in Chrome between two tabs

- [ ] **3.5** Export file encryption WASM functions
  - `umbra_wasm_encrypt_file_chunk(json) -> String`
  - `umbra_wasm_decrypt_file_chunk(json) -> String`
  - `umbra_wasm_derive_file_key_for_dm(conversation_id, file_id) -> String`
  - `umbra_wasm_derive_file_key_for_channel(channel_id, file_id, key_version) -> String`
  - `umbra_wasm_verify_file_encryption_key(json) -> String` — auto-verification between peers
  - **Verification:** Encrypt → decrypt round-trip in Chrome console

- [x] **3.6** Update UmbraWasmModule TypeScript type definition in `umbra-wasm/loader.ts`
  - Added 21 function signatures to `UmbraWasmModule` interface
  - Added mappings in `buildModule()` function
  - Updated `tauri-backend.ts` with matching Tauri IPC implementations

- [ ] **3.7** Export OPFS storage WASM functions
  - `umbra_wasm_opfs_store_chunk(chunk_id, data_b64) -> String`
  - `umbra_wasm_opfs_get_chunk(chunk_id) -> String`
  - `umbra_wasm_opfs_delete_chunk(chunk_id) -> String`
  - `umbra_wasm_opfs_get_usage() -> String`
  - **Verification:** Store → retrieve chunk via OPFS in Chrome

- [ ] **3.8** Export DHT WASM functions
  - `umbra_wasm_dht_start(bootstrap_nodes_json) -> Promise`
  - `umbra_wasm_dht_put_provider(file_id) -> Promise`
  - `umbra_wasm_dht_get_providers(file_id) -> Promise<String>`
  - `umbra_wasm_dht_find_peer(did) -> Promise<String>`
  - **Verification:** DHT operations work in Chrome

---

## Section 4: TypeScript Service Layer

**Complexity: M | Dependencies: Section 3**

### Steps

- [ ] **4.1** Verify community.ts bridge functions match WASM export names
  - Existing `community.ts` functions call the correct WASM names
  - **Verification:** `service.getCommunityFiles()` returns data in Chrome console

- [ ] **4.2** Fix dm-files.ts bridge function signatures
  - Fix mismatches: `dm_get_file(id)` should pass JSON `{ id }`, not raw string
  - Fix `dm_record_file_download(id)` — same issue
  - Fix `dm_delete_folder(id)` — same issue
  - **Verification:** `service.getDmFiles()` returns data in Chrome console

- [ ] **4.3** Create FileTransferService at `umbra-service/src/file-transfer.ts`
  - `TransferProgress` interface: transferId, fileId, filename, direction, state, chunksCompleted, totalChunks, bytesTransferred, totalBytes, speedBps, peerDid, startedAt, transportType, error
  - Transfer control: `initiateTransfer`, `acceptTransfer`, `pauseTransfer`, `resumeTransfer`, `cancelTransfer`
  - Chunking: `chunkFile`, `reassembleFile`, `storeChunks`, `getChunk`
  - Events: `onTransferProgress(callback)`, `onTransferRequest(callback)` — returns unsubscribe
  - Resume: `getIncompleteTransfers()`, `resumeTransfer(transferId)`
  - Queue: priority queue with size-based ordering (smallest first)
  - **Verification:** TypeScript compiles, transfer lifecycle works

- [ ] **4.4** Update types.ts with transfer types
  - `TransferProgress`, `ChunkManifest`, `FileChunk`, `IncomingTransferRequest`
  - `TransportType`: 'webrtc' | 'relay' | 'libp2p'
  - `TransferState`: 'requesting' | 'negotiating' | 'transferring' | 'paused' | 'completed' | 'failed' | 'cancelled'
  - **Verification:** TypeScript compiles

- [ ] **4.5** Add transfer methods to UmbraService class in `service.ts`
  - Delegate to file-transfer module
  - Wire transfer event subscriptions via event bridge
  - **Verification:** All methods callable from service instance

- [ ] **4.6** Update index.ts exports
  - Export file-transfer module types and functions
  - **Verification:** Consumers can import from `@umbra/service`

- [ ] **4.7** Create StorageService at `umbra-service/src/storage-manager.ts`
  - `getStorageUsage() -> { total, byContext: { community, dm, sharedFolders, cache } }`
  - `smartCleanup() -> { bytesFreed }` — remove stale caches, old chunks, completed transfer data
  - `setAutoCleanupRules(rules)` — configurable cleanup rules
  - `getCleanupSuggestions() -> Suggestion[]` — largest files, duplicates, old cache
  - **Verification:** Storage usage query works in Chrome

---

## Section 5: Wisp Design System — New Components

**Complexity: L | Dependencies: None (can parallel with Sections 1-4)**

Each component follows the Wisp 7-step pattern: core types → core styles → React impl → RN impl → test → story → website registry → barrel exports.

**All components are purely presentational.** Logic lives in hooks/app layer.
**Full React + React Native parity from start.**

### Steps

- [ ] **5.1** FileTransferProgress component
  - **Core types:** `FileTransferProgress.types.ts`
    - TransferState enum, TransferDirection enum, TransportType
    - FileTransferProgressProps: filename, direction, state, steps (array of { label, status: pending|active|complete|error }), progress 0-100, bytesTransferred, totalBytes, speedBps, peerName, transportType, onPause/Resume/Cancel/Retry, onExpandDetails, expanded, compact mode, skeleton
  - **Visual:** Stepped progress (Requesting → Negotiating → Transferring → Complete) as dot/segment indicators. Each step lights up as transfer progresses.
  - **Expandable details:** Click to show peer address, chunk progress, retry count, connection quality. Settings toggle for "Technical transfer details."
  - **Core styles:** `FileTransferProgress.styles.ts`
  - **React:** `packages/react/src/components/file-transfer-progress/`
  - **React Native:** `packages/react-native/src/components/file-transfer-progress/`
  - **Test:** Unit tests for all states, all step combinations
  - **Story:** Interactive controls + separate stories for each state
  - **Registry:** Website entry with interactive demo
  - **Exports:** Both React + RN barrel exports
  - **Verification:** Renders in Storybook, appears on Wisp website, Chrome visual check

- [ ] **5.2** FileTransferList component
  - Props: transfers[], onClearCompleted, emptyText, skeleton, queuePosition per transfer
  - Renders list of FileTransferProgress items with header showing active/completed/queued counts
  - Queue indicator showing position for waiting transfers
  - Same 7-step pattern
  - **Verification:** Renders in Storybook, appears on Wisp website

- [ ] **5.3** SharedFolderCard component
  - Props: name, sharedWith (DIDs/names + avatars), fileCount, lastSyncAt, syncProgress (0-100), syncStatus (synced/syncing/offline/error), onClick, onSync, skeleton
  - **Visual:** Folder icon with progress ring overlay showing sync percentage. Green ring when synced. Animated ring when syncing. Sharing avatars row below name.
  - Same 7-step pattern
  - **Verification:** Renders in Storybook, appears on Wisp website

- [ ] **5.4** SyncStatusIndicator component
  - Props: status (synced/syncing/offline/error), progress (0-100), size (sm/md/lg), showLabel
  - Small badge with progress ring, green check when synced, animated when syncing
  - Same 7-step pattern
  - **Verification:** Renders in Storybook, appears on Wisp website

- [ ] **5.5** StorageUsageMeter component
  - Props: totalUsed, totalAvailable, breakdown (community, dm, sharedFolders, cache), onCleanup, onManageStorage, skeleton
  - Visual bar/pie showing usage breakdown by context. "Clean Up" and "Manage" action buttons.
  - Same 7-step pattern
  - **Verification:** Renders in Storybook, appears on Wisp website

- [ ] **5.6** ConflictResolutionDialog component
  - Props: filename, localVersion, remoteVersion, localModifiedBy, remoteModifiedBy, onKeepLocal, onKeepRemote, onKeepBoth, skeleton
  - Modal dialog: "This file was modified by both you and Alice. Keep yours / Keep theirs / Keep both?"
  - Shows file previews for both versions if possible (images)
  - Same 7-step pattern
  - **Verification:** Renders in Storybook, appears on Wisp website

- [ ] **5.7** FileTypeAllowlistSettings component
  - Props: allowedTypes[], blockedTypes[], onUpdate, presets (default, strict, permissive)
  - Settings panel for configuring accepted file types. Preset buttons + custom editing.
  - Same 7-step pattern
  - **Verification:** Renders in Storybook

- [ ] **5.8** Create missing core styles
  - `FileContextMenu.styles.ts`
  - `FileUploadZone.styles.ts`
  - **Verification:** `pnpm --filter website build` succeeds

- [ ] **5.9** Create missing website registry entries (6 existing components)
  - `file-card.tsx`, `file-channel-view.tsx`, `file-context-menu.tsx`, `file-detail-panel.tsx`, `file-upload-dialog.tsx`, `file-upload-zone.tsx`
  - Each with ComponentEntry, interactive demo, prop documentation
  - **Verification:** All appear on Wisp website

- [ ] **5.10** Fix React Native barrel exports — 7+ components missing from `packages/react-native/src/index.ts`
  - Add: FileCard, FileChannelView, FileContextMenu, FolderContextMenu, FileDetailPanel, FileUploadZone, FileUploadDialog, FolderCard
  - **Verification:** TypeScript compiles, components importable from `@coexist/wisp-react-native`

- [ ] **5.11** Add missing tests and stories for existing components
  - Tests: FileCard, FolderCard, FileUploadZone, FileContextMenu
  - Stories: FileContextMenu, FolderCard, FileUploadZone (interactive controls + all states)
  - **Verification:** All tests pass, all stories render in Storybook

- [ ] **5.12** Implement Pragmatic Drag and Drop (web) + gesture handler (RN)
  - Web: Pragmatic Drag and Drop for file grid reordering, folder drag, OS file drops
  - RN: react-native-gesture-handler + Reanimated for smooth drag animations
  - Shared drag-and-drop behavior types in core
  - **Verification:** Drag-and-drop works in both Storybook (web) and on device (RN)

---

## Section 6: Wisp — Existing Component Enhancements

**Complexity: M | Dependencies: Section 5**

### Steps

- [ ] **6.1** Enhance FileChannelView with transfer integration
  - Add `activeTransfers?: FileTransferProgressProps[]` prop — renders transfer bar at top of channel view
  - Add `onTransferPause/Resume/Cancel` callback props
  - Add `uploadRingProgress?: number` prop — for nav icon ring indicator
  - Update both React + RN implementations
  - **Verification:** Transfer progress renders in FileChannelView Storybook story

- [ ] **6.2** Enhance FileCard with sync/transfer status + encryption indicator
  - Add `syncStatus?: 'synced' | 'syncing' | 'downloading' | 'error'` prop
  - Add `transferProgress?: number` prop (0-100 overlay bar)
  - Add `encrypted?: boolean` prop — shows lock icon
  - Add `peerCount?: number` prop
  - Update both React + RN
  - **Verification:** Status indicators + lock icon visible in FileCard story

- [ ] **6.3** Enhance FileUploadDialog with chunking progress
  - Add `chunking?: boolean` prop — shows chunk progress
  - Add `chunksCompleted/totalChunks` props
  - Add `encryptionStatus?: 'encrypting' | 'encrypted' | 'none'` prop
  - Add folder upload support (recursive structure preservation)
  - Add file size warning for web >1.5GB, block at >2GB
  - Update both React + RN
  - **Verification:** Chunk progress + folder upload renders in story

- [ ] **6.4** Enhance FileDetailPanel with tabbed layout
  - **Info tab:** metadata, preview (client-side image rendering), file size, uploader, dates
  - **Versions tab:** version history list — `versions?: Array<{ version, uploadedAt, uploadedBy, size }>`, `onVersionClick`, `onRevert`
  - **Sharing tab:** `syncStatus` prop, `peers?: Array<{ name, did, hasFile, online }>`, encryption info (lock icon + algorithm + key version)
  - Update both React + RN
  - **Verification:** All tabs render correctly in FileDetailPanel story

- [ ] **6.5** Enhance FileChannelView with search
  - Add search bar: filename search + filters (type, date range, uploader, size range)
  - Add `onSearch(query, filters)` callback
  - Add `searchResults` prop to show filtered results
  - Update both React + RN
  - **Verification:** Search UI renders and fires callbacks in story

---

## Section 7: Umbra Hooks

**Complexity: M | Dependencies: Sections 3, 4**

### Steps

- [ ] **7.1** Rewrite useCommunityFiles hook — remove all WASM fallback/mock logic
  - Remove `wasmUnavailableRef` — WASM functions now exist
  - Add `uploadFileWithChunking(file: File, chunkSize?)` — reads File → chunks → encrypts → stores (OPFS + SQLite) → creates record → broadcasts relay event
  - Add `uploadFolder(files: FileList)` — recursive folder upload preserving structure
  - Add `searchFiles(query, filters)` — name + metadata search
  - Add `activeTransfers` state from file transfer events
  - Respect community permissions for upload/delete operations
  - Auto-versioning: detect same-name files, create new versions automatically
  - **Verification:** Upload file in Chrome → appears in list. Upload folder → structure preserved.

- [ ] **7.2** Create useDmFiles hook at `hooks/useDmFiles.ts`
  - Input: `conversationId: string`
  - Returns: files (flat list), type filters, CRUD ops, search
  - Flat list with filter by type (images, documents, media, other)
  - Subscribe to `dm_file_event` relay envelopes for real-time updates
  - File encryption: HKDF(shared_secret, file_id) — auto-derived
  - **Verification:** DM file operations work in Chrome console

- [ ] **7.3** Create useFileTransfer hook at `hooks/useFileTransfer.ts`
  - `activeTransfers`, `completedTransfers`, `queuedTransfers` state arrays
  - `initiateUpload(fileId, peerDid)`, `acceptDownload(transferId)`
  - `pauseTransfer`, `resumeTransfer`, `cancelTransfer`, `clearCompleted`
  - `totalUploadSpeed`, `totalDownloadSpeed` aggregates
  - Transport tag: expose which transport is active per transfer
  - Smart queue: size-based priority (smallest first)
  - Resume on mount: check DB for incomplete transfers, offer to resume
  - Subscribe to WASM event bridge `file_transfer` domain events
  - **Verification:** Transfer lifecycle works between two browser tabs

- [ ] **7.4** Create useSharedFolders hook at `hooks/useSharedFolders.ts`
  - Lists all shared folders across DM conversations + standalone shared folders
  - On-demand sync: auto-sync manifests (file lists), download contents on demand
  - `syncFolder(folderId)` — manual sync trigger
  - `syncProgress` per folder (0-100)
  - Conflict detection: detect when same file modified by both parties offline
  - **Verification:** Shared folders list populates, sync status updates

- [ ] **7.5** Create useStorageManager hook at `hooks/useStorageManager.ts`
  - `storageUsage` — total + per-context breakdown
  - `smartCleanup()` — one-click optimization
  - `cleanupSuggestions` — largest files, old caches, duplicates
  - `autoCleanupRules` — configurable auto-cleanup
  - **Verification:** Storage usage displays correctly

- [ ] **7.6** Create useUploadProgress hook at `hooks/useUploadProgress.ts`
  - Tracks all active uploads across the app
  - Provides `uploadRingProgress` (0-100) for nav icon ring indicator
  - Provides `activeUploadSummary` for hover popup content
  - **Verification:** Ring progress updates during uploads

---

## Section 8: Umbra App — Community Files Integration

**Complexity: M | Dependencies: Sections 3, 5, 7**

### Steps

- [ ] **8.1** Remove all mock data from FileChannelContent
  - Delete `MOCK_FILES`, `MOCK_FOLDERS` constants
  - Delete `mock` prop and all mock-related branching
  - Always use useCommunityFiles hook (now backed by real WASM)
  - **Verification:** File channel renders "No files yet" for empty channels in Chrome (no errors)

- [ ] **8.2** Integrate real upload flow
  - Add drag-and-drop (Pragmatic DnD on web, gesture handler on RN)
  - Add clipboard paste support (Ctrl+V for images/files)
  - Add upload button with file picker
  - Folder upload: preserve full directory structure
  - On file selection: read → chunk (configurable size) → encrypt → store (OPFS/filesystem + SQLite) → create file record → broadcast community event via relay
  - Show FileTransferProgress in channel top bar during upload
  - File size enforcement: 2GB limit on web with warning, no limit on desktop
  - **Verification:** Upload file + folder in Chrome → both appear in list correctly

- [ ] **8.3** Integrate real download flow
  - `onFileDownload` → initiate P2P transfer request (WebRTC first, relay fallback)
  - Show download progress via FileTransferProgress with transport tag
  - On completion: reassemble chunks → verify hashes → present file (download on web, share sheet on mobile)
  - **Verification:** Click download → transfer completes → file downloads

- [ ] **8.4** Create web-specific FileChannelContent using Wisp React FileChannelView
  - Create `FileChannelContentWeb.tsx` using full Wisp React FileChannelView with Pragmatic DnD
  - Platform-select between RN and web versions
  - Full drag-and-drop for file reordering, folder drops, OS file drops
  - **Verification:** Full drag-and-drop works in Chrome web view

- [ ] **8.5** Integrate file permissions
  - Check community role permissions before showing upload/delete buttons
  - Use existing permission bitfield system
  - Admin/mod: can delete any file. Members: upload and delete own files only.
  - **Verification:** Non-admin cannot delete others' files. Admin can delete any.

- [ ] **8.6** Integrate file search
  - Search bar in channel header: name + metadata filters
  - Type, date range, uploader, size range filters
  - Results update file grid in real-time
  - **Verification:** Search finds files by name and filters

- [ ] **8.7** Add upload progress ring to Files nav icon
  - Monitor active uploads via useUploadProgress hook
  - Render ring indicator around Files icon in navigation rail
  - Hover popup shows: filename, progress %, speed, ETA
  - **Verification:** Ring animates during upload, popup shows details

---

## Section 9: Umbra App — DM File Sharing

**Complexity: L | Dependencies: Sections 3, 7, 8**

### Steps

- [ ] **9.1** Create DmFileMessage component at `components/messaging/DmFileMessage.tsx`
  - Combined text + file card in message bubble (like WhatsApp)
  - Sender types message and attaches file — both appear together
  - Text on top, file card below
  - Lock icon on file card showing encryption status
  - Shows filename, size, download button, thumbnail if image
  - **Verification:** File message renders correctly in DM conversation in Chrome

- [ ] **9.2** Create DmSharedFilesPanel component at `components/messaging/DmSharedFilesPanel.tsx`
  - Sidebar panel (slides in from right, like member list area)
  - Flat file list with type-based filters: Images, Documents, Media, Other
  - Sort by date/name/size
  - Accessible via icon in DM conversation header
  - Uses useDmFiles hook
  - **Verification:** Open DM → click files icon → see file list in sidebar

- [ ] **9.3** Add file attachment to message input
  - Add attachment button to DM MessageInput
  - On file select: chunk → encrypt with HKDF(shared_secret, file_id) → store → create DM file record → send combined message (text + file) → broadcast dm_file_event via relay
  - File type restriction: check user's allowlist settings, warn on blocked types
  - **Verification:** Send file in DM → recipient sees file message with combined text + card

- [ ] **9.4** Rich file previews in message bubbles (Phase 1)
  - Images: client-side rendering via native image loading + CSS object-fit
  - Documents/other: FileCard with icon + download button
  - All file types supported by browser shown inline
  - **Verification:** Image file shows inline preview, PDF shows FileCard with icon

---

## Section 10: Umbra App — Top-Level Files Page

**Complexity: M | Dependencies: Sections 7, 8, 9**

### Steps

- [ ] **10.1** Add Files icon to navigation rail
  - Position: between Home and Communities
  - Icon: folder icon
  - Upload progress ring: thin ring around icon showing aggregate upload progress
  - Hover popup: shows active upload summary (filename, progress, speed)
  - `isFilesActive` prop, `onFilesPress` callback
  - Route to new `/files` page
  - **Verification:** Files icon appears, ring animates during uploads, popup works

- [ ] **10.2** Create Files page — Shared Folders Hub
  - **Primary section: Shared Folders** — grid of SharedFolderCard components
    - Show all shared folders (from DMs and standalone)
    - Each card: folder name, shared with avatars, file count, sync progress ring
    - Click to open folder contents
  - **Secondary section: Active Transfers** — FileTransferList component
    - Current uploads/downloads across all contexts
    - Transfer step indicators + transport tags
  - **Quick access: Community Files** — links to community file channels
  - **Bottom: Storage** — StorageUsageMeter with cleanup actions
  - **Verification:** Files page renders all sections in Chrome

- [ ] **10.3** Create shared folder from Files page
  - "New Shared Folder" button
  - Dialog: name folder, select contacts (by DID/username) to share with
  - Creates folder + sends invite to selected contacts
  - **Verification:** Create folder → invite contact → they see the shared folder

- [ ] **10.4** Create shared folder from DM conversation
  - Button in DM header: "Create Shared Folder"
  - Creates shared folder scoped to that conversation
  - Both participants can add/remove files
  - Folder appears in both users' Files page
  - **Verification:** Create from DM → folder visible in Files page for both users

- [ ] **10.5** Implement on-demand folder sync
  - Auto-sync folder manifests (file lists) when app opens
  - File contents only downloaded when user clicks/opens
  - SyncStatusIndicator on each folder/file
  - Manual "Sync Now" button per folder
  - **Verification:** Open shared folder → see file list (not downloaded) → click file → download starts

- [ ] **10.6** Implement full storage manager
  - View: per-context breakdown (community, DM, shared folders, cache)
  - Smart cleanup: one-click removal of stale caches, old chunks, completed transfer data
  - Configurable auto-cleanup rules: "Delete cached chunks after X days", "Remove transfer data after 24h"
  - Cleanup suggestions: largest files, duplicates, old cached chunks
  - **Verification:** Storage manager shows accurate usage, cleanup frees space

---

## Section 11: E2EE for Files

**Complexity: XL | Dependencies: Section 1, existing crypto module**

### Steps

- [ ] **11.1** Per-file encryption key derivation in `crypto/encryption.rs`
  - `derive_file_key(shared_secret, file_id) -> EncryptionKey`
  - HKDF-SHA256 with info `"umbra-file-encryption-v1"` and file_id as salt
  - Each file gets unique encryption key
  - **Verification:** Deterministic key derivation test in Rust

- [ ] **11.2** Chunk-level encryption in `storage/chunking.rs`
  - `encrypt_chunk(key, chunk, file_id, chunk_index) -> (Nonce, Vec<u8>)` — AES-256-GCM with AAD = `file_id || chunk_index`
  - `decrypt_chunk(key, nonce, encrypted_data, file_id, chunk_index) -> Vec<u8>`
  - `chunk_file_encrypted(data, chunk_size, file_key) -> (ChunkManifest, Vec<EncryptedChunk>)`
  - **Verification:** Encrypt → decrypt round-trip test, wrong key fails, AAD binding test

- [ ] **11.3** Key exchange for shared files
  - **DM files:** HKDF(ECDH conversation shared secret, file_id) → file key. Both parties independently derive.
  - **Community files:** channel group key + file_id → file key via HKDF. Track `key_version` per file for rotation.
  - **Verification:** Two users derive same file key for same conversation + file_id

- [ ] **11.4** On-access re-encryption for key rotation
  - When community key rotates, mark existing files as needing re-encryption
  - On next access/download: re-encrypt with new key, update records
  - Add `needs_reencryption` flag to file records
  - Background: don't proactively re-encrypt. Spread cost over time.
  - **Verification:** Rotate key → access file → file re-encrypted with new key

- [ ] **11.5** Automatic key verification between peers
  - On DM file exchange: both peers derive key independently, exchange key fingerprint
  - If fingerprints don't match: show prominent security warning in UI
  - No manual verification needed — automatic comparison
  - **Verification:** Matching keys: no warning. Tampered key: warning displayed.

- [ ] **11.6** Encryption UI indicators
  - Lock icon on every encrypted file (FileCard, FileDetailPanel)
  - Click lock: shows encryption algorithm (AES-256-GCM), key version, encrypted timestamp
  - **Verification:** Lock icons visible on all encrypted files, detail panel shows info

---

## Section 12: Testing & Verification

**Complexity: L | Dependencies: All prior sections**

### Steps

- [ ] **12.1** Rust unit tests (comprehensive)
  - Chunking: round-trip, 0-byte, multi-MB, hash verification, corrupt detection, user-configurable chunk size, auto-versioning
  - Transfer: state machine, pause/resume, cancel, concurrent limits, adaptive window, transport fallback
  - Encryption: key derivation determinism, encrypt/decrypt round-trip, wrong key, AAD binding, on-access re-encryption
  - OPFS adapter: store/retrieve/delete chunks
  - **Verification:** `cargo test` passes

- [ ] **12.2** TypeScript integration tests (comprehensive)
  - File transfer service: initiate/accept flow, progress events, pause/resume, cancel, queue priority
  - Community file CRUD via service with permissions
  - DM file CRUD + relay broadcasting + type allowlist
  - Storage manager: usage calculation, cleanup operations
  - **Verification:** All tests pass

- [ ] **12.3** Wisp component tests (interactive controls + all states)
  - FileTransferProgress: all transfer states, step indicator, expandable details
  - FileTransferList: empty, populated, queue positions, clear completed
  - SharedFolderCard: all sync states, progress ring, sharing avatars
  - SyncStatusIndicator: all states, all sizes
  - StorageUsageMeter: breakdown visualization, cleanup actions
  - ConflictResolutionDialog: all options, file previews
  - Existing file components: fill missing test gaps
  - **Verification:** All component tests pass

- [ ] **12.4** Playwright E2E tests (multi-tab P2P)
  - Full upload: select file → chunks in OPFS → record in list → relay broadcast
  - Full download: request transfer → chunks stream → reassemble → hash verified → download
  - P2P transfer: two Playwright tabs → transfer file with visible progress + transport tag
  - Resume: start transfer → close tab → reopen → resume from last chunk
  - E2EE: verify file encrypted in storage, decrypts only with correct key
  - DM files: send file message → recipient downloads → content matches
  - Shared folders: create → add files → on-demand sync → conflict resolution
  - Folder upload: drag folder → structure preserved in channel
  - **Verification:** All Playwright tests pass

- [ ] **12.5** Chrome manual verification
  - Full end-to-end flows with user at each step
  - Transport tag verification (shows "Direct" or "Relay" correctly)
  - Encryption lock icon verification
  - Upload ring indicator on Files nav icon
  - Storage manager accuracy
  - **Verification:** All flows complete successfully with user confirmation

---

## Implementation Sequence

**Phase 1 — Foundation (Rust + Wisp parallel):**
1. ~~Section 1.1-1.5 (Rust chunking + storage)~~ ✅ DONE
2. Section 1.6-1.9 (OPFS adapter, file size limits, auto-versioning, transfer persistence)
3. Section 5 (Wisp new components) — can run in parallel
4. ~~Section 3.1-3.3 (Community + DM file + chunking WASM exports)~~ ✅ DONE
5. ~~Section 3.6 (TypeScript interface update)~~ ✅ DONE

**Phase 2 — Service Layer:**
6. Section 4.1-4.2 (Fix and verify community.ts + dm-files.ts)
7. Section 6 (Wisp component enhancements)
8. Section 7.1-7.2 (useCommunityFiles rewrite + useDmFiles)

**Phase 3 — App Integration:**
9. Section 8 (Community files — real uploads/downloads/search/permissions)
10. Section 9 (DM file sharing — inline + sidebar panel)

**Phase 4 — P2P Transfer Protocol:**
11. Section 2 (P2P transfer protocol + libp2p DHT)
12. Section 3.4-3.5, 3.7-3.8 (Transfer + encryption + OPFS + DHT WASM exports)
13. Section 4.3-4.7 (FileTransferService + StorageService)
14. Section 7.3-7.6 (useFileTransfer + useSharedFolders + useStorageManager + useUploadProgress)

**Phase 5 — Encryption + Top-Level:**
15. Section 11 (E2EE for files — HKDF keys, chunk encryption, on-access re-encrypt, auto-verification)
16. Section 10 (Top-level Files page — shared folders hub + storage manager)

**Phase 6 — Testing:**
17. Section 12 (Full test suite — Rust, TypeScript, Wisp, Playwright E2E, Chrome manual)

---

## Critical File Paths

### Rust Core (`umbra-core/src/`)
| File | Action | Status |
|------|--------|--------|
| `storage/chunking.rs` | CREATE — chunking + reassembly + verification | ✅ DONE |
| `storage/schema.rs` | MODIFY — add 4 new tables + transfer_sessions | ✅ DONE (needs transfer_sessions) |
| `storage/database.rs` | MODIFY — add chunk + DM file + transfer DB methods | ✅ DONE (needs transfer methods) |
| `storage/wasm_database.rs` | MODIFY — mirror database.rs for WASM | ✅ DONE (needs transfer methods) |
| `storage/opfs.rs` | CREATE — OPFS storage adapter (WASM-only) | TODO |
| `storage/mod.rs` | MODIFY — re-export modules | ✅ DONE |
| `messaging/files.rs` | CREATE — DM file CRUD service | ✅ DONE |
| `messaging/mod.rs` | MODIFY — add files submodule | ✅ DONE |
| `network/file_transfer.rs` | CREATE — P2P transfer protocol + state machine | TODO |
| `network/dht.rs` | CREATE — libp2p Kademlia DHT integration | TODO |
| `network/mod.rs` | MODIFY — add file_transfer + dht modules | TODO |
| `crypto/encryption.rs` | MODIFY — add file key derivation + chunk encryption | TODO |
| `ffi/wasm.rs` | MODIFY — add WASM exports | ✅ PARTIAL (needs transfer, encryption, OPFS, DHT) |

### WASM + Service (`umbra-wasm/`, `umbra-service/src/`)
| File | Action | Status |
|------|--------|--------|
| `umbra-wasm/loader.ts` | MODIFY — UmbraWasmModule + buildModule | ✅ PARTIAL |
| `umbra-wasm/tauri-backend.ts` | MODIFY — Tauri IPC implementations | ✅ PARTIAL |
| `umbra-service/src/dm-files.ts` | MODIFY — fix signature mismatches | TODO |
| `umbra-service/src/file-transfer.ts` | CREATE — FileTransferService | TODO |
| `umbra-service/src/storage-manager.ts` | CREATE — StorageService | TODO |
| `umbra-service/src/types.ts` | MODIFY — add transfer + storage types | TODO |
| `umbra-service/src/service.ts` | MODIFY — add transfer + storage methods | TODO |
| `umbra-service/src/index.ts` | MODIFY — export new modules | TODO |

### Wisp Design System (`Wisp/packages/`)
| File | Action |
|------|--------|
| `core/src/types/FileTransferProgress.types.ts` | CREATE |
| `core/src/types/FileTransferList.types.ts` | CREATE |
| `core/src/types/SharedFolderCard.types.ts` | CREATE |
| `core/src/types/SyncStatusIndicator.types.ts` | CREATE |
| `core/src/types/StorageUsageMeter.types.ts` | CREATE |
| `core/src/types/ConflictResolutionDialog.types.ts` | CREATE |
| `core/src/types/FileTypeAllowlistSettings.types.ts` | CREATE |
| `core/src/styles/` (7 new + 2 missing) | CREATE |
| `react/src/components/` (7 new component dirs) | CREATE |
| `react-native/src/components/` (7 new component dirs) | CREATE |
| `react-native/src/index.ts` | MODIFY — add barrel exports |
| `website/src/registry/components/` (6 existing + 7 new entries) | CREATE |
| Existing components (FileChannelView, FileCard, FileUploadDialog, FileDetailPanel) | MODIFY — enhance props |

### Umbra App
| File | Action |
|------|--------|
| `hooks/useCommunityFiles.ts` | MODIFY — remove mocks, add real chunking + permissions + search |
| `hooks/useDmFiles.ts` | CREATE — DM file operations + type filters |
| `hooks/useFileTransfer.ts` | CREATE — transfer lifecycle + queue + resume |
| `hooks/useSharedFolders.ts` | CREATE — shared folder sync + conflict detection |
| `hooks/useStorageManager.ts` | CREATE — storage usage + cleanup |
| `hooks/useUploadProgress.ts` | CREATE — nav icon ring indicator |
| `components/community/FileChannelContent.tsx` | MODIFY — remove mocks, real uploads/downloads |
| `components/community/FileChannelContentWeb.tsx` | CREATE — web version with Pragmatic DnD |
| `components/messaging/DmFileMessage.tsx` | CREATE — combined text + file card |
| `components/messaging/DmSharedFilesPanel.tsx` | CREATE — sidebar file list with filters |
| `app/(main)/files.tsx` | CREATE — top-level Files page (shared folders hub) |
| Navigation rail component | MODIFY — add Files icon with upload ring |
