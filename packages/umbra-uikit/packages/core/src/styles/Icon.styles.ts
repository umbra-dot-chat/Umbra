import type { CSSStyleObject } from '../types';
import type { ComponentSize, SemanticColor } from '../tokens/shared';
import { resolveSemanticColor } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import { iconSizeMap } from '../types/Icon.types';

/**
 * Resolves the icon fill/stroke color from a color descriptor and theme.
 *
 * @remarks
 * - `'currentColor'` -- inherits from parent (most common for inline icons).
 * - Semantic name (e.g. `'error'`, `'success'`) -- resolved via theme tokens.
 * - Raw CSS color string (e.g. `'#ff0000'`) -- passed through unchanged.
 *
 * @param color - Color descriptor: a semantic name, `'currentColor'`, or a raw CSS color.
 * @param themeColors - Resolved theme color tokens.
 * @returns A CSS color string ready for the Lucide icon's `color` prop.
 */
export function resolveIconColor(
  color: SemanticColor | 'currentColor' | string,
  theme: WispTheme,
): string {
  const { colors: themeColors } = theme;
  if (color === 'currentColor') return 'currentColor';
  return resolveSemanticColor(color, themeColors);
}

/**
 * Builds the inline-flex container style for the Icon wrapper `<span>`.
 *
 * @param size - Component size preset used to look up pixel dimensions in {@link iconSizeMap}.
 * @returns A `CSSStyleObject` object that centers the SVG icon and
 *   prevents the container from shrinking in flex layouts.
 */
export function buildIconStyle(size: ComponentSize): CSSStyleObject {
  const px = iconSizeMap[size];
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: px,
    height: px,
    lineHeight: 0, // prevent extra space from inline elements
  };
}

/**
 * Builds the skeleton placeholder style shown while the icon is loading.
 *
 * @remarks
 * Produces a slightly rounded square with a pulsing background animation
 * (`wisp-skeleton-pulse`). Dimensions match the corresponding icon size.
 *
 * @param size - Component size preset used to look up pixel dimensions in {@link iconSizeMap}.
 * @param themeColors - Resolved theme color tokens (used for the placeholder background).
 * @returns A `CSSStyleObject` object for the skeleton `<span>`.
 */
export function getIconSkeletonStyle(size: ComponentSize, theme: WispTheme): CSSStyleObject {
  const { colors: themeColors } = theme;
  const px = iconSizeMap[size];
  return {
    display: 'inline-block',
    width: px,
    height: px,
    borderRadius: px * 0.25, // slightly rounded square
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
