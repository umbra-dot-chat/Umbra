import React, { forwardRef, useMemo } from 'react';
import { View, Pressable, Text as RNText, ScrollView } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WarningEntry {
  id: string;
  reason: string;
  issuedBy: string;
  issuedByAvatar?: React.ReactNode;
  issuedAt: string;
  expiresAt?: string | null;
  active?: boolean;
}

export interface WarningHistoryPanelProps {
  memberName: string;
  memberAvatar?: React.ReactNode;
  warnings: WarningEntry[];
  onDeleteWarning?: (warningId: string) => void;
  onClose?: () => void;
  title?: string;
  loading?: boolean;
  skeleton?: boolean;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const WarningHistoryPanel = forwardRef<View, WarningHistoryPanelProps>(
  function WarningHistoryPanel(
    {
      memberName,
      memberAvatar,
      warnings,
      onDeleteWarning,
      onClose,
      title = 'Warning History',
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

    const memberInfoStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: defaultSpacing.sm,
        padding: defaultSpacing.md,
        paddingHorizontal: defaultSpacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: tc.border.subtle,
      }),
      [tc],
    );

    const cardStyle = useMemo<ViewStyle>(
      () => ({
        padding: defaultSpacing.sm,
        paddingHorizontal: defaultSpacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: tc.border.subtle,
        gap: defaultSpacing.xs,
      }),
      [tc],
    );

    const countBadgeStyle = useMemo<ViewStyle>(
      () => ({
        height: 20,
        minWidth: 20,
        borderRadius: 999,
        backgroundColor: `${tc.text.primary}14`,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: defaultSpacing.xs,
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.sm }}>
            <View style={countBadgeStyle}>
              <RNText style={{ fontSize: defaultTypography.sizes['2xs'].fontSize, fontWeight: defaultTypography.weights.semibold, color: tc.text.secondary }}>
                {warnings.length}
              </RNText>
            </View>
            {onClose && (
              <Pressable onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                <RNText style={{ fontSize: 16, color: tc.text.secondary }}>{'\u2715'}</RNText>
              </Pressable>
            )}
          </View>
        </View>

        {/* Member info */}
        <View style={memberInfoStyle}>
          {memberAvatar}
          <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: defaultTypography.weights.medium, color: tc.text.primary }}>
            {memberName}
          </RNText>
        </View>

        {/* Warning list */}
        {warnings.length === 0 ? (
          <View style={{ padding: defaultSpacing.xl, alignItems: 'center' }}>
            <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.muted }}>
              No warnings on record.
            </RNText>
          </View>
        ) : (
          <ScrollView>
            {warnings.map((w) => (
              <View key={w.id} style={cardStyle}>
                <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.primary }}>
                  {w.reason}
                </RNText>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing['2xs'] }}>
                    {w.issuedByAvatar}
                    <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.secondary }}>
                      {w.issuedBy}
                    </RNText>
                    <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted }}>
                      {w.issuedAt}
                    </RNText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing['2xs'] }}>
                    <View style={{
                      height: 20,
                      paddingHorizontal: defaultSpacing.xs,
                      borderRadius: 999,
                      backgroundColor: w.active !== false ? tc.status.warningSurface : `${tc.text.primary}0F`,
                      justifyContent: 'center',
                    }}>
                      <RNText style={{
                        fontSize: defaultTypography.sizes['2xs'].fontSize,
                        fontWeight: defaultTypography.weights.medium,
                        color: w.active !== false ? tc.status.warning : tc.text.muted,
                      }}>
                        {w.active !== false ? 'Active' : 'Expired'}
                      </RNText>
                    </View>
                    {onDeleteWarning && (
                      <Pressable onPress={() => onDeleteWarning(w.id)} accessibilityRole="button" accessibilityLabel={`Delete warning ${w.id}`}>
                        <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.status.danger, fontWeight: defaultTypography.weights.medium }}>
                          Delete
                        </RNText>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    );
  },
);

WarningHistoryPanel.displayName = 'WarningHistoryPanel';
