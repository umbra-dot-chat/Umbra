/**
 * @module styles/NotificationSettingsPanel
 * @description Pure style-builder functions for the NotificationSettingsPanel component.
 *
 * Per-community/space/channel notification controls.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export interface NotificationSettingsPanelColors {
  bg: string;
  border: string;
  headerText: string;
  labelText: string;
  secondaryText: string;
  targetBg: string;
  targetBgHover: string;
  tabActiveBg: string;
  tabActiveText: string;
  tabInactiveText: string;
}

/**
 * Resolves semantic colors for the NotificationSettingsPanel from the current theme.
 */
export function resolveNotificationSettingsPanelColors(
  theme: WispTheme,
): NotificationSettingsPanelColors {
  const { colors } = theme;
  return {
    bg: colors.background.surface,
    border: colors.border.subtle,
    headerText: colors.text.primary,
    labelText: colors.text.secondary,
    secondaryText: colors.text.muted,
    targetBg: colors.background.sunken,
    targetBgHover: colors.accent.highlight,
    tabActiveBg: colors.accent.highlight,
    tabActiveText: colors.text.primary,
    tabInactiveText: colors.text.secondary,
  };
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the panel container.
 */
export function buildContainerStyle(
  theme: WispTheme,
  panelColors: NotificationSettingsPanelColors,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: panelColors.bg,
    border: `1px solid ${panelColors.border}`,
    borderRadius: radii.lg,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the header row.
 */
export function buildHeaderStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  };
}

/**
 * Builds inline styles for the header title.
 */
export function buildTitleStyle(
  theme: WispTheme,
  panelColors: NotificationSettingsPanelColors,
): CSSStyleObject {
  return {
    fontSize: theme.typography.sizes.lg.fontSize,
    lineHeight: `${theme.typography.sizes.lg.lineHeight}px`,
    fontWeight: theme.typography.weights.semibold,
    color: panelColors.headerText,
    margin: 0,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Tab bar
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the tab bar.
 */
export function buildTabBarStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    borderBottom: `1px solid ${theme.colors.border.subtle}`,
    paddingBottom: theme.spacing.sm,
  };
}

/**
 * Builds inline styles for a single tab button.
 */
export function buildTabStyle(
  theme: WispTheme,
  panelColors: NotificationSettingsPanelColors,
  isActive: boolean,
): CSSStyleObject {
  return {
    padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
    borderRadius: theme.radii.md,
    fontSize: theme.typography.sizes.sm.fontSize,
    lineHeight: `${theme.typography.sizes.sm.lineHeight}px`,
    fontWeight: isActive ? theme.typography.weights.semibold : theme.typography.weights.regular,
    color: isActive ? panelColors.tabActiveText : panelColors.tabInactiveText,
    backgroundColor: isActive ? panelColors.tabActiveBg : 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Target row
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for a single target settings row.
 */
export function buildTargetRowStyle(
  theme: WispTheme,
  panelColors: NotificationSettingsPanelColors,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: panelColors.targetBg,
    borderRadius: radii.md,
  };
}

/**
 * Builds inline styles for the target name row.
 */
export function buildTargetNameStyle(
  theme: WispTheme,
  panelColors: NotificationSettingsPanelColors,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    fontSize: theme.typography.sizes.sm.fontSize,
    lineHeight: `${theme.typography.sizes.sm.lineHeight}px`,
    fontWeight: theme.typography.weights.medium,
    color: panelColors.headerText,
    fontFamily: fontFamilyStacks.sans,
  };
}

/**
 * Builds inline styles for the setting controls row.
 */
export function buildControlsRowStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  };
}

/**
 * Builds inline styles for individual control groups.
 */
export function buildControlGroupStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  };
}

/**
 * Builds inline styles for control labels.
 */
export function buildControlLabelStyle(
  theme: WispTheme,
  panelColors: NotificationSettingsPanelColors,
): CSSStyleObject {
  return {
    fontSize: theme.typography.sizes.xs.fontSize,
    lineHeight: `${theme.typography.sizes.xs.lineHeight}px`,
    fontWeight: theme.typography.weights.regular,
    color: panelColors.labelText,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Target list
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the scrollable target list.
 */
export function buildTargetListStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
    maxHeight: 400,
    overflowY: 'auto',
  };
}
