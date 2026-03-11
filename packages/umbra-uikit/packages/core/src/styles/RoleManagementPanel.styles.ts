/**
 * @module styles/RoleManagementPanel
 * @description Pure style-builder functions for the RoleManagementPanel component.
 *
 * An admin panel for creating and managing community roles with permissions.
 * Split panel layout: role list sidebar on the left, permission editor on the right.
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
 * Resolved color tokens for the role management panel.
 */
export interface RoleManagementPanelColors {
  /** Panel background. */
  bg: string;
  /** Panel border. */
  border: string;
  /** Sidebar background. */
  sidebarBg: string;
  /** Sidebar border (subtle on dark surface). */
  sidebarBorder: string;
  /** Sidebar primary text (readable on dark surface). */
  sidebarText: string;
  /** Sidebar secondary / muted text (readable on dark surface). */
  sidebarTextMuted: string;
  /** Main panel background. */
  mainBg: string;
  /** Title text color. */
  titleText: string;
  /** Primary text color. */
  primaryText: string;
  /** Secondary / muted text color. */
  secondaryText: string;
  /** Muted text color. */
  mutedText: string;
  /** Role item hover background. */
  roleHoverBg: string;
  /** Role item selected background. */
  roleSelectedBg: string;
  /** Role item selected text. */
  roleSelectedText: string;
  /** Section label text. */
  sectionLabel: string;
  /** Input background. */
  inputBg: string;
  /** Input border. */
  inputBorder: string;
  /** Danger / delete button color. */
  danger: string;
  /** Danger surface background. */
  dangerSurface: string;
  /** Accent color. */
  accent: string;
  /** Skeleton block color (visible on sidebar dark surface). */
  skeletonBlock: string;
}

/**
 * Resolves theme-aware colors for the role management panel.
 *
 * @param theme - The current Wisp theme instance.
 * @returns Resolved color set for the panel.
 */
export function resolveRoleManagementPanelColors(
  theme: WispTheme,
): RoleManagementPanelColors {
  const { colors } = theme;
  return {
    bg: colors.background.canvas,
    border: colors.border.subtle,
    sidebarBg: colors.background.surface,
    sidebarBorder: colors.accent.dividerRaised,
    sidebarText: colors.text.onRaised,
    sidebarTextMuted: colors.text.onRaisedSecondary,
    mainBg: colors.background.canvas,
    titleText: colors.text.primary,
    primaryText: colors.text.primary,
    secondaryText: colors.text.secondary,
    mutedText: colors.text.muted,
    roleHoverBg: colors.accent.highlightRaised,
    roleSelectedBg: withAlpha(colors.accent.primary, 0.12),
    roleSelectedText: colors.text.onRaised,
    sectionLabel: colors.text.secondary,
    inputBg: colors.background.sunken,
    inputBorder: colors.border.subtle,
    danger: colors.status.danger,
    dangerSurface: colors.status.dangerSurface,
    accent: colors.accent.primary,
    skeletonBlock: withAlpha(colors.text.onRaised, 0.12),
  };
}

// ---------------------------------------------------------------------------
// 1. Container — split panel layout
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the root container (sidebar + main).
 *
 * @param theme - The current Wisp theme instance.
 * @param userStyle - Optional consumer-provided style overrides.
 * @returns A `CSSStyleObject` for the container `<div>`.
 */
export function buildContainerStyle(
  theme: WispTheme,
  userStyle?: CSSStyleObject,
): CSSStyleObject {
  const { radii } = theme;
  const colors = resolveRoleManagementPanelColors(theme);
  return {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.lg,
    boxSizing: 'border-box',
    overflow: 'hidden',
    fontFamily: fontFamilyStacks.sans,
    ...userStyle,
  };
}

// ---------------------------------------------------------------------------
// 2. Role sidebar
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the left sidebar containing the role list.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the sidebar `<div>`.
 */
export function buildRoleSidebarStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  const colors = resolveRoleManagementPanelColors(theme);
  return {
    display: 'flex',
    flexDirection: 'column',
    width: 220,
    minWidth: 220,
    flexShrink: 0,
    backgroundColor: colors.sidebarBg,
    borderRight: `1px solid ${colors.sidebarBorder}`,
    boxSizing: 'border-box',
    overflow: 'hidden',
  };
}

