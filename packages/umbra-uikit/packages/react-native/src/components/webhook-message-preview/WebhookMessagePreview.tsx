import React, { forwardRef, useMemo } from 'react';
import {
  View,
  Text as RNText,
  TouchableOpacity,
} from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebhookMessagePreviewProps {
  webhookName: string;
  webhookAvatar?: React.ReactNode;
  content: string;
  timestamp?: string;
  media?: React.ReactNode;
  reactions?: Array<{ emoji: string; count: number; reacted?: boolean }>;
  onReactionClick?: (emoji: string) => void;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const WebhookMessagePreview = forwardRef<View, WebhookMessagePreviewProps>(
  function WebhookMessagePreview(
    {
      webhookName,
      webhookAvatar,
      content,
      timestamp,
      media,
      reactions,
      onReactionClick,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;

    const containerStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        gap: defaultSpacing.md,
        paddingVertical: defaultSpacing.xs,
      }),
      [],
    );

    const avatarStyle = useMemo<ViewStyle>(
      () => ({
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: themeColors.background.sunken,
        alignItems: 'center',
        justifyContent: 'center',
      }),
      [themeColors],
    );

    return (
      <View ref={ref} style={[containerStyle, userStyle]}>
        {/* Avatar */}
        <View style={avatarStyle}>
          {webhookAvatar || (
            <RNText
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: themeColors.text.muted,
              } as TextStyle}
            >
              {webhookName.charAt(0).toUpperCase()}
            </RNText>
          )}
        </View>

        {/* Body */}
        <View style={{ flex: 1, gap: 4 }}>
          {/* Header row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <RNText
              style={{
                fontSize: 14,
                fontWeight: defaultTypography.weights.semibold,
                color: themeColors.text.primary,
              } as TextStyle}
            >
              {webhookName}
            </RNText>
            <View
              style={{
                backgroundColor: '#5865F2',
                borderRadius: 3,
                paddingHorizontal: 5,
                paddingVertical: 1,
              }}
            >
              <RNText
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: '#ffffff',
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                } as TextStyle}
              >
                BOT
              </RNText>
            </View>
            {timestamp && (
              <RNText style={{ fontSize: 11, color: themeColors.text.muted } as TextStyle}>
                {timestamp}
              </RNText>
            )}
          </View>

          {/* Content */}
          <RNText
            style={{
              fontSize: 14,
              color: themeColors.text.secondary,
              lineHeight: 21,
            } as TextStyle}
          >
            {content}
          </RNText>

          {/* Media */}
          {media && <View style={{ marginTop: 4 }}>{media}</View>}

          {/* Reactions */}
          {reactions && reactions.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {reactions.map((reaction) => (
                <TouchableOpacity
                  key={reaction.emoji}
                  onPress={() => onReactionClick?.(reaction.emoji)}
                  accessibilityRole="button"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    backgroundColor: reaction.reacted
                      ? themeColors.background.raised
                      : themeColors.background.sunken,
                    borderWidth: 1,
                    borderColor: reaction.reacted
                      ? themeColors.border.default
                      : themeColors.border.subtle,
                    borderRadius: 999,
                  }}
                >
                  <RNText style={{ fontSize: 12 } as TextStyle}>{reaction.emoji}</RNText>
                  <RNText
                    style={{
                      fontSize: 12,
                      color: reaction.reacted
                        ? themeColors.text.primary
                        : themeColors.text.muted,
                    } as TextStyle}
                  >
                    {reaction.count}
                  </RNText>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  },
);

WebhookMessagePreview.displayName = 'WebhookMessagePreview';
