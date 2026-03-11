/**
 * @module NotificationItem
 * @description Style utilities for the NotificationItem component.
 */

import type { WispTheme } from '../theme/types';
import type { NotificationType } from '../types/NotificationItem.types';

export interface NotificationItemColors {
  bg: string;
  bgUnread: string;
  accent: string;
  text: string;
  textMuted: string;
  dismissIcon: string;
  avatarBg: string;
}

/**
 * Resolve the accent color for a notification type.
 */
export function resolveNotificationAccent(
  type: NotificationType,
  theme: WispTheme,
): string {
  switch (type) {
    case 'friend_request_received':
    case 'group_invite':
    case 'community_invite':
      return theme.colors.accent.primary;
    case 'friend_request_accepted':
      return theme.colors.status.success;
    case 'friend_request_rejected':
    case 'call_missed':
      return theme.colors.status.danger;
    case 'call_completed':
      return theme.colors.status.success;
    case 'mention':
      return theme.colors.status.warning;
    case 'system':
      return theme.colors.text.secondary;
  }
}

/**
 * Resolve all colors for a NotificationItem.
 */
export function resolveNotificationItemColors(
  type: NotificationType,
  read: boolean,
  theme: WispTheme,
): NotificationItemColors {
  const accent = resolveNotificationAccent(type, theme);
  return {
    bg: read ? 'transparent' : (theme.colors.background.surface ?? theme.colors.background.canvas),
    bgUnread: theme.colors.background.surface ?? theme.colors.background.canvas,
    accent,
    text: theme.colors.text.primary,
    textMuted: theme.colors.text.muted,
    dismissIcon: theme.colors.text.secondary,
    avatarBg: theme.colors.background.surface ?? theme.colors.background.canvas,
  };
}
