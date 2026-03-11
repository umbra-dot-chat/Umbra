/**
 * Style builders for the {@link WebhookCreateDialog} component.
 *
 * @module components/webhook-create-dialog
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

/**
 * Build the overlay backdrop style.
 */
export function buildDialogOverlayStyle(): CSSStyleObject {
  return {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };
}

// ---------------------------------------------------------------------------
// Dialog container
// ---------------------------------------------------------------------------

/**
 * Build the dialog container style.
 */
export function buildDialogContainerStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    fontFamily: fontFamilyStacks.sans,
    backgroundColor: themeColors.background.surface,
    borderRadius: radii.lg,
    border: `1px solid ${themeColors.border.subtle}`,
    width: '100%',
    maxWidth: 480,
    maxHeight: '85vh',
    overflow: 'hidden',
  };
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

/**
 * Build the dialog header style.
 */
export function buildDialogHeaderStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.md}px ${spacing.lg}px`,
    borderBottom: `1px solid ${themeColors.border.subtle}`,
  };
}

/**
 * Build the dialog title style.
 */
export function buildDialogTitleStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: 16,
    fontWeight: typography.weights.semibold,
    color: themeColors.text.primary,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Body
// ---------------------------------------------------------------------------

/**
 * Build the dialog body style.
 */
export function buildDialogBodyStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    padding: `${spacing.lg}px`,
    overflowY: 'auto',
  };
}

// ---------------------------------------------------------------------------
// Form field
// ---------------------------------------------------------------------------

/**
 * Build the form label style.
 */
export function buildDialogLabelStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: 13,
    fontWeight: typography.weights.medium,
    color: themeColors.text.secondary,
    marginBottom: 4,
    display: 'block',
  };
}

/**
 * Build the form input style.
 */
export function buildDialogInputStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = theme;
  return {
    width: '100%',
    padding: `${spacing.xs}px ${spacing.sm}px`,
    fontSize: 14,
    fontFamily: fontFamilyStacks.sans,
    backgroundColor: themeColors.background.sunken,
    color: themeColors.text.primary,
    border: `1px solid ${themeColors.border.subtle}`,
    borderRadius: radii.md,
    outline: 'none',
    boxSizing: 'border-box',
  };
}

/**
 * Build the form select style.
 */
export function buildDialogSelectStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = theme;
  return {
    width: '100%',
    padding: `${spacing.xs}px ${spacing.sm}px`,
    fontSize: 14,
    fontFamily: fontFamilyStacks.sans,
    backgroundColor: themeColors.background.sunken,
    color: themeColors.text.primary,
    border: `1px solid ${themeColors.border.subtle}`,
    borderRadius: radii.md,
    outline: 'none',
    boxSizing: 'border-box',
    appearance: 'none',
  };
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

/**
 * Build the error message style.
 */
export function buildDialogErrorStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: 13,
    fontWeight: typography.weights.regular,
    color: themeColors.status.danger,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

/**
 * Build the dialog footer style.
 */
export function buildDialogFooterStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    padding: `${spacing.md}px ${spacing.lg}px`,
    borderTop: `1px solid ${themeColors.border.subtle}`,
  };
}

/**
 * Build a primary action button style.
 */
export function buildDialogPrimaryButtonStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography, radii, spacing } = theme;
  return {
    padding: `${spacing.xs}px ${spacing.md}px`,
    fontSize: 13,
    fontFamily: fontFamilyStacks.sans,
    fontWeight: typography.weights.medium,
    color: themeColors.background.canvas,
    backgroundColor: themeColors.text.primary,
    border: 'none',
    borderRadius: radii.md,
    cursor: 'pointer',
  };
}

/**
 * Build a secondary action button style.
 */
export function buildDialogSecondaryButtonStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography, radii, spacing } = theme;
  return {
    padding: `${spacing.xs}px ${spacing.md}px`,
    fontSize: 13,
    fontFamily: fontFamilyStacks.sans,
    fontWeight: typography.weights.medium,
    color: themeColors.text.secondary,
    backgroundColor: 'transparent',
    border: `1px solid ${themeColors.border.subtle}`,
    borderRadius: radii.md,
    cursor: 'pointer',
  };
}

// ---------------------------------------------------------------------------
// Close button
// ---------------------------------------------------------------------------

/**
 * Build the close button style.
 */
export function buildDialogCloseButtonStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: themeColors.text.muted,
    borderRadius: 4,
  };
}
