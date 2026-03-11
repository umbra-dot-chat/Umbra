import React, { forwardRef, useMemo, useState, useCallback, useEffect } from 'react';
import { View, Pressable, Text as RNText, TextInput, Modal } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WarningDialogProps {
  open: boolean;
  onClose: () => void;
  memberName: string;
  memberAvatar?: React.ReactNode;
  onSubmit?: (data: { reason: string; expiresAt?: string }) => void;
  submitting?: boolean;
  error?: string;
  title?: string;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const WarningDialog = forwardRef<View, WarningDialogProps>(
  function WarningDialog(
    {
      open,
      onClose,
      memberName,
      memberAvatar,
      onSubmit,
      submitting = false,
      error,
      title = 'Issue Warning',
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const tc = theme.colors;

    // -----------------------------------------------------------------------
    // Internal form state
    // -----------------------------------------------------------------------
    const [reason, setReason] = useState('');

    useEffect(() => {
      if (!open) {
        setReason('');
      }
    }, [open]);

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------
    const handleSubmit = useCallback(() => {
      if (!reason.trim()) return;
      onSubmit?.({ reason: reason.trim() });
    }, [reason, onSubmit]);

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------
    const overlayStyle = useMemo<ViewStyle>(
      () => ({
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: defaultSpacing.xl,
      }),
      [],
    );

    const panelStyle = useMemo<ViewStyle>(
      () => ({
        width: '100%',
        maxWidth: 480,
        backgroundColor: tc.background.canvas,
        borderRadius: defaultRadii.xl,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 8,
      }),
      [tc],
    );

    const headerStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: defaultSpacing.xl,
        paddingBottom: defaultSpacing.md,
      }),
      [],
    );

    const titleStyle = useMemo<TextStyle>(
      () => ({
        fontSize: defaultTypography.sizes.base.fontSize,
        fontWeight: defaultTypography.weights.semibold,
        color: tc.text.primary,
      }),
      [tc],
    );

    const bodyStyle = useMemo<ViewStyle>(
      () => ({
        paddingHorizontal: defaultSpacing.xl,
        gap: defaultSpacing.lg,
        paddingBottom: defaultSpacing.lg,
      }),
      [],
    );

    const memberInfoStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: defaultSpacing.sm,
      }),
      [],
    );

    const labelStyle = useMemo<TextStyle>(
      () => ({
        fontSize: defaultTypography.sizes.sm.fontSize,
        fontWeight: defaultTypography.weights.medium,
        color: tc.text.primary,
        marginBottom: defaultSpacing.xs,
      }),
      [tc],
    );

    const inputStyle = useMemo<TextStyle>(
      () => ({
        borderWidth: 1,
        borderColor: tc.border.subtle,
        borderRadius: defaultRadii.md,
        paddingHorizontal: defaultSpacing.md,
        paddingVertical: defaultSpacing.sm,
        fontSize: defaultTypography.sizes.sm.fontSize,
        color: tc.text.primary,
        backgroundColor: tc.background.sunken,
      }),
      [tc],
    );

    const footerStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: defaultSpacing.sm,
        padding: defaultSpacing.lg,
        borderTopWidth: 1,
        borderTopColor: tc.border.subtle,
      }),
      [tc],
    );

    const cancelButtonStyle = useMemo<ViewStyle>(
      () => ({
        paddingHorizontal: defaultSpacing.lg,
        paddingVertical: defaultSpacing.sm,
        borderRadius: defaultRadii.md,
        borderWidth: 1,
        borderColor: tc.border.subtle,
        opacity: submitting ? 0.5 : 1,
      }),
      [tc, submitting],
    );

    const submitButtonStyle = useMemo<ViewStyle>(
      () => ({
        paddingHorizontal: defaultSpacing.lg,
        paddingVertical: defaultSpacing.sm,
        borderRadius: defaultRadii.md,
        backgroundColor: tc.text.primary,
        opacity: !reason.trim() || submitting ? 0.5 : 1,
      }),
      [tc, reason, submitting],
    );

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
      <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={overlayStyle} onPress={onClose}>
          <Pressable ref={ref} style={[panelStyle, userStyle]} onPress={() => {}}>
            {/* Header */}
            <View style={headerStyle}>
              <RNText style={titleStyle}>{title}</RNText>
              <Pressable
                onPress={onClose}
                accessibilityLabel="Close dialog"
                accessibilityRole="button"
                style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: defaultRadii.md }}
              >
                <RNText style={{ fontSize: 18, color: tc.text.secondary }}>{'\u2715'}</RNText>
              </Pressable>
            </View>

            {/* Body */}
            <View style={bodyStyle}>
              {/* Member info */}
              <View style={memberInfoStyle}>
                {memberAvatar}
                <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: defaultTypography.weights.medium, color: tc.text.primary }}>
                  {memberName}
                </RNText>
              </View>

              {/* Reason */}
              <View>
                <RNText style={labelStyle}>Reason</RNText>
                <TextInput
                  style={inputStyle}
                  placeholder="Enter warning reason"
                  placeholderTextColor={tc.text.muted}
                  value={reason}
                  onChangeText={setReason}
                  editable={!submitting}
                />
              </View>

              {/* Error */}
              {error ? (
                <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.status.error }} accessibilityRole="alert">
                  {error}
                </RNText>
              ) : null}
            </View>

            {/* Footer */}
            <View style={footerStyle}>
              <Pressable onPress={onClose} disabled={submitting} style={cancelButtonStyle} accessibilityRole="button">
                <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: defaultTypography.weights.medium, color: tc.text.primary }}>
                  Cancel
                </RNText>
              </Pressable>
              <Pressable onPress={handleSubmit} disabled={!reason.trim() || submitting} style={submitButtonStyle} accessibilityRole="button">
                <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: defaultTypography.weights.medium, color: tc.background.canvas }}>
                  {submitting ? 'Submitting...' : 'Submit Warning'}
                </RNText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  },
);

WarningDialog.displayName = 'WarningDialog';
