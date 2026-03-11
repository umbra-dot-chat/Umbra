/**
 * @module haptics/types
 * @description Type definitions for the Wisp haptic feedback system.
 *
 * Provides the canonical set of haptic feedback types and the interface
 * for platform-specific haptic engines. The types are intentionally small
 * and portable so they work identically on web, iOS, and Android.
 *
 * @example
 * ```ts
 * import { hapticTypes, type HapticType, type HapticEngine } from '../haptics';
 *
 * // Iterate over all haptic types
 * hapticTypes.forEach((type) => console.log(type));
 *
 * // Type-safe haptic trigger
 * const trigger = (type: HapticType) => engine.trigger(type);
 * ```
 */

// ---------------------------------------------------------------------------
// Haptic types
// ---------------------------------------------------------------------------

/**
 * Tuple of all supported haptic feedback types.
 *
 * - `light` -- subtle tap, e.g. toggling a small switch.
 * - `medium` -- moderate tap, e.g. snapping to a position.
 * - `heavy` -- strong tap, e.g. confirming a destructive action.
 * - `success` -- double-tap pattern indicating a successful operation.
 * - `warning` -- distinct pattern drawing attention to a warning.
 * - `error` -- sharp pattern signalling an error.
 * - `selection` -- the lightest tap, used for picker/scroll selection changes.
 *
 * @example
 * ```ts
 * import { hapticTypes } from '../haptics';
 *
 * hapticTypes.includes('success'); // true
 * hapticTypes.length;              // 7
 * ```
 */
export const hapticTypes = [
  'light',
  'medium',
  'heavy',
  'success',
  'warning',
  'error',
  'selection',
] as const;

/**
 * Union type of all supported haptic feedback categories.
 *
 * @example
 * ```ts
 * import type { HapticType } from '../haptics';
 *
 * function vibrate(type: HapticType) {
 *   // ...
 * }
 *
 * vibrate('light');   // OK
 * vibrate('success'); // OK
 * vibrate('mega');    // Type error
 * ```
 */
export type HapticType = (typeof hapticTypes)[number];

// ---------------------------------------------------------------------------
// Haptic engine interface
// ---------------------------------------------------------------------------

/**
 * A platform-specific haptic feedback engine.
 *
 * Consumers obtain an engine via {@link createHapticEngine} and call
 * `trigger()` with a {@link HapticType}. On platforms that do not support
 * haptics (most desktop browsers), `trigger` is a graceful no-op and
 * `isSupported` is `false`.
 *
 * @example
 * ```ts
 * import type { HapticEngine } from '../haptics';
 *
 * function withHaptics(engine: HapticEngine) {
 *   if (engine.isSupported) {
 *     engine.trigger('medium');
 *   }
 * }
 * ```
 */
export type HapticEngine = {
  /**
   * Fire a haptic feedback event of the given type.
   *
   * On unsupported platforms this is a no-op.
   *
   * @param type - The category of haptic feedback to trigger.
   *
   * @example
   * ```ts
   * engine.trigger('success');
   * ```
   */
  trigger: (type: HapticType) => void;

  /**
   * Whether the current platform supports haptic feedback.
   *
   * @example
   * ```ts
   * if (engine.isSupported) {
   *   engine.trigger('light');
   * } else {
   *   console.log('Haptics not available');
   * }
   * ```
   */
  isSupported: boolean;
};
