import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { SidebarPosition, SidebarWidth } from '../types/Sidebar.types';
import { sidebarWidthMap } from '../types/Sidebar.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Sidebar container
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the root Sidebar container.
 *
 * @param width - The resolved sidebar width preset.
 * @param position - Which edge the sidebar is anchored to (`left` or `right`).
 * @param themeColors - Resolved theme color palette.
 * @param userStyle - Optional consumer-provided style overrides.
 * @returns A `CSSStyleObject` object for the `<nav>` wrapper.
 */
export function buildSidebarStyle(
  width: SidebarWidth,
  position: SidebarPosition,
  theme: WispTheme,
  userStyle?: CSSStyleObject,
): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  const resolvedWidth = sidebarWidthMap[width];
  const borderSide = position === 'left' ? 'borderRight' : 'borderLeft';

  return {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: resolvedWidth,
    minWidth: resolvedWidth,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: themeColors.background.surface,
    [borderSide]: `1px solid ${themeColors.border.subtle}`,
    color: themeColors.text.onRaised,
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarWidth: 'thin',
    fontFamily: fontFamilyStacks.sans,
    boxSizing: 'border-box',
    transition: `width ${durations.normal}ms cubic-bezier(0.4, 0, 0.2, 1), min-width ${durations.normal}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    ...userStyle,
  };
}

// ---------------------------------------------------------------------------
// SidebarSection wrapper
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for a SidebarSection wrapper.
 *
 * @param userStyle - Optional consumer-provided style overrides.
 * @returns A `CSSStyleObject` object for the section container.
 */
export function buildSectionStyle(
  userStyle?: CSSStyleObject,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    ...userStyle,
  };
}

// ---------------------------------------------------------------------------
// SidebarSection title
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for a SidebarSection title/heading.
 *
 * @param themeColors - Resolved theme color palette.
 * @param collapsible - Whether the section is collapsible (affects cursor).
 * @returns A `CSSStyleObject` object for the title button element.
 */
export function buildSectionTitleStyle(
  theme: WispTheme,
  collapsible: boolean,
): CSSStyleObject {
  const { colors: themeColors, spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.md}px ${spacing.lg}px ${spacing.xs}px`,
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.semibold,
    lineHeight: 1.45,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: themeColors.text.onRaisedSecondary,
    fontFamily: fontFamilyStacks.sans,
    userSelect: 'none',
    cursor: collapsible ? 'pointer' : 'default',
    border: 'none',
    background: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// SidebarSection chevron
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the collapsible section chevron indicator.
 *
 * @param isCollapsed - Whether the section is currently collapsed.
 * @returns A `CSSStyleObject` object with a rotation transform.
 */
export function buildSectionChevronStyle(
  isCollapsed: boolean,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 16,
    height: 16,
    flexShrink: 0,
    transition: `transform ${durations.normal}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
  };
}

// ---------------------------------------------------------------------------
// SidebarSection content (collapsible body)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the collapsible section content body.
 *
 * @param isCollapsed - Whether the section is currently collapsed.
 * @returns A `CSSStyleObject` object that hides content via `display: none` when collapsed.
 */
export function buildSectionContentStyle(
  isCollapsed: boolean,
): CSSStyleObject {
  return {
    display: isCollapsed ? 'none' : 'flex',
    flexDirection: 'column',
  };
}

// ---------------------------------------------------------------------------
// SidebarItem
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for a SidebarItem.
 *
 * @param active - Whether the item represents the active route.
 * @param disabled - Whether the item is disabled.
 * @param hovered - Whether the item is currently hovered.
 * @param sidebarCollapsed - Whether the sidebar is in a narrow state.
 * @param sidebarWidth - The resolved sidebar width preset (used for square sizing).
 * @param themeColors - Resolved theme color palette.
 * @param userStyle - Optional consumer-provided style overrides.
 * @returns A `CSSStyleObject` object for the item element.
 */
export function buildItemStyle(
  active: boolean,
  disabled: boolean,
  hovered: boolean,
  sidebarCollapsed: boolean,
  sidebarWidth: SidebarWidth,
  theme: WispTheme,
  userStyle?: CSSStyleObject,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing, typography } = theme;
  let backgroundColor = 'transparent';
  let color = themeColors.text.onRaised;

  if (active) {
    backgroundColor = themeColors.accent.primary;
    color = themeColors.text.inverse;
  } else if (hovered && !disabled) {
    backgroundColor = themeColors.accent.highlightRaised;
  }

  const base: CSSStyleObject = {
    display: 'flex',
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor,
    color,
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: 1.43,
    fontFamily: fontFamilyStacks.sans,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, color ${durations.fast}ms ${easings.easeOut.css}`,
    textDecoration: 'none',
    border: 'none',
    outline: 'none',
    userSelect: 'none',
    boxSizing: 'border-box',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  };

  if (sidebarCollapsed) {
    // Compute an explicit square size from the sidebar width minus horizontal margins.
    const horizontalMargin = 8;
    const squareSize = sidebarWidthMap[sidebarWidth] - horizontalMargin * 2;

    return {
      ...base,
      justifyContent: 'center',
      gap: 0,
      padding: 0,
      margin: `2px ${horizontalMargin}px`,
      width: squareSize,
      height: squareSize,
      flexShrink: 0,
      ...userStyle,
    };
  }

  return {
    ...base,
    justifyContent: 'flex-start',
    gap: spacing.md,
    padding: `${spacing.sm}px ${spacing.lg}px`,
    margin: `${spacing['2xs']}px ${spacing.sm}px`,
    ...userStyle,
  };
}

// ---------------------------------------------------------------------------
// SidebarItem icon wrapper
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the SidebarItem icon container.
 *
 * @returns A `CSSStyleObject` object for a fixed-size inline-flex icon wrapper.
 */
export function buildItemIconStyle(): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    flexShrink: 0,
    color: 'currentColor',
  };
}

// ---------------------------------------------------------------------------
// SidebarItem label
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the SidebarItem label text.
 *
 * @param sidebarCollapsed - Whether the sidebar is in a narrow state (hides the label).
 * @returns A `CSSStyleObject` object for the label span.
 */
export function buildItemLabelStyle(
  sidebarCollapsed: boolean,
): CSSStyleObject {
  return {
    display: sidebarCollapsed ? 'none' : 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    minWidth: 0,
  };
}

// ---------------------------------------------------------------------------
// SidebarItem badge wrapper
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the SidebarItem trailing badge.
 *
 * @param sidebarCollapsed - Whether the sidebar is in a narrow state (hides the badge).
 * @returns A `CSSStyleObject` object for the badge container.
 */
export function buildItemBadgeStyle(
  sidebarCollapsed: boolean,
): CSSStyleObject {
  return {
    display: sidebarCollapsed ? 'none' : 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
    flexShrink: 0,
  };
}
