/**
 * @module primitives/pin-input
 * @description Style builders for the PinInput primitive.
 *
 * Follows the same state-based color resolution pattern as Input
 * (`resolveInputColors`) and uses monospace font for code characters.
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { PinInputSizeConfig } from '../types/PinInput.types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Resolved cell colors (reuses Input color resolution pattern)
// ---------------------------------------------------------------------------

/** Resolved color values for a pin input cell. */
export interface PinInputColors {
  /** Cell border color. */
  border: string;
  /** Cell background color. */
  bg: string;
  /** Character text color. */
  text: string;
  /** Placeholder text color. */
  placeholder: string;
  /** Label text color. */
  label: string;
  /** Hint / error text color. */
  hint: string;
  /** Focus ring color (transparent when not focused). */
  focusRing: string;
}

/**
 * Resolves cell colors based on current state.
 * Priority: disabled → error → warning → focused → default.
 *
 * @param focused - Whether the cell (or any cell) is focused.
 * @param error - Whether the input is in error state.
 * @param warning - Whether the input is in warning state.
 * @param disabled - Whether the input is disabled.
 * @param themeColors - Current theme color tokens.
 * @returns Resolved color values.
 */
export function resolvePinInputColors(
  focused: boolean,
  error: boolean,
  warning: boolean,
  disabled: boolean,
  theme: WispTheme,
): PinInputColors {
  const { colors: themeColors } = theme;
  if (disabled) {
    return {
      border: themeColors.border.subtle,
      bg: themeColors.border.subtle,
      text: themeColors.text.muted,
      placeholder: themeColors.text.muted,
      label: themeColors.text.muted,
      hint: themeColors.text.muted,
      focusRing: 'transparent',
    };
  }

  if (error) {
    return {
      border: themeColors.status.danger,
      bg: 'transparent',
      text: themeColors.text.primary,
      placeholder: themeColors.text.muted,
      label: themeColors.text.primary,
      hint: themeColors.status.danger,
      focusRing: focused ? themeColors.status.danger : 'transparent',
    };
  }

  if (warning) {
    return {
      border: themeColors.status.warning,
      bg: 'transparent',
      text: themeColors.text.primary,
      placeholder: themeColors.text.muted,
      label: themeColors.text.primary,
      hint: themeColors.status.warning,
      focusRing: focused ? themeColors.status.warning : 'transparent',
    };
  }

  if (focused) {
    return {
      border: themeColors.accent.primary,
      bg: 'transparent',
      text: themeColors.text.primary,
      placeholder: themeColors.text.muted,
      label: themeColors.text.primary,
      hint: themeColors.text.muted,
      focusRing: themeColors.accent.primary,
    };
  }

  return {
    border: themeColors.border.strong,
    bg: 'transparent',
    text: themeColors.text.primary,
    placeholder: themeColors.text.muted,
    label: themeColors.text.primary,
    hint: themeColors.text.muted,
    focusRing: 'transparent',
  };
}

// ---------------------------------------------------------------------------
// Outer wrapper (label + cells + hint)
// ---------------------------------------------------------------------------

/**
 * Builds the outer wrapper style (vertical flex column).
 *
 * @param sizeConfig - Current size config.
 * @returns CSS properties for the wrapper div.
 */
export function buildWrapperStyle(sizeConfig: PinInputSizeConfig): CSSStyleObject {
  return {
    display: 'inline-flex',
    flexDirection: 'column',
    gap: sizeConfig.gap > 8 ? 6 : 4,
  };
}

// ---------------------------------------------------------------------------
// Cell container (the row of cells)
// ---------------------------------------------------------------------------

/**
 * Builds the flex row container that holds all cells.
 *
 * @param sizeConfig - Current size config.
 * @returns CSS properties for the cell container div.
 */
export function buildCellContainerStyle(sizeConfig: PinInputSizeConfig): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    gap: sizeConfig.gap,
    alignItems: 'center',
  };
}

// ---------------------------------------------------------------------------
// Individual cell
// ---------------------------------------------------------------------------

/**
 * Builds the style for a single input cell.
 *
 * @param sizeConfig - Current size config.
 * @param colors - Resolved colors for this cell.
 * @param isFocused - Whether this specific cell is focused.
 * @param disabled - Whether the cell is disabled.
 * @returns CSS properties for the cell input element.
 */
export function buildCellStyle(
  sizeConfig: PinInputSizeConfig,
  colors: PinInputColors,
  isFocused: boolean,
  disabled: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { typography, radii } = theme;
  const focusRing = isFocused && colors.focusRing !== 'transparent'
    ? `0 0 0 2px ${colors.focusRing}25`
    : 'none';

  return {
    // Reset
    margin: 0,
    padding: 0,
    outline: 'none',
    appearance: 'none',

    // Sizing — square cells
    width: sizeConfig.cellSize,
    height: sizeConfig.cellSize,
    boxSizing: 'border-box',
    flexShrink: 0,

    // Typography — monospace for code input
    fontFamily: fontFamilyStacks.mono,
    fontSize: sizeConfig.fontSize,
    fontWeight: typography.weights.semibold,
    lineHeight: 1,
    textAlign: 'center',

    // Colors
    color: colors.text,
    backgroundColor: colors.bg,

    // Border
    border: `1px solid ${isFocused ? colors.focusRing !== 'transparent' ? colors.focusRing : colors.border : colors.border}`,
    borderRadius: radii[sizeConfig.borderRadius],
    boxShadow: focusRing,

    // Interaction
    cursor: disabled ? 'not-allowed' : 'text',
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}, box-shadow ${durations.fast}ms ${easings.easeOut.css}`,

    // Prevent zoom on mobile
    WebkitTextSizeAdjust: '100%',
  };
}

// ---------------------------------------------------------------------------
// Label style
// ---------------------------------------------------------------------------

/**
 * Builds the label style above the cells.
 *
 * @param sizeConfig - Current size config.
 * @param colors - Resolved colors.
 * @returns CSS properties for the label element.
 */
export function buildLabelStyle(
  sizeConfig: PinInputSizeConfig,
  colors: PinInputColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.labelFontSize,
    lineHeight: 1.4,
    fontWeight: typography.weights.medium,
    color: colors.label,
    cursor: 'default',
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Hint / error style
// ---------------------------------------------------------------------------

/**
 * Builds the hint or error message style below the cells.
 *
 * @param sizeConfig - Current size config.
 * @param colors - Resolved colors.
 * @returns CSS properties for the hint/error text.
 */
export function buildHintStyle(
  sizeConfig: PinInputSizeConfig,
  colors: PinInputColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.hintFontSize,
    lineHeight: 1.4,
    fontWeight: typography.weights.regular,
    color: colors.hint,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Skeleton cell style
// ---------------------------------------------------------------------------

/**
 * Builds the skeleton placeholder style for a single cell.
 *
 * @param sizeConfig - Current size config.
 * @param themeColors - Theme color tokens.
 * @returns CSS properties for a skeleton cell div.
 */
export function buildSkeletonCellStyle(
  sizeConfig: PinInputSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    width: sizeConfig.cellSize,
    height: sizeConfig.cellSize,
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
    flexShrink: 0,
  };
}
