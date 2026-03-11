/**
 * @module providers/MotionProvider
 * @description Motion preferences context for the Wisp design system.
 *
 * Controls global animation behavior — allows users to reduce motion,
 * disable shimmer effects, or turn off animations entirely.
 * Also respects the OS-level "Reduce Motion" accessibility setting.
 */

import React, { createContext, useCallback, useContext, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MotionCategory = 'transition' | 'shimmer' | 'spring' | 'loop' | 'decorative';

export interface MotionPreferences {
  /** Respect OS-level "Reduce Motion" setting. @default false */
  reduceMotion: boolean;
  /** Enable shimmer / sweep effects. @default true */
  enableShimmer: boolean;
  /** Enable all animations. @default true */
  enableAnimations: boolean;
}

export interface MotionContextValue extends MotionPreferences {
  /**
   * Determine if animation of a given category should be active.
   *
   * - `'transition'` — page/layout transitions
   * - `'shimmer'` — shimmer sweeps, gradient shifts
   * - `'spring'` — spring physics (pop, bounce)
   * - `'loop'` — continuously looping effects (pulse, rotate)
   * - `'decorative'` — purely decorative animations (aurora, glow)
   */
  shouldAnimate: (category: MotionCategory) => boolean;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const defaultPrefs: MotionPreferences = {
  reduceMotion: false,
  enableShimmer: true,
  enableAnimations: true,
};

const MotionContext = createContext<MotionContextValue>({
  ...defaultPrefs,
  shouldAnimate: () => true,
});

MotionContext.displayName = 'WispMotionContext';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMotion(): MotionContextValue {
  return useContext(MotionContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface MotionProviderProps {
  /** Override individual motion preferences. */
  preferences?: Partial<MotionPreferences>;
  children: React.ReactNode;
}

export function MotionProvider({
  preferences,
  children,
}: MotionProviderProps): React.JSX.Element {
  const prefs: MotionPreferences = useMemo(
    () => ({ ...defaultPrefs, ...preferences }),
    [preferences],
  );

  const shouldAnimate = useCallback(
    (category: MotionCategory): boolean => {
      if (prefs.reduceMotion) return false;
      if (!prefs.enableAnimations) return false;
      if (category === 'shimmer' && !prefs.enableShimmer) return false;
      return true;
    },
    [prefs],
  );

  const value = useMemo<MotionContextValue>(
    () => ({ ...prefs, shouldAnimate }),
    [prefs, shouldAnimate],
  );

  return (
    <MotionContext.Provider value={value}>
      {children}
    </MotionContext.Provider>
  );
}
