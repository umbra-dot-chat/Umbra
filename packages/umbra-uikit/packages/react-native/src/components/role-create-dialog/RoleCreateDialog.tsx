import React, { forwardRef, useMemo, useState, useCallback, useEffect } from 'react';
import { View, Pressable, Text as RNText, TextInput, Modal, ScrollView } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RolePermissionCategory {
  name: string;
  permissions: Array<{
    key: string;
    label: string;
    description?: string;
    dangerous?: boolean;
  }>;
}

export interface RoleCreateData {
  name: string;
  color: string;
  permissions: Record<string, boolean>;
  hoisted: boolean;
  mentionable: boolean;
}

export interface RoleCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: RoleCreateData) => void;
  permissionCategories: RolePermissionCategory[];
  submitting?: boolean;
  error?: string;
  title?: string;
  defaultColor?: string;
  colorPresets?: string[];
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Color presets
// ---------------------------------------------------------------------------

const DEFAULT_COLOR_PRESETS = [
  '#99AAB5', '#E74C3C', '#E67E22', '#F1C40F', '#2ECC71',
  '#1ABC9C', '#3498DB', '#9B59B6', '#E91E63', '#607D8B',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const RoleCreateDialog = forwardRef<View, RoleCreateDialogProps>(
  function RoleCreateDialog(
    {
      open,
      onClose,
      onSubmit,
      permissionCategories,
      submitting = false,
      error,
      title = 'Create Role',
      defaultColor = '#99AAB5',
      colorPresets = DEFAULT_COLOR_PRESETS,
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
    const [color, setColor] = useState(defaultColor);
    const [hoisted, setHoisted] = useState(false);
    const [mentionable, setMentionable] = useState(false);
    const [permissions, setPermissions] = useState<Record<string, boolean>>({});
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    useEffect(() => {
      if (!open) {
        setName('');
        setColor(defaultColor);
        setHoisted(false);
        setMentionable(false);
        setPermissions({});
        setExpandedCategories({});
      }
    }, [open, defaultColor]);

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------
    const handleSubmit = useCallback(() => {
      if (!name.trim()) return;
      onSubmit?.({
        name: name.trim(),
        color,
        permissions,
        hoisted,
        mentionable,
      });
    }, [name, color, permissions, hoisted, mentionable, onSubmit]);

    const handlePermissionChange = useCallback((key: string) => {
      setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const toggleCategory = useCallback((categoryName: string) => {
      setExpandedCategories((prev) => ({
        ...prev,
        [categoryName]: !prev[categoryName],
      }));
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
        maxWidth: 520,
        maxHeight: '85%',
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

    const colorPresetsRowStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: defaultSpacing.sm,
      }),
      [],
    );

    const previewRowStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: defaultSpacing.sm,
      }),
      [],
    );

    const toggleRowStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: defaultSpacing.sm,
        paddingHorizontal: defaultSpacing.md,
        borderRadius: defaultRadii.md,
        backgroundColor: tc.background.sunken,
      }),
      [tc],
    );

    const categoryHeaderStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: defaultSpacing.md,
        paddingHorizontal: defaultSpacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: tc.border.subtle,
      }),
      [tc],
    );

    const permissionRowStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: defaultSpacing.sm,
        paddingVertical: defaultSpacing.xs,
        paddingHorizontal: defaultSpacing.sm,
      }),
      [],
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

            {/* Scrollable body */}
            <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={bodyStyle}>
              {/* Name */}
              <View>
                <RNText style={labelStyle}>Role Name</RNText>
                <TextInput
                  style={inputStyle}
                  placeholder="Enter role name"
                  placeholderTextColor={tc.text.muted}
                  value={name}
                  onChangeText={setName}
                  editable={!submitting}
                />
              </View>

              {/* Color presets */}
              <View>
                <RNText style={labelStyle}>Role Color</RNText>
                <View style={colorPresetsRowStyle}>
                  {colorPresets.map((preset) => (
                    <Pressable
                      key={preset}
                      onPress={() => setColor(preset)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: preset,
                        borderWidth: color === preset ? 2 : 0,
                        borderColor: tc.text.primary,
                      }}
                      accessibilityLabel={`Color ${preset}`}
                      accessibilityRole="button"
                    />
                  ))}
                </View>
              </View>

              {/* Preview */}
              <View style={previewRowStyle}>
                <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.secondary }}>
                  Preview:
                </RNText>
                <View
                  style={{
                    backgroundColor: color,
                    paddingHorizontal: defaultSpacing.sm,
                    paddingVertical: defaultSpacing['2xs'],
                    borderRadius: defaultRadii.full,
                  }}
                >
                  <RNText
                    style={{
                      fontSize: defaultTypography.sizes.xs.fontSize,
                      fontWeight: defaultTypography.weights.medium,
                      color: '#FFFFFF',
                    }}
                  >
                    {name || 'New Role'}
                  </RNText>
                </View>
              </View>

              {/* Toggles */}
              <View style={{ gap: defaultSpacing.xs }}>
                <Pressable
                  style={toggleRowStyle}
                  onPress={() => !submitting && setHoisted(!hoisted)}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: hoisted }}
                >
                  <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: defaultTypography.weights.medium, color: tc.text.primary }}>
                    Display role separately
                  </RNText>
                  <View
                    style={{
                      width: 40,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: hoisted ? tc.text.primary : tc.border.subtle,
                      justifyContent: 'center',
                      paddingHorizontal: 2,
                    }}
                  >
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: tc.background.canvas,
                        alignSelf: hoisted ? 'flex-end' : 'flex-start',
                      }}
                    />
                  </View>
                </Pressable>

                <Pressable
                  style={toggleRowStyle}
                  onPress={() => !submitting && setMentionable(!mentionable)}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: mentionable }}
                >
                  <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: defaultTypography.weights.medium, color: tc.text.primary }}>
                    Allow anyone to mention this role
                  </RNText>
                  <View
                    style={{
                      width: 40,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: mentionable ? tc.text.primary : tc.border.subtle,
                      justifyContent: 'center',
                      paddingHorizontal: 2,
                    }}
                  >
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: tc.background.canvas,
                        alignSelf: mentionable ? 'flex-end' : 'flex-start',
                      }}
                    />
                  </View>
                </Pressable>
              </View>

              {/* Permission categories */}
              {permissionCategories.map((category) => (
                <View key={category.name}>
                  <Pressable
                    style={categoryHeaderStyle}
                    onPress={() => toggleCategory(category.name)}
                    accessibilityRole="button"
                  >
                    <RNText
                      style={{
                        fontSize: defaultTypography.sizes.sm.fontSize,
                        fontWeight: defaultTypography.weights.semibold,
                        color: tc.text.primary,
                      }}
                    >
                      {category.name}
                    </RNText>
                    <RNText style={{ fontSize: 12, color: tc.text.secondary }}>
                      {expandedCategories[category.name] ? '\u25B2' : '\u25BC'}
                    </RNText>
                  </Pressable>
                  {expandedCategories[category.name] &&
                    category.permissions.map((perm) => (
                      <Pressable
                        key={perm.key}
                        style={permissionRowStyle}
                        onPress={() => !submitting && handlePermissionChange(perm.key)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: !!permissions[perm.key] }}
                      >
                        <View
                          style={{
                            width: 18,
                            height: 18,
                            borderWidth: 1,
                            borderColor: tc.border.subtle,
                            borderRadius: defaultRadii.sm,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: permissions[perm.key]
                              ? tc.text.primary
                              : 'transparent',
                          }}
                        >
                          {permissions[perm.key] && (
                            <RNText style={{ fontSize: 12, color: tc.background.canvas }}>
                              {'\u2713'}
                            </RNText>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <RNText
                            style={{
                              fontSize: defaultTypography.sizes.sm.fontSize,
                              color: perm.dangerous ? tc.status.danger : tc.text.primary,
                            }}
                          >
                            {perm.label}
                          </RNText>
                          {perm.description && (
                            <RNText
                              style={{
                                fontSize: defaultTypography.sizes.xs.fontSize,
                                color: tc.text.secondary,
                              }}
                            >
                              {perm.description}
                            </RNText>
                          )}
                        </View>
                      </Pressable>
                    ))}
                </View>
              ))}

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
            </ScrollView>

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

RoleCreateDialog.displayName = 'RoleCreateDialog';
