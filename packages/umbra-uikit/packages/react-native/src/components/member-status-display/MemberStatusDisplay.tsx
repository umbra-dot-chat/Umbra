/**
 * @module components/member-status-display
 * @description React Native MemberStatusDisplay for the Wisp design system.
 *
 * An inline display of a member's custom status (emoji + text).
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Text } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import { memberStatusDisplaySizeMap } from '@coexist/wisp-core/types/MemberStatusDisplay.types';
import type { MemberStatusDisplaySize } from '@coexist/wisp-core/types/MemberStatusDisplay.types';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MemberStatusDisplayProps extends ViewProps {
  text?: string;
  emoji?: string;
  size?: MemberStatusDisplaySize;
  truncate?: boolean;
  maxWidth?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MemberStatusDisplay = forwardRef<View, MemberStatusDisplayProps>(
  function MemberStatusDisplay(
    {
      text,
      emoji,
      size = 'sm',
      truncate = true,
      maxWidth = 200,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;

    const sizeConfig = useMemo(
      () => memberStatusDisplaySizeMap[size],
      [size],
    );

    const containerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizeConfig.gap,
      maxWidth: truncate ? maxWidth : undefined,
    }), [sizeConfig, truncate, maxWidth]);

    const emojiStyle = useMemo<TextStyle>(() => ({
      fontSize: sizeConfig.emojiSize,
      lineHeight: sizeConfig.emojiSize + 2,
    }), [sizeConfig]);

    const textStyle = useMemo<TextStyle>(() => ({
      fontSize: sizeConfig.fontSize,
      lineHeight: sizeConfig.fontSize * sizeConfig.lineHeight,
      color: themeColors.text.muted,
      flexShrink: 1,
    }), [sizeConfig, themeColors]);

    if (!text && !emoji) return null;

    return (
      <View
        ref={ref}
        style={[containerStyle, userStyle]}
        accessibilityLabel={[emoji, text].filter(Boolean).join(' ')}
        {...rest}
      >
        {emoji ? <Text style={emojiStyle}>{emoji}</Text> : null}
        {text ? (
          <Text
            style={textStyle}
            numberOfLines={truncate ? 1 : undefined}
            ellipsizeMode={truncate ? 'tail' : undefined}
          >
            {text}
          </Text>
        ) : null}
      </View>
    );
  },
);

MemberStatusDisplay.displayName = 'MemberStatusDisplay';
