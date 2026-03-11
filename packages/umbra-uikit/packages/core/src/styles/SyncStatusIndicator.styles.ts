/**
 * @module SyncStatusIndicator
 */
import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Size config
// ---------------------------------------------------------------------------

const sizeMap = { sm: 16, md: 20, lg: 28 } as const;

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export function buildSyncStatusRootStyle(
  theme: WispTheme,
  size: 'sm' | 'md' | 'lg',
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Ring container (SVG wrapper)
// ---------------------------------------------------------------------------

export function buildSyncStatusRingStyle(
  size: 'sm' | 'md' | 'lg',
): CSSStyleObject {
  const dim = sizeMap[size];
  return {
    width: dim,
    height: dim,
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Status dot (center of ring)
// ---------------------------------------------------------------------------

export function buildSyncStatusDotStyle(
  theme: WispTheme,
  status: 'synced' | 'syncing' | 'offline' | 'error',
  size: 'sm' | 'md' | 'lg',
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  const dotSize = { sm: 6, md: 8, lg: 12 }[size];
  const colorMap: Record<string, string> = {
    synced: themeColors.status.success,
    syncing: themeColors.accent.primary,
    offline: themeColors.text.muted,
    error: themeColors.status.danger,
  };
  return {
    width: dotSize,
    height: dotSize,
    borderRadius: radii.full,
    backgroundColor: colorMap[status] ?? themeColors.text.muted,
    position: 'absolute',
  };
}

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

export function buildSyncStatusLabelStyle(
  theme: WispTheme,
  status: 'synced' | 'syncing' | 'offline' | 'error',
  size: 'sm' | 'md' | 'lg',
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  const fsMap = { sm: typography.sizes.xs.fontSize, md: typography.sizes.xs.fontSize, lg: typography.sizes.sm.fontSize };
  const colorMap: Record<string, string> = {
    synced: themeColors.status.success,
    syncing: themeColors.accent.primary,
    offline: themeColors.text.muted,
    error: themeColors.status.danger,
  };
  return {
    fontSize: fsMap[size],
    color: colorMap[status] ?? themeColors.text.muted,
    margin: 0,
    textTransform: 'capitalize',
  };
}
