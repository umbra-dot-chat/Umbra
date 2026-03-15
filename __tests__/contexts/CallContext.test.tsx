/**
 * CallContext — Unit Tests
 *
 * Tests for the call state machine context:
 *   - Initial idle state
 *   - Media toggles (mute, camera, deafen)
 *   - Quality settings
 *   - Audio processing toggles
 *   - Volume controls
 *   - Provider requirement
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks — must be before imports
// ---------------------------------------------------------------------------

// Mock CallManager
jest.mock('@/services/CallManager', () => ({
  CallManager: jest.fn().mockImplementation(() => ({
    createOffer: jest.fn(),
    createAnswer: jest.fn(),
    close: jest.fn(),
    toggleMute: jest.fn(() => true),
    toggleCamera: jest.fn(() => true),
    setVideoQuality: jest.fn(),
    switchCamera: jest.fn(),
    getStats: jest.fn(),
    getLocalStream: jest.fn(() => null),
    getRemoteStream: jest.fn(() => null),
    addIceCandidate: jest.fn(),
    setRemoteDescription: jest.fn(),
    getUserMedia: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@/services/VoiceStreamBridge', () => ({
  VoiceStreamBridge: {
    setLocalStream: jest.fn(),
    setActive: jest.fn(),
    clear: jest.fn(),
    setPeerStream: jest.fn(),
    removePeerStream: jest.fn(),
    setSignalSender: jest.fn(),
    getLocalStream: jest.fn(),
  },
}));

jest.mock('@/services/callCrypto', () => ({
  encryptSignal: jest.fn((payload) => Promise.resolve(payload)),
  decryptSignal: jest.fn((payload) => Promise.resolve(payload)),
  isSignalEncryptionAvailable: jest.fn(() => Promise.resolve(false)),
}));

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => ({
    service: {
      onCallEvent: jest.fn(() => jest.fn()),
      dispatchCallEvent: jest.fn(),
      sendCallSignal: jest.fn(),
      storeCallRecord: jest.fn(() => Promise.resolve({ id: 'call-1' })),
      endCallRecord: jest.fn(() => Promise.resolve({ id: 'call-1' })),
    },
    isReady: true,
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    identity: { did: 'did:key:z6MkTestCaller', displayName: 'TestCaller' },
    isAuthenticated: true,
  }),
}));

jest.mock('@/contexts/SoundContext', () => ({
  useSound: () => ({
    playSound: jest.fn(),
    masterVolume: 0.8,
    muted: false,
    preferencesLoaded: true,
  }),
}));

jest.mock('@/hooks/useDeveloperSettings', () => ({
  useDeveloperSettings: () => ({
    forceRelay: false,
    logSignaling: false,
    logIce: false,
  }),
}));

import { CallProvider, useCallContext } from '@/contexts/CallContext';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
  return <CallProvider>{children}</CallProvider>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CallContext — Initial state', () => {
  it('activeCall starts as null', () => {
    const { result } = renderHook(() => useCallContext(), { wrapper });
    expect(result.current.activeCall).toBeNull();
  });

  it('callStats starts as null', () => {
    const { result } = renderHook(() => useCallContext(), { wrapper });
    expect(result.current.callStats).toBeNull();
  });

  it('isScreenSharing starts as false', () => {
    const { result } = renderHook(() => useCallContext(), { wrapper });
    expect(result.current.isScreenSharing).toBe(false);
  });

  it('screenShareStream starts as null', () => {
    const { result } = renderHook(() => useCallContext(), { wrapper });
    expect(result.current.screenShareStream).toBeNull();
  });

  it('ghostMetadata starts as null', () => {
    const { result } = renderHook(() => useCallContext(), { wrapper });
    expect(result.current.ghostMetadata).toBeNull();
  });
});

describe('CallContext — Quality settings', () => {
  it('videoQuality defaults to a valid value', () => {
    const { result } = renderHook(() => useCallContext(), { wrapper });
    expect(['low', 'medium', 'high', 'auto']).toContain(result.current.videoQuality);
  });

  it('setVideoQuality changes the value', () => {
    const { result } = renderHook(() => useCallContext(), { wrapper });

    act(() => {
      result.current.setVideoQuality('low');
    });
    expect(result.current.videoQuality).toBe('low');

    act(() => {
      result.current.setVideoQuality('high');
    });
    expect(result.current.videoQuality).toBe('high');
  });

  it('audioQuality defaults to a valid value', () => {
    const { result } = renderHook(() => useCallContext(), { wrapper });
    expect(['opus-voice', 'opus-music', 'opus-low', 'pcm']).toContain(result.current.audioQuality);
  });

  it('setAudioQuality changes the value', () => {
    const { result } = renderHook(() => useCallContext(), { wrapper });

    act(() => {
      result.current.setAudioQuality('opus-music');
    });
    expect(result.current.audioQuality).toBe('opus-music');
  });
});

describe('CallContext — Audio processing', () => {
  it('noiseSuppression defaults to true', () => {
    const { result } = renderHook(() => useCallContext(), { wrapper });
    expect(result.current.noiseSuppression).toBe(true);
  });

  it('echoCancellation defaults to true', () => {
    const { result } = renderHook(() => useCallContext(), { wrapper });
    expect(result.current.echoCancellation).toBe(true);
  });

  it('autoGainControl defaults to true', () => {
    const { result } = renderHook(() => useCallContext(), { wrapper });
    expect(result.current.autoGainControl).toBe(true);
  });

  it('setNoiseSuppression toggles the setting', () => {
    const { result } = renderHook(() => useCallContext(), { wrapper });

    act(() => {
      result.current.setNoiseSuppression(false);
    });
    expect(result.current.noiseSuppression).toBe(false);
  });

  it('setEchoCancellation toggles the setting', () => {
    const { result } = renderHook(() => useCallContext(), { wrapper });

    act(() => {
      result.current.setEchoCancellation(false);
    });
    expect(result.current.echoCancellation).toBe(false);
  });

  it('setAutoGainControl toggles the setting', () => {
    const { result } = renderHook(() => useCallContext(), { wrapper });

    act(() => {
      result.current.setAutoGainControl(false);
    });
    expect(result.current.autoGainControl).toBe(false);
  });
});

describe('CallContext — Volume controls', () => {
  it('volume defaults to 100', () => {
    const { result } = renderHook(() => useCallContext(), { wrapper });
    expect(result.current.volume).toBe(100);
  });

  it('inputVolume defaults to 100', () => {
    const { result } = renderHook(() => useCallContext(), { wrapper });
    expect(result.current.inputVolume).toBe(100);
  });

  it('setVolume changes remote audio volume', () => {
    const { result } = renderHook(() => useCallContext(), { wrapper });

    act(() => {
      result.current.setVolume(50);
    });
    expect(result.current.volume).toBe(50);
  });

  it('setInputVolume changes mic input volume', () => {
    const { result } = renderHook(() => useCallContext(), { wrapper });

    act(() => {
      result.current.setInputVolume(75);
    });
    expect(result.current.inputVolume).toBe(75);
  });
});

describe('CallContext — Provider requirement', () => {
  it('useCallContext throws when used outside CallProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useCallContext());
    }).toThrow('useCallContext must be used within a CallProvider');
    spy.mockRestore();
  });
});
