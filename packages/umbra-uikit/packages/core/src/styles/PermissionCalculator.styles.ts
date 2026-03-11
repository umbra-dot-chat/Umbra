/**
 * Style builders for the PermissionCalculator component.
 *
 * @module components/permission-calculator/styles
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the calculator container.
 */
export function buildContainerStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the user/channel header.
 */
export function buildHeaderStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  };
}

/**
 * Builds inline styles for the header title row.
 */
export function buildHeaderTitleStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.sm,
  };
}

// ---------------------------------------------------------------------------
// Permission list
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the permission list container.
 */
export function buildPermissionListStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  };
}

// ---------------------------------------------------------------------------
// Permission row
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for a single permission row.
 */
export function buildPermissionRowStyle(
  theme: WispTheme,
  granted: boolean,
): CSSStyleObject {
  const { spacing, radii, colors: themeColors } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: radii.md,
    backgroundColor: themeColors.background.sunken,
    gap: spacing.sm,
  };
}

/**
 * Builds inline styles for the permission row left side (label + icon).
 */
export function buildPermissionRowLeftStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  };
}

/**
 * Builds inline styles for the permission row right side (source badge).
 */
export function buildPermissionRowRightStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Granted / Denied icon
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the granted (check) icon.
 */
export function buildGrantedIconStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    color: themeColors.status.success,
    flexShrink: 0,
  };
}

/**
 * Builds inline styles for the denied (X) icon.
 */
export function buildDeniedIconStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    color: themeColors.status.danger,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Source badge
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the source badge.
 */
export function buildSourceBadgeStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography, spacing, radii } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.medium,
    color: themeColors.text.secondary,
    backgroundColor: themeColors.background.canvas,
    padding: `${spacing['2xs']}px ${spacing.sm}px`,
    borderRadius: radii.sm,
    border: '1px solid ' + themeColors.border.subtle,
    whiteSpace: 'nowrap',
  };
}
