/**
 * @module components/notification-settings-panel
 * @description React Native NotificationSettingsPanel for the Wisp design system.
 *
 * Reuses color resolution from `@coexist/wisp-core`. Renders via `<View>` + `<Text>`.
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, Switch, ScrollView } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import {
  resolveNotificationSettingsPanelColors,
} from '@coexist/wisp-core/styles/NotificationSettingsPanel.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type NotificationLevel = 'all' | 'mentions' | 'none';

export interface NotificationTarget {
  id: string;
  name: string;
  type: 'community' | 'space' | 'channel';
  icon?: React.ReactNode;
}

export interface NotificationSetting {
  targetId: string;
  level: NotificationLevel;
  muteUntil?: string | null;
  suppressEveryone: boolean;
  suppressRoles: boolean;
}

export interface NotificationSettingsPanelProps extends ViewProps {
  targets: NotificationTarget[];
  settings: NotificationSetting[];
  onSettingChange?: (targetId: string, updates: Partial<NotificationSetting>) => void;
  title?: string;
  onClose?: () => void;
  loading?: boolean;
  skeleton?: boolean;
}

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------

type TabKey = 'community' | 'space' | 'channel';

const TAB_LABELS: Record<TabKey, string> = {
  community: 'Communities',
  space: 'Spaces',
  channel: 'Channels',
};

// ---------------------------------------------------------------------------
// NotificationSettingsPanel
// ---------------------------------------------------------------------------

export const NotificationSettingsPanel = forwardRef<View, NotificationSettingsPanelProps>(
  function NotificationSettingsPanel(
    {
      targets,
      settings,
      onSettingChange,
      title = 'Notification Settings',
      onClose,
      loading = false,
      skeleton = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<TabKey>('community');

    const panelColors = useMemo(
      () => resolveNotificationSettingsPanelColors(theme),
      [theme],
    );

    const filteredTargets = useMemo(
      () => targets.filter((t) => t.type === activeTab),
      [targets, activeTab],
    );

    const getSettingFor = useCallback(
      (targetId: string): NotificationSetting => {
        return (
          settings.find((s) => s.targetId === targetId) ?? {
            targetId,
            level: 'all' as NotificationLevel,
            muteUntil: null,
            suppressEveryone: false,
            suppressRoles: false,
          }
        );
      },
      [settings],
    );

    // Styles
    const containerStyle: ViewStyle = {
      gap: defaultSpacing.lg,
      padding: defaultSpacing.lg,
      backgroundColor: panelColors.bg,
      borderWidth: 1,
      borderColor: panelColors.border,
      borderRadius: defaultRadii.lg,
    };

    const headerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    };

    const titleTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.lg.fontSize,
      lineHeight: defaultTypography.sizes.lg.lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: panelColors.headerText,
    };

    const tabBarStyle: ViewStyle = {
      flexDirection: 'row',
      gap: defaultSpacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: panelColors.border,
      paddingBottom: defaultSpacing.sm,
    };

    const labelStyle: TextStyle = {
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      color: panelColors.labelText,
    };

    const targetRowStyle: ViewStyle = {
      gap: defaultSpacing.sm,
      padding: defaultSpacing.md,
      backgroundColor: panelColors.targetBg,
      borderRadius: defaultRadii.md,
    };

    const targetNameStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: panelColors.headerText,
    };

    const controlsRowStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.md,
      flexWrap: 'wrap',
    };

    return (
      <View ref={ref} style={[containerStyle, userStyle as ViewStyle]} {...rest}>
        {/* Header */}
        <View style={headerStyle}>
          <Text style={titleTextStyle}>{title}</Text>
          {onClose && (
            <Pressable onPress={onClose} accessibilityRole="button">
              <Text style={{ color: panelColors.labelText, fontSize: defaultTypography.sizes.sm.fontSize }}>
                Close
              </Text>
            </Pressable>
          )}
        </View>

        {/* Tabs */}
        <View style={tabBarStyle} accessibilityRole="tablist">
          {(Object.keys(TAB_LABELS) as TabKey[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                style={{
                  paddingHorizontal: defaultSpacing.md,
                  paddingVertical: defaultSpacing.xs,
                  borderRadius: defaultRadii.md,
                  backgroundColor: isActive ? panelColors.tabActiveBg : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: defaultTypography.sizes.sm.fontSize,
                    fontWeight: isActive
                      ? (String(defaultTypography.weights.semibold) as TextStyle['fontWeight'])
                      : (String(defaultTypography.weights.regular) as TextStyle['fontWeight']),
                    color: isActive ? panelColors.tabActiveText : panelColors.tabInactiveText,
                  }}
                >
                  {TAB_LABELS[tab]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Target list */}
        <ScrollView style={{ maxHeight: 400 }}>
          {loading && (
            <Text style={{ color: panelColors.secondaryText, textAlign: 'center', padding: defaultSpacing.lg }}>
              Loading settings...
            </Text>
          )}

          {!loading && filteredTargets.length === 0 && (
            <Text style={{ color: panelColors.secondaryText, textAlign: 'center', padding: defaultSpacing.lg }}>
              No {TAB_LABELS[activeTab].toLowerCase()} found.
            </Text>
          )}

          {!loading &&
            filteredTargets.map((target) => {
              const setting = getSettingFor(target.id);
              return (
                <View key={target.id} style={[targetRowStyle, { marginBottom: defaultSpacing.sm }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.sm }}>
                    {target.icon}
                    <Text style={targetNameStyle}>{target.name}</Text>
                  </View>

                  <View style={controlsRowStyle}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.sm }}>
                      <Text style={labelStyle}>Level: {setting.level}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.sm }}>
                      <Switch
                        value={setting.suppressEveryone}
                        onValueChange={(val) =>
                          onSettingChange?.(target.id, { suppressEveryone: val })
                        }
                        disabled={loading}
                      />
                      <Text style={labelStyle}>@everyone</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.sm }}>
                      <Switch
                        value={setting.suppressRoles}
                        onValueChange={(val) =>
                          onSettingChange?.(target.id, { suppressRoles: val })
                        }
                        disabled={loading}
                      />
                      <Text style={labelStyle}>@roles</Text>
                    </View>
                  </View>
                </View>
              );
            })}
        </ScrollView>
      </View>
    );
  },
);

NotificationSettingsPanel.displayName = 'NotificationSettingsPanel';
