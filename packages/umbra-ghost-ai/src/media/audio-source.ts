/**
 * AudioSource — decodes audio files (MP3/FLAC/WAV) to raw PCM
 * and feeds samples into a WebRTC audio track via wrtc's nonstandard API.
 *
 * Uses FFmpeg (via ffmpeg-static) to decode any format to s16le PCM at 48kHz mono.
 * Feeds 10ms frames (480 samples) to RTCAudioSource at regular intervals.
 *
 * Supports:
 * - Looping playback with optional crossfade
 * - Track switching mid-playback
 * - Pause/resume
 */

import { spawn, type ChildProcess } from 'child_process';
import type { Logger } from '../config.js';

// ── Types ─────────────────────────────────────────────────────────────────────

/** wrtc nonstandard RTCAudioSource interface */
interface RTCAudioSource {
  createTrack(): MediaStreamTrack;
  onData(data: RTCAudioData): void;
}

interface RTCAudioData {
  samples: Int16Array;
  sampleRate: number;
  bitsPerSample: number;
  channelCount: number;
  numberOfFrames: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SAMPLE_RATE = 48000;       // 48kHz — standard for Opus/WebRTC
const CHANNELS = 1;              // Mono
const BITS_PER_SAMPLE = 16;
const FRAME_DURATION_MS = 10;    // 10ms frames
const SAMPLES_PER_FRAME = (SAMPLE_RATE * FRAME_DURATION_MS) / 1000; // 480
const BYTES_PER_FRAME = SAMPLES_PER_FRAME * (BITS_PER_SAMPLE / 8) * CHANNELS; // 960
const CROSSFADE_MS = 500;
const CROSSFADE_FRAMES = CROSSFADE_MS / FRAME_DURATION_MS; // 50 frames

// ── AudioSource ───────────────────────────────────────────────────────────────

export class AudioSource {
  private source: RTCAudioSource;
  private track: MediaStreamTrack;
  private log: Logger;
  private ffmpegPath: string;

  private currentFilePath: string | null = null;
  private ffmpegProcess: ChildProcess | null = null;
  private feedInterval: ReturnType<typeof setInterval> | null = null;
  private paused = false;
  private stopped = false;

  // PCM buffer — accumulates decoded audio, consumed by the feed timer
  private pcmBuffer: Buffer = Buffer.alloc(0);
  private silenceFrame: Int16Array;

  // Crossfade state
  private fadeOutBuffer: Int16Array[] = [];
  private fadeInActive = false;
  private fadeFrameIndex = 0;

  // Loop tracking
  private looping = true;
  private onTrackEnded: (() => void) | null = null;

  constructor(audioSource: RTCAudioSource, ffmpegPath: string, log: Logger) {
    this.source = audioSource;
    this.track = audioSource.createTrack();
    this.ffmpegPath = ffmpegPath;
    this.log = log;
    this.silenceFrame = new Int16Array(SAMPLES_PER_FRAME);
  }

  /** Get the WebRTC MediaStreamTrack to add to RTCPeerConnection. */
  getTrack(): MediaStreamTrack {
    return this.track;
  }

  /**
   * Start playing an audio file. Decodes via FFmpeg to raw PCM
   * and feeds frames at 10ms intervals.
   */
  start(filePath: string, options?: { loop?: boolean; onTrackEnded?: () => void }): void {
    this.stop();

    this.currentFilePath = filePath;
    this.looping = options?.loop ?? true;
    this.onTrackEnded = options?.onTrackEnded ?? null;
    this.stopped = false;
    this.paused = false;
    this.pcmBuffer = Buffer.alloc(0);

    this.startDecoding(filePath);
    this.startFeeding();

    this.log.debug(`[AUDIO] Started playback: ${filePath}`);
  }

  /** Switch to a different audio file with crossfade. */
  switchTrack(filePath: string): void {
    if (this.stopped) {
      this.start(filePath);
      return;
    }

    // Capture current audio for crossfade
    this.captureForCrossfade();

    this.killFfmpeg();
    this.pcmBuffer = Buffer.alloc(0);
    this.currentFilePath = filePath;
    this.startDecoding(filePath);

    this.fadeInActive = true;
    this.fadeFrameIndex = 0;

    this.log.debug(`[AUDIO] Switching track with crossfade: ${filePath}`);
  }

  /** Pause audio playback (sends silence). */
  pause(): void {
    this.paused = true;
    this.log.debug('[AUDIO] Paused');
  }

  /** Resume audio playback. */
  resume(): void {
    this.paused = false;
    this.log.debug('[AUDIO] Resumed');
  }

  /** Stop playback and clean up. */
  stop(): void {
    this.stopped = true;
    this.killFfmpeg();

    if (this.feedInterval) {
      clearInterval(this.feedInterval);
      this.feedInterval = null;
    }

    this.pcmBuffer = Buffer.alloc(0);
    this.fadeOutBuffer = [];
    this.fadeInActive = false;
    this.currentFilePath = null;

    this.log.debug('[AUDIO] Stopped');
  }

  get isPlaying(): boolean {
    return !this.stopped && !this.paused;
  }

  get currentFile(): string | null {
    return this.currentFilePath;
  }

  // ── Decoding ────────────────────────────────────────────────────────────

