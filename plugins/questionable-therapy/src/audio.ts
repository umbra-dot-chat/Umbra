/**
 * ZenAudioEngine — Web Audio API ambient sound synthesis.
 *
 * Generates procedural ambient soundscapes (rain, ocean, forest, bells,
 * binaural beats) using oscillators, noise buffers, and filters.
 * Runs independently from the app's SoundEngine.
 */

import { ZEN_TRACKS } from './constants';

/** Duration of crossfade when switching tracks (ms). */
const CROSSFADE_MS = 500;

/** Sample rate for noise buffers. */
const SAMPLE_RATE = 44100;

/** Active nodes for a single track that can be torn down. */
interface TrackNodes {
  nodes: AudioNode[];
  gains: GainNode[];
  intervals: number[];
}

/**
 * Create a white noise AudioBuffer.
 */
function createNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = SAMPLE_RATE * seconds;
  const buffer = ctx.createBuffer(1, length, SAMPLE_RATE);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Create a brown noise AudioBuffer (integrated white noise).
 */
function createBrownNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = SAMPLE_RATE * seconds;
  const buffer = ctx.createBuffer(1, length, SAMPLE_RATE);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

// -- Track builders -----------------------------------------------------------

/**
 * Rain Garden: lowpass-filtered white noise + soft 60Hz drone.
 */
function createRainGarden(ctx: AudioContext, master: GainNode): TrackNodes {
  const nodes: AudioNode[] = [];
  const gains: GainNode[] = [];

  // Rain: looping white noise through a lowpass filter
  const noiseBuffer = createNoiseBuffer(ctx, 4);
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noiseBuffer;
  noiseSrc.loop = true;

  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 500;
  lp.Q.value = 0.7;

  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.6;

  noiseSrc.connect(lp).connect(noiseGain).connect(master);
  noiseSrc.start();
  nodes.push(noiseSrc, lp, noiseGain);
  gains.push(noiseGain);

  // Drone: soft sine at 60Hz
  const drone = ctx.createOscillator();
  drone.type = 'sine';
  drone.frequency.value = 60;

  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.08;

  drone.connect(droneGain).connect(master);
  drone.start();
  nodes.push(drone, droneGain);
  gains.push(droneGain);

  return { nodes, gains, intervals: [] };
}

/**
 * Ocean Breath: white noise with LFO-modulated gain + deep 40Hz hum.
 */
function createOceanBreath(ctx: AudioContext, master: GainNode): TrackNodes {
  const nodes: AudioNode[] = [];
  const gains: GainNode[] = [];

  // Waves: white noise with slow gain LFO
  const noiseBuffer = createNoiseBuffer(ctx, 4);
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noiseBuffer;
  noiseSrc.loop = true;

  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 800;

  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.3;

  // LFO to modulate noise gain for wave effect
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.1;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.25;
  lfo.connect(lfoGain).connect(noiseGain.gain);
  lfo.start();

  noiseSrc.connect(lp).connect(noiseGain).connect(master);
  noiseSrc.start();
  nodes.push(noiseSrc, lp, noiseGain, lfo, lfoGain);
  gains.push(noiseGain);

  // Deep hum at 40Hz
  const hum = ctx.createOscillator();
  hum.type = 'sine';
  hum.frequency.value = 40;
  const humGain = ctx.createGain();
  humGain.gain.value = 0.06;
  hum.connect(humGain).connect(master);
  hum.start();
  nodes.push(hum, humGain);
  gains.push(humGain);

  return { nodes, gains, intervals: [] };
}

/**
 * Forest Floor: brown noise + highpass shimmer + gentle random chirps.
 */
function createForestFloor(ctx: AudioContext, master: GainNode): TrackNodes {
  const nodes: AudioNode[] = [];
  const gains: GainNode[] = [];
  const intervals: number[] = [];

  // Brown noise for base ambience
  const brownBuffer = createBrownNoiseBuffer(ctx, 4);
  const brownSrc = ctx.createBufferSource();
  brownSrc.buffer = brownBuffer;
  brownSrc.loop = true;

  const brownGain = ctx.createGain();
  brownGain.gain.value = 0.4;
  brownSrc.connect(brownGain).connect(master);
  brownSrc.start();
  nodes.push(brownSrc, brownGain);
  gains.push(brownGain);

  // Highpass shimmer from white noise
  const shimmerBuffer = createNoiseBuffer(ctx, 2);
  const shimmerSrc = ctx.createBufferSource();
  shimmerSrc.buffer = shimmerBuffer;
  shimmerSrc.loop = true;

  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 6000;

  const shimmerGain = ctx.createGain();
  shimmerGain.gain.value = 0.03;
  shimmerSrc.connect(hp).connect(shimmerGain).connect(master);
  shimmerSrc.start();
  nodes.push(shimmerSrc, hp, shimmerGain);
  gains.push(shimmerGain);

  // Random chirps at pentatonic frequencies
  const chirpFreqs = [1200, 1500, 1800, 2000, 2400];
  const chirpInterval = setInterval(() => {
    if (ctx.state !== 'running') return;
    const freq = chirpFreqs[Math.floor(Math.random() * chirpFreqs.length)];
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.02, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(g).connect(master);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }, 2000 + Math.random() * 3000);
  intervals.push(chirpInterval as unknown as number);

  return { nodes, gains, intervals };
}

/**
 * Temple Bells: pentatonic sine chimes with exponential decay, random timing.
 */
