/**
 * Style builders for the CommunityCreateDialog component.
 *
 * @module components/community-create-dialog/styles
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Dialog body
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the dialog body area containing the form fields.
 */
export function buildDialogBodyStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
    padding: 0,
    fontFamily: fontFamilyStacks.sans,
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
    padding: 0,
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
  };
}
