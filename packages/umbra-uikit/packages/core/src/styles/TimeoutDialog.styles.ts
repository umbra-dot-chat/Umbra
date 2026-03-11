/**
 * @module styles/TimeoutDialog
 * @description Pure style-builder functions for the TimeoutDialog component.
 *
 * A dialog for temporarily timing out (muting) a community member.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Dialog body
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the dialog body containing the timeout form.
 */
export function buildDialogBodyStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
    padding: `0 ${spacing.xl}px ${spacing.lg}px`,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Member info row
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the member info row (avatar + name).
 */
export function buildMemberInfoStyle(theme: WispTheme): CSSStyleObject {
  const { spacing, typography, colors } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    color: colors.text.primary,
  };
}

// ---------------------------------------------------------------------------
// Field group
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for a vertical field group (label + input).
 */
export function buildFieldGroupStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  };
}

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for field labels.
 */
export function buildLabelStyle(theme: WispTheme): CSSStyleObject {
  const { typography, colors } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    color: colors.text.secondary,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Error message
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the error message text.
 */
export function buildErrorStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography, spacing } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.regular,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    color: themeColors.status.danger,
    margin: 0,
    padding: `0 ${spacing.xl}px`,
  };
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the footer button row.
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
