/**
 * TreeView -- Hierarchical tree structure with expand/collapse and selection.
 *
 * @remarks
 * Renders a recursive tree of {@link TreeNode} items with support for:
 * - Controlled and uncontrolled expanded / selected state.
 * - Keyboard navigation (Enter to select, Space to toggle expand).
 * - Accessible `role="tree"` / `role="treeitem"` ARIA pattern.
 * - Optional leading icons per node.
 * - Skeleton loading placeholder.
 *
 * @module components/tree-view
 * @example
 * ```tsx
 * <TreeView
 *   size="md"
 *   nodes={[
 *     { id: 'src', label: 'src', children: [
 *       { id: 'index', label: 'index.ts' },
 *     ]},
 *   ]}
 *   onSelect={(id) => console.log(id)}
 * />
 * ```
 */
import React, { forwardRef, useMemo, useCallback, useState } from 'react';
import type { TreeViewProps, TreeNode, TreeViewSizeConfig } from '@coexist/wisp-core/types/TreeView.types';
import type { CSSStyleObject } from '@coexist/wisp-core/types';
import { treeViewSizeMap } from '@coexist/wisp-core/types/TreeView.types';
import { fontFamilyStacks } from '@coexist/wisp-core/tokens/shared';
import {
  buildTreeContainerStyle,
  buildTreeNodeStyle,
  buildTreeToggleStyle,
  buildTreeIconStyle,
  buildTreeLabelStyle,
  buildTreeSkeletonRowStyle,
  buildTreeSkeletonBarStyle,
} from '@coexist/wisp-core/styles/TreeView.styles';
import { useTheme } from '../../providers';
import { Text } from '../../primitives';
import type { ThemeColors } from '@coexist/wisp-core/theme/types';

// ---------------------------------------------------------------------------
// Internal -- TreeNodeRow
// ---------------------------------------------------------------------------

interface TreeNodeRowProps {
  node: TreeNode;
  depth: number;
  sizeConfig: TreeViewSizeConfig;
  expandedSet: Set<string>;
  selectedId: string | undefined;
  selectable: boolean;
  onToggleExpand: (id: string) => void;
  onSelectNode: (id: string) => void;
}

/**
 * Renders a single tree node row and its children recursively.
 */
