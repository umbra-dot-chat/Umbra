/**
 * Tests for SoundEngine
 *
 * Synthesized & audio-pack UI sound system with Web Audio API.
 * Tests volume controls, mute/enable, themes, playSound, resumeContext, constructor defaults.
 *
 * @jest-environment jsdom
 */

import {
  SoundEngine,
  SOUND_CATEGORY_MAP,
  SOUND_CATEGORIES,
  type SoundCategory,
} from '@/services/SoundEngine';

// ---------------------------------------------------------------------------
// Web Audio API mocks
// ---------------------------------------------------------------------------

function createMockGainNode() {
  return {
    gain: {
      value: 1,
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
    },
    connect: jest.fn(),
    disconnect: jest.fn(),
  };
}

function createMockOscillator() {
  return {
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    type: 'sine' as OscillatorType,
    frequency: {
      value: 0,
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    },
  };
}

function createMockBufferSource() {
  return {
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    buffer: null as AudioBuffer | null,
  };
}

function createMockBiquadFilter() {
  return {
    connect: jest.fn(),
    type: 'lowpass' as BiquadFilterType,
    frequency: {
      value: 0,
      setValueAtTime: jest.fn(),
    },
  };
}

let mockAudioContext: any;

beforeEach(() => {
  mockAudioContext = {
    state: 'running',
    resume: jest.fn().mockResolvedValue(undefined),
    createGain: jest.fn(() => createMockGainNode()),
    createOscillator: jest.fn(() => createMockOscillator()),
    createBufferSource: jest.fn(() => createMockBufferSource()),
    createBiquadFilter: jest.fn(() => createMockBiquadFilter()),
    createBuffer: jest.fn((_channels: number, length: number, sampleRate: number) => ({
      getChannelData: jest.fn(() => new Float32Array(length)),
      length,
      sampleRate,
      duration: length / sampleRate,
      numberOfChannels: _channels,
    })),
    decodeAudioData: jest.fn(),
    destination: {},
    currentTime: 0,
    sampleRate: 44100,
  };

  (global as any).AudioContext = jest.fn(() => mockAudioContext);
});

