/**
 * Tests for useFullscreen hook
 *
 * Covers: enter/exit fullscreen, Escape key listener on web.
 */

import { renderHook, act } from '@testing-library/react-native';
import { Platform } from 'react-native';

const originalOS = Platform.OS;

beforeAll(() => {
  Object.defineProperty(Platform, 'OS', { value: 'web', writable: true });
});

afterAll(() => {
  Object.defineProperty(Platform, 'OS', { value: originalOS, writable: true });
});

import { useFullscreen } from '@/hooks/useFullscreen';

describe('useFullscreen', () => {
  it('starts with no fullscreen DID', () => {
    const { result } = renderHook(() => useFullscreen());
    expect(result.current.fullscreenDid).toBeNull();
  });

  it('enterFullscreen sets the DID', () => {
    const { result } = renderHook(() => useFullscreen());

    act(() => {
      result.current.enterFullscreen('did:key:z6MkAlice');
    });

    expect(result.current.fullscreenDid).toBe('did:key:z6MkAlice');
  });

  it('exitFullscreen clears the DID', () => {
    const { result } = renderHook(() => useFullscreen());

    act(() => {
      result.current.enterFullscreen('did:key:z6MkAlice');
    });
    expect(result.current.fullscreenDid).toBe('did:key:z6MkAlice');

    act(() => {
      result.current.exitFullscreen();
    });
    expect(result.current.fullscreenDid).toBeNull();
  });

  it('Escape key exits fullscreen on web', () => {
    const { result } = renderHook(() => useFullscreen());

    act(() => {
      result.current.enterFullscreen('did:key:z6MkAlice');
    });
    expect(result.current.fullscreenDid).toBe('did:key:z6MkAlice');

    // Simulate Escape key
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event);
    });

    expect(result.current.fullscreenDid).toBeNull();
  });
});
