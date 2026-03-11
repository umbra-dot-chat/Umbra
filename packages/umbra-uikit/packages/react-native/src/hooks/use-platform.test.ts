/// <reference types="vitest/globals" />
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { usePlatform } from './use-platform';
import type { PlatformType } from './use-platform';

const validPlatforms: PlatformType[] = ['web', 'ios', 'android'];

// ---------------------------------------------------------------------------
// Return shape
// ---------------------------------------------------------------------------

describe('usePlatform — return shape', () => {
  it('returns platform as a string', () => {
    const { result } = renderHook(() => usePlatform());
    expect(typeof result.current.platform).toBe('string');
    expect(validPlatforms).toContain(result.current.platform);
  });

  it('returns isWeb as a boolean', () => {
    const { result } = renderHook(() => usePlatform());
    expect(typeof result.current.isWeb).toBe('boolean');
  });

  it('returns isIOS as a boolean', () => {
    const { result } = renderHook(() => usePlatform());
    expect(typeof result.current.isIOS).toBe('boolean');
  });

  it('returns isAndroid as a boolean', () => {
    const { result } = renderHook(() => usePlatform());
    expect(typeof result.current.isAndroid).toBe('boolean');
  });

  it('returns isNative as a boolean', () => {
    const { result } = renderHook(() => usePlatform());
    expect(typeof result.current.isNative).toBe('boolean');
  });
});

// ---------------------------------------------------------------------------
// Consistency (react-native-web resolves Platform.OS to "web")
// ---------------------------------------------------------------------------

describe('usePlatform — consistency', () => {
  it('has consistent boolean flags with platform value', () => {
    const { result } = renderHook(() => usePlatform());
    const { platform, isWeb, isIOS, isAndroid, isNative } = result.current;

    expect(isWeb).toBe(platform === 'web');
    expect(isIOS).toBe(platform === 'ios');
    expect(isAndroid).toBe(platform === 'android');
    expect(isNative).toBe(platform === 'ios' || platform === 'android');
  });

  it('returns stable reference across rerenders', () => {
    const { result, rerender } = renderHook(() => usePlatform());
    const first = result.current;
    rerender();
    const second = result.current;
    // useMemo should keep same object ref
    expect(first).toBe(second);
  });
});
