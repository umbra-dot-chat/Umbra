/**
 * Relay server communication module
 *
 * @packageDocumentation
 */

import { wasm, parseWasm } from './helpers';
import type { RelayStatus, RelaySession, RelayAcceptResult, RelayEvent } from './types';

/**
 * Connect to a relay server
 *
 * Returns connection info for the JS layer to establish the WebSocket.
 * The actual WebSocket is managed by the useNetwork hook.
 *
 * @param relayUrl - WebSocket URL of the relay server (e.g., "wss://relay.umbra.app/ws")
 * @returns Connection info including the register message to send
 */
export async function connectRelay(
  relayUrl: string
): Promise<RelayStatus & { registerMessage: string }> {
  const resultJson = await wasm().umbra_wasm_relay_connect(relayUrl);
  return await parseWasm<RelayStatus & { registerMessage: string }>(resultJson);
}

/**
 * Disconnect from the relay server
 */
export async function disconnectRelay(): Promise<void> {
  await wasm().umbra_wasm_relay_disconnect();
}

/**
 * Create a signaling session for single-scan friend adding
 *
 * Generates an SDP offer, returns the data needed to:
 * 1. Send a create_session message to the relay via WebSocket
 * 2. Generate a QR code/link with the session ID
 *
 * @param relayUrl - Relay server URL
 * @returns Session data including the offer and relay message
 */
export async function createOfferSession(relayUrl: string): Promise<RelaySession> {
  const resultJson = await wasm().umbra_wasm_relay_create_session(relayUrl);
  const raw = await parseWasm<{
    relayUrl: string;
    did: string;
    peerId: string;
    offerPayload: string;
    createSessionMessage: string;
  }>(resultJson);

  return {
    ...raw,
    sessionId: '', // Set by the relay response
    link: '', // Set after session creation
  };
}

/**
 * Accept/join a relay session (the "scanner" side)
 *
 * Takes the session ID and offer payload from the relay,
 * generates an SDP answer, and returns the data to send back.
 *
 * @param sessionId - Session ID from the scanned QR code/link
 * @param offerPayload - The SDP offer payload from the session
 * @returns Answer data including the relay message to send back
 */
export async function acceptSession(
  sessionId: string,
  offerPayload: string
): Promise<RelayAcceptResult> {
  const resultJson = await wasm().umbra_wasm_relay_accept_session(sessionId, offerPayload);
  return await parseWasm<RelayAcceptResult>(resultJson);
}

/**
 * Send a message through the relay (for offline delivery)
 *
 * @param toDid - Recipient's DID
 * @param payload - Encrypted message payload
 * @returns Relay message to send via WebSocket
 */
export async function relaySend(
  toDid: string,
  payload: string
): Promise<{ relayMessage: string }> {
  const resultJson = await wasm().umbra_wasm_relay_send(toDid, payload);
  return await parseWasm<{ relayMessage: string }>(resultJson);
}

/**
 * Fetch offline messages from the relay
 *
 * @returns The fetch_offline message to send via WebSocket
 */
export async function relayFetchOffline(): Promise<string> {
  return wasm().umbra_wasm_relay_fetch_offline();
}

/**
 * Relay event listener management
 */
export type RelayListenerCallback = (event: RelayEvent) => void;
