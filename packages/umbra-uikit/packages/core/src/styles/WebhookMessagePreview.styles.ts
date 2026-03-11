/**
 * Style builders for the {@link WebhookMessagePreview} component.
 *
 * @module components/webhook-message-preview
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

/**
 * Build the outer message container style.
 */
export function buildMessageContainerStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    gap: spacing.md,
    fontFamily: fontFamilyStacks.sans,
    padding: `${spacing.xs}px 0`,
  };
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

/**
 * Build the message avatar style.
 */
export function buildMessageAvatarStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    width: 40,
    height: 40,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.background.sunken,
  };
}

// ---------------------------------------------------------------------------
// Body
// ---------------------------------------------------------------------------

/**
 * Build the message body column style.
 */
export function buildMessageBodyStyle(): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    gap: 4,
  };
}

// ---------------------------------------------------------------------------
// Header (name + BOT badge + timestamp)
// ---------------------------------------------------------------------------

/**
 * Build the message header row style.
 */
export function buildMessageHeaderStyle(): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };
}

/**
 * Build the sender name style.
 */
export function buildMessageNameStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: 14,
    fontWeight: typography.weights.semibold,
    color: themeColors.text.primary,
    margin: 0,
  };
}

/**
 * Build the BOT badge style.
 */
export function buildBotBadgeStyle(): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1px 5px',
    fontSize: 10,
    fontFamily: fontFamilyStacks.sans,
    fontWeight: 700,
    lineHeight: 1.4,
    color: '#ffffff',
    backgroundColor: '#5865F2',
    borderRadius: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    verticalAlign: 'middle',
    flexShrink: 0,
  };
}

/**
 * Build the timestamp style.
 */
export function buildMessageTimestampStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: 11,
    fontWeight: typography.weights.regular,
    color: themeColors.text.muted,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

/**
 * Build the message content style.
 */
export function buildMessageContentStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: 14,
    fontWeight: typography.weights.regular,
    color: themeColors.text.secondary,
    margin: 0,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };
}

// ---------------------------------------------------------------------------
// Reactions
// ---------------------------------------------------------------------------

/**
 * Build the reactions row style.
 */
export function buildReactionsRowStyle(): CSSStyleObject {
  return {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  };
}

/**
 * Build a single reaction chip style.
 */
export function buildReactionChipStyle(
  theme: WispTheme,
  reacted: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px',
    fontSize: 12,
    fontFamily: fontFamilyStacks.sans,
    color: reacted ? themeColors.text.primary : themeColors.text.muted,
    backgroundColor: reacted
      ? themeColors.background.raised
      : themeColors.background.sunken,
    border: reacted
      ? `1px solid ${themeColors.border.subtle}`
      : `1px solid ${themeColors.border.subtle}`,
    borderRadius: radii.full,
    cursor: 'pointer',
    lineHeight: 1.5,
  };
}
