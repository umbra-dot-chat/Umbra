/**
 * SoundEngine — Synthesized & audio-pack UI sound system.
 *
 * Supports multiple "sound themes":
 *   • 4 synthesized presets (Minimal, Playful, Warm, Futuristic) — Web Audio API
 *   • 2 bundled CC0 audio packs — pre-recorded .mp3 files
 *
 * The engine resolves a SoundName → either a synthesis recipe or an audio file
 * URL depending on the active theme.  Volume is controlled per-category with a
 * master gain.
 *
 * Browser autoplay: AudioContext starts suspended.  Call `resumeContext()` once
 * from a user gesture to unlock playback.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SoundCategory = 'message' | 'call' | 'navigation' | 'social' | 'system';

export const SOUND_CATEGORIES: SoundCategory[] = ['message', 'call', 'navigation', 'social', 'system'];

export const CATEGORY_LABELS: Record<SoundCategory, string> = {
  message: 'Messages',
  call: 'Calls',
  navigation: 'Navigation',
  social: 'Social',
  system: 'System',
};

export type SoundName =
  // Message
  | 'message_send'
  | 'message_receive'
  | 'message_delete'
  | 'mention'
  // Call
  | 'call_join'
  | 'call_leave'
  | 'call_ringing'
  | 'user_join_voice'
  | 'user_leave_voice'
  | 'call_mute'
  | 'call_unmute'
  // Navigation
  | 'tab_switch'
  | 'dialog_open'
  | 'dialog_close'
  // Social
  | 'friend_request'
  | 'friend_accept'
  | 'notification'
  // System
  | 'toggle_on'
  | 'toggle_off'
  | 'error'
  | 'success';

export const ALL_SOUND_NAMES: SoundName[] = [
  'message_send', 'message_receive', 'message_delete', 'mention',
  'call_join', 'call_leave', 'call_ringing', 'user_join_voice', 'user_leave_voice', 'call_mute', 'call_unmute',
  'tab_switch', 'dialog_open', 'dialog_close',
  'friend_request', 'friend_accept', 'notification',
  'toggle_on', 'toggle_off', 'error', 'success',
];

/** Map each sound to its category. */
export const SOUND_CATEGORY_MAP: Record<SoundName, SoundCategory> = {
  message_send: 'message', message_receive: 'message', message_delete: 'message', mention: 'message',
  call_join: 'call', call_leave: 'call', call_ringing: 'call', user_join_voice: 'call',
  user_leave_voice: 'call', call_mute: 'call', call_unmute: 'call',
  tab_switch: 'navigation', dialog_open: 'navigation', dialog_close: 'navigation',
  friend_request: 'social', friend_accept: 'social', notification: 'social',
  toggle_on: 'system', toggle_off: 'system', error: 'system', success: 'system',
};

// ─────────────────────────────────────────────────────────────────────────────
// Sound Theme types
// ─────────────────────────────────────────────────────────────────────────────

export type SoundThemeId =
  | 'minimal'
  | 'playful'
  | 'warm'
  | 'futuristic'
  | 'aurora'
  | 'mechanical';

export interface SoundThemeMeta {
  id: SoundThemeId;
  name: string;
  description: string;
  type: 'synth' | 'audio';
}

export const SOUND_THEMES: SoundThemeMeta[] = [
  { id: 'minimal', name: 'Minimal', description: 'Subtle, barely-there ticks and blips', type: 'synth' },
  { id: 'playful', name: 'Playful', description: 'Cheerful tones and musical arpeggios', type: 'synth' },
  { id: 'warm', name: 'Warm', description: 'Soft, rounded tones with gentle tails', type: 'synth' },
  { id: 'futuristic', name: 'Futuristic', description: 'Crisp digital tones and sci-fi swooshes', type: 'synth' },
  { id: 'aurora', name: 'Aurora', description: 'Ethereal nature-inspired sound pack', type: 'audio' },
  { id: 'mechanical', name: 'Mechanical', description: 'Satisfying tactile clicks and clacks', type: 'audio' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Synthesis recipe type
// ─────────────────────────────────────────────────────────────────────────────

type SynthRecipe = (ctx: AudioContext, gain: GainNode) => void;

// ─────────────────────────────────────────────────────────────────────────────
// Note frequencies (equal temperament, A4=440)
// ─────────────────────────────────────────────────────────────────────────────

const N: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, Bb3: 233.08, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  C6: 1046.5, D6: 1174.66, E6: 1318.51,
};

// ─────────────────────────────────────────────────────────────────────────────
// Synthesis helpers
// ─────────────────────────────────────────────────────────────────────────────

function toneSeq(
  ctx: AudioContext, out: GainNode, notes: number[], durMs: number,
  opts?: { type?: OscillatorType; gapMs?: number; vol?: number },
) {
  const type = opts?.type ?? 'sine';
  const gap = (opts?.gapMs ?? 0) / 1000;
  const vol = opts?.vol ?? 0.3;
  const dur = durMs / 1000;
  const atk = Math.min(0.01, dur * 0.1);
  const rel = Math.min(0.04, dur * 0.3);
  let t = ctx.currentTime;

  for (const freq of notes) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vol, t + atk);
    env.gain.setValueAtTime(vol, t + dur - rel);
    env.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(env);
    env.connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.01);
    t += dur + gap;
  }
}

