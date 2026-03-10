/**
 * VideoSource — decodes video files (MP4/MKV/MOV) to raw I420 frames
 * and feeds them into a WebRTC video track via wrtc's nonstandard API.
 *
 * Uses FFmpeg to decode video to raw YUV420P frames at the source's native
 * resolution and frame rate, then feeds them to RTCVideoSource.
 *
 * Supports:
 * - Looping playback with brief crossfade
 * - Track switching
 * - Pause/resume (sends last frame repeatedly when paused)
 */

import { spawn, type ChildProcess } from 'child_process';
import type { Logger } from '../config.js';

// ── Types ─────────────────────────────────────────────────────────────────────

/** wrtc nonstandard RTCVideoSource interface */
interface RTCVideoSource {
  createTrack(): MediaStreamTrack;
  onFrame(frame: RTCVideoFrame): void;
}

interface RTCVideoFrame {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;
const DEFAULT_FPS = 30;

// ── VideoSource ───────────────────────────────────────────────────────────────

export class VideoSource {
  private source: RTCVideoSource;
  private track: MediaStreamTrack;
  private log: Logger;
  private ffmpegPath: string;

  private currentFilePath: string | null = null;
  private ffmpegProcess: ChildProcess | null = null;
  private feedInterval: ReturnType<typeof setInterval> | null = null;
  private paused = false;
  private stopped = false;

  // Frame buffer — stores decoded I420 frames
  private frameBuffer: Buffer[] = [];
  private maxBufferedFrames = 10;
  private lastFrame: Buffer | null = null;

  // Video dimensions and timing
  private width = DEFAULT_WIDTH;
  private height = DEFAULT_HEIGHT;
  private fps = DEFAULT_FPS;
  private frameIntervalMs = 1000 / DEFAULT_FPS;

  // Loop tracking
  private looping = true;
  private onTrackEnded: (() => void) | null = null;

  // Frame size in bytes for I420 (Y plane + U plane + V plane)
  private get frameSize(): number {
    return this.width * this.height * 3 / 2;
  }

  constructor(videoSource: RTCVideoSource, ffmpegPath: string, log: Logger) {
    this.source = videoSource;
    this.track = videoSource.createTrack();
    this.ffmpegPath = ffmpegPath;
    this.log = log;
  }

  /** Get the WebRTC MediaStreamTrack to add to RTCPeerConnection. */
  getTrack(): MediaStreamTrack {
    return this.track;
  }

  /**
   * Start playing a video file. Decodes via FFmpeg to raw I420 frames
   * and feeds them at the video's frame rate.
   */
  start(
    filePath: string,
    options?: {
      width?: number;
      height?: number;
      fps?: number;
      loop?: boolean;
      onTrackEnded?: () => void;
    },
  ): void {
    this.stop();

    this.currentFilePath = filePath;
    this.width = options?.width ?? DEFAULT_WIDTH;
    this.height = options?.height ?? DEFAULT_HEIGHT;
    this.fps = options?.fps ?? DEFAULT_FPS;
    this.frameIntervalMs = 1000 / this.fps;
    this.looping = options?.loop ?? true;
    this.onTrackEnded = options?.onTrackEnded ?? null;
    this.stopped = false;
    this.paused = false;
    this.frameBuffer = [];
    this.lastFrame = null;

    this.startDecoding(filePath);
    this.startFeeding();

    this.log.debug(`[VIDEO] Started playback: ${filePath} (${this.width}x${this.height} @ ${this.fps}fps)`);
  }

  /** Switch to a different video file. */
  switchVideo(filePath: string, options?: { width?: number; height?: number; fps?: number }): void {
    if (this.stopped) {
      this.start(filePath, options);
      return;
    }

    this.killFfmpeg();
    this.frameBuffer = [];
    this.currentFilePath = filePath;

    if (options?.width) this.width = options.width;
    if (options?.height) this.height = options.height;
    if (options?.fps) {
      this.fps = options.fps;
      this.frameIntervalMs = 1000 / this.fps;
      this.startFeeding();
    }

    this.startDecoding(filePath);
    this.log.debug(`[VIDEO] Switched to: ${filePath}`);
  }

