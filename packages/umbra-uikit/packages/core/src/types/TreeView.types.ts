/**
 * Type definitions for the Wisp TreeView component.
 *
 * @module components/tree-view/types
 */

import type React from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// TreeView Size
// ---------------------------------------------------------------------------

/**
 * Available size tokens for the TreeView component.
 *
 * @remarks
 * Three sizes cover the majority of layout needs. Components map these
 * tokens to concrete pixel dimensions internally via {@link treeViewSizeMap}.
 */
export const treeViewSizes = ['sm', 'md', 'lg'] as const;

/**
 * Union of valid TreeView size token strings.
 *
 * @remarks
 * Derived from the {@link treeViewSizes} tuple.
 */
export type TreeViewSize = (typeof treeViewSizes)[number];

// ---------------------------------------------------------------------------
// TreeView Size Config
// ---------------------------------------------------------------------------

/**
 * Size configuration values used to derive dimensions and typography for a
 * specific {@link TreeView} size variant.
 */
export interface TreeViewSizeConfig {
  /** Font size for the node label text in pixels. */
  fontSize: number;
  /** Line height for the node label text in pixels. */
  lineHeight: number;
  /** Size of leading and toggle icons in pixels. */
  iconSize: number;
  /** Indentation per depth level in pixels. */
  indent: number;
  /** Height of each tree node row in pixels. */
  itemHeight: number;
  /** Vertical gap between tree nodes in pixels. */
  gap: number;
}

/**
 * Pre-defined size configurations keyed by {@link TreeViewSize}.
 *
 * @remarks
 * Maps each size token (`sm`, `md`, `lg`) to a complete
 * {@link TreeViewSizeConfig} used for layout and typography calculations.
 */
export const treeViewSizeMap: Record<TreeViewSize, TreeViewSizeConfig> = {
  sm: { fontSize: defaultTypography.sizes.xs.fontSize, lineHeight: 18, iconSize: 14, indent: 16, itemHeight: 28, gap: defaultSpacing['2xs'] },
  md: { fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 20, iconSize: 16, indent: 20, itemHeight: 32, gap: defaultSpacing['2xs'] },
  lg: { fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 22, iconSize: 18, indent: 24, itemHeight: 36, gap: defaultSpacing.xs },
};

// ---------------------------------------------------------------------------
// Tree Node
// ---------------------------------------------------------------------------

/**
 * Describes a single node in the tree data structure.
 *
 * @remarks
 * Nodes are recursive -- each node may contain `children` forming an
 * arbitrarily deep hierarchy. An optional `icon` component renders a
 * leading visual indicator alongside the label.
 */
export interface TreeNode {
  /** Unique identifier for this node. */
  id: string;
  /** Display label rendered as the node text. */
  label: string;
  /** Child nodes forming the subtree under this node. */
  children?: TreeNode[];
  /** Leading icon component rendered before the label. */
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  /**
   * Whether the node is disabled (cannot be selected or toggled).
   * @default false
   */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// TreeView Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link TreeView} component.
 *
 * @remarks
 * Supports both controlled and uncontrolled patterns for expanded and
 * selected state. Pass `skeleton` to render a loading placeholder.
 */
export interface TreeViewProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect' | 'onToggle'> {
  /** Array of root-level {@link TreeNode} items to display. */
  nodes: TreeNode[];

  /**
   * Visual size variant controlling height, padding, and typography.
   * @default 'md'
   */
  size?: TreeViewSize;

  /**
   * Initial set of expanded node IDs for uncontrolled usage.
   *
   * @remarks
   * Ignored when {@link TreeViewProps.expanded} is provided.
   */
  defaultExpanded?: string[];

  /** Controlled set of expanded node IDs. When provided the component is fully controlled. */
  expanded?: string[];

  /** Callback fired when a node's expand/collapse state is toggled. Receives the node `id`. */
  onToggle?: (id: string) => void;

  /** Controlled selected node ID. */
  selectedId?: string;

  /**
   * Initial selected node ID for uncontrolled usage.
   *
   * @remarks
   * Ignored when {@link TreeViewProps.selectedId} is provided.
   */
  defaultSelectedId?: string;

  /** Callback fired when a node is selected. Receives the node `id`. */
  onSelect?: (id: string) => void;

  /**
   * Whether nodes can be selected on click.
   * @default true
   */
  selectable?: boolean;

  /**
   * When `true` a pulsing skeleton placeholder is rendered instead of the tree.
   * @default false
   */
  skeleton?: boolean;
}
