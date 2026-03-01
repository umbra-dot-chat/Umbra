/**
 * Tests for useCallSettings hook
 *
 * Covers default values, setter behaviour, volume/blur clamping,
 * localStorage persistence & hydration, corrupt data fallback,
 * video/audio quality options, opus config, video effects,
 * background presets, and media E2EE toggle.
 *
 * Test IDs: T11.9.1 - T11.9.33
 */

import { renderHook, act } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// localStorage polyfill for jest-expo (not available by default)
// ---------------------------------------------------------------------------

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: jest.fn((key: string) => store[key] ?? null),
  setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: jest.fn((key: string) => { delete store[key]; }),
  clear: jest.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
  get length() { return Object.keys(store).length; },
  key: jest.fn((i: number) => Object.keys(store)[i] ?? null),
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/types/call', () => ({
  DEFAULT_OPUS_CONFIG: {
    application: 'voip',
    bitrate: 48,
    complexity: 10,
    fec: true,
    dtx: false,
    packetLoss: 10,
  },
}));

jest.mock('@/hooks/useVideoEffects', () => ({}));

import { useCallSettings } from '@/hooks/useCallSettings';

// ---------------------------------------------------------------------------
// Storage keys (must match the hook's STORAGE_KEYS)
// ---------------------------------------------------------------------------

const STORAGE_KEYS = {
  incomingCallDisplay: 'umbra_call_incoming_display',
  ringVolume: 'umbra_call_ring_volume',
  defaultVideoQuality: 'umbra_call_default_video_quality',
  defaultAudioQuality: 'umbra_call_default_audio_quality',
  opusConfig: 'umbra_call_opus_config',
  inputVolume: 'umbra_call_input_volume',
  outputVolume: 'umbra_call_output_volume',
  mediaE2EE: 'umbra_call_media_e2ee',
  videoEffect: 'umbra_call_video_effect',
  blurIntensity: 'umbra_call_blur_intensity',
  backgroundPresetId: 'umbra_call_bg_preset_id',
  customBackgroundUrl: 'umbra_call_custom_bg_url',
} as const;

const DEFAULT_OPUS_CONFIG = {
  application: 'voip',
  bitrate: 48,
  complexity: 10,
  fec: true,
  dtx: false,
  packetLoss: 10,
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorageMock.clear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// T11.9.1 — Default values on fresh mount
// ---------------------------------------------------------------------------

describe('T11.9.1 — Default Values', () => {
  it('T11.9.1 — returns correct defaults when localStorage is empty', () => {
    const { result } = renderHook(() => useCallSettings());

    expect(result.current.incomingCallDisplay).toBe('fullscreen');
    expect(result.current.ringVolume).toBe(80);
    expect(result.current.defaultVideoQuality).toBe('auto');
    expect(result.current.defaultAudioQuality).toBe('opus-voice');
    expect(result.current.opusConfig).toEqual(DEFAULT_OPUS_CONFIG);
    expect(result.current.inputVolume).toBe(100);
    expect(result.current.outputVolume).toBe(100);
    expect(result.current.mediaE2EE).toBe(false);
    expect(result.current.videoEffect).toBe('none');
    expect(result.current.blurIntensity).toBe(10);
    expect(result.current.backgroundPresetId).toBeNull();
    expect(result.current.customBackgroundUrl).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// T11.9.2-4 — Setter: incomingCallDisplay
// ---------------------------------------------------------------------------

describe('T11.9.2-4 — setIncomingCallDisplay', () => {
  it('T11.9.2 — sets incomingCallDisplay to toast', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setIncomingCallDisplay('toast');
    });

    expect(result.current.incomingCallDisplay).toBe('toast');
  });

  it('T11.9.3 — sets incomingCallDisplay back to fullscreen', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setIncomingCallDisplay('toast');
    });
    act(() => {
      result.current.setIncomingCallDisplay('fullscreen');
    });

    expect(result.current.incomingCallDisplay).toBe('fullscreen');
  });

  it('T11.9.4 — persists incomingCallDisplay to localStorage', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setIncomingCallDisplay('toast');
    });

    expect(localStorage.getItem(STORAGE_KEYS.incomingCallDisplay)).toBe(
      JSON.stringify('toast'),
    );
  });
});

