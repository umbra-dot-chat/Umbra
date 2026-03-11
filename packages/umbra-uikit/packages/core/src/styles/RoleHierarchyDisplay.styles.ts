/**
 * @module styles/RoleHierarchyDisplay
 * @description Pure style-builder functions for the RoleHierarchyDisplay component.
 *
 * Provides visual structure for a vertical list of roles ordered by authority.
 * Each row contains an optional drag handle, position badge, role badge, and
 * member count. Supports a dragging state highlight.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { withAlpha } from '../tokens/color-utils';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// 1. Container
// ---------------------------------------------------------------------------

/**
 * Builds the root container style for the role hierarchy display.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the outermost wrapper `<div>`.
 */
export function buildContainerStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    fontFamily: fontFamilyStacks.sans,
    gap: spacing.xs,
  };
}

// ---------------------------------------------------------------------------
// 2. Header (title + description)
// ---------------------------------------------------------------------------

/**
 * Builds the header area style containing the title and description.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the header `<div>`.
 */
export function buildHeaderStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['2xs'],
    marginBottom: spacing.xs,
  };
}

/**
 * Builds the title text style.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the title element.
 */
export function buildTitleStyle(theme: WispTheme): CSSStyleObject {
  const { colors, typography } = theme;
  return {
    margin: 0,
    fontSize: 14,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    lineHeight: 1.4,
    fontFamily: fontFamilyStacks.sans,
  };
}

/**
 * Builds the description text style.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the description element.
 */
export function buildDescriptionStyle(theme: WispTheme): CSSStyleObject {
  const { colors } = theme;
  return {
    margin: 0,
    fontSize: 12,
    color: colors.text.muted,
    lineHeight: 1.4,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// 3. Role row
// ---------------------------------------------------------------------------

/**
 * Builds the style for each role row.
 *
 * @param theme - The current Wisp theme instance.
 * @param isDragging - Whether this row is currently being dragged.
 * @returns A `CSSStyleObject` for a role row `<div>`.
 */
export function buildRoleRowStyle(
  theme: WispTheme,
  isDragging: boolean,
): CSSStyleObject {
  const { colors, spacing, radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.xs}px ${spacing.sm}px`,
    borderRadius: radii.md,
    backgroundColor: isDragging
      ? withAlpha(colors.text.primary, 0.06)
      : 'transparent',
    border: isDragging
      ? `1px dashed ${withAlpha(colors.text.primary, 0.2)}`
      : '1px solid transparent',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, border-color ${durations.fast}ms ${easings.easeOut.css}`,
    cursor: 'default',
    userSelect: 'none',
    minHeight: 36,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// 4. Drag handle
// ---------------------------------------------------------------------------

/**
 * Builds the style for the drag handle grip area.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the drag handle `<span>`.
 */
export function buildDragHandleStyle(theme: WispTheme): CSSStyleObject {
  const { colors } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 16,
    height: 16,
    color: colors.text.muted,
    cursor: 'grab',
    flexShrink: 0,
    opacity: 0.6,
    transition: `opacity ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// 5. Position badge
// ---------------------------------------------------------------------------

/**
 * Builds the style for the small position number indicator.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the position badge `<span>`.
 */
export function buildPositionBadgeStyle(theme: WispTheme): CSSStyleObject {
  const { colors, radii, typography } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    borderRadius: radii.sm,
    backgroundColor: withAlpha(colors.text.primary, 0.08),
    color: colors.text.muted,
    fontSize: 10,
    fontWeight: typography.weights.medium,
    fontFamily: fontFamilyStacks.mono,
    lineHeight: 1,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// 6. Member count text
// ---------------------------------------------------------------------------

/**
 * Builds the style for the member count label.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the member count `<span>`.
 */
export function buildMemberCountStyle(theme: WispTheme): CSSStyleObject {
  const { colors } = theme;
  return {
    fontSize: 11,
    color: colors.text.muted,
    fontFamily: fontFamilyStacks.sans,
    whiteSpace: 'nowrap',
    marginLeft: 'auto',
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// 7. Role list wrapper
// ---------------------------------------------------------------------------

/**
 * Builds the style for the scrollable role list container.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the list wrapper `<div>`.
 */
export function buildRoleListStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };
}

// ---------------------------------------------------------------------------
// 8. Skeleton row
// ---------------------------------------------------------------------------

/**
 * Builds the style for a skeleton placeholder row.
 *
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` for the skeleton row.
 */
export function buildSkeletonRowStyle(theme: WispTheme): CSSStyleObject {
  const { colors, radii, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.xs}px ${spacing.sm}px`,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: withAlpha(colors.text.primary, 0.04),
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
