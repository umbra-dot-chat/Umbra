/**
 * @module styles/ThreadPanel
 * @description Pure style-builder functions for the ThreadPanel component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';
import { withAlpha } from '../tokens/color-utils';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface ThreadPanelColors {
  bg: string;
  border: string;
  headerBg: string;
  headerText: string;
  headerTextMuted: string;
  messageText: string;
  messageTextSecondary: string;
  messageTextMuted: string;
  messageBg: string;
  messageBgHover: string;
  dividerText: string;
  dividerLine: string;
  closeHoverBg: string;
}

export function resolveThreadPanelColors(
  theme: WispTheme,
): ThreadPanelColors {
  const { colors } = theme;
  return {
    bg: colors.background.canvas,
    border: colors.border.subtle,
    headerBg: colors.background.canvas,
    headerText: colors.text.primary,
    headerTextMuted: colors.text.muted,
    messageText: colors.text.primary,
    messageTextSecondary: colors.text.secondary,
    messageTextMuted: colors.text.muted,
    messageBg: 'transparent',
    messageBgHover: colors.background.surface,
    dividerText: colors.text.muted,
    dividerLine: colors.border.subtle,
    closeHoverBg: withAlpha(colors.text.primary, 0.08),
  };
}

// ---------------------------------------------------------------------------
// Panel container
// ---------------------------------------------------------------------------

export function buildThreadPanelContainerStyle(
  colors: ThreadPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: colors.bg,
    borderLeft: `1px solid ${colors.border}`,
    boxSizing: 'border-box',
    minWidth: 320,
    maxWidth: 420,
    width: '100%',
  };
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export function buildThreadPanelHeaderStyle(
  colors: ThreadPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
    minHeight: 48,
    boxSizing: 'border-box',
  };
}

export function buildThreadPanelTitleStyle(
  colors: ThreadPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    color: colors.headerText,
    margin: 0,
  };
}

export function buildThreadPanelCloseStyle(
  colors: ThreadPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: radii.md,
    border: 'none',
    backgroundColor: 'transparent',
    color: colors.headerTextMuted,
    cursor: 'pointer',
    padding: 0,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Messages area
// ---------------------------------------------------------------------------

export function buildThreadPanelBodyStyle(): CSSStyleObject {
  return {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  };
}

// ---------------------------------------------------------------------------
// Thread message
// ---------------------------------------------------------------------------

export function buildThreadMessageStyle(
  colors: ThreadPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    gap: spacing.sm,
    padding: `${spacing.sm}px ${spacing.md}px`,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

export function buildThreadMessageAvatarStyle(): CSSStyleObject {
  return {
    flexShrink: 0,
  };
}

export function buildThreadMessageContentStyle(): CSSStyleObject {
  return {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };
}

export function buildThreadMessageSenderStyle(
  colors: ThreadPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
  };
}

export function buildThreadMessageNameStyle(
  colors: ThreadPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    color: colors.messageText,
  };
}

export function buildThreadMessageTimestampStyle(
  colors: ThreadPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes['2xs'].fontSize,
    lineHeight: `${typography.sizes['2xs'].lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colors.messageTextMuted,
  };
}

export function buildThreadMessageTextStyle(
  colors: ThreadPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colors.messageTextSecondary,
    margin: 0,
    wordBreak: 'break-word',
  };
}

// ---------------------------------------------------------------------------
// Reply divider
// ---------------------------------------------------------------------------

export function buildThreadDividerStyle(
  colors: ThreadPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.xs}px ${spacing.md}px`,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    color: colors.dividerText,
    fontWeight: typography.weights.medium,
  };
}

export function buildThreadDividerLineStyle(
  colors: ThreadPanelColors,
): CSSStyleObject {
  return {
    flex: 1,
    height: 1,
    backgroundColor: colors.dividerLine,
  };
}

// ---------------------------------------------------------------------------
// Input area
// ---------------------------------------------------------------------------

export function buildThreadInputAreaStyle(
  colors: ThreadPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderTop: `1px solid ${colors.border}`,
    flexShrink: 0,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

export function buildThreadLoadingStyle(
  colors: ThreadPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing.xl}px`,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    color: colors.messageTextMuted,
  };
}
