/**
 * @module styles/PinnedMessages
 * @description Pure style-builder functions for the PinnedMessages component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';
import { withAlpha } from '../tokens/color-utils';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface PinnedMessagesColors {
  bg: string;
  border: string;
  headerText: string;
  headerTextMuted: string;
  cardBg: string;
  cardBgHover: string;
  cardBorder: string;
  cardText: string;
  cardTextSecondary: string;
  cardTextMuted: string;
  emptyText: string;
  unpinText: string;
  unpinTextHover: string;
  closeHoverBg: string;
}

export function resolvePinnedMessagesColors(
  theme: WispTheme,
): PinnedMessagesColors {
  const { colors, mode } = theme;
  const isLight = mode === 'light';
  return {
    bg: colors.background.canvas,
    border: colors.border.subtle,
    headerText: colors.text.primary,
    headerTextMuted: colors.text.muted,
    cardBg: isLight ? colors.background.sunken : colors.background.surface,
    cardBgHover: isLight ? colors.background.sunken : colors.background.surface,
    cardBorder: isLight ? colors.border.subtle : colors.accent.dividerRaised,
    cardText: isLight ? colors.text.primary : colors.text.onRaised,
    cardTextSecondary: isLight ? colors.text.secondary : colors.text.onRaisedSecondary,
    cardTextMuted: isLight ? colors.text.muted : withAlpha(colors.text.onRaisedSecondary, 0.7),
    emptyText: colors.text.muted,
    unpinText: isLight ? colors.text.muted : withAlpha(colors.text.onRaisedSecondary, 0.7),
    unpinTextHover: colors.status.danger,
    closeHoverBg: withAlpha(colors.text.primary, 0.08),
  };
}

// ---------------------------------------------------------------------------
// Panel container
// ---------------------------------------------------------------------------

export function buildPinnedMessagesContainerStyle(
  colors: PinnedMessagesColors,
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: colors.bg,
    borderLeft: `1px solid ${colors.border}`,
    boxSizing: 'border-box',
    minWidth: 300,
    maxWidth: 380,
    width: '100%',
  };
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export function buildPinnedHeaderStyle(
  colors: PinnedMessagesColors,
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

export function buildPinnedTitleStyle(
  colors: PinnedMessagesColors,
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

export function buildPinnedCountStyle(
  colors: PinnedMessagesColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colors.headerTextMuted,
    marginLeft: 6,
  };
}

export function buildPinnedCloseStyle(
  colors: PinnedMessagesColors,
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
// Body (scrollable)
// ---------------------------------------------------------------------------

export function buildPinnedBodyStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    padding: spacing.sm,
    minHeight: 0,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Pinned message card
// ---------------------------------------------------------------------------

export function buildPinnedCardStyle(
  colors: PinnedMessagesColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    border: `1px solid ${colors.cardBorder}`,
    backgroundColor: colors.cardBg,
    cursor: 'pointer',
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}`,
    boxSizing: 'border-box',
  };
}

export function buildPinnedCardHeaderStyle(): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  };
}

export function buildPinnedCardSenderRowStyle(): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  };
}

export function buildPinnedCardSenderStyle(
  colors: PinnedMessagesColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    color: colors.cardText,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

export function buildPinnedCardTimestampStyle(
  colors: PinnedMessagesColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes['2xs'].fontSize,
    lineHeight: `${typography.sizes['2xs'].lineHeight}px`,
    color: colors.cardTextMuted,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };
}

export function buildPinnedCardContentStyle(
  colors: PinnedMessagesColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colors.cardTextSecondary,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    overflow: 'hidden',
    margin: 0,
    wordBreak: 'break-word',
  };
}

export function buildPinnedCardFooterStyle(): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  };
}

export function buildPinnedByStyle(
  colors: PinnedMessagesColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes['2xs'].fontSize,
    lineHeight: `${typography.sizes['2xs'].lineHeight}px`,
    color: colors.cardTextMuted,
  };
}

export function buildUnpinButtonStyle(
  colors: PinnedMessagesColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography, radii } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes['2xs'].fontSize,
    lineHeight: `${typography.sizes['2xs'].lineHeight}px`,
    color: colors.unpinText,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: radii.sm,
    transition: `color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function buildPinnedEmptyStyle(
  colors: PinnedMessagesColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: `${spacing.xl}px`,
    flex: 1,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    color: colors.emptyText,
    textAlign: 'center',
  };
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

export function buildPinnedLoadingStyle(
  colors: PinnedMessagesColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing.xl}px`,
    flex: 1,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    color: colors.emptyText,
  };
}
