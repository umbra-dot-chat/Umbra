/**
 * @module NotificationGroup
 * @description Style utilities for the NotificationGroup component.
 */

import type { WispTheme } from '../theme/types';

export interface NotificationGroupColors {
  labelText: string;
  separator: string;
  countBg: string;
  countText: string;
}

/**
 * Resolve colors for a NotificationGroup.
 */
export function resolveNotificationGroupColors(
  theme: WispTheme,
): NotificationGroupColors {
  return {
    labelText: theme.colors.text.muted,
    separator: theme.colors.border.subtle,
    countBg: theme.colors.background.surface ?? theme.colors.background.canvas,
    countText: theme.colors.text.secondary,
  };
}
