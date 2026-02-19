# File Sharing Test List

Comprehensive test checklist for all file sharing interactions across the Umbra stack.

---

## Section 1: Community File Channels

### 1.1 Channel CRUD
- [x] **T1.1.1** Create a community with a space ✅
- [x] **T1.1.2** Create a "files" type channel in the space ✅
- [x] **T1.1.3** Verify the channel appears in the sidebar with correct icon ✅ (BUG FIXED: space ID was set as categoryId)
- [x] **T1.1.4** Navigate into the file channel — empty state renders correctly ✅
- [ ] **T1.1.5** Delete the file channel
- [x] **T1.1.6** Create a file channel inside a category ✅

### 1.2 File Upload (Community)
- [x] **T1.2.1** Upload a small text file (<1KB) to a file channel ✅ (test-file.txt, 50 B)
- [x] **T1.2.2** Upload an image file (PNG/JPG) — verify thumbnail preview ✅ (test-image.png, 5.6 KB)
- [ ] **T1.2.3** Upload a large file (>256KB) that requires chunking
- [x] **T1.2.4** Verify file appears in the file list after upload ✅
- [ ] **T1.2.5** Upload a file with the same name — verify auto-versioning (v2)
- [ ] **T1.2.6** Upload multiple files in sequence
- [ ] **T1.2.7** Verify upload progress indicator appears during upload

### 1.3 File Listing & Navigation (Community)
- [ ] **T1.3.1** View file list in grid view
- [ ] **T1.3.2** View file list in list view
- [ ] **T1.3.3** Sort files by name (ascending/descending)
- [ ] **T1.3.4** Sort files by size
- [ ] **T1.3.5** Sort files by date
- [ ] **T1.3.6** Sort files by type
- [ ] **T1.3.7** Verify file metadata displays: name, size, MIME type, uploader, date

### 1.4 Folder Management (Community)
- [ ] **T1.4.1** Create a folder in the root of a file channel
- [ ] **T1.4.2** Create a nested folder (subfolder inside a folder)
- [ ] **T1.4.3** Navigate into a folder — breadcrumb updates correctly
- [ ] **T1.4.4** Navigate back using breadcrumb
- [ ] **T1.4.5** Upload a file inside a folder
- [ ] **T1.4.6** Delete a folder — verify cascade deletion
- [ ] **T1.4.7** Verify folder tree sidebar navigation

### 1.5 File Download (Community)
- [ ] **T1.5.1** Download a file from a file channel
- [ ] **T1.5.2** Verify download count increments after download
- [ ] **T1.5.3** Download a chunked file — verify reassembly

### 1.6 File Deletion (Community)
- [ ] **T1.6.1** Delete a file from a file channel
- [ ] **T1.6.2** Verify file disappears from the list after deletion
- [ ] **T1.6.3** Verify audit log records the deletion

### 1.7 File Detail Panel (Community)
- [ ] **T1.7.1** Click a file to open the detail panel
- [ ] **T1.7.2** Verify detail panel shows: name, size, MIME type, uploader, date, download count
- [ ] **T1.7.3** Download from the detail panel
- [ ] **T1.7.4** Close the detail panel

---

## Section 2: DM File Sharing

### 2.1 DM File Upload
- [ ] **T2.1.1** Upload a file in a DM conversation
- [ ] **T2.1.2** Verify file message renders with file attachment UI
- [ ] **T2.1.3** Verify encryption indicator (lock icon) is shown
- [ ] **T2.1.4** Upload an image — verify thumbnail preview

### 2.2 DM Shared Files Panel
- [ ] **T2.2.1** Open the shared files panel in a DM
- [ ] **T2.2.2** Verify all shared files are listed
- [ ] **T2.2.3** Filter by "Images" tab
- [ ] **T2.2.4** Filter by "Documents" tab
- [ ] **T2.2.5** Filter by "Media" tab
- [ ] **T2.2.6** Download a file from the shared files panel

### 2.3 DM Folder Management
- [ ] **T2.3.1** Create a folder in a DM conversation
- [ ] **T2.3.2** Upload a file into a DM folder
- [ ] **T2.3.3** Move a file between DM folders
- [ ] **T2.3.4** Rename a DM folder
- [ ] **T2.3.5** Delete a DM folder

### 2.4 DM File Event Broadcasting
- [ ] **T2.4.1** Upload a file in a DM — verify recipient sees the file event
- [ ] **T2.4.2** Delete a file — verify recipient sees the deletion event

---

## Section 3: File Encryption (E2EE)

