/**
 * @module PingMeter
 */
import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { PingMeterSizeConfig } from '../types/PingMeter.types';

// ---------------------------------------------------------------------------
// Latency → color mapping
// ---------------------------------------------------------------------------

/**
 * Returns a hex color string based on the given latency value.
 *
 * @param latency - Network latency in milliseconds.
 * @returns A color representing connection quality:
 *   - `#22c55e` (green) for < 50ms
 *   - `#eab308` (yellow) for 50-100ms
 *   - `#f97316` (orange) for 100-200ms
 *   - `#ef4444` (red) for > 200ms
 */
export function getLatencyColor(latency: number, theme: WispTheme): string {
  const { colors: themeColors } = theme;
  if (latency < 50) return themeColors.status.success;
  if (latency < 100) return themeColors.status.warning;
  if (latency < 200) return themeColors.status.warning;
  return themeColors.status.danger;
}

// ---------------------------------------------------------------------------
// Keyframe injection -- inject once per document
// ---------------------------------------------------------------------------

let pingPulseInjected = false;

/**
 * Inject the ping pulse CSS `@keyframes` into the document `<head>` once.
 *
 * @remarks
 * Subsequent calls are no-ops. Safe to call in SSR environments where
 * `document` is undefined -- the function simply returns early.
 */
export function ensurePingPulseKeyframes(): void {
  if (pingPulseInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent =
    '@keyframes wisp-ping-pulse { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }';
  document.head.appendChild(style);
  pingPulseInjected = true;
}

// ---------------------------------------------------------------------------
// Container style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the ping meter container.
 *
 * @param sizeConfig - Dimensional config for the chosen size.
 * @returns A `CSSStyleObject` object for the container `<div>`.
 */
export function buildPingMeterContainerStyle(
  sizeConfig: PingMeterSizeConfig,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: sizeConfig.gap,
  };
}

// ---------------------------------------------------------------------------
// Ping dot style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the solid ping dot indicator.
 *
 * @param sizeConfig - Dimensional config for the chosen size.
 * @param color - Background color based on latency quality.
 * @returns A `CSSStyleObject` object for the dot `<span>`.
 */
export function buildPingDotStyle(
  sizeConfig: PingMeterSizeConfig,
  color: string,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    width: sizeConfig.dotSize,
    height: sizeConfig.dotSize,
    borderRadius: radii.full,
    backgroundColor: color,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Ping dot pulse ring style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the expanding pulse ring behind the ping dot.
 *
 * @param sizeConfig - Dimensional config for the chosen size.
 * @param color - Background color based on latency quality.
 * @returns A `CSSStyleObject` object for the pulse ring `<span>`.
 */
export function buildPingDotPulseStyle(
  sizeConfig: PingMeterSizeConfig,
  color: string,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    width: sizeConfig.dotSize,
    height: sizeConfig.dotSize,
    borderRadius: radii.full,
    backgroundColor: color,
    animation: 'wisp-ping-pulse 1.5s ease-in-out infinite',
  };
}

// ---------------------------------------------------------------------------
// Signal bar style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for a single signal strength bar.
 *
 * @param sizeConfig - Dimensional config for the chosen size.
 * @param themeColors - Current theme color tokens.
 * @param barIndex - Zero-based index of this bar (0 = shortest).
 * @param totalBars - Total number of bars rendered.
 * @param isActive - Whether this bar should be filled with the active color.
 * @param color - Active color based on latency quality.
 * @returns A `CSSStyleObject` object for the bar `<span>`.
 */
export function buildPingBarStyle(
  sizeConfig: PingMeterSizeConfig,
  theme: WispTheme,
  barIndex: number,
  totalBars: number,
  isActive: boolean,
  color: string,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  const heightFraction = (barIndex + 1) / totalBars;
  return {
    width: sizeConfig.barWidth,
    height: Math.round(sizeConfig.barHeight * heightFraction),
    borderRadius: sizeConfig.barWidth / 2,
    backgroundColor: isActive ? color : themeColors.border.subtle,
    flexShrink: 0,
    alignSelf: 'flex-end',
  };
}

// ---------------------------------------------------------------------------
// Latency text style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the latency text display.
 *
 * @param sizeConfig - Dimensional config for the chosen size.
 * @param themeColors - Current theme color tokens.
 * @returns A `CSSStyleObject` object for the latency text `<span>`.
 */
export function buildPingLatencyStyle(
  sizeConfig: PingMeterSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    fontSize: sizeConfig.fontSize,
    fontFamily: fontFamilyStacks.mono,
    color: themeColors.text.secondary,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Skeleton style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the ping meter skeleton loading placeholder.
 *
 * @param sizeConfig - Dimensional config for the chosen size.
 * @param themeColors - Current theme color tokens.
 * @returns A `CSSStyleObject` object with a pulsing animation for the skeleton `<div>`.
 */
export function getPingMeterSkeletonStyle(
  sizeConfig: PingMeterSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    display: 'inline-block',
    height: sizeConfig.barHeight,
    width: 64,
    borderRadius: sizeConfig.barHeight / 2,
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
