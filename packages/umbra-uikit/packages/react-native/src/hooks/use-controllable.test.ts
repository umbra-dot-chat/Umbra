/// <reference types="vitest/globals" />
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useControllable } from './use-controllable';

// ---------------------------------------------------------------------------
// Return shape
// ---------------------------------------------------------------------------

describe('useControllable — return shape', () => {
  it('returns a [value, onChange] tuple', () => {
    const { result } = renderHook(() =>
      useControllable({ defaultValue: 'hello' }),
    );

    expect(Array.isArray(result.current)).toBe(true);
    expect(result.current).toHaveLength(2);
    expect(typeof result.current[1]).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// Uncontrolled mode
// ---------------------------------------------------------------------------

describe('useControllable — uncontrolled', () => {
  it('uses defaultValue when value is undefined', () => {
    const { result } = renderHook(() =>
      useControllable({ defaultValue: 'initial' }),
    );

    expect(result.current[0]).toBe('initial');
  });

  it('updates internal state when onChange is called', () => {
    const { result } = renderHook(() =>
      useControllable({ defaultValue: 0 }),
    );

    act(() => {
      result.current[1](42);
    });

    expect(result.current[0]).toBe(42);
  });

  it('calls the external onChange callback in uncontrolled mode', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllable({ defaultValue: 'a', onChange }),
    );

    act(() => {
      result.current[1]('b');
    });

    expect(onChange).toHaveBeenCalledWith('b');
  });
});

// ---------------------------------------------------------------------------
// Controlled mode
// ---------------------------------------------------------------------------

describe('useControllable — controlled', () => {
  it('uses the provided value when controlled', () => {
    const { result } = renderHook(() =>
      useControllable({ value: 'controlled', defaultValue: 'fallback' }),
    );

    expect(result.current[0]).toBe('controlled');
  });

  it('does not change internal state when controlled', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllable({ value: 'locked', defaultValue: 'x', onChange }),
    );

    act(() => {
      result.current[1]('new-value');
    });

    // Value stays "locked" because it is controlled externally
    expect(result.current[0]).toBe('locked');
    expect(onChange).toHaveBeenCalledWith('new-value');
  });
});
