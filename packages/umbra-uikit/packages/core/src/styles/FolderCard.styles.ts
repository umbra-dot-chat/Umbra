/**
 * @module FolderCard
 * @description Style builders for the FolderCard component.
 */
import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { WispTheme } from '../theme/types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Card root
// ---------------------------------------------------------------------------

export function buildFolderCardStyle(
  theme: WispTheme,
  selected: boolean,
  hovered: boolean,
  dropTarget: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing, shadows } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: radii.lg,
    border: `1px solid ${
      dropTarget
        ? themeColors.accent.primary
        : selected
          ? themeColors.accent.primary
          : themeColors.border.subtle
    }`,
    backgroundColor: dropTarget
      ? `${themeColors.accent.primary}10`
      : themeColors.background.surface,
    boxShadow: hovered ? shadows.sm : 'none',
    cursor: 'pointer',
    overflow: 'hidden',
    fontFamily: fontFamilyStacks.sans,
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}, box-shadow ${durations.fast}ms ${easings.easeOut.css}, background-color ${durations.fast}ms ${easings.easeOut.css}`,
    boxSizing: 'border-box',
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Icon area (top half)
// ---------------------------------------------------------------------------

export function buildFolderCardIconAreaStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    backgroundColor: themeColors.background.raised,
    overflow: 'hidden',
    position: 'relative',
  };
}

// ---------------------------------------------------------------------------
// Folder icon
// ---------------------------------------------------------------------------

export function buildFolderCardIconStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    color: themeColors.status.warning,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

// ---------------------------------------------------------------------------
// Card body
// ---------------------------------------------------------------------------

export function buildFolderCardBodyStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['2xs'],
    padding: spacing.sm,
  };
}

// ---------------------------------------------------------------------------
// Folder name
// ---------------------------------------------------------------------------

export function buildFolderCardNameStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.medium,
    color: themeColors.text.primary,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Folder meta (file count)
// ---------------------------------------------------------------------------

export function buildFolderCardMetaStyle(
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
// Skeleton
// ---------------------------------------------------------------------------

export function buildFolderCardSkeletonStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    borderRadius: radii.lg,
    backgroundColor: themeColors.border.subtle,
    height: 160,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
