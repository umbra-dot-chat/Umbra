/**
 * Network and peer discovery module
 *
 * @packageDocumentation
 */

import { wasm, parseWasm } from './helpers';
import type { NetworkStatus, ConnectionInfo, DiscoveryResult, DiscoveryEvent } from './types';

// Debug bridge — optional-chained since logger may not be initialized
function _dbg(): any { return (globalThis as any).__umbra_logger_instance; }
const SRC = 'svc:network';

// ── Per-event-type relay stats ─────────────────────────────────────────────
const _relayStats = new Map<string, { count: number; totalBytes: number; maxBytes: number; totalMs: number; maxMs: number }>();

/** Record a network operation for aggregate stats. */
function _recordRelayOp(type: string, size: number, dur: number): void {
  let stats = _relayStats.get(type);
  if (!stats) {
    stats = { count: 0, totalBytes: 0, maxBytes: 0, totalMs: 0, maxMs: 0 };
    _relayStats.set(type, stats);
  }
  stats.count++;
  stats.totalBytes += size;
  if (size > stats.maxBytes) stats.maxBytes = size;
  stats.totalMs += dur;
  if (dur > stats.maxMs) stats.maxMs = dur;
}

// Log aggregate relay stats every 30 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    if (_relayStats.size === 0) return;
    const summary: Record<string, any> = {};
    for (const [type, s] of _relayStats) {
      summary[type] = {
        count: s.count,
        totalKB: (s.totalBytes / 1024).toFixed(1),
        avgMs: (s.totalMs / s.count).toFixed(1),
        maxMs: s.maxMs.toFixed(1),
      };
    }
    _dbg()?.info?.('network', 'relay stats (30s)', summary, SRC);
  }, 30_000);
}

/**
 * Start the network service
 *
 * Initializes the libp2p swarm with WebRTC transport.
 * Must be called after identity creation.
 */
export async function startNetwork(): Promise<void> {
  _dbg()?.info?.('network', 'Starting network...', undefined, SRC);
  const t0 = performance.now();
  await wasm().umbra_wasm_network_start();
  const dur = performance.now() - t0;
  _dbg()?.tracePerf?.('network', 'relay.send type=network_start size=0B', dur, SRC);
  _recordRelayOp('network_start', 0, dur);
  _dbg()?.info?.('network', 'Network started', undefined, SRC);
}

/**
 * Stop the network service
 */
export async function stopNetwork(): Promise<void> {
  _dbg()?.info?.('network', 'Stopping network...', undefined, SRC);
  const t0 = performance.now();
  await wasm().umbra_wasm_network_stop();
  const dur = performance.now() - t0;
  _dbg()?.tracePerf?.('network', 'relay.send type=network_stop size=0B', dur, SRC);
  _recordRelayOp('network_stop', 0, dur);
  _dbg()?.info?.('network', 'Network stopped', undefined, SRC);
}

/**
 * Create a WebRTC offer for signaling (step 1 of connection)
 *
 * Returns JSON string with SDP offer and ICE candidates.
 * Share this with the other peer via QR code or connection link.
 */
export async function createOffer(): Promise<string> {
  const t0 = performance.now();
  const result = await wasm().umbra_wasm_network_create_offer();
  const dur = performance.now() - t0;
  const size = result?.length ?? 0;
  _dbg()?.tracePerf?.('network', `relay.send type=create_offer size=${size}B`, dur, SRC);
  _recordRelayOp('create_offer', size, dur);
  return result;
}

/**
 * Accept a WebRTC offer and create an answer (step 2 of connection)
 *
 * Takes the offer JSON string from the other peer.
 * Returns JSON string with SDP answer and ICE candidates.
 */
export async function acceptOffer(offerJson: string): Promise<string> {
  const t0 = performance.now();
  const size = offerJson.length;
  const result = await wasm().umbra_wasm_network_accept_offer(offerJson);
  const dur = performance.now() - t0;
  const resultSize = result?.length ?? 0;
  _dbg()?.tracePerf?.('network', `relay.send type=accept_offer size=${size}B resultSize=${resultSize}B`, dur, SRC);
  _recordRelayOp('accept_offer', size + resultSize, dur);
  return result;
}

/**
 * Complete the WebRTC handshake (step 3 - offerer side)
 *
 * Takes the answer JSON string from the other peer.
 */
export async function completeHandshake(answerJson: string): Promise<void> {
  const t0 = performance.now();
  const size = answerJson.length;
  await wasm().umbra_wasm_network_complete_handshake(answerJson);
  const dur = performance.now() - t0;
  _dbg()?.tracePerf?.('network', `relay.send type=complete_handshake size=${size}B`, dur, SRC);
  _recordRelayOp('complete_handshake', size, dur);
}

/**
 * Complete the answerer side of the WebRTC connection
 *
 * Called after acceptOffer() to finalize the answerer's connection.
 * Pass the offerer's DID or PeerId from the original offer so the
 * swarm knows who the remote peer is.
 */
export async function completeAnswerer(offererDid?: string, offererPeerId?: string): Promise<void> {
  const t0 = performance.now();
  await wasm().umbra_wasm_network_complete_answerer(offererDid, offererPeerId);
  const dur = performance.now() - t0;
  _dbg()?.tracePerf?.('network', `relay.send type=complete_answerer size=0B`, dur, SRC);
  _recordRelayOp('complete_answerer', 0, dur);
}

/**
 * Get network status
 */
export async function getNetworkStatus(): Promise<NetworkStatus> {
  const t0 = performance.now();
  const statusJson = wasm().umbra_wasm_network_status();
  const result = await parseWasm<NetworkStatus>(statusJson);
  const dur = performance.now() - t0;
  const size = typeof statusJson === 'string' ? statusJson.length : 0;
  _dbg()?.tracePerf?.('network', `relay.send type=network_status size=${size}B`, dur, SRC);
  _recordRelayOp('network_status', size, dur);
  return result;
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
  const t0 = performance.now();
  const infoJson = wasm().umbra_wasm_discovery_get_connection_info();
  const result = await parseWasm<ConnectionInfo>(infoJson);
  const dur = performance.now() - t0;
  const size = typeof infoJson === 'string' ? infoJson.length : 0;
  _dbg()?.tracePerf?.('network', `relay.send type=get_connection_info size=${size}B`, dur, SRC);
  _recordRelayOp('get_connection_info', size, dur);
  return result;
}

/**
 * Parse connection info from a string (link, base64, or JSON)
 */
export async function parseConnectionInfo(info: string): Promise<ConnectionInfo> {
  const t0 = performance.now();
  const size = info.length;
  const resultJson = wasm().umbra_wasm_discovery_parse_connection_info(info);
  const result = await parseWasm<ConnectionInfo>(resultJson);
  const dur = performance.now() - t0;
  _dbg()?.tracePerf?.('network', `relay.send type=parse_connection_info size=${size}B`, dur, SRC);
  _recordRelayOp('parse_connection_info', size, dur);
  return result;
}

/**
 * Connect directly to a peer
 *
 * @param info - Connection info (from QR code or link)
 */
export async function connectDirect(info: ConnectionInfo): Promise<void> {
  _dbg()?.info?.('network', 'Direct connect requested', { did: info.did }, SRC);
  // TODO: Extract WebRTC offer from connection info and complete handshake
}

/**
 * Discovery event listener management
 */
export type DiscoveryListenerCallback = (event: DiscoveryEvent) => void;