function TreeNodeRow({
  node,
  depth,
  sizeConfig,
  expandedSet,
  selectedId,
  selectable,
  onToggleExpand,
  onSelectNode,
}: TreeNodeRowProps) {
  const { theme } = useTheme();
  const [hovered, setHovered] = useState(false);

  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const isExpanded = expandedSet.has(node.id);
  const isSelected = selectable && selectedId === node.id;
  const isDisabled = node.disabled === true;

  const handleMouseEnter = useCallback(() => {
    if (!isDisabled) setHovered(true);
  }, [isDisabled]);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
  }, []);

  const handleClick = useCallback(() => {
    if (isDisabled) return;
    if (selectable) {
      onSelectNode(node.id);
    }
    if (hasChildren) {
      onToggleExpand(node.id);
    }
  }, [isDisabled, selectable, hasChildren, node.id, onSelectNode, onToggleExpand]);

  const handleToggleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isDisabled) return;
      onToggleExpand(node.id);
    },
    [isDisabled, node.id, onToggleExpand],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isDisabled) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectable) {
          onSelectNode(node.id);
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        if (hasChildren) {
          onToggleExpand(node.id);
        }
      }
    },
    [isDisabled, selectable, hasChildren, node.id, onSelectNode, onToggleExpand],
  );

  const nodeStyle = useMemo(
    () => buildTreeNodeStyle(sizeConfig, depth, isSelected, hovered, isDisabled, theme),
    [sizeConfig, depth, isSelected, hovered, isDisabled, theme],
  );

  const toggleStyle = useMemo(
    () => buildTreeToggleStyle(sizeConfig, theme, isExpanded),
    [sizeConfig, theme, isExpanded],
  );

  const iconStyle = useMemo(
    () => buildTreeIconStyle(sizeConfig, theme),
    [sizeConfig, theme],
  );

  const labelStyle = useMemo(
    () => buildTreeLabelStyle(sizeConfig, theme, isDisabled),
    [sizeConfig, theme, isDisabled],
  );

  const IconComponent = node.icon;

  return (
    <>
      <div
        role="treeitem"
        tabIndex={isDisabled ? -1 : 0}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-selected={isSelected}
        aria-disabled={isDisabled || undefined}
        style={nodeStyle}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        data-wisp-tree-node=""
        data-node-id={node.id}
      >
        {/* Toggle chevron -- only rendered for nodes with children */}
        {hasChildren ? (
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            style={toggleStyle}
            onClick={handleToggleClick}
          >
            <svg
              width={sizeConfig.iconSize}
              height={sizeConfig.iconSize}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ) : (
          /* Spacer to keep leaf nodes aligned with parent nodes */
          <span
            style={{
              display: 'inline-flex',
              width: sizeConfig.iconSize,
              height: sizeConfig.iconSize,
              flexShrink: 0,
            }}
            aria-hidden
          />
        )}

        {/* Optional leading icon */}
        {IconComponent && (
          <span style={iconStyle} aria-hidden>
            <IconComponent
              size={sizeConfig.iconSize}
              color="currentColor"
              strokeWidth={2}
            />
          </span>
        )}

        {/* Label */}
        <Text style={labelStyle}>{node.label}</Text>
      </div>

      {/* Recursively render children when expanded */}
      {hasChildren && isExpanded && (
        <div role="group">
          {node.children!.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              sizeConfig={sizeConfig}

              expandedSet={expandedSet}
              selectedId={selectedId}
              selectable={selectable}
              onToggleExpand={onToggleExpand}
              onSelectNode={onSelectNode}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// TreeView
// ---------------------------------------------------------------------------

/**
 * TreeView -- Root component rendering a hierarchical node structure.
 *
 * @remarks
 * Provides controlled and uncontrolled patterns for both expanded and
 * selected state. When `skeleton` is `true`, renders a pulsing placeholder
 * with varied indentation to suggest tree structure.
 */
export const TreeView = forwardRef<HTMLDivElement, TreeViewProps>(function TreeView(
  {
    nodes,
    size = 'md',
    defaultExpanded,
    expanded: controlledExpanded,
    onToggle,
    selectedId: controlledSelectedId,
    defaultSelectedId,
    onSelect,
    selectable = true,
    skeleton = false,
    className,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = treeViewSizeMap[size];

  // -- Expanded state (controlled / uncontrolled) -------------------------

  const isExpandedControlled = controlledExpanded !== undefined;
  const [internalExpanded, setInternalExpanded] = useState<string[]>(
    () => defaultExpanded ?? [],
  );
  const expandedIds = isExpandedControlled ? controlledExpanded : internalExpanded;
  const expandedSet = useMemo(() => new Set(expandedIds), [expandedIds, theme]);

  const handleToggleExpand = useCallback(
    (id: string) => {
      if (!isExpandedControlled) {
        setInternalExpanded((prev) =>
          prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
        );
      }
      onToggle?.(id);
    },
    [isExpandedControlled, onToggle],
  );

  // -- Selection state (controlled / uncontrolled) ------------------------

  const isSelectedControlled = controlledSelectedId !== undefined;
  const [internalSelectedId, setInternalSelectedId] = useState<string | undefined>(
    defaultSelectedId,
  );
  const selectedId = isSelectedControlled ? controlledSelectedId : internalSelectedId;

  const handleSelectNode = useCallback(
    (id: string) => {
      if (!isSelectedControlled) {
        setInternalSelectedId(id);
      }
      onSelect?.(id);
    },
    [isSelectedControlled, onSelect],
  );

  // -- Root styles --------------------------------------------------------

  const containerStyle = useMemo(
    () => ({
      ...buildTreeContainerStyle(userStyle as CSSStyleObject),
      fontFamily: fontFamilyStacks.sans,
      gap: sizeConfig.gap,
    }),
    [userStyle, sizeConfig.gap],
  );

  // -- Skeleton -----------------------------------------------------------

  if (skeleton) {
    const skeletonRows = [
      { indent: 0, width: 120 },
      { indent: sizeConfig.indent, width: 100 },
      { indent: sizeConfig.indent, width: 80 },
      { indent: sizeConfig.indent * 2, width: 90 },
      { indent: 0, width: 110 },
    ];

    return (
      <div
        aria-hidden
        data-testid="tree-view-skeleton"
        className={className}
        style={{ ...containerStyle, gap: sizeConfig.gap }}
      >
        {skeletonRows.map((row, i) => (
          <div
            key={i}
            style={buildTreeSkeletonRowStyle(sizeConfig, theme, row.indent)}
          >
            <div style={buildTreeSkeletonBarStyle(theme, row.width, 12)} />
          </div>
        ))}
      </div>
    );
  }

  // -- Tree ---------------------------------------------------------------

  return (
    <div
      ref={ref}
      role="tree"
      className={className}
      style={containerStyle}
      data-wisp-tree-view=""
      {...rest}
    >
      {nodes.map((node) => (
        <TreeNodeRow
          key={node.id}
          node={node}
          depth={0}
          sizeConfig={sizeConfig}
          expandedSet={expandedSet}
          selectedId={selectedId}
          selectable={selectable}
          onToggleExpand={handleToggleExpand}
          onSelectNode={handleSelectNode}
        />
      ))}
    </div>
  );
});
TreeView.displayName = 'TreeView';
