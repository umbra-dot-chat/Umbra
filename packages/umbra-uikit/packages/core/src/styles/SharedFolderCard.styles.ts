/**
 * @module SharedFolderCard
 */
import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Card root
// ---------------------------------------------------------------------------

export function buildSharedFolderCardStyle(
  theme: WispTheme,
  hovered: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing, shadows } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    border: `1px solid ${themeColors.border.subtle}`,
    backgroundColor: themeColors.background.surface,
    boxShadow: hovered ? shadows.sm : 'none',
    cursor: 'pointer',
    fontFamily: fontFamilyStacks.sans,
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}, box-shadow ${durations.fast}ms ${easings.easeOut.css}`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Header row (icon + name + sync button)
// ---------------------------------------------------------------------------

export function buildSharedFolderCardHeaderStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };
}

export function buildSharedFolderCardIconStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    color: themeColors.accent.primary,
    flexShrink: 0,
  };
}

export function buildSharedFolderCardNameStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.semibold,
    color: themeColors.text.primary,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    minWidth: 0,
  };
}

// ---------------------------------------------------------------------------
// Sync progress ring (SVG-based)
// ---------------------------------------------------------------------------

export function buildSharedFolderCardSyncRingStyle(
  theme: WispTheme,
): CSSStyleObject {
  return {
    width: 24,
    height: 24,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Meta row (file count + last sync)
// ---------------------------------------------------------------------------

export function buildSharedFolderCardMetaStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography, spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    fontSize: typography.sizes.xs.fontSize,
    color: themeColors.text.muted,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Shared members avatar row
// ---------------------------------------------------------------------------

export function buildSharedFolderCardAvatarRowStyle(
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
  };
}

export function buildSharedFolderCardAvatarStyle(
  theme: WispTheme,
  index: number,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    border: `2px solid ${themeColors.background.surface}`,
    overflow: 'hidden',
    marginLeft: index > 0 ? -8 : 0,
    backgroundColor: themeColors.background.raised,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    color: themeColors.text.muted,
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function buildSharedFolderCardSkeletonStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    borderRadius: radii.lg,
    backgroundColor: themeColors.border.subtle,
    height: 120,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
