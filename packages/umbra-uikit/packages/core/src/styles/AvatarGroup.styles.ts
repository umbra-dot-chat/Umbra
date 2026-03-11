import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { AvatarSizeConfig } from '../types/Avatar.types';

// ---------------------------------------------------------------------------
// Group container
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the outermost AvatarGroup container.
 *
 * @returns A `CSSStyleObject` with flexbox row layout.
 */
export function buildGroupStyle(): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    flexDirection: 'row',
  };
}

// ---------------------------------------------------------------------------
// Individual avatar wrapper (overlap + ring)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for each avatar wrapper that provides the overlap
 * margin and the ring border so avatars visually separate from the canvas.
 *
 * @param spacing - Overlap distance in pixels (applied as negative margin).
 * @param index - Zero-based position of this avatar in the group.
 * @param total - Total number of visible avatars (used for z-index stacking).
 * @param themeColors - Active theme colour tokens.
 * @returns A `CSSStyleObject` for the wrapper `<div>`.
 */
export function buildAvatarWrapperStyle(
  spacing: number,
  index: number,
  total: number,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    marginLeft: index === 0 ? 0 : -spacing,
    borderRadius: radii.full,
    border: `2px solid ${themeColors.background.canvas}`,
    zIndex: total - index,
    position: 'relative',
    display: 'inline-flex',
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Overflow indicator (+N circle)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the "+N" overflow indicator circle.
 *
 * @param sizeConfig - Pixel dimensions for the avatar size preset.
 * @param spacing - Overlap distance in pixels.
 * @param themeColors - Active theme colour tokens.
 * @returns A `CSSStyleObject` for the overflow `<div>`.
 */
export function buildOverflowStyle(
  sizeConfig: AvatarSizeConfig,
  spacing: number,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii, typography } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeConfig.container,
    height: sizeConfig.container,
    borderRadius: radii.full,
    backgroundColor: themeColors.background.raised,
    color: themeColors.text.onRaised,
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    fontWeight: typography.weights.semibold,
    lineHeight: 1,
    userSelect: 'none',
    marginLeft: -spacing,
    border: `2px solid ${themeColors.background.canvas}`,
    position: 'relative',
    zIndex: 0,
    boxSizing: 'border-box',
  };
}
