/**
 * @module styles/UserPicker
 * @description Pure style-builder functions for the UserPicker component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface UserPickerColors {
  bg: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  rowBg: string;
  rowBgHover: string;
  selectedBg: string;
  selectedCheck: string;
  selectedCheckText: string;
  uncheckedBorder: string;
  searchBg: string;
  searchBorder: string;
  searchText: string;
  searchPlaceholder: string;
  emptyText: string;
  countBg: string;
  countText: string;
  statusOnline: string;
  statusIdle: string;
  statusDnd: string;
  statusOffline: string;
}

export function resolveUserPickerColors(
  theme: WispTheme,
): UserPickerColors {
  const { colors: themeColors } = theme;
  return {
    bg: 'transparent',
    border: themeColors.border.subtle,
    text: themeColors.text.primary,
    textSecondary: themeColors.text.secondary,
    textMuted: themeColors.text.muted,
    rowBg: 'transparent',
    rowBgHover: themeColors.background.raised,
    selectedBg: themeColors.accent.primary + '15',
    selectedCheck: themeColors.accent.primary,
    selectedCheckText: themeColors.text.inverse,
    uncheckedBorder: themeColors.border.strong,
    searchBg: 'transparent',
    searchBorder: themeColors.border.strong,
    searchText: themeColors.text.primary,
    searchPlaceholder: themeColors.text.muted,
    emptyText: themeColors.text.muted,
    countBg: themeColors.background.sunken,
    countText: themeColors.text.secondary,
    statusOnline: themeColors.status.success,
    statusIdle: themeColors.status.warning,
    statusDnd: themeColors.status.danger,
    statusOffline: themeColors.text.muted,
  };
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildUserPickerContainerStyle(
  colors: UserPickerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'solid',
    backgroundColor: colors.bg,
    overflow: 'hidden',
    width: '100%',
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Search input
// ---------------------------------------------------------------------------

export function buildUserPickerSearchStyle(
  colors: UserPickerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    color: colors.searchText,
    backgroundColor: colors.searchBg,
    border: 'none',
    outline: 'none',
    padding: `${spacing.sm}px ${spacing.md}px`,
    width: '100%',
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

export function buildUserPickerRowStyle(
  colors: UserPickerColors,
  isSelected: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: isSelected ? colors.selectedBg : colors.rowBg,
    cursor: 'pointer',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: 'solid',
  };
}

// ---------------------------------------------------------------------------
// Row text
// ---------------------------------------------------------------------------

export function buildUserPickerNameStyle(
  colors: UserPickerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  };
}

export function buildUserPickerUsernameStyle(
  colors: UserPickerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colors.textMuted,
  };
}

// ---------------------------------------------------------------------------
// Checkbox
// ---------------------------------------------------------------------------

export function buildUserPickerCheckboxStyle(
  colors: UserPickerColors,
  isChecked: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    borderRadius: radii.sm,
    backgroundColor: isChecked ? colors.selectedCheck : 'transparent',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: isChecked ? colors.selectedCheck : colors.uncheckedBorder,
    flexShrink: 0,
    transition: `all ${durations.fast}ms ${easings.easeOut.css}`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function buildUserPickerEmptyStyle(
  colors: UserPickerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    color: colors.emptyText,
    padding: `${spacing.lg}px ${spacing.md}px`,
    textAlign: 'center',
  };
}

// ---------------------------------------------------------------------------
// Count badge
// ---------------------------------------------------------------------------

export function buildUserPickerCountStyle(
  colors: UserPickerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.medium,
    color: colors.countText,
    backgroundColor: colors.countBg,
    padding: `${spacing.xs}px ${spacing.sm}px`,
    textAlign: 'center',
  };
}
