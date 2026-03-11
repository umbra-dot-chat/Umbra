/**
 * @module components/channel-permission-editor
 * @description React Native ChannelPermissionEditor for the Wisp design system.
 *
 * Reuses color resolution from `@coexist/wisp-core`. Renders via `<View>` + `<Text>`.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import {
  resolveChannelPermissionEditorColors,
} from '@coexist/wisp-core/styles/ChannelPermissionEditor.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type OverrideValue = 'allow' | 'deny' | 'inherit';

export interface PermissionOverrideTarget {
  id: string;
  name: string;
  type: 'role' | 'member';
  color?: string;
  avatar?: React.ReactNode;
}

export interface PermissionOverride {
  key: string;
  label: string;
  description?: string;
  category: string;
  value: OverrideValue;
  dangerous?: boolean;
}

export interface ChannelPermissionEditorProps extends ViewProps {
  channelName: string;
  targets: PermissionOverrideTarget[];
  selectedTargetId?: string;
  onTargetSelect?: (targetId: string) => void;
  onAddTarget?: () => void;
  onRemoveTarget?: (targetId: string) => void;
  permissions: PermissionOverride[];
  onPermissionChange?: (targetId: string, permKey: string, value: OverrideValue) => void;
  onSave?: () => void;
  onReset?: () => void;
  saving?: boolean;
  title?: string;
  skeleton?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupByCategory(permissions: PermissionOverride[]): Record<string, PermissionOverride[]> {
  const groups: Record<string, PermissionOverride[]> = {};
  for (const perm of permissions) {
    if (!groups[perm.category]) groups[perm.category] = [];
    groups[perm.category].push(perm);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// ChannelPermissionEditor
// ---------------------------------------------------------------------------

export const ChannelPermissionEditor = forwardRef<View, ChannelPermissionEditorProps>(
  function ChannelPermissionEditor(
    {
      channelName,
      targets,
      selectedTargetId,
      onTargetSelect,
      onAddTarget,
      onRemoveTarget,
      permissions,
      onPermissionChange,
      onSave,
      onReset,
      saving = false,
      title = 'Channel Permissions',
      skeleton = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const edColors = useMemo(
      () => resolveChannelPermissionEditorColors(theme),
      [theme],
    );

    const grouped = useMemo(() => groupByCategory(permissions), [permissions]);

    const handlePermChange = useCallback(
      (permKey: string, value: OverrideValue) => {
        if (selectedTargetId && onPermissionChange) {
          onPermissionChange(selectedTargetId, permKey, value);
        }
      },
      [selectedTargetId, onPermissionChange],
    );

    // Styles
    const containerStyle: ViewStyle = {
      gap: defaultSpacing.lg,
      padding: defaultSpacing.lg,
      backgroundColor: edColors.bg,
      borderWidth: 1,
      borderColor: edColors.border,
      borderRadius: defaultRadii.lg,
    };

    const titleTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.lg.fontSize,
      lineHeight: defaultTypography.sizes.lg.lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: edColors.headerText,
    };

    const subtitleTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      color: edColors.labelText,
    };

    const targetListStyle: ViewStyle = {
      gap: defaultSpacing.xs,
      padding: defaultSpacing.sm,
      backgroundColor: edColors.targetListBg,
      borderRadius: defaultRadii.md,
      maxHeight: 200,
    };

    const categoryTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.xs.fontSize,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: edColors.categoryText,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingVertical: defaultSpacing.xs,
    };

    const segmentStyles = (seg: 'allow' | 'deny' | 'inherit', isActive: boolean): ViewStyle => {
      let bg: string;
      if (isActive) {
        switch (seg) {
          case 'allow': bg = edColors.segAllowBg; break;
          case 'deny': bg = edColors.segDenyBg; break;
          default: bg = edColors.segInheritBg; break;
        }
      } else {
        bg = edColors.segInactiveBg;
      }
      return {
        paddingHorizontal: defaultSpacing.sm,
        paddingVertical: defaultSpacing.xs,
        backgroundColor: bg,
      };
    };

    const segmentTextStyles = (seg: 'allow' | 'deny' | 'inherit', isActive: boolean): TextStyle => {
      let color: string;
      if (isActive) {
        switch (seg) {
          case 'allow': color = edColors.segAllowText; break;
          case 'deny': color = edColors.segDenyText; break;
          default: color = edColors.segInheritText; break;
        }
      } else {
        color = edColors.segInactiveText;
      }
      return {
        fontSize: defaultTypography.sizes.xs.fontSize,
        fontWeight: isActive
          ? (String(defaultTypography.weights.semibold) as TextStyle['fontWeight'])
          : (String(defaultTypography.weights.regular) as TextStyle['fontWeight']),
        color,
      };
    };

    return (
      <View ref={ref} style={[containerStyle, userStyle as ViewStyle]} {...rest}>
        {/* Header */}
        <View>
          <Text style={titleTextStyle}>{title}</Text>
          <Text style={subtitleTextStyle}>{channelName}</Text>
        </View>

        {/* Target list */}
        <ScrollView style={targetListStyle}>
          {targets.map((target) => {
            const isActive = target.id === selectedTargetId;
            return (
              <Pressable
                key={target.id}
                onPress={() => onTargetSelect?.(target.id)}
                accessibilityRole="button"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: defaultSpacing.sm,
                  paddingVertical: defaultSpacing.xs,
                  paddingHorizontal: defaultSpacing.sm,
                  borderRadius: defaultRadii.md,
                  backgroundColor: isActive ? edColors.targetItemActiveBg : edColors.targetItemBg,
                }}
              >
                {target.avatar}
                <Text
                  style={{
                    flex: 1,
                    fontSize: defaultTypography.sizes.sm.fontSize,
                    fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
                    color: target.color ?? edColors.targetItemText,
                  }}
                  numberOfLines={1}
                >
                  {target.name}
                </Text>
                <Text style={{ fontSize: defaultTypography.sizes['2xs'].fontSize, color: edColors.secondaryText }}>
                  {target.type === 'role' ? 'Role' : 'Member'}
                </Text>
                {onRemoveTarget && (
                  <Pressable
                    onPress={() => onRemoveTarget(target.id)}
                    accessibilityLabel={`Remove ${target.name}`}
                    accessibilityRole="button"
                  >
                    <Text style={{ color: edColors.dangerText, fontSize: 14 }}>x</Text>
                  </Pressable>
                )}
              </Pressable>
            );
          })}

          {onAddTarget && (
            <Pressable
              onPress={onAddTarget}
              accessibilityRole="button"
              style={{
                alignItems: 'center',
                paddingVertical: defaultSpacing.xs,
                borderRadius: defaultRadii.md,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: edColors.border,
                marginTop: defaultSpacing.xs,
              }}
            >
              <Text style={{ color: edColors.labelText, fontSize: defaultTypography.sizes.xs.fontSize }}>
                + Add
              </Text>
            </Pressable>
          )}
        </ScrollView>

        {/* Permissions */}
        <ScrollView style={{ maxHeight: 400 }}>
          {!selectedTargetId && (
            <Text style={{ color: edColors.secondaryText, textAlign: 'center', padding: defaultSpacing.xl }}>
              Select a role or member to edit permissions.
            </Text>
          )}

          {selectedTargetId &&
            Object.entries(grouped).map(([category, perms]) => (
              <View key={category}>
                <Text style={categoryTextStyle}>{category}</Text>
                {perms.map((perm) => {
                  const isDangerous = perm.dangerous ?? false;
                  return (
                    <View
                      key={perm.key}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: defaultSpacing.md,
                        padding: defaultSpacing.sm,
                        borderRadius: defaultRadii.md,
                        backgroundColor: isDangerous ? edColors.dangerBg : edColors.permRowBg,
                        marginBottom: defaultSpacing.xs,
                      }}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text
                          style={{
                            fontSize: defaultTypography.sizes.sm.fontSize,
                            fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
                            color: isDangerous ? edColors.dangerText : edColors.headerText,
                          }}
                        >
                          {perm.label}
                        </Text>
                        {perm.description && (
                          <Text style={{ fontSize: defaultTypography.sizes['2xs'].fontSize, color: edColors.secondaryText }}>
                            {perm.description}
                          </Text>
                        )}
                      </View>

                      {/* Segmented control */}
                      <View
                        style={{
                          flexDirection: 'row',
                          borderRadius: defaultRadii.md,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: edColors.border,
                        }}
                        accessibilityRole="radiogroup"
                      >
                        {(['allow', 'deny', 'inherit'] as const).map((seg) => (
                          <Pressable
                            key={seg}
                            onPress={() => handlePermChange(perm.key, seg)}
                            disabled={saving}
                            style={segmentStyles(seg, perm.value === seg)}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: perm.value === seg }}
                          >
                            <Text style={segmentTextStyles(seg, perm.value === seg)}>
                              {seg.charAt(0).toUpperCase() + seg.slice(1)}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
        </ScrollView>

        {/* Footer */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: defaultSpacing.sm, borderTopWidth: 1, borderTopColor: edColors.border, paddingTop: defaultSpacing.sm }}>
          {onReset && (
            <Pressable
              onPress={onReset}
              disabled={saving}
              style={{
                paddingHorizontal: defaultSpacing.md,
                paddingVertical: defaultSpacing.sm,
                borderRadius: defaultRadii.md,
                borderWidth: 1,
                borderColor: edColors.border,
              }}
              accessibilityRole="button"
            >
              <Text style={{ color: edColors.headerText, fontSize: defaultTypography.sizes.sm.fontSize }}>
                Reset
              </Text>
            </Pressable>
          )}
          {onSave && (
            <Pressable
              onPress={onSave}
              disabled={saving}
              style={{
                paddingHorizontal: defaultSpacing.md,
                paddingVertical: defaultSpacing.sm,
                borderRadius: defaultRadii.md,
                backgroundColor: theme.colors.accent.primary,
              }}
              accessibilityRole="button"
            >
              <Text style={{ color: theme.colors.text.inverse, fontSize: defaultTypography.sizes.sm.fontSize }}>
                Save
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  },
);

ChannelPermissionEditor.displayName = 'ChannelPermissionEditor';
