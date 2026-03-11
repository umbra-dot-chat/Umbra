/**
 * @module haptics/use-haptics
 * @description A React hook that provides memoised haptic feedback trigger
 * functions for every {@link HapticType}.
 *
 * The hook reads the haptic engine from `HapticsContext` when available,
 * falling back to the default engine created by {@link createHapticEngine}.
 * This makes it easy to override the engine in tests or on specific
 * platforms.
 *
 * @example
 * ```tsx
 * import { useHaptics } from '../haptics';
 *
 * function LikeButton() {
 *   const haptics = useHaptics();
 *
 *   return (
 *     <button
 *       onClick={() => {
 *         haptics.success();
 *         // ... other logic
 *       }}
 *     >
 *       Like
 *     </button>
 *   );
 * }
 * ```
 */

import { createContext, useContext, useMemo } from 'react';
import type { HapticType, HapticEngine } from './types';
import { createHapticEngine } from './haptics';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/**
 * React context for providing a custom {@link HapticEngine} to the
 * component tree.
 *
 * When no provider is present, {@link useHaptics} creates a default
 * engine via {@link createHapticEngine}.
 *
 * @example
 * ```tsx
 * import { HapticsContext } from '../haptics';
 *
 * const customEngine: HapticEngine = {
 *   trigger: (type) => console.log('haptic:', type),
 *   isSupported: true,
 * };
 *
 * function App() {
 *   return (
 *     <HapticsContext.Provider value={customEngine}>
 *       <MyComponent />
 *     </HapticsContext.Provider>
 *   );
 * }
 * ```
 */
export const HapticsContext = createContext<HapticEngine | null>(null);
HapticsContext.displayName = 'HapticsContext';

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

/**
 * Return type of {@link useHaptics}.
 *
 * Includes a convenience method for each {@link HapticType} as well as
 * the generic `trigger` function and the `isSupported` flag.
 *
 * @example
 * ```ts
 * const haptics: UseHapticsResult = useHaptics();
 * haptics.light();             // trigger light haptic
 * haptics.trigger('warning');  // trigger via generic function
 * haptics.isSupported;         // boolean
 * ```
 */
export type UseHapticsResult = {
  /** Trigger a light haptic tap. */
  light: () => void;
  /** Trigger a medium haptic tap. */
  medium: () => void;
  /** Trigger a heavy haptic tap. */
  heavy: () => void;
  /** Trigger a success haptic pattern. */
  success: () => void;
  /** Trigger a warning haptic pattern. */
  warning: () => void;
  /** Trigger an error haptic pattern. */
  error: () => void;
  /** Trigger a selection haptic tap. */
  selection: () => void;
  /**
   * Generic trigger accepting any {@link HapticType}.
   *
   * @param type - The haptic type to trigger.
   *
   * @example
   * ```ts
   * haptics.trigger('medium');
   * ```
   */
  trigger: (type: HapticType) => void;
  /** Whether the current platform supports haptic feedback. */
  isSupported: boolean;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns memoised haptic trigger functions.
 *
 * The hook first checks for a {@link HapticsContext} provider in the
 * component tree. If none is found it creates a default engine via
 * {@link createHapticEngine}. All returned functions are referentially
 * stable (memoised) and safe to pass as event-handler props.
 *
 * @returns An object with named trigger methods for each haptic type,
 *   plus a generic `trigger` function and `isSupported` flag.
 *
 * @example
 * ```tsx
 * import { useHaptics } from '../haptics';
 *
 * function ToggleSwitch({ value, onChange }: Props) {
 *   const haptics = useHaptics();
 *
 *   const handleToggle = () => {
 *     haptics.selection();
 *     onChange(!value);
 *   };
 *
 *   return <button onClick={handleToggle}>{value ? 'ON' : 'OFF'}</button>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With a custom engine via context
 * import { HapticsContext, useHaptics } from '../haptics';
 *
 * const logEngine: HapticEngine = {
 *   trigger: (type) => console.log(`[haptic] ${type}`),
 *   isSupported: true,
 * };
 *
 * function TestWrapper({ children }: { children: React.ReactNode }) {
 *   return (
 *     <HapticsContext.Provider value={logEngine}>
 *       {children}
 *     </HapticsContext.Provider>
 *   );
 * }
 * ```
 */
export function useHaptics(): UseHapticsResult {
  const contextEngine = useContext(HapticsContext);

  // Create a fallback engine only when no context is provided.
  // useMemo ensures we don't re-create on every render.
  const engine = useMemo<HapticEngine>(
    () => contextEngine ?? createHapticEngine(),
    [contextEngine],
  );

  return useMemo<UseHapticsResult>(
    () => ({
      light: () => engine.trigger('light'),
      medium: () => engine.trigger('medium'),
      heavy: () => engine.trigger('heavy'),
      success: () => engine.trigger('success'),
      warning: () => engine.trigger('warning'),
      error: () => engine.trigger('error'),
      selection: () => engine.trigger('selection'),
      trigger: (type: HapticType) => engine.trigger(type),
      isSupported: engine.isSupported,
    }),
    [engine],
  );
}
