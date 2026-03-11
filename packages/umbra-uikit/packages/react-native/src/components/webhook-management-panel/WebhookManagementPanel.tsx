import React, { forwardRef, useMemo } from 'react';
import {
  View,
  Text as RNText,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebhookEntry {
  id: string;
  name: string;
  avatarUrl?: string;
  channelName: string;
  channelId: string;
  createdBy: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface WebhookManagementPanelProps {
  webhooks: WebhookEntry[];
  onCreateClick?: () => void;
  onWebhookClick?: (webhookId: string) => void;
  onDeleteWebhook?: (webhookId: string) => void;
  title?: string;
  maxWebhooks?: number;
  loading?: boolean;
  skeleton?: boolean;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const WebhookManagementPanel = forwardRef<View, WebhookManagementPanelProps>(
  function WebhookManagementPanel(
    {
      webhooks,
      onCreateClick,
      onWebhookClick,
      onDeleteWebhook,
      title = 'Webhooks',
      maxWebhooks = 10,
      loading = false,
      skeleton = false,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;

    const containerStyle = useMemo<ViewStyle>(
      () => ({
        backgroundColor: themeColors.background.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: themeColors.border.subtle,
        overflow: 'hidden',
      }),
      [themeColors],
    );

    const headerStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: defaultSpacing.lg,
        paddingVertical: defaultSpacing.md,
        borderBottomWidth: 1,
        borderBottomColor: themeColors.border.subtle,
      }),
      [themeColors],
    );

    const titleTextStyle = useMemo<TextStyle>(
      () => ({
        fontSize: 16,
        fontWeight: defaultTypography.weights.semibold,
        color: themeColors.text.primary,
      }),
      [themeColors],
    );

    if (skeleton) {
      return (
        <View
          ref={ref}
          accessibilityElementsHidden
          style={[containerStyle, { minHeight: 200 }, userStyle]}
        />
      );
    }

    const atMax = webhooks.length >= maxWebhooks;

    return (
      <View ref={ref} accessible accessibilityRole="none" style={[containerStyle, userStyle]}>
        {/* Header */}
        <View style={headerStyle}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <RNText style={titleTextStyle}>{title}</RNText>
            <RNText
              style={{
                fontSize: 12,
                color: themeColors.text.muted,
                marginLeft: 8,
              } as TextStyle}
            >
              {webhooks.length}/{maxWebhooks}
            </RNText>
          </View>
          {onCreateClick && (
            <TouchableOpacity
              onPress={onCreateClick}
              disabled={atMax}
              accessibilityLabel="Create webhook"
              accessibilityRole="button"
              style={{
                paddingHorizontal: defaultSpacing.md,
                paddingVertical: defaultSpacing['2xs'],
                backgroundColor: themeColors.background.raised,
                borderWidth: 1,
                borderColor: themeColors.border.subtle,
                borderRadius: 8,
                opacity: atMax ? 0.5 : 1,
              }}
            >
              <RNText
                style={{
                  fontSize: 13,
                  fontWeight: defaultTypography.weights.medium,
                  color: themeColors.text.primary,
                } as TextStyle}
              >
                Create Webhook
              </RNText>
            </TouchableOpacity>
          )}
        </View>

        {/* Loading */}
        {loading && (
          <View style={{ padding: defaultSpacing['2xl'], alignItems: 'center' }}>
            <RNText style={{ fontSize: 14, color: themeColors.text.muted } as TextStyle}>
              Loading...
            </RNText>
          </View>
        )}

        {/* Empty */}
        {!loading && webhooks.length === 0 && (
          <View style={{ padding: defaultSpacing['2xl'], alignItems: 'center' }}>
            <RNText style={{ fontSize: 14, color: themeColors.text.muted } as TextStyle}>
              No webhooks created yet
            </RNText>
          </View>
        )}

        {/* Webhook list */}
        {!loading && webhooks.length > 0 && (
          <ScrollView style={{ maxHeight: 400 }}>
            {webhooks.map((webhook) => (
              <TouchableOpacity
                key={webhook.id}
                onPress={() => onWebhookClick?.(webhook.id)}
                accessibilityRole="button"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: defaultSpacing.md,
                  paddingHorizontal: defaultSpacing.lg,
                  paddingVertical: defaultSpacing.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: themeColors.border.subtle,
                }}
              >
                {/* Avatar */}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    overflow: 'hidden',
                    backgroundColor: themeColors.background.sunken,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {webhook.avatarUrl ? (
                    <Image
                      source={{ uri: webhook.avatarUrl }}
                      style={{ width: 40, height: 40 }}
                    />
                  ) : (
                    <RNText
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: themeColors.text.muted,
                      } as TextStyle}
                    >
                      {webhook.name.charAt(0).toUpperCase()}
                    </RNText>
                  )}
                </View>

                {/* Info */}
                <View style={{ flex: 1, gap: 2 }}>
                  <RNText
                    numberOfLines={1}
                    style={{
                      fontSize: 14,
                      fontWeight: defaultTypography.weights.medium,
                      color: themeColors.text.primary,
                    } as TextStyle}
                  >
                    {webhook.name}
                  </RNText>
                  <RNText
                    numberOfLines={1}
                    style={{ fontSize: 12, color: themeColors.text.muted } as TextStyle}
                  >
                    #{webhook.channelName}
                  </RNText>
                  <RNText
                    numberOfLines={1}
                    style={{ fontSize: 12, color: themeColors.text.muted } as TextStyle}
                  >
                    Created by {webhook.createdBy} on {webhook.createdAt}
                    {webhook.lastUsedAt ? ` · Last used ${webhook.lastUsedAt}` : ''}
                  </RNText>
                </View>

                {/* Delete */}
                {onDeleteWebhook && (
                  <TouchableOpacity
                    onPress={() => onDeleteWebhook(webhook.id)}
                    accessibilityLabel={`Delete ${webhook.name}`}
                    accessibilityRole="button"
                    style={{
                      paddingHorizontal: defaultSpacing.sm,
                      paddingVertical: defaultSpacing['2xs'],
                      backgroundColor: themeColors.status.dangerSurface,
                      borderWidth: 1,
                      borderColor: themeColors.status.dangerBorder,
                      borderRadius: 8,
                    }}
                  >
                    <RNText
                      style={{
                        fontSize: 12,
                        fontWeight: defaultTypography.weights.medium,
                        color: themeColors.status.danger,
                      } as TextStyle}
                    >
                      Delete
                    </RNText>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  },
);

WebhookManagementPanel.displayName = 'WebhookManagementPanel';
