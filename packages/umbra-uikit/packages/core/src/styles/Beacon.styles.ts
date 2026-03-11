/**
 * @module primitives/beacon
 * @description Style builders for the Wisp Beacon primitive.
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { BeaconVariant, BeaconSizeConfig } from '../types/Beacon.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Colour resolution
// ---------------------------------------------------------------------------

/** Resolved colour for a beacon variant. */
export interface BeaconColors {
  /** Primary accent colour (icon, pulse ring). */
  accent: string;
  /** Tinted background colour (accent at ~12% opacity). */
  bg: string;
}

/**
 * Resolves the accent colour for a beacon variant.
 *
 * @param variant - Beacon colour variant.
 * @param themeColors - Current theme colour tokens.
 * @returns Resolved accent hex string.
 */
export function resolveBeaconColor(
  variant: BeaconVariant,
  theme: WispTheme,
): string {
  const { colors: themeColors } = theme;
  switch (variant) {
    case 'info':
      return themeColors.status.info;
    case 'success':
      return themeColors.status.success;
    case 'warning':
      return themeColors.status.warning;
    case 'default':
    default:
      return themeColors.text.secondary;
  }
}

// ---------------------------------------------------------------------------
// Button style
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the circular beacon button.
 *
 * @param sizeConfig - Resolved size config.
 * @param accentColor - The resolved accent colour.
 * @param themeColors - Current theme colour tokens.
 * @returns A {@link CSSStyleObject} for the button element.
 */
export function buildBeaconButtonStyle(
  sizeConfig: BeaconSizeConfig,
  accentColor: string,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeConfig.buttonSize,
    height: sizeConfig.buttonSize,
    borderRadius: radii[sizeConfig.borderRadius],
    border: `1.5px solid ${accentColor}33`,
    padding: 0,
    margin: 0,
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: accentColor,
    outline: 'none',
    flexShrink: 0,
    position: 'relative',
    transition: `box-shadow ${durations.normal}ms ${easings.easeOut.css}, background-color ${durations.normal}ms ${easings.easeOut.css}`,
  };
}

/**
 * Builds the pulsing animation style applied to the beacon button.
 *
 * @param accentColor - The resolved accent colour for the pulse ring.
 * @returns A {@link CSSStyleObject} with the animation property.
 */
export function buildBeaconPulseStyle(accentColor: string): CSSStyleObject {
  return {
    animation: `wisp-beacon-pulse 2s ease-in-out infinite`,
    // The keyframe references this colour via a CSS custom property
    // but since we use inline styles, the box-shadow colour is baked
    // into the keyframe at injection time. We set a base shadow here
    // so the non-animated state also has the glow.
    boxShadow: `0 0 0 0 ${accentColor}66`,
  };
}
