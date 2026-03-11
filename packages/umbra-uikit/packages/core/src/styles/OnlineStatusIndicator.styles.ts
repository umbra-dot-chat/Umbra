/**
 * @module OnlineStatusIndicator
 */
import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import type { OnlineStatus, OnlineStatusIndicatorSizeConfig } from '../types/OnlineStatusIndicator.types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Status -> color
// ---------------------------------------------------------------------------

/**
 * Resolves the dot color for a given online status.
 */
export function resolveOnlineStatusColor(
  status: OnlineStatus,
  theme: WispTheme,
): string {
  const { colors: c } = theme;
  switch (status) {
    case 'online':
      return c.status.success;
    case 'idle':
      return c.status.warning;
    case 'dnd':
      return c.status.danger;
    case 'offline':
    case 'invisible':
      return c.text.muted;
    default:
      return c.text.muted;
  }
}

// ---------------------------------------------------------------------------
// Status -> label text
// ---------------------------------------------------------------------------

/** Returns the human-readable label for a status. */
export function resolveOnlineStatusLabel(status: OnlineStatus): string {
  switch (status) {
    case 'online':
      return 'Online';
    case 'idle':
      return 'Idle';
    case 'dnd':
      return 'Do Not Disturb';
    case 'offline':
      return 'Offline';
    case 'invisible':
      return 'Invisible';
    default:
      return 'Unknown';
  }
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildOnlineStatusContainerStyle(
  sizeConfig: OnlineStatusIndicatorSizeConfig,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: sizeConfig.gap,
    lineHeight: 1,
  };
}

// ---------------------------------------------------------------------------
// Dot
// ---------------------------------------------------------------------------

export function buildOnlineStatusDotStyle(
  sizeConfig: OnlineStatusIndicatorSizeConfig,
  color: string,
  pulse: boolean,
  theme: WispTheme,
): CSSStyleObject {
  return {
    width: sizeConfig.dotSize,
    height: sizeConfig.dotSize,
    borderRadius: theme.radii.full,
    backgroundColor: color,
    flexShrink: 0,
    animation: pulse ? 'wisp-online-pulse 1.5s ease-in-out infinite' : undefined,
  };
}

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

export function buildOnlineStatusLabelStyle(
  sizeConfig: OnlineStatusIndicatorSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  return {
    fontSize: sizeConfig.fontSize,
    fontFamily: fontFamilyStacks.sans,
    color: theme.colors.text.secondary,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Keyframes injection
// ---------------------------------------------------------------------------

let keyframesInjected = false;

export function ensureOnlineStatusKeyframes(): void {
  if (keyframesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `@keyframes wisp-online-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.3); } }`;
  document.head.appendChild(style);
  keyframesInjected = true;
}
