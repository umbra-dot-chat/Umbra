/**
 * @module styles/LinkPreviewCard
 * @description Pure style-builder functions for the LinkPreviewCard component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import type { LinkPreviewCardSize, LinkPreviewCardLayout } from '../types/LinkPreviewCard.types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';
import { withAlpha } from '../tokens/color-utils';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface LinkPreviewCardColors {
  bg: string;
  border: string;
  title: string;
  description: string;
  domain: string;
}

export function resolveLinkPreviewCardColors(
  theme: WispTheme,
): LinkPreviewCardColors {
  const { colors, mode } = theme;
  const isLight = mode === 'light';
  return {
    bg: isLight ? colors.background.sunken : colors.background.surface,
    border: colors.border.subtle,
    title: isLight ? colors.text.primary : colors.text.primary,
    description: isLight ? colors.text.secondary : colors.text.secondary,
    domain: withAlpha(isLight ? colors.text.secondary : colors.text.secondary, 0.7),
  };
}

// ---------------------------------------------------------------------------
// Size configs
// ---------------------------------------------------------------------------

interface SizeConfig {
  titleFontSize: number;
  descFontSize: number;
  domainFontSize: number;
  padding: number;
  imageHeight: number;
  imageWidthHorizontal: number;
  gap: number;
  maxDescLines: number;
}

const sizeConfigs: Record<LinkPreviewCardSize, SizeConfig> = {
  sm: {
    titleFontSize: 13,
    descFontSize: 12,
    domainFontSize: 11,
    padding: 10,
    imageHeight: 120,
    imageWidthHorizontal: 80,
    gap: 8,
    maxDescLines: 2,
  },
  md: {
    titleFontSize: 14,
    descFontSize: 13,
    domainFontSize: 12,
    padding: 12,
    imageHeight: 160,
    imageWidthHorizontal: 100,
    gap: 10,
    maxDescLines: 3,
  },
  lg: {
    titleFontSize: 16,
    descFontSize: 14,
    domainFontSize: 12,
    padding: 14,
    imageHeight: 200,
    imageWidthHorizontal: 120,
    gap: 12,
    maxDescLines: 4,
  },
};

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildLinkPreviewCardContainerStyle(
  colors: LinkPreviewCardColors,
  layout: LinkPreviewCardLayout,
  size: LinkPreviewCardSize,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  const cfg = sizeConfigs[size];
  return {
    display: 'flex',
    flexDirection: layout === 'horizontal' ? 'row' : 'column',
    overflow: 'hidden',
    borderRadius: radii.lg,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bg,
    cursor: 'pointer',
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}`,
    maxWidth: '100%',
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Image
// ---------------------------------------------------------------------------

export function buildLinkPreviewImageStyle(
  layout: LinkPreviewCardLayout,
  size: LinkPreviewCardSize,
): CSSStyleObject {
  const cfg = sizeConfigs[size];
  if (layout === 'horizontal') {
    return {
      width: cfg.imageWidthHorizontal,
      minHeight: '100%',
      objectFit: 'cover',
      flexShrink: 0,
    };
  }
  return {
    width: '100%',
    height: cfg.imageHeight,
    objectFit: 'cover',
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export function buildLinkPreviewContentStyle(
  size: LinkPreviewCardSize,
): CSSStyleObject {
  const cfg = sizeConfigs[size];
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: cfg.gap / 2,
    padding: cfg.padding,
    minWidth: 0,
    flex: 1,
  };
}

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------

export function buildLinkPreviewTitleStyle(
  colors: LinkPreviewCardColors,
  size: LinkPreviewCardSize,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  const cfg = sizeConfigs[size];
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: cfg.titleFontSize,
    lineHeight: 1.3,
    fontWeight: typography.weights.semibold,
    color: colors.title,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Description
// ---------------------------------------------------------------------------

export function buildLinkPreviewDescriptionStyle(
  colors: LinkPreviewCardColors,
  size: LinkPreviewCardSize,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  const cfg = sizeConfigs[size];
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: cfg.descFontSize,
    lineHeight: 1.4,
    fontWeight: typography.weights.regular,
    color: colors.description,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: cfg.maxDescLines,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Domain row (favicon + domain)
// ---------------------------------------------------------------------------

export function buildLinkPreviewDomainRowStyle(): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  };
}

export function buildLinkPreviewFaviconStyle(): CSSStyleObject {
  return {
    width: 14,
    height: 14,
    borderRadius: 2,
    flexShrink: 0,
  };
}

export function buildLinkPreviewDomainStyle(
  colors: LinkPreviewCardColors,
  size: LinkPreviewCardSize,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  const cfg = sizeConfigs[size];
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: cfg.domainFontSize,
    lineHeight: 1.3,
    fontWeight: typography.weights.regular,
    color: colors.domain,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function buildLinkPreviewSkeletonStyle(
  layout: LinkPreviewCardLayout,
  size: LinkPreviewCardSize,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, colors } = theme;
  const cfg = sizeConfigs[size];
  return {
    display: 'flex',
    flexDirection: layout === 'horizontal' ? 'row' : 'column',
    overflow: 'hidden',
    borderRadius: radii.lg,
    border: `1px solid ${colors.border.subtle}`,
    backgroundColor: colors.background.raised,
    maxWidth: '100%',
    boxSizing: 'border-box',
  };
}

export function buildLinkPreviewSkeletonImageStyle(
  layout: LinkPreviewCardLayout,
  size: LinkPreviewCardSize,
  theme: WispTheme,
): CSSStyleObject {
  const { colors } = theme;
  const cfg = sizeConfigs[size];
  // Use a subtle shimmer color that works on the raised background
  const shimmerBg = withAlpha(colors.text.onRaisedSecondary, 0.15);
  if (layout === 'horizontal') {
    return {
      width: cfg.imageWidthHorizontal,
      minHeight: 80,
      backgroundColor: shimmerBg,
      flexShrink: 0,
      animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
    };
  }
  return {
    width: '100%',
    height: cfg.imageHeight,
    backgroundColor: shimmerBg,
    flexShrink: 0,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}

export function buildLinkPreviewSkeletonLineStyle(
  width: string,
  height: number,
  theme: WispTheme,
): CSSStyleObject {
  const { colors, radii } = theme;
  // Use a subtle shimmer color that works on the raised background
  const shimmerBg = withAlpha(colors.text.onRaisedSecondary, 0.2);
  return {
    width,
    height,
    borderRadius: radii.sm,
    backgroundColor: shimmerBg,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
