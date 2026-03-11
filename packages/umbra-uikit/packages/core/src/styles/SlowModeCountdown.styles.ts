/**
 * @module SlowModeCountdown
 * @description Style builders for the SlowModeCountdown component.
 */
import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Size map
// ---------------------------------------------------------------------------

export interface SlowModeCountdownSizeConfig {
  fontSize: number;
  iconSize: number;
  gap: number;
  circleSize: number;
  strokeWidth: number;
}

export const slowModeSizeMap: Record<'sm' | 'md' | 'lg', SlowModeCountdownSizeConfig> = {
  sm: { fontSize: 12, iconSize: 12, gap: 4, circleSize: 28, strokeWidth: 2 },
  md: { fontSize: 14, iconSize: 14, gap: 6, circleSize: 36, strokeWidth: 3 },
  lg: { fontSize: 16, iconSize: 16, gap: 8, circleSize: 48, strokeWidth: 3 },
};

// ---------------------------------------------------------------------------
// Inline container
// ---------------------------------------------------------------------------

export function buildSlowModeInlineStyle(
  size: 'sm' | 'md' | 'lg',
  theme: WispTheme,
): CSSStyleObject {
  const cfg = slowModeSizeMap[size];
  const { colors: tc } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: cfg.gap,
    fontSize: cfg.fontSize,
    fontFamily: fontFamilyStacks.sans,
    color: tc.text.muted,
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Circular container
// ---------------------------------------------------------------------------

export function buildSlowModeCircularContainerStyle(
  size: 'sm' | 'md' | 'lg',
): CSSStyleObject {
  const cfg = slowModeSizeMap[size];
  return {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: cfg.circleSize,
    height: cfg.circleSize,
  };
}

// ---------------------------------------------------------------------------
// Circular text overlay
// ---------------------------------------------------------------------------

export function buildSlowModeCircularTextStyle(
  size: 'sm' | 'md' | 'lg',
  theme: WispTheme,
): CSSStyleObject {
  const cfg = slowModeSizeMap[size];
  const { colors: tc } = theme;
  return {
    position: 'absolute',
    fontSize: cfg.fontSize - 2,
    fontWeight: 600,
    fontFamily: fontFamilyStacks.sans,
    color: tc.text.secondary,
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// SVG ring colors
// ---------------------------------------------------------------------------

export function resolveSlowModeRingColors(
  theme: WispTheme,
): { track: string; fill: string } {
  const { colors: tc } = theme;
  return {
    track: tc.border.subtle,
    fill: tc.text.muted,
  };
}
