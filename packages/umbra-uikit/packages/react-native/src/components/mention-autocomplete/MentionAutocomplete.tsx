/**
 * @module components/mention-autocomplete
 * @description React Native MentionAutocomplete for the Wisp design system.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import { resolveMentionAutocompleteColors } from '@coexist/wisp-core/styles/MentionAutocomplete.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MentionUser {
  id: string;
  name: string;
  username?: string;
  avatar?: React.ReactNode;
  online?: boolean;
}

export interface MentionAutocompleteProps extends ViewProps {
  users: MentionUser[];
  query?: string;
  activeIndex?: number;
  onSelect: (user: MentionUser) => void;
  onActiveIndexChange?: (index: number) => void;
  maxVisible?: number;
  open?: boolean;
  loading?: boolean;
  emptyText?: string;
}

// ---------------------------------------------------------------------------
// MentionAutocomplete
// ---------------------------------------------------------------------------

export const MentionAutocomplete = forwardRef<View, MentionAutocompleteProps>(
  function MentionAutocomplete(
    {
      users,
      query,
      activeIndex = 0,
      onSelect,
      onActiveIndexChange,
      maxVisible = 5,
      open = true,
      loading = false,
      emptyText = 'No users found',
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const colors = useMemo(() => resolveMentionAutocompleteColors(theme), [theme]);

    if (!open) return null;

    const containerStyle: ViewStyle = {
      maxHeight: maxVisible * 44,
      borderRadius: defaultRadii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.mode === 'light' ? 0.1 : 0.4,
      shadowRadius: 16,
      elevation: 8,
      padding: 4,
      overflow: 'hidden',
    };

    const emptyTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      color: colors.textMuted,
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.md,
      textAlign: 'center',
    };

    const showEmpty = !loading && users.length === 0;

    return (
      <View ref={ref} style={[containerStyle, userStyle as ViewStyle]} {...rest}>
        <ScrollView>
          {loading && <Text style={emptyTextStyle}>Searching…</Text>}
          {showEmpty && <Text style={emptyTextStyle}>{emptyText}</Text>}

          {!loading && users.map((user, index) => (
            <MentionItem
              key={user.id}
              user={user}
              active={index === activeIndex}
              colors={colors}
              onSelect={onSelect}
              onHover={() => onActiveIndexChange?.(index)}
            />
          ))}
        </ScrollView>
      </View>
    );
  },
);

MentionAutocomplete.displayName = 'MentionAutocomplete';

// ---------------------------------------------------------------------------
// MentionItem (internal)
// ---------------------------------------------------------------------------

function MentionItem({
  user,
  active,
  colors,
  onSelect,
  onHover,
}: {
  user: MentionUser;
  active: boolean;
  colors: ReturnType<typeof resolveMentionAutocompleteColors>;
  onSelect: (user: MentionUser) => void;
  onHover: () => void;
}) {
  const itemStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: defaultSpacing.sm,
    paddingVertical: defaultSpacing.xs,
    paddingHorizontal: defaultSpacing.sm,
    borderRadius: defaultRadii.md,
    backgroundColor: active ? colors.itemBgActive : 'transparent',
    minHeight: 36,
  };

  const nameStyle: TextStyle = {
    fontSize: defaultTypography.sizes.sm.fontSize,
    fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
    color: active ? colors.textActive : colors.text,
  };

  const usernameStyle: TextStyle = {
    fontSize: defaultTypography.sizes.xs.fontSize,
    color: active ? colors.textMutedActive : colors.textMuted,
  };

  const onlineDotStyle: ViewStyle = {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.onlineDot,
    borderWidth: 1.5,
    borderColor: colors.bg,
  };

  const handlePress = useCallback(() => onSelect(user), [user, onSelect]);

  return (
    <Pressable onPress={handlePress} accessibilityRole="button" style={itemStyle}>
      <View style={{ position: 'relative', flexShrink: 0 }}>
        {user.avatar}
        {user.online && <View style={onlineDotStyle} />}
      </View>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text numberOfLines={1} style={nameStyle}>{user.name}</Text>
        {user.username && <Text numberOfLines={1} style={usernameStyle}>@{user.username}</Text>}
      </View>
    </Pressable>
  );
}