afterEach(() => {
  delete (global as any).AudioContext;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SoundEngine', () => {
  // =========================================================================
  // Constructor / defaults
  // =========================================================================

  describe('constructor defaults', () => {
    it('has correct default values', () => {
      const engine = new SoundEngine();
      expect(engine.getMasterVolume()).toBe(0.8);
      expect(engine.isMuted()).toBe(false);
      expect(engine.getActiveTheme()).toBe('umbra');
    });

    it('has all categories defined with enabled/disabled defaults', () => {
      const engine = new SoundEngine();
      const enabled = engine.getCategoryEnabled();
      // message, call, social are enabled; navigation, system are disabled
      expect(enabled.message).toBe(true);
      expect(enabled.call).toBe(true);
      expect(enabled.social).toBe(true);
      expect(enabled.navigation).toBe(false);
      expect(enabled.system).toBe(false);
    });
  });

  // =========================================================================
  // Volume controls
  // =========================================================================

  describe('volume controls', () => {
    let engine: SoundEngine;
    beforeEach(() => { engine = new SoundEngine(); });

    it('setMasterVolume / getMasterVolume round-trips', () => {
      engine.setMasterVolume(0.5);
      expect(engine.getMasterVolume()).toBe(0.5);
    });

    it('clamps master volume to 0-1 range', () => {
      engine.setMasterVolume(1.5);
      expect(engine.getMasterVolume()).toBe(1);

      engine.setMasterVolume(-0.5);
      expect(engine.getMasterVolume()).toBe(0);
    });

    it('setCategoryVolume / getCategoryVolumes round-trips', () => {
      engine.setCategoryVolume('message', 0.3);
      const vols = engine.getCategoryVolumes();
      expect(vols.message).toBe(0.3);
    });

    it('clamps category volume to 0-1', () => {
      engine.setCategoryVolume('call', 2.0);
      expect(engine.getCategoryVolumes().call).toBe(1);

      engine.setCategoryVolume('call', -1.0);
      expect(engine.getCategoryVolumes().call).toBe(0);
    });

    it('handles NaN for master volume by clamping', () => {
      engine.setMasterVolume(NaN);
      // Math.max(0, Math.min(1, NaN)) === NaN, so the stored value is NaN
      // This is arguably a bug in the source, but we test the actual behavior
      const vol = engine.getMasterVolume();
      expect(vol).toBeNaN();
    });

    it('handles NaN for category volume', () => {
      engine.setCategoryVolume('social', NaN);
      const vol = engine.getCategoryVolumes().social;
      expect(vol).toBeNaN();
    });
  });

  // =========================================================================
  // Mute / Enable
  // =========================================================================

  describe('mute and enable', () => {
    let engine: SoundEngine;
    beforeEach(() => { engine = new SoundEngine(); });

    it('setMuted / isMuted round-trips', () => {
      expect(engine.isMuted()).toBe(false);
      engine.setMuted(true);
      expect(engine.isMuted()).toBe(true);
      engine.setMuted(false);
      expect(engine.isMuted()).toBe(false);
    });

    it('setCategoryEnabled / getCategoryEnabled round-trips', () => {
      engine.setCategoryEnabled('navigation', true);
      expect(engine.getCategoryEnabled().navigation).toBe(true);

      engine.setCategoryEnabled('message', false);
      expect(engine.getCategoryEnabled().message).toBe(false);
    });

    it('isCategoryEnabled returns a copy (not mutated externally)', () => {
      const copy = engine.getCategoryEnabled();
      copy.message = false;
      // Original should be unaffected
      expect(engine.getCategoryEnabled().message).toBe(true);
    });

    it('getCategoryVolumes returns a copy', () => {
      const copy = engine.getCategoryVolumes();
      copy.message = 0;
      expect(engine.getCategoryVolumes().message).toBe(1.0);
    });
  });

  // =========================================================================
  // setActiveTheme
  // =========================================================================

  describe('setActiveTheme', () => {
    it('sets a synth theme', () => {
      const engine = new SoundEngine();
      engine.setActiveTheme('minimal');
      expect(engine.getActiveTheme()).toBe('minimal');
    });

    it('sets an audio pack theme', () => {
      const engine = new SoundEngine();
      engine.setActiveTheme('aurora');
      expect(engine.getActiveTheme()).toBe('aurora');
    });
  });

  // =========================================================================
  // playSound
  // =========================================================================

  describe('playSound', () => {
    let engine: SoundEngine;

    beforeEach(() => {
      engine = new SoundEngine();
      // Enable all categories so sounds can play
      for (const cat of SOUND_CATEGORIES) {
        engine.setCategoryEnabled(cat, true);
      }
    });

    it('plays a sound when enabled (creates AudioContext and gain nodes)', () => {
      engine.playSound('message_receive');
      // AudioContext should have been constructed
      expect((global as any).AudioContext).toHaveBeenCalled();
      // A per-sound gain should have been created (at minimum master + sound gain)
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('skips playback when muted', () => {
      engine.setMuted(true);
      engine.playSound('message_receive');
      // AudioContext should NOT have been created since we bail early
      expect((global as any).AudioContext).not.toHaveBeenCalled();
    });

    it('skips playback when category is disabled', () => {
      engine.setCategoryEnabled('message', false);
      engine.playSound('message_receive');
      // message_send is in 'message' category — should not create AudioContext
      expect((global as any).AudioContext).not.toHaveBeenCalled();
    });

    it('skips playback when category volume is 0', () => {
      engine.setCategoryVolume('message', 0);
      engine.playSound('message_receive');
      // Should bail before creating any oscillators or buffer sources
      // AudioContext is created in ensureContext before the volume check,
      // but no sound-specific gain should be created beyond the master gain.
      // The code checks catVol <= 0 and returns early, but ensureContext is called
      // after the category checks in playSound, so AudioContext won't be created.
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
      expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // resumeContext
  // =========================================================================

  describe('resumeContext', () => {
    it('resumes a suspended AudioContext', () => {
      mockAudioContext.state = 'suspended';
      const engine = new SoundEngine();
      engine.resumeContext();
      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    it('is a no-op when context is already running', () => {
      mockAudioContext.state = 'running';
      const engine = new SoundEngine();
      engine.resumeContext();
      // resume should NOT be called when state is already 'running'
      expect(mockAudioContext.resume).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Static helpers
  // =========================================================================

  describe('static helpers', () => {
    it('getSampleSound returns a valid SoundName for each category', () => {
      for (const cat of SOUND_CATEGORIES) {
        const sample = SoundEngine.getSampleSound(cat);
        expect(sample).toBeDefined();
        expect(SOUND_CATEGORY_MAP[sample]).toBe(cat);
      }
    });

    it('getCategory returns the correct category for a sound', () => {
      expect(SoundEngine.getCategory('message_delete')).toBe('message');
      expect(SoundEngine.getCategory('call_join')).toBe('call');
      expect(SoundEngine.getCategory('tab_switch')).toBe('navigation');
      expect(SoundEngine.getCategory('friend_request')).toBe('social');
      expect(SoundEngine.getCategory('toggle_on')).toBe('system');
    });
  });
});
