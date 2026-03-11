/// <reference types="vitest/globals" />
import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useLoading } from './use-loading';
import { LoadingContext } from '../contexts/LoadingContext';

// ---------------------------------------------------------------------------
// Default behaviour (no provider)
// ---------------------------------------------------------------------------

describe('useLoading — default', () => {
  it('returns a boolean', () => {
    const { result } = renderHook(() => useLoading());
    expect(typeof result.current).toBe('boolean');
  });

  it('returns false by default (no provider in tree)', () => {
    const { result } = renderHook(() => useLoading());
    expect(result.current).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// With provider
// ---------------------------------------------------------------------------

describe('useLoading — with LoadingContext', () => {
  it('returns true when provider value is true', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(LoadingContext.Provider, { value: true }, children);

    const { result } = renderHook(() => useLoading(), { wrapper });
    expect(result.current).toBe(true);
  });

  it('returns false when provider value is false', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(LoadingContext.Provider, { value: false }, children);

    const { result } = renderHook(() => useLoading(), { wrapper });
    expect(result.current).toBe(false);
  });
});
