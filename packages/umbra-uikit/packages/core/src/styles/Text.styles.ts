/**
 * @module Text
 */
import type { CSSStyleObject } from '../types';
import type { TextSize } from '../tokens/shared';
import type { FontWeightKey, FontFamilyKey, SemanticColor } from '../tokens/shared';
import { fontWeightValues, fontFamilyStacks, resolveSemanticColor } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import { defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Size -> font-size + line-height map
// ---------------------------------------------------------------------------

/**
 * Typography dimension tokens for a single text size step.
 *
 * @remarks
 * Used by {@link buildTextStyle}, {@link getSkeletonStyle}, and
 * {@link getIconStyle} to derive inline styles for the Text primitive.
 */
export interface SizeConfig {
  /** Font size in pixels. */
  fontSize: number;
  /** Line height in pixels. */
  lineHeight: number;
  /** Width and height in pixels for companion icons at this text size. */
  iconSize: number;
  /** Gap in pixels between icon slot and text content. */
  iconGap: number;
  /** Skeleton placeholder height in pixels (typically close to the line height). */
  skeletonHeight: number;
}

/**
 * Maps each {@link TextSize} step to its {@link SizeConfig} dimension tokens.
 *
 * @remarks
 * Provides 11 size steps: five body sizes (`xs` through `xl`) and six display
 * sizes (`display-xs` through `display-2xl`).
 */
export const sizeMap: Record<TextSize, SizeConfig> = {
  xs:            { fontSize: defaultTypography.sizes.xs.fontSize, lineHeight: 18, iconSize: 14, iconGap: 4, skeletonHeight: 14 },
  sm:            { fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 20, iconSize: 14, iconGap: 6, skeletonHeight: 16 },
  md:            { fontSize: defaultTypography.sizes.base.fontSize, lineHeight: 24, iconSize: 16, iconGap: 6, skeletonHeight: 18 },
  lg:            { fontSize: defaultTypography.sizes.lg.fontSize, lineHeight: 28, iconSize: 18, iconGap: 8, skeletonHeight: 20 },
  xl:            { fontSize: defaultTypography.sizes.xl.fontSize, lineHeight: 30, iconSize: 20, iconGap: 8, skeletonHeight: 22 },
  'display-xs':  { fontSize: defaultTypography.sizes['2xl'].fontSize, lineHeight: 32, iconSize: 20, iconGap: 8, skeletonHeight: 26 },
  'display-sm':  { fontSize: defaultTypography.sizes['3xl'].fontSize, lineHeight: 38, iconSize: 24, iconGap: 10, skeletonHeight: 32 },
  'display-md':  { fontSize: defaultTypography.sizes['4xl'].fontSize, lineHeight: 44, iconSize: 24, iconGap: 10, skeletonHeight: 38 },
  'display-lg':  { fontSize: 48, lineHeight: 60, iconSize: 28, iconGap: 12, skeletonHeight: 50 },
  'display-xl':  { fontSize: 60, lineHeight: 72, iconSize: 32, iconGap: 12, skeletonHeight: 62 },
  'display-2xl': { fontSize: 72, lineHeight: 90, iconSize: 36, iconGap: 14, skeletonHeight: 74 },
};

// ---------------------------------------------------------------------------
// Color resolver -- delegates to shared resolveSemanticColor
// ---------------------------------------------------------------------------

/**
 * Resolves a {@link SemanticColor} variant (or raw CSS color string) to an
 * actual hex value using the current theme palette.
 *
 * @remarks
 * If the provided `color` matches a known semantic variant the corresponding
 * theme token is returned. Otherwise the string is passed through unchanged,
 * allowing consumers to supply arbitrary CSS color values.
 *
 * @param color - A semantic color key or raw CSS color string.
 * @param themeColors - The current theme color tokens.
 * @returns The resolved hex color string.
 */
export function resolveTextColor(color: SemanticColor | string, theme: WispTheme): string {
  const { colors: themeColors } = theme;
  return resolveSemanticColor(color, themeColors);
}

// ---------------------------------------------------------------------------
// Skeleton styles
// ---------------------------------------------------------------------------

/**
 * Generates the inline style for a text skeleton shimmer placeholder.
 *
 * @param size - The {@link TextSize} step (determines skeleton height).
 * @param themeColors - The current theme color tokens.
 * @returns A `CSSStyleObject` object with dimensions, radius, background, and pulse animation.
 */
export function getSkeletonStyle(size: TextSize, theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  const config = sizeMap[size];
  return {
    display: 'inline-block',
    height: config.skeletonHeight,
    width: '100%',
    maxWidth: 200,
    borderRadius: radii.sm,
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}

// ---------------------------------------------------------------------------
// Build the complete text style object
// ---------------------------------------------------------------------------

/**
 * Builds the complete `CSSStyleObject` object for the Text element.
 *
 * @remarks
 * Combines size tokens, weight, family, resolved color, alignment, icon
 * layout, truncation, and multi-line clamping into a single inline-style
 * object.
 *
 * @param opts - Configuration bag:
 *   - `size` -- {@link TextSize} step.
 *   - `weight` -- {@link FontWeightKey}.
 *   - `family` -- {@link FontFamilyKey} stack.
 *   - `color` -- Already-resolved CSS color string.
 *   - `align` -- Optional CSS `text-align` value.
 *   - `truncate` -- Enable single-line ellipsis truncation.
 *   - `maxLines` -- Enable multi-line clamping at N lines.
 *   - `hasIcons` -- Whether icon slots are present (enables flex layout).
 * @returns A `CSSStyleObject` object ready to be spread onto the element.
 */
export function buildTextStyle(opts: {
  size: TextSize;
  weight: FontWeightKey;
  family: FontFamilyKey;
  color: string; // already resolved
  align?: string;
  truncate?: boolean;
  maxLines?: number;
  hasIcons: boolean;
}): CSSStyleObject {
  const sizeConfig = sizeMap[opts.size];
  const style: CSSStyleObject = {
    fontFamily: fontFamilyStacks[opts.family],
    fontSize: sizeConfig.fontSize,
    lineHeight: `${sizeConfig.lineHeight}px`,
    fontWeight: fontWeightValues[opts.weight],
    color: opts.color,
    margin: 0,
    padding: 0,
  };

  if (opts.align) {
    style.textAlign = opts.align as CSSStyleObject['textAlign'];
  }

  // Icon layout — inline-flex with gap
  if (opts.hasIcons) {
    style.display = 'inline-flex';
    style.alignItems = 'center';
    style.gap = sizeConfig.iconGap;
  }

  // Single-line truncation
  // Requires block or inline-block to constrain width for ellipsis
  if (opts.truncate) {
    style.display = opts.hasIcons ? 'flex' : 'block';
    style.overflow = 'hidden';
    style.textOverflow = 'ellipsis';
    style.whiteSpace = 'nowrap';
    style.maxWidth = '100%';
  }

  // Multi-line clamp
  if (opts.maxLines && opts.maxLines > 0) {
    style.display = '-webkit-box';
    style.WebkitBoxOrient = 'vertical' as unknown as CSSStyleObject['WebkitBoxOrient'];
    style.WebkitLineClamp = opts.maxLines;
    style.overflow = 'hidden';
  }

  return style;
}

// ---------------------------------------------------------------------------
// Icon wrapper style
// ---------------------------------------------------------------------------

/**
 * Generates the inline style for an icon wrapper span (left or right icon slot).
 *
 * @remarks
 * Constrains the icon to a fixed square based on the size step's `iconSize`
 * token and centers its content with inline-flex.
 *
 * @param size - The {@link TextSize} step (determines icon dimensions).
 * @returns A `CSSStyleObject` object for the icon wrapper element.
 */
export function getIconStyle(size: TextSize): CSSStyleObject {
  const config = sizeMap[size];
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: config.iconSize,
    height: config.iconSize,
  };
}