function sweep(
  ctx: AudioContext, out: GainNode, fromHz: number, toHz: number, durMs: number,
  opts?: { type?: OscillatorType; vol?: number },
) {
  const dur = durMs / 1000;
  const vol = opts?.vol ?? 0.15;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = opts?.type ?? 'sine';
  osc.frequency.setValueAtTime(fromHz, now);
  osc.frequency.exponentialRampToValueAtTime(toHz, now + dur);
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(vol, now + 0.01);
  env.gain.setValueAtTime(vol, now + dur - 0.03);
  env.gain.linearRampToValueAtTime(0, now + dur);
  osc.connect(env);
  env.connect(out);
  osc.start(now);
  osc.stop(now + dur + 0.01);
}

function chord(
  ctx: AudioContext, out: GainNode, notes: number[], durMs: number,
  opts?: { type?: OscillatorType; vol?: number },
) {
  const dur = durMs / 1000;
  const vol = (opts?.vol ?? 0.25) / notes.length;
  const now = ctx.currentTime;
  for (const freq of notes) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = opts?.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, now);
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(vol, now + 0.01);
    env.gain.setValueAtTime(vol, now + dur - 0.04);
    env.gain.linearRampToValueAtTime(0, now + dur);
    osc.connect(env);
    env.connect(out);
    osc.start(now);
    osc.stop(now + dur + 0.01);
  }
}

function noiseBurst(
  ctx: AudioContext, out: GainNode, durMs: number,
  opts?: { highPass?: number; lowPass?: number; vol?: number },
) {
  const dur = durMs / 1000;
  const vol = opts?.vol ?? 0.15;
  const now = ctx.currentTime;
  const sz = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, sz, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const env = ctx.createGain();
  env.gain.setValueAtTime(vol, now);
  env.gain.exponentialRampToValueAtTime(0.001, now + dur);
  let node: AudioNode = src;
  if (opts?.highPass) {
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(opts.highPass, now);
    node.connect(hp);
    node = hp;
  }
  if (opts?.lowPass) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(opts.lowPass, now);
    node.connect(lp);
    node = lp;
  }
  node.connect(env);
  env.connect(out);
  src.start(now);
  src.stop(now + dur + 0.01);
}

// ─────────────────────────────────────────────────────────────────────────────
// Synth theme: Minimal — barely-there ticks and tones
// ─────────────────────────────────────────────────────────────────────────────

