import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Pressable, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { Collapse } from '../../layouts/collapse';
import type { ThemeColors } from '@coexist/wisp-core/theme/types';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

const sizeMap = {
  sm: { fontSize: defaultTypography.sizes.xs.fontSize, lineHeight: 18, iconSize: 14, indent: 16, itemHeight: 28, gap: defaultSpacing['2xs'] },
  md: { fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 20, iconSize: 16, indent: 20, itemHeight: 32, gap: defaultSpacing['2xs'] },
  lg: { fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 22, iconSize: 18, indent: 24, itemHeight: 36, gap: defaultSpacing.xs },
} as const;

type TreeViewSize = keyof typeof sizeMap;

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  disabled?: boolean;
}

export interface TreeViewProps {
  nodes: TreeNode[];
  size?: TreeViewSize;
  defaultExpanded?: string[];
  expanded?: string[];
  onToggle?: (id: string) => void;
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  selectable?: boolean;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Internal recursive node
// ---------------------------------------------------------------------------

interface TreeNodeRowProps {
  node: TreeNode;
  depth: number;
  sizeConfig: (typeof sizeMap)[TreeViewSize];
  themeColors: ThemeColors;
  expandedSet: Set<string>;
  selectedId: string | undefined;
  onToggleExpand: (id: string) => void;
  onSelectNode: (id: string) => void;
  selectable: boolean;
}

function TreeNodeRow({
  node,
  depth,
  sizeConfig,
  themeColors,
  expandedSet,
  selectedId,
  onToggleExpand,
  onSelectNode,
  selectable,
}: TreeNodeRowProps) {
  const hasChildren = !!node.children?.length;
  const isExpanded = expandedSet.has(node.id);
  const isSelected = selectedId === node.id;
  const Icon = node.icon;

  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    height: sizeConfig.itemHeight,
    paddingLeft: depth * sizeConfig.indent,
    paddingRight: defaultSpacing.sm,
    borderRadius: defaultRadii.md,
    backgroundColor: isSelected ? themeColors.accent.highlight : 'transparent',
    opacity: node.disabled ? 0.4 : 1,
  };

  const handlePress = () => {
    if (node.disabled) return;
    if (selectable) onSelectNode(node.id);
    if (hasChildren) onToggleExpand(node.id);
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        disabled={node.disabled}
        style={({ pressed }) => [
          rowStyle,
          pressed && !isSelected ? { backgroundColor: themeColors.accent.highlight } : undefined,
        ]}
      >
        {hasChildren ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleExpand(node.id);
            }}
            hitSlop={8}
            style={{ width: sizeConfig.iconSize + 4, alignItems: 'center', justifyContent: 'center' }}
          >
            <Svg
              width={sizeConfig.iconSize}
              height={sizeConfig.iconSize}
              viewBox="0 0 24 24"
              fill="none"
              style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] } as any}
            >
              <Polyline
                points="9 18 15 12 9 6"
                stroke={themeColors.text.secondary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
        ) : (
          <View style={{ width: sizeConfig.iconSize + 4 }} />
        )}

        {Icon && (
          <View style={{ marginRight: defaultSpacing.sm }}>
            <Icon size={sizeConfig.iconSize} color={themeColors.text.secondary} strokeWidth={2} />
          </View>
        )}

        <RNText
          style={{
            fontSize: sizeConfig.fontSize,
            lineHeight: sizeConfig.lineHeight,
            fontWeight: isSelected ? '600' : '400',
            color: themeColors.text.primary,
          } as TextStyle}
          numberOfLines={1}
        >
          {node.label}
        </RNText>
      </Pressable>

      {hasChildren && (
        <Collapse open={isExpanded}>
          {node.children!.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              sizeConfig={sizeConfig}
              themeColors={themeColors}
              expandedSet={expandedSet}
              selectedId={selectedId}
              onToggleExpand={onToggleExpand}
              onSelectNode={onSelectNode}
              selectable={selectable}
            />
          ))}
        </Collapse>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// TreeView
// ---------------------------------------------------------------------------

export const TreeView = forwardRef<View, TreeViewProps>(function TreeView(
  {
    nodes,
    size = 'md',
    defaultExpanded = [],
    expanded: controlledExpanded,
    onToggle,
    selectedId: controlledSelectedId,
    defaultSelectedId,
    onSelect,
    selectable = true,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = sizeMap[size];

  // Expand state
  const isExpandControlled = controlledExpanded !== undefined;
  const [internalExpanded, setInternalExpanded] = useState<string[]>(defaultExpanded);
  const expandedIds = isExpandControlled ? controlledExpanded : internalExpanded;
  const expandedSet = useMemo(() => new Set(expandedIds), [expandedIds]);

  const handleToggleExpand = useCallback(
    (id: string) => {
      if (!isExpandControlled) {
        setInternalExpanded((prev) =>
          prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
        );
      }
      onToggle?.(id);
    },
    [isExpandControlled, onToggle],
  );

  // Selection state
  const isSelectControlled = controlledSelectedId !== undefined;
  const [internalSelectedId, setInternalSelectedId] = useState<string | undefined>(defaultSelectedId);
  const selectedId = isSelectControlled ? controlledSelectedId : internalSelectedId;

  const handleSelectNode = useCallback(
    (id: string) => {
      if (!isSelectControlled) setInternalSelectedId(id);
      onSelect?.(id);
    },
    [isSelectControlled, onSelect],
  );

  return (
    <View ref={ref} accessibilityRole="none" style={userStyle}>
      {nodes.map((node) => (
        <TreeNodeRow
          key={node.id}
          node={node}
          depth={0}
          sizeConfig={sizeConfig}
          themeColors={themeColors}
          expandedSet={expandedSet}
          selectedId={selectedId}
          onToggleExpand={handleToggleExpand}
          onSelectNode={handleSelectNode}
          selectable={selectable}
        />
      ))}
    </View>
  );
});

TreeView.displayName = 'TreeView';
