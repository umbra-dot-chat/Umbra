/**
 * @module components/permission-manager
 * @description React Native PermissionManager for the Wisp design system.
 *
 * A grouped list of permissions with tri-state toggles (allow / deny / inherit).
 * Permissions are organized by category with section headers and inline descriptions.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import { resolvePermissionManagerColors } from '@coexist/wisp-core/styles/PermissionManager.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import Svg, { Line, Path } from 'react-native-svg';

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function CheckIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

function XIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Line x1={18} y1={6} x2={6} y2={18} />
      <Line x1={6} y1={6} x2={18} y2={18} />
    </Svg>
  );
}

function MinusIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Line x1={5} y1={12} x2={19} y2={12} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Category labels
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General Permissions',
  text: 'Text Channel Permissions',
  voice: 'Voice Channel Permissions',
  management: 'Management Permissions',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'text' | 'voice' | 'management';
  dangerous?: boolean;
}

export type PermissionState = Record<string, boolean | null>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PermissionManagerProps extends ViewProps {
  /** List of available permissions. */
  permissions: Permission[];
  /** Current state map: permissionId -> true (allow), false (deny), null (inherit). */
  state: PermissionState;
  /** Callback fired when a permission toggle changes. */
  onChange: (permissionId: string, value: boolean | null) => void;
  /** Which categories to display, and in what order. If omitted, all categories shown. */
  categories?: ('general' | 'text' | 'voice' | 'management')[];
  /** Whether the toggles are read-only. @default false */
  readOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PermissionManager = forwardRef<View, PermissionManagerProps>(
  function PermissionManager(
    {
      permissions,
      state,
      onChange,
      categories,
      readOnly = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolvePermissionManagerColors(theme),
      [theme],
    );

    const handleToggle = useCallback(
      (permissionId: string, value: boolean | null) => {
        if (readOnly) return;
        onChange(permissionId, value);
      },
      [readOnly, onChange],
    );

    // Group permissions by category
    const displayCategories = categories ?? ['general', 'text', 'voice', 'management'];

    const grouped = useMemo(() => {
      const map: Record<string, Permission[]> = {};
      for (const cat of displayCategories) {
        map[cat] = [];
      }
      for (const perm of permissions) {
        if (map[perm.category]) {
          map[perm.category].push(perm);
        }
      }
      return map;
    }, [permissions, displayCategories]);

    // -- Styles ---------------------------------------------------------------

    const containerStyle = useMemo<ViewStyle>(() => ({
      flex: 1,
      backgroundColor: colors.bg,
    }), [colors]);

    const categoryHeaderStyle = useMemo<ViewStyle>(() => ({
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.md,
      backgroundColor: colors.categoryBg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }), [colors]);

    const categoryLabelStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      fontWeight: String(defaultTypography.weights.bold) as TextStyle['fontWeight'],
      color: colors.categoryText,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    }), [colors]);

    const rowBaseStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: defaultSpacing.md,
    }), [colors]);

    const permTextContainerStyle = useMemo<ViewStyle>(() => ({
      flex: 1,
      gap: 2,
    }), []);

    const permNameStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.permissionName,
    }), [colors]);

    const permDescStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      fontWeight: String(defaultTypography.weights.regular) as TextStyle['fontWeight'],
      color: colors.permissionDesc,
    }), [colors]);

    const toggleGroupStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: defaultRadii.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      opacity: readOnly ? 0.5 : 1,
      flexShrink: 0,
    }), [colors, readOnly]);

    const toggleButtonBase = useMemo<ViewStyle>(() => ({
      width: 32,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    }), []);

    return (
      <View
        ref={ref}
        accessibilityRole="summary"
        accessibilityLabel="Permission manager"
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        <ScrollView style={{ flex: 1 }}>
          {displayCategories.map((category) => {
            const perms = grouped[category];
            if (!perms || perms.length === 0) return null;

            return (
              <View key={category}>
                {/* Category header */}
                <View style={categoryHeaderStyle}>
                  <Text style={categoryLabelStyle}>
                    {CATEGORY_LABELS[category] ?? category}
                  </Text>
                </View>

                {/* Permission rows */}
                {perms.map((perm) => {
                  const currentValue = state[perm.id] ?? null;
                  const isDangerous = perm.dangerous ?? false;

                  const rowStyle: ViewStyle = {
                    ...rowBaseStyle,
                    backgroundColor: isDangerous
                      ? colors.dangerousBg
                      : colors.bg,
                  };

                  const allowActive = currentValue === true;
                  const denyActive = currentValue === false;
                  const inheritActive = currentValue === null;

                  const allowButtonStyle: ViewStyle = {
                    ...toggleButtonBase,
                    backgroundColor: allowActive ? colors.allowBg : 'transparent',
                  };

                  const denyButtonStyle: ViewStyle = {
                    ...toggleButtonBase,
                    backgroundColor: denyActive ? colors.denyBg : 'transparent',
                    borderLeftWidth: 1,
                    borderLeftColor: colors.border,
                    borderRightWidth: 1,
                    borderRightColor: colors.border,
                  };

                  const inheritButtonStyle: ViewStyle = {
                    ...toggleButtonBase,
                    backgroundColor: inheritActive ? colors.inheritBg : 'transparent',
                  };

                  const allowIconColor = allowActive ? colors.allowIcon : colors.inactiveIcon;
                  const denyIconColor = denyActive ? colors.denyIcon : colors.inactiveIcon;
                  const inheritIconColor = inheritActive ? colors.inheritIcon : colors.inactiveIcon;

                  return (
                    <View
                      key={perm.id}
                      accessibilityRole="summary"
                      accessibilityLabel={`${perm.name}: ${currentValue === true ? 'allowed' : currentValue === false ? 'denied' : 'inherited'}`}
                      style={rowStyle}
                    >
                      {/* Permission text */}
                      <View style={permTextContainerStyle}>
                        <Text style={permNameStyle}>{perm.name}</Text>
                        <Text style={permDescStyle}>{perm.description}</Text>
                      </View>

                      {/* Tri-state toggle group */}
                      <View style={toggleGroupStyle}>
                        {/* Allow button */}
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Allow ${perm.name}`}
                          accessibilityState={{ selected: allowActive }}
                          onPress={() => handleToggle(perm.id, true)}
                          disabled={readOnly}
                          style={allowButtonStyle}
                        >
                          <CheckIcon size={14} color={allowIconColor} />
                        </Pressable>

                        {/* Deny button */}
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Deny ${perm.name}`}
                          accessibilityState={{ selected: denyActive }}
                          onPress={() => handleToggle(perm.id, false)}
                          disabled={readOnly}
                          style={denyButtonStyle}
                        >
                          <XIcon size={14} color={denyIconColor} />
                        </Pressable>

                        {/* Inherit button */}
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Inherit ${perm.name}`}
                          accessibilityState={{ selected: inheritActive }}
                          onPress={() => handleToggle(perm.id, null)}
                          disabled={readOnly}
                          style={inheritButtonStyle}
                        >
                          <MinusIcon size={14} color={inheritIconColor} />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  },
);

PermissionManager.displayName = 'PermissionManager';
