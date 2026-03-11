import React, { forwardRef, useMemo, useState } from 'react';
import {
  View,
  Text as RNText,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebhookDetailPageProps {
  name: string;
  avatarUrl?: string;
  channelName: string;
  token: string;
  createdBy: string;
  createdAt: string;
  onNameChange?: (name: string) => void;
  onRegenerateToken?: () => void;
  onDelete?: () => void;
  onCopyToken?: (token: string) => void;
  saving?: boolean;
  onSave?: () => void;
  skeleton?: boolean;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const WebhookDetailPage = forwardRef<View, WebhookDetailPageProps>(
  function WebhookDetailPage(
    {
      name,
      avatarUrl,
      channelName,
      token,
      createdBy,
      createdAt,
      onNameChange,
      onRegenerateToken,
      onDelete,
      onCopyToken,
      saving = false,
      onSave,
      skeleton = false,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;

    const [showConfirmRegenerate, setShowConfirmRegenerate] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const containerStyle = useMemo<ViewStyle>(
      () => ({
        backgroundColor: themeColors.background.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: themeColors.border.subtle,
        padding: defaultSpacing.lg,
        gap: defaultSpacing.lg,
      }),
      [themeColors],
    );

    if (skeleton) {
      return (
        <View
          ref={ref}
          accessibilityElementsHidden
          style={[containerStyle, { minHeight: 300 }, userStyle]}
        />
      );
    }

    return (
      <View ref={ref} accessible accessibilityRole="none" style={[containerStyle, userStyle]}>
        {/* Avatar + heading */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.md }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              overflow: 'hidden',
              backgroundColor: themeColors.background.sunken,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={{ width: 64, height: 64 }} />
            ) : (
              <RNText
                style={{
                  fontSize: 24,
                  fontWeight: '600',
                  color: themeColors.text.muted,
                } as TextStyle}
              >
                {name.charAt(0).toUpperCase()}
              </RNText>
            )}
          </View>
          <View style={{ gap: 2 }}>
            <RNText
              style={{
                fontSize: 18,
                fontWeight: defaultTypography.weights.semibold,
                color: themeColors.text.primary,
              } as TextStyle}
            >
              {name}
            </RNText>
            <RNText style={{ fontSize: 12, color: themeColors.text.muted } as TextStyle}>
              #{channelName}
            </RNText>
          </View>
        </View>

        {/* Name edit */}
        <View style={{ gap: defaultSpacing.sm }}>
          <RNText
            style={{
              fontSize: 13,
              fontWeight: defaultTypography.weights.medium,
              color: themeColors.text.secondary,
            } as TextStyle}
          >
            Name
          </RNText>
          <TextInput
            value={name}
            onChangeText={onNameChange}
            editable={!!onNameChange}
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

        {/* Token */}
        <View style={{ gap: defaultSpacing.sm }}>
          <RNText
            style={{
              fontSize: 13,
              fontWeight: defaultTypography.weights.medium,
              color: themeColors.text.secondary,
            } as TextStyle}
          >
            Webhook Token
          </RNText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.sm }}>
            <View
              style={{
                flex: 1,
                padding: defaultSpacing.xs,
                backgroundColor: themeColors.background.sunken,
                borderWidth: 1,
                borderColor: themeColors.border.subtle,
                borderRadius: 8,
              }}
            >
              <RNText
                numberOfLines={1}
                style={{
                  fontSize: 13,
                  fontFamily: 'monospace',
                  color: themeColors.text.secondary,
                } as TextStyle}
              >
                {token.slice(0, 8)}{'••••••••••••'}
              </RNText>
            </View>
            {onCopyToken && (
              <TouchableOpacity
                onPress={() => onCopyToken(token)}
                accessibilityLabel="Copy token"
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
                  Copy
                </RNText>
              </TouchableOpacity>
            )}
            {onRegenerateToken && (
              <TouchableOpacity
                onPress={() => setShowConfirmRegenerate(true)}
                accessibilityLabel="Regenerate token"
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
                  Regenerate
                </RNText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Meta */}
        <RNText style={{ fontSize: 12, color: themeColors.text.muted } as TextStyle}>
          Created by {createdBy} on {createdAt}
        </RNText>

        {/* Actions */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: defaultSpacing.sm,
            paddingTop: defaultSpacing.md,
            borderTopWidth: 1,
            borderTopColor: themeColors.border.subtle,
          }}
        >
          {onSave && (
            <TouchableOpacity
              onPress={onSave}
              disabled={saving}
              accessibilityLabel="Save changes"
              accessibilityRole="button"
              style={{
                paddingHorizontal: defaultSpacing.md,
                paddingVertical: defaultSpacing.xs,
                backgroundColor: themeColors.text.primary,
                borderRadius: 8,
                opacity: saving ? 0.5 : 1,
              }}
            >
              <RNText
                style={{
                  fontSize: 13,
                  fontWeight: defaultTypography.weights.medium,
                  color: themeColors.background.canvas,
                } as TextStyle}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </RNText>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={() => setShowConfirmDelete(true)}
              accessibilityLabel="Delete webhook"
              accessibilityRole="button"
              style={{
                paddingHorizontal: defaultSpacing.md,
                paddingVertical: defaultSpacing.xs,
                backgroundColor: themeColors.status.dangerSurface,
                borderWidth: 1,
                borderColor: themeColors.status.dangerBorder,
                borderRadius: 8,
                marginLeft: 'auto',
              }}
            >
              <RNText
                style={{
                  fontSize: 13,
                  fontWeight: defaultTypography.weights.medium,
                  color: themeColors.status.danger,
                } as TextStyle}
              >
                Delete Webhook
              </RNText>
            </TouchableOpacity>
          )}
        </View>

        {/* Confirm regenerate */}
        <Modal
          visible={showConfirmRegenerate}
          transparent
          animationType="fade"
          onRequestClose={() => setShowConfirmRegenerate(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              alignItems: 'center',
              justifyContent: 'center',
              padding: defaultSpacing.lg,
            }}
          >
            <View
              style={{
                backgroundColor: themeColors.background.surface,
                borderWidth: 1,
                borderColor: themeColors.border.subtle,
                borderRadius: 12,
                padding: defaultSpacing.lg,
                gap: defaultSpacing.md,
                maxWidth: 400,
                width: '100%',
              }}
            >
              <RNText
                style={{
                  fontSize: 14,
                  color: themeColors.text.secondary,
                } as TextStyle}
              >
                Are you sure you want to regenerate this token? The old token will stop working
                immediately.
              </RNText>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: defaultSpacing.sm }}>
                <TouchableOpacity
                  onPress={() => setShowConfirmRegenerate(false)}
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
                      color: themeColors.text.secondary,
                    } as TextStyle}
                  >
                    Cancel
                  </RNText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowConfirmRegenerate(false);
                    onRegenerateToken?.();
                  }}
                  accessibilityRole="button"
                  style={{
                    paddingHorizontal: defaultSpacing.md,
                    paddingVertical: defaultSpacing.xs,
                    backgroundColor: themeColors.status.dangerSurface,
                    borderWidth: 1,
                    borderColor: themeColors.status.dangerBorder,
                    borderRadius: 8,
                  }}
                >
                  <RNText
                    style={{
                      fontSize: 13,
                      color: themeColors.status.danger,
                    } as TextStyle}
                  >
                    Regenerate
                  </RNText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Confirm delete */}
        <Modal
          visible={showConfirmDelete}
          transparent
          animationType="fade"
          onRequestClose={() => setShowConfirmDelete(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              alignItems: 'center',
              justifyContent: 'center',
              padding: defaultSpacing.lg,
            }}
          >
            <View
              style={{
                backgroundColor: themeColors.background.surface,
                borderWidth: 1,
                borderColor: themeColors.border.subtle,
                borderRadius: 12,
                padding: defaultSpacing.lg,
                gap: defaultSpacing.md,
                maxWidth: 400,
                width: '100%',
              }}
            >
              <RNText
                style={{
                  fontSize: 14,
                  color: themeColors.text.secondary,
                } as TextStyle}
              >
                Are you sure you want to delete this webhook? This action cannot be undone.
              </RNText>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: defaultSpacing.sm }}>
                <TouchableOpacity
                  onPress={() => setShowConfirmDelete(false)}
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
                      color: themeColors.text.secondary,
                    } as TextStyle}
                  >
                    Cancel
                  </RNText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowConfirmDelete(false);
                    onDelete?.();
                  }}
                  accessibilityRole="button"
                  style={{
                    paddingHorizontal: defaultSpacing.md,
                    paddingVertical: defaultSpacing.xs,
                    backgroundColor: themeColors.status.dangerSurface,
                    borderWidth: 1,
                    borderColor: themeColors.status.dangerBorder,
                    borderRadius: 8,
                  }}
                >
                  <RNText
                    style={{
                      fontSize: 13,
                      color: themeColors.status.danger,
                    } as TextStyle}
                  >
                    Delete
                  </RNText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  },
);

WebhookDetailPage.displayName = 'WebhookDetailPage';
