/**
 * @module components/user-picker
 * @description React Native UserPicker for the Wisp design system.
 *
 * A searchable, multi-select list of users. Designed for friend / member
 * selection flows such as group creation or DM participant picking.
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import { resolveUserPickerColors } from '@coexist/wisp-core/styles/UserPicker.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import Svg, { Polyline, Rect } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserPickerStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface UserPickerUser {
  /** Unique identifier (e.g. DID). */
  id: string;
  /** Display name. */
  name: string;
  /** Username handle (e.g. "@alice"). */
  username?: string;
  /** Avatar element. */
  avatar?: React.ReactNode;
  /** Online / presence status. */
  status?: UserPickerStatus;
}

export interface UserPickerProps extends ViewProps {
  /** Available users to pick from. */
  users: UserPickerUser[];
  /** Currently selected user IDs (controlled). */
  selected: Set<string> | string[];
  /** Called when selection changes. */
  onSelectionChange: (selected: string[]) => void;
  /** Search filter value (controlled). */
  search?: string;
  /** Called when search value changes. */
  onSearchChange?: (search: string) => void;
  /** Placeholder for search input. @default 'Search users...' */
  searchPlaceholder?: string;
  /** Maximum number of selections allowed. */
  max?: number;
  /** Message shown when no users match search. @default 'No users found.' */
  emptyMessage?: string;
  /** Whether the picker is disabled. @default false */
  disabled?: boolean;
  /** Show loading skeleton. @default false */
  skeleton?: boolean;
  /** Max height for the scrollable list. @default 240 */
  maxHeight?: number;
}

// ---------------------------------------------------------------------------
// Checkbox icon (checked / unchecked)
// ---------------------------------------------------------------------------

