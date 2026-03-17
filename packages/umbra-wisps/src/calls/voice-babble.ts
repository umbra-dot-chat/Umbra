/**
 * VoiceBabbleHandler -- Manages a wisp's participation in a community
 * voice channel. Joins the relay call room, establishes a WebRTC mesh
 * with other participants, and plays babble audio clips with natural
 * pauses between them.
 *
 * Audio pipeline:
 *   BabbleLibrary clip (MP3) -> FFmpeg decode -> Int16Array PCM
 *   -> RTCAudioSource.onData() 10ms frames -> VP8/Opus -> RTP
 */

import { EventEmitter } from 'events';
import { spawn, execSync, type ChildProcess } from 'child_process';
import { createRequire } from 'module';
import type { RelayClient } from '../relay-client.js';
import type { WispIdentity } from '../identity-store.js';
import type { BabbleLibrary } from './babble-library.js';

// ── Audio constants (must match wrtc expectations) ─────────────────────────

const SAMPLE_RATE = 48000;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const FRAME_DURATION_MS = 10;
const SAMPLES_PER_FRAME = (SAMPLE_RATE * FRAME_DURATION_MS) / 1000; // 480
const BYTES_PER_SAMPLE = BITS_PER_SAMPLE / 8;

// ── Lazy-loaded wrtc ───────────────────────────────────────────────────────

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

// ── FFmpeg path resolution ─────────────────────────────────────────────────

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

// ── Types ──────────────────────────────────────────────────────────────────

interface VoicePeer {
  did: string;
  connection: RTCPeerConnection;
}

// ── VoiceBabbleHandler ─────────────────────────────────────────────────────

/**
 * Manages a wisp's participation in a community voice channel.
 * Joins the relay room, establishes WebRTC mesh with other participants,
 * and plays babble audio clips with natural pauses between them.
 */
export class VoiceBabbleHandler extends EventEmitter {
  private roomId: string | null = null;
  private channelId: string | null = null;
  private peers: Map<string, VoicePeer> = new Map();
  private audioSource: any = null; // RTCAudioSource
  private audioTrack: MediaStreamTrack | null = null;
  private feedTimeout: ReturnType<typeof setTimeout> | null = null;
  private babbleTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentClipSamples: Int16Array | null = null;
  private sampleOffset = 0;
  private active = false;
  private ffmpegPath: string;
  private silenceFrame = new Int16Array(SAMPLES_PER_FRAME);

  // Drift-compensating timer state
  private feedStartTime: bigint = BigInt(0);
  private feedTickCount = 0;

  constructor(
    private identity: WispIdentity,
    private relay: RelayClient,
    private babbleLibrary: BabbleLibrary,
    private wispName: string,
  ) {
    super();
    this.ffmpegPath = resolveFfmpegPath();
  }

  get inChannel(): boolean {
    return this.active && this.roomId !== null;
  }

