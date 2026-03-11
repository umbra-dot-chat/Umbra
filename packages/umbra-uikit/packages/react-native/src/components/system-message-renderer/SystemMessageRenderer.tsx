import React, { forwardRef, useMemo } from 'react';
import { View, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type { SystemMessageType } from '@coexist/wisp-core/types/SystemMessageRenderer.types';
import { defaultSpacing, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SystemMessageRendererProps {
  /** The message text content. */
  content: string;
  /** Timestamp. */
  timestamp?: string;
  /** System message type (determines icon). @default 'generic' */
  type?: SystemMessageType;
  /** Custom icon override. */
  icon?: React.ReactNode;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Icon emoji map (avoids lucide-react dependency in RN)
// ---------------------------------------------------------------------------

const TYPE_EMOJI: Record<SystemMessageType, string> = {
  join: '\u{2795}',      // heavy plus
  leave: '\u{2796}',     // heavy minus
  pin: '\u{1F4CC}',      // pushpin
  channel_update: '\u{2699}',  // gear
  role_update: '\u{1F6E1}',   // shield
  generic: '\u{2139}',        // info
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SystemMessageRenderer = forwardRef<View, SystemMessageRendererProps>(
  function SystemMessageRenderer(
    {
      content,
      timestamp,
      type = 'generic',
      icon,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const tc = theme.colors;

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------

    const containerStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: defaultSpacing.md,
        paddingVertical: defaultSpacing.sm,
        width: '100%',
      }),
      [],
    );

    const lineStyle = useMemo<ViewStyle>(
      () => ({
        flex: 1,
        height: 1,
        backgroundColor: tc.border.subtle,
      }),
      [tc],
    );

    const contentStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: defaultSpacing.sm,
        flexShrink: 0,
      }),
      [],
    );

    const textStyle = useMemo<TextStyle>(
      () => ({
        fontSize: defaultTypography.sizes.xs.fontSize,
        fontWeight: defaultTypography.weights.regular,
        color: tc.text.muted,
      }),
      [tc],
    );

    const timestampStyle = useMemo<TextStyle>(
      () => ({
        fontSize: defaultTypography.sizes['2xs'].fontSize,
        fontWeight: defaultTypography.weights.regular,
        color: tc.text.muted,
        opacity: 0.7,
      }),
      [tc],
    );

    const iconTextStyle = useMemo<TextStyle>(
      () => ({
        fontSize: 10,
      }),
      [],
    );

    return (
      <View ref={ref} accessibilityRole="text" style={[containerStyle, userStyle]}>
        {/* Left line */}
        <View style={lineStyle} />

        {/* Center content */}
        <View style={contentStyle}>
          {icon ?? <RNText style={iconTextStyle}>{TYPE_EMOJI[type]}</RNText>}
          <RNText style={textStyle}>{content}</RNText>
          {timestamp && <RNText style={timestampStyle}>{timestamp}</RNText>}
        </View>

        {/* Right line */}
        <View style={lineStyle} />
      </View>
    );
  },
);

SystemMessageRenderer.displayName = 'SystemMessageRenderer';