// ---------------------------------------------------------------------------
// T11.9.5-8 — Ring volume clamping
// ---------------------------------------------------------------------------

describe('T11.9.5-8 — Ring Volume Clamping', () => {
  it('T11.9.5 — sets ringVolume to 50', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setRingVolume(50);
    });

    expect(result.current.ringVolume).toBe(50);
    expect(localStorage.getItem(STORAGE_KEYS.ringVolume)).toBe('50');
  });

  it('T11.9.6 — clamps ringVolume to 0 when negative', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setRingVolume(-10);
    });

    expect(result.current.ringVolume).toBe(0);
    expect(localStorage.getItem(STORAGE_KEYS.ringVolume)).toBe('0');
  });

  it('T11.9.7 — clamps ringVolume to 100 when over 100', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setRingVolume(200);
    });

    expect(result.current.ringVolume).toBe(100);
    expect(localStorage.getItem(STORAGE_KEYS.ringVolume)).toBe('100');
  });

  it('T11.9.8 — allows ringVolume boundary values 0 and 100', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setRingVolume(0);
    });
    expect(result.current.ringVolume).toBe(0);

    act(() => {
      result.current.setRingVolume(100);
    });
    expect(result.current.ringVolume).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// T11.9.9-11 — Input volume clamping
// ---------------------------------------------------------------------------

describe('T11.9.9-11 — Input Volume Clamping', () => {
  it('T11.9.9 — sets inputVolume to 75', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setInputVolume(75);
    });

    expect(result.current.inputVolume).toBe(75);
    expect(localStorage.getItem(STORAGE_KEYS.inputVolume)).toBe('75');
  });

  it('T11.9.10 — clamps inputVolume to 0 when negative', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setInputVolume(-5);
    });

    expect(result.current.inputVolume).toBe(0);
  });

  it('T11.9.11 — clamps inputVolume to 100 when over 100', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setInputVolume(150);
    });

    expect(result.current.inputVolume).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// T11.9.12-14 — Output volume clamping
// ---------------------------------------------------------------------------

describe('T11.9.12-14 — Output Volume Clamping', () => {
  it('T11.9.12 — sets outputVolume to 60', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setOutputVolume(60);
    });

    expect(result.current.outputVolume).toBe(60);
    expect(localStorage.getItem(STORAGE_KEYS.outputVolume)).toBe('60');
  });

  it('T11.9.13 — clamps outputVolume to 0 when negative', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setOutputVolume(-20);
    });

    expect(result.current.outputVolume).toBe(0);
  });

  it('T11.9.14 — clamps outputVolume to 100 when over 100', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setOutputVolume(999);
    });

    expect(result.current.outputVolume).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// T11.9.15-17 — Blur intensity clamping
// ---------------------------------------------------------------------------

describe('T11.9.15-17 — Blur Intensity Clamping', () => {
  it('T11.9.15 — sets blurIntensity to 15', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setBlurIntensity(15);
    });

    expect(result.current.blurIntensity).toBe(15);
    expect(localStorage.getItem(STORAGE_KEYS.blurIntensity)).toBe('15');
  });

  it('T11.9.16 — clamps blurIntensity to 1 when below minimum', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setBlurIntensity(0);
    });

    expect(result.current.blurIntensity).toBe(1);
    expect(localStorage.getItem(STORAGE_KEYS.blurIntensity)).toBe('1');
  });

  it('T11.9.17 — clamps blurIntensity to 30 when above maximum', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setBlurIntensity(31);
    });

    expect(result.current.blurIntensity).toBe(30);
    expect(localStorage.getItem(STORAGE_KEYS.blurIntensity)).toBe('30');
  });
});

// ---------------------------------------------------------------------------
// T11.9.18 — Video quality options
// ---------------------------------------------------------------------------

describe('T11.9.18 — Video Quality Options', () => {
  it('T11.9.18 — cycles through all video quality values', () => {
    const { result } = renderHook(() => useCallSettings());

    const qualities = ['auto', '720p', '1080p', '1440p', '4k'] as const;

    for (const q of qualities) {
      act(() => {
        result.current.setDefaultVideoQuality(q);
      });
      expect(result.current.defaultVideoQuality).toBe(q);
      expect(localStorage.getItem(STORAGE_KEYS.defaultVideoQuality)).toBe(
        JSON.stringify(q),
      );
    }
  });
});

