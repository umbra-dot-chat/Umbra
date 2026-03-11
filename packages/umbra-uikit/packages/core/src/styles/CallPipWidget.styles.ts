/**
 * @module styles/CallPipWidget
 * @description Pure style-builder functions for the CallPipWidget component.
 *
 * These helpers are framework-agnostic and return plain objects that
 * React Native can consume directly as style values.
 */

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------

/**
 * Resolves the PiP widget background colour based on the current theme mode.
 */
export function resolvePipBackground(isDark: boolean): string {
  return isDark ? '#1A1A1A' : '#FFFFFF';
}

// ---------------------------------------------------------------------------
// Border
// ---------------------------------------------------------------------------

/**
 * Resolves the PiP widget border colour based on the current theme mode.
 */
export function resolvePipBorder(isDark: boolean): string {
  return isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
}

// ---------------------------------------------------------------------------
// Shadow
// ---------------------------------------------------------------------------

export interface PipShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

/**
 * Resolves the PiP widget shadow style object based on the current theme mode.
 *
 * Returns a React Native compatible shadow object with `shadowColor`,
 * `shadowOffset`, `shadowOpacity`, `shadowRadius`, and `elevation`.
 */
export function resolvePipShadow(isDark: boolean): PipShadowStyle {
  return {
    shadowColor: isDark ? '#000000' : '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.45 : 0.2,
    shadowRadius: 16,
    elevation: 10,
  };
}
