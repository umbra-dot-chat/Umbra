import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { ChatBubbleAlignment, ChatBubbleVariant } from '../types/ChatBubble.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Variant -> colors (theme-aware)
// ---------------------------------------------------------------------------

/**
 * Resolved color tokens for a chat bubble instance.
 */
export interface ChatBubbleColors {
  /** Bubble background color. */
  bg: string;
  /** Message text color. */
  text: string;
  /** Timestamp / secondary text color. */
  timestamp: string;
  /** Border color (used for subtle outlines). */
  border: string;
}

/**
 * Maps an alignment + variant combination to its theme-aware colors.
 *
 * @param align - Message direction (`incoming` or `outgoing`).
 * @param variant - Visual color variant (`default` or `accent`).
 * @param themeColors - Current theme color tokens.
 * @returns Resolved color set for the bubble.
 */
export function resolveChatBubbleColors(
  align: ChatBubbleAlignment,
  variant: ChatBubbleVariant,
  theme: WispTheme,
): ChatBubbleColors {
  const { colors: themeColors } = theme;
  if (align === 'outgoing') {
    return {
      bg: themeColors.accent.primary,
      text: themeColors.text.inverse,
      timestamp: themeColors.text.muted,
      border: themeColors.border.subtle,
    };
  }

  // incoming — light gray in light mode, dark raised in dark mode
  const isLight = theme.mode === 'light';
  if (isLight) {
    return {
      bg: themeColors.background.sunken,
      text: themeColors.text.primary,
      timestamp: themeColors.text.secondary,
      border: themeColors.border.subtle,
    };
  }
  return {
    bg: themeColors.background.raised,
    text: themeColors.text.onRaised,
    timestamp: themeColors.text.onRaisedSecondary,
    border: themeColors.accent.dividerRaised,
  };
}

// ---------------------------------------------------------------------------
// Bubble container style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the chat bubble container.
 *
 * The bubble has three rounded corners and one sharp (2 px) corner:
 * - incoming: sharp bottom-left
 * - outgoing: sharp bottom-right
 */
export function buildChatBubbleStyle(
  align: ChatBubbleAlignment,
  colors: ChatBubbleColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography, radii } = theme;
  const isOutgoing = align === 'outgoing';

  return {
    display: 'inline-block',
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: isOutgoing ? `${radii.lg}px ${radii.lg}px 2px ${radii.lg}px` : `${radii.lg}px ${radii.lg}px ${radii.lg}px 2px`,
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    color: colors.text,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Footer row (timestamp + status)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the footer row that holds timestamp and status.
 */
export function buildFooterStyle(align: ChatBubbleAlignment, theme: WispTheme): CSSStyleObject {
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
// Timestamp text
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the timestamp label.
 */
export function buildTimestampStyle(colors: ChatBubbleColors, theme: WispTheme): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes['2xs'].lineHeight}px`,
    color: colors.timestamp,
    fontFamily: fontFamilyStacks.sans,
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Status indicator
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the delivery status icon wrapper.
 */
export function buildStatusStyle(colors: ChatBubbleColors): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    color: colors.timestamp,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Reactions container
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the reactions row below the bubble.
 */
export function buildReactionsContainerStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  };
}

// ---------------------------------------------------------------------------
// Reaction chip
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for an individual reaction chip.
 *
 * @param reacted - Whether the current user has reacted.
 * @param themeColors - Current theme color tokens.
 */
export function buildReactionChipStyle(
  reacted: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing, typography } = theme;
  const chipBg = reacted
    ? themeColors.brand.surface
    : themeColors.background.surface;

  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing['2xs']}px ${spacing.sm}px`,
    borderRadius: radii.xl,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontFamily: fontFamilyStacks.sans,
    border: `1px solid ${reacted ? themeColors.brand.border : themeColors.border.subtle}`,
    backgroundColor: chipBg,
    color: reacted ? themeColors.brand.text : themeColors.text.secondary,
    cursor: 'pointer',
    userSelect: 'none',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, border-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Reply-to preview strip
// ---------------------------------------------------------------------------

/**
 * Builds the style for the quoted reply preview strip above the bubble content.
 *
 * @param senderColor - Optional custom color for the sender name.
 * @param colors      - Resolved bubble colors.
 * @param theme       - Current theme.
 */
export function buildReplyToStyle(
  colors: ChatBubbleColors,
  theme: WispTheme,
  senderColor?: string,
): {
  container: CSSStyleObject;
  sender: CSSStyleObject;
  text: CSSStyleObject;
} {
  const { spacing, typography } = theme;
  return {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      padding: `${spacing.xs}px ${spacing.sm}px`,
      marginBottom: spacing.xs,
      borderLeft: `2px solid ${senderColor || colors.timestamp}`,
      borderRadius: 2,
      cursor: 'pointer',
      opacity: 0.85,
    },
    sender: {
      fontFamily: fontFamilyStacks.sans,
      fontSize: typography.sizes.xs.fontSize,
      lineHeight: `${typography.sizes.xs.lineHeight}px`,
      fontWeight: typography.weights.semibold,
      color: senderColor || colors.timestamp,
    },
    text: {
      fontFamily: fontFamilyStacks.sans,
      fontSize: typography.sizes.xs.fontSize,
      lineHeight: `${typography.sizes.xs.lineHeight}px`,
      color: colors.timestamp,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      maxWidth: 220,
    },
  };
}

// ---------------------------------------------------------------------------
// Forwarded label
// ---------------------------------------------------------------------------

/**
 * Builds the style for the "Forwarded" label shown above forwarded messages.
 */
export function buildForwardedStyle(
  colors: ChatBubbleColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontStyle: 'italic',
    color: colors.timestamp,
    marginBottom: spacing.xs,
  };
}

// ---------------------------------------------------------------------------
// Media slot
// ---------------------------------------------------------------------------

/**
 * Builds the style for the media slot container inside the bubble.
 *
 * Uses negative margins to bleed the media edge-to-edge within the bubble,
 * counteracting the bubble's padding. When `isFirst` is true (no forwarded
 * label or reply-to above), the media also bleeds to the top edge.
 *
 * @param theme   - Current theme.
 * @param isFirst - Whether the media is the first element inside the bubble.
 */
export function buildMediaSlotStyle(theme: WispTheme, isFirst: boolean): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    marginLeft: -spacing.md,
    marginRight: -spacing.md,
    marginTop: isFirst ? -spacing.sm : 0,
    marginBottom: spacing.xs,
    overflow: 'hidden',
    // Only round corners that bleed to the bubble edge
    ...(isFirst ? {
      borderTopLeftRadius: radii.lg - 1,
      borderTopRightRadius: radii.lg - 1,
    } : {}),
  };
}

// ---------------------------------------------------------------------------
// Highlighted bubble overlay
// ---------------------------------------------------------------------------

/**
 * Builds the style for the highlight overlay when `highlighted` is true.
 * Uses a brief background flash animation.
 */
export function buildHighlightStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    backgroundColor: `${themeColors.accent.primary}15`,
    animation: `wisp-bubble-highlight ${durations.slow}ms ${easings.easeOut.css}`,
    borderRadius: 'inherit',
  };
}
