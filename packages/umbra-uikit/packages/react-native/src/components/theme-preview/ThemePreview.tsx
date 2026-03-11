/**
 * @module components/theme-preview
 * @description React Native ThemePreview component for the Wisp design system.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Text } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import { resolveThemePreviewColors } from '@coexist/wisp-core/styles/ThemePreview.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const SAMPLE_CHANNELS = ['# general', '# announcements', '# off-topic', '# dev'];
const SAMPLE_MESSAGES = [
  { author: 'Alice', text: 'Hey everyone, welcome!' },
  { author: 'Bob', text: 'Thanks for having me.' },
  { author: 'Carol', text: 'Great new theme.' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ThemePreviewProps extends ViewProps {
  accentColor?: string;
  customCss?: string;
  communityName?: string;
  communityIcon?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ThemePreview = forwardRef<View, ThemePreviewProps>(
  function ThemePreview(
    {
      accentColor = '#6366f1',
      communityName = 'My Community',
      communityIcon,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveThemePreviewColors(theme),
      [theme],
    );

    const containerStyle = useMemo<ViewStyle>(() => ({
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBg,
      overflow: 'hidden',
      width: '100%' as any,
      maxWidth: 400,
      minHeight: 280,
    }), [theme, colors]);

    const headerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: accentColor,
    }), [theme, accentColor]);

    const iconStyle = useMemo<ViewStyle>(() => ({
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    }), []);

    return (
      <View ref={ref} style={[containerStyle, userStyle]} {...rest}>
        {/* Header */}
        <View style={headerStyle}>
          <View style={iconStyle}>
            {communityIcon ?? (
              <Text style={{ fontSize: 14, color: '#fff' }}>
                {communityName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={{ color: '#ffffff', fontWeight: theme.typography.weights.semibold, fontSize: theme.typography.sizes.sm.fontSize }}>
            {communityName}
          </Text>
        </View>

        {/* Body */}
        <View style={{ flexDirection: 'row', flex: 1 }}>
          {/* Channel List */}
          <View style={{
            width: 120,
            backgroundColor: colors.channelBg,
            borderRightWidth: 1,
            borderRightColor: colors.border,
            padding: theme.spacing.sm,
            gap: 2,
          }}>
            {SAMPLE_CHANNELS.map((ch, i) => (
              <View
                key={ch}
                style={{
                  paddingHorizontal: theme.spacing.xs,
                  paddingVertical: theme.spacing['2xs'],
                  borderRadius: theme.radii.sm,
                  backgroundColor: i === 0 ? colors.bg : 'transparent',
                }}
              >
                <Text style={{
                  fontSize: theme.typography.sizes.xs.fontSize,
                  color: i === 0 ? accentColor : colors.textSecondary,
                  fontWeight: i === 0 ? theme.typography.weights.semibold : theme.typography.weights.regular,
                }}
                numberOfLines={1}
                >
                  {ch}
                </Text>
              </View>
            ))}
          </View>

          {/* Message Area */}
          <View style={{
            flex: 1,
            padding: theme.spacing.sm,
            backgroundColor: colors.bg,
            gap: theme.spacing.sm,
          }}>
            {SAMPLE_MESSAGES.map((msg, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: theme.spacing.xs, alignItems: 'flex-start' }}>
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: accentColor,
                  opacity: 0.7,
                }} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: theme.typography.sizes.xs.fontSize, fontWeight: theme.typography.weights.semibold, color: accentColor }}>
                    {msg.author}
                  </Text>
                  <Text style={{ fontSize: theme.typography.sizes.xs.fontSize, color: colors.textSecondary, lineHeight: theme.typography.sizes.xs.fontSize * 1.4 }}>
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  },
);

ThemePreview.displayName = 'ThemePreview';
