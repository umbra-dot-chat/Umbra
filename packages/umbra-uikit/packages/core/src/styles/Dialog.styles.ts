/**
 * Style builders for the Wisp Dialog primitive.
 *
 * @module primitives/dialog/styles
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import type { DialogSize } from '../types/Dialog.types';
import { dialogSizeMap } from '../types/Dialog.types';
import { fontFamilyStacks, glassStyle } from '../tokens/shared';
import type { SurfaceVariant } from '../tokens/shared';
import { zIndex } from '../tokens/z-index';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the full-viewport overlay backdrop.
 *
 * @param themeColors - Resolved theme colour tokens.
 * @returns A `CSSStyleObject` object for the overlay element.
 */
export function buildOverlayStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: zIndex.modal,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.background.overlay,
    padding: spacing.xl,
  };
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the dialog panel container.
 *
 * @param size - The width preset (maps to a max-width value).
 * @param themeColors - Resolved theme colour tokens.
 * @param variant - Surface variant (`'solid'` | `'glass'`). Defaults to `'solid'`.
 * @returns A `CSSStyleObject` object for the panel element.
 */
export function buildPanelStyle(
  size: DialogSize,
  theme: WispTheme,
  variant: SurfaceVariant = 'solid',
  forceMode?: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: dialogSizeMap[size],
    maxHeight: 'calc(100vh - 48px)',
    backgroundColor: themeColors.background.canvas,
    border: '1px solid ' + themeColors.border.subtle,
    borderRadius: radii.xl,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    outline: 'none',
    overflow: 'hidden',
    ...(variant === 'glass' ? glassStyle : undefined),
  };
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the dialog header row (title + close button).
 *
 * @returns A `CSSStyleObject` object for the header container.
 */
export function buildHeaderStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: `${spacing.xl}px ${spacing.xl}px ${spacing.lg}px ${spacing.xl}px`,
    gap: spacing.md,
    flexShrink: 0,
  };
}

/**
 * Builds inline styles for the dialog title heading.
 *
 * @param themeColors - Resolved theme colour tokens.
 * @returns A `CSSStyleObject` object for the title element.
 */
export function buildTitleStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    margin: 0,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.lg.fontSize,
    fontWeight: typography.weights.semibold,
    lineHeight: `${typography.sizes.lg.lineHeight}px`,
    color: themeColors.text.primary,
  };
}

/**
 * Builds inline styles for the optional description paragraph below the title.
 *
 * @param themeColors - Resolved theme colour tokens.
 * @returns A `CSSStyleObject` object for the description element.
 */
export function buildDescriptionStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, spacing, typography } = theme;
  return {
    margin: `${spacing.xs}px 0 0 0`,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.regular,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    color: themeColors.text.secondary,
  };
}

// ---------------------------------------------------------------------------
// Close button
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the close (X) button in its default state.
 *
 * @param themeColors - Resolved theme colour tokens.
 * @returns A `CSSStyleObject` object for the close button.
 */
export function buildCloseButtonStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    padding: 0,
    margin: 0,
    border: 'none',
    borderRadius: radii.md,
    backgroundColor: 'transparent',
    color: themeColors.text.secondary,
    cursor: 'pointer',
    flexShrink: 0,
    marginLeft: spacing.sm,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

/**
 * Builds inline style overrides for the close button on hover.
 *
 * @param themeColors - Resolved theme colour tokens.
 * @returns A `CSSStyleObject` object to merge on hover.
 */
export function buildCloseButtonHoverStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    backgroundColor: themeColors.accent.highlight,
    color: themeColors.text.primary,
  };
}

// ---------------------------------------------------------------------------
// Body
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the scrollable body area of the dialog.
 *
 * @returns A `CSSStyleObject` object for the body container.
 */
export function buildBodyStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    padding: spacing.xl,
    overflowY: 'auto',
    flex: 1,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the dialog footer (action buttons row).
 *
 * @param themeColors - Resolved theme colour tokens.
 * @returns A `CSSStyleObject` object for the footer container.
 */
export function buildFooterStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.lg}px ${spacing.xl}px`,
    borderTop: '1px solid ' + themeColors.border.subtle,
    flexShrink: 0,
  };
}
