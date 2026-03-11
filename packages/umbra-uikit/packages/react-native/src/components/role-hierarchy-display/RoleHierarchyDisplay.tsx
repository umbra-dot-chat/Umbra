/**
 * @module components/role-hierarchy-display
 * @description React Native RoleHierarchyDisplay for the Wisp design system.
 *
 * A visual display of the role hierarchy in a community. Shows roles in
 * order of authority (position) with optional long-press reordering.
 * Uses inline RoleBadge-style rendering for each row.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { HierarchyRole } from '@coexist/wisp-core/types/RoleHierarchyDisplay.types';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import Svg, { Circle } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Props (RN-specific — ViewProps instead of HTMLAttributes)
// ---------------------------------------------------------------------------

export interface RoleHierarchyDisplayProps extends ViewProps {
  /** Roles to display, will be sorted by position. */
  roles: HierarchyRole[];
  /** Called when a role is pressed. */
  onRoleClick?: (roleId: string) => void;
  /** Title. @default 'Role Hierarchy' */
  title?: string;
  /** Description text below title. */
  description?: string;
  /** Loading state. @default false */
  loading?: boolean;
  /** Skeleton state. @default false */
  skeleton?: boolean;
}

// ---------------------------------------------------------------------------
// Inline SVG — GripVertical icon
// ---------------------------------------------------------------------------

