/**
 * @module types/Sparkline
 * @description Type definitions for the Sparkline primitive — tiny inline SVG
 * charts (line, area, bar) for embedding in tables, cards, and dashboards.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Variant
// ---------------------------------------------------------------------------

export const sparklineVariants = ['line', 'area', 'bar'] as const;
export type SparklineVariant = (typeof sparklineVariants)[number];

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

export const sparklineSizes = ['sm', 'md', 'lg', 'xl'] as const;
export type SparklineSize = (typeof sparklineSizes)[number];

export interface SparklineSizeConfig {
  /** SVG viewport width (px). */
  width: number;
  /** SVG viewport height (px). */
  height: number;
  /** Stroke width for line / area variants. */
  strokeWidth: number;
  /** Radius of the end-dot circle. */
  dotRadius: number;
  /** Gap between bars for bar variant (px). */
  barGap: number;
}

export const sparklineSizeMap: Record<SparklineSize, SparklineSizeConfig> = {
  sm: { width: 48, height: 16, strokeWidth: 1.5, dotRadius: 2, barGap: 1 },
  md: { width: 80, height: 24, strokeWidth: 1.5, dotRadius: 2.5, barGap: 1 },
  lg: { width: 120, height: 32, strokeWidth: 2, dotRadius: 3, barGap: 2 },
  xl: { width: 200, height: 48, strokeWidth: 2, dotRadius: 3.5, barGap: 2 },
};

// ---------------------------------------------------------------------------
// Color
// ---------------------------------------------------------------------------

export const sparklineColors = ['default', 'success', 'warning', 'danger', 'info'] as const;
export type SparklineColor = (typeof sparklineColors)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SparklineProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Array of numeric values to plot. */
  data: number[];

  /** Chart type. @default 'line' */
  variant?: SparklineVariant;

  /** Preset dimensions. @default 'md' */
  size?: SparklineSize;

  /** Accent color. @default 'default' */
  color?: SparklineColor;

  /** Use smooth cubic-bezier curves instead of straight segments. @default true */
  curved?: boolean;

  /** Show a highlighted dot on the last data point. @default false */
  showEndDot?: boolean;

  /** Animate the chart entry. @default false */
  animated?: boolean;

  /** Opacity of the fill gradient for area variant (0-1). @default 0.15 */
  fillOpacity?: number;

  /** Stretch width to 100% of parent container. @default false */
  responsive?: boolean;

  /** Show a loading skeleton placeholder. @default false */
  skeleton?: boolean;
}
