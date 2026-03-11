/// <reference types="vitest/globals" />
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAnimatedValue } from './use-animated-value';

// ---------------------------------------------------------------------------
// Return shape
// ---------------------------------------------------------------------------

describe('useAnimatedValue — return shape', () => {
  it('returns value, currentValue, and isAnimating', () => {
    const { result } = renderHook(() => useAnimatedValue(0));

    expect(result.current).toHaveProperty('value');
    expect(result.current).toHaveProperty('currentValue');
    expect(result.current).toHaveProperty('isAnimating');
  });

  it('returns value as an Animated.Value object', () => {
    const { result } = renderHook(() => useAnimatedValue(1));
    expect(typeof result.current.value).toBe('object');
    expect(result.current.value).not.toBeNull();
  });

  it('returns isAnimating as a boolean', () => {
    const { result } = renderHook(() => useAnimatedValue(0));
    expect(typeof result.current.isAnimating).toBe('boolean');
  });

  it('starts with isAnimating false for initial render', () => {
    const { result } = renderHook(() => useAnimatedValue(5));
    expect(result.current.isAnimating).toBe(false);
  });

  it('currentValue matches the initial target', () => {
    const { result } = renderHook(() => useAnimatedValue(100));
    expect(result.current.currentValue).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

describe('useAnimatedValue — configuration', () => {
  it('accepts custom duration without throwing', () => {
    const { result } = renderHook(() =>
      useAnimatedValue(1, { duration: 500 }),
    );
    expect(result.current.currentValue).toBe(1);
  });

  it('accepts custom easing without throwing', () => {
    const { result } = renderHook(() =>
      useAnimatedValue(1, { easing: 'easeInOut' }),
    );
    expect(result.current.currentValue).toBe(1);
  });

  it('falls back gracefully for unknown easing names', () => {
    const { result } = renderHook(() =>
      useAnimatedValue(1, { easing: 'nonexistent' }),
    );
    expect(result.current.currentValue).toBe(1);
  });

  it('does not throw when rerendered with the same target', () => {
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedValue(target),
      { initialProps: { target: 0 } },
    );

    rerender({ target: 0 });
    expect(result.current.isAnimating).toBe(false);
  });
});
