/**
 * WispCallHandler -- answers incoming WebRTC calls with babble audio.
 *
 * Uses @roamhq/wrtc for server-side WebRTC. Streams babble audio clips
 * (decoded from MP3 via FFmpeg) with natural pauses between clips.
 * Falls back to test signals if no babble library is configured.
 */

import { spawn, execSync, type ChildProcess } from 'child_process';
import { createRequire } from 'module';
import type { WispIdentity } from '../identity-store.js';
import type { RelayClient } from '../relay-client.js';
import type { BabbleLibrary } from './babble-library.js';
import { AudioSignalGenerator, VideoSignalGenerator, VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS } from './test-signals.js';

// Audio constants (must match wrtc expectations)
const SAMPLE_RATE = 48000;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const FRAME_DURATION_MS = 10;
const SAMPLES_PER_FRAME = (SAMPLE_RATE * FRAME_DURATION_MS) / 1000; // 480
const BYTES_PER_SAMPLE = BITS_PER_SAMPLE / 8;

export interface ActiveWispCall {
  callId: string;
  peerDid: string;
  callType: 'voice' | 'video';
  peer: RTCPeerConnection;
  audioFeedTimeout: ReturnType<typeof setTimeout> | null;
  babbleTimeout: ReturnType<typeof setTimeout> | null;
  videoInterval: ReturnType<typeof setInterval> | null;
}

// Lazy-loaded wrtc module — shared with voice-babble.ts
let wrtcModule: any = null;

async function loadWrtcAsync(): Promise<any> {
  if (wrtcModule) return wrtcModule;
  try {
    const mod = await (import('@roamhq/wrtc' as string) as Promise<any>);
    wrtcModule = mod.default || mod;
    return wrtcModule;
  } catch {
    return null;
  }
}

function loadWrtc(): any {
  if (wrtcModule) return wrtcModule;
  // Check globalThis (set by orchestrator preload)
  if ((globalThis as any).__wrtcModule) {
    wrtcModule = (globalThis as any).__wrtcModule;
    return wrtcModule;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    wrtcModule = require('@roamhq/wrtc');
    return wrtcModule;
  } catch {
    return null;
  }
}

function resolveFfmpegPath(): string {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe', timeout: 3000 });
    return 'ffmpeg';
  } catch {
    try {
      const req = createRequire(import.meta.url);
      return req('ffmpeg-static') as string;
    } catch {
      return 'ffmpeg';
    }
  }
}

export class WispCallHandler {
  readonly identity: WispIdentity;
  readonly relay: RelayClient;
  readonly wispName: string;
  activeCall: ActiveWispCall | null = null;
  private babbleLibrary: BabbleLibrary | null = null;
  private ffmpegPath: string;

  // Babble playback state
  private audioSource: any = null; // RTCAudioSource
  private currentClipSamples: Int16Array | null = null;
  private sampleOffset = 0;
  private silenceFrame = new Int16Array(SAMPLES_PER_FRAME);

  // Drift-compensating timer state
  private feedStartTime: bigint = BigInt(0);
  private feedTickCount = 0;

  constructor(
    identity: WispIdentity,
    relay: RelayClient,
    wispName: string,
    babbleLibrary?: BabbleLibrary,
  ) {
    this.identity = identity;
    this.relay = relay;
    this.wispName = wispName;
    this.babbleLibrary = babbleLibrary ?? null;
    this.ffmpegPath = resolveFfmpegPath();
  }

  /** Set the babble library (can be set after construction). */
  setBabbleLibrary(lib: BabbleLibrary): void {
    this.babbleLibrary = lib;
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
    this.audioSource = audioSrc;
    stream.addTrack(audioSrc.createTrack());
    peer.addTrack(stream.getAudioTracks()[0], stream);

    // Video track (video calls only)
    let videoSrc: InstanceType<typeof RTCVideoSource> | null = null;
    if (payload.callType === 'video') {
      videoSrc = new RTCVideoSource();
      stream.addTrack(videoSrc.createTrack());
      peer.addTrack(stream.getVideoTracks()[0], stream);
    }

    peer.onicecandidate = (ev: any) => {
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

    // Start audio feed: babble if available, fallback to test signal
    const audioFeedTimeout = this.startBabbleAudioFeed(audioSrc);

    // Video: test signals (babble is audio-only)
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
      peer, audioFeedTimeout, babbleTimeout: null, videoInterval };
    console.log(`[${this.wispName}] Answered ${payload.callType} call ${payload.callId.slice(0, 12)}...`);
  }

