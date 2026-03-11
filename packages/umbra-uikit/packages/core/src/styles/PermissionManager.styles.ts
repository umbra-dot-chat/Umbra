/**
 * @module styles/PermissionManager
 * @description Pure style-builder functions for the PermissionManager component.
 *
 * A structured panel for viewing and toggling permissions grouped by category.
 * Each permission row supports three states: Allow, Deny, and Inherit.
 * Dangerous permissions are visually differentiated with a tinted row background.
 *
 * Sits on `background.canvas` with subtle borders separating categories.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { withAlpha } from '../tokens/color-utils';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

/**
 * Resolved color tokens for a permission manager instance.
 *
 * @remarks
 * Produced by {@link resolvePermissionManagerColors} and consumed by the
 * style builders. Uses status colors for the three toggle states and
 * danger surface for hazardous permission rows.
 */
export interface PermissionManagerColors {
  /** Panel background — canvas layer. */
  bg: string;
  /** Panel border. */
  border: string;
  /** Category header background. */
  categoryHeaderBg: string;
  /** Category header text. */
  categoryHeaderText: string;
  /** Permission name text. */
  permissionName: string;
  /** Permission description text. */
  permissionDesc: string;
  /** Permission row background (rest state). */
  rowBg: string;
  /** Permission row hover background. */
  rowHoverBg: string;
  /** Danger permission row tinted background. */
  dangerRowBg: string;
  /** Allow toggle background (active state). */
  toggleAllowBg: string;
  /** Allow toggle icon color. */
  toggleAllowIcon: string;
  /** Deny toggle background (active state). */
  toggleDenyBg: string;
  /** Deny toggle icon color. */
  toggleDenyIcon: string;
  /** Inherit toggle background (active state). */
  toggleInheritBg: string;
  /** Inherit toggle icon color. */
  toggleInheritIcon: string;
  /** Divider separating categories and rows. */
  divider: string;
  /** Alias: category header background (RN). */
  categoryBg: string;
  /** Alias: category header text (RN). */
  categoryText: string;
  /** Alias: dangerous row background (RN). */
  dangerousBg: string;
  /** Alias: allow toggle background (RN). */
  allowBg: string;
  /** Alias: deny toggle background (RN). */
  denyBg: string;
  /** Alias: inherit toggle background (RN). */
  inheritBg: string;
  /** Alias: allow icon color (RN). */
  allowIcon: string;
  /** Alias: deny icon color (RN). */
  denyIcon: string;
  /** Alias: inherit icon color (RN). */
  inheritIcon: string;
  /** Icon color for inactive toggle state. */
  inactiveIcon: string;
}

/**
 * Resolves theme-aware colors for the permission manager.
 *
 * @remarks
 * Maps status colors to the Allow/Deny/Inherit states and uses
 * danger surface tinting for rows flagged as hazardous.
 *
 * @param theme - The current Wisp theme instance.
 * @returns Resolved color set for the permission manager.
 */
export function resolvePermissionManagerColors(
  theme: WispTheme,
): PermissionManagerColors {
  const { colors } = theme;
  return {
    bg: colors.background.canvas,
    border: colors.border.subtle,
    categoryHeaderBg: withAlpha(colors.text.primary, 0.04),
    categoryHeaderText: colors.text.secondary,
    permissionName: colors.text.primary,
    permissionDesc: colors.text.muted,
    rowBg: 'transparent',
    rowHoverBg: withAlpha(colors.text.primary, 0.04),
    dangerRowBg: colors.status.dangerSurface,
    toggleAllowBg: colors.status.successSurface,
    toggleAllowIcon: colors.status.success,
    toggleDenyBg: colors.status.dangerSurface,
    toggleDenyIcon: colors.status.danger,
    toggleInheritBg: withAlpha(colors.text.muted, 0.12),
    toggleInheritIcon: colors.text.muted,
    divider: colors.border.subtle,
    categoryBg: withAlpha(colors.text.primary, 0.04),
    categoryText: colors.text.secondary,
    dangerousBg: colors.status.dangerSurface,
    allowBg: colors.status.successSurface,
    denyBg: colors.status.dangerSurface,
    inheritBg: withAlpha(colors.text.muted, 0.12),
    allowIcon: colors.status.success,
    denyIcon: colors.status.danger,
    inheritIcon: colors.text.muted,
    inactiveIcon: withAlpha(colors.text.muted, 0.4),
  };
}

// ---------------------------------------------------------------------------
// 1. Panel container
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the permission manager root container.
 *
 * @param colors - Resolved color tokens from {@link resolvePermissionManagerColors}.
 * @param theme - The current Wisp theme instance.
 * @param userStyle - Optional consumer-provided style overrides.
 * @returns A `CSSStyleObject` object for the panel `<div>`.
 */