// ---------------------------------------------------------------------------
// 3. Sidebar header (title + create button)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the sidebar header area.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the header `<div>`.
 */
export function buildSidebarHeaderStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  const colors = resolveRoleManagementPanelColors(theme);
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.md}px ${spacing.lg}px`,
    borderBottom: `1px solid ${colors.sidebarBorder}`,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.sidebarText,
    boxSizing: 'border-box',
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// 4. Role list item
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for a single role item in the sidebar list.
 *
 * @param theme - The current Wisp theme instance.
 * @param selected - Whether this role is currently selected.
 * @param color - The role color (hex) for the color dot.
 * @returns A `CSSStyleObject` for the role item `<button>`.
 */
export function buildRoleItemStyle(
  theme: WispTheme,
  selected: boolean,
  color?: string,
): CSSStyleObject {
  const { spacing, radii, typography } = theme;
  const panelColors = resolveRoleManagementPanelColors(theme);
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm}px ${spacing.lg}px`,
    margin: 0,
    border: 'none',
    outline: 'none',
    background: selected ? panelColors.roleSelectedBg : 'transparent',
    color: panelColors.sidebarText,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: selected ? typography.weights.semibold : typography.weights.regular,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'left',
    userSelect: 'none',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// 5. Role color dot
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the role color dot indicator.
 *
 * @param roleColor - The role's hex color.
 * @returns A `CSSStyleObject` for the color dot `<span>`.
 */
export function buildRoleColorDotStyle(
  roleColor: string,
): CSSStyleObject {
  return {
    display: 'inline-block',
    width: 12,
    height: 12,
    borderRadius: '50%',
    backgroundColor: roleColor,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// 6. Role member count
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the member count badge on a role item.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the count `<span>`.
 */
export function buildRoleMemberCountStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  const colors = resolveRoleManagementPanelColors(theme);
  return {
    marginLeft: 'auto',
    fontSize: typography.sizes.xs.fontSize,
    color: colors.sidebarTextMuted,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// 7. Main panel (right side)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the right panel (permission editor area).
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the main panel `<div>`.
 */
export function buildMainPanelStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  const colors = resolveRoleManagementPanelColors(theme);
  return {
    display: 'flex',
    flexDirection: 'column',
    flex: 2,
    minWidth: 360,
    backgroundColor: colors.mainBg,
    overflowY: 'auto',
    overflowX: 'hidden',
  };
}

// ---------------------------------------------------------------------------
// 8. Role header (name input + color picker row)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the role editor header with name and color.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the header `<div>`.
 */
export function buildRoleHeaderStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  const colors = resolveRoleManagementPanelColors(theme);
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    padding: `${spacing.lg}px`,
    borderBottom: `1px solid ${colors.border}`,
    boxSizing: 'border-box',
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// 9. Role header row (horizontal layout for inputs)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for a row within the role header.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the row `<div>`.
 */
export function buildRoleHeaderRowStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
  };
}

// ---------------------------------------------------------------------------
// 10. Section label (e.g. "Role Name", "Permissions")
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for a section label.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the label `<span>`.
 */
export function buildSectionLabelStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  const colors = resolveRoleManagementPanelColors(theme);
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.sectionLabel,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// 12. Toggle row (hoisted, mentionable toggles)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for a toggle setting row.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the toggle row `<div>`.
 */
