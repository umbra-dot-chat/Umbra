import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { ImageFit, ImageRadius } from '../types/Image.types';
import { imageRadiusMap } from '../types/Image.types';

// ---------------------------------------------------------------------------
// Wrapper style — clips image to shape, provides aspect-ratio and bg
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the outermost image wrapper `<div>`.
 *
 * @param radius - Border-radius preset for the wrapper.
 * @param aspectRatio - Optional CSS `aspect-ratio` value (e.g. `'16/9'`).
 * @param themeColors - Active theme colour tokens.
 * @returns A `CSSStyleObject` for the wrapper `<div>`.
 */
export function buildWrapperStyle(
  radius: ImageRadius,
  aspectRatio: string | undefined,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radii[imageRadiusMap[radius]],
    display: 'inline-block',
    backgroundColor: themeColors.border.subtle,
    ...(aspectRatio ? { aspectRatio, width: '100%' } : {}),
  };
}

// ---------------------------------------------------------------------------
// Image element style — fills wrapper, transitions opacity on load
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the `<img>` element inside the wrapper.
 *
 * @param objectFit - How the image should fill its container.
 * @param loaded - Whether the image has finished loading.
 * @returns A `CSSStyleObject` for the `<img>` element.
 */
export function buildImageStyle(
  objectFit: ImageFit,
  loaded: boolean,
): CSSStyleObject {
  return {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit,
    opacity: loaded ? 1 : 0,
    transition: 'opacity 0.2s ease-in-out',
  };
}

// ---------------------------------------------------------------------------
// Fallback style — absolute fill, centred content
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the error-fallback overlay.
 *
 * @param themeColors - Active theme colour tokens.
 * @returns A `CSSStyleObject` for the fallback `<div>`.
 */
export function buildFallbackStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.border.subtle,
    color: themeColors.text.muted,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Skeleton style — absolute fill with pulsing animation
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the skeleton loading placeholder.
 *
 * @param themeColors - Active theme colour tokens.
 * @returns A `CSSStyleObject` with a pulsing animation overlaying the wrapper.
 */
export function buildSkeletonStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
