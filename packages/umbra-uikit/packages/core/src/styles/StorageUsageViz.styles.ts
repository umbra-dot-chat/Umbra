/**
 * @module components/storage-usage-viz
 *
 * Style-building utilities for the {@link StorageUsageViz} component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';

// ---------------------------------------------------------------------------
// Default bar colors
// ---------------------------------------------------------------------------

const DEFAULT_BAR_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
];

/**
 * Returns a default color for a bar at the given index.
 */
export function getDefaultBarColor(index: number): string {
  return DEFAULT_BAR_COLORS[index % DEFAULT_BAR_COLORS.length];
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildVizContainerStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background.surface,
    border: `1px solid ${theme.colors.border.subtle}`,
  };
}

// ---------------------------------------------------------------------------
// Chart area
// ---------------------------------------------------------------------------

export function buildChartAreaStyle(height: number, theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    height,
  };
}

// ---------------------------------------------------------------------------
// Bar row
// ---------------------------------------------------------------------------

export function buildBarRowStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.md,
  };
}

// ---------------------------------------------------------------------------
// Bar label
// ---------------------------------------------------------------------------

export function buildBarLabelStyle(theme: WispTheme): CSSStyleObject {
  return {
    width: 80,
    flexShrink: 0,
    fontSize: 13,
    color: theme.colors.text.secondary,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Bar track
// ---------------------------------------------------------------------------

export function buildBarTrackStyle(theme: WispTheme): CSSStyleObject {
  return {
    flex: 1,
    height: 16,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.border.subtle,
    overflow: 'hidden',
    position: 'relative',
  };
}

// ---------------------------------------------------------------------------
// Bar fill
// ---------------------------------------------------------------------------

export function buildBarFillStyle(percentage: number, color: string): CSSStyleObject {
  return {
    height: '100%',
    borderRadius: 'inherit',
    backgroundColor: color,
    width: `${Math.min(100, Math.max(0, percentage))}%`,
    transition: 'width 300ms ease',
  };
}

// ---------------------------------------------------------------------------
// Bar value
// ---------------------------------------------------------------------------

export function buildBarValueStyle(theme: WispTheme): CSSStyleObject {
  return {
    width: 60,
    flexShrink: 0,
    fontSize: 12,
    color: theme.colors.text.muted,
    textAlign: 'right',
  };
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

export function buildLegendStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTop: `1px solid ${theme.colors.border.subtle}`,
  };
}

export function buildLegendItemStyle(): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };
}

export function buildLegendDotStyle(color: string, theme: WispTheme): CSSStyleObject {
  return {
    width: 10,
    height: 10,
    borderRadius: theme.radii.full,
    backgroundColor: color,
    flexShrink: 0,
  };
}

export function buildLegendLabelStyle(theme: WispTheme): CSSStyleObject {
  return {
    fontSize: 12,
    color: theme.colors.text.secondary,
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function buildVizSkeletonStyle(height: number, theme: WispTheme): CSSStyleObject {
  return {
    height: height + 80,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
