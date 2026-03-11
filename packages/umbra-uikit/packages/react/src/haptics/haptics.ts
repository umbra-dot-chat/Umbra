/**
 * @module haptics/haptics
 * @description Platform-aware haptic feedback engine for the Wisp UI kit.
 *
 * On the **web**, `navigator.vibrate` is used when available (Android
 * Chrome). On platforms without vibration support the engine degrades
 * gracefully to a no-op. The architecture is designed so that a React
 * Native engine (using `expo-haptics` or `react-native-haptic-feedback`)
 * can be swapped in without changing consumer code.
 *
 * @example
 * ```ts
 * import { createHapticEngine, triggerHaptic } from '../haptics';
 *
 * // Option A: use the singleton helper
 * triggerHaptic('success');
 *
 * // Option B: create an engine instance
 * const engine = createHapticEngine();
 * if (engine.isSupported) {
 *   engine.trigger('medium');
 * }
 * ```
 */

import type { HapticType, HapticEngine } from './types';

// ---------------------------------------------------------------------------
// Vibration patterns (web / navigator.vibrate)
// ---------------------------------------------------------------------------

/**
 * Maps each {@link HapticType} to a `navigator.vibrate` pattern
 * (array of milliseconds: vibrate, pause, vibrate, ...).
 *
 * These are rough approximations of native iOS / Android haptic
 * intensities. They are only used when `navigator.vibrate` is available.
 *
 * @example
 * ```ts
 * // Internal use only
 * navigator.vibrate(VIBRATION_PATTERNS.success); // [40, 60, 40]
 * ```
 */
const VIBRATION_PATTERNS: Record<HapticType, number | number[]> = {
  /** Very short pulse */
  light: 10,
  /** Moderate single pulse */
  medium: 25,
  /** Longer single pulse */
  heavy: 50,
  /** Double tap: vibrate, short pause, vibrate */
  success: [40, 60, 40],
  /** Triple short tap */
  warning: [30, 40, 30, 40, 30],
  /** Two sharp pulses */
  error: [50, 80, 50],
  /** Lightest possible tap */
  selection: 5,
};

// ---------------------------------------------------------------------------
// Web haptic engine
// ---------------------------------------------------------------------------

/**
 * Detect whether the Vibration API is available in the current environment.
 *
 * @returns `true` if `navigator.vibrate` exists.
 *
 * @example
 * ```ts
 * if (isVibrationSupported()) {
 *   navigator.vibrate(10);
 * }
 * ```
 */
function isVibrationSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  );
}

/**
 * Create a web-specific haptic engine backed by `navigator.vibrate`.
 *
 * If the Vibration API is not available (desktop browsers, Safari, etc.)
 * the returned engine is a graceful no-op with `isSupported: false`.
 *
 * @returns A {@link HapticEngine} instance.
 *
 * @example
 * ```ts
 * const webEngine = createWebHapticEngine();
 * webEngine.trigger('light'); // vibrates on Android Chrome, no-op elsewhere
 * ```
 */
function createWebHapticEngine(): HapticEngine {
  const supported = isVibrationSupported();

  return {
    trigger: (type: HapticType): void => {
      if (supported) {
        const pattern = VIBRATION_PATTERNS[type];
        navigator.vibrate(pattern);
      }
    },
    isSupported: supported,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a platform-appropriate {@link HapticEngine}.
 *
 * Currently returns the web engine. When React Native support is added,
 * this factory can branch on platform and return a native engine that
 * uses `expo-haptics` or `react-native-haptic-feedback`.
 *
 * @returns A {@link HapticEngine} for the current platform.
 *
 * @example
 * ```ts
 * import { createHapticEngine } from '../haptics';
 *
 * const engine = createHapticEngine();
 * console.log(engine.isSupported); // false on desktop browsers
 * engine.trigger('medium');        // no-op on unsupported platforms
 * ```
 */
export function createHapticEngine(): HapticEngine {
  // Future: detect React Native and return a native engine here.
  return createWebHapticEngine();
}

// ---------------------------------------------------------------------------
// Singleton convenience
// ---------------------------------------------------------------------------

/** Lazily initialised singleton engine. */
let _defaultEngine: HapticEngine | null = null;

/**
 * Return the lazily-initialised default haptic engine.
 *
 * @returns The singleton {@link HapticEngine}.
 *
 * @example
 * ```ts
 * const engine = getDefaultEngine();
 * engine.trigger('selection');
 * ```
 */
function getDefaultEngine(): HapticEngine {
  if (_defaultEngine === null) {
    _defaultEngine = createHapticEngine();
  }
  return _defaultEngine;
}

/**
 * Trigger a haptic feedback event using the default engine.
 *
 * This is the simplest way to fire haptics -- a single function call
 * with no setup required.
 *
 * @param type - The category of haptic feedback to trigger.
 *
 * @example
 * ```ts
 * import { triggerHaptic } from '../haptics';
 *
 * // In a click handler
 * function handlePress() {
 *   triggerHaptic('light');
 * }
 *
 * // After a successful save
 * triggerHaptic('success');
 * ```
 */
export function triggerHaptic(type: HapticType): void {
  getDefaultEngine().trigger(type);
}
