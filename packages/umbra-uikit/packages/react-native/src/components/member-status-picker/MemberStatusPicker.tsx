/**
 * @module components/member-status-picker
 * @description React Native MemberStatusPicker for the Wisp design system.
 *
 * A picker for setting custom status (text + emoji + expiry).
 */

import React, { forwardRef, useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { MemberStatusData } from '@coexist/wisp-core/types/MemberStatusPicker.types';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MemberStatusPickerProps extends ViewProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: MemberStatusData) => void;
  onClear?: () => void;
  currentStatus?: MemberStatusData;
  submitting?: boolean;
  title?: string;
  expiryPresets?: Array<{ label: string; value: string | null }>;
}

// ---------------------------------------------------------------------------
// Emoji presets
// ---------------------------------------------------------------------------

const DEFAULT_EMOJIS = [
  '\u{1F600}', '\u{1F60A}', '\u{1F60E}', '\u{1F914}', '\u{1F634}',
  '\u{1F3AE}', '\u{1F4BB}', '\u{1F4DA}', '\u{2615}', '\u{1F3B5}',
  '\u{1F3C3}', '\u{1F4AA}', '\u{1F389}', '\u{2764}\u{FE0F}', '\u{1F525}',
  '\u{1F31F}', '\u{1F308}', '\u{1F4A1}', '\u{1F680}', '\u{1F37B}',
  '\u{1F3B8}', '\u{1F4F7}', '\u{1F30D}', '\u{26A1}',
];

