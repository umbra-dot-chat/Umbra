/**
 * @module utils/platform
 * @description Platform detection utilities (non-hook versions).
 *
 * These are static boolean flags that can be used outside of React components,
 * in utility functions, conditional imports, or module-level constants.
 * For use inside React components, prefer the {@link usePlatform} hook which
 * provides the same information in a reactive wrapper.
 *
 * Detection strategy (in order):
 *
 * 1. If React Native's `Platform.OS` is available, use it.
 * 2. If `navigator.userAgent` is available, parse it for mobile keywords.
 * 3. Default to web (or SSR if `window` is unavailable).
 *
 * @example
 * ```ts
 * import { isWeb, isNative, isSSR } from '@wisp/utils/platform';
 *
 * const shadowStyle = isWeb
 *   ? { boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }
 *   : { elevation: 4 };
 * ```
 *
 * @example
 * ```ts
 * import { isSSR } from '@wisp/utils/platform';
 *
 * // Guard browser-only code
 * if (!isSSR) {
 *   window.addEventListener('resize', handleResize);
 * }
 * ```
 */

// ---------------------------------------------------------------------------
// SSR detection
// ---------------------------------------------------------------------------

/**
 * `true` when running in a server-side rendering context where `window` is
 * not defined. Useful for guarding browser-only APIs.
 *
 * @example
 * ```ts
 * if (!isSSR) {
 *   document.title = 'My App';
 * }
 * ```
 */
export const isSSR: boolean = typeof window === 'undefined';

// ---------------------------------------------------------------------------
// React Native detection
// ---------------------------------------------------------------------------

/**
 * @internal
 * Attempts to read `Platform.OS` from react-native.
 * Returns `undefined` when react-native is not available.
 */
function getRNPlatformOS(): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const RNPlatform = require('react-native')?.Platform;
    return RNPlatform?.OS as string | undefined;
  } catch {
    return undefined;
  }
}

/**
 * @internal
 * Cached React Native platform OS, or `undefined` if not in RN.
 */
const rnOS = getRNPlatformOS();

// ---------------------------------------------------------------------------
// Platform flags
// ---------------------------------------------------------------------------

/**
 * `true` when running on iOS, either via React Native or mobile Safari.
 *
 * @example
 * ```ts
 * if (isIOS) {
 *   // Enable iOS-specific haptic feedback
 * }
 * ```
 */
export const isIOS: boolean =
  rnOS === 'ios' ||
  (!isSSR &&
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent));

/**
 * `true` when running on Android, either via React Native or the Android browser.
 *
 * @example
 * ```ts
 * if (isAndroid) {
 *   // Use elevation instead of box-shadow
 * }
 * ```
 */
export const isAndroid: boolean =
  rnOS === 'android' ||
  (!isSSR &&
    typeof navigator !== 'undefined' &&
    /Android/.test(navigator.userAgent));

/**
 * `true` when running in a React Native environment (iOS or Android).
 *
 * @example
 * ```ts
 * if (isNative) {
 *   // Use react-native-specific APIs
 * }
 * ```
 */
export const isNative: boolean = isIOS || isAndroid;

/**
 * `true` when running in a standard web browser (not React Native, not SSR).
 *
 * @example
 * ```ts
 * if (isWeb) {
 *   // Safe to use DOM APIs
 *   document.getElementById('root');
 * }
 * ```
 */
export const isWeb: boolean = !isNative && !isSSR;
