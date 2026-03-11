import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { CircularProgressSizeConfig } from '../types/CircularProgress.types';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

/**
 * Resolved colour tokens consumed by the CircularProgress style builders.
 */
export interface CircularProgressColors {
  /** Background colour of the track ring. */
  track: string;
  /** Colour of the active progress arc. */
  indicator: string;
  /** Colour of the center value text. */
  valueText: string;
  /** Colour of the label text below the ring. */
  labelText: string;
}

/**
 * Resolves the semantic colour variant into concrete colour values.
 *
 * @param color - The semantic colour variant chosen by the consumer.
 * @param themeColors - Current {@link ThemeColors} from the active theme.
 * @returns A {@link CircularProgressColors} object with track, indicator, and text colours.
 */
export function resolveCircularProgressColors(
  color: 'default' | 'success' | 'warning' | 'danger' | 'info',
  theme: WispTheme,
): CircularProgressColors {
  const { colors: themeColors } = theme;
  const track = themeColors.border.subtle;
  const valueText = themeColors.text.primary;
  const labelText = themeColors.text.secondary;

  switch (color) {
    case 'success':
      return { track, indicator: themeColors.status.success, valueText, labelText };
    case 'warning':
      return { track, indicator: themeColors.status.warning, valueText, labelText };
    case 'danger':
      return { track, indicator: themeColors.status.danger, valueText, labelText };
    case 'info':
      return { track, indicator: themeColors.status.info, valueText, labelText };
    case 'default':
    default:
      return { track, indicator: themeColors.accent.primary, valueText, labelText };
  }
}

// ---------------------------------------------------------------------------
// Keyframe injection -- inject once per document
// ---------------------------------------------------------------------------

/** Tracks whether the circular-progress keyframe stylesheet has been injected. */
let circularProgressStyleInjected = false;

/**
 * Injects the `wisp-circular-progress-spin` `@keyframes` rule into the document head.
 *
 * @remarks
 * This function is idempotent -- subsequent calls after the first are no-ops.
 * It is also SSR-safe: if `document` is not defined the call is skipped.
 */
