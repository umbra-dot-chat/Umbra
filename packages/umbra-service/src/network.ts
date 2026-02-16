/**
 * Network and peer discovery module
 *
 * @packageDocumentation
 */

import { wasm, parseWasm } from './helpers';
import type { NetworkStatus, ConnectionInfo, DiscoveryResult, DiscoveryEvent } from './types';

/**
 * Start the network service
 *
 * Initializes the libp2p swarm with WebRTC transport.
 * Must be called after identity creation.
 */
export async function startNetwork(): Promise<void> {
  console.log('[UmbraService] Starting network...');
  await wasm().umbra_wasm_network_start();
  console.log('[UmbraService] Network started');
}

/**
 * Stop the network service
 */
export async function stopNetwork(): Promise<void> {
  console.log('[UmbraService] Stopping network...');
  await wasm().umbra_wasm_network_stop();
  console.log('[UmbraService] Network stopped');
}

/**
 * Create a WebRTC offer for signaling (step 1 of connection)
 *
 * Returns JSON string with SDP offer and ICE candidates.
 * Share this with the other peer via QR code or connection link.
 */
export async function createOffer(): Promise<string> {
  return wasm().umbra_wasm_network_create_offer();
}

/**
 * Accept a WebRTC offer and create an answer (step 2 of connection)
 *
 * Takes the offer JSON string from the other peer.
 * Returns JSON string with SDP answer and ICE candidates.
 */
export async function acceptOffer(offerJson: string): Promise<string> {
  return wasm().umbra_wasm_network_accept_offer(offerJson);
}

/**
 * Complete the WebRTC handshake (step 3 - offerer side)
 *
 * Takes the answer JSON string from the other peer.
 */
export async function completeHandshake(answerJson: string): Promise<void> {
  await wasm().umbra_wasm_network_complete_handshake(answerJson);
}

/**
 * Complete the answerer side of the WebRTC connection
 *
 * Called after acceptOffer() to finalize the answerer's connection.
 * Pass the offerer's DID or PeerId from the original offer so the
 * swarm knows who the remote peer is.
 */
export async function completeAnswerer(offererDid?: string, offererPeerId?: string): Promise<void> {
  await wasm().umbra_wasm_network_complete_answerer(offererDid, offererPeerId);
}

/**
 * Get network status
 */
export async function getNetworkStatus(): Promise<NetworkStatus> {
  const statusJson = wasm().umbra_wasm_network_status();
  return await parseWasm<NetworkStatus>(statusJson);
}

/**
 * Look up a peer by DID
 *
 * @param _did - The peer's DID
 * @returns Discovery result
 */
export async function lookupPeer(_did: string): Promise<DiscoveryResult> {
  // DHT lookup not yet available via DummyTransport
  return { status: 'notFound' };
}

/**
 * Get our connection info for sharing
 *
 * Returns information that can be encoded in a QR code or link
 * for others to connect to us directly.
 */
export async function getConnectionInfo(): Promise<ConnectionInfo> {
  const infoJson = wasm().umbra_wasm_discovery_get_connection_info();
  return await parseWasm<ConnectionInfo>(infoJson);
}

/**
 * Parse connection info from a string (link, base64, or JSON)
 */
export async function parseConnectionInfo(info: string): Promise<ConnectionInfo> {
  const resultJson = wasm().umbra_wasm_discovery_parse_connection_info(info);
  return await parseWasm<ConnectionInfo>(resultJson);
}

/**
 * Connect directly to a peer
 *
 * @param info - Connection info (from QR code or link)
 */
export async function connectDirect(info: ConnectionInfo): Promise<void> {
  console.log('[UmbraService] Direct connect requested for:', info.did);
  // TODO: Extract WebRTC offer from connection info and complete handshake
}

/**
 * Discovery event listener management
 */
export type DiscoveryListenerCallback = (event: DiscoveryEvent) => void;
