/**
 * Tests for useCommandPalette hook
 *
 * Covers open/close state, keyboard shortcut (Cmd/Ctrl+K),
 * and programmatic control methods.
 *
 * Test IDs: T13.0.1 - T13.0.11
 *
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useCommandPalette } from '@/hooks/useCommandPalette';

// ---------------------------------------------------------------------------
// Platform mock — useCommandPalette only registers keyboard handlers on web
// ---------------------------------------------------------------------------

const originalOS = Platform.OS;

beforeAll(() => {
  // Force Platform.OS to 'web' so the keyboard listener registers
  Object.defineProperty(Platform, 'OS', { value: 'web', writable: true });
});

afterAll(() => {
  Object.defineProperty(Platform, 'OS', { value: originalOS, writable: true });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simulate a keydown event on document. */
function fireKeydown(key: string, modifiers: { metaKey?: boolean; ctrlKey?: boolean } = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    metaKey: modifiers.metaKey ?? false,
    ctrlKey: modifiers.ctrlKey ?? false,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
}

// ---------------------------------------------------------------------------
// T13.0.1-2 — Initial State
// ---------------------------------------------------------------------------

describe('T13.0.1-2 — Initial State', () => {
  it('T13.0.1 — open starts as false', () => {
    const { result } = renderHook(() => useCommandPalette());
    expect(result.current.open).toBe(false);
  });

  it('T13.0.2 — exposes openPalette and closePalette functions', () => {
    const { result } = renderHook(() => useCommandPalette());
    expect(typeof result.current.openPalette).toBe('function');
    expect(typeof result.current.closePalette).toBe('function');
    expect(typeof result.current.setOpen).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// T13.0.3-4 — Programmatic Open / Close
// ---------------------------------------------------------------------------

describe('T13.0.3-4 — Programmatic Open / Close', () => {
  it('T13.0.3 — openPalette sets open to true', () => {
    const { result } = renderHook(() => useCommandPalette());

    act(() => {
      result.current.openPalette();
    });

    expect(result.current.open).toBe(true);
  });

  it('T13.0.4 — closePalette sets open to false', () => {
    const { result } = renderHook(() => useCommandPalette());

    // Open first
    act(() => {
      result.current.openPalette();
    });
    expect(result.current.open).toBe(true);

    // Close
    act(() => {
      result.current.closePalette();
    });
    expect(result.current.open).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T13.0.5-7 — Keyboard Shortcut (Cmd+K / Ctrl+K)
// ---------------------------------------------------------------------------

describe('T13.0.5-7 — Keyboard Shortcut', () => {
  it('T13.0.5 — Cmd+K toggles open from false to true', () => {
    const { result } = renderHook(() => useCommandPalette());

    act(() => {
      fireKeydown('k', { metaKey: true });
    });

    expect(result.current.open).toBe(true);
  });

  it('T13.0.6 — Ctrl+K toggles open from false to true', () => {
    const { result } = renderHook(() => useCommandPalette());

    act(() => {
      fireKeydown('k', { ctrlKey: true });
    });

    expect(result.current.open).toBe(true);
  });

  it('T13.0.7 — Cmd+K toggles open from true to false', () => {
    const { result } = renderHook(() => useCommandPalette());

    // Open
    act(() => {
      fireKeydown('k', { metaKey: true });
    });
    expect(result.current.open).toBe(true);

    // Toggle closed
    act(() => {
      fireKeydown('k', { metaKey: true });
    });
    expect(result.current.open).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T13.0.8-9 — Non-Shortcut Keys Ignored
// ---------------------------------------------------------------------------

describe('T13.0.8-9 — Non-Shortcut Keys Ignored', () => {
  it('T13.0.8 — pressing K without modifier does not toggle', () => {
    const { result } = renderHook(() => useCommandPalette());

    act(() => {
      fireKeydown('k', {}); // No modifier
    });

    expect(result.current.open).toBe(false);
  });

  it('T13.0.9 — pressing Cmd+J does not toggle', () => {
    const { result } = renderHook(() => useCommandPalette());

    act(() => {
      fireKeydown('j', { metaKey: true });
    });

    expect(result.current.open).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T13.0.10 — setOpen direct control
// ---------------------------------------------------------------------------

describe('T13.0.10 — setOpen Direct Control', () => {
  it('T13.0.10 — setOpen(true) opens the palette', () => {
    const { result } = renderHook(() => useCommandPalette());

    act(() => {
      result.current.setOpen(true);
    });

    expect(result.current.open).toBe(true);

    act(() => {
      result.current.setOpen(false);
    });

    expect(result.current.open).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T13.0.11 — Cleanup on unmount
// ---------------------------------------------------------------------------

describe('T13.0.11 — Cleanup on Unmount', () => {
  it('T13.0.11 — removes keyboard listener on unmount', () => {
    const removeListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useCommandPalette());

    unmount();

    expect(removeListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
    );

    removeListenerSpy.mockRestore();
  });
});
