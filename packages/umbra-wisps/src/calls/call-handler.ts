/**
 * WispCallHandler -- answers incoming WebRTC calls with test signals.
 *
 * Uses @roamhq/wrtc for server-side WebRTC. Sends SMPTE color bars
 * (video) and a 440Hz sine wave (audio) to the caller.
 */

import type { WispIdentity } from '../identity-store.js';
import type { RelayClient } from '../relay-client.js';
import { AudioSignalGenerator, VideoSignalGenerator, VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS } from './test-signals.js';

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

  async handleOffer(payload: {
    callId: string; sdp: string; callType: string;
    senderDid: string; conversationId: string;
  }): Promise<void> {
    const wrtc = loadWrtc();
    if (!wrtc) return;

    if (this.activeCall) {
      this.relay.sendEnvelope(payload.senderDid, {
        envelope: 'call_end', version: 1,
        payload: { callId: payload.callId, reason: 'busy',
          endedBy: this.identity.did, timestamp: Date.now() },
      });
      return;
    }

    const { RTCPeerConnection, RTCSessionDescription, MediaStream, nonstandard } = wrtc;
    const { RTCAudioSource, RTCVideoSource } = nonstandard;

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    const stream = new MediaStream();

    // Audio track (always)
    const audioSrc = new RTCAudioSource();
    stream.addTrack(audioSrc.createTrack());
    peer.addTrack(stream.getAudioTracks()[0], stream);

    // Video track (video calls only)
    let videoSrc: InstanceType<typeof RTCVideoSource> | null = null;
    if (payload.callType === 'video') {
      videoSrc = new RTCVideoSource();
      stream.addTrack(videoSrc.createTrack());
      peer.addTrack(stream.getVideoTracks()[0], stream);
    }

    peer.onicecandidate = (ev) => {
      if (!ev.candidate) return;
      this.relay.sendEnvelope(payload.senderDid, {
        envelope: 'call_ice_candidate', version: 1,
        payload: { callId: payload.callId, candidate: ev.candidate.candidate,
          sdpMid: ev.candidate.sdpMid, sdpMLineIndex: ev.candidate.sdpMLineIndex },
      });
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'failed' || peer.connectionState === 'closed') this.cleanup();
    };

    let rawSdp = payload.sdp; // Handle JSON-wrapped SDP from Umbra client
    try { if (rawSdp.startsWith('{')) rawSdp = JSON.parse(rawSdp).sdp; } catch { /* use as-is */ }

    await peer.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: rawSdp }));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    this.relay.sendEnvelope(payload.senderDid, {
      envelope: 'call_answer', version: 1,
      payload: { callId: payload.callId, type: 'answer',
        sdp: JSON.stringify({ sdp: answer.sdp, type: 'answer' }) },
    });

    const audioGen = new AudioSignalGenerator();
    const audioInterval = setInterval(() => {
      audioSrc.onData({ samples: audioGen.nextFrame(), sampleRate: 48000,
        bitsPerSample: 16, channelCount: 1, numberOfFrames: 480 });
    }, 10);
    let videoInterval: ReturnType<typeof setInterval> | null = null;
    if (videoSrc) {
      const vg = new VideoSignalGenerator(), vs = videoSrc;
      videoInterval = setInterval(() => {
        vs.onFrame({ width: VIDEO_WIDTH, height: VIDEO_HEIGHT,
          data: new Uint8Array(vg.nextFrame().buffer) });
      }, 1000 / VIDEO_FPS);
    }

    this.activeCall = { callId: payload.callId, peerDid: payload.senderDid,
      callType: payload.callType as 'voice' | 'video',
      peer, audioInterval, videoInterval };
    console.log(`[${this.wispName}] Answered ${payload.callType} call ${payload.callId.slice(0, 12)}...`);
  }

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
