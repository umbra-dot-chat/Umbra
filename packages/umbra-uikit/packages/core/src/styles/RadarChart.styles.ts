import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { RadarChartSizeConfig } from '../types/RadarChart.types';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

/** Default data-viz palette keys for series when no colour override is given. */
const DATA_PALETTE_KEYS = ['blue', 'violet', 'amber', 'emerald', 'cyan'] as const;

/**
 * Returns the default colour for a series at the given index.
 *
 * @param index - Zero-based series index.
 * @param themeColors - Current {@link ThemeColors}.
 * @returns A CSS colour string.
 */
export function resolveSeriesColor(
  index: number,
  theme: WispTheme,
): string {
  const { colors: themeColors } = theme;
  const key = DATA_PALETTE_KEYS[index % DATA_PALETTE_KEYS.length];
  return themeColors.data[key];
}

// ---------------------------------------------------------------------------
// Resolved colour set
// ---------------------------------------------------------------------------

/**
 * Resolved colour tokens for the RadarChart component.
 */
export interface RadarChartColors {
  /** Grid line and axis line colour. */
  grid: string;
  /** Axis label text colour. */
  labelText: string;
  /** Legend label text colour. */
  legendText: string;
}

/**
 * Resolves common colours for chart grid, labels, and legend.
 *
 * @param themeColors - Current {@link ThemeColors}.
 * @returns A {@link RadarChartColors} object.
 */
export function resolveRadarChartColors(
  theme: WispTheme,
): RadarChartColors {
  const { colors: themeColors } = theme;
  return {
    grid: themeColors.border.subtle,
    labelText: themeColors.text.secondary,
    legendText: themeColors.text.secondary,
  };
}

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

/**
 * Builds the outer wrapper style (column flex, centred).
 *
 * @param showLegend - Whether a legend is rendered below the chart.
 * @returns A {@link CSSStyleObject}.
 */
export function buildRadarChartWrapperStyle(
  showLegend: boolean,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: showLegend ? 16 : 0,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// SVG container
// ---------------------------------------------------------------------------

/**
 * Builds the SVG container style.
 *
 * @param sizeConfig - Resolved {@link RadarChartSizeConfig}.
 * @returns A {@link CSSStyleObject}.
 */
export function buildRadarChartSvgContainerStyle(
  sizeConfig: RadarChartSizeConfig,
): CSSStyleObject {
  return {
    width: sizeConfig.size,
    height: sizeConfig.size,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

/**
 * Builds the flex-wrap container for the legend row.
 *
 * @returns A {@link CSSStyleObject}.
 */
export function buildRadarChartLegendStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.lg,
  };
}

/**
 * Builds a single legend item row style (dot + label).
 *
 * @returns A {@link CSSStyleObject}.
 */
export function buildRadarChartLegendItemStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  };
}

/**
 * Builds the small colour dot for a legend item.
 *
 * @param color - Series colour.
 * @returns A {@link CSSStyleObject}.
 */
export function buildRadarChartLegendDotStyle(color: string, theme: WispTheme): CSSStyleObject {
  const { radii } = theme;
  return {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: color,
    flexShrink: 0,
  };
}

/**
 * Builds the label text style for a legend item.
 *
 * @param sizeConfig - Resolved {@link RadarChartSizeConfig}.
 * @param colors - Resolved {@link RadarChartColors}.
 * @returns A {@link CSSStyleObject}.
 */
export function buildRadarChartLegendTextStyle(
  sizeConfig: RadarChartSizeConfig,
  colors: RadarChartColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.legendFontSize,
    fontWeight: typography.weights.medium,
    lineHeight: 1.4,
    color: colors.legendText,
    margin: 0,
    padding: 0,
    userSelect: 'none',
  };
}
