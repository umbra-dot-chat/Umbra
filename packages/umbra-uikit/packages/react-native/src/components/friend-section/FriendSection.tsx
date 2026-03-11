/**
 * @module components/friend-section
 * @description React Native FriendSection for the Wisp design system.
 *
 * A collapsible section header with count badge that groups friend list items.
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import { resolveFriendSectionColors } from '@coexist/wisp-core/styles/FriendSection.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import Svg, { Path } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FriendSectionProps extends ViewProps {
  /** Section title (e.g. "Online", "Pending Requests"). */
  title: string;
  /** Item count displayed next to the title. */
  count?: number;
  /** Whether the section is initially collapsed. @default false */
  defaultCollapsed?: boolean;
  /** Controlled collapsed state. */
  collapsed?: boolean;
  /** Callback when collapsed state changes. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Content (typically FriendListItem / FriendRequestItem children). */
  children?: React.ReactNode;
  /** Message shown when the section has no children. */
  emptyMessage?: string;
}

// ---------------------------------------------------------------------------
// Chevron icon
// ---------------------------------------------------------------------------

function ChevronIcon({ size = 12, color, rotated }: { size?: number; color?: string; rotated?: boolean }) {
  return (
    <View style={{ transform: [{ rotate: rotated ? '0deg' : '-90deg' }] }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <Path d="m6 9 6 6 6-6" />
      </Svg>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const FriendSection = forwardRef<View, FriendSectionProps>(
  function FriendSection(
    {
      title,
      count,
      defaultCollapsed = false,
      collapsed: controlledCollapsed,
      onCollapsedChange,
      children,
      emptyMessage,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
    const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

    const colors = useMemo(
      () => resolveFriendSectionColors(theme),
      [theme],
    );

    const toggleCollapsed = useCallback(() => {
      const next = !isCollapsed;
      if (controlledCollapsed === undefined) {
        setInternalCollapsed(next);
      }
      onCollapsedChange?.(next);
    }, [isCollapsed, controlledCollapsed, onCollapsedChange]);

    // ------ Styles ------
    const headerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.sm,
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.md,
    };

    const titleStyle: TextStyle = {
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.headerText,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    };

    const countStyle: ViewStyle & TextStyle = {
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      lineHeight: defaultTypography.sizes['2xs'].lineHeight,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: colors.countText,
      backgroundColor: colors.countBg,
      borderRadius: 99,
      paddingHorizontal: 6,
      minWidth: 20,
      textAlign: 'center',
      overflow: 'hidden',
    };

    const emptyStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      color: colors.emptyText,
      paddingVertical: defaultSpacing.lg,
      paddingHorizontal: defaultSpacing.md,
      textAlign: 'center',
    };

    const hasChildren = React.Children.count(children) > 0;

    return (
      <View ref={ref} style={[{ width: '100%' }, userStyle as ViewStyle]} {...rest}>
        {/* Header */}
        <Pressable
          onPress={toggleCollapsed}
          accessibilityRole="button"
          accessibilityState={{ expanded: !isCollapsed }}
          style={headerStyle}
        >
          <ChevronIcon size={12} color={colors.chevron} rotated={!isCollapsed} />
          <Text style={titleStyle}>{title}</Text>
          {count != null && (
            <Text style={countStyle}>{count}</Text>
          )}
        </Pressable>

        {/* Content */}
        {!isCollapsed && (
          hasChildren
            ? <View>{children}</View>
            : emptyMessage
              ? <Text style={emptyStyle}>{emptyMessage}</Text>
              : null
        )}
      </View>
    );
  },
);

FriendSection.displayName = 'FriendSection';
