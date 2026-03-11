/**
 * @module styles/MessageSearch
 * @description Pure style-builder functions for the MessageSearch component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';
import { withAlpha } from '../tokens/color-utils';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface MessageSearchColors {
  bg: string;
  border: string;
  headerText: string;
  headerTextMuted: string;
  inputBg: string;
  inputBorder: string;
  inputBorderFocus: string;
  inputText: string;
  inputPlaceholder: string;
  closeHoverBg: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
  pillRemoveHover: string;
  resultBg: string;
  resultBgHover: string;
  resultSender: string;
  resultContent: string;
  resultTimestamp: string;
  resultChannel: string;
  highlightText: string;
  emptyText: string;
  loadingText: string;
  countText: string;
}

export function resolveMessageSearchColors(
  theme: WispTheme,
): MessageSearchColors {
  const { colors } = theme;
  return {
    bg: colors.background.canvas,
    border: colors.border.subtle,
    headerText: colors.text.primary,
    headerTextMuted: colors.text.muted,
    inputBg: colors.background.sunken,
    inputBorder: colors.border.strong,
    inputBorderFocus: colors.accent.primary,
    inputText: colors.text.primary,
    inputPlaceholder: colors.text.muted,
    closeHoverBg: withAlpha(colors.text.primary, 0.08),
    pillBg: withAlpha(colors.accent.primary, 0.12),
    pillText: colors.accent.primary,
    pillBorder: withAlpha(colors.accent.primary, 0.24),
    pillRemoveHover: colors.status.danger,
    resultBg: 'transparent',
    resultBgHover: withAlpha(colors.text.primary, 0.05),
    resultSender: colors.text.primary,
    resultContent: colors.text.secondary,
    resultTimestamp: colors.text.muted,
    resultChannel: colors.text.muted,
    highlightText: colors.accent.primary,
    emptyText: colors.text.muted,
    loadingText: colors.text.muted,
    countText: colors.text.muted,
  };
}

// ---------------------------------------------------------------------------
// Panel container
// ---------------------------------------------------------------------------

export function buildMessageSearchContainerStyle(
  colors: MessageSearchColors,
  _theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: colors.bg,
    borderLeft: `1px solid ${colors.border}`,
    boxSizing: 'border-box',
    minWidth: 300,
    maxWidth: 400,
    width: '100%',
  };
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export function buildSearchHeaderStyle(
  colors: MessageSearchColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
    minHeight: 48,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Search input
// ---------------------------------------------------------------------------

export function buildSearchInputStyle(
  colors: MessageSearchColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography, radii } = theme;
  return {
    flex: 1,
    minWidth: 0,
    height: 32,
    padding: '0 10px',
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    color: colors.inputText,
    backgroundColor: colors.inputBg,
    border: `1px solid ${colors.inputBorder}`,
    borderRadius: radii.md,
    outline: 'none',
    boxSizing: 'border-box',
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}, box-shadow ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Close button
// ---------------------------------------------------------------------------

export function buildSearchCloseStyle(
  colors: MessageSearchColors,
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
// Filters container
// ---------------------------------------------------------------------------

export function buildFiltersContainerStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xs,
    padding: `${spacing.xs}px ${spacing.md}px`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Filter pill
// ---------------------------------------------------------------------------

export function buildFilterPillStyle(
  colors: MessageSearchColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography, radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    height: 24,
    padding: '0 8px',
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes['2xs'].fontSize,
    lineHeight: `${typography.sizes['2xs'].lineHeight}px`,
    fontWeight: typography.weights.medium,
    color: colors.pillText,
    backgroundColor: colors.pillBg,
    border: `1px solid ${colors.pillBorder}`,
    borderRadius: radii.full,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Filter remove (x) button
// ---------------------------------------------------------------------------

export function buildFilterRemoveStyle(
  colors: MessageSearchColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 14,
    height: 14,
    padding: 0,
    margin: 0,
    border: 'none',
    borderRadius: radii.full,
    backgroundColor: 'transparent',
    color: colors.pillText,
    cursor: 'pointer',
    flexShrink: 0,
    transition: `color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Results container (scrollable)
// ---------------------------------------------------------------------------

export function buildResultsContainerStyle(
  theme: WispTheme,
): CSSStyleObject {
  return {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Result item
// ---------------------------------------------------------------------------

export function buildResultItemStyle(
  colors: MessageSearchColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    gap: spacing.sm,
    padding: `${spacing.sm}px ${spacing.md}px`,
    backgroundColor: colors.resultBg,
    cursor: 'pointer',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    boxSizing: 'border-box',
    borderBottom: `1px solid ${colors.border}`,
  };
}

// ---------------------------------------------------------------------------
// Result sender
// ---------------------------------------------------------------------------

export function buildResultSenderStyle(
  colors: MessageSearchColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    color: colors.resultSender,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Result content snippet
// ---------------------------------------------------------------------------

export function buildResultContentStyle(
  colors: MessageSearchColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colors.resultContent,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    overflow: 'hidden',
    margin: 0,
    wordBreak: 'break-word',
  };
}

// ---------------------------------------------------------------------------
// Result timestamp
// ---------------------------------------------------------------------------

export function buildResultTimestampStyle(
  colors: MessageSearchColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes['2xs'].fontSize,
    lineHeight: `${typography.sizes['2xs'].lineHeight}px`,
    color: colors.resultTimestamp,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Result channel name
// ---------------------------------------------------------------------------

export function buildResultChannelStyle(
  colors: MessageSearchColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes['2xs'].fontSize,
    lineHeight: `${typography.sizes['2xs'].lineHeight}px`,
    color: colors.resultChannel,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function buildSearchEmptyStyle(
  colors: MessageSearchColors,
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
// Loading state
// ---------------------------------------------------------------------------

export function buildSearchLoadingStyle(
  colors: MessageSearchColors,
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
    color: colors.loadingText,
  };
}

// ---------------------------------------------------------------------------
// Result count
// ---------------------------------------------------------------------------

export function buildResultCountStyle(
  colors: MessageSearchColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography, spacing } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colors.countText,
    padding: `${spacing.xs}px ${spacing.md}px`,
    boxSizing: 'border-box',
  };
}
