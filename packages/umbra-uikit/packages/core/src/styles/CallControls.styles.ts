/**
 * @module styles/CallControls
 * @description Pure style-builder functions for the CallControls component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { withAlpha } from '../tokens/color-utils';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface CallControlsColors {
  bg: string;
  buttonBg: string;
  buttonBgActive: string;
  buttonBgDanger: string;
  buttonBgDangerHover: string;
  buttonIcon: string;
  buttonIconActive: string;
  buttonIconDanger: string;
  buttonHoverBg: string;
  labelText: string;
  border: string;
  /** Icon color for the end-call button. */
  endCallIcon: string;
  /** Text color for the end-call label. */
  endCallText: string;
}

export function resolveCallControlsColors(
  theme: WispTheme,
): CallControlsColors {
  const { colors } = theme;
  return {
    bg: 'transparent',
    buttonBg: withAlpha(colors.text.primary, 0.1),
    buttonBgActive: colors.text.primary,
    buttonBgDanger: colors.status.danger,
    buttonBgDangerHover: withAlpha(colors.status.danger, 0.85),
    buttonIcon: colors.text.primary,
    buttonIconActive: colors.text.inverse,
    buttonIconDanger: '#FFFFFF',
    buttonHoverBg: withAlpha(colors.text.primary, 0.15),
    labelText: colors.text.secondary,
    border: colors.border.subtle,
    endCallIcon: '#FFFFFF',
    endCallText: colors.status.danger,
  };
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildCallControlsContainerStyle(
  colors: CallControlsColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: `${spacing.sm}px ${spacing.md}px`,
    backgroundColor: colors.bg,
    borderTop: `1px solid ${colors.border}`,
    boxSizing: 'border-box',
    width: '100%',
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Control button
// ---------------------------------------------------------------------------

export function buildCallControlButtonStyle(
  colors: CallControlsColors,
  theme: WispTheme,
  variant: 'default' | 'active' | 'danger',
): CSSStyleObject {
  const { radii } = theme;

  let bgColor: string;
  let iconColor: string;
  switch (variant) {
    case 'active':
      bgColor = colors.buttonBgActive;
      iconColor = colors.buttonIconActive;
      break;
    case 'danger':
      bgColor = colors.buttonBgDanger;
      iconColor = colors.buttonIconDanger;
      break;
    case 'default':
    default:
      bgColor = colors.buttonBg;
      iconColor = colors.buttonIcon;
      break;
  }

  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: radii.full,
    border: 'none',
    backgroundColor: bgColor,
    color: iconColor,
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    transition: 'background-color 150ms ease-out, color 150ms ease-out',
  };
}

// ---------------------------------------------------------------------------
// Button wrapper (button + label)
// ---------------------------------------------------------------------------

export function buildCallControlItemStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.xs,
  };
}

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

export function buildCallControlLabelStyle(
  colors: CallControlsColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.medium,
    color: colors.labelText,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    margin: 0,
  };
}
