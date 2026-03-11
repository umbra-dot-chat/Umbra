import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text as RNText,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebhookCreateData {
  name: string;
  channelId: string;
}

export interface WebhookCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: WebhookCreateData) => void;
  channels: Array<{ id: string; name: string }>;
  submitting?: boolean;
  error?: string;
  title?: string;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const WebhookCreateDialog = forwardRef<View, WebhookCreateDialogProps>(
  function WebhookCreateDialog(
    {
      open,
      onClose,
      onSubmit,
      channels,
      submitting = false,
      error,
      title = 'Create Webhook',
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;

    const [name, setName] = useState('');
    const [selectedChannelIndex, setSelectedChannelIndex] = useState(0);

    const containerStyle = useMemo<ViewStyle>(
      () => ({
        backgroundColor: themeColors.background.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: themeColors.border.subtle,
        overflow: 'hidden',
        width: '100%',
        maxWidth: 480,
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

    const handleSubmit = useCallback(() => {
      const channelId = channels[selectedChannelIndex]?.id;
      if (!name.trim() || !channelId) return;
      onSubmit?.({ name: name.trim(), channelId });
    }, [name, selectedChannelIndex, channels, onSubmit]);

    return (
      <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: defaultSpacing.lg,
          }}
        >
          <View ref={ref} style={[containerStyle, userStyle]}>
            {/* Header */}
            <View style={headerStyle}>
              <RNText
                style={{
                  fontSize: 16,
                  fontWeight: defaultTypography.weights.semibold,
                  color: themeColors.text.primary,
                } as TextStyle}
              >
                {title}
              </RNText>
              <TouchableOpacity
                onPress={onClose}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <RNText style={{ fontSize: 16, color: themeColors.text.muted } as TextStyle}>
                  ✕
                </RNText>
              </TouchableOpacity>
            </View>

            {/* Body */}
            <View
              style={{
                padding: defaultSpacing.lg,
                gap: defaultSpacing.md,
              }}
            >
              {/* Name */}
              <View>
                <RNText
                  style={{
                    fontSize: 13,
                    fontWeight: defaultTypography.weights.medium,
                    color: themeColors.text.secondary,
                    marginBottom: 4,
                  } as TextStyle}
                >
                  Name
                </RNText>
                <TextInput
                  placeholder="Enter webhook name"
                  placeholderTextColor={themeColors.text.muted}
                  value={name}
                  onChangeText={setName}
                  accessibilityLabel="Webhook name"
                  style={{
                    padding: defaultSpacing.xs,
                    fontSize: 14,
                    backgroundColor: themeColors.background.sunken,
                    color: themeColors.text.primary,
                    borderWidth: 1,
                    borderColor: themeColors.border.subtle,
                    borderRadius: 8,
                  } as TextStyle}
                />
              </View>

              {/* Channel selector (simple text buttons for RN) */}
              <View>
                <RNText
                  style={{
                    fontSize: 13,
                    fontWeight: defaultTypography.weights.medium,
                    color: themeColors.text.secondary,
                    marginBottom: 4,
                  } as TextStyle}
                >
                  Channel
                </RNText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {channels.map((ch, idx) => (
                    <TouchableOpacity
                      key={ch.id}
                      onPress={() => setSelectedChannelIndex(idx)}
                      accessibilityRole="button"
                      style={{
                        paddingHorizontal: defaultSpacing.sm,
                        paddingVertical: defaultSpacing['2xs'],
                        backgroundColor:
                          idx === selectedChannelIndex
                            ? themeColors.background.raised
                            : themeColors.background.sunken,
                        borderWidth: 1,
                        borderColor:
                          idx === selectedChannelIndex
                            ? themeColors.border.default
                            : themeColors.border.subtle,
                        borderRadius: 8,
                      }}
                    >
                      <RNText
                        style={{
                          fontSize: 13,
                          color:
                            idx === selectedChannelIndex
                              ? themeColors.text.primary
                              : themeColors.text.muted,
                        } as TextStyle}
                      >
                        #{ch.name}
                      </RNText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Error */}
              {error && (
                <RNText style={{ fontSize: 13, color: themeColors.status.danger } as TextStyle}>
                  {error}
                </RNText>
              )}
            </View>

            {/* Footer */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: defaultSpacing.sm,
                paddingHorizontal: defaultSpacing.lg,
                paddingVertical: defaultSpacing.md,
                borderTopWidth: 1,
                borderTopColor: themeColors.border.subtle,
              }}
            >
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                style={{
                  paddingHorizontal: defaultSpacing.md,
                  paddingVertical: defaultSpacing.xs,
                  borderWidth: 1,
                  borderColor: themeColors.border.subtle,
                  borderRadius: 8,
                }}
              >
                <RNText
                  style={{
                    fontSize: 13,
                    fontWeight: defaultTypography.weights.medium,
                    color: themeColors.text.secondary,
                  } as TextStyle}
                >
                  Cancel
                </RNText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting || !name.trim()}
                accessibilityLabel="Create"
                accessibilityRole="button"
                style={{
                  paddingHorizontal: defaultSpacing.md,
                  paddingVertical: defaultSpacing.xs,
                  backgroundColor: themeColors.text.primary,
                  borderRadius: 8,
                  opacity: submitting || !name.trim() ? 0.5 : 1,
                }}
              >
                <RNText
                  style={{
                    fontSize: 13,
                    fontWeight: defaultTypography.weights.medium,
                    color: themeColors.background.canvas,
                  } as TextStyle}
                >
                  {submitting ? 'Creating...' : 'Create'}
                </RNText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

WebhookCreateDialog.displayName = 'WebhookCreateDialog';
