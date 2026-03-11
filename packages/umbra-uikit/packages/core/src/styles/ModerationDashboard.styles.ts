/**
 * @module styles/ModerationDashboard
 * @description Pure style-builder functions for the ModerationDashboard component.
 *
 * An overview dashboard with moderation statistics and recent activity.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { withAlpha } from '../tokens/color-utils';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface ModerationDashboardColors {
  bg: string;
  border: string;
  headerText: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  cardBg: string;
  cardBorder: string;
  actionRowBg: string;
  actionRowHoverBg: string;
  alertBg: string;
  alertBorder: string;
  divider: string;
  tabActiveBg: string;
  tabActiveText: string;
  tabInactiveText: string;
  warningBadgeBg: string;
  warningBadgeText: string;
  timeoutBadgeBg: string;
  timeoutBadgeText: string;
  kickBadgeBg: string;
  kickBadgeText: string;
  banBadgeBg: string;
  banBadgeText: string;
  highConfBg: string;
  highConfText: string;
  medConfBg: string;
  medConfText: string;
  lowConfBg: string;
  lowConfText: string;
  positiveChange: string;
  negativeChange: string;
}

export function resolveModerationDashboardColors(theme: WispTheme): ModerationDashboardColors {
  const { colors } = theme;
  return {
    bg: colors.background.surface,
    border: colors.border.subtle,
    headerText: colors.text.primary,
    textPrimary: colors.text.primary,
    textSecondary: colors.text.secondary,
    textMuted: colors.text.muted,
    cardBg: colors.background.canvas,
    cardBorder: colors.border.subtle,
    actionRowBg: 'transparent',
    actionRowHoverBg: withAlpha(colors.text.primary, 0.04),
    alertBg: colors.status.warningSurface,
    alertBorder: colors.status.warning,
    divider: colors.border.subtle,
    tabActiveBg: withAlpha(colors.text.primary, 0.08),
    tabActiveText: colors.text.primary,
    tabInactiveText: colors.text.secondary,
    warningBadgeBg: colors.status.warningSurface,
    warningBadgeText: colors.status.warning,
    timeoutBadgeBg: withAlpha(colors.status.info, 0.12),
    timeoutBadgeText: colors.status.info,
    kickBadgeBg: withAlpha(colors.text.primary, 0.08),
    kickBadgeText: colors.text.secondary,
    banBadgeBg: colors.status.dangerSurface,
    banBadgeText: colors.status.danger,
    highConfBg: colors.status.dangerSurface,
    highConfText: colors.status.danger,
    medConfBg: colors.status.warningSurface,
    medConfText: colors.status.warning,
    lowConfBg: withAlpha(colors.text.primary, 0.06),
    lowConfText: colors.text.muted,
    positiveChange: colors.status.success,
    negativeChange: colors.status.danger,
  };
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildContainerStyle(
  colors: ModerationDashboardColors,
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
  colors: ModerationDashboardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
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
// Stats grid
// ---------------------------------------------------------------------------

export function buildStatsGridStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: spacing.md,
    padding: `${spacing.md}px ${spacing.lg}px`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

export function buildStatCardStyle(
  colors: ModerationDashboardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['2xs'],
    padding: spacing.md,
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.cardBorder}`,
    borderRadius: radii.md,
    boxSizing: 'border-box',
  };
}

export function buildStatLabelStyle(
  colors: ModerationDashboardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  };
}

export function buildStatValueStyle(
  colors: ModerationDashboardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xl.fontSize,
    lineHeight: `${typography.sizes.xl.lineHeight}px`,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  };
}

export function buildStatChangeStyle(
  colors: ModerationDashboardColors,
  theme: WispTheme,
  positive: boolean,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.medium,
    color: positive ? colors.positiveChange : colors.negativeChange,
  };
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

export function buildTabBarStyle(
  colors: ModerationDashboardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    gap: spacing['2xs'],
    padding: `${spacing.sm}px ${spacing.lg}px`,
    borderBottom: `1px solid ${colors.divider}`,
    boxSizing: 'border-box',
  };
}

export function buildTabStyle(
  colors: ModerationDashboardColors,
  theme: WispTheme,
  active: boolean,
): CSSStyleObject {
  const { radii, spacing, typography } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    height: 30,
    padding: `0 ${spacing.md}px`,
    borderRadius: radii.md,
    backgroundColor: active ? colors.tabActiveBg : 'transparent',
    color: active ? colors.tabActiveText : colors.tabInactiveText,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: active ? typography.weights.semibold : typography.weights.regular,
    lineHeight: 1,
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    userSelect: 'none',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Action row
// ---------------------------------------------------------------------------

export function buildActionRowStyle(
  colors: ModerationDashboardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm}px ${spacing.lg}px`,
    borderBottom: `1px solid ${colors.divider}`,
    backgroundColor: colors.actionRowBg,
    cursor: 'pointer',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Type badge
// ---------------------------------------------------------------------------

export function buildTypeBadgeStyle(
  colors: ModerationDashboardColors,
  theme: WispTheme,
  type: 'warning' | 'timeout' | 'kick' | 'ban',
): CSSStyleObject {
  const { radii, spacing, typography } = theme;
  const bgMap = {
    warning: colors.warningBadgeBg,
    timeout: colors.timeoutBadgeBg,
    kick: colors.kickBadgeBg,
    ban: colors.banBadgeBg,
  };
  const textMap = {
    warning: colors.warningBadgeText,
    timeout: colors.timeoutBadgeText,
    kick: colors.kickBadgeText,
    ban: colors.banBadgeText,
  };
  return {
    display: 'inline-flex',
    alignItems: 'center',
    height: 20,
    padding: `0 ${spacing.xs}px`,
    borderRadius: radii.full,
    backgroundColor: bgMap[type],
    color: textMap[type],
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes['2xs'].fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    textTransform: 'capitalize',
  };
}

// ---------------------------------------------------------------------------
// Alert card
// ---------------------------------------------------------------------------

export function buildAlertCardStyle(
  colors: ModerationDashboardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    padding: spacing.md,
    margin: `${spacing.sm}px ${spacing.lg}px`,
    backgroundColor: colors.alertBg,
    border: `1px solid ${colors.alertBorder}`,
    borderRadius: radii.md,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Confidence badge
// ---------------------------------------------------------------------------

export function buildConfidenceBadgeStyle(
  colors: ModerationDashboardColors,
  theme: WispTheme,
  confidence: 'high' | 'medium' | 'low',
): CSSStyleObject {
  const { radii, spacing, typography } = theme;
  const bgMap = {
    high: colors.highConfBg,
    medium: colors.medConfBg,
    low: colors.lowConfBg,
  };
  const textMap = {
    high: colors.highConfText,
    medium: colors.medConfText,
    low: colors.lowConfText,
  };
  return {
    display: 'inline-flex',
    alignItems: 'center',
    height: 20,
    padding: `0 ${spacing.xs}px`,
    borderRadius: radii.full,
    backgroundColor: bgMap[confidence],
    color: textMap[confidence],
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes['2xs'].fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    textTransform: 'capitalize',
  };
}

// ---------------------------------------------------------------------------
// Action info
// ---------------------------------------------------------------------------

export function buildActionInfoStyle(
  colors: ModerationDashboardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['2xs'],
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  };
}

export function buildActionTextStyle(
  colors: ModerationDashboardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colors.textPrimary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

export function buildTimestampStyle(
  colors: ModerationDashboardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    color: colors.textMuted,
    flexShrink: 0,
  };
}
