/**
 * SoundContext — Unit Tests
 *
 * Tests for sound state management:
 *   - Default values
 *   - Volume controls
 *   - Mute toggle
 *   - Provider requirement
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@umbra/wasm', () => ({
  getWasm: jest.fn(() => null),
}));

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => ({
    preferencesReady: false, // Don't trigger KV restore
    didChanged: 0,
    syncVersion: 0,
  }),
}));

jest.mock('@/contexts/SyncContext', () => ({
  markSyncDirty: jest.fn(),
}));

// Mock SoundEngine
jest.mock('@/services/SoundEngine', () => ({
  SoundEngine: jest.fn().mockImplementation(() => ({
    playSound: jest.fn(),
    setMasterVolume: jest.fn(),
    setMuted: jest.fn(),
    setCategoryVolume: jest.fn(),
    setCategoryEnabled: jest.fn(),
    setActiveTheme: jest.fn(),
    preloadAudioPack: jest.fn(),
    resumeContext: jest.fn(),
  })),
  SOUND_CATEGORIES: ['message', 'call', 'navigation', 'social', 'system'],
}));

import { SoundProvider, useSound } from '@/contexts/SoundContext';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
  return <SoundProvider>{children}</SoundProvider>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SoundContext — Provider requirement', () => {
  it('useSound throws when used outside SoundProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useSound());
    }).toThrow('useSound() must be used within a <SoundProvider>');
    spy.mockRestore();
  });
});

describe('SoundContext — Default state', () => {
  it('masterVolume defaults to 0.8', () => {
    const { result } = renderHook(() => useSound(), { wrapper });
    expect(result.current.masterVolume).toBe(0.8);
  });

  it('muted defaults to false', () => {
    const { result } = renderHook(() => useSound(), { wrapper });
    expect(result.current.muted).toBe(false);
  });

  it('activeTheme defaults to playful', () => {
    const { result } = renderHook(() => useSound(), { wrapper });
    expect(result.current.activeTheme).toBe('playful');
  });

  it('preferencesLoaded starts as false when preferencesReady is false', () => {
    const { result } = renderHook(() => useSound(), { wrapper });
    expect(result.current.preferencesLoaded).toBe(false);
  });

  it('categoryVolumes has all categories at 1.0', () => {
    const { result } = renderHook(() => useSound(), { wrapper });
    expect(result.current.categoryVolumes.message).toBe(1.0);
    expect(result.current.categoryVolumes.call).toBe(1.0);
  });

  it('categoryEnabled has expected defaults', () => {
    const { result } = renderHook(() => useSound(), { wrapper });
    expect(result.current.categoryEnabled.message).toBe(true);
    expect(result.current.categoryEnabled.call).toBe(true);
    expect(result.current.categoryEnabled.navigation).toBe(false);
    expect(result.current.categoryEnabled.system).toBe(false);
  });
});

describe('SoundContext — Volume controls', () => {
  it('setMasterVolume changes volume', () => {
    const { result } = renderHook(() => useSound(), { wrapper });

    act(() => {
      result.current.setMasterVolume(0.5);
    });
    expect(result.current.masterVolume).toBe(0.5);
  });

  it('setMasterVolume clamps to 0-1 range', () => {
    const { result } = renderHook(() => useSound(), { wrapper });

    act(() => {
      result.current.setMasterVolume(1.5);
    });
    expect(result.current.masterVolume).toBe(1);

    act(() => {
      result.current.setMasterVolume(-0.5);
    });
    expect(result.current.masterVolume).toBe(0);
  });

  it('setMuted toggles mute state', () => {
    const { result } = renderHook(() => useSound(), { wrapper });

    act(() => {
      result.current.setMuted(true);
    });
    expect(result.current.muted).toBe(true);

    act(() => {
      result.current.setMuted(false);
    });
    expect(result.current.muted).toBe(false);
  });
});
