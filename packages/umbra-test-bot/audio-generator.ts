/**
 * AudioGenerator — Synthetic audio signal generator for test calls.
 *
 * Generates audible test audio (sine waves, frequency sweeps, DTMF tones)
 * as Int16 PCM frames suitable for WebRTC's RTCAudioSource.
 *
 * No external dependencies — pure TypeScript math.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type AudioMode = 'sine' | 'sweep' | 'dtmf' | 'silence';

export interface AudioGeneratorConfig {
  /** Sample rate in Hz (default 48000) */
  sampleRate: number;
  /** Audio mode */
  mode: AudioMode;
  /** Base frequency for sine mode (default 440 — A4 note) */
  frequency: number;
  /** Amplitude 0.0–1.0 (default 0.3 to avoid clipping) */
  amplitude: number;
}

const DEFAULT_CONFIG: AudioGeneratorConfig = {
  sampleRate: 48000,
  mode: 'sine',
  frequency: 440,
  amplitude: 0.3,
};

// DTMF tone pairs (row freq + column freq)
const DTMF_TONES: [number, number][] = [
  [697, 1209], // 1
  [697, 1336], // 2
  [697, 1477], // 3
  [770, 1209], // 4
  [770, 1336], // 5
  [770, 1477], // 6
  [852, 1209], // 7
  [852, 1336], // 8
  [852, 1477], // 9
  [941, 1336], // 0
  [941, 1209], // *
  [941, 1477], // #
];

// ─────────────────────────────────────────────────────────────────────────────
// AudioGenerator
// ─────────────────────────────────────────────────────────────────────────────

export class AudioGenerator {
  private config: AudioGeneratorConfig;
  private phase = 0;
  private sampleIndex = 0;
  private stopped = false;

  // Sweep state
  private sweepMinFreq = 200;
  private sweepMaxFreq = 2000;
  private sweepDurationSamples: number;

  // DTMF state
  private dtmfIndex = 0;
  private dtmfToneSamples: number;
  private dtmfGapSamples: number;

  constructor(config: Partial<AudioGeneratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // Sweep: 5 seconds per cycle
    this.sweepDurationSamples = this.config.sampleRate * 5;
    // DTMF: 200ms tone + 100ms gap
    this.dtmfToneSamples = Math.floor(this.config.sampleRate * 0.2);
    this.dtmfGapSamples = Math.floor(this.config.sampleRate * 0.1);
  }

  /**
   * Get the next audio frame (10ms = 480 samples at 48kHz).
   * Returns Int16Array suitable for RTCAudioSource.onData().
   */
  getNextFrame(samplesPerFrame: number = 480): Int16Array {
    if (this.stopped) return new Int16Array(samplesPerFrame);

    switch (this.config.mode) {
      case 'sine':
        return this.generateSine(samplesPerFrame);
      case 'sweep':
        return this.generateSweep(samplesPerFrame);
      case 'dtmf':
        return this.generateDtmf(samplesPerFrame);
      case 'silence':
      default:
        return new Int16Array(samplesPerFrame);
    }
  }

  /**
   * Change the audio mode at runtime.
   */
  setMode(mode: AudioMode): void {
    this.config.mode = mode;
    this.phase = 0;
    this.sampleIndex = 0;
    this.dtmfIndex = 0;
  }

  /**
   * Stop generating audio.
   */
  stop(): void {
    this.stopped = true;
  }

  // ─── Generators ────────────────────────────────────────────────────────────

  /**
   * Continuous sine wave at the configured frequency.
   */
  private generateSine(count: number): Int16Array {
    const samples = new Int16Array(count);
    const { sampleRate, frequency, amplitude } = this.config;
    const phaseIncrement = (2 * Math.PI * frequency) / sampleRate;
    const maxVal = 32767 * amplitude;

    for (let i = 0; i < count; i++) {
      samples[i] = Math.round(Math.sin(this.phase) * maxVal);
      this.phase += phaseIncrement;
      // Keep phase in [0, 2*PI) to avoid floating point drift
      if (this.phase >= 2 * Math.PI) this.phase -= 2 * Math.PI;
    }

    return samples;
  }

  /**
   * Frequency sweep from 200Hz to 2000Hz over 5 seconds, repeating.
   */
  private generateSweep(count: number): Int16Array {
    const samples = new Int16Array(count);
    const { sampleRate, amplitude } = this.config;
    const maxVal = 32767 * amplitude;

    for (let i = 0; i < count; i++) {
      // Linear interpolation of frequency
      const t = (this.sampleIndex % this.sweepDurationSamples) / this.sweepDurationSamples;
      const freq = this.sweepMinFreq + (this.sweepMaxFreq - this.sweepMinFreq) * t;

      const phaseIncrement = (2 * Math.PI * freq) / sampleRate;
      samples[i] = Math.round(Math.sin(this.phase) * maxVal);
      this.phase += phaseIncrement;
      if (this.phase >= 2 * Math.PI) this.phase -= 2 * Math.PI;

      this.sampleIndex++;
    }

    return samples;
  }

  /**
   * DTMF tone sequence — cycles through all 12 tones.
   * 200ms tone + 100ms silence per digit.
   */
  private generateDtmf(count: number): Int16Array {
    const samples = new Int16Array(count);
    const { sampleRate, amplitude } = this.config;
    const maxVal = 32767 * amplitude;
    const cycleSamples = this.dtmfToneSamples + this.dtmfGapSamples;

    for (let i = 0; i < count; i++) {
      const posInCycle = this.sampleIndex % cycleSamples;

      if (posInCycle < this.dtmfToneSamples) {
        // Generate dual-tone
        const [freqLow, freqHigh] = DTMF_TONES[this.dtmfIndex % DTMF_TONES.length];
        const phaseLow = (2 * Math.PI * freqLow * this.sampleIndex) / sampleRate;
        const phaseHigh = (2 * Math.PI * freqHigh * this.sampleIndex) / sampleRate;
        // Mix both tones at half amplitude each
        samples[i] = Math.round((Math.sin(phaseLow) + Math.sin(phaseHigh)) * 0.5 * maxVal);
      }
      // else: silence (gap between tones), Int16Array is zero-initialized

      this.sampleIndex++;

      // Advance to next DTMF digit when cycle completes
      if (this.sampleIndex % cycleSamples === 0) {
        this.dtmfIndex = (this.dtmfIndex + 1) % DTMF_TONES.length;
      }
    }

    return samples;
  }
}
