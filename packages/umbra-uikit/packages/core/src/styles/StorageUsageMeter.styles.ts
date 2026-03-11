/**
 * @module StorageUsageMeter
 */
import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Root container
// ---------------------------------------------------------------------------

export function buildStorageMeterRootStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Header (title + used/total)
// ---------------------------------------------------------------------------

export function buildStorageMeterHeaderStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  };
}

export function buildStorageMeterTitleStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.semibold,
    color: themeColors.text.primary,
    margin: 0,
  };
}

export function buildStorageMeterUsageTextStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    color: themeColors.text.muted,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Segmented bar
// ---------------------------------------------------------------------------

export function buildStorageMeterBarStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'flex',
    width: '100%',
    height: 12,
    borderRadius: radii.full,
    backgroundColor: themeColors.border.subtle,
    overflow: 'hidden',
  };
}

export function buildStorageMeterSegmentStyle(
  color: string,
  widthPercent: number,
): CSSStyleObject {
  return {
    width: `${widthPercent}%`,
    height: '100%',
    backgroundColor: color,
    transition: `width ${durations.normal}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

export function buildStorageMeterLegendStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.md,
  };
}

export function buildStorageMeterLegendItemStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  };
}

export function buildStorageMeterLegendDotStyle(
  color: string,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: color,
    flexShrink: 0,
  };
}

export function buildStorageMeterLegendLabelStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    color: themeColors.text.secondary,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Actions row
// ---------------------------------------------------------------------------

export function buildStorageMeterActionsStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function buildStorageMeterSkeletonStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    borderRadius: radii.lg,
    backgroundColor: themeColors.border.subtle,
    height: 80,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
