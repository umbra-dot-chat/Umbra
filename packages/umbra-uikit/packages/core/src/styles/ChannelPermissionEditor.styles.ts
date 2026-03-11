/**
 * @module styles/ChannelPermissionEditor
 * @description Pure style-builder functions for the ChannelPermissionEditor component.
 *
 * Per-channel permission override editor for roles/members.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export interface ChannelPermissionEditorColors {
  bg: string;
  border: string;
  headerText: string;
  labelText: string;
  secondaryText: string;
  targetListBg: string;
  targetItemBg: string;
  targetItemActiveBg: string;
  targetItemText: string;
  permRowBg: string;
  categoryText: string;
  dangerText: string;
  dangerBg: string;
  segAllowBg: string;
  segAllowText: string;
  segDenyBg: string;
  segDenyText: string;
  segInheritBg: string;
  segInheritText: string;
  segInactiveBg: string;
  segInactiveText: string;
}

/**
 * Resolves semantic colors for the ChannelPermissionEditor from the current theme.
 */
export function resolveChannelPermissionEditorColors(
  theme: WispTheme,
): ChannelPermissionEditorColors {
  const { colors } = theme;
  return {
    bg: colors.background.surface,
    border: colors.border.subtle,
    headerText: colors.text.primary,
    labelText: colors.text.secondary,
    secondaryText: colors.text.muted,
    targetListBg: colors.background.sunken,
    targetItemBg: 'transparent',
    targetItemActiveBg: colors.accent.highlight,
    targetItemText: colors.text.primary,
    permRowBg: colors.background.sunken,
    categoryText: colors.text.secondary,
    dangerText: colors.status.danger,
    dangerBg: colors.status.dangerSurface,
    segAllowBg: colors.status.successSurface,
    segAllowText: colors.status.success,
    segDenyBg: colors.status.dangerSurface,
    segDenyText: colors.status.danger,
    segInheritBg: colors.background.sunken,
    segInheritText: colors.text.secondary,
    segInactiveBg: 'transparent',
    segInactiveText: colors.text.muted,
  };
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the editor container.
 */
export function buildContainerStyle(
  theme: WispTheme,
  edColors: ChannelPermissionEditorColors,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: edColors.bg,
    border: `1px solid ${edColors.border}`,
    borderRadius: radii.lg,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the header row.
 */
export function buildHeaderStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  };
}

/**
 * Builds inline styles for the header title.
 */
export function buildTitleStyle(
  theme: WispTheme,
  edColors: ChannelPermissionEditorColors,
): CSSStyleObject {
  return {
    fontSize: theme.typography.sizes.lg.fontSize,
    lineHeight: `${theme.typography.sizes.lg.lineHeight}px`,
    fontWeight: theme.typography.weights.semibold,
    color: edColors.headerText,
    margin: 0,
    fontFamily: fontFamilyStacks.sans,
  };
}

/**
 * Builds inline styles for the channel name subtitle.
 */
export function buildSubtitleStyle(
  theme: WispTheme,
  edColors: ChannelPermissionEditorColors,
): CSSStyleObject {
  return {
    fontSize: theme.typography.sizes.sm.fontSize,
    lineHeight: `${theme.typography.sizes.sm.lineHeight}px`,
    fontWeight: theme.typography.weights.regular,
    color: edColors.labelText,
    margin: 0,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Layout (sidebar + main)
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the two-column layout.
 */
export function buildLayoutStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing.lg,
    minHeight: 300,
  };
}

// ---------------------------------------------------------------------------
// Target list sidebar
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the target list sidebar.
 */
export function buildTargetListStyle(
  theme: WispTheme,
  edColors: ChannelPermissionEditorColors,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    width: 200,
    flexShrink: 0,
    padding: spacing.sm,
    backgroundColor: edColors.targetListBg,
    borderRadius: radii.md,
    overflowY: 'auto',
  };
}

/**
 * Builds inline styles for a target list item.
 */
export function buildTargetItemStyle(
  theme: WispTheme,
  edColors: ChannelPermissionEditorColors,
  isActive: boolean,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
    borderRadius: theme.radii.md,
    backgroundColor: isActive ? edColors.targetItemActiveBg : edColors.targetItemBg,
    color: edColors.targetItemText,
    fontSize: theme.typography.sizes.sm.fontSize,
    lineHeight: `${theme.typography.sizes.sm.lineHeight}px`,
    fontWeight: theme.typography.weights.medium,
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamilyStacks.sans,
  };
}

