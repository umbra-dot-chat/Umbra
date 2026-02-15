/**
 * BotCallManager — WebRTC call manager for the test bot.
 *
 * Uses @roamhq/wrtc (node-webrtc) to create real WebRTC peer connections
 * in Node.js. Generates a synthetic 4K video stream (animated color pattern)
 * and sends it to the remote peer alongside a silent audio track.
 *
 * Supports: initiating calls, accepting calls, ICE exchange, and cleanup.
 */

import wrtc from '@roamhq/wrtc';
import { AudioGenerator, type AudioMode } from './audio-generator.js';

const {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  MediaStream,
} = wrtc;

const { RTCVideoSource, RTCAudioSource } = (wrtc as any).nonstandard;

// ─── Types ──────────────────────────────────────────────────────────────────

export type CallType = 'voice' | 'video';

export interface BotCallConfig {
  /** Video width (default 3840 for 4K) */
  width: number;
  /** Video height (default 2160 for 4K) */
  height: number;
  /** Video frame rate (default 30) */
  frameRate: number;
  /** Audio mode for test audio generation */
  audioMode: AudioMode;
  /** ICE servers */
  iceServers: { urls: string | string[]; username?: string; credential?: string }[];
}

const DEFAULT_CALL_CONFIG: BotCallConfig = {
  width: 3840,
  height: 2160,
  frameRate: 30,
  audioMode: 'sine',
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// ─── BotCallManager ─────────────────────────────────────────────────────────

export class BotCallManager {
  private pc: InstanceType<typeof RTCPeerConnection> | null = null;
  private videoSource: any = null;
  private audioSource: any = null;
  private frameInterval: ReturnType<typeof setInterval> | null = null;
  private audioInterval: ReturnType<typeof setInterval> | null = null;
  private pendingCandidates: any[] = [];
  private config: BotCallConfig;
  private frameCount = 0;
  private audioGenerator: AudioGenerator | null = null;

  // Callbacks
  onIceCandidate: ((candidate: { candidate: string; sdpMid: string | null; sdpMLineIndex: number | null }) => void) | null = null;
  onConnectionStateChange: ((state: string) => void) | null = null;

  constructor(config: Partial<BotCallConfig> = {}) {
    this.config = { ...DEFAULT_CALL_CONFIG, ...config };
  }

  /**
   * Create an SDP offer (bot is the caller).
   * Sets up video + audio sources and starts streaming.
   */
  async createOffer(callType: CallType): Promise<string> {
    this.setupPeerConnection();
    this.setupMediaSources(callType);

    const offer = await this.pc!.createOffer();
    await this.pc!.setLocalDescription(offer);

    return JSON.stringify({
      sdp: offer.sdp,
      type: offer.type,
    });
  }

  /**
   * Accept an incoming SDP offer and return an SDP answer.
   */
  async acceptOffer(offerSdp: string, callType: CallType): Promise<string> {
    this.setupPeerConnection();
    this.setupMediaSources(callType);

    const offer = JSON.parse(offerSdp);
    await this.pc!.setRemoteDescription(new RTCSessionDescription({
      sdp: offer.sdp,
      type: offer.type,
    }));

    // Apply pending ICE candidates
    for (const candidate of this.pendingCandidates) {
      await this.pc!.addIceCandidate(new RTCIceCandidate(candidate));
    }
    this.pendingCandidates = [];

    const answer = await this.pc!.createAnswer();
    await this.pc!.setLocalDescription(answer);

    return JSON.stringify({
      sdp: answer.sdp,
      type: answer.type,
    });
  }

  /**
   * Complete the handshake (offerer receives the answer).
   */
  async completeHandshake(answerSdp: string): Promise<void> {
    if (!this.pc) throw new Error('No peer connection');

    const answer = JSON.parse(answerSdp);
    await this.pc.setRemoteDescription(new RTCSessionDescription({
      sdp: answer.sdp,
      type: answer.type,
    }));

    // Apply pending ICE candidates
    for (const candidate of this.pendingCandidates) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    this.pendingCandidates = [];
  }

  /**
   * Add a remote ICE candidate.
   */
  async addIceCandidate(candidate: { candidate: string; sdpMid: string | null; sdpMLineIndex: number | null }): Promise<void> {
    if (this.pc && this.pc.remoteDescription) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      this.pendingCandidates.push(candidate);
    }
  }

  /**
   * Close everything and release resources.
   */
  close(): void {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }
    if (this.audioInterval) {
      clearInterval(this.audioInterval);
      this.audioInterval = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.audioGenerator) {
      this.audioGenerator.stop();
      this.audioGenerator = null;
    }
    this.videoSource = null;
    this.audioSource = null;
    this.pendingCandidates = [];
    this.frameCount = 0;
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  private setupPeerConnection(): void {
    const pc = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    pc.onicecandidate = (event: any) => {
      if (event.candidate && this.onIceCandidate) {
        this.onIceCandidate({
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      this.onConnectionStateChange?.(pc.connectionState);
    };

    this.pc = pc;
  }

  private setupMediaSources(callType: CallType): void {
    if (!this.pc) return;

    // Always add audio
    this.audioSource = new RTCAudioSource();
    const audioTrack = this.audioSource.createTrack();
    const stream = new MediaStream([audioTrack]);
    this.pc.addTrack(audioTrack, stream);

    // Start sending test audio frames
    this.audioGenerator = new AudioGenerator({
      sampleRate: 48000,
      mode: this.config.audioMode,
    });
    this.startTestAudio();

    // Add video for video calls
    if (callType === 'video') {
      this.videoSource = new RTCVideoSource();
      const videoTrack = this.videoSource.createTrack();
      stream.addTrack(videoTrack);
      this.pc.addTrack(videoTrack, stream);

      // Start generating 4K video frames
      this.startVideoGeneration();
    }
  }

  /**
   * Change the audio mode at runtime (sine, sweep, dtmf, silence).
   */
  setAudioMode(mode: AudioMode): void {
    if (this.audioGenerator) {
      this.audioGenerator.setMode(mode);
    }
  }

  /**
   * Generate and send test audio at 48kHz.
   * node-webrtc expects 10ms audio frames (480 samples at 48kHz).
   */
  private startTestAudio(): void {
    if (this.audioInterval) return;

    const sampleRate = 48000;
    const channelCount = 1;
    const samplesPerFrame = sampleRate / 100; // 10ms = 480 samples

    this.audioInterval = setInterval(() => {
      if (this.audioSource && this.audioGenerator) {
        const samples = this.audioGenerator.getNextFrame(samplesPerFrame);
        this.audioSource.onData({
          samples,
          sampleRate,
          bitsPerSample: 16,
          channelCount,
          numberOfFrames: samplesPerFrame,
        });
      }
    }, 10);
  }

  /**
   * Generate animated 4K I420 video frames.
   *
   * Creates a moving gradient pattern with Umbra branding:
   * - Horizontal color bands that shift over time
   * - A moving vertical bar for motion testing
   * - Text-like blocks to verify resolution
   */
  private startVideoGeneration(): void {
    if (this.frameInterval) return;

    const { width, height, frameRate } = this.config;
    const ySize = width * height;
    const uvWidth = width >> 1;
    const uvHeight = height >> 1;
    const uvSize = uvWidth * uvHeight;
    const frameSize = ySize + uvSize + uvSize;

    const intervalMs = 1000 / frameRate;

    this.frameInterval = setInterval(() => {
      if (!this.videoSource) return;

      const data = new Uint8ClampedArray(frameSize);
      const t = this.frameCount;

      // ── Y plane (luma) ────────────────────────────────────────────────
      // Animated gradient with moving bar
      for (let y = 0; y < height; y++) {
        const rowOffset = y * width;
        // Base luma: gradient from top to bottom, shifting over time
        const baseLuma = Math.floor(((y + t * 2) % height) / height * 200 + 28);

        for (let x = 0; x < width; x++) {
          // Moving vertical bar (white stripe)
          const barPos = ((t * 8) % width);
          const barDist = Math.abs(x - barPos);
          const barLuma = barDist < 40 ? 235 : (barDist < 60 ? 180 : 0);

          // Checkerboard pattern for resolution verification (every 120px)
          const checker = ((Math.floor(x / 120) + Math.floor(y / 120)) % 2) * 30;

          // Combine: gradient + bar highlight + checker
          const finalLuma = Math.min(235, Math.max(16, baseLuma + barLuma + checker));
          data[rowOffset + x] = finalLuma;
        }
      }

      // ── U plane (Cb) ──────────────────────────────────────────────────
      // Color shifting: cycle through hues
      const uOffset = ySize;
      for (let y = 0; y < uvHeight; y++) {
        for (let x = 0; x < uvWidth; x++) {
          // Create color bands that shift over time
          const band = Math.floor(((y * 2) + t) % height / (height / 6));
          const uValues = [107, 128, 170, 200, 80, 148]; // Different Cb values per band
          data[uOffset + y * uvWidth + x] = uValues[band % uValues.length];
        }
      }

      // ── V plane (Cr) ──────────────────────────────────────────────────
      const vOffset = ySize + uvSize;
      for (let y = 0; y < uvHeight; y++) {
        for (let x = 0; x < uvWidth; x++) {
          const band = Math.floor(((y * 2) + t) % height / (height / 6));
          const vValues = [200, 128, 90, 60, 180, 108]; // Different Cr values per band
          data[vOffset + y * uvWidth + x] = vValues[band % vValues.length];
        }
      }

      // Send frame to video source
      this.videoSource.onFrame({
        width,
        height,
        data,
        rotation: 0,
      });

      this.frameCount++;
    }, intervalMs);
  }
}
