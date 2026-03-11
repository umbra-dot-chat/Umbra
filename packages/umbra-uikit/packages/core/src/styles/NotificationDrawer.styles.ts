/**
 * @module NotificationDrawer
 * @description Style utilities for the NotificationDrawer component.
 */

import type { WispTheme } from '../theme/types';

export interface NotificationDrawerColors {
  bg: string;
  headerText: string;
  headerIcon: string;
  tabActiveBg: string;
  tabActiveText: string;
  tabInactiveText: string;
  tabBorder: string;
  badgeBg: string;
  badgeText: string;
  emptyText: string;
  border: string;
}

/**
 * Resolve colors for a NotificationDrawer.
 */
export function resolveNotificationDrawerColors(
  theme: WispTheme,
): NotificationDrawerColors {
  return {
    bg: theme.colors.background.raised ?? theme.colors.background.canvas,
    headerText: theme.colors.text.primary,
    headerIcon: theme.colors.text.secondary,
    tabActiveBg: theme.colors.accent.primary,
    tabActiveText: theme.colors.text.inverse ?? '#fff',
    tabInactiveText: theme.colors.text.secondary,
    tabBorder: theme.colors.border.subtle,
    badgeBg: theme.colors.status.danger,
    badgeText: '#fff',
    emptyText: theme.colors.text.muted,
    border: theme.colors.border.subtle,
  };
}
