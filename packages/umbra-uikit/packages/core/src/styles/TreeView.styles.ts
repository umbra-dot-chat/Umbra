/**
 * Style builders for the Wisp TreeView component.
 *
 * @module components/tree-view/styles
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { TreeViewSizeConfig } from '../types/TreeView.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Tree container
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the root tree container.
 *
 * @param userStyle - Optional consumer-provided style overrides.
 * @returns A `CSSStyleObject` object for the tree root.
 */
export function buildTreeContainerStyle(
  userStyle?: CSSStyleObject,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    ...userStyle,
  };
}

// ---------------------------------------------------------------------------
// Tree node row
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for an individual tree node row.
 *
 * @param sizeConfig - Active {@link TreeViewSizeConfig} for the chosen size variant.
 * @param depth - The nesting depth of this node (0-based).
 * @param isSelected - Whether this node is currently selected.
 * @param isHovered - Whether this node is currently hovered.
 * @param isDisabled - Whether this node is disabled.
 * @param themeColors - Resolved theme colour tokens.
 * @returns A `CSSStyleObject` object for the tree node row.
 */
export function buildTreeNodeStyle(
  sizeConfig: TreeViewSizeConfig,
  depth: number,
  isSelected: boolean,
  isHovered: boolean,
  isDisabled: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = theme;
  let backgroundColor = 'transparent';
  if (isSelected) {
    backgroundColor = themeColors.accent.highlight;
  } else if (isHovered && !isDisabled) {
    backgroundColor = themeColors.accent.highlight;
  }

  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeConfig.gap + 4,
    paddingLeft: depth * sizeConfig.indent + 4,
    paddingRight: spacing.xs,
    height: sizeConfig.itemHeight,
    borderRadius: radii.md,
    backgroundColor,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    color: isDisabled ? themeColors.text.muted : themeColors.text.primary,
    opacity: isDisabled ? 0.5 : 1,
    outline: 'none',
    userSelect: 'none',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Toggle chevron button
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the expand/collapse toggle button.
 *
 * @param sizeConfig - Active {@link TreeViewSizeConfig}.
 * @param themeColors - Resolved theme colour tokens.
 * @param isExpanded - Whether the node's children are currently visible.
 * @returns A `CSSStyleObject` object for the toggle button.
 */
export function buildTreeToggleStyle(
  sizeConfig: TreeViewSizeConfig,
  theme: WispTheme,
  isExpanded: boolean,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeConfig.iconSize,
    height: sizeConfig.iconSize,
    flexShrink: 0,
    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
    transition: `transform ${durations.normal}ms ${easings.easeOut.css}`,
    color: themeColors.text.muted,
    appearance: 'none' as const,
    border: 'none',
    background: 'none',
    padding: 0,
    margin: 0,
    cursor: 'pointer',
    outline: 'none',
  };
}

// ---------------------------------------------------------------------------
// Leading node icon
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the optional leading icon on a tree node.
 *
 * @param sizeConfig - Active {@link TreeViewSizeConfig}.
 * @param themeColors - Resolved theme colour tokens.
 * @returns A `CSSStyleObject` object for the icon wrapper.
 */
export function buildTreeIconStyle(
  sizeConfig: TreeViewSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: themeColors.text.secondary,
    width: sizeConfig.iconSize,
    height: sizeConfig.iconSize,
  };
}

// ---------------------------------------------------------------------------
// Label text
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the tree node label text.
 *
 * @param sizeConfig - Active {@link TreeViewSizeConfig}.
 * @param themeColors - Resolved theme colour tokens.
 * @param isDisabled - Whether the node is disabled.
 * @returns A `CSSStyleObject` object for the label `<span>`.
 */
export function buildTreeLabelStyle(
  sizeConfig: TreeViewSizeConfig,
  theme: WispTheme,
  isDisabled: boolean,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    flex: 1,
    fontSize: sizeConfig.fontSize,
    lineHeight: sizeConfig.lineHeight + 'px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: isDisabled ? themeColors.text.muted : undefined,
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

/**
 * Builds the skeleton loading placeholder style for a single skeleton row.
 *
 * @param sizeConfig - Active {@link TreeViewSizeConfig}.
 * @param themeColors - Active theme color tokens.
 * @param indent - Left padding in pixels for this skeleton row.
 * @returns CSS properties for the skeleton `<div>`.
 */
export function buildTreeSkeletonRowStyle(
  sizeConfig: TreeViewSizeConfig,
  theme: WispTheme,
  indent: number,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    height: sizeConfig.itemHeight,
    display: 'flex',
    alignItems: 'center',
    paddingLeft: indent + 4,
  };
}

/**
 * Builds the skeleton bar style (the pulsing rectangle).
 *
 * @param themeColors - Active theme color tokens.
 * @param width - Width of the bar in pixels.
 * @param height - Height of the bar in pixels.
 * @returns CSS properties for the skeleton bar `<div>`.
 */
export function buildTreeSkeletonBarStyle(
  theme: WispTheme,
  width: number,
  height: number,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    width,
    height,
    borderRadius: radii.sm,
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