  /**
   * Start drift-compensating audio feed. Uses babble clips when available,
   * falls back to sine wave test signal.
   */
  private startBabbleAudioFeed(audioSrc: any): ReturnType<typeof setTimeout> | null {
    const hasBabble = this.babbleLibrary?.hasClips(this.wispName) ?? false;

    if (!hasBabble) {
      // Fallback: sine wave test signal (legacy behavior)
      const audioGen = new AudioSignalGenerator();
      const fallbackInterval = setInterval(() => {
        audioSrc.onData({ samples: audioGen.nextFrame(), sampleRate: SAMPLE_RATE,
          bitsPerSample: BITS_PER_SAMPLE, channelCount: CHANNELS, numberOfFrames: SAMPLES_PER_FRAME });
      }, FRAME_DURATION_MS);
      // Store as audioFeedTimeout for cleanup (cast OK -- both are timer IDs)
      return fallbackInterval as unknown as ReturnType<typeof setTimeout>;
    }

    // Drift-compensating babble feed
    this.currentClipSamples = null;
    this.sampleOffset = 0;
    this.feedStartTime = process.hrtime.bigint();
    this.feedTickCount = 0;
    const intervalNs = BigInt(Math.round(FRAME_DURATION_MS * 1_000_000));

    const tick = () => {
      if (!this.activeCall) return;
      this.feedBabbleFrame(audioSrc);
      this.feedTickCount++;

      const nextTargetNs = this.feedStartTime + BigInt(this.feedTickCount) * intervalNs;
      const nowNs = process.hrtime.bigint();
      const delayNs = Number(nextTargetNs - nowNs);

      // If very far behind (>2 frames), reset timeline
      const maxBehindNs = Number(intervalNs) * 2;
      if (delayNs < -maxBehindNs) {
        this.feedStartTime = nowNs;
        this.feedTickCount = 0;
        if (this.activeCall) {
          this.activeCall.audioFeedTimeout = setTimeout(tick, FRAME_DURATION_MS);
        }
      } else {
        const delayMs = Math.max(1, delayNs / 1_000_000);
        if (this.activeCall) {
          this.activeCall.audioFeedTimeout = setTimeout(tick, delayMs);
        }
      }
    };

    // Schedule first babble clip after a short delay (1-3s)
    this.scheduleNextBabbleClip();

    return setTimeout(tick, FRAME_DURATION_MS);
  }

  /** Feed one 10ms audio frame: silence when idle, PCM when playing a clip. */
  private feedBabbleFrame(audioSrc: any): void {
    let frame: Int16Array;

    if (this.currentClipSamples && this.sampleOffset < this.currentClipSamples.length) {
      const end = Math.min(this.sampleOffset + SAMPLES_PER_FRAME, this.currentClipSamples.length);
      const count = end - this.sampleOffset;

      // wrtc samples need their own ArrayBuffer (not a view into shared)
      frame = new Int16Array(SAMPLES_PER_FRAME);
      frame.set(this.currentClipSamples.subarray(this.sampleOffset, end));
      this.sampleOffset += count;

      // Clip finished -- schedule next
      if (this.sampleOffset >= this.currentClipSamples.length) {
        this.currentClipSamples = null;
        this.sampleOffset = 0;
        this.scheduleNextBabbleClip();
      }
    } else {
      frame = this.silenceFrame;
    }

    audioSrc.onData({
      samples: frame,
      sampleRate: SAMPLE_RATE,
      bitsPerSample: BITS_PER_SAMPLE,
      channelCount: CHANNELS,
      numberOfFrames: SAMPLES_PER_FRAME,
    });
  }

  /** Schedule the next babble clip after a natural pause (3-15s). */
  private scheduleNextBabbleClip(): void {
    if (this.activeCall?.babbleTimeout) {
      clearTimeout(this.activeCall.babbleTimeout);
    }
    if (!this.activeCall) return;

    const pause = 3000 + Math.random() * 12000;
    this.activeCall.babbleTimeout = setTimeout(() => {
      void this.playNextBabbleClip();
    }, pause);
  }

  /** Load and decode the next babble clip, then begin playing it. */
  private async playNextBabbleClip(): Promise<void> {
    if (!this.activeCall || !this.babbleLibrary) return;

    const clip = this.babbleLibrary.getClip(this.wispName);
    if (!clip) {
      this.scheduleNextBabbleClip();
      return;
    }

    try {
      this.currentClipSamples = await this.decodeToPCM(clip.path);
      this.sampleOffset = 0;
      this.babbleLibrary.markPlayed(this.wispName, clip.index);
    } catch (err) {
      console.error(`[${this.wispName}] Failed to decode babble clip:`, err);
      this.scheduleNextBabbleClip();
    }
  }

  /** Decode an audio file to raw PCM samples via FFmpeg. */
  private decodeToPCM(filePath: string): Promise<Int16Array> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      const proc = spawn(this.ffmpegPath, [
        '-i', filePath,
        '-f', 's16le',
        '-acodec', 'pcm_s16le',
        '-ar', String(SAMPLE_RATE),
        '-ac', String(CHANNELS),
        '-v', 'error',
        'pipe:1',
      ]);

      proc.stdout.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      proc.stderr.on('data', (data: Buffer) => {
        const msg = data.toString().trim();
        if (msg) console.error(`[${this.wispName}] ffmpeg: ${msg}`);
      });

      proc.on('close', (code) => {
        if (code !== 0 && code !== null) {
          reject(new Error(`FFmpeg exited with code ${code}`));
          return;
        }
        const pcmBuffer = Buffer.concat(chunks);
        const sampleCount = pcmBuffer.length / BYTES_PER_SAMPLE;

        // Copy into own ArrayBuffer (wrtc requirement)
        const samples = new Int16Array(sampleCount);
        const view = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, sampleCount);
        samples.set(view);
        resolve(samples);
      });

      proc.on('error', reject);
    });
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
    if (this.activeCall.audioFeedTimeout) {
      clearTimeout(this.activeCall.audioFeedTimeout);
    }
    if (this.activeCall.babbleTimeout) {
      clearTimeout(this.activeCall.babbleTimeout);
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
    this.audioSource = null;
    this.currentClipSamples = null;
    this.sampleOffset = 0;
  }
}
