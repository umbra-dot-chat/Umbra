import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { RadioSizeConfig } from '../types/Radio.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Resolved color set
// ---------------------------------------------------------------------------

/**
 * Resolved color tokens for the radio indicator and accompanying text.
 *
 * @remarks
 * Produced by {@link resolveRadioColors} based on the current selection,
 * disabled, and error states combined with the active {@link ThemeColors}.
 */
export interface RadioColors {
  /** Border color of the outer circle in its resting state. */
  outerBorder: string;
  /** Background color of the outer circle. */
  outerBg: string;
  /** Border color of the outer circle on hover. */
  outerBorderHover: string;
  /** Background color of the inner dot (transparent when unselected). */
  innerBg: string;
  /** Text color for the primary label. */
  labelColor: string;
  /** Text color for the secondary description. */
  descriptionColor: string;
}

// ---------------------------------------------------------------------------
// Color resolver
// ---------------------------------------------------------------------------

/**
 * Derives the full {@link RadioColors} palette for a radio indicator.
 *
 * @remarks
 * Priority order: disabled > error > selected > default (unselected).
 *
 * @param selected - Whether the radio is currently selected.
 * @param disabled - Whether the radio is disabled.
 * @param error - Whether the parent group is in an error state.
 * @param themeColors - Active theme color tokens.
 * @returns A complete {@link RadioColors} object for styling the radio.
 */
export function resolveRadioColors(
  selected: boolean,
  disabled: boolean,
  error: boolean,
  theme: WispTheme,
): RadioColors {
  const { colors: themeColors } = theme;
  // Disabled — muted everything
  if (disabled) {
    return {
      outerBorder: themeColors.border.subtle,
      outerBg: 'transparent',
      outerBorderHover: themeColors.border.subtle,
      innerBg: selected ? themeColors.text.muted : 'transparent',
      labelColor: themeColors.text.muted,
      descriptionColor: themeColors.text.muted,
    };
  }

  // Error — danger border
  if (error) {
    return {
      outerBorder: themeColors.status.danger,
      outerBg: 'transparent',
      outerBorderHover: themeColors.status.danger,
      innerBg: selected ? themeColors.accent.primary : 'transparent',
      labelColor: themeColors.text.primary,
      descriptionColor: themeColors.text.secondary,
    };
  }

  // Selected — accent primary
  if (selected) {
    return {
      outerBorder: themeColors.accent.primary,
      outerBg: 'transparent',
      outerBorderHover: themeColors.accent.primaryHover,
      innerBg: themeColors.accent.primary,
      labelColor: themeColors.text.primary,
      descriptionColor: themeColors.text.secondary,
    };
  }

  // Default — unselected
  return {
    outerBorder: themeColors.border.strong,
    outerBg: 'transparent',
    outerBorderHover: themeColors.text.muted,
    innerBg: 'transparent',
    labelColor: themeColors.text.primary,
    descriptionColor: themeColors.text.secondary,
  };
}

// ---------------------------------------------------------------------------
// Outer circle style
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the outer circle of the radio indicator.
 *
 * @param sizeConfig - Dimension config for the current size tier.
 * @param colors - Resolved color tokens from {@link resolveRadioColors}.
 * @param disabled - Whether the radio is disabled (affects cursor).
 * @returns `CSSStyleObject` for the outer `<span>` element.
 */
export function buildOuterCircleStyle(
  sizeConfig: RadioSizeConfig,
  colors: RadioColors,
  disabled: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeConfig.outerSize,
    height: sizeConfig.outerSize,
    minWidth: sizeConfig.outerSize,
    minHeight: sizeConfig.outerSize,
    borderRadius: radii.full,
    backgroundColor: colors.outerBg,
    border: `${sizeConfig.borderWidth}px solid ${colors.outerBorder}`,
    boxSizing: 'border-box',
    flexShrink: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}, box-shadow ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Inner dot style
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the inner dot of the radio indicator.
 *
 * @remarks
 * When `selected` is `false` the dot is scaled to zero and fully transparent;
 * the transition is handled via CSS `transform` and `opacity`.
 *
 * @param sizeConfig - Dimension config for the current size tier.
 * @param colors - Resolved color tokens from {@link resolveRadioColors}.
 * @param selected - Whether the radio is currently selected.
 * @returns `CSSStyleObject` for the inner dot `<span>` element.
 */
export function buildInnerDotStyle(
  sizeConfig: RadioSizeConfig,
  colors: RadioColors,
  selected: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'block',
    width: sizeConfig.innerSize,
    height: sizeConfig.innerSize,
    borderRadius: radii.full,
    backgroundColor: colors.innerBg,
    transform: selected ? 'scale(1)' : 'scale(0)',
    opacity: selected ? 1 : 0,
    transition: `transform ${durations.fast}ms ${easings.easeOut.css}, opacity ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Skeleton style
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for a single radio skeleton placeholder circle.
 *
 * @param sizeConfig - Dimension config for the current size tier.
 * @param themeColors - Active theme color tokens (used for the pulse background).
 * @returns `CSSStyleObject` for the skeleton `<div>` element.
 */
export function getRadioSkeletonStyle(
  sizeConfig: RadioSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'inline-block',
    width: sizeConfig.outerSize,
    height: sizeConfig.outerSize,
    borderRadius: radii.full,
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
