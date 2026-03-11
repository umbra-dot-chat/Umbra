/**
 * @module variants/appearance
 * @description Visual appearance variants for Wisp components.
 *
 * An *appearance* determines the color treatment of an interactive element
 * (buttons, badges, tags, etc.).  Each appearance maps to a coherent set of
 * `{ bg, text, border, hoverBg }` values derived from the active theme
 * colors, ensuring consistent, accessible styling across the design system.
 */

import type { ThemeColors } from '../theme/types';

// ---------------------------------------------------------------------------
// Appearance enum
// ---------------------------------------------------------------------------

/**
 * Tuple of all supported appearance variant names.
 *
 * Use the `Appearance` type (derived from this tuple) for prop typing.
 */
export const appearances = [
  'primary',
  'secondary',
  'success',
  'warning',
  'danger',
  'info',
  'ghost',
  'neutral',
] as const;

/**
 * Union type of all supported appearance variant names.
 *
 * @example
 * ```ts
 * interface ButtonProps {
 *   appearance?: Appearance; // 'primary' | 'secondary' | ...
 * }
 * ```
 */
export type Appearance = (typeof appearances)[number];

// ---------------------------------------------------------------------------
// Resolved appearance colors
// ---------------------------------------------------------------------------

/**
 * The resolved color set returned by {@link getAppearanceColors}.
 *
 * Every interactive component that supports the `appearance` prop should
 * consume this shape to stay consistent with the design system.
 */
export interface AppearanceColorSet {
  /** Background fill color. */
  bg: string;
  /** Foreground / label text color. */
  text: string;
  /** Border color (may equal `bg` for borderless variants). */
  border: string;
  /** Background fill color on hover / press. */
  hoverBg: string;
}

// ---------------------------------------------------------------------------
// Mapping helper
// ---------------------------------------------------------------------------

/**
 * Resolve an {@link Appearance} variant to its corresponding color set using
 * the provided theme colors.
 *
 * This is the single source of truth that maps semantic appearance names to
 * actual color values.  Component style layers should call this helper
 * rather than hard-coding color lookups.
 *
 * @param appearance - The appearance variant to resolve.
 * @param colors     - The active {@link ThemeColors} from the current theme.
 * @returns A fully resolved {@link AppearanceColorSet}.
 *
 * @example
 * ```ts
 * const { bg, text, border, hoverBg } = getAppearanceColors('primary', colors);
 * ```
 */
export function getAppearanceColors(
  appearance: Appearance,
  colors: ThemeColors,
): AppearanceColorSet {
  switch (appearance) {
    // -- Primary: bold brand accent ------------------------------------------
    case 'primary':
      return {
        bg: colors.accent.primary,
        text: colors.text.inverse,
        border: colors.accent.primary,
        hoverBg: colors.accent.primaryHover,
      };

    // -- Secondary: subtle accent tint ---------------------------------------
    case 'secondary':
      return {
        bg: colors.accent.highlight,
        text: colors.accent.primary,
        border: colors.accent.primary,
        hoverBg: colors.accent.primaryActive,
      };

    // -- Success: positive intent --------------------------------------------
    case 'success':
      return {
        bg: colors.status.success,
        text: colors.text.inverse,
        border: colors.status.success,
        hoverBg: colors.status.successSurface,
      };

    // -- Warning: cautionary intent ------------------------------------------
    case 'warning':
      return {
        bg: colors.status.warning,
        text: colors.text.inverse,
        border: colors.status.warning,
        hoverBg: colors.status.warningSurface,
      };

    // -- Danger: destructive intent ------------------------------------------
    case 'danger':
      return {
        bg: colors.status.danger,
        text: colors.text.inverse,
        border: colors.status.danger,
        hoverBg: colors.status.dangerSurface,
      };

    // -- Info: informational intent ------------------------------------------
    case 'info':
      return {
        bg: colors.status.info,
        text: colors.text.inverse,
        border: colors.status.info,
        hoverBg: colors.status.infoSurface,
      };

    // -- Ghost: transparent background, text-only ----------------------------
    case 'ghost':
      return {
        bg: 'transparent',
        text: colors.text.primary,
        border: 'transparent',
        hoverBg: colors.accent.highlight,
      };

    // -- Neutral: subdued, chrome-like surface --------------------------------
    case 'neutral':
      return {
        bg: colors.background.raised,
        text: colors.text.primary,
        border: colors.border.subtle,
        hoverBg: colors.background.surface,
      };

    default: {
      // Exhaustiveness guard -- TypeScript should catch this at compile time.
      const _exhaustive: never = appearance;
      throw new Error(`[Wisp] Unknown appearance variant: "${_exhaustive}"`);
    }
  }
}
