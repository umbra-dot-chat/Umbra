/**
 * @module CallNotification
 * @description Style utilities for the CallNotification component.
 */

import type { WispTheme } from '../theme/types';
import type { CallNotificationVariant } from '../types/CallNotification.types';

/**
 * Resolve the accent color for a notification variant.
 */
export function resolveNotificationColor(
  variant: CallNotificationVariant,
  theme: WispTheme,
): string {
  switch (variant) {
    case 'incoming':
      return theme.colors.status.success;
    case 'outgoing':
      return theme.colors.accent.primary;
    case 'missed':
      return theme.colors.status.danger;
  }
}

/**
 * Resolve the subtitle text for a notification variant.
 */
export function resolveNotificationSubtitle(
  variant: CallNotificationVariant,
  callType: 'voice' | 'video',
  duration?: string,
): string {
  const typeLabel = callType === 'video' ? 'Video' : 'Voice';
  switch (variant) {
    case 'incoming':
      return `Incoming ${typeLabel} Call`;
    case 'outgoing':
      return duration ? `${typeLabel} Call \u00B7 ${duration}` : `Calling\u2026`;
    case 'missed':
      return `Missed ${typeLabel} Call`;
  }
}
