import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { MeterSizeConfig, MeterVariant } from '../types/Meter.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Segment color resolution
// ---------------------------------------------------------------------------

/**
 * Resolves the semantic segment colour based on the current value's
 * position relative to the `low`, `high`, and `optimum` thresholds.
 *
 * @remarks
 * Follows the HTML `<meter>` element semantics:
 * - If the value is in the "good" region (same side as optimum), green.
 * - If the value is in the "ok" region (between low/high but not near
 *   optimum), yellow.
 * - If the value is in the "bad" region (opposite side from optimum), red.
 *
 * @param percent - The current fill percentage (0--100).
 * @param low - The low threshold as a percentage.
 * @param high - The high threshold as a percentage.
 * @param optimum - The optimum value as a percentage.
 * @param themeColors - Current {@link ThemeColors} from the active theme.
 * @returns A CSS colour string.
 */
export function resolveSegmentColor(
  percent: number,
  low: number,
  high: number,
  optimum: number,
  theme: WispTheme,
): string {
  const { colors: themeColors } = theme;
  const green = themeColors.status.success;
  const yellow = themeColors.status.warning;
  const red = themeColors.status.danger;

  // Optimum is in the "good" (low) region
  if (optimum <= low) {
    if (percent <= low) return green;
    if (percent <= high) return yellow;
    return red;
  }

  // Optimum is in the "good" (high) region
  if (optimum >= high) {
    if (percent >= high) return green;
    if (percent >= low) return yellow;
    return red;
  }

  // Optimum is between low and high (the middle region is "good")
  if (percent >= low && percent <= high) return green;
  if (percent < low) return yellow;
  return yellow;
}

// ---------------------------------------------------------------------------
// Container style -- flex column wrapper
// ---------------------------------------------------------------------------

/**
 * Builds the style for the outer meter container.
 *
 * @param sizeConfig - Resolved {@link MeterSizeConfig} for the current size.
 * @returns A `CSSStyleObject` object for the container.
 */
export function buildMeterContainerStyle(
  sizeConfig: MeterSizeConfig,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: sizeConfig.gap,
    width: '100%',
  };
}

// ---------------------------------------------------------------------------
// Track style -- the background bar (full width, rounded)
// ---------------------------------------------------------------------------

/**
 * Builds the style for the background track bar.
 *
 * @param sizeConfig - Resolved {@link MeterSizeConfig} for the current size.
 * @param themeColors - Current {@link ThemeColors} for colour resolution.
 * @returns A `CSSStyleObject` object for the track container.
 */
export function buildMeterTrackStyle(
  sizeConfig: MeterSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    position: 'relative',
    width: '100%',
    height: sizeConfig.height,
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: themeColors.border.subtle,
    overflow: 'hidden',
  };
}

// ---------------------------------------------------------------------------
// Fill style -- the filled portion
// ---------------------------------------------------------------------------

/**
 * Builds the style for the meter fill bar.
 *
 * @remarks
 * The fill appearance varies by variant:
 * - `'default'` -- Solid accent primary colour.
 * - `'gradient'` -- Linear gradient from accent secondary to accent primary.
 * - `'segments'` -- Semantic colour resolved via {@link resolveSegmentColor}.
 *
 * @param sizeConfig - Resolved {@link MeterSizeConfig} for the current size.
 * @param themeColors - Current {@link ThemeColors} for colour resolution.
 * @param percent - Current meter fill as a percentage (0--100).
 * @param variant - The visual variant to render.
 * @param low - Low threshold percentage for segment colouring.
 * @param high - High threshold percentage for segment colouring.
 * @param optimum - Optimum percentage for segment colouring.
 * @returns A `CSSStyleObject` object for the fill bar.
 */
export function buildMeterFillStyle(
  sizeConfig: MeterSizeConfig,
  theme: WispTheme,
  percent: number,
  variant: MeterVariant,
  low: number = 25,
  high: number = 75,
  optimum: number = 50,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  const base: CSSStyleObject = {
    height: '100%',
    width: `${percent}%`,
    borderRadius: radii[sizeConfig.borderRadius],
    transition: `width ${durations.slow}ms ${easings.easeOut.css}, background-color ${durations.slow}ms ${easings.easeOut.css}`,
  };

  switch (variant) {
    case 'gradient':
      return {
        ...base,
        background: `linear-gradient(90deg, ${themeColors.accent.secondary}, ${themeColors.accent.primary})`,
      };
    case 'segments':
      return {
        ...base,
        backgroundColor: resolveSegmentColor(percent, low, high, optimum, theme),
      };
    case 'default':
    default:
      return {
        ...base,
        backgroundColor: themeColors.accent.primary,
      };
  }
}

// ---------------------------------------------------------------------------
// Label row style -- flex row for label + value
// ---------------------------------------------------------------------------

/**
 * Builds the flex-row style for the label and value text above the bar.
 *
 * @param sizeConfig - Resolved {@link MeterSizeConfig} for the current size.
 * @param themeColors - Current {@link ThemeColors} for colour resolution.
 * @returns A `CSSStyleObject` object for the label row.
 */
export function buildMeterLabelStyle(
  sizeConfig: MeterSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    lineHeight: 1.4,
    fontWeight: typography.weights.medium,
    color: themeColors.text.primary,
    margin: 0,
    padding: 0,
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Value text style
// ---------------------------------------------------------------------------

/**
 * Builds the style for the value `span` within the label row.
 *
 * @param sizeConfig - Resolved {@link MeterSizeConfig} for the current size.
 * @param themeColors - Current {@link ThemeColors} for colour resolution.
 * @returns A `CSSStyleObject` object for the value text.
 */
export function buildMeterValueStyle(
  sizeConfig: MeterSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    lineHeight: 1.4,
    fontWeight: typography.weights.medium,
    color: themeColors.text.secondary,
    margin: 0,
    padding: 0,
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Skeleton style -- track-shaped loading placeholder
// ---------------------------------------------------------------------------

/**
 * Builds the skeleton placeholder style that mimics the track shape.
 *
 * @param sizeConfig - Resolved {@link MeterSizeConfig} for the current size.
 * @param themeColors - Current {@link ThemeColors} for colour resolution.
 * @returns A `CSSStyleObject` object with a pulsing animation.
 */
export function getMeterSkeletonStyle(
  sizeConfig: MeterSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'block',
    width: '100%',
    height: sizeConfig.height,
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
