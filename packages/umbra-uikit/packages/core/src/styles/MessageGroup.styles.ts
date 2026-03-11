import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { ChatBubbleAlignment } from '../types/ChatBubble.types';

// ---------------------------------------------------------------------------
// Group container
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the message group wrapper.
 *
 * @param align - Message direction (`incoming` or `outgoing`).
 */
export function buildMessageGroupStyle(align: ChatBubbleAlignment, theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: align === 'outgoing' ? 'flex-end' : 'flex-start',
    gap: spacing['2xs'],
  };
}

// ---------------------------------------------------------------------------
// Sender name text
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the sender display name.
 *
 * @param themeColors - Current theme color tokens.
 */
export function buildSenderNameStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    fontFamily: fontFamilyStacks.sans,
    color: themeColors.text.secondary,
  };
}

// ---------------------------------------------------------------------------
// Content row: avatar + bubbles side-by-side
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the horizontal row that places avatar beside
 * the stacked bubbles column.
 *
 * @param align - Message direction.
 */
export function buildContentRowStyle(align: ChatBubbleAlignment, theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: align === 'outgoing' ? 'row-reverse' : 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  };
}

// ---------------------------------------------------------------------------
// Bubbles stack
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the stacked bubbles container.
 *
 * @param align - Message direction.
 */
export function buildBubblesContainerStyle(align: ChatBubbleAlignment, theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: align === 'outgoing' ? 'flex-end' : 'flex-start',
    gap: spacing.xs,
  };
}

// ---------------------------------------------------------------------------
// Group footer (timestamp + status)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the group-level footer row (timestamp + status).
 *
 * @param align - Message direction.
 */
export function buildGroupFooterStyle(align: ChatBubbleAlignment, theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    justifyContent: align === 'outgoing' ? 'flex-end' : 'flex-start',
  };
}

// ---------------------------------------------------------------------------
// Group footer timestamp text
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the group-level timestamp label.
 *
 * @param themeColors - Current theme color tokens.
 */
export function buildGroupTimestampStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes['2xs'].lineHeight}px`,
    color: themeColors.text.muted,
    fontFamily: fontFamilyStacks.sans,
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Group footer status icon
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the group-level status icon wrapper.
 *
 * @param themeColors - Current theme color tokens.
 */
export function buildGroupStatusStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    color: themeColors.text.muted,
    flexShrink: 0,
  };
}