const DEFAULT_EXPIRY_PRESETS: Array<{ label: string; value: string | null }> = [
  { label: '30 minutes', value: '30m' },
  { label: '1 hour', value: '1h' },
  { label: '4 hours', value: '4h' },
  { label: 'Today', value: 'today' },
  { label: 'Never', value: null },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MemberStatusPicker = forwardRef<View, MemberStatusPickerProps>(
  function MemberStatusPicker(
    {
      open,
      onClose,
      onSubmit,
      onClear,
      currentStatus,
      submitting = false,
      title = 'Set Status',
      expiryPresets = DEFAULT_EXPIRY_PRESETS,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;

    const [text, setText] = useState(currentStatus?.text ?? '');
    const [emoji, setEmoji] = useState(currentStatus?.emoji ?? '');
    const [expiresAt, setExpiresAt] = useState<string | null>(
      currentStatus?.expiresAt ?? null,
    );
    const [showEmojiGrid, setShowEmojiGrid] = useState(false);
    const [showExpiryPicker, setShowExpiryPicker] = useState(false);

    useEffect(() => {
      setText(currentStatus?.text ?? '');
      setEmoji(currentStatus?.emoji ?? '');
      setExpiresAt(currentStatus?.expiresAt ?? null);
    }, [currentStatus]);

    const handleSubmit = useCallback(() => {
      onSubmit?.({
        text: text || undefined,
        emoji: emoji || undefined,
        expiresAt,
      });
    }, [text, emoji, expiresAt, onSubmit]);

    const handleClear = useCallback(() => {
      setText('');
      setEmoji('');
      setExpiresAt(null);
      onClear?.();
    }, [onClear]);

    const overlayStyle = useMemo<ViewStyle>(() => ({
      flex: 1,
      backgroundColor: themeColors.background.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: defaultSpacing.lg,
    }), [themeColors]);

    const dialogStyle = useMemo<ViewStyle>(() => ({
      backgroundColor: themeColors.background.surface,
      borderRadius: defaultRadii.lg,
      borderWidth: 1,
      borderColor: themeColors.border.subtle,
      padding: defaultSpacing.lg,
      width: '100%',
      maxWidth: 360,
      gap: defaultSpacing.md,
    }), [themeColors]);

    const titleStyle = useMemo<TextStyle>(() => ({
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text.primary,
    }), [themeColors]);

    const emojiRowStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.sm,
    }), []);

    const emojiButtonStyle = useMemo<ViewStyle>(() => ({
      width: 40,
      height: 40,
      borderRadius: defaultRadii.md,
      borderWidth: 1,
      borderColor: themeColors.border.subtle,
      backgroundColor: themeColors.background.sunken,
      alignItems: 'center',
      justifyContent: 'center',
    }), [themeColors]);

    const inputStyle = useMemo<TextStyle>(() => ({
      flex: 1,
      height: 40,
      paddingHorizontal: defaultSpacing.sm,
      borderRadius: defaultRadii.md,
      borderWidth: 1,
      borderColor: themeColors.border.subtle,
      backgroundColor: themeColors.background.sunken,
      color: themeColors.text.primary,
      fontSize: 14,
    }), [themeColors]);

    const actionsStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: defaultSpacing.sm,
      marginTop: defaultSpacing.xs,
    }), []);

    const primaryBtnStyle = useMemo<ViewStyle>(() => ({
      height: 34,
      paddingHorizontal: defaultSpacing.md,
      borderRadius: defaultRadii.md,
      backgroundColor: themeColors.accent.primary,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: submitting ? 0.6 : 1,
    }), [themeColors, submitting]);

    const secondaryBtnStyle = useMemo<ViewStyle>(() => ({
      height: 34,
      paddingHorizontal: defaultSpacing.md,
      borderRadius: defaultRadii.md,
      borderWidth: 1,
      borderColor: themeColors.border.subtle,
      alignItems: 'center',
      justifyContent: 'center',
    }), [themeColors]);

    const selectedExpiry = expiryPresets.find((p) => p.value === expiresAt);

    return (
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={overlayStyle}>
          <View ref={ref} style={[dialogStyle, userStyle]} {...rest}>
            <Text style={titleStyle}>{title}</Text>

            {/* Emoji + Text input */}
            <View style={emojiRowStyle}>
              <TouchableOpacity
                style={emojiButtonStyle}
                onPress={() => setShowEmojiGrid((prev) => !prev)}
                accessibilityLabel="Select emoji"
              >
                <Text style={{ fontSize: 20 }}>{emoji || '\u{1F642}'}</Text>
              </TouchableOpacity>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="What's your status?"
                placeholderTextColor={themeColors.text.muted}
                style={inputStyle}
                maxLength={128}
                accessibilityLabel="Status text"
              />
            </View>

            {/* Emoji grid */}
            {showEmojiGrid && (
              <ScrollView
                style={{
                  maxHeight: 160,
                  backgroundColor: themeColors.background.sunken,
                  borderRadius: defaultRadii.md,
                  borderWidth: 1,
                  borderColor: themeColors.border.subtle,
                  padding: defaultSpacing.sm,
                }}
                contentContainerStyle={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 4,
                }}
              >
                {DEFAULT_EMOJIS.map((e) => (
                  <TouchableOpacity
                    key={e}
                    onPress={() => {
                      setEmoji(e);
                      setShowEmojiGrid(false);
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    accessibilityLabel={e}
                  >
                    <Text style={{ fontSize: 18 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Expiry picker */}
            <View style={{ gap: defaultSpacing.xs }}>
              <Text style={{ fontSize: 13, color: themeColors.text.secondary }}>
                Clear after
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {expiryPresets.map((preset) => {
                  const isSelected = preset.value === expiresAt;
                  return (
                    <TouchableOpacity
                      key={preset.value ?? '__null__'}
                      onPress={() => setExpiresAt(preset.value)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: defaultRadii.md,
                        borderWidth: 1,
                        borderColor: isSelected
                          ? themeColors.accent.primary
                          : themeColors.border.subtle,
                        backgroundColor: isSelected
                          ? themeColors.accent.primary + '20'
                          : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: isSelected
                            ? themeColors.accent.primary
                            : themeColors.text.secondary,
                        }}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Actions */}
            <View style={actionsStyle}>
              {(currentStatus?.text || currentStatus?.emoji) && (
                <TouchableOpacity
                  onPress={handleClear}
                  accessibilityLabel="Clear status"
                >
                  <Text style={{ fontSize: 13, color: themeColors.status.danger }}>
                    Clear Status
                  </Text>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={secondaryBtnStyle} onPress={onClose}>
                <Text style={{ fontSize: 13, color: themeColors.text.secondary }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={primaryBtnStyle}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#FFFFFF' }}>
                  {submitting ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

MemberStatusPicker.displayName = 'MemberStatusPicker';
