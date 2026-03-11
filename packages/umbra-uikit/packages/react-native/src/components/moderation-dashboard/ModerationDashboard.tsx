import React, { forwardRef, useMemo, useState } from 'react';
import { View, Pressable, Text as RNText, ScrollView } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ModerationStat {
  label: string;
  value: number;
  change?: number;
  color?: 'default' | 'success' | 'warning' | 'danger';
}

export interface RecentModerationAction {
  id: string;
  type: 'warning' | 'timeout' | 'kick' | 'ban';
  actorName: string;
  actorAvatar?: React.ReactNode;
  targetName: string;
  targetAvatar?: React.ReactNode;
  reason?: string;
  timestamp: string;
}

export interface BanEvasionAlert {
  id: string;
  suspectedMemberName: string;
  suspectedMemberAvatar?: React.ReactNode;
  matchedBanName: string;
  matchType: 'device_fingerprint' | 'ip_pattern';
  confidence: 'high' | 'medium' | 'low';
  timestamp: string;
}

export interface ModerationDashboardProps {
  stats: ModerationStat[];
  recentActions: RecentModerationAction[];
  banEvasionAlerts?: BanEvasionAlert[];
  onActionClick?: (actionId: string) => void;
  onAlertDismiss?: (alertId: string) => void;
  onAlertInvestigate?: (alertId: string) => void;
  title?: string;
  loading?: boolean;
  skeleton?: boolean;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ModerationDashboard = forwardRef<View, ModerationDashboardProps>(
  function ModerationDashboard(
    {
      stats,
      recentActions,
      banEvasionAlerts = [],
      onActionClick,
      onAlertDismiss,
      onAlertInvestigate,
      title = 'Moderation',
      loading = false,
      skeleton = false,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const tc = theme.colors;

    const [activeTab, setActiveTab] = useState<'actions' | 'evasion'>('actions');

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
        padding: defaultSpacing.md,
        paddingHorizontal: defaultSpacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: tc.border.subtle,
      }),
      [tc],
    );

