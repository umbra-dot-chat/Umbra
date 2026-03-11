/**
 * @module CopyButton.styles
 * @description Style builders for the Wisp CopyButton component.
 */

import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { CopyButtonSizeConfig, CopyButtonVariant } from '../types/CopyButton.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Button style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the CopyButton.
 *
 * @param sizeConfig - Active {@link CopyButtonSizeConfig}.
 * @param themeColors - Resolved theme color tokens.
 * @param variant - The visual variant ('outline' | 'ghost' | 'minimal').
 * @param isCopied - Whether the button is in its "copied" success state.
 * @param isHovered - Whether the button is currently hovered.
 * @param isDisabled - Whether the button is non-interactive.
 * @returns A `CSSStyleObject` object for the copy button.
 */
export function buildCopyButtonStyle(
  sizeConfig: CopyButtonSizeConfig,
  theme: WispTheme,
  variant: CopyButtonVariant,
  isCopied: boolean,
  isHovered: boolean,
  isDisabled: boolean,
): CSSStyleObject {
  const { colors: themeColors, typography, radii } = theme;
  const isMinimal = variant === 'minimal';

  // Base background
  let backgroundColor = 'transparent';
  if (isCopied && !isMinimal) {
    backgroundColor = 'transparent';
  } else if (isHovered && !isDisabled && !isMinimal) {
    backgroundColor = themeColors.accent.highlight;
  }

  // Text / icon color
  let color = themeColors.text.secondary;
  if (isCopied) {
    color = themeColors.accent.primary;
  }

  // Border
  let boxShadow = 'none';
  if (variant === 'outline' && !isMinimal) {
    if (isCopied) {
      boxShadow = `inset 0 0 0 1px ${themeColors.accent.primary}`;
    } else {
      boxShadow = `inset 0 0 0 1px ${themeColors.border.strong}`;
    }
  }

  return {
    // Reset
    margin: 0,
    border: 'none',
    outline: 'none',
    textDecoration: 'none',
    background: 'none',

    // Layout
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizeConfig.gap,
    boxSizing: 'border-box',

    // Sizing
    height: isMinimal ? 'auto' : sizeConfig.height,
    padding: isMinimal ? 0 : `0 ${sizeConfig.paddingX}px`,

    // Typography
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: 1,

    // Shape
    borderRadius: radii.sm,

    // Colors
    backgroundColor,
    color,
    boxShadow,

    // Interaction
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.5 : 1,
    userSelect: 'none',

    // Transition
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, color ${durations.fast}ms ${easings.easeOut.css}, box-shadow ${durations.fast}ms ${easings.easeOut.css}, opacity ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Skeleton style
// ---------------------------------------------------------------------------

/**
 * Builds the skeleton loading placeholder style for the CopyButton.
 *
 * @param sizeConfig - Active {@link CopyButtonSizeConfig}.
 * @param themeColors - Active theme color tokens.
 * @returns CSS properties for the skeleton `<div>`.
 */
export function getCopyButtonSkeletonStyle(
  sizeConfig: CopyButtonSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'inline-block',
    width: sizeConfig.height * 2.5,
    height: sizeConfig.height,
    borderRadius: radii.md,
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
