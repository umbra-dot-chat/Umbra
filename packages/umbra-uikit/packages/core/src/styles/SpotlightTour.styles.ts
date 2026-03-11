/**
 * @module components/spotlight-tour
 * @description Style builders for the Wisp SpotlightTour component.
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { SpotlightTourVariant } from '../types/SpotlightTour.types';
import { fontFamilyStacks } from '../tokens/shared';
import { zIndex } from '../tokens/z-index';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

/**
 * Builds the SVG overlay style (fixed fullscreen).
 */
export function buildSpotlightOverlayStyle(): CSSStyleObject {
  return {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: zIndex.overlay,
    pointerEvents: 'auto',
  };
}

// ---------------------------------------------------------------------------
// Popover panel
// ---------------------------------------------------------------------------

/**
 * Builds the step popover panel style.
 */
export function buildSpotlightPopoverStyle(
  theme: WispTheme,
  _variant: SpotlightTourVariant,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: themeColors.background.canvas,
    border: `1px solid ${themeColors.border.subtle}`,
    borderRadius: radii.lg,
    fontFamily: fontFamilyStacks.sans,
    maxWidth: 360,
    boxShadow: '0 8px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)',
    animation: 'wisp-spotlight-in 200ms ease-out',
    zIndex: zIndex.tooltip,
  };
}

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------

/**
 * Builds the title style.
 */
export function buildSpotlightTitleStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.base.fontSize,
    fontWeight: typography.weights.semibold,
    lineHeight: 1.4,
    color: themeColors.text.primary,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Description
// ---------------------------------------------------------------------------

/**
 * Builds the description style.
 */
export function buildSpotlightDescriptionStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.regular,
    lineHeight: 1.46,
    color: themeColors.text.secondary,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

/**
 * Builds the footer style (step count + nav buttons).
 */
export function buildSpotlightFooterStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xs,
  };
}

// ---------------------------------------------------------------------------
// Step counter
// ---------------------------------------------------------------------------

/**
 * Builds the step counter text style.
 */
export function buildSpotlightStepCountStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.medium,
    color: themeColors.text.muted,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Navigation buttons
// ---------------------------------------------------------------------------

/**
 * Builds the navigation button style (prev/next/finish).
 */
export function buildSpotlightNavButtonStyle(
  theme: WispTheme,
  primary: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing, typography } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.sm}px ${spacing.lg}px`,
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: 1,
    borderRadius: radii.md,
    border: primary ? 'none' : `1px solid ${themeColors.border.subtle}`,
    backgroundColor: primary ? themeColors.text.primary : 'transparent',
    color: primary ? themeColors.background.canvas : themeColors.text.primary,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: `opacity ${durations.fast}ms ${easings.easeOut.css}`,
  };
}