    const statsGridStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: defaultSpacing.md,
        padding: defaultSpacing.md,
        paddingHorizontal: defaultSpacing.lg,
      }),
      [],
    );

    const statCardStyle = useMemo<ViewStyle>(
      () => ({
        flex: 1,
        minWidth: 140,
        padding: defaultSpacing.md,
        backgroundColor: tc.background.canvas,
        borderWidth: 1,
        borderColor: tc.border.subtle,
        borderRadius: defaultRadii.md,
        gap: defaultSpacing['2xs'],
      }),
      [tc],
    );

    const tabBarStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        gap: defaultSpacing['2xs'],
        paddingVertical: defaultSpacing.sm,
        paddingHorizontal: defaultSpacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: tc.border.subtle,
      }),
      [tc],
    );

    const actionRowStyle = useMemo<ViewStyle>(
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

    const alertCardStyle = useMemo<ViewStyle>(
      () => ({
        padding: defaultSpacing.md,
        margin: defaultSpacing.sm,
        marginHorizontal: defaultSpacing.lg,
        backgroundColor: tc.status.warningSurface,
        borderWidth: 1,
        borderColor: tc.status.warning,
        borderRadius: defaultRadii.md,
        gap: defaultSpacing.xs,
      }),
      [tc],
    );

    const typeBadgeColors: Record<string, { bg: string; text: string }> = useMemo(
      () => ({
        warning: { bg: tc.status.warningSurface, text: tc.status.warning },
        timeout: { bg: `${tc.status.info}1F`, text: tc.status.info },
        kick: { bg: `${tc.text.primary}14`, text: tc.text.secondary },
        ban: { bg: tc.status.dangerSurface, text: tc.status.danger },
      }),
      [tc],
    );

    const confColors: Record<string, { bg: string; text: string }> = useMemo(
      () => ({
        high: { bg: tc.status.dangerSurface, text: tc.status.danger },
        medium: { bg: tc.status.warningSurface, text: tc.status.warning },
        low: { bg: `${tc.text.primary}0F`, text: tc.text.muted },
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

        {/* Stats */}
        <View style={statsGridStyle}>
          {stats.map((stat, idx) => (
            <View key={idx} style={statCardStyle}>
              <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.secondary }}>
                {stat.label}
              </RNText>
              <RNText style={{ fontSize: defaultTypography.sizes.xl.fontSize, fontWeight: defaultTypography.weights.bold, color: tc.text.primary }}>
                {stat.value}
              </RNText>
              {stat.change != null && (
                <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: stat.change >= 0 ? tc.status.success : tc.status.danger }}>
                  {stat.change >= 0 ? '+' : ''}{stat.change}
                </RNText>
              )}
            </View>
          ))}
        </View>

        {/* Tab bar */}
        <View style={tabBarStyle}>
          <Pressable
            onPress={() => setActiveTab('actions')}
            style={{
              height: 30,
              paddingHorizontal: defaultSpacing.md,
              borderRadius: defaultRadii.md,
              backgroundColor: activeTab === 'actions' ? `${tc.text.primary}14` : 'transparent',
              justifyContent: 'center',
            }}
            accessibilityRole="button"
          >
            <RNText style={{
              fontSize: defaultTypography.sizes.sm.fontSize,
              fontWeight: activeTab === 'actions' ? defaultTypography.weights.semibold : defaultTypography.weights.regular,
              color: activeTab === 'actions' ? tc.text.primary : tc.text.secondary,
            }}>
              Recent Actions
            </RNText>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('evasion')}
            style={{
              height: 30,
              paddingHorizontal: defaultSpacing.md,
              borderRadius: defaultRadii.md,
              backgroundColor: activeTab === 'evasion' ? `${tc.text.primary}14` : 'transparent',
              justifyContent: 'center',
            }}
            accessibilityRole="button"
          >
            <RNText style={{
              fontSize: defaultTypography.sizes.sm.fontSize,
              fontWeight: activeTab === 'evasion' ? defaultTypography.weights.semibold : defaultTypography.weights.regular,
              color: activeTab === 'evasion' ? tc.text.primary : tc.text.secondary,
            }}>
              Ban Evasion {banEvasionAlerts.length > 0 ? `(${banEvasionAlerts.length})` : ''}
            </RNText>
          </Pressable>
        </View>

        {/* Tab content */}
        <ScrollView>
          {activeTab === 'actions' && (
            recentActions.length === 0 ? (
              <View style={{ padding: defaultSpacing.xl, alignItems: 'center' }}>
                <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.muted }}>No recent actions.</RNText>
              </View>
            ) : (
              recentActions.map((action) => {
                const tbc = typeBadgeColors[action.type] ?? typeBadgeColors.warning;
                return (
                  <Pressable key={action.id} style={actionRowStyle} onPress={() => onActionClick?.(action.id)} accessibilityRole="button">
                    <View style={{ height: 20, paddingHorizontal: defaultSpacing.xs, borderRadius: 999, backgroundColor: tbc.bg, justifyContent: 'center' }}>
                      <RNText style={{ fontSize: defaultTypography.sizes['2xs'].fontSize, fontWeight: defaultTypography.weights.medium, color: tbc.text, textTransform: 'capitalize' }}>
                        {action.type}
                      </RNText>
                    </View>
                    <View style={{ flex: 1, gap: defaultSpacing['2xs'] }}>
                      <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.primary }} numberOfLines={1}>
                        {action.actorName} {'\u2192'} {action.targetName}
                      </RNText>
                      {action.reason && (
                        <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.secondary }} numberOfLines={1}>
                          {action.reason}
                        </RNText>
                      )}
                    </View>
                    <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted }}>
                      {action.timestamp}
                    </RNText>
                  </Pressable>
                );
              })
            )
          )}

          {activeTab === 'evasion' && (
            banEvasionAlerts.length === 0 ? (
              <View style={{ padding: defaultSpacing.xl, alignItems: 'center' }}>
                <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.muted }}>No ban evasion alerts.</RNText>
              </View>
            ) : (
              banEvasionAlerts.map((alert) => {
                const cc = confColors[alert.confidence] ?? confColors.low;
                return (
                  <View key={alert.id} style={alertCardStyle}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.sm }}>
                      {alert.suspectedMemberAvatar}
                      <RNText style={{ fontWeight: defaultTypography.weights.semibold, color: tc.text.primary }}>
                        {alert.suspectedMemberName}
                      </RNText>
                      <View style={{ height: 20, paddingHorizontal: defaultSpacing.xs, borderRadius: 999, backgroundColor: cc.bg, justifyContent: 'center' }}>
                        <RNText style={{ fontSize: defaultTypography.sizes['2xs'].fontSize, fontWeight: defaultTypography.weights.medium, color: cc.text, textTransform: 'capitalize' }}>
                          {alert.confidence}
                        </RNText>
                      </View>
                    </View>
                    <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.secondary }}>
                      Matches banned user: {alert.matchedBanName} {'\u2022'} {alert.matchType === 'device_fingerprint' ? 'Device Fingerprint' : 'IP Pattern'} {'\u2022'} {alert.timestamp}
                    </RNText>
                    <View style={{ flexDirection: 'row', gap: defaultSpacing.xs, marginTop: defaultSpacing.xs }}>
                      {onAlertInvestigate && (
                        <Pressable onPress={() => onAlertInvestigate(alert.id)} accessibilityRole="button" style={{
                          height: 26, paddingHorizontal: defaultSpacing.sm, borderRadius: defaultRadii.md, backgroundColor: `${tc.text.primary}14`, justifyContent: 'center',
                        }}>
                          <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, fontWeight: defaultTypography.weights.medium, color: tc.text.primary }}>Investigate</RNText>
                        </Pressable>
                      )}
                      {onAlertDismiss && (
                        <Pressable onPress={() => onAlertDismiss(alert.id)} accessibilityRole="button" style={{
                          height: 26, paddingHorizontal: defaultSpacing.sm, borderRadius: defaultRadii.md, justifyContent: 'center',
                        }}>
                          <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, fontWeight: defaultTypography.weights.medium, color: tc.text.secondary }}>Dismiss</RNText>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })
            )
          )}
        </ScrollView>
      </View>
    );
  },
);

ModerationDashboard.displayName = 'ModerationDashboard';
