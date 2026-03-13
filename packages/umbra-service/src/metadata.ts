/**
 * Account metadata sync module
 *
 * @deprecated This module is superseded by the encrypted blob sync system
 * in `sync.ts`. Use `uploadSyncBlob()` / `downloadSyncBlob()` from
 * `@umbra/service` instead. This module is retained only for backwards
 * compatibility with older relay sessions that may still send
 * `account_metadata` envelopes.
 *
 * @packageDocumentation
 */

import { wasm, parseWasm } from './helpers';

// Debug bridge — optional-chained since logger may not be initialized
function _dbg(): any { return (globalThis as any).__umbra_logger_instance; }
const SRC = 'svc:metadata';

/**
 * Send an account metadata update via relay to own DID.
 *
 * @deprecated Use `uploadSyncBlob()` from `@umbra/service` instead.
 * The new sync system uploads encrypted CBOR blobs via REST, replacing
 * per-key metadata messages. This function is a no-op and will be
 * removed in a future release.
 */
export async function syncMetadataViaRelay(
  _relayWs: WebSocket,
  _ownDid: string,
  _key: string,
  _value: string,
): Promise<void> {
  // No-op: replaced by SyncContext + uploadSyncBlob()
  _dbg()?.warn?.('service', 'syncMetadataViaRelay is deprecated — use SyncContext / uploadSyncBlob() instead', undefined, SRC);
}
