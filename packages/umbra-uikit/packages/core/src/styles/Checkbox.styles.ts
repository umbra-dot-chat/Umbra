import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { CheckboxSizeConfig } from '../types/Checkbox.types';
import { relativeLuminance } from '../utils/contrast';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Helper: detect hex color strings
// ---------------------------------------------------------------------------

/**
 * Test whether a string is a valid 3- or 6-digit hex color (e.g. `#FFF` or `#1A2B3C`).
 *
 * @param color - The string to test.
 * @returns `true` when the string matches a hex color pattern.
 */
function isHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

// ---------------------------------------------------------------------------
// Resolve checkbox colors
// ---------------------------------------------------------------------------

/**
 * Resolved color tokens consumed by the Checkbox style builders.
 *
 * @remarks
 * Produced by {@link resolveCheckboxColors} and threaded through
 * {@link buildBoxStyle} and {@link buildIconStyle} so that color decisions
 * are centralized.
 */
export interface CheckboxColors {
  /** Background color of the checkbox square. */
  boxBg: string;
  /** Border color of the checkbox square. */
  boxBorder: string;
  /** Background color of the checkbox square on hover. */
  boxBgHover: string;
  /** Border color of the checkbox square on hover. */
  boxBorderHover: string;
  /** Stroke color for the checkmark / dash SVG icon. */
  iconColor: string;
  /** Color of the label text. */
  labelColor: string;
  /** Color of the description text. */
  descriptionColor: string;
}

/**
 * Derive the full {@link CheckboxColors} palette for the current component state.
 *
 * @param checked       - Whether the checkbox is checked.
 * @param indeterminate - Whether the checkbox is in indeterminate (dash) state.
 * @param error         - Whether the checkbox is in an error state.
 * @param warning       - Whether the checkbox is in a warning state.
 * @param disabled      - Whether the checkbox is disabled.
 * @param themeColors   - Active theme color tokens.
 * @returns A {@link CheckboxColors} object reflecting the highest-priority state.
 */
export function resolveCheckboxColors(
  checked: boolean,
  indeterminate: boolean,
  error: boolean,
  warning: boolean,
  disabled: boolean,
  theme: WispTheme,
): CheckboxColors {
  const { colors: themeColors } = theme;
  // Disabled — muted everything
  if (disabled) {
    return {
      boxBg: checked || indeterminate ? themeColors.border.subtle : 'transparent',
      boxBorder: themeColors.border.subtle,
      boxBgHover: checked || indeterminate ? themeColors.border.subtle : 'transparent',
      boxBorderHover: themeColors.border.subtle,
      iconColor: themeColors.text.muted,
      labelColor: themeColors.text.muted,
      descriptionColor: themeColors.text.muted,
    };
  }

  // Resolve status border color (error takes precedence over warning)
  const statusBorder = error
    ? themeColors.status.danger
    : warning
      ? themeColors.status.warning
      : null;

  // Checked or indeterminate — filled box
  if (checked || indeterminate) {
    const accentColor = themeColors.accent.primary;
    // Pick icon color that contrasts with the accent — same approach as Toggle
    const accentIsLight = isHexColor(accentColor) && relativeLuminance(accentColor) > 0.4;
    const iconColor = accentIsLight ? '#0A0E15' : '#F7F8FA';

    return {
      boxBg: accentColor,
      boxBorder: statusBorder || accentColor,
      boxBgHover: themeColors.accent.primaryHover,
      boxBorderHover: statusBorder || themeColors.accent.primaryHover,
      iconColor,
      labelColor: themeColors.text.primary,
      descriptionColor: themeColors.text.secondary,
    };
  }

  // Unchecked — transparent with border
  return {
    boxBg: 'transparent',
    boxBorder: statusBorder || themeColors.border.strong,
    boxBgHover: 'transparent',
    boxBorderHover: statusBorder || themeColors.text.muted,
    iconColor: 'transparent',
    labelColor: themeColors.text.primary,
    descriptionColor: themeColors.text.secondary,
  };
}

// ---------------------------------------------------------------------------
// Box style (the checkbox square)
// ---------------------------------------------------------------------------

/**
 * Build the inline style for the visual checkbox square.
 *
 * @param sizeConfig - Active size configuration.
 * @param colors     - Resolved color tokens.
 * @param disabled   - Whether the checkbox is disabled (affects cursor).
 * @returns Inline style object for the checkbox `<span>`.
 */
export function buildBoxStyle(
  sizeConfig: CheckboxSizeConfig,
  colors: CheckboxColors,
  disabled: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeConfig.boxSize,
    height: sizeConfig.boxSize,
    minWidth: sizeConfig.boxSize,
    minHeight: sizeConfig.boxSize,
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: colors.boxBg,
    border: `1.5px solid ${colors.boxBorder}`,
    boxSizing: 'border-box',
    flexShrink: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, border-color ${durations.fast}ms ${easings.easeOut.css}, box-shadow ${durations.fast}ms ${easings.easeOut.css}, transform ${durations.normal}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
  };
}

// ---------------------------------------------------------------------------
// Icon style (the checkmark or dash SVG)
// ---------------------------------------------------------------------------

/**
 * Build the inline style for the checkmark / dash SVG icon inside the checkbox square.
 *
 * @param sizeConfig    - Active size configuration.
 * @param checked       - Whether the checkbox is checked.
 * @param indeterminate - Whether the checkbox is in indeterminate state.
 * @returns Inline style object for the `<svg>` element, including opacity and scale transitions.
 */
export function buildIconStyle(
  sizeConfig: CheckboxSizeConfig,
  checked: boolean,
  indeterminate: boolean,
): CSSStyleObject {
  const isVisible = checked || indeterminate;
  return {
    display: 'block',
    width: sizeConfig.iconSize,
    height: sizeConfig.iconSize,
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'scale(1)' : 'scale(0.8)',
    transition: isVisible
      ? 'opacity 120ms ease-out, transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)'
      : 'opacity 100ms ease-in, transform 100ms ease-in',
  };
}

// ---------------------------------------------------------------------------
// Skeleton style
// ---------------------------------------------------------------------------

/**
 * Build the skeleton placeholder style shown while the checkbox is loading.
 *
 * @param sizeConfig  - Active size configuration (used for width, height, and border radius).
 * @param themeColors - Active theme color tokens (used for the shimmer background).
 * @returns Inline style object for the skeleton `<div>`.
 */
export function getCheckboxSkeletonStyle(
  sizeConfig: CheckboxSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'inline-block',
    width: sizeConfig.boxSize,
    height: sizeConfig.boxSize,
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