  get currentChannelId(): string | null {
    return this.channelId;
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /**
   * Join a community voice channel.
   * Sends create_call_room to relay, then join_call_room once
   * roomId is received via callRoomCreated event.
   */
  async joinChannel(channelId: string): Promise<void> {
    if (this.active) {
      this.leaveChannel();
    }

    const wrtc = loadWrtc();
    if (!wrtc) {
      console.error(`[${this.wispName}] wrtc not available, cannot join voice`);
      return;
    }

    this.channelId = channelId;
    this.active = true;

    // Request room creation (relay will respond with callRoomCreated)
    this.relay.send({
      type: 'create_call_room',
      group_id: channelId,
    });

    console.log(`[${this.wispName}] Requesting voice channel ${channelId}`);
  }

  /**
   * Join an existing call room by roomId (e.g. from a group_call_invite).
   * Skips create_call_room and directly sends join_call_room.
   */
  async joinRoom(roomId: string, channelId?: string): Promise<void> {
    if (this.active) {
      this.leaveChannel();
    }

    const wrtc = loadWrtc();
    if (!wrtc) {
      console.error(`[${this.wispName}] wrtc not available, cannot join room`);
      return;
    }

    this.roomId = roomId;
    this.channelId = channelId ?? roomId;
    this.active = true;

    this.relay.send({
      type: 'join_call_room',
      room_id: roomId,
    });

    this.initAudioFeed();
    console.log(`[${this.wispName}] Joined existing room ${roomId}`);
    this.emit('joined', roomId);
  }

  /** Leave the current voice channel. */
  leaveChannel(): void {
    if (!this.active) return;

    if (this.roomId) {
      this.relay.send({
        type: 'leave_call_room',
        room_id: this.roomId,
      });
    }

    this.stopAudioFeed();
    this.cleanupPeers();

    this.roomId = null;
    this.channelId = null;
    this.active = false;

    console.log(`[${this.wispName}] Left voice channel`);
    this.emit('left');
  }

  /**
   * Handle relay messages related to voice channels.
   * Route to the appropriate handler based on event type.
   */
  handleCallEvent(event: { type: string; payload: any }): void {
    if (!this.active) return;

    switch (event.type) {
      case 'callRoomCreated':
        this.onRoomCreated(event.payload);
        break;
      case 'callParticipantJoined':
        this.onParticipantJoined(event.payload);
        break;
      case 'callParticipantLeft':
        this.onParticipantLeft(event.payload);
        break;
      case 'callSignalForward':
        this.onSignalForward(event.payload);
        break;
    }
  }

  // ── Relay event handlers ───────────────────────────────────────────────

  private onRoomCreated(payload: {
    roomId: string;
    groupId: string;
  }): void {
    if (payload.groupId !== this.channelId) return;

    this.roomId = payload.roomId;
    this.relay.send({
      type: 'join_call_room',
      room_id: this.roomId,
    });

    this.initAudioFeed();
    console.log(`[${this.wispName}] Joined room ${this.roomId}`);
    this.emit('joined', this.roomId);
  }

  private onParticipantJoined(payload: {
    room_id: string;
    did: string;
  }): void {
    if (payload.room_id !== this.roomId) return;
    if (payload.did === this.identity.did) return;

    void this.createOffer(payload.did);
  }

  private onParticipantLeft(payload: {
    room_id: string;
    did: string;
  }): void {
    if (payload.room_id !== this.roomId) return;

    const peer = this.peers.get(payload.did);
    if (peer) {
      try { peer.connection.close(); } catch { /* ok */ }
      this.peers.delete(payload.did);
      console.log(`[${this.wispName}] Peer left: ${payload.did.slice(0, 20)}...`);
    }
  }

  private onSignalForward(payload: {
    room_id: string;
    from_did: string;
    signal: { type: string; sdp?: string; candidate?: any };
  }): void {
    if (payload.room_id !== this.roomId) return;

    const { from_did, signal } = payload;

    switch (signal.type) {
      case 'offer':
        if (signal.sdp) void this.handleOffer(from_did, signal.sdp);
        break;
      case 'answer':
        if (signal.sdp) void this.handleAnswer(from_did, signal.sdp);
        break;
      case 'ice-candidate':
        if (signal.candidate) this.handleIceCandidate(from_did, signal.candidate);
        break;
    }
  }

  // ── WebRTC Mesh ────────────────────────────────────────────────────────

  /** Create a WebRTC connection to a peer and send an offer. */
  private async createOffer(peerDid: string): Promise<void> {
    const wrtc = loadWrtc();
    if (!wrtc) return;

    const pc = this.createPeerConnection(peerDid);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.relay.send({
      type: 'call_signal',
      room_id: this.roomId,
      to_did: peerDid,
      payload: { type: 'offer', sdp: offer.sdp },
    });

    console.log(`[${this.wispName}] Sent offer to ${peerDid.slice(0, 20)}...`);
  }

  /** Handle an incoming WebRTC offer from a peer. */
  private async handleOffer(
    fromDid: string,
    sdp: string,
  ): Promise<void> {
    const wrtc = loadWrtc();
    if (!wrtc) return;

    const pc = this.createPeerConnection(fromDid);

    await pc.setRemoteDescription(
      new wrtc.RTCSessionDescription({ type: 'offer', sdp }),
    );
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.relay.send({
      type: 'call_signal',
      room_id: this.roomId,
      to_did: fromDid,
      payload: { type: 'answer', sdp: answer.sdp },
    });
  }

  /** Handle an incoming WebRTC answer. */
  private async handleAnswer(
    fromDid: string,
    sdp: string,
  ): Promise<void> {
    const wrtc = loadWrtc();
    if (!wrtc) return;

    const peer = this.peers.get(fromDid);
    if (!peer) return;

    await peer.connection.setRemoteDescription(
      new wrtc.RTCSessionDescription({ type: 'answer', sdp }),
    );
  }

  /** Handle an incoming ICE candidate. */
  private handleIceCandidate(fromDid: string, candidate: any): void {
    const peer = this.peers.get(fromDid);
    if (!peer) return;

    try {
      void peer.connection.addIceCandidate(candidate);
    } catch { /* ignore late candidates */ }
  }

  /** Create a peer connection with the audio track attached. */
  private createPeerConnection(peerDid: string): RTCPeerConnection {
    const wrtc = loadWrtc()!;

    // Close existing connection to this peer if any
    const existing = this.peers.get(peerDid);
    if (existing) {
      try { existing.connection.close(); } catch { /* ok */ }
    }

    const pc = new wrtc.RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    // Attach audio track so peer receives our babble audio
    if (this.audioTrack) {
      const stream = new wrtc.MediaStream();
      stream.addTrack(this.audioTrack);
      pc.addTrack(this.audioTrack, stream);
    }

    pc.onicecandidate = (ev) => {
      if (!ev.candidate) return;
      this.relay.send({
        type: 'call_signal',
        room_id: this.roomId,
        to_did: peerDid,
        payload: {
          type: 'ice-candidate',
          candidate: ev.candidate,
        },
      });
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === 'failed' ||
        pc.connectionState === 'closed'
      ) {
        this.peers.delete(peerDid);
      }
    };

    this.peers.set(peerDid, { did: peerDid, connection: pc });
    return pc;
  }

