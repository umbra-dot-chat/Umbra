import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { ProgressSizeConfig } from '../types/Progress.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

/**
 * Resolved colour tokens consumed by the Progress style builders.
 */
export interface ProgressColors {
  /** Background colour of the track bar. */
  track: string;
  /** Colour of the filled (progress) portion. */
  fill: string;
  /** Colour of the label text. */
  label: string;
  /** Colour of the value text. */
  value: string;
}

/**
 * Resolves the semantic color variant into concrete colour values.
 *
 * @param color - The semantic colour variant chosen by the consumer.
 * @param themeColors - Current {@link ThemeColors} from the active theme.
 * @returns A {@link ProgressColors} object with track, fill, label, and value colours.
 */
export function resolveProgressColors(
  color: 'default' | 'success' | 'warning' | 'danger' | 'info',
  theme: WispTheme,
): ProgressColors {
  const { colors: themeColors } = theme;
  // Use border.strong for better track visibility against card backgrounds
  const track = themeColors.border.strong;
  const label = themeColors.text.primary;
  const value = themeColors.text.secondary;

  switch (color) {
    case 'success':
      return { track, fill: themeColors.status.success, label, value };
    case 'warning':
      return { track, fill: themeColors.status.warning, label, value };
    case 'danger':
      return { track, fill: themeColors.status.danger, label, value };
    case 'info':
      return { track, fill: themeColors.status.info, label, value };
    case 'default':
    default:
      return { track, fill: themeColors.text.primary, label, value };
  }
}

// ---------------------------------------------------------------------------
// Track style -- the background bar (full width, rounded)
// ---------------------------------------------------------------------------

/**
 * Builds the style for the background track bar.
 *
 * @param sizeConfig - Resolved {@link ProgressSizeConfig} for the current size.
 * @param colors - Resolved {@link ProgressColors}.
 * @returns A `CSSStyleObject` object for the track container.
 */
export function buildTrackStyle(
  sizeConfig: ProgressSizeConfig,
  colors: ProgressColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    position: 'relative',
    width: '100%',
    height: sizeConfig.height,
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: colors.track,
    overflow: 'hidden',
  };
}

// ---------------------------------------------------------------------------
// Fill style -- the filled portion (determinate)
// ---------------------------------------------------------------------------

/**
 * Builds the style for the determinate fill bar.
 *
 * @param sizeConfig - Resolved {@link ProgressSizeConfig} for the current size.
 * @param colors - Resolved {@link ProgressColors}.
 * @param percent - Current progress as a percentage (0--100).
 * @returns A `CSSStyleObject` object with an animated width transition.
 */
export function buildFillStyle(
  sizeConfig: ProgressSizeConfig,
  colors: ProgressColors,
  percent: number,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    height: '100%',
    width: `${percent}%`,
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: colors.fill,
    transition: `width ${durations.slow}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Indeterminate fill style -- animated sliding bar
// ---------------------------------------------------------------------------

/**
 * Builds the style for the indeterminate (sliding) fill bar.
 *
 * @param sizeConfig - Resolved {@link ProgressSizeConfig} for the current size.
 * @param colors - Resolved {@link ProgressColors}.
 * @returns A `CSSStyleObject` object with a continuous sliding animation.
 */
export function buildIndeterminateFillStyle(
  sizeConfig: ProgressSizeConfig,
  colors: ProgressColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    height: '100%',
    width: '40%',
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: colors.fill,
    animation: 'wisp-progress-indeterminate 1.5s ease-in-out infinite',
  };
}

// ---------------------------------------------------------------------------
// Label row style -- flex row for label + percentage value
// ---------------------------------------------------------------------------

/**
 * Builds the flex-row style for the label and value text above the bar.
 *
 * @returns A `CSSStyleObject` object with space-between justification.
 */
export function buildLabelRowStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  };
}

// ---------------------------------------------------------------------------
// Label text style
// ---------------------------------------------------------------------------

/**
 * Builds the style for the label `span` above the track.
 *
 * @param sizeConfig - Resolved {@link ProgressSizeConfig} for the current size.
 * @param colors - Resolved {@link ProgressColors}.
 * @returns A `CSSStyleObject` object for the label text.
 */
export function buildLabelTextStyle(
  sizeConfig: ProgressSizeConfig,
  colors: ProgressColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.labelFontSize,
    lineHeight: 1.4,
    fontWeight: typography.weights.medium,
    color: colors.label,
    margin: 0,
    padding: 0,
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Value text style
// ---------------------------------------------------------------------------

/**
 * Builds the style for the formatted value `span` above the track.
 *
 * @param sizeConfig - Resolved {@link ProgressSizeConfig} for the current size.
 * @param colors - Resolved {@link ProgressColors}.
 * @returns A `CSSStyleObject` object for the value text.
 */
export function buildValueTextStyle(
  sizeConfig: ProgressSizeConfig,
  colors: ProgressColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.valueFontSize,
    lineHeight: 1.4,
    fontWeight: typography.weights.medium,
    color: colors.value,
    margin: 0,
    padding: 0,
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Skeleton style -- track-shaped loading placeholder
// ---------------------------------------------------------------------------

/**
 * Builds the skeleton placeholder style that mimics the track shape.
 *
 * @param sizeConfig - Resolved {@link ProgressSizeConfig} for the current size.
 * @param themeColors - Current {@link ThemeColors} for colour resolution.
 * @returns A `CSSStyleObject` object with a pulsing animation.
 */
export function getProgressSkeletonStyle(
  sizeConfig: ProgressSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'block',
    width: '100%',
    height: sizeConfig.height,
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
