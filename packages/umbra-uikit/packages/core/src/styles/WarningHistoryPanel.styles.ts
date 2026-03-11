/**
 * @module styles/WarningHistoryPanel
 * @description Pure style-builder functions for the WarningHistoryPanel component.
 *
 * A per-member panel showing their warning history.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { withAlpha } from '../tokens/color-utils';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface WarningHistoryColors {
  bg: string;
  border: string;
  headerText: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  cardBg: string;
  cardHoverBg: string;
  activeBadgeBg: string;
  activeBadgeText: string;
  expiredBadgeBg: string;
  expiredBadgeText: string;
  deleteText: string;
  deleteHoverBg: string;
  divider: string;
  countBg: string;
  countText: string;
}

export function resolveWarningHistoryColors(theme: WispTheme): WarningHistoryColors {
  const { colors } = theme;
  return {
    bg: colors.background.surface,
    border: colors.border.subtle,
    headerText: colors.text.primary,
    textPrimary: colors.text.primary,
    textSecondary: colors.text.secondary,
    textMuted: colors.text.muted,
    cardBg: 'transparent',
    cardHoverBg: withAlpha(colors.text.primary, 0.04),
    activeBadgeBg: colors.status.warningSurface,
    activeBadgeText: colors.status.warning,
    expiredBadgeBg: withAlpha(colors.text.primary, 0.06),
    expiredBadgeText: colors.text.muted,
    deleteText: colors.status.danger,
    deleteHoverBg: colors.status.dangerSurface,
    divider: colors.border.subtle,
    countBg: withAlpha(colors.text.primary, 0.08),
    countText: colors.text.secondary,
  };
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildContainerStyle(
  colors: WarningHistoryColors,
  theme: WispTheme,
  userStyle?: CSSStyleObject,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.lg,
    boxSizing: 'border-box',
    overflow: 'hidden',
    fontFamily: fontFamilyStacks.sans,
    ...userStyle,
  };
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export function buildHeaderStyle(
  colors: WarningHistoryColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.md}px ${spacing.lg}px`,
    borderBottom: `1px solid ${colors.divider}`,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.base.fontSize,
    lineHeight: `${typography.sizes.base.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    color: colors.headerText,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Member info
// ---------------------------------------------------------------------------

export function buildMemberInfoStyle(
  colors: WarningHistoryColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.md}px ${spacing.lg}px`,
    borderBottom: `1px solid ${colors.divider}`,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Warning card
// ---------------------------------------------------------------------------

export function buildWarningCardStyle(
  colors: WarningHistoryColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    padding: `${spacing.sm}px ${spacing.lg}px`,
    borderBottom: `1px solid ${colors.divider}`,
    backgroundColor: colors.cardBg,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Warning meta row
// ---------------------------------------------------------------------------

export function buildWarningMetaStyle(
  colors: WarningHistoryColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    color: colors.textSecondary,
  };
}

// ---------------------------------------------------------------------------
// Reason text
// ---------------------------------------------------------------------------

export function buildReasonStyle(
  colors: WarningHistoryColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colors.textPrimary,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Count badge
// ---------------------------------------------------------------------------

export function buildCountBadgeStyle(
  colors: WarningHistoryColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, spacing, typography } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
    minWidth: 20,
    padding: `0 ${spacing.xs}px`,
    borderRadius: radii.full,
    backgroundColor: colors.countBg,
    color: colors.countText,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes['2xs'].fontSize,
    fontWeight: typography.weights.semibold,
    lineHeight: 1,
  };
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function buildEmptyStyle(
  colors: WarningHistoryColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing.xl}px ${spacing.lg}px`,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    color: colors.textMuted,
    textAlign: 'center',
  };
}