  // ── Audio Feed ─────────────────────────────────────────────────────────

  /** Initialize RTCAudioSource and start drift-compensating frame feed. */
  private initAudioFeed(): void {
    const wrtc = loadWrtc();
    if (!wrtc) return;

    const { RTCAudioSource } = wrtc.nonstandard;
    this.audioSource = new RTCAudioSource();
    this.audioTrack = this.audioSource.createTrack();

    // Start drift-compensating frame feed
    this.feedStartTime = process.hrtime.bigint();
    this.feedTickCount = 0;
    const intervalNs = BigInt(
      Math.round(FRAME_DURATION_MS * 1_000_000),
    );

    const tick = () => {
      if (!this.active) return;
      this.feedFrame();
      this.feedTickCount++;

      const nextTargetNs =
        this.feedStartTime + BigInt(this.feedTickCount) * intervalNs;
      const nowNs = process.hrtime.bigint();
      const delayNs = Number(nextTargetNs - nowNs);

      // If very far behind (>2 frames), reset timeline
      const maxBehindNs = Number(intervalNs) * 2;
      if (delayNs < -maxBehindNs) {
        this.feedStartTime = nowNs;
        this.feedTickCount = 0;
        this.feedTimeout = setTimeout(tick, FRAME_DURATION_MS);
      } else {
        const delayMs = Math.max(1, delayNs / 1_000_000);
        this.feedTimeout = setTimeout(tick, delayMs);
      }
    };

    this.feedTimeout = setTimeout(tick, FRAME_DURATION_MS);

    // Schedule first babble clip
    this.scheduleNextBabble();
    console.log(`[${this.wispName}] Audio feed initialized`);
  }