function GripVerticalIcon({ size = 16, color }: { size?: number; color?: string }) {
  const c = color ?? '#888';
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Circle cx={9} cy={5} r={1} fill={c} />
      <Circle cx={9} cy={12} r={1} fill={c} />
      <Circle cx={9} cy={19} r={1} fill={c} />
      <Circle cx={15} cy={5} r={1} fill={c} />
      <Circle cx={15} cy={12} r={1} fill={c} />
      <Circle cx={15} cy={19} r={1} fill={c} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Hex-to-RGB helper
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let sanitized = hex.replace('#', '');
  if (sanitized.length === 3) {
    sanitized = sanitized[0] + sanitized[0] + sanitized[1] + sanitized[1] + sanitized[2] + sanitized[2];
  }
  const num = parseInt(sanitized, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const RoleHierarchyDisplay = forwardRef<View, RoleHierarchyDisplayProps>(
  function RoleHierarchyDisplay(
    {
      roles,
      onRoleClick,
      title = 'Role Hierarchy',
      description,
      loading = false,
      skeleton = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;

    // -- Sort roles by position (ascending: 0 = highest authority) --
    const sortedRoles = useMemo(() => {
      return [...roles].sort((a, b) => a.position - b.position);
    }, [roles]);

    const handleRolePress = useCallback(
      (roleId: string) => {
        onRoleClick?.(roleId);
      },
      [onRoleClick],
    );

    // -- Styles --
    const containerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'column',
      gap: defaultSpacing.xs,
    }), []);

    const headerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'column',
      gap: defaultSpacing['2xs'],
      marginBottom: defaultSpacing.xs,
    }), []);

    const titleTextStyle = useMemo<TextStyle>(() => ({
      fontSize: 14,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: themeColors.text.primary,
      lineHeight: 20,
    }), [themeColors]);

    const descriptionTextStyle = useMemo<TextStyle>(() => ({
      fontSize: 12,
      color: themeColors.text.muted,
      lineHeight: 17,
    }), [themeColors]);

    const roleRowStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.sm,
      paddingVertical: defaultSpacing.xs,
      paddingHorizontal: defaultSpacing.sm,
      borderRadius: defaultRadii.md,
      minHeight: 36,
    }), []);

    const positionBadgeStyle = useMemo<ViewStyle>(() => ({
      width: 20,
      height: 20,
      borderRadius: defaultRadii.sm,
      backgroundColor: `rgba(${themeColors.text.primary === '#ffffff' ? '255,255,255' : '0,0,0'}, 0.08)`,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }), [themeColors]);

    const positionTextStyle = useMemo<TextStyle>(() => ({
      fontSize: 10,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: themeColors.text.muted,
      fontFamily: 'Courier',
    }), [themeColors]);

    const memberCountStyle = useMemo<TextStyle>(() => ({
      fontSize: 11,
      color: themeColors.text.muted,
      marginLeft: 'auto',
      flexShrink: 0,
    }), [themeColors]);

    const loadingTextStyle = useMemo<TextStyle>(() => ({
      fontSize: 12,
      color: themeColors.text.muted,
    }), [themeColors]);

    const skeletonRowStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.sm,
      paddingVertical: defaultSpacing.xs,
      paddingHorizontal: defaultSpacing.sm,
      height: 36,
      borderRadius: defaultRadii.md,
      backgroundColor: `rgba(${themeColors.text.primary === '#ffffff' ? '255,255,255' : '0,0,0'}, 0.04)`,
    }), [themeColors]);

    // -- Skeleton render --
    if (skeleton) {
      return (
        <View ref={ref} style={[containerStyle, userStyle as ViewStyle]} {...rest}>
          <View style={headerStyle}>
            <View
              style={{
                width: 120,
                height: 16,
                borderRadius: 4,
                backgroundColor: themeColors.border.subtle,
              }}
            />
          </View>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={skeletonRowStyle} />
          ))}
        </View>
      );
    }

    // -- Loading render --
    if (loading) {
      return (
        <View ref={ref} style={[containerStyle, userStyle as ViewStyle]} {...rest}>
          <View style={headerStyle}>
            {title ? <Text style={titleTextStyle}>{title}</Text> : null}
          </View>
          <Text style={loadingTextStyle}>Loading roles...</Text>
        </View>
      );
    }

    // -- Inline RoleBadge renderer --
    const renderRoleBadge = (role: HierarchyRole) => {
      const { r, g, b } = hexToRgb(role.color);
      const badgeBg = `rgba(${r}, ${g}, ${b}, 0.15)`;
      const badgeBorder = `rgba(${r}, ${g}, ${b}, 0.3)`;

      const badgeStyle: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        height: 20,
        paddingHorizontal: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: badgeBorder,
        backgroundColor: badgeBg,
        gap: 4,
        alignSelf: 'flex-start',
      };

      const dotStyle: ViewStyle = {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: role.color,
      };

      const nameStyle: TextStyle = {
        fontSize: 11,
        fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
        color: role.color,
      };

      return (
        <View style={badgeStyle}>
          <View style={dotStyle} />
          <Text style={nameStyle} numberOfLines={1}>{role.name}</Text>
        </View>
      );
    };

    return (
      <View
        ref={ref}
        accessibilityRole="summary"
        accessibilityLabel={title || 'Role Hierarchy'}
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        {/* Header */}
        {(title || description) && (
          <View style={headerStyle}>
            {title ? <Text style={titleTextStyle}>{title}</Text> : null}
            {description ? <Text style={descriptionTextStyle}>{description}</Text> : null}
          </View>
        )}

        {/* Role list */}
        <ScrollView>
          {sortedRoles.map((role) => (
            <Pressable
              key={role.id}
              accessibilityRole="button"
              accessibilityLabel={`Role: ${role.name}, position ${role.position}`}
              style={roleRowStyle}
              onPress={() => handleRolePress(role.id)}
            >
              {/* Position badge */}
              <View style={positionBadgeStyle}>
                <Text style={positionTextStyle}>{role.position}</Text>
              </View>

              {/* Role badge */}
              {renderRoleBadge(role)}

              {/* Member count */}
              {role.memberCount != null && (
                <Text style={memberCountStyle}>
                  {role.memberCount} {role.memberCount === 1 ? 'member' : 'members'}
                </Text>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  },
);

RoleHierarchyDisplay.displayName = 'RoleHierarchyDisplay';
