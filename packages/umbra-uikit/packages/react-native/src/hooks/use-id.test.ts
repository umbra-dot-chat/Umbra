/// <reference types="vitest/globals" />
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useId } from './use-id';

// ---------------------------------------------------------------------------
// Return shape
// ---------------------------------------------------------------------------

describe('useId — return shape', () => {
  it('returns a string', () => {
    const { result } = renderHook(() => useId());
    expect(typeof result.current).toBe('string');
  });

  it('prefixes the id with "wisp" by default', () => {
    const { result } = renderHook(() => useId());
    expect(result.current.startsWith('wisp-')).toBe(true);
  });

  it('uses a custom prefix when provided', () => {
    const { result } = renderHook(() => useId('custom'));
    expect(result.current.startsWith('custom-')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Uniqueness
// ---------------------------------------------------------------------------

describe('useId — uniqueness', () => {
  it('returns unique values across multiple hook instances', () => {
    const { result: a } = renderHook(() => useId());
    const { result: b } = renderHook(() => useId());
    expect(a.current).not.toBe(b.current);
  });

  it('returns stable value across rerenders', () => {
    const { result, rerender } = renderHook(() => useId());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