  /** Feed one 10ms audio frame: silence when idle, PCM when playing. */
  private feedFrame(): void {
    if (!this.audioSource) return;

    let frame: Int16Array;

    if (
      this.currentClipSamples &&
      this.sampleOffset < this.currentClipSamples.length
    ) {
      // Playing a babble clip -- extract 480-sample frame
      const end = Math.min(
        this.sampleOffset + SAMPLES_PER_FRAME,
        this.currentClipSamples.length,
      );
      const count = end - this.sampleOffset;

      // wrtc samples need their own ArrayBuffer (not a view into shared)
      frame = new Int16Array(SAMPLES_PER_FRAME);
      frame.set(
        this.currentClipSamples.subarray(this.sampleOffset, end),
      );
      this.sampleOffset += count;

      // Clip finished -- schedule next babble
      if (this.sampleOffset >= this.currentClipSamples.length) {
        this.currentClipSamples = null;
        this.sampleOffset = 0;
        this.scheduleNextBabble();
      }
    } else {
      // Silence between clips
      frame = this.silenceFrame;
    }

    this.audioSource.onData({
      samples: frame,
      sampleRate: SAMPLE_RATE,
      bitsPerSample: BITS_PER_SAMPLE,
      channelCount: CHANNELS,
      numberOfFrames: SAMPLES_PER_FRAME,
    });
  }

  /** Schedule the next babble clip after a natural pause (3-15s). */
  private scheduleNextBabble(): void {
    if (this.babbleTimeout) {
      clearTimeout(this.babbleTimeout);
      this.babbleTimeout = null;
    }
    if (!this.active) return;

    const pause = 3000 + Math.random() * 12000;
    this.babbleTimeout = setTimeout(() => {
      void this.playNextClip();
    }, pause);
  }

  /** Load and decode the next babble clip, then begin playing it. */
  private async playNextClip(): Promise<void> {
    if (!this.active) return;

    const clip = this.babbleLibrary.getClip(this.wispName);
    if (!clip) {
      // No clips available -- try again later
      this.scheduleNextBabble();
      return;
    }

    try {
      this.currentClipSamples = await this.decodeToPCM(clip.path);
      this.sampleOffset = 0;
      this.babbleLibrary.markPlayed(this.wispName, clip.index);
      this.emit('babble', { clip: clip.path, duration: clip.duration });
    } catch (err) {
      console.error(
        `[${this.wispName}] Failed to decode babble clip:`,
        err,
      );
      this.scheduleNextBabble();
    }
  }

  /**
   * Decode an audio file to raw PCM samples via FFmpeg.
   * Returns Int16Array of mono 48kHz 16-bit samples.
   */
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
        if (msg) {
          console.error(`[${this.wispName}] ffmpeg: ${msg}`);
        }
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
        const view = new Int16Array(
          pcmBuffer.buffer,
          pcmBuffer.byteOffset,
          sampleCount,
        );
        samples.set(view);

        resolve(samples);
      });

      proc.on('error', reject);
    });
  }

  // ── Cleanup ────────────────────────────────────────────────────────────

  private cleanupPeers(): void {
    for (const [, peer] of this.peers) {
      try { peer.connection.close(); } catch { /* ok */ }
    }
    this.peers.clear();
  }

  private stopAudioFeed(): void {
    if (this.feedTimeout) {
      clearTimeout(this.feedTimeout);
      this.feedTimeout = null;
    }
    if (this.babbleTimeout) {
      clearTimeout(this.babbleTimeout);
      this.babbleTimeout = null;
    }
    this.audioSource = null;
    this.audioTrack = null;
    this.currentClipSamples = null;
    this.sampleOffset = 0;
  }
}
