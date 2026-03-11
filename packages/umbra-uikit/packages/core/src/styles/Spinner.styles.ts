import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { SpinnerSizeConfig } from '../types/Spinner.types';

// ---------------------------------------------------------------------------
// Keyframe injection -- inject once per document
// ---------------------------------------------------------------------------

/** Tracks whether the spinner keyframe stylesheet has already been injected. */
let spinnerStyleInjected = false;

/**
 * Injects the `wisp-spinner-spin` `@keyframes` rule into the document head.
 *
 * @remarks
 * This function is idempotent -- subsequent calls after the first are no-ops.
 * It is also SSR-safe: if `document` is not defined the call is skipped.
 */
export function ensureSpinnerKeyframes(): void {
  if (spinnerStyleInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `@keyframes wisp-spinner-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
  spinnerStyleInjected = true;
}

// ---------------------------------------------------------------------------
// Container style -- flex wrapper for spinner + optional label
// ---------------------------------------------------------------------------

/**
 * Builds the inline-flex container style for the spinner and optional label.
 *
 * @param sizeConfig - Resolved {@link SpinnerSizeConfig} for the current size.
 * @param hasLabel - Whether a text label is present, which adds a gap.
 * @returns A `CSSStyleObject` object for the outer wrapper `div`.
 */
export function buildSpinnerContainerStyle(
  sizeConfig: SpinnerSizeConfig,
  hasLabel: boolean,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hasLabel ? sizeConfig.gap : 0,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// SVG style -- spinning animation
// ---------------------------------------------------------------------------

/**
 * Builds the style for the rotating SVG element.
 *
 * @param sizeConfig - Resolved {@link SpinnerSizeConfig} for the current size.
 * @returns A `CSSStyleObject` object with dimensions and continuous rotation animation.
 */
export function buildSvgStyle(sizeConfig: SpinnerSizeConfig): CSSStyleObject {
  return {
    width: sizeConfig.size,
    height: sizeConfig.size,
    animation: 'wisp-spinner-spin 0.8s linear infinite',
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Label style
// ---------------------------------------------------------------------------

/**
 * Builds the style for the optional label `span` beside the spinner.
 *
 * @param sizeConfig - Resolved {@link SpinnerSizeConfig} for the current size.
 * @param themeColors - Current {@link ThemeColors} for colour resolution.
 * @returns A `CSSStyleObject` object for the label text.
 */
export function buildLabelStyle(
  sizeConfig: SpinnerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.labelFontSize,
    lineHeight: 1.4,
    fontWeight: typography.weights.medium,
    color: themeColors.text.muted,
    margin: 0,
    padding: 0,
    userSelect: 'none',
  };
}
