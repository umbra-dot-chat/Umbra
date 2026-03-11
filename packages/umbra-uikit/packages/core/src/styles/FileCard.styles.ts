/**
 * @module FileCard
 */
import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { WispTheme } from '../theme/types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Card root
// ---------------------------------------------------------------------------

export function buildFileCardStyle(
  theme: WispTheme,
  selected: boolean,
  hovered: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing, shadows } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: radii.lg,
    border: `1px solid ${selected ? themeColors.accent.primary : themeColors.border.subtle}`,
    backgroundColor: themeColors.background.surface,
    boxShadow: hovered ? shadows.sm : 'none',
    cursor: 'pointer',
    overflow: 'hidden',
    fontFamily: fontFamilyStacks.sans,
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}, box-shadow ${durations.fast}ms ${easings.easeOut.css}`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Thumbnail area
// ---------------------------------------------------------------------------

export function buildFileCardThumbnailStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    backgroundColor: themeColors.background.raised,
    overflow: 'hidden',
    position: 'relative',
  };
}

// ---------------------------------------------------------------------------
// Thumbnail image
// ---------------------------------------------------------------------------

export function buildFileCardThumbnailImageStyle(): CSSStyleObject {
  return {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };
}

// ---------------------------------------------------------------------------
// File type icon (shown when no thumbnail)
// ---------------------------------------------------------------------------

export function buildFileCardIconStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    color: themeColors.text.muted,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

// ---------------------------------------------------------------------------
// Card body (below thumbnail)
// ---------------------------------------------------------------------------

export function buildFileCardBodyStyle(
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
// File name
// ---------------------------------------------------------------------------

export function buildFileCardNameStyle(
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
// File meta (size, downloads)
// ---------------------------------------------------------------------------

export function buildFileCardMetaStyle(
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
// Download button overlay
// ---------------------------------------------------------------------------

export function buildFileCardDownloadOverlayStyle(
  theme: WispTheme,
  visible: boolean,
): CSSStyleObject {
  return {
    position: 'absolute',
    top: 8,
    right: 8,
    opacity: visible ? 1 : 0,
    transition: `opacity ${durations.fast}ms ${easings.easeOut.css}`,
    zIndex: 1,
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function buildFileCardSkeletonStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    borderRadius: radii.lg,
    backgroundColor: themeColors.border.subtle,
    height: 200,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
