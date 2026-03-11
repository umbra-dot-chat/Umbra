/**
 * @module styles/MessageActionBar
 * @description Pure style-builder functions for the MessageActionBar component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface MessageActionBarColors {
  bg: string;
  border: string;
  icon: string;
  iconHover: string;
  iconDestructive: string;
  shadow: string;
}

export function resolveMessageActionBarColors(
  theme: WispTheme,
): MessageActionBarColors {
  const { colors } = theme;
  return {
    bg: colors.background.canvas,
    border: colors.border.subtle,
    icon: colors.text.muted,
    iconHover: colors.text.primary,
    iconDestructive: colors.status.danger,
    shadow: theme.mode === 'light'
      ? 'rgba(0, 0, 0, 0.08)'
      : 'rgba(0, 0, 0, 0.3)',
  };
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildMessageActionBarContainerStyle(
  colors: MessageActionBarColors,
  position: 'top-left' | 'top-right',
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 1,
    padding: 2,
    borderRadius: radii.md,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bg,
    boxShadow: `0 2px 8px ${colors.shadow}`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Action button
// ---------------------------------------------------------------------------

export function buildMessageActionButtonStyle(
  colors: MessageActionBarColors,
  destructive: boolean,
  disabled: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    border: 'none',
    backgroundColor: 'transparent',
    color: destructive ? colors.iconDestructive : colors.icon,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    padding: 0,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, color ${durations.fast}ms ${easings.easeOut.css}`,
    outline: 'none',
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Separator
// ---------------------------------------------------------------------------

export function buildMessageActionSeparatorStyle(
  colors: MessageActionBarColors,
): CSSStyleObject {
  return {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
    flexShrink: 0,
    margin: '0 2px',
  };
}