const MINIMAL: Record<SoundName, SynthRecipe> = {
  message_send:     (c, g) => toneSeq(c, g, [N.E5], 40, { vol: 0.1 }),
  message_receive:  (c, g) => toneSeq(c, g, [N.C5], 40, { vol: 0.08 }),
  message_delete:   (c, g) => noiseBurst(c, g, 25, { highPass: 400, lowPass: 1500, vol: 0.06 }),
  mention:          (c, g) => toneSeq(c, g, [N.G5, N.B5], 35, { vol: 0.1 }),
  call_join:        (c, g) => toneSeq(c, g, [N.C5, N.E5], 60, { vol: 0.12 }),
  call_leave:       (c, g) => toneSeq(c, g, [N.E5, N.C5], 60, { vol: 0.1 }),
  call_ringing:     (c, g) => toneSeq(c, g, [N.E5, N.G5], 120, { vol: 0.12, gapMs: 80 }),
  user_join_voice:  (c, g) => toneSeq(c, g, [N.E5], 30, { vol: 0.08 }),
  user_leave_voice: (c, g) => toneSeq(c, g, [N.C5], 30, { vol: 0.06 }),
  call_mute:        (c, g) => noiseBurst(c, g, 15, { highPass: 1000, lowPass: 3000, vol: 0.06 }),
  call_unmute:      (c, g) => noiseBurst(c, g, 15, { highPass: 2500, lowPass: 6000, vol: 0.06 }),
  tab_switch:       (c, g) => noiseBurst(c, g, 10, { highPass: 2000, lowPass: 5000, vol: 0.04 }),
  dialog_open:      (c, g) => sweep(c, g, 300, 600, 60, { vol: 0.06 }),
  dialog_close:     (c, g) => sweep(c, g, 600, 300, 60, { vol: 0.05 }),
  friend_request:   (c, g) => toneSeq(c, g, [N.C5, N.E5], 40, { vol: 0.1 }),
  friend_accept:    (c, g) => toneSeq(c, g, [N.C5, N.G5], 40, { vol: 0.1 }),
  notification:     (c, g) => toneSeq(c, g, [N.A5], 60, { vol: 0.08 }),
  toggle_on:        (c, g) => toneSeq(c, g, [N.E5], 20, { vol: 0.08 }),
  toggle_off:       (c, g) => toneSeq(c, g, [N.C5], 20, { vol: 0.06 }),
  error:            (c, g) => toneSeq(c, g, [N.A3], 80, { type: 'square', vol: 0.06 }),
  success:          (c, g) => toneSeq(c, g, [N.C5, N.E5], 50, { vol: 0.1 }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Synth theme: Playful — cheerful tones and arpeggios
// ─────────────────────────────────────────────────────────────────────────────

const PLAYFUL: Record<SoundName, SynthRecipe> = {
  message_send:     (c, g) => toneSeq(c, g, [N.C5, N.E5], 80, { vol: 0.2 }),
  message_receive:  (c, g) => toneSeq(c, g, [N.E5, N.C5], 80, { vol: 0.18 }),
  message_delete:   (c, g) => toneSeq(c, g, [N.A3], 100, { vol: 0.15 }),
  mention:          (c, g) => toneSeq(c, g, [N.G5, N.B5, N.D6], 60, { vol: 0.22 }),
  call_join:        (c, g) => toneSeq(c, g, [N.C4, N.E4, N.G4, N.C5], 100, { vol: 0.2 }),
  call_leave:       (c, g) => toneSeq(c, g, [N.C5, N.G4, N.E4, N.C4], 100, { vol: 0.2 }),
  call_ringing:     (c, g) => toneSeq(c, g, [N.E5, N.G5, N.E5, N.G5], 200, { vol: 0.25, gapMs: 50 }),
  user_join_voice:  (c, g) => toneSeq(c, g, [N.C5], 60, { vol: 0.18 }),
  user_leave_voice: (c, g) => toneSeq(c, g, [N.A4], 60, { vol: 0.15 }),
  call_mute:        (c, g) => noiseBurst(c, g, 30, { highPass: 800, lowPass: 2000, vol: 0.12 }),
  call_unmute:      (c, g) => noiseBurst(c, g, 30, { highPass: 2000, lowPass: 6000, vol: 0.12 }),
  tab_switch:       (c, g) => noiseBurst(c, g, 20, { highPass: 1000, lowPass: 4000, vol: 0.08 }),
  dialog_open:      (c, g) => sweep(c, g, 200, 800, 120, { vol: 0.12 }),
  dialog_close:     (c, g) => sweep(c, g, 800, 200, 120, { vol: 0.1 }),
  friend_request:   (c, g) => toneSeq(c, g, [N.C5, N.G5], 100, { vol: 0.2 }),
  friend_accept:    (c, g) => toneSeq(c, g, [N.C5, N.E5, N.G5], 80, { vol: 0.22 }),
  notification:     (c, g) => chord(c, g, [N.A5, N.A5 * 2], 150, { vol: 0.2 }),
  toggle_on:        (c, g) => toneSeq(c, g, [N.E5], 40, { vol: 0.15 }),
  toggle_off:       (c, g) => toneSeq(c, g, [N.C5], 40, { vol: 0.12 }),
  error:            (c, g) => chord(c, g, [N.A3, N.Bb3], 200, { type: 'sawtooth', vol: 0.15 }),
  success:          (c, g) => chord(c, g, [N.C5, N.E5, N.G5], 150, { vol: 0.25 }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Synth theme: Warm — soft, rounded tones with longer tails
// ─────────────────────────────────────────────────────────────────────────────

const WARM: Record<SoundName, SynthRecipe> = {
  message_send:     (c, g) => toneSeq(c, g, [N.C4, N.E4], 120, { vol: 0.15, type: 'sine' }),
  message_receive:  (c, g) => toneSeq(c, g, [N.E4, N.C4], 120, { vol: 0.13 }),
  message_delete:   (c, g) => toneSeq(c, g, [N.G3], 150, { vol: 0.1 }),
  mention:          (c, g) => toneSeq(c, g, [N.G4, N.B4, N.D5], 100, { vol: 0.15 }),
  call_join:        (c, g) => toneSeq(c, g, [N.C4, N.E4, N.G4], 150, { vol: 0.15 }),
  call_leave:       (c, g) => toneSeq(c, g, [N.G4, N.E4, N.C4], 150, { vol: 0.13 }),
  call_ringing:     (c, g) => toneSeq(c, g, [N.E4, N.G4, N.E4, N.G4], 250, { vol: 0.18, gapMs: 80 }),
  user_join_voice:  (c, g) => toneSeq(c, g, [N.E4], 100, { vol: 0.12 }),
  user_leave_voice: (c, g) => toneSeq(c, g, [N.C4], 100, { vol: 0.1 }),
  call_mute:        (c, g) => noiseBurst(c, g, 40, { highPass: 500, lowPass: 1500, vol: 0.08 }),
  call_unmute:      (c, g) => noiseBurst(c, g, 40, { highPass: 1000, lowPass: 3000, vol: 0.08 }),
  tab_switch:       (c, g) => noiseBurst(c, g, 30, { highPass: 800, lowPass: 2000, vol: 0.05 }),
  dialog_open:      (c, g) => sweep(c, g, 200, 500, 180, { vol: 0.08 }),
  dialog_close:     (c, g) => sweep(c, g, 500, 200, 180, { vol: 0.07 }),
  friend_request:   (c, g) => toneSeq(c, g, [N.C4, N.G4], 120, { vol: 0.13 }),
  friend_accept:    (c, g) => toneSeq(c, g, [N.C4, N.E4, N.G4], 100, { vol: 0.15 }),
  notification:     (c, g) => chord(c, g, [N.A4, N.A5], 200, { vol: 0.13 }),
  toggle_on:        (c, g) => toneSeq(c, g, [N.E4], 50, { vol: 0.1 }),
  toggle_off:       (c, g) => toneSeq(c, g, [N.C4], 50, { vol: 0.08 }),
  error:            (c, g) => chord(c, g, [N.A3, N.Bb3], 250, { type: 'sine', vol: 0.1 }),
  success:          (c, g) => chord(c, g, [N.C4, N.E4, N.G4], 200, { vol: 0.18 }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Synth theme: Futuristic — crisp digital tones and sci-fi swooshes
// ─────────────────────────────────────────────────────────────────────────────

const FUTURISTIC: Record<SoundName, SynthRecipe> = {
  message_send:     (c, g) => sweep(c, g, 400, 1200, 60, { type: 'square', vol: 0.12 }),
  message_receive:  (c, g) => sweep(c, g, 1200, 400, 60, { type: 'square', vol: 0.1 }),
  message_delete:   (c, g) => sweep(c, g, 600, 100, 80, { type: 'sawtooth', vol: 0.08 }),
  mention:          (c, g) => toneSeq(c, g, [N.A5, N.E6, N.A5], 40, { type: 'square', vol: 0.15 }),
  call_join:        (c, g) => sweep(c, g, 200, 2000, 200, { type: 'sawtooth', vol: 0.15 }),
  call_leave:       (c, g) => sweep(c, g, 2000, 200, 200, { type: 'sawtooth', vol: 0.13 }),
  call_ringing:     (c, g) => toneSeq(c, g, [N.E5, N.G5, N.E5, N.G5], 150, { type: 'square', vol: 0.18, gapMs: 30 }),
  user_join_voice:  (c, g) => sweep(c, g, 300, 900, 50, { type: 'square', vol: 0.1 }),
  user_leave_voice: (c, g) => sweep(c, g, 900, 300, 50, { type: 'square', vol: 0.08 }),
  call_mute:        (c, g) => noiseBurst(c, g, 20, { highPass: 2000, lowPass: 8000, vol: 0.1 }),
  call_unmute:      (c, g) => noiseBurst(c, g, 20, { highPass: 4000, lowPass: 12000, vol: 0.1 }),
  tab_switch:       (c, g) => noiseBurst(c, g, 15, { highPass: 3000, lowPass: 8000, vol: 0.06 }),
  dialog_open:      (c, g) => sweep(c, g, 100, 2000, 100, { type: 'sawtooth', vol: 0.08 }),
  dialog_close:     (c, g) => sweep(c, g, 2000, 100, 100, { type: 'sawtooth', vol: 0.07 }),
  friend_request:   (c, g) => toneSeq(c, g, [N.C5, N.G5], 50, { type: 'square', vol: 0.12 }),
  friend_accept:    (c, g) => toneSeq(c, g, [N.C5, N.E5, N.G5], 40, { type: 'square', vol: 0.14 }),
  notification:     (c, g) => sweep(c, g, 500, 1500, 100, { type: 'triangle', vol: 0.12 }),
  toggle_on:        (c, g) => sweep(c, g, 400, 1000, 25, { type: 'square', vol: 0.1 }),
  toggle_off:       (c, g) => sweep(c, g, 1000, 400, 25, { type: 'square', vol: 0.08 }),
  error:            (c, g) => chord(c, g, [N.A3, N.Bb3, N.E3], 180, { type: 'sawtooth', vol: 0.12 }),
  success:          (c, g) => sweep(c, g, 300, 3000, 120, { type: 'sawtooth', vol: 0.15 }),
};

const SYNTH_THEMES: Record<string, Record<SoundName, SynthRecipe>> = {
  minimal: MINIMAL,
  playful: PLAYFUL,
  warm: WARM,
  futuristic: FUTURISTIC,
};

// ─────────────────────────────────────────────────────────────────────────────
// Audio pack definition
// Audio packs map each SoundName → a URL relative to the public assets dir.
// We ship two CC0 packs: "aurora" (ethereal) and "mechanical" (tactile).
// ─────────────────────────────────────────────────────────────────────────────

const AUDIO_PACK_BASE = '/assets/sounds';

function audioPackUrls(packId: string): Record<SoundName, string> {
  const map: Record<string, string> = {};
  for (const name of ALL_SOUND_NAMES) {
    map[name] = `${AUDIO_PACK_BASE}/${packId}/${name}.mp3`;
  }
  return map as Record<SoundName, string>;
}

const AUDIO_PACKS: Record<string, Record<SoundName, string>> = {
  aurora: audioPackUrls('aurora'),
  mechanical: audioPackUrls('mechanical'),
};

// ─────────────────────────────────────────────────────────────────────────────
// SoundEngine class
// ─────────────────────────────────────────────────────────────────────────────

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private _masterVolume = 0.8;
  private _muted = false;
  private _categoryVolumes: Record<SoundCategory, number> = {
    message: 1.0,
    call: 1.0,
    navigation: 1.0,
    social: 1.0,
    system: 1.0,
  };
  private _activeTheme: SoundThemeId = 'playful';

  /** Cache of decoded audio buffers for audio packs. */
  private audioBufferCache = new Map<string, AudioBuffer>();
  /** Set of URLs currently being fetched (to avoid duplicate fetches). */
  private fetchingUrls = new Set<string>();

  // ── AudioContext management ──────────────────────────────────────────

  private ensureContext(): { ctx: AudioContext; masterGain: GainNode } | null {
    if (typeof AudioContext === 'undefined' && typeof (globalThis as any).webkitAudioContext === 'undefined') {
      return null;
    }
    if (!this.ctx) {
      const Ctor = typeof AudioContext !== 'undefined'
        ? AudioContext
        : (globalThis as any).webkitAudioContext;
      this.ctx = new Ctor() as AudioContext;
      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.setValueAtTime(this._masterVolume, this.ctx.currentTime);
      this.masterGainNode.connect(this.ctx.destination);
    }
    return { ctx: this.ctx, masterGain: this.masterGainNode! };
  }

  /** Resume AudioContext — call from a user gesture. */
  resumeContext(): void {
    const audio = this.ensureContext();
    if (audio?.ctx.state === 'suspended') {
      audio.ctx.resume().catch(() => {});
    }
  }

  // ── Theme management ─────────────────────────────────────────────────

  setActiveTheme(themeId: SoundThemeId): void {
    this._activeTheme = themeId;
  }

  getActiveTheme(): SoundThemeId {
    return this._activeTheme;
  }

  // ── Playback ─────────────────────────────────────────────────────────

  playSound(name: SoundName): void {
    if (this._muted) return;

    const category = SOUND_CATEGORY_MAP[name];
    const catVol = this._categoryVolumes[category] ?? 1.0;
    if (catVol <= 0) return;

    const audio = this.ensureContext();
    if (!audio) return;

    if (audio.ctx.state === 'suspended') {
      audio.ctx.resume().catch(() => {});
    }

    // Create per-sound gain for category volume
    const soundGain = audio.ctx.createGain();
    soundGain.gain.setValueAtTime(catVol, audio.ctx.currentTime);
    soundGain.connect(audio.masterGain);

    const themeMeta = SOUND_THEMES.find((t) => t.id === this._activeTheme);

    try {
      if (themeMeta?.type === 'audio') {
        this.playAudioPack(name, audio.ctx, soundGain);
      } else {
        this.playSynth(name, audio.ctx, soundGain);
      }
    } catch (err) {
      console.warn('[SoundEngine] Failed to play sound:', name, err);
    }
  }

  private playSynth(name: SoundName, ctx: AudioContext, gain: GainNode): void {
    const theme = SYNTH_THEMES[this._activeTheme];
    if (!theme) {
      // Fallback to playful
      PLAYFUL[name]?.(ctx, gain);
      return;
    }
    theme[name]?.(ctx, gain);
  }

  private playAudioPack(name: SoundName, ctx: AudioContext, gain: GainNode): void {
    const urls = AUDIO_PACKS[this._activeTheme];
    if (!urls) return;

    const url = urls[name];
    const cached = this.audioBufferCache.get(url);

    if (cached) {
      const src = ctx.createBufferSource();
      src.buffer = cached;
      src.connect(gain);
      src.start(ctx.currentTime);
    } else {
      // Fetch and decode in background, play when ready.
      // For the first time, the sound may be slightly delayed.
      // Fall back to synth for instant feedback.
      this.fetchAndPlayAudio(url, name, ctx, gain);
      // Also play synth as immediate fallback
      PLAYFUL[name]?.(ctx, gain);
    }
  }

  private async fetchAndPlayAudio(
    url: string,
    _name: SoundName,
    ctx: AudioContext,
    _gain: GainNode,
  ): Promise<void> {
    if (this.fetchingUrls.has(url)) return;
    this.fetchingUrls.add(url);

    try {
      const response = await fetch(url);
      if (!response.ok) return;
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.audioBufferCache.set(url, audioBuffer);
    } catch {
      // Audio file missing — synth fallback will be used
    } finally {
      this.fetchingUrls.delete(url);
    }
  }

  /** Pre-fetch all audio files for the active audio pack. */
  preloadAudioPack(themeId: SoundThemeId): void {
    const urls = AUDIO_PACKS[themeId];
    if (!urls) return;

    const audio = this.ensureContext();
    if (!audio) return;

    for (const name of ALL_SOUND_NAMES) {
      const url = urls[name];
      if (!this.audioBufferCache.has(url)) {
        this.fetchAndPlayAudio(url, name, audio.ctx, audio.masterGain);
      }
    }
  }

  // ── Volume / mute ────────────────────────────────────────────────────

  setMasterVolume(vol: number): void {
    this._masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGainNode && this.ctx) {
      this.masterGainNode.gain.setValueAtTime(this._masterVolume, this.ctx.currentTime);
    }
  }

  getMasterVolume(): number {
    return this._masterVolume;
  }

  setCategoryVolume(category: SoundCategory, vol: number): void {
    this._categoryVolumes[category] = Math.max(0, Math.min(1, vol));
  }

  getCategoryVolumes(): Record<SoundCategory, number> {
    return { ...this._categoryVolumes };
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
  }

  isMuted(): boolean {
    return this._muted;
  }

  // ── Static helpers ───────────────────────────────────────────────────

  static getSampleSound(category: SoundCategory): SoundName {
    const samples: Record<SoundCategory, SoundName> = {
      message: 'message_send',
      call: 'call_join',
      navigation: 'dialog_open',
      social: 'notification',
      system: 'success',
    };
    return samples[category];
  }

  static getCategory(name: SoundName): SoundCategory {
    return SOUND_CATEGORY_MAP[name];
  }
}
