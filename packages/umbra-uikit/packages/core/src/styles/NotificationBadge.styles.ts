/**
 * @module NotificationBadge
 */
import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { NotificationBadgeColor } from '../types/NotificationBadge.types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Color → resolved colors
// ---------------------------------------------------------------------------

/**
 * Resolved color tokens for a notification badge instance.
 */
export interface NotificationBadgeColorSet {
  /** Badge background color. */
  bg: string;
  /** Badge text / foreground color. */
  text: string;
}

/**
 * Maps a {@link NotificationBadgeColor} to its theme-aware colors.
 *
 * @param color - The semantic color variant.
 * @param themeColors - Current theme color tokens.
 * @returns Resolved color set for the given variant.
 */
export function resolveNotificationBadgeColors(
  color: NotificationBadgeColor,
  theme: WispTheme,
): NotificationBadgeColorSet {
  const { colors: themeColors } = theme;
  // Badge text on saturated status backgrounds must always be white for
  // readability, regardless of theme mode.  `text.inverse` flips with the
  // theme (dark in dark-mode) which makes the count invisible on red/green/blue.
  const WHITE = '#FFFFFF';
  switch (color) {
    case 'danger':
      return { bg: themeColors.status.danger, text: WHITE };
    case 'warning':
      return { bg: themeColors.status.warning, text: themeColors.text.primary };
    case 'success':
      return { bg: themeColors.status.success, text: WHITE };
    case 'info':
      return { bg: themeColors.status.info, text: WHITE };
    case 'default':
      return { bg: themeColors.accent.primary, text: WHITE };
    default:
      return resolveNotificationBadgeColors('danger', theme);
  }
}

// ---------------------------------------------------------------------------
// Wrapper style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the notification badge wrapper div.
 * Provides the positioning context for the absolute badge overlay.
 */
export function buildNotificationBadgeWrapperStyle(): CSSStyleObject {
  return {
    position: 'relative',
    display: 'inline-flex',
  };
}

// ---------------------------------------------------------------------------
// Badge style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the badge element itself.
 *
 * @param colors - Resolved color tokens from {@link resolveNotificationBadgeColors}.
 * @param dot - Whether to render as a small dot (no text).
 * @param invisible - Whether the badge should be hidden.
 * @param pulse - Whether to apply the pulse animation.
 * @returns A `CSSStyleObject` object ready to spread onto a `<span>`.
 */
export function buildNotificationBadgeStyle(
  colors: NotificationBadgeColorSet,
  dot: boolean,
  invisible: boolean,
  pulse: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, spacing, typography } = theme;
  if (invisible) {
    return { display: 'none' };
  }

  const base: CSSStyleObject = {
    position: 'absolute',
    top: 0,
    right: 0,
    transform: 'translate(50%, -50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    backgroundColor: colors.bg,
    color: colors.text,
    borderRadius: radii.full,
    fontFamily: fontFamilyStacks.sans,
    fontWeight: typography.weights.semibold,
    lineHeight: 1,
    userSelect: 'none',
    pointerEvents: 'none',
    zIndex: 1,
  };

  if (dot) {
    return {
      ...base,
      width: 8,
      height: 8,
      minWidth: 8,
      padding: 0,
      animation: pulse ? 'wisp-notification-badge-pulse 1.5s ease-in-out infinite' : undefined,
    };
  }

  return {
    ...base,
    minWidth: 20,
    height: 20,
    padding: `0 ${spacing.sm}px`,
    fontSize: typography.sizes.xs.fontSize,
    animation: pulse ? 'wisp-notification-badge-pulse 1.5s ease-in-out infinite' : undefined,
  };
}

// ---------------------------------------------------------------------------
// Keyframe injection
// ---------------------------------------------------------------------------

let keyframesInjected = false;

/**
 * Injects the `wisp-notification-badge-pulse` keyframe animation into the
 * document head. No-ops if already injected or running in SSR.
 */
export function ensureNotificationBadgeKeyframes(): void {
  if (keyframesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `@keyframes wisp-notification-badge-pulse { 0%, 100% { transform: translate(50%, -50%) scale(1); opacity: 1; } 50% { transform: translate(50%, -50%) scale(1.15); opacity: 0.7; } }`;
  document.head.appendChild(style);
  keyframesInjected = true;
}
