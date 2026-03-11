/// <reference types="vitest/globals" />
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useTransition } from './use-transition';
import type { TransitionPhase } from './use-transition';

const validPhases: TransitionPhase[] = ['enter', 'idle', 'exit'];

// ---------------------------------------------------------------------------
// Return shape
// ---------------------------------------------------------------------------

describe('useTransition — return shape', () => {
  it('returns mounted, style, and phase', () => {
    const { result } = renderHook(() => useTransition(true));

    expect(result.current).toHaveProperty('mounted');
    expect(result.current).toHaveProperty('style');
    expect(result.current).toHaveProperty('phase');
  });

  it('returns mounted as a boolean', () => {
    const { result } = renderHook(() => useTransition(true));
    expect(typeof result.current.mounted).toBe('boolean');
  });

  it('returns phase as a valid TransitionPhase', () => {
    const { result } = renderHook(() => useTransition(true));
    expect(validPhases).toContain(result.current.phase);
  });

  it('returns style as an object with opacity and transform', () => {
    const { result } = renderHook(() => useTransition(true));
    expect(result.current.style).toHaveProperty('opacity');
    expect(result.current.style).toHaveProperty('transform');
  });
});

// ---------------------------------------------------------------------------
// Visibility states
// ---------------------------------------------------------------------------

describe('useTransition — visible=true', () => {
  it('is mounted when visible is true', () => {
    const { result } = renderHook(() => useTransition(true));
    expect(result.current.mounted).toBe(true);
  });
});

describe('useTransition — visible=false', () => {
  it('is not mounted when initially visible is false', () => {
    const { result } = renderHook(() => useTransition(false));
    expect(result.current.mounted).toBe(false);
  });

  it('has phase "exit" when initially not visible', () => {
    const { result } = renderHook(() => useTransition(false));
    expect(result.current.phase).toBe('exit');
  });
});

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

describe('useTransition — configuration', () => {
  it('accepts custom duration without throwing', () => {
    const { result } = renderHook(() =>
      useTransition(true, { duration: 500 }),
    );
    expect(result.current.mounted).toBe(true);
  });

  it('accepts custom easing without throwing', () => {
    const { result } = renderHook(() =>
      useTransition(true, { easing: 'easeInOut' }),
    );
    expect(result.current.mounted).toBe(true);
  });
});
