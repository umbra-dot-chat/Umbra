/// <reference types="vitest/globals" />
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useSpring } from './use-spring';

// ---------------------------------------------------------------------------
// Return shape
// ---------------------------------------------------------------------------

describe('useSpring — return shape', () => {
  it('returns value, currentValue, and isAnimating', () => {
    const { result } = renderHook(() => useSpring(0));

    expect(result.current).toHaveProperty('value');
    expect(result.current).toHaveProperty('currentValue');
    expect(result.current).toHaveProperty('isAnimating');
  });

  it('returns value as an Animated.Value (object with internal state)', () => {
    const { result } = renderHook(() => useSpring(1));
    // Animated.Value is an object; on react-native-web it has internal properties
    expect(typeof result.current.value).toBe('object');
    expect(result.current.value).not.toBeNull();
  });

  it('returns isAnimating as a boolean', () => {
    const { result } = renderHook(() => useSpring(0));
    expect(typeof result.current.isAnimating).toBe('boolean');
  });

  it('starts with isAnimating false for initial render', () => {
    const { result } = renderHook(() => useSpring(5));
    expect(result.current.isAnimating).toBe(false);
  });

  it('currentValue matches the initial target', () => {
    const { result } = renderHook(() => useSpring(42));
    expect(result.current.currentValue).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// Stability
// ---------------------------------------------------------------------------

describe('useSpring — stability', () => {
  it('does not throw when rerendered with the same target', () => {
    const { result, rerender } = renderHook(
      ({ target }) => useSpring(target),
      { initialProps: { target: 0 } },
    );

    rerender({ target: 0 });
    expect(result.current.isAnimating).toBe(false);
  });

  it('accepts custom spring config without throwing', () => {
    const { result } = renderHook(() =>
      useSpring(1, { tension: 200, friction: 20 }),
    );
    expect(result.current.currentValue).toBe(1);
  });
});
