/// <reference types="vitest/globals" />
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useFocusVisible } from './use-focus-visible';

// ---------------------------------------------------------------------------
// Return shape
// ---------------------------------------------------------------------------

describe('useFocusVisible', () => {
  it('returns an object with isFocusVisible boolean', () => {
    const { result } = renderHook(() => useFocusVisible());
    expect(typeof result.current.isFocusVisible).toBe('boolean');
  });

  it('returns isFocusVisible as false (RN simplified implementation)', () => {
    const { result } = renderHook(() => useFocusVisible());
    expect(result.current.isFocusVisible).toBe(false);
  });

  it('returns an empty focusProps object', () => {
    const { result } = renderHook(() => useFocusVisible());
    expect(result.current.focusProps).toEqual({});
  });

  it('does not throw on repeated renders', () => {
    const { result, rerender } = renderHook(() => useFocusVisible());
    rerender();
    rerender();
    expect(result.current.isFocusVisible).toBe(false);
  });
});
