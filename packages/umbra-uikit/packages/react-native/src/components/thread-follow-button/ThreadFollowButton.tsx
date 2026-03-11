/**
 * @module components/thread-follow-button
 * @description React Native ThreadFollowButton for the Wisp design system.
 *
 * A toggle button to follow/unfollow a thread.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Text as RNText, Pressable } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ThreadFollowButtonProps {
  /** Whether the user is currently following. */
  isFollowing: boolean;
  /** Called when the button is pressed. */
  onToggle?: () => void;
  /** Size variant. @default 'sm' */
  size?: 'sm' | 'md';
  /** Whether the button is disabled. @default false */
  disabled?: boolean;
  /** Label when following. @default 'Following' */
  followingLabel?: string;
  /** Label when not following. @default 'Follow' */
  followLabel?: string;
  /** Additional style. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Size config
// ---------------------------------------------------------------------------

const sizeMap: Record<'sm' | 'md', { height: number; paddingX: number; fontSize: number; iconSize: number; gap: number }> = {
  sm: { height: 28, paddingX: 10, fontSize: defaultTypography.sizes.xs.fontSize, iconSize: 14, gap: 4 },
  md: { height: 32, paddingX: 14, fontSize: defaultTypography.sizes.sm.fontSize, iconSize: 16, gap: 6 },
};

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function BellIcon({ size = 14, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </Svg>
  );
}

function BellOffIcon({ size = 14, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5" />
      <Path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7" />
      <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      <Line x1={1} y1={1} x2={23} y2={23} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// ThreadFollowButton
// ---------------------------------------------------------------------------

export const ThreadFollowButton = forwardRef<View, ThreadFollowButtonProps>(
  function ThreadFollowButton(
    {
      isFollowing,
      onToggle,
      size = 'sm',
      disabled = false,
      followingLabel = 'Following',
      followLabel = 'Follow',
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const tc = theme.colors;
    const cfg = sizeMap[size];

    const btnStyle = useMemo<ViewStyle>(() => {
      if (isFollowing) {
        return {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: cfg.height,
          paddingHorizontal: cfg.paddingX,
          gap: cfg.gap,
          borderRadius: defaultRadii.md,
          backgroundColor: tc.background.sunken,
          borderWidth: 1,
          borderColor: tc.border.subtle,
          opacity: disabled ? 0.5 : 1,
        };
      }
      return {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: cfg.height,
        paddingHorizontal: cfg.paddingX,
        gap: cfg.gap,
        borderRadius: defaultRadii.md,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: tc.border.strong,
        opacity: disabled ? 0.5 : 1,
      };
    }, [isFollowing, cfg, tc, disabled]);

    const textStyle = useMemo<TextStyle>(() => ({
      fontSize: cfg.fontSize,
      fontWeight: '500',
      color: isFollowing ? tc.text.secondary : tc.text.link,
    }), [isFollowing, cfg, tc]);

    const label = isFollowing ? followingLabel : followLabel;
    const iconColor = isFollowing ? tc.text.secondary : tc.text.link;

    return (
      <Pressable
        ref={ref}
        onPress={disabled ? undefined : onToggle}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={isFollowing ? 'Unfollow thread' : 'Follow thread'}
        accessibilityState={{ selected: isFollowing, disabled }}
        style={[btnStyle, userStyle]}
      >
        {isFollowing
          ? <BellOffIcon size={cfg.iconSize} color={iconColor} />
          : <BellIcon size={cfg.iconSize} color={iconColor} />
        }
        <RNText style={textStyle}>{label}</RNText>
      </Pressable>
    );
  },
);

ThreadFollowButton.displayName = 'ThreadFollowButton';
