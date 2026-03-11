import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { ActivityCirclesSizeConfig } from '../types/ActivityCircles.types';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

/** Default data-viz palette keys used for rings when no colour override is given. */
const DATA_PALETTE_KEYS = ['blue', 'violet', 'amber', 'emerald', 'cyan'] as const;

/**
 * Returns the default colour for a ring at the given index using the
 * `theme.data` palette.
 *
 * @param index - Zero-based ring index.
 * @param themeColors - Current {@link ThemeColors}.
 * @returns A CSS colour string.
 */
export function resolveRingColor(
  index: number,
  theme: WispTheme,
): string {
  const { colors: themeColors } = theme;
  const key = DATA_PALETTE_KEYS[index % DATA_PALETTE_KEYS.length];
  return themeColors.data[key];
}

// ---------------------------------------------------------------------------
// Resolved colour set
// ---------------------------------------------------------------------------

/**
 * Resolved colour tokens for the ActivityCircles component.
 */
export interface ActivityCirclesColors {
  /** Background (track) colour for unfilled ring arcs. */
  track: string;
  /** Label text colour for the legend. */
  labelText: string;
}

/**
 * Resolves common colours shared by all rings.
 *
 * @param themeColors - Current {@link ThemeColors}.
 * @returns An {@link ActivityCirclesColors} object.
 */
export function resolveActivityCirclesColors(
  theme: WispTheme,
): ActivityCirclesColors {
  const { colors: themeColors } = theme;
  return {
    track: themeColors.border.subtle,
    labelText: themeColors.text.secondary,
  };
}

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

/**
 * Builds the outer wrapper style (column flex, centred).
 *
 * @param showLabels - Whether a legend is rendered below the rings.
 * @returns A {@link CSSStyleObject}.
 */
export function buildActivityCirclesWrapperStyle(
  showLabels: boolean,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: showLabels ? 12 : 0,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// SVG container
// ---------------------------------------------------------------------------

/**
 * Builds the relative-positioned container for the SVG and centre content.
 *
 * @param sizeConfig - Resolved {@link ActivityCirclesSizeConfig}.
 * @returns A {@link CSSStyleObject}.
 */
export function buildActivityCirclesSvgContainerStyle(
  sizeConfig: ActivityCirclesSizeConfig,
): CSSStyleObject {
  return {
    position: 'relative',
    width: sizeConfig.diameter,
    height: sizeConfig.diameter,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Centre content overlay
// ---------------------------------------------------------------------------

/**
 * Builds the absolutely-positioned overlay for custom centre content.
 *
 * @param sizeConfig - Resolved {@link ActivityCirclesSizeConfig}.
 * @returns A {@link CSSStyleObject}.
 */
export function buildActivityCirclesCenterStyle(
  sizeConfig: ActivityCirclesSizeConfig,
): CSSStyleObject {
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    width: sizeConfig.diameter,
    height: sizeConfig.diameter,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  };
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

/**
 * Builds the flex-wrap container for the legend row.
 *
 * @returns A {@link CSSStyleObject}.
 */
export function buildActivityCirclesLegendStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  };
}

/**
 * Builds a single legend item row style (dot + label).
 *
 * @returns A {@link CSSStyleObject}.
 */
export function buildActivityCirclesLegendItemStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  };
}

/**
 * Builds the small colour dot for a legend item.
 *
 * @param color - Ring colour.
 * @returns A {@link CSSStyleObject}.
 */
export function buildActivityCirclesLegendDotStyle(color: string, theme: WispTheme): CSSStyleObject {
  const { radii } = theme;
  return {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: color,
    flexShrink: 0,
  };
}

/**
 * Builds the label text style for a legend item.
 *
 * @param sizeConfig - Resolved {@link ActivityCirclesSizeConfig}.
 * @param colors - Resolved {@link ActivityCirclesColors}.
 * @returns A {@link CSSStyleObject}.
 */
export function buildActivityCirclesLegendTextStyle(
  sizeConfig: ActivityCirclesSizeConfig,
  colors: ActivityCirclesColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: 1.4,
    color: colors.labelText,
    margin: 0,
    padding: 0,
    userSelect: 'none',
  };
}