export function buildToggleRowStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  const colors = resolveRoleManagementPanelColors(theme);
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.sm}px 0`,
    borderBottom: `1px solid ${colors.border}`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// 13. Permission grid container
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the permission grid container.
 *
 * @returns A `CSSStyleObject` for the grid `<div>`.
 */
export function buildPermissionGridStyle(): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'auto',
  };
}

// ---------------------------------------------------------------------------
// 14. Permission category header
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for a permission category accordion header.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the category header `<button>`.
 */
export function buildPermissionCategoryStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  const colors = resolveRoleManagementPanelColors(theme);
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: `${spacing.sm}px ${spacing.lg}px`,
    margin: 0,
    border: 'none',
    outline: 'none',
    background: withAlpha(colors.primaryText, 0.04),
    color: colors.secondaryText,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    cursor: 'pointer',
    userSelect: 'none',
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// 15. Permission item row (checkbox style)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for an individual permission item row.
 *
 * @param theme - The current Wisp theme instance.
 * @param dangerous - Whether this permission is marked as dangerous.
 * @returns A `CSSStyleObject` for the permission row `<label>`.
 */
export function buildPermissionItemStyle(
  theme: WispTheme,
  dangerous: boolean,
): CSSStyleObject {
  const { spacing } = theme;
  const colors = resolveRoleManagementPanelColors(theme);
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    padding: `${spacing.sm}px ${spacing.lg}px`,
    backgroundColor: 'transparent',
    borderBottom: `1px solid ${colors.border}`,
    boxSizing: 'border-box',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// 16. Permission info column
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the permission label + description column.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the info `<div>`.
 */
export function buildPermissionInfoStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    flex: 1,
    minWidth: 0,
  };
}

// ---------------------------------------------------------------------------
// 17. Permission label text
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the permission label text.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the label `<span>`.
 */
export function buildPermissionLabelStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  const colors = resolveRoleManagementPanelColors(theme);
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.medium,
    color: colors.primaryText,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
  };
}

// ---------------------------------------------------------------------------
// 18. Permission description text
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the permission description text.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the description `<span>`.
 */
export function buildPermissionDescriptionStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  const colors = resolveRoleManagementPanelColors(theme);
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.regular,
    color: colors.mutedText,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
  };
}

// ---------------------------------------------------------------------------
// 20. Empty state (no role selected)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the empty state when no role is selected.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the empty state `<div>`.
 */
export function buildEmptyStateStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  const colors = resolveRoleManagementPanelColors(theme);
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: colors.mutedText,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// 23. Color picker row
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the color picker row.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the row `<div>`.
 */
export function buildColorPickerRowStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
  };
}

// ---------------------------------------------------------------------------
// 24. Color swatch (in header)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the color swatch preview.
 *
 * @param color - The role color (hex).
 * @returns A `CSSStyleObject` for the swatch `<span>`.
 */
export function buildColorSwatchStyle(
  color: string,
): CSSStyleObject {
  return {
    display: 'inline-block',
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: color,
    border: '2px solid rgba(255,255,255,0.1)',
    flexShrink: 0,
    cursor: 'pointer',
  };
}

// ---------------------------------------------------------------------------
// 25. Footer area (for delete button)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the footer area of the main panel.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the footer `<div>`.
 */
export function buildFooterStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  const colors = resolveRoleManagementPanelColors(theme);
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: `${spacing.md}px ${spacing.lg}px`,
    borderTop: `1px solid ${colors.border}`,
    boxSizing: 'border-box',
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// 26. Color picker grid
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the preset color picker grid.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the grid `<div>`.
 */
export function buildColorPickerGridStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 4,
  };
}

// ---------------------------------------------------------------------------
// 27. Color preset swatch wrapper
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for an individual color preset button.
 *
 * @param selected - Whether this color is currently selected.
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the preset `<button>`.
 */
export function buildColorPresetStyle(
  selected: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const colors = resolveRoleManagementPanelColors(theme);
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    margin: 0,
    border: selected ? `2px solid ${colors.accent}` : '2px solid transparent',
    borderRadius: '50%',
    background: 'transparent',
    cursor: 'pointer',
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// 28. Drag handle
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the drag handle icon container.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the handle `<span>`.
 */
export function buildDragHandleStyle(
  theme: WispTheme,
): CSSStyleObject {
  const colors = resolveRoleManagementPanelColors(theme);
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'grab',
    color: colors.sidebarTextMuted,
    flexShrink: 0,
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// 29. Drag indicator (drop target line)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the drag drop indicator.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the indicator `<div>`.
 */
export function buildDragIndicatorStyle(
  theme: WispTheme,
): CSSStyleObject {
  const colors = resolveRoleManagementPanelColors(theme);
  return {
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: 1,
    margin: `0 ${theme.spacing.lg}px`,
  };
}
