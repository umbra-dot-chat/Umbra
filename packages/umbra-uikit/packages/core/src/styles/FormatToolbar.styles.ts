/**
 * @module styles/FormatToolbar
 * @description Pure style-builder functions for the FormatToolbar component.
 *
 * Container and separator styles are provided by the Toolbar layout primitive.
 * This module only provides color resolution and button styles specific to FormatToolbar.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { durations, easings } from '../tokens/motion';
import { withAlpha } from '../tokens/color-utils';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface FormatToolbarColors {
  bg: string;
  border: string;
  buttonBg: string;
  buttonBgHover: string;
  buttonBgActive: string;
  buttonText: string;
  buttonTextActive: string;
  buttonTextDisabled: string;
  separatorColor: string;
}

export function resolveFormatToolbarColors(
  theme: WispTheme,
): FormatToolbarColors {
  const { colors } = theme;
  return {
    // Toolbar sits on background.surface which is always dark — use onRaised text
    bg: colors.background.surface,
    border: colors.accent.dividerRaised,
    buttonBg: 'transparent',
    buttonBgHover: withAlpha(colors.text.onRaised, 0.08),
    buttonBgActive: withAlpha(colors.text.onRaised, 0.14),
    buttonText: colors.text.onRaisedSecondary,
    buttonTextActive: colors.text.onRaised,
    buttonTextDisabled: withAlpha(colors.text.onRaisedSecondary, 0.4),
    separatorColor: colors.accent.dividerRaised,
  };
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

interface ButtonSizeConfig {
  size: number;
  iconSize: number;
}

const buttonSizeConfigs: Record<'sm' | 'md', ButtonSizeConfig> = {
  sm: { size: 26, iconSize: 14 },
  md: { size: 30, iconSize: 16 },
};

export function buildFormatButtonStyle(
  colors: FormatToolbarColors,
  active: boolean,
  disabled: boolean,
  size: 'sm' | 'md',
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  const cfg = buttonSizeConfigs[size];
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: cfg.size,
    height: cfg.size,
    borderRadius: radii.sm,
    border: 'none',
    backgroundColor: active ? colors.buttonBgActive : colors.buttonBg,
    color: disabled
      ? colors.buttonTextDisabled
      : active
        ? colors.buttonTextActive
        : colors.buttonText,
    cursor: disabled ? 'not-allowed' : 'pointer',
    padding: 0,
    transition: `all ${durations.fast}ms ${easings.easeOut.css}`,
    opacity: disabled ? 0.5 : 1,
    flexShrink: 0,
  };
}

export function getFormatButtonIconSize(size: 'sm' | 'md'): number {
  return buttonSizeConfigs[size].iconSize;
}
