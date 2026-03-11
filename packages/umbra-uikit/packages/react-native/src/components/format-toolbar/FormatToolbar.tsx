/**
 * @module components/format-toolbar
 * @description React Native FormatToolbar for the Wisp design system.
 *
 * Composes the Toolbar layout primitive with format-specific action buttons.
 * Reuses color resolution from `@coexist/wisp-core`. Renders via `<View>` + `<Pressable>`.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import type { ViewProps, ViewStyle } from 'react-native';
import {
  resolveFormatToolbarColors,
  getFormatButtonIconSize,
} from '@coexist/wisp-core/styles/FormatToolbar.styles';
import type { FormatAction } from '@coexist/wisp-core/types/FormatToolbar.types';
import { formatActions } from '@coexist/wisp-core/types/FormatToolbar.types';
import { defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import { Toolbar, ToolbarGroup, ToolbarSeparator } from '../toolbar';
import Svg, { Line, Path, Polyline, Rect } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface FormatToolbarProps extends ViewProps {
  onAction: (action: FormatAction) => void;
  activeFormats?: Set<FormatAction>;
  visibleActions?: FormatAction[];
  disabledActions?: Set<FormatAction>;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function BoldIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />
    </Svg>
  );
}

function ItalicIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={19} y1={4} x2={10} y2={4} />
      <Line x1={14} y1={20} x2={5} y2={20} />
      <Line x1={15} y1={4} x2={9} y2={20} />
    </Svg>
  );
}

function StrikethroughIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 4H9a3 3 0 0 0-2.83 4" />
      <Path d="M14 12a4 4 0 0 1 0 8H6" />
      <Line x1={4} y1={12} x2={20} y2={12} />
    </Svg>
  );
}

function CodeIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="16 18 22 12 16 6" />
      <Polyline points="8 6 2 12 8 18" />
    </Svg>
  );
}

function CodeBlockIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10 9.5 8 12l2 2.5" />
      <Path d="m14 9.5 2 2.5-2 2.5" />
      <Rect x={2} y={2} width={20} height={20} rx={2} />
    </Svg>
  );
}

function QuoteIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 6H3" />
      <Path d="M21 12H8" />
      <Path d="M21 18H8" />
      <Path d="M3 12v6" />
    </Svg>
  );
}

function OrderedListIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={10} y1={6} x2={21} y2={6} />
      <Line x1={10} y1={12} x2={21} y2={12} />
      <Line x1={10} y1={18} x2={21} y2={18} />
      <Path d="M4 6h1v4" />
      <Path d="M4 10h2" />
      <Path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </Svg>
  );
}

function UnorderedListIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={8} y1={6} x2={21} y2={6} />
      <Line x1={8} y1={12} x2={21} y2={12} />
      <Line x1={8} y1={18} x2={21} y2={18} />
      <Line x1={3} y1={6} x2={3.01} y2={6} />
      <Line x1={3} y1={12} x2={3.01} y2={12} />
      <Line x1={3} y1={18} x2={3.01} y2={18} />
    </Svg>
  );
}

function LinkIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Icon mapping
// ---------------------------------------------------------------------------

const iconMap: Record<FormatAction, React.FC<{ size?: number; color?: string }>> = {
  bold: BoldIcon,
  italic: ItalicIcon,
  strikethrough: StrikethroughIcon,
  code: CodeIcon,
  codeBlock: CodeBlockIcon,
  quote: QuoteIcon,
  orderedList: OrderedListIcon,
  unorderedList: UnorderedListIcon,
  link: LinkIcon,
};

const labelMap: Record<FormatAction, string> = {
  bold: 'Bold',
  italic: 'Italic',
  strikethrough: 'Strikethrough',
  code: 'Code',
  codeBlock: 'Code Block',
  quote: 'Quote',
  orderedList: 'Ordered List',
  unorderedList: 'Bulleted List',
  link: 'Link',
};

// ---------------------------------------------------------------------------
// Action grouping
// ---------------------------------------------------------------------------

const separatorAfter = new Set<FormatAction>(['strikethrough', 'codeBlock', 'quote']);

function groupActions(actions: FormatAction[]): FormatAction[][] {
  const groups: FormatAction[][] = [];
  let current: FormatAction[] = [];

  for (const action of actions) {
    current.push(action);
    if (separatorAfter.has(action)) {
      groups.push(current);
      current = [];
    }
  }
  if (current.length > 0) {
    groups.push(current);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Size configs
// ---------------------------------------------------------------------------

const buttonSizeConfigs: Record<'sm' | 'md', { size: number; iconSize: number }> = {
  sm: { size: 26, iconSize: 14 },
  md: { size: 30, iconSize: 16 },
};

// ---------------------------------------------------------------------------
// FormatToolbar
// ---------------------------------------------------------------------------

export const FormatToolbar = forwardRef<View, FormatToolbarProps>(
  function FormatToolbar(
    {
      onAction,
      activeFormats = new Set(),
      visibleActions,
      disabledActions = new Set(),
      size = 'md',
      disabled = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveFormatToolbarColors(theme),
      [theme],
    );

    const actions = visibleActions ?? [...formatActions];
    const cfg = buttonSizeConfigs[size];
    const groups = useMemo(() => groupActions(actions), [actions]);

    const handleAction = useCallback(
      (action: FormatAction) => {
        if (!disabled && !disabledActions.has(action)) {
          onAction(action);
        }
      },
      [onAction, disabled, disabledActions],
    );

    // Override Toolbar's default pill colors with FormatToolbar's dark-surface colors
    const toolbarOverrideStyle: ViewStyle = {
      backgroundColor: colors.bg,
      borderColor: colors.border,
      borderWidth: 1,
      ...(userStyle as ViewStyle),
    };

    // Override separator color to match FormatToolbar's theme
    const separatorOverrideStyle: ViewStyle = {
      backgroundColor: colors.separatorColor,
    };

    return (
      <Toolbar
        ref={ref}
        size="sm"
        variant="pill"
        style={toolbarOverrideStyle}
        {...rest}
      >
        {groups.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <ToolbarSeparator style={separatorOverrideStyle} />}
            <ToolbarGroup gap="xs">
              {group.map((action) => {
                const isActive = activeFormats.has(action);
                const isDisabled = disabled || disabledActions.has(action);
                const Icon = iconMap[action];
                const label = labelMap[action];

                const buttonStyle: ViewStyle = {
                  width: cfg.size,
                  height: cfg.size,
                  borderRadius: defaultRadii.sm,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isActive ? colors.buttonBgActive : colors.buttonBg,
                  opacity: isDisabled ? 0.5 : 1,
                };

                const iconColor = isDisabled
                  ? colors.buttonTextDisabled
                  : isActive
                    ? colors.buttonTextActive
                    : colors.buttonText;

                return (
                  <Pressable
                    key={action}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    accessibilityState={{ selected: isActive, disabled: isDisabled }}
                    disabled={isDisabled}
                    onPress={() => handleAction(action)}
                    style={buttonStyle}
                  >
                    <Icon size={cfg.iconSize} color={iconColor} />
                  </Pressable>
                );
              })}
            </ToolbarGroup>
          </React.Fragment>
        ))}
      </Toolbar>
    );
  },
);

FormatToolbar.displayName = 'FormatToolbar';