### 3.1 Key Derivation
- [ ] **T3.1.1** Derive a file key for a DM file — verify key is deterministic
- [ ] **T3.1.2** Derive a channel file key — verify key is deterministic
- [ ] **T3.1.3** Compute key fingerprint — verify reproducibility
- [ ] **T3.1.4** Verify key fingerprint — should return `verified: true` for matching keys

### 3.2 Chunk Encryption/Decryption
- [ ] **T3.2.1** Encrypt a file chunk — verify output has nonce + encrypted data
- [ ] **T3.2.2** Decrypt the encrypted chunk — verify original data is restored
- [ ] **T3.2.3** Attempt decryption with wrong key — should fail

### 3.3 Re-encryption
- [ ] **T3.3.1** Mark files for re-encryption (key rotation scenario)
- [ ] **T3.3.2** Get files needing re-encryption
- [ ] **T3.3.3** Clear re-encryption flag after processing

---

## Section 4: File Chunking

### 4.1 Chunk Operations
- [ ] **T4.1.1** Chunk a small file (<256KB) — verify single chunk
- [ ] **T4.1.2** Chunk a large file (>256KB) — verify multiple chunks
- [ ] **T4.1.3** Get file manifest — verify total_chunks, chunk_size, file_hash
- [ ] **T4.1.4** Reassemble chunks back into original file — verify hash matches

---

## Section 5: P2P File Transfer Protocol

### 5.1 Transfer Initiation
- [ ] **T5.1.1** Initiate a file transfer — verify TransferRequest message is created
- [ ] **T5.1.2** Verify transfer session is created with state "Requesting"
- [ ] **T5.1.3** Verify concurrent upload limit (max 3 simultaneous uploads)

### 5.2 Transfer Accept/Reject
- [ ] **T5.2.1** Accept an incoming transfer — verify state changes to "Negotiating"
- [ ] **T5.2.2** Accept with existing chunks (resume scenario) — verify chunks marked
- [ ] **T5.2.3** Reject an incoming transfer — verify state changes to "Cancelled"
- [ ] **T5.2.4** Verify concurrent download limit (max 3 simultaneous downloads)

### 5.3 Chunk Transfer
- [ ] **T5.3.1** Send chunk data — verify chunk_index, data_b64, hash
- [ ] **T5.3.2** Receive chunk acknowledgment — verify success flag
- [ ] **T5.3.3** Verify adaptive flow control window grows (2 -> 3 after 4 ACKs)
- [ ] **T5.3.4** Verify flow control window shrinks on timeout (halved)
- [ ] **T5.3.5** Verify speed tracking updates during transfer

### 5.4 Transfer Control
- [ ] **T5.4.1** Pause an active transfer — verify state changes to "Paused"
- [ ] **T5.4.2** Resume a paused transfer — verify state changes to "Transferring"
- [ ] **T5.4.3** Cancel a transfer — verify state changes to "Cancelled"
- [ ] **T5.4.4** Verify TransferComplete message is sent when all chunks are done

### 5.5 Transfer Progress & Events
- [ ] **T5.5.1** Verify progress events are emitted during transfer
- [ ] **T5.5.2** Verify state change events are emitted
- [ ] **T5.5.3** Verify completion event is emitted
- [ ] **T5.5.4** Verify failure event is emitted on error

### 5.6 Transfer Resume
- [ ] **T5.6.1** Get incomplete transfers (for app restart recovery)
- [ ] **T5.6.2** Resume transfer with chunk availability — only missing chunks sent

---

## Section 6: Network Integration (libp2p)

### 6.1 Codec & Wire Protocol
- [ ] **T6.1.1** Serialize FileTransfer request via bincode (JSON-wrapped) — verify roundtrip
- [ ] **T6.1.2** Serialize FileTransfer response via bincode — verify roundtrip
- [ ] **T6.1.3** Verify 256KB chunk fits within 512KB message limit
- [ ] **T6.1.4** Verify oversized messages are rejected

### 6.2 Event Loop Routing
- [ ] **T6.2.1** Inbound FileTransfer request routes to TransferManager
- [ ] **T6.2.2** TransferManager response is sent back via UmbraResponse
- [ ] **T6.2.3** Transfer events are emitted to event subscribers
- [ ] **T6.2.4** Inbound FileTransfer response routes to TransferManager

### 6.3 Network Commands
- [ ] **T6.3.1** SendFileTransferMessage command sends request to peer
- [ ] **T6.3.2** StartProviding command announces file on DHT
- [ ] **T6.3.3** GetProviders command discovers file providers
- [ ] **T6.3.4** StopProviding command removes DHT announcement