function CheckboxIcon({
  size = 20,
  checked,
  checkedColor,
  checkmarkColor,
  uncheckedColor,
}: {
  size?: number;
  checked: boolean;
  checkedColor: string;
  checkmarkColor: string;
  uncheckedColor: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Rect
        x={2}
        y={2}
        width={20}
        height={20}
        rx={6}
        ry={6}
        fill={checked ? checkedColor : 'none'}
        stroke={checked ? checkedColor : uncheckedColor}
        strokeWidth={2}
      />
      {checked && (
        <Polyline
          points="7.5 12 10.5 15 16.5 9"
          stroke={checkmarkColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Status color helper
// ---------------------------------------------------------------------------

function getStatusColor(
  status: UserPickerStatus,
  colors: ReturnType<typeof resolveUserPickerColors>,
) {
  switch (status) {
    case 'online': return colors.statusOnline;
    case 'idle': return colors.statusIdle;
    case 'dnd': return colors.statusDnd;
    default: return colors.statusOffline;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const UserPicker = forwardRef<View, UserPickerProps>(
  function UserPicker(
    {
      users,
      selected,
      onSelectionChange,
      search: controlledSearch,
      onSearchChange,
      searchPlaceholder = 'Search users...',
      max,
      emptyMessage = 'No users found.',
      disabled = false,
      skeleton = false,
      maxHeight = 240,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveUserPickerColors(theme),
      [theme],
    );

    // Internal search state (uncontrolled)
    const [internalSearch, setInternalSearch] = useState('');
    const searchValue = controlledSearch !== undefined ? controlledSearch : internalSearch;

    const handleSearchChange = useCallback(
      (text: string) => {
        if (controlledSearch === undefined) setInternalSearch(text);
        onSearchChange?.(text);
      },
      [controlledSearch, onSearchChange],
    );

    // Normalize selected to a Set for lookups
    const selectedSet = useMemo(
      () => (selected instanceof Set ? selected : new Set(selected)),
      [selected],
    );

    // Filter users by search query
    const filteredUsers = useMemo(() => {
      if (!searchValue.trim()) return users;
      const query = searchValue.toLowerCase();
      return users.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          (u.username && u.username.toLowerCase().includes(query)),
      );
    }, [users, searchValue]);

    // Toggle selection
    const toggleUser = useCallback(
      (id: string) => {
        if (disabled) return;
        const next = new Set(selectedSet);
        if (next.has(id)) {
          next.delete(id);
        } else {
          if (max != null && next.size >= max) return;
          next.add(id);
        }
        onSelectionChange(Array.from(next));
      },
      [disabled, selectedSet, max, onSelectionChange],
    );

    // ------ Skeleton ------
    if (skeleton) {
      const skeletonContainer: ViewStyle = {
        borderRadius: defaultRadii.lg,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        overflow: 'hidden',
        width: '100%',
      };
      const skeletonSearch: ViewStyle = {
        height: 40,
        backgroundColor: theme.colors.border.subtle,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.subtle,
      };
      const skeletonRow: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        gap: defaultSpacing.md,
        paddingVertical: defaultSpacing.sm,
        paddingHorizontal: defaultSpacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.subtle,
      };
      const skeletonCircle: ViewStyle = {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.border.subtle,
      };
      const skeletonLine = (width: number | string): ViewStyle => ({
        height: 12,
        width: width as any,
        borderRadius: defaultRadii.sm,
        backgroundColor: theme.colors.border.subtle,
      });

      return (
        <View ref={ref} style={[skeletonContainer, userStyle as ViewStyle]} {...rest}>
          <View style={skeletonSearch} />
          {[1, 2, 3].map((i) => (
            <View key={i} style={skeletonRow}>
              <View style={skeletonCircle} />
              <View style={{ flex: 1, gap: 6 }}>
                <View style={skeletonLine('50%')} />
                <View style={skeletonLine('30%')} />
              </View>
            </View>
          ))}
        </View>
      );
    }

    // ------ Styles ------
    const containerStyle: ViewStyle = {
      borderRadius: defaultRadii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      width: '100%',
      opacity: disabled ? 0.5 : 1,
    };

    const searchContainerStyle: ViewStyle = {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: defaultSpacing.md,
      paddingVertical: defaultSpacing.sm,
    };

    const searchInputStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      color: colors.searchText,
      padding: 0,
      outlineStyle: 'none' as any,
    } as TextStyle;

    const rowStyle = (isSelected: boolean): ViewStyle => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.md,
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.md,
      backgroundColor: isSelected ? colors.selectedBg : colors.rowBg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    });

    const nameStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.text,
    };

    const usernameStyle: TextStyle = {
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      fontWeight: String(defaultTypography.weights.regular) as TextStyle['fontWeight'],
      color: colors.textMuted,
    };

    const checkboxWrapperStyle: ViewStyle = {
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
    };

    const emptyStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      color: colors.emptyText,
      paddingVertical: defaultSpacing.lg,
      paddingHorizontal: defaultSpacing.md,
      textAlign: 'center',
    };

    const countBarStyle: ViewStyle = {
      paddingVertical: defaultSpacing.xs,
      paddingHorizontal: defaultSpacing.md,
      backgroundColor: colors.countBg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    };

    const countTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: colors.countText,
    };

    const selectedCount = selectedSet.size;

    return (
      <View
        ref={ref}
        accessibilityRole="list"
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        {/* Search */}
        <View style={searchContainerStyle}>
          <TextInput
            value={searchValue}
            onChangeText={handleSearchChange}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.searchPlaceholder}
            editable={!disabled}
            style={searchInputStyle}
          />
        </View>

        {/* Selected count */}
        {selectedCount > 0 && (
          <View style={countBarStyle}>
            <Text style={countTextStyle}>
              {selectedCount} selected{max != null ? ` (max ${max})` : ''}
            </Text>
          </View>
        )}

        {/* User list */}
        <ScrollView style={{ maxHeight }} nestedScrollEnabled>
          {filteredUsers.length === 0 ? (
            <Text style={emptyStyle}>{emptyMessage}</Text>
          ) : (
            filteredUsers.map((user) => {
              const isSelected = selectedSet.has(user.id);
              return (
                <Pressable
                  key={user.id}
                  onPress={() => toggleUser(user.id)}
                  disabled={disabled}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected, disabled }}
                  style={rowStyle(isSelected)}
                >
                  {/* Avatar with optional status dot */}
                  <View style={{ position: 'relative', flexShrink: 0 }}>
                    {user.avatar}
                    {user.status && user.status !== 'offline' && (
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: getStatusColor(user.status, colors),
                          borderWidth: 2,
                          borderColor: isSelected ? colors.selectedBg : theme.colors.background.canvas,
                        }}
                      />
                    )}
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
                    <Text numberOfLines={1} style={nameStyle}>
                      {user.name}
                    </Text>
                    {user.username && (
                      <Text numberOfLines={1} style={usernameStyle}>
                        {user.username}
                      </Text>
                    )}
                  </View>

                  {/* Checkbox */}
                  <View style={checkboxWrapperStyle}>
                    <CheckboxIcon
                      size={20}
                      checked={isSelected}
                      checkedColor={colors.selectedCheck}
                      checkmarkColor={colors.selectedCheckText}
                      uncheckedColor={colors.border}
                    />
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  },
);

UserPicker.displayName = 'UserPicker';
