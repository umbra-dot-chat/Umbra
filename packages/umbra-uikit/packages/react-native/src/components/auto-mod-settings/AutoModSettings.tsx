import React, { forwardRef, useMemo } from 'react';
import { View, Pressable, Text as RNText, ScrollView } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AutoModRule {
  id: string;
  name: string;
  type: 'keyword' | 'spam' | 'link' | 'caps';
  pattern?: string;
  action: 'delete' | 'warn' | 'timeout';
  enabled: boolean;
}

export interface EscalationThreshold {
  warningCount: number;
  action: 'timeout' | 'ban';
  duration?: number;
}

export interface AutoModSettingsProps {
  rules: AutoModRule[];
  escalationThresholds: EscalationThreshold[];
  onRuleCreate?: () => void;
  onRuleUpdate?: (ruleId: string, updates: Partial<AutoModRule>) => void;
  onRuleDelete?: (ruleId: string) => void;
  onRuleToggle?: (ruleId: string, enabled: boolean) => void;
  onEscalationUpdate?: (thresholds: EscalationThreshold[]) => void;
  title?: string;
  loading?: boolean;
  skeleton?: boolean;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AutoModSettings = forwardRef<View, AutoModSettingsProps>(
  function AutoModSettings(
    {
      rules,
      escalationThresholds,
      onRuleCreate,
      onRuleUpdate,
      onRuleDelete,
      onRuleToggle,
      onEscalationUpdate,
      title = 'AutoMod Settings',
      loading = false,
      skeleton = false,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const tc = theme.colors;

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------
    const containerStyle = useMemo<ViewStyle>(
      () => ({
        backgroundColor: tc.background.surface,
        borderWidth: 1,
        borderColor: tc.border.subtle,
        borderRadius: defaultRadii.lg,
        overflow: 'hidden',
      }),
      [tc],
    );

    const headerStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: defaultSpacing.md,
        paddingHorizontal: defaultSpacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: tc.border.subtle,
      }),
      [tc],
    );

    const sectionHeaderStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: defaultSpacing.sm,
        paddingHorizontal: defaultSpacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: tc.border.subtle,
        backgroundColor: `${tc.text.primary}05`,
      }),
      [tc],
    );

    const ruleRowStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: defaultSpacing.sm,
        paddingVertical: defaultSpacing.sm,
        paddingHorizontal: defaultSpacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: tc.border.subtle,
        flexWrap: 'wrap',
      }),
      [tc],
    );

    const escalationRowStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: defaultSpacing.sm,
        paddingVertical: defaultSpacing.sm,
        paddingHorizontal: defaultSpacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: tc.border.subtle,
      }),
      [tc],
    );

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
      <View ref={ref} style={[containerStyle, userStyle]}>
        {/* Header */}
        <View style={headerStyle}>
          <RNText style={{ fontSize: defaultTypography.sizes.base.fontSize, fontWeight: defaultTypography.weights.semibold, color: tc.text.primary }}>
            {title}
          </RNText>
        </View>

        {/* Filter Rules section */}
        <View style={sectionHeaderStyle}>
          <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: defaultTypography.weights.semibold, color: tc.text.primary }}>
            Filter Rules
          </RNText>
          {onRuleCreate && (
            <Pressable onPress={onRuleCreate} accessibilityRole="button" style={{
              paddingHorizontal: defaultSpacing.md,
              height: 28,
              borderRadius: defaultRadii.md,
              backgroundColor: tc.accent.primary,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, fontWeight: defaultTypography.weights.semibold, color: tc.text.inverse }}>
                Add Rule
              </RNText>
            </Pressable>
          )}
        </View>

        <ScrollView>
          {rules.length === 0 ? (
            <View style={{ padding: defaultSpacing.xl, alignItems: 'center' }}>
              <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.muted }}>
                No rules configured.
              </RNText>
            </View>
          ) : (
            rules.map((rule) => (
              <View key={rule.id} style={ruleRowStyle}>
                <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: defaultTypography.weights.medium, color: tc.text.primary, flex: 1 }}>
                  {rule.name}
                </RNText>
                <View style={{
                  height: 20,
                  paddingHorizontal: defaultSpacing.xs,
                  borderRadius: 999,
                  backgroundColor: rule.enabled ? tc.status.successSurface : `${tc.text.primary}0F`,
                  justifyContent: 'center',
                }}>
                  <RNText style={{
                    fontSize: defaultTypography.sizes['2xs'].fontSize,
                    fontWeight: defaultTypography.weights.medium,
                    color: rule.enabled ? tc.status.success : tc.text.muted,
                  }}>
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </RNText>
                </View>
                <Pressable
                  onPress={() => onRuleToggle?.(rule.id, !rule.enabled)}
                  accessibilityRole="button"
                  accessibilityLabel={`Toggle ${rule.name}`}
                >
                  <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.secondary }}>Toggle</RNText>
                </Pressable>
                {onRuleDelete && (
                  <Pressable onPress={() => onRuleDelete(rule.id)} accessibilityRole="button" accessibilityLabel={`Delete ${rule.name}`}>
                    <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.status.danger, fontWeight: defaultTypography.weights.medium }}>
                      Delete
                    </RNText>
                  </Pressable>
                )}
              </View>
            ))
          )}

          {/* Escalation Thresholds section */}
          <View style={sectionHeaderStyle}>
            <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: defaultTypography.weights.semibold, color: tc.text.primary }}>
              Escalation Thresholds
            </RNText>
          </View>

          {escalationThresholds.length === 0 ? (
            <View style={{ padding: defaultSpacing.xl, alignItems: 'center' }}>
              <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.muted }}>
                No escalation thresholds configured.
              </RNText>
            </View>
          ) : (
            escalationThresholds.map((threshold, idx) => (
              <View key={idx} style={escalationRowStyle}>
                <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.secondary }}>After</RNText>
                <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: defaultTypography.weights.semibold, color: tc.text.primary }}>
                  {threshold.warningCount}
                </RNText>
                <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.secondary }}>warnings</RNText>
                <RNText style={{ color: tc.text.muted }}>{'\u2192'}</RNText>
                <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: defaultTypography.weights.semibold, color: tc.text.primary, textTransform: 'capitalize' }}>
                  {threshold.action}
                </RNText>
                {threshold.duration != null && (
                  <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.secondary }}>
                    ({threshold.duration >= 3600 ? `${Math.floor(threshold.duration / 3600)}h` : `${Math.floor(threshold.duration / 60)}m`})
                  </RNText>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  },
);

AutoModSettings.displayName = 'AutoModSettings';
