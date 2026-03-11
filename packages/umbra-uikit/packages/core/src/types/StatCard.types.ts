/**
 * @module types/StatCard
 * @description Type definitions for the StatCard component — a KPI / metric
 * display card with optional icon, trend indicator, and inline sparkline.
 */

import type React from 'react';
import type { SparklineSize } from './Sparkline.types';
import { defaultSpacing } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Variant
// ---------------------------------------------------------------------------

export const statCardVariants = ['default', 'success', 'warning', 'danger', 'info'] as const;
export type StatCardVariant = (typeof statCardVariants)[number];

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

export const statCardSizes = ['sm', 'md', 'lg'] as const;
export type StatCardSize = (typeof statCardSizes)[number];

export interface StatCardSizeConfig {
  /** Card padding (px). */
  padding: number;
  /** Font size step for the metric value. */
  valueFontSize: number;
  /** Line height for the metric value. */
  valueLineHeight: number;
  /** Font size for the label text. */
  labelFontSize: number;
  /** Font size for the description text. */
  descriptionFontSize: number;
  /** Font size for the trend text. */
  trendFontSize: number;
  /** Icon size (px). */
  iconSize: number;
  /** Matching Sparkline size preset. */
  sparklineSize: SparklineSize;
  /** Gap between major layout areas (px). */
  gap: number;
}

export const statCardSizeMap: Record<StatCardSize, StatCardSizeConfig> = {
  sm: {
    padding: defaultSpacing.md,
    valueFontSize: 24,
    valueLineHeight: 32,
    labelFontSize: 13,
    descriptionFontSize: 12,
    trendFontSize: 12,
    iconSize: 20,
    sparklineSize: 'sm',
    gap: defaultSpacing.sm,
  },
  md: {
    padding: defaultSpacing.lg,
    valueFontSize: 30,
    valueLineHeight: 38,
    labelFontSize: 14,
    descriptionFontSize: 12,
    trendFontSize: 12,
    iconSize: 24,
    sparklineSize: 'md',
    gap: defaultSpacing.md,
  },
  lg: {
    padding: defaultSpacing.xl,
    valueFontSize: 36,
    valueLineHeight: 44,
    labelFontSize: 16,
    descriptionFontSize: 14,
    trendFontSize: 13,
    iconSize: 28,
    sparklineSize: 'lg',
    gap: defaultSpacing.lg,
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface StatCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The metric value to display (e.g. "1,234" or 42). */
  value: string | number;

  /** Metric label / title (e.g. "Active Users"). */
  label: string;

  /** Optional subtitle or description text. */
  description?: string;

  /** Optional Lucide icon component rendered beside the label. */
  icon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number | string }>;

  /** Percentage change indicator (positive = up, negative = down). */
  trend?: number;

  /** Custom text beside the trend indicator (e.g. "vs last week"). */
  trendLabel?: string;

  /** Data array to render an inline Sparkline. */
  sparklineData?: number[];

  /** Color accent variant. @default 'default' */
  variant?: StatCardVariant;

  /** Size preset. @default 'md' */
  size?: StatCardSize;

  /** Show a loading skeleton placeholder. @default false */
  skeleton?: boolean;
}