/**
 * Builds inline styles for the add-target button in the sidebar.
 */
export function buildAddTargetStyle(
  theme: WispTheme,
  edColors: ChannelPermissionEditorColors,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
    borderRadius: theme.radii.md,
    border: `1px dashed ${edColors.border}`,
    backgroundColor: 'transparent',
    color: edColors.labelText,
    fontSize: theme.typography.sizes.xs.fontSize,
    lineHeight: `${theme.typography.sizes.xs.lineHeight}px`,
    fontWeight: theme.typography.weights.medium,
    cursor: 'pointer',
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Permission list (main area)
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the permissions main area.
 */
export function buildPermMainStyle(): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    gap: 12,
    overflowY: 'auto',
  };
}

/**
 * Builds inline styles for a category header.
 */
export function buildCategoryHeaderStyle(
  theme: WispTheme,
  edColors: ChannelPermissionEditorColors,
): CSSStyleObject {
  return {
    fontSize: theme.typography.sizes.xs.fontSize,
    lineHeight: `${theme.typography.sizes.xs.lineHeight}px`,
    fontWeight: theme.typography.weights.semibold,
    color: edColors.categoryText,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: 0,
    padding: `${theme.spacing.xs}px 0`,
    fontFamily: fontFamilyStacks.sans,
  };
}

/**
 * Builds inline styles for a permission row.
 */
export function buildPermRowStyle(
  theme: WispTheme,
  edColors: ChannelPermissionEditorColors,
  isDangerous: boolean,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
    borderRadius: theme.radii.md,
    backgroundColor: isDangerous ? edColors.dangerBg : edColors.permRowBg,
  };
}

/**
 * Builds inline styles for the permission label + description block.
 */
export function buildPermLabelBlockStyle(): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    flex: 1,
    minWidth: 0,
  };
}

/**
 * Builds inline styles for the permission label.
 */
export function buildPermLabelStyle(
  theme: WispTheme,
  edColors: ChannelPermissionEditorColors,
  isDangerous: boolean,
): CSSStyleObject {
  return {
    fontSize: theme.typography.sizes.sm.fontSize,
    lineHeight: `${theme.typography.sizes.sm.lineHeight}px`,
    fontWeight: theme.typography.weights.medium,
    color: isDangerous ? edColors.dangerText : edColors.headerText,
    fontFamily: fontFamilyStacks.sans,
    margin: 0,
  };
}

/**
 * Builds inline styles for the permission description.
 */
export function buildPermDescStyle(
  theme: WispTheme,
  edColors: ChannelPermissionEditorColors,
): CSSStyleObject {
  return {
    fontSize: theme.typography.sizes['2xs'].fontSize,
    lineHeight: `${theme.typography.sizes['2xs'].lineHeight}px`,
    fontWeight: theme.typography.weights.regular,
    color: edColors.secondaryText,
    fontFamily: fontFamilyStacks.sans,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Segmented control (allow / deny / inherit)
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the segmented control wrapper.
 */
export function buildSegmentedWrapperStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'inline-flex',
    flexDirection: 'row',
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    border: `1px solid ${theme.colors.border.subtle}`,
    flexShrink: 0,
  };
}

/**
 * Builds inline styles for a single segment button.
 */
export function buildSegmentStyle(
  theme: WispTheme,
  edColors: ChannelPermissionEditorColors,
  segment: 'allow' | 'deny' | 'inherit',
  isActive: boolean,
): CSSStyleObject {
  let bg: string;
  let color: string;

  if (isActive) {
    switch (segment) {
      case 'allow':
        bg = edColors.segAllowBg;
        color = edColors.segAllowText;
        break;
      case 'deny':
        bg = edColors.segDenyBg;
        color = edColors.segDenyText;
        break;
      default:
        bg = edColors.segInheritBg;
        color = edColors.segInheritText;
        break;
    }
  } else {
    bg = edColors.segInactiveBg;
    color = edColors.segInactiveText;
  }

  return {
    padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
    fontSize: theme.typography.sizes.xs.fontSize,
    lineHeight: `${theme.typography.sizes.xs.lineHeight}px`,
    fontWeight: isActive ? theme.typography.weights.semibold : theme.typography.weights.regular,
    backgroundColor: bg,
    color,
    border: 'none',
    cursor: 'pointer',
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the footer button row.
 */
export function buildFooterStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTop: `1px solid ${theme.colors.border.subtle}`,
  };
}