export function ensureCircularProgressKeyframes(): void {
  if (circularProgressStyleInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `@keyframes wisp-circular-progress-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
  circularProgressStyleInjected = true;
}

// ---------------------------------------------------------------------------
// Wrapper style -- inline-flex column with optional gap for label
// ---------------------------------------------------------------------------

/**
 * Builds the outer wrapper style (column flex layout with optional gap for the label).
 *
 * @param hasLabel - Whether a text label is rendered below the ring.
 * @returns A `CSSStyleObject` object for the root wrapper `div`.
 */
export function buildWrapperStyle(
  hasLabel: boolean,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: hasLabel ? 6 : 0,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// SVG container style -- relative positioning for center content overlay
// ---------------------------------------------------------------------------

/**
 * Builds the relative-positioned container for the full-circle SVG and its
 * center content overlay.
 *
 * @param sizeConfig - Resolved {@link CircularProgressSizeConfig} for the current size.
 * @returns A `CSSStyleObject` object sized to the SVG viewport.
 */
export function buildSvgContainerStyle(
  sizeConfig: CircularProgressSizeConfig,
): CSSStyleObject {
  return {
    position: 'relative',
    width: sizeConfig.size,
    height: sizeConfig.size,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Half-variant SVG container -- clips height to half
// ---------------------------------------------------------------------------

/**
 * Builds the SVG container for the half-circle (gauge) variant.
 *
 * @remarks
 * The container clips to approximately half the ring height plus the stroke
 * width so that only the upper semicircle arc is visible.
 *
 * @param sizeConfig - Resolved {@link CircularProgressSizeConfig} for the current size.
 * @returns A `CSSStyleObject` object with `overflow: hidden` and halved height.
 */
export function buildHalfSvgContainerStyle(
  sizeConfig: CircularProgressSizeConfig,
): CSSStyleObject {
  // The half-circle gauge only shows the top half of the SVG
  return {
    position: 'relative',
    width: sizeConfig.size,
    height: sizeConfig.size / 2 + sizeConfig.strokeWidth,
    flexShrink: 0,
    overflow: 'hidden',
  };
}

// ---------------------------------------------------------------------------
// SVG element style
// ---------------------------------------------------------------------------

/**
 * Builds the style for the `<svg>` element itself.
 *
 * @param sizeConfig - Resolved {@link CircularProgressSizeConfig} for the current size.
 * @param indeterminate - When `true`, applies a continuous spin animation.
 * @returns A `CSSStyleObject` object with dimensions and optional animation.
 */
export function buildSvgStyle(
  sizeConfig: CircularProgressSizeConfig,
  indeterminate: boolean,
): CSSStyleObject {
  return {
    width: sizeConfig.size,
    height: sizeConfig.size,
    display: 'block',
    ...(indeterminate && {
      animation: 'wisp-circular-progress-spin 1.2s linear infinite',
    }),
  };
}

// ---------------------------------------------------------------------------
// Center content style -- absolutely positioned in the middle of the ring
// ---------------------------------------------------------------------------

/**
 * Builds the absolutely-positioned overlay for center content (full variant).
 *
 * @param sizeConfig - Resolved {@link CircularProgressSizeConfig} for the current size.
 * @param colors - Resolved {@link CircularProgressColors} (reserved for future use).
 * @returns A `CSSStyleObject` object centred within the SVG container.
 */
export function buildCenterContentStyle(
  sizeConfig: CircularProgressSizeConfig,
  colors: CircularProgressColors,
): CSSStyleObject {
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    width: sizeConfig.size,
    height: sizeConfig.size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  };
}

// ---------------------------------------------------------------------------
// Half-variant center content -- vertically adjusted for the half-height
// ---------------------------------------------------------------------------

/**
 * Builds the absolutely-positioned overlay for center content (half variant).
 *
 * @remarks
 * Uses the full SVG height so that the content aligns with the visual centre
 * of the semicircle arc.
 *
 * @param sizeConfig - Resolved {@link CircularProgressSizeConfig} for the current size.
 * @param colors - Resolved {@link CircularProgressColors} (reserved for future use).
 * @returns A `CSSStyleObject` object centred within the full-height area.
 */
export function buildHalfCenterContentStyle(
  sizeConfig: CircularProgressSizeConfig,
  colors: CircularProgressColors,
): CSSStyleObject {
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    width: sizeConfig.size,
    height: sizeConfig.size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  };
}

// ---------------------------------------------------------------------------
// Value text style -- numeric percentage label
// ---------------------------------------------------------------------------

/**
 * Builds the style for the centre value `span` inside the ring.
 *
 * @param sizeConfig - Resolved {@link CircularProgressSizeConfig} for the current size.
 * @param colors - Resolved {@link CircularProgressColors}.
 * @returns A `CSSStyleObject` object for the value text.
 */
export function buildValueTextStyle(
  sizeConfig: CircularProgressSizeConfig,
  colors: CircularProgressColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    fontWeight: typography.weights.semibold,
    lineHeight: 1,
    color: colors.valueText,
    margin: 0,
    padding: 0,
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Label text style -- text below the ring
// ---------------------------------------------------------------------------

/**
 * Builds the style for the label `span` rendered below the ring.
 *
 * @param sizeConfig - Resolved {@link CircularProgressSizeConfig} for the current size.
 * @param colors - Resolved {@link CircularProgressColors}.
 * @returns A `CSSStyleObject` object for the label text.
 */
export function buildLabelTextStyle(
  sizeConfig: CircularProgressSizeConfig,
  colors: CircularProgressColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: Math.max(sizeConfig.fontSize - 2, 10),
    fontWeight: typography.weights.medium,
    lineHeight: 1.4,
    color: colors.labelText,
    margin: 0,
    padding: 0,
    userSelect: 'none',
    textAlign: 'center',
  };
}