function createTempleBells(ctx: AudioContext, master: GainNode): TrackNodes {
  const nodes: AudioNode[] = [];
  const gains: GainNode[] = [];
  const intervals: number[] = [];

  // Soft pad for ambience
  const padFreqs = [261.6, 329.6, 392.0]; // C4, E4, G4
  for (const freq of padFreqs) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = 0.015;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 400;
    osc.connect(lp).connect(g).connect(master);
    osc.start();
    nodes.push(osc, lp, g);
    gains.push(g);
  }

  // Random bell chimes at pentatonic intervals
  const bellFreqs = [523.3, 587.3, 659.3, 784.0, 880.0]; // C5, D5, E5, G5, A5
  const bellInterval = setInterval(() => {
    if (ctx.state !== 'running') return;
    const freq = bellFreqs[Math.floor(Math.random() * bellFreqs.length)];
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
    osc.connect(g).connect(master);
    osc.start();
    osc.stop(ctx.currentTime + 2.5);
  }, 1500 + Math.random() * 4000);
  intervals.push(bellInterval as unknown as number);

  return { nodes, gains, intervals };
}

/**
 * Starlight: binaural beats (200Hz + 210Hz) + warm C-E-G chord pad.
 */
function createStarlight(ctx: AudioContext, master: GainNode): TrackNodes {
  const nodes: AudioNode[] = [];
  const gains: GainNode[] = [];

  // Binaural: two close frequencies for 10Hz alpha wave beat
  const binL = ctx.createOscillator();
  binL.type = 'sine';
  binL.frequency.value = 200;
  const binR = ctx.createOscillator();
  binR.type = 'sine';
  binR.frequency.value = 210;

  const binGain = ctx.createGain();
  binGain.gain.value = 0.05;

  binL.connect(binGain);
  binR.connect(binGain);
  binGain.connect(master);
  binL.start();
  binR.start();
  nodes.push(binL, binR, binGain);
  gains.push(binGain);

  // Warm chord pad: C-E-G filtered
  const chordFreqs = [130.8, 164.8, 196.0]; // C3, E3, G3
  for (const freq of chordFreqs) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 300;
    const g = ctx.createGain();
    g.gain.value = 0.04;
    osc.connect(lp).connect(g).connect(master);
    osc.start();
    nodes.push(osc, lp, g);
    gains.push(g);
  }

  return { nodes, gains, intervals: [] };
}

// -- Track builder registry ---------------------------------------------------

const TRACK_BUILDERS = [
  createRainGarden,
  createOceanBreath,
  createForestFloor,
  createTempleBells,
  createStarlight,
];

// -- ZenAudioEngine -----------------------------------------------------------

export class ZenAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeTrack: TrackNodes | null = null;
  private activeTrackIndex = -1;

  /**
   * Ensure the AudioContext exists and is running.
   * Must be called from a user gesture handler for auto-play policy.
   */
  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /** Stop and disconnect all nodes for the active track. */
  private teardownTrack(): void {
    if (!this.activeTrack) return;
    for (const interval of this.activeTrack.intervals) {
      clearInterval(interval);
    }
    for (const node of this.activeTrack.nodes) {
      try {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          (node as OscillatorNode).stop();
        }
      } catch {
        // Already stopped
      }
      try {
        node.disconnect();
      } catch {
        // Already disconnected
      }
    }
    this.activeTrack = null;
    this.activeTrackIndex = -1;
  }

  /** Play the track at the given index (0-based). */
  play(trackIndex: number): void {
    const ctx = this.ensureContext();
    if (!this.masterGain) return;

    // If same track is already playing, just resume
    if (this.activeTrackIndex === trackIndex && this.activeTrack) {
      return;
    }

    // Crossfade: ramp old track down
    if (this.activeTrack && this.masterGain) {
      const oldGain = this.masterGain;
      const currentVal = oldGain.gain.value;
      oldGain.gain.setValueAtTime(currentVal, ctx.currentTime);
      oldGain.gain.linearRampToValueAtTime(0, ctx.currentTime + CROSSFADE_MS / 1000);

      const oldTrack = this.activeTrack;
      const oldIntervals = oldTrack.intervals;
      setTimeout(() => {
        for (const interval of oldIntervals) {
          clearInterval(interval);
        }
        for (const node of oldTrack.nodes) {
          try {
            if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
              (node as OscillatorNode).stop();
            }
          } catch { /* ignore */ }
          try { node.disconnect(); } catch { /* ignore */ }
        }
      }, CROSSFADE_MS);

      // Create new master gain for the new track
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(
        this._volume,
        ctx.currentTime + CROSSFADE_MS / 1000,
      );
      this.masterGain.connect(ctx.destination);
    }

    const builder = TRACK_BUILDERS[trackIndex];
    if (!builder || !this.masterGain) return;

    this.activeTrack = builder(ctx, this.masterGain);
    this.activeTrackIndex = trackIndex;
  }

  /** Pause playback by suspending the AudioContext. */
  pause(): void {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  /** Resume playback. */
  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /** Internal volume tracker. */
  private _volume = 0.3;

  /** Set master volume (0.0 - 1.0). */
  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this._volume, this.ctx.currentTime);
    }
  }

  /** Stop all audio and release resources. */
  stop(): void {
    this.teardownTrack();
    if (this.ctx) {
      this.ctx.close().catch(() => { /* ignore */ });
      this.ctx = null;
      this.masterGain = null;
    }
  }

  /** Get the number of available tracks. */
  get trackCount(): number {
    return ZEN_TRACKS.length;
  }
}
