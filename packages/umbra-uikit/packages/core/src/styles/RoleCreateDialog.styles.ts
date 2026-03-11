/**
 * Style builders for the RoleCreateDialog component.
 *
 * @module components/role-create-dialog/styles
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
    padding: `0 ${spacing.xl}px ${spacing.lg}px`,
    fontFamily: fontFamilyStacks.sans,
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 260px)',
  };
}

// ---------------------------------------------------------------------------
// Role preview section
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the role preview section (name input + color picker + badge).
 */
export function buildRolePreviewSectionStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  };
}

/**
 * Builds inline styles for the role preview badge row.
 */
export function buildRolePreviewRowStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
  };
}

// ---------------------------------------------------------------------------
// Permission grid section
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the permission grid section.
 */
export function buildPermissionGridStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  };
}

// ---------------------------------------------------------------------------
// Toggle row
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for a toggle row (hoisted / mentionable).
 */
export function buildToggleRowStyle(theme: WispTheme): CSSStyleObject {
  const { spacing, colors: themeColors, radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: radii.md,
    backgroundColor: themeColors.background.sunken,
  };
}

/**
 * Builds inline styles for the toggle row label text.
 */
export function buildToggleLabelStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.medium,
    color: themeColors.text.primary,
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

// ---------------------------------------------------------------------------
// Dangerous permission label
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for dangerous permission labels.
 */
export function buildDangerousLabelStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    color: themeColors.status.danger,
  };
}