export function buildPermissionManagerContainerStyle(
  colors: PermissionManagerColors,
  theme: WispTheme,
  userStyle?: CSSStyleObject,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.lg,
    boxSizing: 'border-box',
    overflow: 'hidden',
    ...userStyle,
  };
}

// ---------------------------------------------------------------------------
// 2. Category header
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for a category header row.
 *
 * @param colors - Resolved color tokens from {@link resolvePermissionManagerColors}.
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` object for the category header `<div>`.
 */
export function buildPermissionCategoryHeaderStyle(
  colors: PermissionManagerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    padding: `${spacing.sm}px ${spacing.lg}px`,
    backgroundColor: colors.categoryHeaderBg,
    borderBottom: `1px solid ${colors.divider}`,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    color: colors.categoryHeaderText,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    userSelect: 'none',
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// 3. Permission row
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for an individual permission row.
 *
 * @param colors - Resolved color tokens from {@link resolvePermissionManagerColors}.
 * @param isDangerous - Whether this permission is flagged as dangerous.
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` object for the permission row `<div>`.
 */
export function buildPermissionRowStyle(
  colors: PermissionManagerColors,
  isDangerous: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.md}px ${spacing.lg}px`,
    backgroundColor: isDangerous ? colors.dangerRowBg : colors.rowBg,
    borderBottom: `1px solid ${colors.divider}`,
    boxSizing: 'border-box',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    gap: spacing.lg,
  };
}

// ---------------------------------------------------------------------------
// 4. Permission name text
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the permission name label.
 *
 * @param colors - Resolved color tokens from {@link resolvePermissionManagerColors}.
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` object for the name `<span>`.
 */
export function buildPermissionNameStyle(
  colors: PermissionManagerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.medium,
    color: colors.permissionName,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// 5. Permission description text
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the permission description line.
 *
 * @param colors - Resolved color tokens from {@link resolvePermissionManagerColors}.
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` object for the description `<span>`.
 */
export function buildPermissionDescStyle(
  colors: PermissionManagerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colors.permissionDesc,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// 6. Permission info column (name + description stacked)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the permission info column that stacks the
 * name and description vertically.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` object for the info column `<div>`.
 */
export function buildPermissionInfoColumnStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['2xs'],
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  };
}

// ---------------------------------------------------------------------------
// 7. Toggle button group container
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the three-state toggle button group
 * (Allow / Deny / Inherit).
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` object for the toggle group `<div>`.
 */
export function buildPermissionToggleGroupStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing['2xs'],
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// 8. Individual toggle button
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for a single toggle button (Allow, Deny, or Inherit).
 *
 * @param active - Whether this toggle state is currently selected.
 * @param activeBg - Background color when active.
 * @param activeIcon - Icon color when active.
 * @param colors - Resolved color tokens from {@link resolvePermissionManagerColors}.
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` object for the toggle `<button>`.
 */
export function buildPermissionToggleButtonStyle(
  active: boolean,
  activeBg: string,
  activeIcon: string,
  colors: PermissionManagerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, spacing, typography } = theme;
  return {
    // Reset button defaults
    margin: 0,
    border: 'none',
    outline: 'none',

    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2xs'],
    height: 28,
    padding: `0 ${spacing.sm}px`,
    borderRadius: radii.md,
    backgroundColor: active ? activeBg : 'transparent',
    color: active ? activeIcon : colors.permissionDesc,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: active ? typography.weights.semibold : typography.weights.regular,
    lineHeight: 1,
    cursor: 'pointer',
    userSelect: 'none',
    flexShrink: 0,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, color ${durations.fast}ms ${easings.easeOut.css}`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// 9. Divider
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for a horizontal divider between categories.
 *
 * @param colors - Resolved color tokens from {@link resolvePermissionManagerColors}.
 * @returns A `CSSStyleObject` object for the divider `<hr>`.
 */
export function buildPermissionDividerStyle(
  colors: PermissionManagerColors,
): CSSStyleObject {
  return {
    width: '100%',
    height: 1,
    border: 'none',
    margin: 0,
    backgroundColor: colors.divider,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// 10. Skeleton helpers
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for a permission row skeleton placeholder.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` object with a pulsing animation.
 */
export function getPermissionManagerSkeletonRowStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors, spacing, radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.md}px ${spacing.lg}px`,
    borderBottom: `1px solid ${colors.border.subtle}`,
    boxSizing: 'border-box',
  };
}

/**
 * Builds the inline style for a skeleton text block inside a permission row.
 *
 * @param width - The width of the skeleton block (string or number).
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` object with a pulsing animation.
 */
export function getPermissionManagerSkeletonBlockStyle(
  width: string | number,
  theme: WispTheme,
): CSSStyleObject {
  const { colors, radii } = theme;
  return {
    height: 14,
    width,
    borderRadius: radii.sm,
    backgroundColor: colors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
