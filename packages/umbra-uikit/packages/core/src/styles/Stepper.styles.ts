/**
 * @module Stepper
 */
import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { StepperSizeConfig } from '../types/Stepper.types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Container style (the bordered row with [- button] [value] [+ button])
// ---------------------------------------------------------------------------

/**
 * Builds the outer container style for the Stepper row.
 *
 * @param sizeConfig - Dimension tokens derived from the active size variant.
 * @param themeColors - Resolved theme color palette.
 * @returns CSS properties for the container `div`.
 */
export function buildStepperContainerStyle(
  sizeConfig: StepperSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    height: sizeConfig.height,
    border: `1px solid ${themeColors.border.strong}`,
    borderRadius: radii[sizeConfig.borderRadius],
    overflow: 'hidden',
    boxSizing: 'border-box',
    gap: sizeConfig.gap,
  };
}

// ---------------------------------------------------------------------------
// Button style (decrement / increment buttons)
// ---------------------------------------------------------------------------

/**
 * Builds the style for a stepper button (decrement or increment).
 *
 * @param sizeConfig - Dimension tokens derived from the active size variant.
 * @param themeColors - Resolved theme color palette.
 * @param isDisabled - Whether the button is disabled (or at a clamped boundary).
 * @param isHovered - Whether the button is currently hovered.
 * @returns CSS properties for the `button` element.
 */
export function buildStepperButtonStyle(
  sizeConfig: StepperSizeConfig,
  theme: WispTheme,
  isDisabled: boolean,
  isHovered: boolean,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    // Reset
    margin: 0,
    padding: 0,
    border: 'none',
    outline: 'none',
    appearance: 'none' as const,

    // Sizing
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeConfig.buttonWidth,
    height: sizeConfig.height,
    flexShrink: 0,

    // Colors
    background: isHovered && !isDisabled
      ? themeColors.accent.highlight
      : 'transparent',
    color: isDisabled ? themeColors.text.muted : themeColors.text.primary,

    // Interaction
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: `background ${durations.fast}ms ${easings.easeOut.css}, color ${durations.fast}ms ${easings.easeOut.css}`,
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Value display style (the center number readout)
// ---------------------------------------------------------------------------

/**
 * Builds the style for the centered numeric value display.
 *
 * @param sizeConfig - Dimension tokens derived from the active size variant.
 * @param themeColors - Resolved theme color palette.
 * @returns CSS properties for the value `span` element.
 */
export function buildStepperValueStyle(
  sizeConfig: StepperSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing, typography } = theme;
  return {
    // Sizing
    minWidth: sizeConfig.buttonWidth,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    // Typography
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: 1,
    textAlign: 'center' as const,

    // Colors
    color: themeColors.text.primary,

    // Borders (vertical separators)
    borderLeft: `1px solid ${themeColors.border.strong}`,
    borderRight: `1px solid ${themeColors.border.strong}`,

    // Box model
    boxSizing: 'border-box',
    padding: `0 ${spacing.sm}px`,
  };
}

// ---------------------------------------------------------------------------
// Skeleton style
// ---------------------------------------------------------------------------

/**
 * Generates the inline style for a stepper skeleton shimmer placeholder.
 *
 * @param sizeConfig - The resolved {@link StepperSizeConfig} (determines width, height, and radius).
 * @param themeColors - The current theme color tokens.
 * @returns A `CSSStyleObject` object with dimensions, radius, background, and pulse animation.
 */
export function getStepperSkeletonStyle(
  sizeConfig: StepperSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  // Total width = 2 buttons + value area (same width as a button) + 2 border pixels
  const totalWidth = sizeConfig.buttonWidth * 3 + 2;
  return {
    display: 'inline-block',
    width: totalWidth,
    height: sizeConfig.height,
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
