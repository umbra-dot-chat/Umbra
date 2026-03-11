import React, { forwardRef, useMemo } from 'react';
import { View, Pressable, Text as RNText } from 'react-native';
import type { TextStyle } from 'react-native';
import type { ListItemSize } from '@coexist/wisp-core/types/ListItem.types';
import { listItemSizeMap } from '@coexist/wisp-core/types/ListItem.types';
import { defaultSpacing, defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

export interface ListItemProps {
  children?: React.ReactNode;
  /** Size preset. @default 'md' */
  size?: ListItemSize;
  /** Leading slot — icon, avatar, checkbox, etc. */
  leading?: React.ReactNode;
  /** Trailing slot — actions, metadata, badges, etc. */
  trailing?: React.ReactNode;
  /** Vertical alignment of leading/trailing with content. @default 'center' */
  align?: 'start' | 'center' | 'end';
  /** Make the list item interactive (add press feedback). @default false */
  interactive?: boolean;
  /** Whether the item is in an active/selected state. @default false */
  active?: boolean;
  /** Whether the item is disabled. @default false */
  disabled?: boolean;
  /** Press handler (only when interactive). */
  onPress?: () => void;
  style?: object;
}

export const ListItem = forwardRef<View, ListItemProps>(function ListItem(
  {
    children,
    size = 'md',
    leading,
    trailing,
    align = 'center',
    interactive = false,
    active = false,
    disabled = false,
    onPress,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const config = listItemSizeMap[size];

  const alignValue =
    align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : 'center';

  const backgroundColor = active ? themeColors.accent.highlight : 'transparent';

  const containerStyle = useMemo(
    () => ({
      flexDirection: 'row' as const,
      alignItems: alignValue,
      gap: config.gap,
      minHeight: config.minHeight,
      paddingHorizontal: config.paddingX,
      paddingVertical: config.paddingY,
      borderRadius: defaultRadii.md,
      overflow: 'hidden' as const,
      backgroundColor,
      opacity: disabled ? 0.5 : 1,
    }),
    [alignValue, config, backgroundColor, disabled],
  );

  const content = (
    <>
      {leading && (
        <View style={{ flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
          {leading}
        </View>
      )}
      <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
        {typeof children === 'string' || typeof children === 'number' ? (
          <RNText style={{ color: themeColors.text.primary } as TextStyle}>{children}</RNText>
        ) : (
          children
        )}
      </View>
      {trailing && (
        <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.sm }}>
          {trailing}
        </View>
      )}
    </>
  );

  if (interactive) {
    return (
      <Pressable
        ref={ref}
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          containerStyle,
          pressed && !active && !disabled
            ? { backgroundColor: themeColors.background.surface }
            : undefined,
          userStyle,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View ref={ref} style={[containerStyle, userStyle]}>
      {content}
    </View>
  );
});

ListItem.displayName = 'ListItem';