### 6.4 DHT Content Discovery
- [ ] **T6.4.1** Start providing a file — verify DHT record created
- [ ] **T6.4.2** Get providers for a file — verify FileProviders event emitted
- [ ] **T6.4.3** Stop providing a file

### 6.5 Transport Selection
- [ ] **T6.5.1** Direct peer on native — selects Libp2p transport
- [ ] **T6.5.2** Direct peer on WASM — selects WebRtcDirect transport
- [ ] **T6.5.3** Unreachable peer — falls back to Relay transport
- [ ] **T6.5.4** prefer_direct=false — always selects Relay

### 6.6 Relay File Transfer
- [ ] **T6.6.1** Verify RelayClientMessage::FileTransfer variant exists
- [ ] **T6.6.2** Verify RelayServerMessage::FileTransferMessage variant exists

---

## Section 7: WASM FFI & TypeScript Bindings

### 7.1 DHT WASM Exports
- [ ] **T7.1.1** Call `umbra_wasm_dht_start_providing` — verify no error
- [ ] **T7.1.2** Call `umbra_wasm_dht_get_providers` — verify no error
- [ ] **T7.1.3** Call `umbra_wasm_dht_stop_providing` — verify no error

### 7.2 Transfer WASM Exports
- [ ] **T7.2.1** Call `umbra_wasm_transfer_initiate` — verify returns transfer progress
- [ ] **T7.2.2** Call `umbra_wasm_transfer_list` — verify returns array
- [ ] **T7.2.3** Call `umbra_wasm_transfer_get_incomplete` — verify returns array

### 7.3 TypeScript Loader Interface
- [ ] **T7.3.1** Verify UmbraWasmModule includes DHT functions
- [ ] **T7.3.2** Verify buildModule maps DHT functions to wasmPkg
- [ ] **T7.3.3** Verify Tauri backend includes DHT IPC stubs

---

## Section 8: UI Integration (Files Page)

### 8.1 Active Transfers Display
- [ ] **T8.1.1** Active transfer shows progress bar
- [ ] **T8.1.2** Active transfer shows speed indicator
- [ ] **T8.1.3** Active transfer shows transport type badge
- [ ] **T8.1.4** Pause button works on active transfer
- [ ] **T8.1.5** Resume button works on paused transfer
- [ ] **T8.1.6** Cancel button works on active transfer

### 8.2 Storage Management
- [ ] **T8.2.1** Storage usage meter displays correctly
- [ ] **T8.2.2** Smart cleanup button triggers cleanup
- [ ] **T8.2.3** Auto-cleanup rules can be configured

---

## Section 9: Multi-User Scenarios

### 9.1 Two Users — Community File Sharing
- [ ] **T9.1.1** User A creates community with file channel
- [ ] **T9.1.2** User B joins the community
- [ ] **T9.1.3** User A uploads a file — User B sees the file in the channel
- [ ] **T9.1.4** User B downloads the file — verify integrity
- [ ] **T9.1.5** User B uploads a file — User A sees the file
- [ ] **T9.1.6** User A deletes a file — User B sees it removed

### 9.2 Two Users — DM File Sharing
- [ ] **T9.2.1** User A and User B are friends
- [ ] **T9.2.2** User A sends a file in DM — User B receives the file event
- [ ] **T9.2.3** User B downloads the file from DM
- [ ] **T9.2.4** User A creates a shared folder — User B sees the folder

### 9.3 Two Users — P2P Transfer
- [ ] **T9.3.1** User A initiates P2P transfer to User B
- [ ] **T9.3.2** User B receives transfer request
- [ ] **T9.3.3** User B accepts — chunked transfer begins
- [ ] **T9.3.4** Transfer completes — both users see completion event
- [ ] **T9.3.5** Verify file integrity via hash comparison

---

## Section 10: Error Handling & Edge Cases

### 10.1 Upload Errors
- [ ] **T10.1.1** Upload with missing required fields — verify error message
- [ ] **T10.1.2** Upload to non-existent channel — verify error
- [ ] **T10.1.3** Upload when not a community member — verify permission error

### 10.2 Transfer Errors
- [ ] **T10.2.1** Accept non-existent transfer — verify error
- [ ] **T10.2.2** Pause already-paused transfer — verify error
- [ ] **T10.2.3** Resume non-paused transfer — verify error
- [ ] **T10.2.4** Cancel completed transfer — verify error

### 10.3 Network Errors
- [ ] **T10.3.1** Network disconnection during transfer — verify graceful handling
- [ ] **T10.3.2** Malformed FileTransferMessage — verify error logged, ACK sent

---

*Total: ~120 test cases across 10 sections*
*Generated: 2026-02-18*
