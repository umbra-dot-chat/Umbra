import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Pressable, Text as RNText, ScrollView } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComputedPermission {
  key: string;
  label: string;
  category: string;
  granted: boolean;
  source: 'role' | 'channel-override' | 'administrator' | 'owner';
  sourceName?: string;
}

export interface PermissionCalculatorProps {
  userName: string;
  userAvatar?: React.ReactNode;
  channelName: string;
  permissions: ComputedPermission[];
  title?: string;
  onClose?: () => void;
  loading?: boolean;
  skeleton?: boolean;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupByCategory(permissions: ComputedPermission[]): Record<string, ComputedPermission[]> {
  const groups: Record<string, ComputedPermission[]> = {};
  for (const perm of permissions) {
    if (!groups[perm.category]) groups[perm.category] = [];
    groups[perm.category].push(perm);
  }
  return groups;
}

function resolveSourceLabel(perm: ComputedPermission): string {
  switch (perm.source) {
    case 'role':
      return perm.sourceName ?? 'Role';
    case 'channel-override':
      return perm.sourceName ?? 'Channel Override';
    case 'administrator':
      return 'Administrator';
    case 'owner':
      return 'Owner';
    default:
      return perm.source;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PermissionCalculator = forwardRef<View, PermissionCalculatorProps>(
  function PermissionCalculator(
    {
      userName,
      userAvatar,
      channelName,
      permissions,
      title = 'Effective Permissions',
      onClose,
      loading = false,
      skeleton = false,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const tc = theme.colors;

    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    const toggleCategory = useCallback((name: string) => {
      setExpandedCategories((prev) => ({ ...prev, [name]: !prev[name] }));
    }, []);

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------
    const containerStyle = useMemo<ViewStyle>(
      () => ({
        backgroundColor: tc.background.canvas,
        borderRadius: defaultRadii.xl,
        padding: defaultSpacing.lg,
        borderWidth: 1,
        borderColor: tc.border.subtle,
        gap: defaultSpacing.md,
      }),
      [tc],
    );

    const headerRowStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }),
      [],
    );

    const userRowStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: defaultSpacing.sm,
        flexWrap: 'wrap',
      }),
      [],
    );

    const separatorStyle = useMemo<ViewStyle>(
      () => ({
        height: 1,
        backgroundColor: tc.border.subtle,
      }),
      [tc],
    );

    const categoryHeaderStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: defaultSpacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: tc.border.subtle,
      }),
      [tc],
    );

    const permRowStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: defaultSpacing.sm,
        paddingHorizontal: defaultSpacing.sm,
        backgroundColor: tc.background.sunken,
        borderRadius: defaultRadii.md,
        gap: defaultSpacing.sm,
      }),
      [tc],
    );

    const permLeftStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: defaultSpacing.sm,
        flex: 1,
      }),
      [],
    );

    const sourceBadgeStyle = useMemo<ViewStyle>(
      () => ({
        backgroundColor: tc.background.canvas,
        paddingHorizontal: defaultSpacing.sm,
        paddingVertical: defaultSpacing['2xs'],
        borderRadius: defaultRadii.sm,
        borderWidth: 1,
        borderColor: tc.border.subtle,
      }),
      [tc],
    );

    // -----------------------------------------------------------------------
    // Grouped permissions
    // -----------------------------------------------------------------------
    const groups = useMemo(() => groupByCategory(permissions), [permissions]);
    const categoryNames = useMemo(() => Object.keys(groups), [groups]);

    // Initialize all categories as expanded by default
    useMemo(() => {
      const initial: Record<string, boolean> = {};
      for (const name of categoryNames) {
        if (expandedCategories[name] === undefined) {
          initial[name] = true;
        }
      }
      if (Object.keys(initial).length > 0) {
        setExpandedCategories((prev) => ({ ...initial, ...prev }));
      }
    }, [categoryNames]);

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
      <View ref={ref} style={[containerStyle, userStyle]}>
        {/* Title */}
        <View style={headerRowStyle}>
          <RNText
            style={{
              fontSize: defaultTypography.sizes.base.fontSize,
              fontWeight: defaultTypography.weights.semibold,
              color: tc.text.primary,
            }}
          >
            {title}
          </RNText>
          {onClose && (
            <Pressable
              onPress={onClose}
              accessibilityLabel="Close"
              accessibilityRole="button"
              style={{
                width: 28,
                height: 28,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RNText style={{ fontSize: 18, color: tc.text.secondary }}>
                {'\u2715'}
              </RNText>
            </Pressable>
          )}
        </View>

        {/* User + channel */}
        <View style={userRowStyle}>
          {userAvatar}
          <RNText
            style={{
              fontSize: defaultTypography.sizes.sm.fontSize,
              fontWeight: defaultTypography.weights.medium,
              color: tc.text.primary,
            }}
          >
            {userName}
          </RNText>
          <RNText
            style={{
              fontSize: defaultTypography.sizes.sm.fontSize,
              color: tc.text.secondary,
            }}
          >
            in
          </RNText>
          <View
            style={{
              backgroundColor: tc.background.sunken,
              paddingHorizontal: defaultSpacing.sm,
              paddingVertical: defaultSpacing['2xs'],
              borderRadius: defaultRadii.sm,
            }}
          >
            <RNText
              style={{
                fontSize: defaultTypography.sizes.xs.fontSize,
                fontWeight: defaultTypography.weights.medium,
                color: tc.text.primary,
              }}
            >
              {channelName}
            </RNText>
          </View>
        </View>

        {/* Separator */}
        <View style={separatorStyle} />

        {/* Loading */}
        {loading && (
          <RNText
            style={{
              fontSize: defaultTypography.sizes.sm.fontSize,
              color: tc.text.secondary,
            }}
          >
            Calculating permissions...
          </RNText>
        )}

        {/* Permission categories */}
        {!loading &&
          categoryNames.map((categoryName) => {
            const granted = groups[categoryName].filter((p) => p.granted).length;
            const total = groups[categoryName].length;
            const expanded = expandedCategories[categoryName] !== false;

            return (
              <View key={categoryName}>
                <Pressable
                  style={categoryHeaderStyle}
                  onPress={() => toggleCategory(categoryName)}
                  accessibilityRole="button"
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.sm }}>
                    <RNText
                      style={{
                        fontSize: defaultTypography.sizes.sm.fontSize,
                        fontWeight: defaultTypography.weights.semibold,
                        color: tc.text.primary,
                      }}
                    >
                      {categoryName}
                    </RNText>
                    <View
                      style={{
                        backgroundColor: tc.background.sunken,
                        paddingHorizontal: defaultSpacing.sm,
                        paddingVertical: 1,
                        borderRadius: defaultRadii.sm,
                      }}
                    >
                      <RNText
                        style={{
                          fontSize: defaultTypography.sizes.xs.fontSize,
                          color: tc.text.secondary,
                        }}
                      >
                        {granted}/{total}
                      </RNText>
                    </View>
                  </View>
                  <RNText style={{ fontSize: 12, color: tc.text.secondary }}>
                    {expanded ? '\u25B2' : '\u25BC'}
                  </RNText>
                </Pressable>

                {expanded && (
                  <View style={{ gap: defaultSpacing.xs, marginTop: defaultSpacing.xs }}>
                    {groups[categoryName].map((perm) => (
                      <View key={perm.key} style={permRowStyle}>
                        <View style={permLeftStyle}>
                          <RNText
                            style={{
                              fontSize: 14,
                              color: perm.granted
                                ? tc.status.success
                                : tc.status.danger,
                            }}
                          >
                            {perm.granted ? '\u2713' : '\u2715'}
                          </RNText>
                          <RNText
                            style={{
                              fontSize: defaultTypography.sizes.sm.fontSize,
                              color: tc.text.primary,
                              flex: 1,
                            }}
                          >
                            {perm.label}
                          </RNText>
                        </View>
                        <View style={sourceBadgeStyle}>
                          <RNText
                            style={{
                              fontSize: defaultTypography.sizes.xs.fontSize,
                              fontWeight: defaultTypography.weights.medium,
                              color: tc.text.secondary,
                            }}
                          >
                            {resolveSourceLabel(perm)}
                          </RNText>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
      </View>
    );
  },
);

PermissionCalculator.displayName = 'PermissionCalculator';
