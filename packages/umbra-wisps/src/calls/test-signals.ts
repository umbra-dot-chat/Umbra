/**
 * Synthetic test signal generators for wisp WebRTC calls.
 *
 * AudioSignalGenerator: 440Hz sine wave (48kHz mono PCM, 10ms frames)
 * VideoSignalGenerator: SMPTE color bars (I420 format, 640x480)
 *
 * Pure JS -- no FFmpeg dependency needed.
 */

const SAMPLE_RATE = 48000;
const SAMPLES_PER_FRAME = 480; // 10ms at 48kHz
const FREQ = 440; // A4 concert pitch
const AMPLITUDE = 0.3 * 32767;

export class AudioSignalGenerator {
  private phase = 0;

  /** Generate one 10ms frame of 48kHz 16-bit mono PCM. */
  nextFrame(): Int16Array {
    const samples = new Int16Array(SAMPLES_PER_FRAME);
    for (let i = 0; i < SAMPLES_PER_FRAME; i++) {
      samples[i] = Math.round(
        AMPLITUDE * Math.sin(2 * Math.PI * FREQ * this.phase / SAMPLE_RATE),
      );
      this.phase++;
    }
    return samples;
  }
}

// SMPTE color bar values in YUV (I420): [Y, U, V]
const SMPTE_BARS: [number, number, number][] = [
  [235, 128, 128], // White
  [210, 16, 146],  // Yellow
  [170, 166, 16],  // Cyan
  [145, 54, 34],   // Green
  [106, 202, 222], // Magenta
  [81, 90, 240],   // Red
  [41, 240, 110],  // Blue
  [16, 128, 128],  // Black
];

export const VIDEO_WIDTH = 640;
export const VIDEO_HEIGHT = 480;
export const VIDEO_FPS = 15;

export class VideoSignalGenerator {
  private frame: Uint8ClampedArray;

  constructor() {
    this.frame = buildColorBarsFrame();
  }

  /** Return the SMPTE color bar frame (same each call). */
  nextFrame(): Uint8ClampedArray {
    return this.frame;
  }
}

/** Build a single I420 frame with 8 SMPTE color bars. */
function buildColorBarsFrame(): Uint8ClampedArray {
  const size = VIDEO_WIDTH * VIDEO_HEIGHT * 3 / 2;
  const frame = new Uint8ClampedArray(size);
  const barWidth = Math.floor(VIDEO_WIDTH / 8);
  const uvW = VIDEO_WIDTH / 2;
  const uvH = VIDEO_HEIGHT / 2;
  const uOffset = VIDEO_WIDTH * VIDEO_HEIGHT;
  const vOffset = uOffset + uvW * uvH;

  // Y plane (full resolution)
  for (let y = 0; y < VIDEO_HEIGHT; y++) {
    for (let x = 0; x < VIDEO_WIDTH; x++) {
      const bar = Math.min(Math.floor(x / barWidth), 7);
      frame[y * VIDEO_WIDTH + x] = SMPTE_BARS[bar][0];
    }
  }
  // U plane (quarter resolution)
  for (let y = 0; y < uvH; y++) {
    for (let x = 0; x < uvW; x++) {
      const bar = Math.min(Math.floor((x * 2) / barWidth), 7);
      frame[uOffset + y * uvW + x] = SMPTE_BARS[bar][1];
    }
  }
  // V plane (quarter resolution)
  for (let y = 0; y < uvH; y++) {
    for (let x = 0; x < uvW; x++) {
      const bar = Math.min(Math.floor((x * 2) / barWidth), 7);
      frame[vOffset + y * uvW + x] = SMPTE_BARS[bar][2];
    }
  }
  return frame;
}
