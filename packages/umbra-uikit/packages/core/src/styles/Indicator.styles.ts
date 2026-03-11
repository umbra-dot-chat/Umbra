/**
 * @module Indicator
 */
import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { IndicatorVariant, IndicatorState, IndicatorSizeConfig } from '../types/Indicator.types';

// ---------------------------------------------------------------------------
// Variant → color
// ---------------------------------------------------------------------------

/**
 * Resolves the dot color for a given variant.
 */
export function resolveIndicatorColor(
  variant: IndicatorVariant,
  theme: WispTheme,
): string {
  const { colors: themeColors } = theme;
  switch (variant) {
    case 'neutral':
      return themeColors.text.muted;
    case 'success':
      return themeColors.status.success;
    case 'warning':
      return themeColors.status.warning;
    case 'danger':
      return themeColors.status.danger;
    case 'info':
      return themeColors.status.info;
    default:
      return themeColors.status.success;
  }
}

// ---------------------------------------------------------------------------
// Build dot style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the indicator dot.
 */
export function buildIndicatorDotStyle(
  sizeConfig: IndicatorSizeConfig,
  color: string,
  state: IndicatorState,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  const base: CSSStyleObject = {
    width: sizeConfig.dotSize,
    height: sizeConfig.dotSize,
    borderRadius: radii.full,
    flexShrink: 0,
  };

  if (state === 'inactive') {
    return {
      ...base,
      backgroundColor: 'transparent',
      border: `${sizeConfig.borderWidth}px solid ${color}`,
      boxSizing: 'border-box',
    };
  }

  return {
    ...base,
    backgroundColor: color,
    animation: state === 'active' ? 'wisp-indicator-pulse 1.5s ease-in-out infinite' : undefined,
  };
}

// ---------------------------------------------------------------------------
// Container style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the indicator wrapper span.
 */
export function buildIndicatorContainerStyle(): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    lineHeight: 1,
  };
}
