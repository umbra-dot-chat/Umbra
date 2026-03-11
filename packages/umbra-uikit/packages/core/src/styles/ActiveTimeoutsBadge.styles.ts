/**
 * @module styles/ActiveTimeoutsBadge
 * @description Pure style-builder functions for the ActiveTimeoutsBadge component.
 *
 * A badge/indicator on member profiles showing active timeout status.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export interface ActiveTimeoutsBadgeColors {
  muteBg: string;
  muteText: string;
  muteBorder: string;
  restrictBg: string;
  restrictText: string;
  restrictBorder: string;
  tooltipBg: string;
  tooltipText: string;
  tooltipSecondary: string;
}

/**
 * Resolves semantic colors for the ActiveTimeoutsBadge from the current theme.
 */
export function resolveActiveTimeoutsBadgeColors(theme: WispTheme): ActiveTimeoutsBadgeColors {
  const { colors } = theme;
  return {
    muteBg: colors.status.warningSurface,
    muteText: colors.status.warning,
    muteBorder: colors.status.warningBorder,
    restrictBg: colors.status.dangerSurface,
    restrictText: colors.status.danger,
    restrictBorder: colors.status.dangerBorder,
    tooltipBg: colors.background.raised,
    tooltipText: colors.text.onRaised,
    tooltipSecondary: colors.text.onRaisedSecondary,
  };
}

// ---------------------------------------------------------------------------
// Size maps
// ---------------------------------------------------------------------------

const sizeMap = {
  xs: { fontSize: 10, lineHeight: 14, paddingH: 4, paddingV: 1, iconSize: 10, gap: 2 },
  sm: { fontSize: 12, lineHeight: 16, paddingH: 6, paddingV: 2, iconSize: 12, gap: 4 },
  md: { fontSize: 14, lineHeight: 20, paddingH: 8, paddingV: 3, iconSize: 14, gap: 4 },
} as const;

// ---------------------------------------------------------------------------
// Badge container
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the badge container.
 */
export function buildBadgeStyle(
  theme: WispTheme,
  tcColors: ActiveTimeoutsBadgeColors,
  type: 'mute' | 'restrict',
  size: 'xs' | 'sm' | 'md',
): CSSStyleObject {
  const s = sizeMap[size];
  const isMute = type === 'mute';
  return {
    display: 'inline-flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.gap,
    padding: `${s.paddingV}px ${s.paddingH}px`,
    borderRadius: theme.radii.full,
    fontSize: s.fontSize,
    lineHeight: `${s.lineHeight}px`,
    fontWeight: theme.typography.weights.medium,
    fontFamily: fontFamilyStacks.sans,
    backgroundColor: isMute ? tcColors.muteBg : tcColors.restrictBg,
    color: isMute ? tcColors.muteText : tcColors.restrictText,
    border: `1px solid ${isMute ? tcColors.muteBorder : tcColors.restrictBorder}`,
    cursor: 'default',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the clock icon inside the badge.
 */
export function buildIconStyle(size: 'xs' | 'sm' | 'md'): CSSStyleObject {
  const s = sizeMap[size];
  return {
    width: s.iconSize,
    height: s.iconSize,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the tooltip wrapper.
 */
export function buildTooltipContainerStyle(
  theme: WispTheme,
  tcColors: ActiveTimeoutsBadgeColors,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    padding: `${spacing.sm}px ${spacing.md}px`,
    backgroundColor: tcColors.tooltipBg,
    borderRadius: theme.radii.md,
    fontFamily: fontFamilyStacks.sans,
  };
}

/**
 * Builds inline styles for tooltip label text.
 */
export function buildTooltipLabelStyle(
  theme: WispTheme,
  tcColors: ActiveTimeoutsBadgeColors,
): CSSStyleObject {
  return {
    fontSize: theme.typography.sizes.xs.fontSize,
    lineHeight: `${theme.typography.sizes.xs.lineHeight}px`,
    fontWeight: theme.typography.weights.semibold,
    color: tcColors.tooltipText,
    margin: 0,
  };
}

/**
 * Builds inline styles for tooltip detail text.
 */
export function buildTooltipDetailStyle(
  theme: WispTheme,
  tcColors: ActiveTimeoutsBadgeColors,
): CSSStyleObject {
  return {
    fontSize: theme.typography.sizes['2xs'].fontSize,
    lineHeight: `${theme.typography.sizes['2xs'].lineHeight}px`,
    fontWeight: theme.typography.weights.regular,
    color: tcColors.tooltipSecondary,
    margin: 0,
  };
}
