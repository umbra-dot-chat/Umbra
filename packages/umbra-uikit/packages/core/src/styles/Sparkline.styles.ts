/**
 * @module styles/Sparkline
 * @description Pure style-builder functions for the Sparkline primitive.
 *
 * All functions are framework-agnostic — they accept resolved theme colors
 * and dimensional config, returning plain `CSSStyleObject` records.
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { SparklineColor, SparklineSizeConfig } from '../types/Sparkline.types';

// ---------------------------------------------------------------------------
// Keyframe injection (singleton)
// ---------------------------------------------------------------------------

let sparklineDrawInjected = false;

/**
 * Injects the stroke-dashoffset draw animation keyframe once per document.
 * Safe to call on every render — subsequent calls are no-ops.
 */
export function ensureSparklineKeyframes(): void {
  if (sparklineDrawInjected || typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = [
    '@keyframes wisp-sparkline-draw { from { stroke-dashoffset: var(--wisp-sparkline-length); } to { stroke-dashoffset: 0; } }',
    '@keyframes wisp-sparkline-bar-rise { from { transform: scaleY(0); } to { transform: scaleY(1); } }',
  ].join('\n');
  document.head.appendChild(style);
  sparklineDrawInjected = true;
}

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface SparklineColors {
  /** Primary stroke / fill color. */
  stroke: string;
  /** Skeleton placeholder background. */
  skeletonBg: string;
}

/**
 * Resolves the Sparkline accent color from a semantic name to a concrete hex.
 */
export function resolveSparklineColor(
  color: SparklineColor,
  theme: WispTheme,
): string {
  const { colors: themeColors } = theme;
  switch (color) {
    case 'success': return themeColors.status.success;
    case 'warning': return themeColors.status.warning;
    case 'danger':  return themeColors.status.danger;
    case 'info':    return themeColors.status.info;
    case 'default':
    default:        return themeColors.accent.primary;
  }
}

/**
 * Resolves all Sparkline colors from the theme.
 */
export function resolveSparklineColors(
  color: SparklineColor,
  theme: WispTheme,
): SparklineColors {
  const { colors: themeColors } = theme;
  return {
    stroke: resolveSparklineColor(color, theme),
    skeletonBg: themeColors.border.subtle,
  };
}

// ---------------------------------------------------------------------------
// Style builders
// ---------------------------------------------------------------------------

/**
 * Builds the outer wrapper div style.
 */
export function buildSparklineWrapperStyle(
  sizeConfig: SparklineSizeConfig,
  responsive: boolean,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: responsive ? '100%' : sizeConfig.width,
    height: sizeConfig.height,
    flexShrink: 0,
    overflow: 'visible',
  };
}

/**
 * Builds the SVG element style.
 */
export function buildSparklineSvgStyle(
  sizeConfig: SparklineSizeConfig,
  responsive: boolean,
): CSSStyleObject {
  return {
    display: 'block',
    width: responsive ? '100%' : sizeConfig.width,
    height: sizeConfig.height,
    overflow: 'visible',
  };
}

/**
 * Returns the skeleton placeholder style.
 */
export function buildSparklineSkeletonStyle(
  sizeConfig: SparklineSizeConfig,
  responsive: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'inline-block',
    width: responsive ? '100%' : sizeConfig.width,
    height: sizeConfig.height,
    borderRadius: radii.sm,
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
