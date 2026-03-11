/**
 * @module ThreadIndicator.styles
 * @description Style builders for the Wisp ThreadIndicator component.
 */

import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { WispTheme } from '../theme/types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the ThreadIndicator container.
 *
 * @param theme - Current Wisp theme.
 * @param hovered - Whether the indicator is hovered.
 * @returns CSS style object for the container.
 */
export function buildThreadIndicatorContainerStyle(
  theme: WispTheme,
  hovered: boolean,
): CSSStyleObject {
  const { colors, spacing, radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.xs}px ${spacing.sm}px`,
    borderRadius: radii.md,
    border: `1px solid ${colors.border.subtle}`,
    backgroundColor: hovered ? colors.accent.highlight : 'transparent',
    cursor: 'pointer',
    userSelect: 'none',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Avatar stack
// ---------------------------------------------------------------------------

/**
 * Builds the style for the overlapping avatar stack container.
 */
export function buildAvatarStackStyle(): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  };
}

/**
 * Builds the style for an individual avatar wrapper in the stack.
 *
 * @param index - Zero-based index of the avatar.
 * @param theme - Current Wisp theme.
 */
export function buildAvatarItemStyle(
  index: number,
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    borderRadius: '50%',
    overflow: 'hidden',
    border: `2px solid ${theme.colors.background.surface}`,
    marginLeft: index > 0 ? -8 : 0,
    position: 'relative',
    zIndex: 3 - index,
  };
}

// ---------------------------------------------------------------------------
// Reply count text
// ---------------------------------------------------------------------------

/**
 * Builds the style for the reply count text.
 *
 * @param hasUnread - Whether the thread has unread replies.
 * @param theme - Current Wisp theme.
 */
export function buildReplyCountStyle(
  hasUnread: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { colors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: hasUnread ? typography.weights.semibold : typography.weights.medium,
    color: hasUnread ? colors.accent.primary : colors.text.link,
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Timestamp text
// ---------------------------------------------------------------------------

/**
 * Builds the style for the last reply timestamp.
 *
 * @param theme - Current Wisp theme.
 */
export function buildTimestampStyle(theme: WispTheme): CSSStyleObject {
  const { colors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    color: colors.text.muted,
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Icon wrapper
// ---------------------------------------------------------------------------

/**
 * Builds the style for the message icon wrapper.
 *
 * @param hasUnread - Whether the thread has unread replies.
 * @param theme - Current Wisp theme.
 */
export function buildIconStyle(
  hasUnread: boolean,
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: hasUnread ? theme.colors.accent.primary : theme.colors.text.link,
  };
}
