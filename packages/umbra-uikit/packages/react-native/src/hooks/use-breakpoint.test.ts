/// <reference types="vitest/globals" />
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useBreakpoint, breakpoints } from './use-breakpoint';
import type { Breakpoint } from './use-breakpoint';

const validBreakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

// ---------------------------------------------------------------------------
// Return shape
// ---------------------------------------------------------------------------

describe('useBreakpoint', () => {
  it('returns a breakpoint string', () => {
    const { result } = renderHook(() => useBreakpoint());
    expect(typeof result.current).toBe('string');
  });

  it('returns a valid breakpoint value', () => {
    const { result } = renderHook(() => useBreakpoint());
    expect(validBreakpoints).toContain(result.current);
  });

  it('does not throw on rerender', () => {
    const { result, rerender } = renderHook(() => useBreakpoint());
    rerender();
    expect(validBreakpoints).toContain(result.current);
  });
});

// ---------------------------------------------------------------------------
// Breakpoints map
// ---------------------------------------------------------------------------

describe('breakpoints constant', () => {
  it('exports the expected breakpoint thresholds', () => {
    expect(breakpoints.xs).toBe(0);
    expect(breakpoints.sm).toBe(640);
    expect(breakpoints.md).toBe(768);
    expect(breakpoints.lg).toBe(1024);
    expect(breakpoints.xl).toBe(1280);
    expect(breakpoints['2xl']).toBe(1536);
  });
});
