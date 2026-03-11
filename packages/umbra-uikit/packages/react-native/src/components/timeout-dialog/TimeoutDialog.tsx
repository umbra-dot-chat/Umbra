import React, { forwardRef, useMemo, useState, useCallback, useEffect } from 'react';
import { View, Pressable, Text as RNText, TextInput, Modal } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TimeoutType = 'mute' | 'restrict';

export interface TimeoutDurationPreset {
  label: string;
  value: number;
}

export interface TimeoutDialogProps {
  open: boolean;
  onClose: () => void;
  memberName: string;
  memberAvatar?: React.ReactNode;
  onSubmit?: (data: { duration: number; reason?: string; type: TimeoutType }) => void;
  submitting?: boolean;
  error?: string;
  title?: string;
  durationPresets?: TimeoutDurationPreset[];
  style?: ViewStyle;
}

const DEFAULT_DURATION_PRESETS: TimeoutDurationPreset[] = [
  { label: '60 seconds', value: 60 },
  { label: '5 minutes', value: 300 },
  { label: '10 minutes', value: 600 },
  { label: '1 hour', value: 3600 },
  { label: '1 day', value: 86400 },
  { label: '1 week', value: 604800 },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const TimeoutDialog = forwardRef<View, TimeoutDialogProps>(
  function TimeoutDialog(
    {
      open,
      onClose,
      memberName,
      memberAvatar,
      onSubmit,
      submitting = false,
      error,
      title = 'Timeout Member',
      durationPresets = DEFAULT_DURATION_PRESETS,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const tc = theme.colors;

    // -----------------------------------------------------------------------
    // Internal form state
    // -----------------------------------------------------------------------
    const [durationIndex, setDurationIndex] = useState(0);
    const [type, setType] = useState<TimeoutType>('mute');
    const [reason, setReason] = useState('');

    useEffect(() => {
      if (!open) {
        setDurationIndex(0);
        setType('mute');
        setReason('');
      }
    }, [open]);

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------
    const handleSubmit = useCallback(() => {
      const preset = durationPresets[durationIndex];
      onSubmit?.({
        duration: preset?.value ?? 300,
        reason: reason.trim() || undefined,
        type,
      });
    }, [durationIndex, durationPresets, reason, type, onSubmit]);

    const cycleDuration = useCallback(() => {
      setDurationIndex((prev) => (prev + 1) % durationPresets.length);
    }, [durationPresets]);

    const cycleType = useCallback(() => {
      setType((prev) => (prev === 'mute' ? 'restrict' : 'mute'));
    }, []);

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

    const bodyStyle = useMemo<ViewStyle>(
      () => ({
        paddingHorizontal: defaultSpacing.xl,
        gap: defaultSpacing.lg,
        paddingBottom: defaultSpacing.lg,
      }),
      [],
    );

    const labelStyle = useMemo<TextStyle>(
      () => ({
        fontSize: defaultTypography.sizes.xs.fontSize,
        fontWeight: defaultTypography.weights.medium,
        color: tc.text.secondary,
        marginBottom: defaultSpacing.xs,
      }),
      [tc],
    );

    const pickerButtonStyle = useMemo<ViewStyle>(
      () => ({
        height: 34,
        borderWidth: 1,
        borderColor: tc.border.subtle,
        borderRadius: defaultRadii.md,
        backgroundColor: tc.background.sunken,
        paddingHorizontal: defaultSpacing.md,
        justifyContent: 'center',
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
        opacity: submitting ? 0.5 : 1,
      }),
      [tc, submitting],
    );

    const currentPreset = durationPresets[durationIndex];

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
      <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={overlayStyle} onPress={onClose}>
          <Pressable ref={ref} style={[panelStyle, userStyle]} onPress={() => {}}>
            {/* Header */}
            <View style={headerStyle}>
              <RNText style={{ fontSize: defaultTypography.sizes.base.fontSize, fontWeight: defaultTypography.weights.semibold, color: tc.text.primary }}>
                {title}
              </RNText>
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.sm }}>
                {memberAvatar}
                <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: defaultTypography.weights.medium, color: tc.text.primary }}>
                  {memberName}
                </RNText>
              </View>

              {/* Duration picker */}
              <View>
                <RNText style={labelStyle}>Duration</RNText>
                <Pressable onPress={cycleDuration} style={pickerButtonStyle} disabled={submitting} accessibilityRole="button" accessibilityLabel="Timeout duration">
                  <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.primary }}>
                    {currentPreset?.label ?? '5 minutes'}
                  </RNText>
                </Pressable>
              </View>

              {/* Type picker */}
              <View>
                <RNText style={labelStyle}>Type</RNText>
                <Pressable onPress={cycleType} style={pickerButtonStyle} disabled={submitting} accessibilityRole="button" accessibilityLabel="Timeout type">
                  <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.primary, textTransform: 'capitalize' }}>
                    {type}
                  </RNText>
                </Pressable>
              </View>

              {/* Reason */}
              <View>
                <RNText style={labelStyle}>Reason (optional)</RNText>
                <TextInput
                  style={inputStyle}
                  placeholder="Enter timeout reason"
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
              <Pressable onPress={handleSubmit} disabled={submitting} style={submitButtonStyle} accessibilityRole="button">
                <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: defaultTypography.weights.medium, color: tc.background.canvas }}>
                  {submitting ? 'Applying...' : 'Apply Timeout'}
                </RNText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  },
);

TimeoutDialog.displayName = 'TimeoutDialog';
