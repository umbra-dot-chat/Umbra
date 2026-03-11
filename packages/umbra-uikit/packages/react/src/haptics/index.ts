/**
 * @module haptics
 * @description Barrel export for the Wisp haptic feedback system.
 *
 * Provides types, a platform-aware haptic engine, a convenience trigger
 * function, a React context for engine injection, and a React hook for
 * easy consumption in components.
 *
 * @example
 * ```ts
 * import {
 *   // Types
 *   hapticTypes,
 *   type HapticType,
 *   type HapticEngine,
 *
 *   // Engine
 *   createHapticEngine,
 *   triggerHaptic,
 *
 *   // React
 *   HapticsContext,
 *   useHaptics,
 * } from '../haptics';
 * ```
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export {
  hapticTypes,
  type HapticType,
  type HapticEngine,
} from './types';

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export {
  createHapticEngine,
  triggerHaptic,
} from './haptics';

// ---------------------------------------------------------------------------
// React hook & context
// ---------------------------------------------------------------------------

export {
  HapticsContext,
  useHaptics,
  type UseHapticsResult,
} from './use-haptics';
