/**
 * @module styles/AutoModSettings
 * @description Pure style-builder functions for the AutoModSettings component.
 *
 * A configuration panel for automated moderation rules.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { withAlpha } from '../tokens/color-utils';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface AutoModColors {
  bg: string;
  border: string;
  headerText: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  sectionBg: string;
  ruleBg: string;
  ruleHoverBg: string;
  inputBg: string;
  inputBorder: string;
  deleteText: string;
  deleteHoverBg: string;
  accentBg: string;
  accentText: string;
  divider: string;
  enabledBg: string;
  enabledText: string;
  disabledBg: string;
  disabledText: string;
}

export function resolveAutoModColors(theme: WispTheme): AutoModColors {
  const { colors } = theme;
  return {
    bg: colors.background.surface,
    border: colors.border.subtle,
    headerText: colors.text.primary,
    textPrimary: colors.text.primary,
    textSecondary: colors.text.secondary,
    textMuted: colors.text.muted,
    sectionBg: withAlpha(colors.text.primary, 0.02),
    ruleBg: 'transparent',
    ruleHoverBg: withAlpha(colors.text.primary, 0.04),
    inputBg: colors.background.sunken,
    inputBorder: colors.border.subtle,
    deleteText: colors.status.danger,
    deleteHoverBg: colors.status.dangerSurface,
    accentBg: colors.accent.primary,
    accentText: colors.text.inverse,
    divider: colors.border.subtle,
    enabledBg: colors.status.successSurface,
    enabledText: colors.status.success,
    disabledBg: withAlpha(colors.text.primary, 0.06),
    disabledText: colors.text.muted,
  };
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildContainerStyle(
  colors: AutoModColors,
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
  colors: AutoModColors,
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
// Section header
// ---------------------------------------------------------------------------

export function buildSectionHeaderStyle(
  colors: AutoModColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.sm}px ${spacing.lg}px`,
    backgroundColor: colors.sectionBg,
    borderBottom: `1px solid ${colors.divider}`,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Rule row
// ---------------------------------------------------------------------------

export function buildRuleRowStyle(
  colors: AutoModColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm}px ${spacing.lg}px`,
    borderBottom: `1px solid ${colors.divider}`,
    backgroundColor: colors.ruleBg,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    boxSizing: 'border-box',
    flexWrap: 'wrap',
  };
}

// ---------------------------------------------------------------------------
// Rule name
// ---------------------------------------------------------------------------

export function buildRuleNameStyle(
  colors: AutoModColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Select / input
// ---------------------------------------------------------------------------

export function buildSelectStyle(
  colors: AutoModColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, spacing, typography } = theme;
  return {
    height: 30,
    padding: `0 ${spacing.sm}px`,
    borderRadius: radii.md,
    border: `1px solid ${colors.inputBorder}`,
    backgroundColor: colors.inputBg,
    color: colors.textPrimary,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: 1,
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
  };
}

export function buildInputStyle(
  colors: AutoModColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, spacing, typography } = theme;
  return {
    height: 30,
    padding: `0 ${spacing.sm}px`,
    borderRadius: radii.md,
    border: `1px solid ${colors.inputBorder}`,
    backgroundColor: colors.inputBg,
    color: colors.textPrimary,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: 1,
    outline: 'none',
    boxSizing: 'border-box',
    flex: 1,
    minWidth: 80,
  };
}

// ---------------------------------------------------------------------------
// Enabled badge
// ---------------------------------------------------------------------------

export function buildEnabledBadgeStyle(
  colors: AutoModColors,
  theme: WispTheme,
  enabled: boolean,
): CSSStyleObject {
  const { radii, spacing, typography } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    height: 20,
    padding: `0 ${spacing.xs}px`,
    borderRadius: radii.full,
    backgroundColor: enabled ? colors.enabledBg : colors.disabledBg,
    color: enabled ? colors.enabledText : colors.disabledText,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes['2xs'].fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Escalation row
// ---------------------------------------------------------------------------

export function buildEscalationRowStyle(
  colors: AutoModColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm}px ${spacing.lg}px`,
    borderBottom: `1px solid ${colors.divider}`,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    color: colors.textPrimary,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Label text
// ---------------------------------------------------------------------------

export function buildLabelStyle(
  colors: AutoModColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };
}