// ---------------------------------------------------------------------------
// T11.9.19 — Audio quality options
// ---------------------------------------------------------------------------

describe('T11.9.19 — Audio Quality Options', () => {
  it('T11.9.19 — cycles through all audio quality values', () => {
    const { result } = renderHook(() => useCallSettings());

    const qualities = [
      'opus-voice',
      'opus-music',
      'opus-low',
      'pcm',
    ] as const;

    for (const q of qualities) {
      act(() => {
        result.current.setDefaultAudioQuality(q);
      });
      expect(result.current.defaultAudioQuality).toBe(q);
      expect(localStorage.getItem(STORAGE_KEYS.defaultAudioQuality)).toBe(
        JSON.stringify(q),
      );
    }
  });
});

// ---------------------------------------------------------------------------
// T11.9.20-21 — Opus config
// ---------------------------------------------------------------------------

describe('T11.9.20-21 — Opus Config', () => {
  it('T11.9.20 — sets a full custom opus config', () => {
    const { result } = renderHook(() => useCallSettings());

    const customConfig = {
      application: 'audio' as const,
      bitrate: 96 as const,
      complexity: 5,
      fec: false,
      dtx: true,
      packetLoss: 0,
    };

    act(() => {
      result.current.setOpusConfig(customConfig);
    });

    expect(result.current.opusConfig).toEqual(customConfig);
  });

  it('T11.9.21 — persists opus config to localStorage as JSON', () => {
    const { result } = renderHook(() => useCallSettings());

    const customConfig = {
      application: 'lowdelay' as const,
      bitrate: 64 as const,
      complexity: 3,
      fec: true,
      dtx: false,
      packetLoss: 5,
    };

    act(() => {
      result.current.setOpusConfig(customConfig);
    });

    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.opusConfig) ?? '{}',
    );
    expect(stored).toEqual(customConfig);
  });
});

// ---------------------------------------------------------------------------
// T11.9.22-23 — Video effect switching
// ---------------------------------------------------------------------------

describe('T11.9.22-23 — Video Effect Switching', () => {
  it('T11.9.22 — switches video effect to blur', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setVideoEffect('blur');
    });

    expect(result.current.videoEffect).toBe('blur');
    expect(localStorage.getItem(STORAGE_KEYS.videoEffect)).toBe(
      JSON.stringify('blur'),
    );
  });

  it('T11.9.23 — switches video effect through all options', () => {
    const { result } = renderHook(() => useCallSettings());

    const effects = ['none', 'blur', 'virtual-background'] as const;

    for (const e of effects) {
      act(() => {
        result.current.setVideoEffect(e);
      });
      expect(result.current.videoEffect).toBe(e);
    }
  });
});

// ---------------------------------------------------------------------------
// T11.9.24-25 — Background preset ID and custom URL
// ---------------------------------------------------------------------------

describe('T11.9.24-25 — Background Settings', () => {
  it('T11.9.24 — sets and clears backgroundPresetId', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setBackgroundPresetId('forest-01');
    });

    expect(result.current.backgroundPresetId).toBe('forest-01');
    expect(localStorage.getItem(STORAGE_KEYS.backgroundPresetId)).toBe(
      JSON.stringify('forest-01'),
    );

    act(() => {
      result.current.setBackgroundPresetId(null);
    });

    expect(result.current.backgroundPresetId).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.backgroundPresetId)).toBe(
      JSON.stringify(null),
    );
  });

  it('T11.9.25 — sets and clears customBackgroundUrl', () => {
    const { result } = renderHook(() => useCallSettings());

    const url = 'https://example.com/bg.jpg';

    act(() => {
      result.current.setCustomBackgroundUrl(url);
    });

    expect(result.current.customBackgroundUrl).toBe(url);
    expect(localStorage.getItem(STORAGE_KEYS.customBackgroundUrl)).toBe(
      JSON.stringify(url),
    );

    act(() => {
      result.current.setCustomBackgroundUrl(null);
    });

    expect(result.current.customBackgroundUrl).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// T11.9.26 — Media E2EE toggle
// ---------------------------------------------------------------------------

describe('T11.9.26 — Media E2EE Toggle', () => {
  it('T11.9.26 — toggles mediaE2EE on and off', () => {
    const { result } = renderHook(() => useCallSettings());

    expect(result.current.mediaE2EE).toBe(false);

    act(() => {
      result.current.setMediaE2EE(true);
    });

    expect(result.current.mediaE2EE).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.mediaE2EE)).toBe('true');

    act(() => {
      result.current.setMediaE2EE(false);
    });

    expect(result.current.mediaE2EE).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.mediaE2EE)).toBe('false');
  });
});

