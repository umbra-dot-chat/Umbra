/**
 * WispCallHandler -- answers incoming WebRTC calls with test signals.
 *
 * Uses @roamhq/wrtc for server-side WebRTC. Sends SMPTE color bars
 * (video) and a 440Hz sine wave (audio) to the caller.
 */

import type { WispIdentity } from '../identity-store.js';
import type { RelayClient } from '../relay-client.js';

export interface ActiveWispCall {
  callId: string;
  peerDid: string;
  callType: 'voice' | 'video';
  peer: RTCPeerConnection;
  audioInterval: ReturnType<typeof setInterval> | null;
  videoInterval: ReturnType<typeof setInterval> | null;
}

// Lazy-loaded wrtc module (CommonJS)
let wrtcModule: typeof import('@roamhq/wrtc') | null = null;

function loadWrtc(): typeof import('@roamhq/wrtc') | null {
  if (wrtcModule) return wrtcModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    wrtcModule = require('@roamhq/wrtc');
    return wrtcModule;
  } catch {
    return null;
  }
}

export class WispCallHandler {
  readonly identity: WispIdentity;
  readonly relay: RelayClient;
  readonly wispName: string;
  activeCall: ActiveWispCall | null = null;

  constructor(
    identity: WispIdentity,
    relay: RelayClient,
    wispName: string,
  ) {
    this.identity = identity;
    this.relay = relay;
    this.wispName = wispName;
  }

  get enabled(): boolean {
    return loadWrtc() !== null;
  }

  get busy(): boolean {
    return this.activeCall !== null;
  }

  static loadWrtc = loadWrtc;

  handleIceCandidate(payload: {
    callId: string;
    candidate: string;
    sdpMid: string | null;
    sdpMLineIndex: number | null;
  }): void {
    if (!this.activeCall) return;
    if (this.activeCall.callId !== payload.callId) return;
    try {
      void this.activeCall.peer.addIceCandidate({
        candidate: payload.candidate,
        sdpMid: payload.sdpMid ?? undefined,
        sdpMLineIndex: payload.sdpMLineIndex ?? undefined,
      });
    } catch { /* ignore late candidates */ }
  }

  handleEnd(payload: { callId: string }): void {
    if (this.activeCall?.callId === payload.callId) {
      this.cleanup();
    }
  }

  cleanup(): void {
    if (!this.activeCall) return;
    if (this.activeCall.audioInterval) {
      clearInterval(this.activeCall.audioInterval);
    }
    if (this.activeCall.videoInterval) {
      clearInterval(this.activeCall.videoInterval);
    }
    try { this.activeCall.peer.close(); } catch { /* ok */ }
    console.log(
      `[${this.wispName}] Call ` +
      `${this.activeCall.callId.slice(0, 12)}... ended`,
    );
    this.activeCall = null;
  }
}
