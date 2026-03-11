/**
 * @module hooks/use-platform
 * @description Hook that returns the current platform and convenience booleans.
 *
 * Detects whether the app is running on the web, iOS, or Android. This is the
 * React hook counterpart of the static utilities in `@wisp/utils/platform`.
 * Use this hook when you need reactive platform info inside components; use
 * the static utils for non-component code.
 *
 * Detection strategy (in order):
 *
 * 1. If React Native's `Platform.OS` is available, use it.
 * 2. Otherwise, inspect `navigator.userAgent` for mobile keywords.
 * 3. Falls back to `'web'` in SSR environments.
 *
 * @example
 * ```tsx
 * import { usePlatform } from '../hooks';
 *
 * function HapticButton() {
 *   const { isNative, isIOS } = usePlatform();
 *
 *   const handlePress = () => {
 *     if (isIOS) triggerHaptic('impact');
 *     if (isNative) Haptics.selectionAsync();
 *   };
 *
 *   return <Pressable onPress={handlePress}>Tap me</Pressable>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Platform-specific styling
 * function Card() {
 *   const { isWeb, isAndroid } = usePlatform();
 *
 *   return (
 *     <View
 *       style={{
 *         elevation: isAndroid ? 4 : undefined,
 *         boxShadow: isWeb ? '0 2px 8px rgba(0,0,0,0.12)' : undefined,
 *       }}
 *     />
 *   );
 * }
 * ```
 */

import { useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Supported platform identifiers.
 */
export type Platform = 'web' | 'ios' | 'android';

/**
 * Return type for {@link usePlatform}.
 */
export interface UsePlatformReturn {
  /** The detected platform: `'web'`, `'ios'`, or `'android'`. */
  platform: Platform;
  /** `true` when running in a web browser. */
  isWeb: boolean;
  /** `true` when running on iOS (React Native or mobile Safari detection). */
  isIOS: boolean;
  /** `true` when running on Android (React Native or user-agent detection). */
  isAndroid: boolean;
  /** `true` when running in a React Native environment (iOS or Android). */
  isNative: boolean;
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * @internal
 * Attempts to detect the current platform.
 */
function detectPlatform(): Platform {
  // 1. Check for React Native's Platform module.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const RNPlatform = require('react-native')?.Platform;
    if (RNPlatform?.OS === 'ios') return 'ios';
    if (RNPlatform?.OS === 'android') return 'android';
  } catch {
    // react-native is not available; continue to web detection.
  }

  // 2. User-agent sniffing (web only).
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
  }

  // 3. Default to web.
  return 'web';
}

// Cache the result so detection only runs once per JS runtime.
let cachedPlatform: Platform | null = null;

/**
 * @internal
 * Returns the cached platform value, running detection on first call.
 */
function getPlatform(): Platform {
  if (cachedPlatform === null) {
    cachedPlatform = detectPlatform();
  }
  return cachedPlatform;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns the current platform and convenience boolean flags.
 *
 * The detection result is cached so it only runs once per JS runtime.
 * The returned object is memoised and referentially stable across re-renders.
 *
 * @returns An object with `platform`, `isWeb`, `isIOS`, `isAndroid`, and `isNative`.
 *
 * @example
 * ```tsx
 * const { platform, isWeb, isIOS, isAndroid, isNative } = usePlatform();
 * ```
 */
export function usePlatform(): UsePlatformReturn {
  return useMemo(() => {
    const platform = getPlatform();
    return {
      platform,
      isWeb: platform === 'web',
      isIOS: platform === 'ios',
      isAndroid: platform === 'android',
      isNative: platform === 'ios' || platform === 'android',
    };
  }, []);
}