// ---------------------------------------------------------------------------
// T11.9.27-30 — localStorage hydration on mount
// ---------------------------------------------------------------------------

describe('T11.9.27-30 — localStorage Hydration', () => {
  it('T11.9.27 — hydrates string and number settings from localStorage', async () => {
    localStorage.setItem(STORAGE_KEYS.incomingCallDisplay, JSON.stringify('toast'));
    localStorage.setItem(STORAGE_KEYS.ringVolume, JSON.stringify(42));
    localStorage.setItem(STORAGE_KEYS.inputVolume, JSON.stringify(65));
    localStorage.setItem(STORAGE_KEYS.outputVolume, JSON.stringify(30));

    const { result } = renderHook(() => useCallSettings());

    // The useEffect hydration runs asynchronously; wait for it
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.incomingCallDisplay).toBe('toast');
    expect(result.current.ringVolume).toBe(42);
    expect(result.current.inputVolume).toBe(65);
    expect(result.current.outputVolume).toBe(30);
  });

  it('T11.9.28 — hydrates quality settings from localStorage', async () => {
    localStorage.setItem(STORAGE_KEYS.defaultVideoQuality, JSON.stringify('1080p'));
    localStorage.setItem(STORAGE_KEYS.defaultAudioQuality, JSON.stringify('opus-music'));

    const { result } = renderHook(() => useCallSettings());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.defaultVideoQuality).toBe('1080p');
    expect(result.current.defaultAudioQuality).toBe('opus-music');
  });

  it('T11.9.29 — hydrates opus config from localStorage', async () => {
    const storedConfig = {
      application: 'audio',
      bitrate: 128,
      complexity: 7,
      fec: false,
      dtx: true,
      packetLoss: 2,
    };
    localStorage.setItem(STORAGE_KEYS.opusConfig, JSON.stringify(storedConfig));

    const { result } = renderHook(() => useCallSettings());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.opusConfig).toEqual(storedConfig);
  });

  it('T11.9.30 — hydrates video effect, blur, and background settings', async () => {
    localStorage.setItem(STORAGE_KEYS.videoEffect, JSON.stringify('blur'));
    localStorage.setItem(STORAGE_KEYS.blurIntensity, JSON.stringify(20));
    localStorage.setItem(STORAGE_KEYS.backgroundPresetId, JSON.stringify('ocean-02'));
    localStorage.setItem(
      STORAGE_KEYS.customBackgroundUrl,
      JSON.stringify('https://example.com/bg.png'),
    );
    localStorage.setItem(STORAGE_KEYS.mediaE2EE, JSON.stringify(true));

    const { result } = renderHook(() => useCallSettings());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.videoEffect).toBe('blur');
    expect(result.current.blurIntensity).toBe(20);
    expect(result.current.backgroundPresetId).toBe('ocean-02');
    expect(result.current.customBackgroundUrl).toBe('https://example.com/bg.png');
    expect(result.current.mediaE2EE).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T11.9.31 — Corrupt localStorage falls back to defaults
// ---------------------------------------------------------------------------

describe('T11.9.31 — Corrupt localStorage Fallback', () => {
  it('T11.9.31 — falls back to defaults when localStorage has invalid JSON', async () => {
    localStorage.setItem(STORAGE_KEYS.incomingCallDisplay, '{bad json');
    localStorage.setItem(STORAGE_KEYS.ringVolume, 'not-a-number{{{');
    localStorage.setItem(STORAGE_KEYS.opusConfig, '<<invalid>>');
    localStorage.setItem(STORAGE_KEYS.defaultVideoQuality, '!!!');
    localStorage.setItem(STORAGE_KEYS.defaultAudioQuality, '[[[]]]broken');
    localStorage.setItem(STORAGE_KEYS.inputVolume, '{nope}');
    localStorage.setItem(STORAGE_KEYS.outputVolume, 'undefined');
    localStorage.setItem(STORAGE_KEYS.mediaE2EE, 'not-bool{');
    localStorage.setItem(STORAGE_KEYS.videoEffect, '{{}}}{');
    localStorage.setItem(STORAGE_KEYS.blurIntensity, 'NaN{}');
    localStorage.setItem(STORAGE_KEYS.backgroundPresetId, '{{invalid');
    localStorage.setItem(STORAGE_KEYS.customBackgroundUrl, '{{invalid');

    const { result } = renderHook(() => useCallSettings());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.incomingCallDisplay).toBe('fullscreen');
    expect(result.current.ringVolume).toBe(80);
    expect(result.current.defaultVideoQuality).toBe('auto');
    expect(result.current.defaultAudioQuality).toBe('opus-voice');
    expect(result.current.opusConfig).toEqual(DEFAULT_OPUS_CONFIG);
    expect(result.current.inputVolume).toBe(100);
    expect(result.current.outputVolume).toBe(100);
    expect(result.current.mediaE2EE).toBe(false);
    expect(result.current.videoEffect).toBe('none');
    expect(result.current.blurIntensity).toBe(10);
    expect(result.current.backgroundPresetId).toBeNull();
    expect(result.current.customBackgroundUrl).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// T11.9.32 — All setters write to correct localStorage keys
// ---------------------------------------------------------------------------

describe('T11.9.32 — localStorage Key Correctness', () => {
  it('T11.9.32 — every setter persists to its designated storage key', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setIncomingCallDisplay('toast');
      result.current.setRingVolume(55);
      result.current.setDefaultVideoQuality('720p');
      result.current.setDefaultAudioQuality('pcm');
      result.current.setOpusConfig({
        application: 'audio',
        bitrate: 96,
        complexity: 8,
        fec: false,
        dtx: true,
        packetLoss: 3,
      });
      result.current.setInputVolume(90);
      result.current.setOutputVolume(70);
      result.current.setMediaE2EE(true);
      result.current.setVideoEffect('virtual-background');
      result.current.setBlurIntensity(25);
      result.current.setBackgroundPresetId('sunset-03');
      result.current.setCustomBackgroundUrl('https://img.test/bg.webp');
    });

    expect(localStorage.getItem(STORAGE_KEYS.incomingCallDisplay)).toBe(JSON.stringify('toast'));
    expect(localStorage.getItem(STORAGE_KEYS.ringVolume)).toBe('55');
    expect(localStorage.getItem(STORAGE_KEYS.defaultVideoQuality)).toBe(JSON.stringify('720p'));
    expect(localStorage.getItem(STORAGE_KEYS.defaultAudioQuality)).toBe(JSON.stringify('pcm'));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.opusConfig)!)).toEqual({
      application: 'audio',
      bitrate: 96,
      complexity: 8,
      fec: false,
      dtx: true,
      packetLoss: 3,
    });
    expect(localStorage.getItem(STORAGE_KEYS.inputVolume)).toBe('90');
    expect(localStorage.getItem(STORAGE_KEYS.outputVolume)).toBe('70');
    expect(localStorage.getItem(STORAGE_KEYS.mediaE2EE)).toBe('true');
    expect(localStorage.getItem(STORAGE_KEYS.videoEffect)).toBe(JSON.stringify('virtual-background'));
    expect(localStorage.getItem(STORAGE_KEYS.blurIntensity)).toBe('25');
    expect(localStorage.getItem(STORAGE_KEYS.backgroundPresetId)).toBe(JSON.stringify('sunset-03'));
    expect(localStorage.getItem(STORAGE_KEYS.customBackgroundUrl)).toBe(
      JSON.stringify('https://img.test/bg.webp'),
    );
  });
});

// ---------------------------------------------------------------------------
// T11.9.33 — Blur intensity boundary values
// ---------------------------------------------------------------------------

describe('T11.9.33 — Blur Intensity Boundary Values', () => {
  it('T11.9.33 — allows boundary values 1 and 30', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setBlurIntensity(1);
    });
    expect(result.current.blurIntensity).toBe(1);

    act(() => {
      result.current.setBlurIntensity(30);
    });
    expect(result.current.blurIntensity).toBe(30);
  });
});