  private startDecoding(filePath: string): void {
    // FFmpeg: decode any audio format → raw s16le PCM at 48kHz mono
    this.ffmpegProcess = spawn(this.ffmpegPath, [
      '-i', filePath,
      '-f', 's16le',           // Raw signed 16-bit little-endian
      '-acodec', 'pcm_s16le',
      '-ar', String(SAMPLE_RATE),
      '-ac', String(CHANNELS),
      '-v', 'error',           // Suppress non-error output
      'pipe:1',                // Output to stdout
    ]);

    this.ffmpegProcess.stdout?.on('data', (chunk: Buffer) => {
      this.pcmBuffer = Buffer.concat([this.pcmBuffer, chunk]);
    });

    this.ffmpegProcess.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) this.log.debug(`[FFMPEG] ${msg}`);
    });

    this.ffmpegProcess.on('close', (code) => {
      if (this.stopped) return;

      if (code === 0 || code === null) {
        this.log.debug(`[AUDIO] FFmpeg finished decoding: ${filePath}`);
      } else {
        this.log.error(`[AUDIO] FFmpeg exited with code ${code}`);
      }
    });

    this.ffmpegProcess.on('error', (err) => {
      this.log.error('[AUDIO] FFmpeg spawn error:', err);
    });
  }

  // ── Feeding ─────────────────────────────────────────────────────────────

  private startFeeding(): void {
    if (this.feedInterval) clearInterval(this.feedInterval);

    this.feedInterval = setInterval(() => {
      this.feedFrame();
    }, FRAME_DURATION_MS);
  }

  private feedFrame(): void {
    if (this.stopped) return;

    let frame: Int16Array;

    if (this.paused) {
      frame = this.silenceFrame;
    } else if (this.pcmBuffer.length >= BYTES_PER_FRAME) {
      // Extract one frame from the PCM buffer
      const frameBytes = this.pcmBuffer.subarray(0, BYTES_PER_FRAME);
      this.pcmBuffer = this.pcmBuffer.subarray(BYTES_PER_FRAME);
      frame = new Int16Array(frameBytes.buffer, frameBytes.byteOffset, SAMPLES_PER_FRAME);

      // Apply crossfade if active
      if (this.fadeInActive && this.fadeFrameIndex < CROSSFADE_FRAMES) {
        frame = this.applyCrossfade(frame);
        this.fadeFrameIndex++;
        if (this.fadeFrameIndex >= CROSSFADE_FRAMES) {
          this.fadeInActive = false;
          this.fadeOutBuffer = [];
        }
      }
    } else if (this.ffmpegProcess === null || this.ffmpegProcess.exitCode !== null) {
      // FFmpeg done and buffer empty — track ended
      if (this.looping && this.currentFilePath) {
        this.log.debug('[AUDIO] Track ended, looping...');
        this.captureForCrossfade();
        this.startDecoding(this.currentFilePath);
        this.fadeInActive = true;
        this.fadeFrameIndex = 0;
      } else {
        this.onTrackEnded?.();
      }
      frame = this.silenceFrame;
    } else {
      // Buffer underrun — send silence
      frame = this.silenceFrame;
    }

    this.source.onData({
      samples: frame,
      sampleRate: SAMPLE_RATE,
      bitsPerSample: BITS_PER_SAMPLE,
      channelCount: CHANNELS,
      numberOfFrames: SAMPLES_PER_FRAME,
    });
  }

  // ── Crossfade ───────────────────────────────────────────────────────────

  private captureForCrossfade(): void {
    this.fadeOutBuffer = [];
    let offset = 0;
    while (offset + BYTES_PER_FRAME <= this.pcmBuffer.length && this.fadeOutBuffer.length < CROSSFADE_FRAMES) {
      const slice = this.pcmBuffer.subarray(offset, offset + BYTES_PER_FRAME);
      this.fadeOutBuffer.push(new Int16Array(slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength)));
      offset += BYTES_PER_FRAME;
    }
    while (this.fadeOutBuffer.length < CROSSFADE_FRAMES) {
      this.fadeOutBuffer.push(new Int16Array(SAMPLES_PER_FRAME));
    }
  }

  private applyCrossfade(fadeInFrame: Int16Array): Int16Array {
    const fadeOutFrame = this.fadeOutBuffer[this.fadeFrameIndex];
    if (!fadeOutFrame) return fadeInFrame;

    const progress = this.fadeFrameIndex / CROSSFADE_FRAMES;
    const result = new Int16Array(SAMPLES_PER_FRAME);

    for (let i = 0; i < SAMPLES_PER_FRAME; i++) {
      const fadeOut = fadeOutFrame[i] * (1 - progress);
      const fadeIn = fadeInFrame[i] * progress;
      result[i] = Math.max(-32768, Math.min(32767, Math.round(fadeOut + fadeIn)));
    }

    return result;
  }

  // ── Cleanup ─────────────────────────────────────────────────────────────

  private killFfmpeg(): void {
    if (this.ffmpegProcess) {
      this.ffmpegProcess.stdout?.removeAllListeners();
      this.ffmpegProcess.stderr?.removeAllListeners();
      this.ffmpegProcess.removeAllListeners();
      this.ffmpegProcess.kill('SIGTERM');
      this.ffmpegProcess = null;
    }
  }
}

/**
 * Resolve the FFmpeg binary path. Uses ffmpeg-static if available,
 * falls back to system PATH.
 */
export function resolveFfmpegPath(): string {
  try {
    const ffmpegStatic = require('ffmpeg-static') as string;
    return ffmpegStatic;
  } catch {
    return 'ffmpeg';
  }
}
