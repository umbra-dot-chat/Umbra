/**
 * Theme system types.
 *
 * Each theme preset defines a `DeepPartial<ThemeColors>` override that gets
 * deep-merged onto the Wisp dark base palette via `createTheme()`.
 */

import type { ThemeColors } from '@coexist/wisp-core/theme';

// ─────────────────────────────────────────────────────────────────────────────
// DeepPartial utility
// ─────────────────────────────────────────────────────────────────────────────

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ─────────────────────────────────────────────────────────────────────────────
// ThemePreset
// ─────────────────────────────────────────────────────────────────────────────

export interface ThemePreset {
  /** Unique identifier (lowercase, hyphenated). */
  id: string;
  /** Display name shown in the theme selector. */
  name: string;
  /** Short description of the theme. */
  description: string;
  /** Author / origin attribution. */
  author: string;
  /** The mode this theme targets — all built-in presets are dark. */
  mode: 'dark';
  /** Deep partial color overrides merged onto the Wisp dark base palette. */
  colors: DeepPartial<ThemeColors>;
  /** 5 representative swatch colors shown as preview dots in the selector UI. */
  swatches: string[];
}
