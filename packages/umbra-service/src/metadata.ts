/**
 * Account metadata sync module
 *
 * Provides functions for syncing account metadata (settings, preferences)
 * between sessions via relays. Uses the existing relay transport which
 * handles E2E encryption at the WASM layer.
 *
 * @packageDocumentation
 */

import { wasm, parseWasm } from './helpers';

/**
 * Send an account metadata update via relay to own DID.
 *
 * The relay treats `to_did: ownDid` like any other recipient — it queues
 * the message for that DID. Other sessions connecting with the same DID
 * will receive it via `offline_messages`. The payload is encrypted at the
 * relay transport level by the existing WASM encryption.
 *
 * @param relayWs - Active WebSocket connection to the relay
 * @param ownDid - Own DID (send to self for cross-session sync)
 * @param key - Metadata key
 * @param value - Metadata value
 */
export async function syncMetadataViaRelay(
  relayWs: WebSocket,
  ownDid: string,
  key: string,
  value: string,
): Promise<void> {
  if (!relayWs || relayWs.readyState !== WebSocket.OPEN) {
    console.warn('[metadata] Relay not connected, skipping metadata sync');
    return;
  }

  // Build envelope in Rust
  const json = JSON.stringify({ sender_did: ownDid, key, value });
  const resultJson = wasm().umbra_wasm_build_metadata_envelope(json);
  const rm = await parseWasm<{ toDid: string; payload: string }>(resultJson);

  try {
    relayWs.send(JSON.stringify({ type: 'send', to_did: rm.toDid, payload: rm.payload }));
  } catch (err) {
    console.warn('[metadata] Failed to send metadata via relay:', err);
  }
}
