/// <reference types="vitest/globals" />
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { usePressAnimation } from './use-press-animation';

// ---------------------------------------------------------------------------
// Return shape
// ---------------------------------------------------------------------------

describe('usePressAnimation — return shape', () => {
  it('returns scale, handlers, and style', () => {
    const { result } = renderHook(() => usePressAnimation());

    expect(result.current).toHaveProperty('scale');
    expect(result.current).toHaveProperty('handlers');
    expect(result.current).toHaveProperty('style');
  });

  it('returns scale as an Animated.Value object', () => {
    const { result } = renderHook(() => usePressAnimation());
    expect(typeof result.current.scale).toBe('object');
    expect(result.current.scale).not.toBeNull();
  });

  it('returns handlers with onPressIn and onPressOut functions', () => {
    const { result } = renderHook(() => usePressAnimation());
    expect(typeof result.current.handlers.onPressIn).toBe('function');
    expect(typeof result.current.handlers.onPressOut).toBe('function');
  });

  it('returns style with a transform array containing scale', () => {
    const { result } = renderHook(() => usePressAnimation());
    expect(result.current.style).toHaveProperty('transform');
    expect(Array.isArray(result.current.style.transform)).toBe(true);
    expect(result.current.style.transform).toHaveLength(1);
    expect(result.current.style.transform[0]).toHaveProperty('scale');
  });
});

// ---------------------------------------------------------------------------
// Handlers do not throw
// ---------------------------------------------------------------------------

describe('usePressAnimation — handlers', () => {
  it('onPressIn does not throw', () => {
    const { result } = renderHook(() => usePressAnimation());
    expect(() => result.current.handlers.onPressIn()).not.toThrow();
  });

  it('onPressOut does not throw', () => {
    const { result } = renderHook(() => usePressAnimation());
    expect(() => result.current.handlers.onPressOut()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Custom config
// ---------------------------------------------------------------------------

describe('usePressAnimation — custom config', () => {
  it('accepts a custom scale value without throwing', () => {
    const { result } = renderHook(() =>
      usePressAnimation({ scale: 0.9 }),
    );
    expect(result.current.scale).not.toBeNull();
  });

  it('accepts a custom spring config without throwing', () => {
    const { result } = renderHook(() =>
      usePressAnimation({ spring: { tension: 300, friction: 15 } }),
    );
    expect(result.current.handlers.onPressIn).toBeDefined();
  });
});
