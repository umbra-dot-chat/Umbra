/**
 * @module ThreadFollowButton.styles
 * @description Style builders for the Wisp ThreadFollowButton component.
 */

import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { WispTheme } from '../theme/types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Size configs
// ---------------------------------------------------------------------------

export interface ThreadFollowButtonSizeConfig {
  height: number;
  paddingX: number;
  fontSize: number;
  iconSize: number;
  gap: number;
}

export const threadFollowButtonSizeMap: Record<'sm' | 'md', ThreadFollowButtonSizeConfig> = {
  sm: { height: 28, paddingX: 10, fontSize: 12, iconSize: 14, gap: 4 },
  md: { height: 32, paddingX: 14, fontSize: 14, iconSize: 16, gap: 6 },
};

// ---------------------------------------------------------------------------
// Button style — following state (filled accent)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the ThreadFollowButton.
 *
 * @param isFollowing - Whether the user is currently following.
 * @param size - Size variant.
 * @param theme - Current Wisp theme.
 * @param hovered - Whether the button is hovered.
 * @param disabled - Whether the button is disabled.
 */
export function buildThreadFollowButtonStyle(
  isFollowing: boolean,
  size: 'sm' | 'md',
  theme: WispTheme,
  hovered: boolean,
  disabled: boolean,
): CSSStyleObject {
  const { colors, radii, typography } = theme;
  const cfg = threadFollowButtonSizeMap[size];

  // Following state: secondary / filled style
  if (isFollowing) {
    return {
      // Reset
      margin: 0,
      border: 'none',
      outline: 'none',
      textDecoration: 'none',

      // Layout
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: cfg.gap,
      boxSizing: 'border-box',

      // Sizing
      height: cfg.height,
      padding: `0 ${cfg.paddingX}px`,

      // Typography
      fontFamily: fontFamilyStacks.sans,
      fontSize: cfg.fontSize,
      fontWeight: typography.weights.medium,
      lineHeight: 1,

      // Shape
      borderRadius: radii.md,

      // Colors — filled accent
      backgroundColor: hovered && !disabled ? colors.accent.highlight : colors.background.sunken,
      color: colors.text.secondary,
      boxShadow: `inset 0 0 0 1px ${colors.border.subtle}`,

      // Interaction
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      userSelect: 'none',

      // Transition
      transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, color ${durations.fast}ms ${easings.easeOut.css}, box-shadow ${durations.fast}ms ${easings.easeOut.css}`,
    };
  }

  // Not following state: outlined / tertiary style
  return {
    // Reset
    margin: 0,
    border: 'none',
    outline: 'none',
    textDecoration: 'none',

    // Layout
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: cfg.gap,
    boxSizing: 'border-box',

    // Sizing
    height: cfg.height,
    padding: `0 ${cfg.paddingX}px`,

    // Typography
    fontFamily: fontFamilyStacks.sans,
    fontSize: cfg.fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: 1,

    // Shape
    borderRadius: radii.md,

    // Colors — outlined
    backgroundColor: hovered && !disabled ? colors.accent.highlight : 'transparent',
    color: colors.text.link,
    boxShadow: `inset 0 0 0 1px ${colors.border.strong}`,

    // Interaction
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    userSelect: 'none',

    // Transition
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, color ${durations.fast}ms ${easings.easeOut.css}, box-shadow ${durations.fast}ms ${easings.easeOut.css}`,
  };
}
