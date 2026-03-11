import React, { forwardRef, useMemo, useState, useCallback, useEffect } from 'react';
import { View, Pressable, Text as RNText, TextInput, Modal } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommunityCreateData {
  name: string;
  description: string;
}

export interface CommunityCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: CommunityCreateData) => void;
  submitting?: boolean;
  error?: string;
  title?: string;
  maxNameLength?: number;
  maxDescriptionLength?: number;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CommunityCreateDialog = forwardRef<View, CommunityCreateDialogProps>(
  function CommunityCreateDialog(
    {
      open,
      onClose,
      onSubmit,
      submitting = false,
      error,
      title = 'Create Community',
      maxNameLength = 100,
      maxDescriptionLength = 1000,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const tc = theme.colors;

    // -----------------------------------------------------------------------
    // Internal form state
    // -----------------------------------------------------------------------
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
      if (!open) {
        setName('');
        setDescription('');
      }
    }, [open]);

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------
    const handleSubmit = useCallback(() => {
      if (!name.trim()) return;
      onSubmit?.({
        name: name.trim(),
        description: description.trim(),
      });
    }, [name, description, onSubmit]);

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

    const createButtonStyle = useMemo<ViewStyle>(
      () => ({
        paddingHorizontal: defaultSpacing.lg,
        paddingVertical: defaultSpacing.sm,
        borderRadius: defaultRadii.md,
        backgroundColor: tc.text.primary,
        opacity: !name.trim() || submitting ? 0.5 : 1,
      }),
      [tc, name, submitting],
    );

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable style={overlayStyle} onPress={onClose}>
          <Pressable
            ref={ref}
            style={[panelStyle, userStyle]}
            onPress={() => {}}
          >
            {/* Header */}
            <View style={headerStyle}>
              <RNText style={titleStyle}>{title}</RNText>
              <Pressable
                onPress={onClose}
                accessibilityLabel="Close dialog"
                accessibilityRole="button"
                style={{
                  width: 28,
                  height: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: defaultRadii.md,
                }}
              >
                <RNText style={{ fontSize: 18, color: tc.text.secondary }}>
                  {'\u2715'}
                </RNText>
              </Pressable>
            </View>

            {/* Body */}
            <View style={bodyStyle}>
              {/* Name */}
              <View>
                <RNText style={labelStyle}>Name</RNText>
                <TextInput
                  style={inputStyle}
                  placeholder="Enter community name"
                  placeholderTextColor={tc.text.muted}
                  value={name}
                  onChangeText={setName}
                  maxLength={maxNameLength}
                  editable={!submitting}
                />
              </View>

              {/* Description */}
              <View>
                <RNText style={labelStyle}>Description</RNText>
                <TextInput
                  style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]}
                  placeholder="What is this community about?"
                  placeholderTextColor={tc.text.muted}
                  value={description}
                  onChangeText={setDescription}
                  maxLength={maxDescriptionLength}
                  multiline
                  editable={!submitting}
                />
              </View>

              {/* Error */}
              {error ? (
                <RNText
                  style={{
                    fontSize: defaultTypography.sizes.sm.fontSize,
                    color: tc.status.danger,
                  }}
                  accessibilityRole="alert"
                >
                  {error}
                </RNText>
              ) : null}
            </View>

            {/* Footer */}
            <View style={footerStyle}>
              <Pressable
                onPress={onClose}
                disabled={submitting}
                style={cancelButtonStyle}
                accessibilityRole="button"
              >
                <RNText
                  style={{
                    fontSize: defaultTypography.sizes.sm.fontSize,
                    fontWeight: defaultTypography.weights.medium,
                    color: tc.text.primary,
                  }}
                >
                  Cancel
                </RNText>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={!name.trim() || submitting}
                style={createButtonStyle}
                accessibilityRole="button"
              >
                <RNText
                  style={{
                    fontSize: defaultTypography.sizes.sm.fontSize,
                    fontWeight: defaultTypography.weights.medium,
                    color: tc.background.canvas,
                  }}
                >
                  {submitting ? 'Creating...' : 'Create'}
                </RNText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  },
);

CommunityCreateDialog.displayName = 'CommunityCreateDialog';