  /** Pause video (sends last frame repeatedly). */
  pause(): void {
    this.paused = true;
    this.log.debug('[VIDEO] Paused');
  }

  /** Resume video playback. */
  resume(): void {
    this.paused = false;
    this.log.debug('[VIDEO] Resumed');
  }

  /** Stop playback and clean up. */
  stop(): void {
    this.stopped = true;
    this.killFfmpeg();

    if (this.feedInterval) {
      clearInterval(this.feedInterval);
      this.feedInterval = null;
    }

    this.frameBuffer = [];
    this.lastFrame = null;
    this.currentFilePath = null;

    this.log.debug('[VIDEO] Stopped');
  }

  get isPlaying(): boolean {
    return !this.stopped && !this.paused;
  }

  get currentFile(): string | null {
    return this.currentFilePath;
  }

  // ── Decoding ────────────────────────────────────────────────────────────

  private startDecoding(filePath: string): void {
    this.ffmpegProcess = spawn(this.ffmpegPath, [
      '-i', filePath,
      '-f', 'rawvideo',
      '-pix_fmt', 'yuv420p',       // I420 format — required by wrtc
      '-s', `${this.width}x${this.height}`,
      '-r', String(this.fps),
      '-v', 'error',
      'pipe:1',
    ]);

    let partialBuffer = Buffer.alloc(0);

    this.ffmpegProcess.stdout?.on('data', (chunk: Buffer) => {
      partialBuffer = Buffer.concat([partialBuffer, chunk]);

      while (partialBuffer.length >= this.frameSize) {
        const frame = partialBuffer.subarray(0, this.frameSize);
        partialBuffer = partialBuffer.subarray(this.frameSize);

        if (this.frameBuffer.length < this.maxBufferedFrames) {
          this.frameBuffer.push(Buffer.from(frame));
        } else {
          this.frameBuffer.shift();
          this.frameBuffer.push(Buffer.from(frame));
        }
      }
    });

    this.ffmpegProcess.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) this.log.debug(`[FFMPEG-VIDEO] ${msg}`);
    });

    this.ffmpegProcess.on('close', (code) => {
      if (this.stopped) return;

      if (code === 0 || code === null) {
        this.log.debug(`[VIDEO] FFmpeg finished decoding: ${filePath}`);
      } else {
        this.log.error(`[VIDEO] FFmpeg exited with code ${code}`);
      }
    });

    this.ffmpegProcess.on('error', (err) => {
      this.log.error('[VIDEO] FFmpeg spawn error:', err);
    });
  }

  // ── Feeding ─────────────────────────────────────────────────────────────

  private startFeeding(): void {
    if (this.feedInterval) clearInterval(this.feedInterval);

    this.feedInterval = setInterval(() => {
      this.feedFrame();
    }, this.frameIntervalMs);
  }

  private feedFrame(): void {
    if (this.stopped) return;

    let frameData: Buffer | null = null;

    if (this.paused) {
      frameData = this.lastFrame;
    } else if (this.frameBuffer.length > 0) {
      frameData = this.frameBuffer.shift()!;
      this.lastFrame = frameData;
    } else if (this.ffmpegProcess === null || this.ffmpegProcess.exitCode !== null) {
      // FFmpeg done and buffer empty — video ended
      if (this.looping && this.currentFilePath) {
        this.log.debug('[VIDEO] Video ended, looping...');
        this.startDecoding(this.currentFilePath);
      } else {
        this.onTrackEnded?.();
      }
      frameData = this.lastFrame;
    } else {
      // Buffer underrun — send last frame
      frameData = this.lastFrame;
    }

    if (!frameData) return;

    try {
      this.source.onFrame({
        width: this.width,
        height: this.height,
        data: new Uint8ClampedArray(frameData.buffer, frameData.byteOffset, frameData.byteLength),
      });
    } catch (err) {
      this.log.debug('[VIDEO] Frame feed error:', err);
    }
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
 * Parse resolution string like "3840x2160" into { width, height }.
 */
export function parseResolution(resolution: string): { width: number; height: number } | null {
  const match = resolution.match(/^(\d+)x(\d+)$/);
  if (!match) return null;
  return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
}
