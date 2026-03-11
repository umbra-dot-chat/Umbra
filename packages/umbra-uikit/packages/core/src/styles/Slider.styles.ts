import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { SliderSizeConfig } from '../types/Slider.types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Slider color tokens
// ---------------------------------------------------------------------------

/**
 * Resolved color tokens for the slider track, thumb, and label text.
 *
 * @remarks
 * Produced by {@link resolveSliderColors} based on the disabled state
 * and the active {@link ThemeColors}.
 */
export interface SliderColors {
  /** Background color of the unfilled track. */
  track: string;
  /** Background color of the filled (active) portion of the track. */
  trackFilled: string;
  /** Background color of the draggable thumb circle. */
  thumb: string;
  /** Border color of the thumb circle. */
  thumbBorder: string;
  /** Box-shadow applied to the thumb for depth. */
  thumbShadow: string;
  /** Text color for the label. */
  label: string;
  /** Text color for the current-value display. */
  value: string;
}

// ---------------------------------------------------------------------------
// Resolve slider colors
// ---------------------------------------------------------------------------

/**
 * Derives the full {@link SliderColors} palette for the slider.
 *
 * @param disabled - Whether the slider is disabled.
 * @param themeColors - Active theme color tokens.
 * @returns A complete {@link SliderColors} object for styling the slider.
 */
export function resolveSliderColors(
  disabled: boolean,
  theme: WispTheme,
): SliderColors {
  const { colors: themeColors } = theme;
  if (disabled) {
    return {
      track: themeColors.border.subtle,
      trackFilled: themeColors.text.muted,
      thumb: themeColors.text.muted,
      thumbBorder: 'transparent',
      thumbShadow: 'none',
      label: themeColors.text.muted,
      value: themeColors.text.muted,
    };
  }

  return {
    track: themeColors.border.strong,
    trackFilled: themeColors.accent.primary,
    thumb: themeColors.accent.primary,
    thumbBorder: 'transparent',
    thumbShadow: '0 1px 3px rgba(0,0,0,0.25)',
    label: themeColors.text.primary,
    value: themeColors.text.secondary,
  };
}

// ---------------------------------------------------------------------------
// Track style (background bar)
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the full-width track background bar.
 *
 * @param sizeConfig - Dimension config for the current size tier.
 * @param colors - Resolved color tokens from {@link resolveSliderColors}.
 * @returns `CSSStyleObject` for the track `<div>` element.
 */
export function buildTrackStyle(
  sizeConfig: SliderSizeConfig,
  colors: SliderColors,
): CSSStyleObject {
  return {
    position: 'relative',
    width: '100%',
    height: sizeConfig.trackHeight,
    borderRadius: sizeConfig.trackRadius,
    backgroundColor: colors.track,
    cursor: 'pointer',
  };
}

// ---------------------------------------------------------------------------
// Filled track style (accent portion)
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the filled (accent) portion of the track.
 *
 * @param sizeConfig - Dimension config for the current size tier.
 * @param colors - Resolved color tokens from {@link resolveSliderColors}.
 * @param percent - Current value expressed as a percentage (0--100).
 * @returns `CSSStyleObject` for the filled-track `<div>` element.
 */
export function buildFilledTrackStyle(
  sizeConfig: SliderSizeConfig,
  colors: SliderColors,
  percent: number,
): CSSStyleObject {
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    height: sizeConfig.trackHeight,
    width: `${percent}%`,
    borderRadius: sizeConfig.trackRadius,
    backgroundColor: colors.trackFilled,
    pointerEvents: 'none',
  };
}

// ---------------------------------------------------------------------------
// Thumb style (draggable circle)
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the draggable thumb circle.
 *
 * @remarks
 * The thumb is absolutely positioned along the track at `percent` and
 * translated by half its diameter so it remains centered over the value.
 *
 * @param sizeConfig - Dimension config for the current size tier.
 * @param colors - Resolved color tokens from {@link resolveSliderColors}.
 * @param percent - Current value expressed as a percentage (0--100).
 * @returns `CSSStyleObject` for the thumb `<div>` element.
 */
export function buildThumbStyle(
  sizeConfig: SliderSizeConfig,
  colors: SliderColors,
  percent: number,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  const thumbOffset = sizeConfig.thumbSize / 2;
  return {
    position: 'absolute',
    top: '50%',
    left: `${percent}%`,
    width: sizeConfig.thumbSize,
    height: sizeConfig.thumbSize,
    borderRadius: radii.full,
    backgroundColor: colors.thumb,
    border: `2px solid ${colors.thumbBorder}`,
    boxShadow: colors.thumbShadow,
    boxSizing: 'border-box',
    transform: `translate(-${thumbOffset}px, -50%)`,
    cursor: 'grab',
    outline: 'none',
    transition: `box-shadow ${durations.fast}ms ${easings.easeOut.css}`,
    zIndex: 1,
  };
}

// ---------------------------------------------------------------------------
// Label row style (label + value text)
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the label row above the track (label + value).
 *
 * @returns `CSSStyleObject` for the label-row `<div>` element.
 */
export function buildLabelRowStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Track wrapper style (contains track + thumb, adds click area)
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the track wrapper that holds the track and thumb.
 *
 * @remarks
 * The wrapper is taller than the visual track so the click/touch target
 * is large enough for comfortable interaction on all devices.
 *
 * @param sizeConfig - Dimension config for the current size tier.
 * @param disabled - Whether the slider is disabled (affects cursor).
 * @returns `CSSStyleObject` for the track-wrapper `<div>` element.
 */
export function buildTrackWrapperStyle(
  sizeConfig: SliderSizeConfig,
  disabled: boolean,
): CSSStyleObject {
  // Make the click target taller than the visual track for easier interaction
  const minHeight = Math.max(sizeConfig.thumbSize, sizeConfig.trackHeight);
  return {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: minHeight,
    cursor: disabled ? 'not-allowed' : 'pointer',
    touchAction: 'none',
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Skeleton style
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the slider skeleton loading placeholder.
 *
 * @param sizeConfig - Dimension config for the current size tier.
 * @param themeColors - Active theme color tokens (used for the pulse background).
 * @returns `CSSStyleObject` for the skeleton `<div>` element.
 */
export function getSliderSkeletonStyle(
  sizeConfig: SliderSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    display: 'block',
    width: '100%',
    height: sizeConfig.trackHeight,
    borderRadius: sizeConfig.trackRadius,
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
