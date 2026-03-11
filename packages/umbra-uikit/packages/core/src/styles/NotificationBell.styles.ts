/**
 * @module NotificationBell
 * @description Style utilities for the NotificationBell component.
 */

import type { WispTheme } from '../theme/types';
import type { NotificationBellSize } from '../types/NotificationBell.types';
import { defaultRadii, defaultTypography } from '../theme/create-theme';
import { withAlpha } from '../tokens/color-utils';

export interface NotificationBellSizeConfig {
  /** Button tap target size. */
  buttonSize: number;
  /** Icon pixel size. */
  iconSize: number;
}

export const notificationBellSizeMap: Record<NotificationBellSize, NotificationBellSizeConfig> = {
  sm: { buttonSize: 32, iconSize: 18 },
  md: { buttonSize: 40, iconSize: 22 },
  lg: { buttonSize: 48, iconSize: 26 },
};

export interface NotificationBellColors {
  icon: string;
  iconActive: string;
  hoverBg: string;
  activeBg: string;
}

/**
 * Resolve colors for the NotificationBell.
 */
export function resolveNotificationBellColors(theme: WispTheme): NotificationBellColors {
  return {
    icon: theme.colors.text.secondary,
    iconActive: theme.colors.text.primary,
    hoverBg: withAlpha(theme.colors.text.primary, 0.08),
    activeBg: withAlpha(theme.colors.text.primary, 0.12),
  };
}

/**
 * Build the bell button container style.
 */
export function buildNotificationBellStyle(
  size: NotificationBellSize,
  active: boolean,
  colors: NotificationBellColors,
  theme: WispTheme,
): React.CSSProperties {
  const cfg = notificationBellSizeMap[size];
  return {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: cfg.buttonSize,
    height: cfg.buttonSize,
    borderRadius: defaultRadii.full,
    border: 'none',
    background: active ? colors.activeBg : 'transparent',
    cursor: 'pointer',
    padding: 0,
    color: active ? colors.iconActive : colors.icon,
    transition: 'background 150ms, color 150ms',
  };
}

/** Keyframe name for the bell shake animation. */
export const SHAKE_KEYFRAME_NAME = 'wisp-notification-bell-shake';

/** CSS keyframe for the subtle bell shake. */
let shakeInjected = false;
export function ensureNotificationBellKeyframes(): void {
  if (shakeInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `@keyframes ${SHAKE_KEYFRAME_NAME} {
  0%, 100% { transform: rotate(0deg); }
  10% { transform: rotate(12deg); }
  20% { transform: rotate(-10deg); }
  30% { transform: rotate(8deg); }
  40% { transform: rotate(-6deg); }
  50% { transform: rotate(4deg); }
  60% { transform: rotate(-2deg); }
  70% { transform: rotate(0deg); }
}`;
  document.head.appendChild(style);
  shakeInjected = true;
}
