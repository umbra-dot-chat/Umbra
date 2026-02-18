/**
 * Account metadata sync module
 *
 * Provides functions for syncing account metadata (settings, preferences)
 * between sessions via relays. Uses the existing relay transport which
 * handles E2E encryption at the WASM layer.
 *
 * @packageDocumentation
 */

import type {
  RelayEnvelope,
  AccountMetadataPayload,
} from './types';

/**
 * Build a relay envelope for an account metadata update.
 *
 * @param senderDid - Own DID
 * @param key - Metadata key (e.g. 'message_display_mode')
 * @param value - Metadata value (plain string)
 * @returns A typed RelayEnvelope ready for transport
 */
export function buildMetadataEnvelope(
  senderDid: string,
  key: string,
  value: string,
): RelayEnvelope {
  return {
    envelope: 'account_metadata',
    version: 1,
    payload: {
      senderDid,
      key,
      value,
      timestamp: Date.now(),
    },
  };
}

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
export function syncMetadataViaRelay(
  relayWs: WebSocket,
  ownDid: string,
  key: string,
  value: string,
): void {
  if (!relayWs || relayWs.readyState !== WebSocket.OPEN) {
    console.warn('[metadata] Relay not connected, skipping metadata sync');
    return;
  }

  const envelope = buildMetadataEnvelope(ownDid, key, value);

  const relayMessage = JSON.stringify({
    type: 'send',
    to_did: ownDid,
    payload: JSON.stringify(envelope),
  });

  try {
    relayWs.send(relayMessage);
  } catch (err) {
    console.warn('[metadata] Failed to send metadata via relay:', err);
  }
}
