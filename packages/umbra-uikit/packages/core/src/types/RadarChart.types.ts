import type React from 'react';

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

/**
 * Tuple of valid radar-chart size literals.
 */
export const radarChartSizes = ['sm', 'md', 'lg', 'xl'] as const;

/** Union type derived from {@link radarChartSizes}. */
export type RadarChartSize = (typeof radarChartSizes)[number];

// ---------------------------------------------------------------------------
// Size -> dimensions map
// ---------------------------------------------------------------------------

/**
 * Resolved dimension values for a single {@link RadarChartSize}.
 */
export interface RadarChartSizeConfig {
  /** Overall width/height of the SVG in pixels. */
  size: number;
  /** Font size for axis labels in pixels. */
  labelFontSize: number;
  /** Radius of data-point dots in pixels. */
  dotRadius: number;
  /** Font size for legend labels in pixels. */
  legendFontSize: number;
  /** Margin reserved around the chart for axis labels. */
  labelMargin: number;
}

/**
 * Maps each {@link RadarChartSize} to its {@link RadarChartSizeConfig}.
 */
export const radarChartSizeMap: Record<RadarChartSize, RadarChartSizeConfig> = {
  sm: { size: 200, labelFontSize: 10, dotRadius: 3, legendFontSize: 10, labelMargin: 30 },
  md: { size: 300, labelFontSize: 12, dotRadius: 4, legendFontSize: 12, labelMargin: 40 },
  lg: { size: 400, labelFontSize: 14, dotRadius: 5, legendFontSize: 14, labelMargin: 50 },
  xl: { size: 500, labelFontSize: 16, dotRadius: 6, legendFontSize: 16, labelMargin: 60 },
};

// ---------------------------------------------------------------------------
// Series definition
// ---------------------------------------------------------------------------

/**
 * A single data series plotted on the radar chart.
 */
export interface RadarChartSeries {
  /** Series name displayed in the legend. */
  label: string;
  /** Data values — one per axis, in the same order as {@link RadarChartProps.axes}. */
  values: number[];
  /**
   * Override colour for this series.
   * When omitted the component picks from the `theme.data` palette.
   */
  color?: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link RadarChart} component.
 *
 * @remarks
 * Renders a multi-axis radar (spider) chart for comparing one or more
 * data series across categories.
 *
 * - Up to 5 series supported, each assigned a distinct colour.
 * - Concentric polygon grid with configurable number of levels.
 * - Optional axis labels, data-point dots, and a colour-coded legend.
 * - Semi-transparent area fill per series.
 */
export interface RadarChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * Axis labels displayed around the perimeter of the chart.
   * The number of axes determines the polygon shape (3 = triangle,
   * 5 = pentagon, etc.).
   */
  axes: string[];

  /**
   * One or more data series to plot. Each series must have the same
   * number of values as there are axes.
   */
  series: RadarChartSeries[];

  /**
   * Size variant controlling overall dimensions and font sizes.
   *
   * @default 'md'
   */
  size?: RadarChartSize;

  /**
   * Maximum value on each axis scale.
   *
   * @default 100
   */
  max?: number;

  /**
   * Number of concentric grid polygons drawn as scale references.
   *
   * @default 4
   */
  levels?: number;

  /**
   * Whether to render axis labels around the perimeter.
   *
   * @default true
   */
  showLabels?: boolean;

  /**
   * Whether to render the colour-coded series legend below the chart.
   *
   * @default true
   */
  showLegend?: boolean;

  /**
   * Whether to render small dots at each data point.
   *
   * @default true
   */
  showDots?: boolean;

  /**
   * Opacity of the semi-transparent area fill for each series.
   *
   * @default 0.15
   */
  fillOpacity?: number;
}
