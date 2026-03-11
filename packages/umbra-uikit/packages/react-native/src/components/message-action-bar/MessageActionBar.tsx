/**
 * @module components/message-action-bar
 * @description React Native MessageActionBar for the Wisp design system.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import type { ViewProps, ViewStyle } from 'react-native';
import { resolveMessageActionBarColors } from '@coexist/wisp-core/styles/MessageActionBar.styles';
import { defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import Svg, { Circle, Path, Line } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MessageAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export interface MessageActionBarProps extends ViewProps {
  actions: MessageAction[];
  position?: 'top-left' | 'top-right';
  showEmojiReact?: boolean;
  onEmojiReactClick?: () => void;
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function SmileIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={10} />
      <Path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <Line x1={9} y1={9} x2={9.01} y2={9} />
      <Line x1={15} y1={9} x2={15.01} y2={9} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// MessageActionBar
// ---------------------------------------------------------------------------

export const MessageActionBar = forwardRef<View, MessageActionBarProps>(
  function MessageActionBar(
    {
      actions,
      position = 'top-right',
      showEmojiReact = false,
      onEmojiReactClick,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const colors = useMemo(() => resolveMessageActionBarColors(theme), [theme]);

    const containerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 1,
      padding: 2,
      borderRadius: defaultRadii.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.mode === 'light' ? 0.08 : 0.3,
      shadowRadius: 8,
      elevation: 4,
    };

    const separatorStyle: ViewStyle = {
      width: 1,
      height: 16,
      backgroundColor: colors.border,
      marginHorizontal: 2,
    };

    return (
      <View
        ref={ref}
        accessibilityRole="toolbar"
        accessibilityLabel="Message actions"
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        {showEmojiReact && (
          <>
            <ActionButton
              action={{
                key: '__emoji_react',
                label: 'Add reaction',
                icon: <SmileIcon size={16} color={colors.icon} />,
                onClick: () => onEmojiReactClick?.(),
              }}
              colors={colors}
            />
            {actions.length > 0 && <View style={separatorStyle} />}
          </>
        )}
        {actions.map((action) => (
          <ActionButton key={action.key} action={action} colors={colors} />
        ))}
      </View>
    );
  },
);

MessageActionBar.displayName = 'MessageActionBar';

// ---------------------------------------------------------------------------
// ActionButton (internal)
// ---------------------------------------------------------------------------

function ActionButton({
  action,
  colors,
}: {
  action: MessageAction;
  colors: ReturnType<typeof resolveMessageActionBarColors>;
}) {
  const btnStyle: ViewStyle = {
    width: 28,
    height: 28,
    borderRadius: defaultRadii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: action.disabled ? 0.4 : 1,
  };

  const handlePress = useCallback(() => {
    if (!action.disabled) action.onClick();
  }, [action]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={action.disabled}
      accessibilityLabel={action.label}
      accessibilityRole="button"
      style={btnStyle}
    >
      {action.icon}
    </Pressable>
  );
}
