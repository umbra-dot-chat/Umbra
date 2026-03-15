# Fix: Ghost AI Messages Not Persisting ("..." After Refresh)

## Root Cause

When Ghost AI sends streaming updates via `chat_message_update`, the client handler at `useNetwork.ts:598` calls `service.editMessage()` to persist the final content. But `editMessage` → `umbra_wasm_messaging_edit` (wasm.rs:1871) has an **ownership check**: `if message.sender_did != our_did` → rejects. Ghost AI is the sender, not the user, so persistence silently fails. The initial message (often empty/placeholder) stays in the DB forever, decrypting to "..." on reload.

## Fix Strategy

**Store the raw ciphertext from the update payload directly** — no re-encryption needed. The `chat_message_update` already contains properly encrypted ciphertext + nonce + timestamp from Ghost AI. We just need a DB update path that skips ownership checks.

## Changes

### 1. Database layer — `packages/umbra-core/src/storage/database.rs`
Add `update_message_content()` — updates `content_encrypted`, `nonce`, and `timestamp` without the `edited` flag (this isn't a user edit, it's a content replacement):
```rust
pub fn update_message_content(&self, id: &str, new_content: &[u8], new_nonce: &[u8], timestamp: i64) -> Result<bool>
```
SQL: `UPDATE messages SET content_encrypted = ?, nonce = ?, timestamp = ? WHERE id = ?`

### 2. WASM database — `packages/umbra-core/src/storage/wasm_database.rs`
Add `update_message_content()` mirroring the same logic for the WASM SQLite backend.

### 3. WASM FFI — `packages/umbra-core/src/ffi/wasm.rs`
Add `umbra_wasm_messaging_update_incoming_content(json)`:
- Takes `{ message_id, content_encrypted (base64), nonce (hex), timestamp }`
- **No ownership check** — this is for incoming message updates
- Decodes base64 ciphertext → raw bytes, hex nonce → raw bytes
- Calls `database.update_message_content()`

### 4. Service layer — `packages/umbra-service/src/messaging.ts`
Add `updateIncomingMessageContent(messageId, contentEncrypted, nonce, timestamp)` that calls the new WASM function.

### 5. Service class — `packages/umbra-service/src/service.ts`
Expose the new method on UmbraService.

### 6. Client handler — `src/hooks/useNetwork.ts` (lines 584-602 and 783-790)
Replace:
```ts
service.editMessage(updatePayload.messageId, decryptedText)
```
With:
```ts
service.updateIncomingMessageContent(
  updatePayload.messageId,
  updatePayload.contentEncrypted,
  updatePayload.nonce,
  updatePayload.timestamp
)
```
This stores the raw ciphertext from Ghost AI directly — matching the AAD (sender+recipient+timestamp) used during encryption.

Also add the same persistence call to the offline handler at line ~788 which currently doesn't persist at all.

## Why This Works
- Ghost AI encrypts with AAD = `{ghost_did}{user_did}{timestamp}`
- We store that ciphertext + nonce + timestamp directly
- On reload, `umbra_wasm_messaging_decrypt` reconstructs AAD using `sender_did` (Ghost) + `our_did` (user) + `timestamp` → matches perfectly
- No ownership check needed since we're just storing the raw payload
