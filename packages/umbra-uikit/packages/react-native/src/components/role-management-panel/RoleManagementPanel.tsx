/**
 * @module components/role-management-panel
 * @description React Native RoleManagementPanel for the Wisp design system.
 *
 * Split-panel desktop layout matching the React DOM version:
 * - Left sidebar (220px): ordered role list with drag dots, color dots,
 *   names, member counts, and a "Create Role" button.
 * - Right panel (flex): role editor with name Input, ColorSwatch grid,
 *   Toggle switches, accordion permission grid with tri-state toggles,
 *   and a destructive Delete Role Button.
 *
 * Uses Wisp RN primitives: Input, Toggle, ColorSwatch, Button.
 */

import React, { forwardRef, useMemo, useCallback, useState, useRef } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle, GestureResponderEvent } from 'react-native';
import { resolveRoleManagementPanelColors } from '@coexist/wisp-core/styles/RoleManagementPanel.styles';
import { resolvePermissionManagerColors } from '@coexist/wisp-core/styles/PermissionManager.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import { Input } from '../../primitives/input';
import { Toggle } from '../../primitives/toggle';
import { ColorSwatch } from '../../primitives/color-swatch';
import { Button } from '../../primitives/button';
import Svg, { Line, Polyline, Path, Circle } from 'react-native-svg';

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function PlusIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Line x1={12} y1={5} x2={12} y2={19} />
      <Line x1={5} y1={12} x2={19} y2={12} />
    </Svg>
  );
}

function ChevronDownIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Polyline points="6,9 12,15 18,9" />
    </Svg>
  );
}

function TrashIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Polyline points="3,6 5,6 21,6" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Svg>
  );
}

function SearchIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx={11} cy={11} r={8} />
      <Line x1={21} y1={21} x2={16.65} y2={16.65} />
    </Svg>
  );
}

function CloseSmallIcon({ size = 12, color }: { size?: number; color?: string }) {
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

// Tri-state toggle icons

function CheckIcon({ size = 12, color }: { size?: number; color?: string }) {
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
      <Polyline points="20,6 9,17 4,12" />
    </Svg>
  );
}

function XMarkIcon({ size = 12, color }: { size?: number; color?: string }) {
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

function SlashIcon({ size = 12, color }: { size?: number; color?: string }) {
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
      <Line x1={18} y1={4} x2={6} y2={20} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ManagedRole {
  id: string;
  name: string;
  color: string;
  position: number;
  permissions: Record<string, boolean | null>;
  memberCount: number;
  hoisted?: boolean;
  mentionable?: boolean;
  /** Fully locked: no delete, no rename, no drag (e.g. @everyone). */
  isDefault?: boolean;
  /** Protected from deletion/rename but can still be reordered (e.g. Owner). */
  protected?: boolean;
}

export interface RolePermissionCategory {
  name: string;
  permissions: RolePermissionItem[];
}

export interface RolePermissionItem {
  key: string;
  label: string;
  description?: string;
  dangerous?: boolean;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RoleEditorTab = 'display' | 'permissions' | 'members';

export interface RoleMember {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RoleManagementPanelProps extends ViewProps {
  roles: ManagedRole[];
  permissionCategories: RolePermissionCategory[];
  selectedRoleId?: string;
  onRoleSelect?: (roleId: string) => void;
  onRoleUpdate?: (roleId: string, updates: Partial<ManagedRole>) => void;
  onRoleCreate?: () => void;
  onRoleDelete?: (roleId: string) => void;
  onPermissionToggle?: (roleId: string, permissionKey: string, value: boolean | null) => void;
  onRoleReorder?: (roleId: string, newPosition: number) => void;
  colorPresets?: string[];
  title?: string;
  loading?: boolean;
  skeleton?: boolean;
  /** Members who have the currently selected role. */
  roleMembers?: RoleMember[];
  /** All community members (for the add picker). */
  allMembers?: RoleMember[];
  /** Called to add a member to the selected role. */
  onMemberAdd?: (roleId: string, memberId: string) => void;
  /** Called to remove a member from the selected role. */
  onMemberRemove?: (roleId: string, memberId: string) => void;
}

// ---------------------------------------------------------------------------
// Default color presets (Discord-style palette)
// ---------------------------------------------------------------------------

const DEFAULT_COLOR_PRESETS = [
  '#e74c3c', '#e91e63', '#9b59b6', '#673ab7',
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
  '#009688', '#4caf50', '#8bc34a', '#cddc39',
  '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
  '#795548', '#607d8b', '#95a5a6', '#1abc9c',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const RoleManagementPanel = forwardRef<View, RoleManagementPanelProps>(
  function RoleManagementPanel(
    {
      roles,
      permissionCategories,
      selectedRoleId,
      onRoleSelect,
      onRoleUpdate,
      onRoleCreate,
      onRoleDelete,
      onPermissionToggle,
      onRoleReorder,
      colorPresets,
      title = 'Roles',
      loading = false,
      skeleton = false,
      roleMembers,
      allMembers,
      onMemberAdd,
      onMemberRemove,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveRoleManagementPanelColors(theme),
      [theme],
    );

    const permColors = useMemo(
      () => resolvePermissionManagerColors(theme),
      [theme],
    );

    const presets = colorPresets ?? DEFAULT_COLOR_PRESETS;

    const [activeTab, setActiveTab] = useState<RoleEditorTab>('display');
    const [memberSearch, setMemberSearch] = useState('');

    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
      () => new Set(permissionCategories.map((c) => c.name)),
    );

    const sortedRoles = useMemo(
      () => [...roles].sort((a, b) => b.position - a.position),
      [roles],
    );

    const selectedRole = useMemo(
      () => roles.find((r) => r.id === selectedRoleId),
      [roles, selectedRoleId],
    );

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------

    const handleRoleSelect = useCallback(
      (roleId: string) => onRoleSelect?.(roleId),
      [onRoleSelect],
    );

    const handleNameChange = useCallback(
      (text: string) => {
        if (selectedRoleId) {
          onRoleUpdate?.(selectedRoleId, { name: text });
        }
      },
      [selectedRoleId, onRoleUpdate],
    );

    const handleToggleCategory = useCallback(
      (name: string) => {
        setExpandedCategories((prev) => {
          const next = new Set(prev);
          if (next.has(name)) next.delete(name);
          else next.add(name);
          return next;
        });
      },
      [],
    );

    const handlePermissionToggle = useCallback(
      (permKey: string, value: boolean | null) => {
        if (selectedRoleId) {
          onPermissionToggle?.(selectedRoleId, permKey, value);
        }
      },
      [selectedRoleId, onPermissionToggle],
    );

    const handleHoistedToggle = useCallback(
      (val: boolean) => {
        if (selectedRoleId) {
          onRoleUpdate?.(selectedRoleId, { hoisted: val });
        }
      },
      [selectedRoleId, onRoleUpdate],
    );

    const handleMentionableToggle = useCallback(
      (val: boolean) => {
        if (selectedRoleId) {
          onRoleUpdate?.(selectedRoleId, { mentionable: val });
        }
      },
      [selectedRoleId, onRoleUpdate],
    );

    const handleColorChange = useCallback(
      (newColor: string) => {
        if (selectedRoleId) {
          onRoleUpdate?.(selectedRoleId, { color: newColor });
        }
      },
      [selectedRoleId, onRoleUpdate],
    );

    const handleDelete = useCallback(() => {
      if (selectedRoleId) onRoleDelete?.(selectedRoleId);
    }, [selectedRoleId, onRoleDelete]);

    const handleMemberAdd = useCallback(
      (memberId: string) => {
        if (selectedRoleId) onMemberAdd?.(selectedRoleId, memberId);
      },
      [selectedRoleId, onMemberAdd],
    );

    const handleMemberRemove = useCallback(
      (memberId: string) => {
        if (selectedRoleId) onMemberRemove?.(selectedRoleId, memberId);
      },
      [selectedRoleId, onMemberRemove],
    );

    // Filter members for the Members tab
    const roleMemberIds = useMemo(
      () => new Set((roleMembers ?? []).map((m) => m.id)),
      [roleMembers],
    );

    const filteredRoleMembers = useMemo(() => {
      if (!roleMembers) return [];
      if (!memberSearch.trim()) return roleMembers;
      const q = memberSearch.toLowerCase();
      return roleMembers.filter((m) => m.name.toLowerCase().includes(q));
    }, [roleMembers, memberSearch]);

    const addableMembers = useMemo(() => {
      if (!allMembers) return [];
      const available = allMembers.filter((m) => !roleMemberIds.has(m.id));
      if (!memberSearch.trim()) return available;
      const q = memberSearch.toLowerCase();
      return available.filter((m) => m.name.toLowerCase().includes(q));
    }, [allMembers, roleMemberIds, memberSearch]);

    // Reset tab when selecting a different role
    const prevSelectedRoleId = useRef(selectedRoleId);
    if (prevSelectedRoleId.current !== selectedRoleId) {
      prevSelectedRoleId.current = selectedRoleId;
      if (activeTab !== 'display') setActiveTab('display');
      if (memberSearch) setMemberSearch('');
    }

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------

    const containerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      flex: 1,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: defaultRadii.lg,
      overflow: 'hidden',
    }), [colors]);

    const sidebarStyle = useMemo<ViewStyle>(() => ({
      width: 220,
      backgroundColor: colors.sidebarBg,
      borderRightWidth: 1,
      borderRightColor: colors.sidebarBorder,
    }), [colors]);

    const sidebarHeaderStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: defaultSpacing.md,
      paddingHorizontal: defaultSpacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.sidebarBorder,
    }), [colors]);

    const sidebarHeaderTextStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.sidebarText,
    }), [colors]);

    const mainPanelStyle = useMemo<ViewStyle>(() => ({
      flex: 2,
      backgroundColor: colors.mainBg,
    }), [colors]);

    const roleHeaderStyle = useMemo<ViewStyle>(() => ({
      gap: defaultSpacing.md,
      padding: defaultSpacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }), [colors]);

    const sectionLabelStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.sectionLabel,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    }), [colors]);

    const toggleRowStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: defaultSpacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }), [colors]);

    const categoryHeaderStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.lg,
      backgroundColor: colors.sidebarBg,
    }), [colors]);

    const categoryLabelStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.secondaryText,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    }), [colors]);

    const permItemStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: defaultSpacing.lg,
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }), [colors]);

    const permLabelStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: colors.primaryText,
    }), [colors]);

    const permDescStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      color: colors.mutedText,
    }), [colors]);

    const memberCountStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      color: colors.sidebarTextMuted,
    }), [colors]);

    const footerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingVertical: defaultSpacing.md,
      paddingHorizontal: defaultSpacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    }), [colors]);

    const emptyStateStyle = useMemo<ViewStyle>(() => ({
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    }), []);

    const colorPickerGridStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: defaultSpacing.xs,
      marginTop: 4,
    }), []);

    // -----------------------------------------------------------------------
    // Skeleton
    // -----------------------------------------------------------------------

    if (skeleton) {
      return (
        <View
          ref={ref}
          accessibilityElementsHidden
          style={[containerStyle, userStyle as ViewStyle]}
          {...rest}
        >
          <View style={sidebarStyle}>
            <View style={sidebarHeaderStyle}>
              <Text style={sidebarHeaderTextStyle}>{title}</Text>
            </View>
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  opacity: 0.4,
                }}
              >
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: colors.skeletonBlock,
                  }}
                />
                <View
                  style={{
                    width: 60 + i * 20,
                    height: 14,
                    borderRadius: defaultRadii.sm,
                    backgroundColor: colors.skeletonBlock,
                  }}
                />
              </View>
            ))}
          </View>
          <View style={[mainPanelStyle, emptyStateStyle]}>
            <Text style={{ color: colors.mutedText, fontSize: defaultTypography.sizes.sm.fontSize }}>
              Select a role to edit
            </Text>
          </View>
        </View>
      );
    }

    // -----------------------------------------------------------------------
    // Loading
    // -----------------------------------------------------------------------

    if (loading) {
      return (
        <View
          ref={ref}
          accessibilityRole="summary"
          accessibilityLabel={title}
          style={[containerStyle, userStyle as ViewStyle]}
          {...rest}
        >
          <View style={sidebarStyle}>
            <View style={sidebarHeaderStyle}>
              <Text style={sidebarHeaderTextStyle}>{title}</Text>
            </View>
            <View style={emptyStateStyle}>
              <Text style={{ color: colors.mutedText }}>Loading roles...</Text>
            </View>
          </View>
          <View style={[mainPanelStyle, emptyStateStyle]}>
            <Text style={{ color: colors.mutedText }}>Loading...</Text>
          </View>
        </View>
      );
    }

    // -----------------------------------------------------------------------
    // Render — Split-panel layout
    // -----------------------------------------------------------------------

    return (
      <View
        ref={ref}
        accessibilityRole="summary"
        accessibilityLabel={title}
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        {/* ---- Left sidebar: Role list ---- */}
        <View style={sidebarStyle}>
          <View style={sidebarHeaderStyle}>
            <Text style={sidebarHeaderTextStyle}>{title}</Text>
          </View>

          <ScrollView style={{ flex: 1 }}>
            {sortedRoles.map((role) => {
              const isSelected = role.id === selectedRoleId;

              return (
                <Pressable
                  key={role.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: defaultSpacing.sm,
                    paddingVertical: defaultSpacing.sm,
                    paddingHorizontal: defaultSpacing.lg,
                    backgroundColor: isSelected ? colors.roleSelectedBg : 'transparent',
                  }}
                  onPress={() => handleRoleSelect(role.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${role.name} role`}
                  accessibilityState={{ selected: isSelected }}
                >
                  {/* Color dot */}
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: role.color,
                    }}
                  />

                  {/* Name */}
                  <Text
                    style={{
                      flex: 1,
                      fontSize: defaultTypography.sizes.sm.fontSize,
                      fontWeight: isSelected
                        ? (String(defaultTypography.weights.semibold) as TextStyle['fontWeight'])
                        : (String(defaultTypography.weights.regular) as TextStyle['fontWeight']),
                      color: colors.sidebarText,
                    }}
                    numberOfLines={1}
                  >
                    {role.name}
                  </Text>

                  {/* Member count */}
                  <Text style={memberCountStyle}>{role.memberCount}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Create Role button */}
          {onRoleCreate && (
            <View
              style={{
                padding: defaultSpacing.sm,
                borderTopWidth: 1,
                borderTopColor: colors.sidebarBorder,
              }}
            >
              <Pressable
                onPress={onRoleCreate}
                accessibilityRole="button"
                accessibilityLabel="Create role"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: defaultRadii.md,
                  borderWidth: 1,
                  borderColor: colors.sidebarBorder,
                }}
              >
                <PlusIcon size={14} color={colors.sidebarText} />
                <Text
                  style={{
                    fontSize: defaultTypography.sizes.sm.fontSize,
                    fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
                    color: colors.sidebarText,
                  }}
                >
                  Create Role
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* ---- Right panel: Role editor ---- */}
        <View style={mainPanelStyle}>
          {selectedRole ? (
            <>
              {/* Tab bar */}
              <View
                style={{
                  flexDirection: 'row',
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  paddingHorizontal: defaultSpacing.lg,
                }}
              >
                {(['display', 'permissions', 'members'] as const).map((tab) => {
                  const isActive = activeTab === tab;
                  const label = tab.charAt(0).toUpperCase() + tab.slice(1);
                  return (
                    <Pressable
                      key={tab}
                      onPress={() => { setActiveTab(tab); setMemberSearch(''); }}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: isActive }}
                      accessibilityLabel={`${label} tab`}
                      style={{
                        paddingVertical: defaultSpacing.md,
                        paddingHorizontal: defaultSpacing.lg,
                        borderBottomWidth: 2,
                        borderBottomColor: isActive ? colors.accent : 'transparent',
                        marginBottom: -1,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: defaultTypography.sizes.sm.fontSize,
                          fontWeight: isActive
                            ? (String(defaultTypography.weights.semibold) as TextStyle['fontWeight'])
                            : (String(defaultTypography.weights.regular) as TextStyle['fontWeight']),
                          color: isActive ? colors.primaryText : colors.secondaryText,
                        }}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* ---- Display tab ---- */}
              {activeTab === 'display' && (
                <>
                  <ScrollView style={{ flex: 1 }}>
                    <View style={roleHeaderStyle}>
                      <Input
                        value={selectedRole.name}
                        onChangeText={handleNameChange}
                        label="Role Name"
                        size="sm"
                        disabled={selectedRole.isDefault || selectedRole.protected}
                        accessibilityLabel="Role name"
                      />

                      <View>
                        <Text style={sectionLabelStyle}>Role Color</Text>
                        <View style={colorPickerGridStyle}>
                          {presets.map((preset) => {
                            const isPresetSelected = selectedRole.color === preset;
                            return (
                              <Pressable
                                key={preset}
                                onPress={() => handleColorChange(preset)}
                                accessibilityRole="button"
                                accessibilityLabel={`Set color ${preset}`}
                                accessibilityState={{ selected: isPresetSelected }}
                                style={{
                                  padding: 2,
                                  borderWidth: 2,
                                  borderColor: isPresetSelected ? colors.accent : 'transparent',
                                  borderRadius: 999,
                                }}
                              >
                                <ColorSwatch
                                  color={preset}
                                  size="sm"
                                  shape="circle"
                                  bordered={false}
                                />
                              </Pressable>
                            );
                          })}
                        </View>
                        <Text
                          style={{
                            marginTop: 4,
                            color: colors.mutedText,
                            fontSize: defaultTypography.sizes.xs.fontSize,
                          }}
                        >
                          {selectedRole.color}
                        </Text>
                      </View>

                      <View style={toggleRowStyle}>
                        <Text style={{ color: colors.primaryText, fontSize: defaultTypography.sizes.sm.fontSize }}>
                          Display role separately
                        </Text>
                        <Toggle
                          checked={!!selectedRole.hoisted}
                          onChange={handleHoistedToggle}
                          size="sm"
                          accessibilityLabel="Display role separately"
                        />
                      </View>

                      <View style={toggleRowStyle}>
                        <Text style={{ color: colors.primaryText, fontSize: defaultTypography.sizes.sm.fontSize }}>
                          Allow anyone to mention this role
                        </Text>
                        <Toggle
                          checked={!!selectedRole.mentionable}
                          onChange={handleMentionableToggle}
                          size="sm"
                          accessibilityLabel="Allow mentioning"
                        />
                      </View>
                    </View>
                  </ScrollView>

                  {!selectedRole.isDefault && !selectedRole.protected && onRoleDelete && (
                    <View style={footerStyle}>
                      <Button
                        variant="destructive"
                        size="sm"
                        onPress={handleDelete}
                        accessibilityLabel={`Delete ${selectedRole.name} role`}
                        iconLeft={<TrashIcon size={14} />}
                      >
                        Delete Role
                      </Button>
                    </View>
                  )}
                </>
              )}

              {/* ---- Permissions tab ---- */}
              {activeTab === 'permissions' && (
                <ScrollView style={{ flex: 1 }}>
                  <View
                    style={{
                      paddingHorizontal: defaultSpacing.lg,
                      paddingTop: defaultSpacing.md,
                    }}
                  >
                    <Text style={sectionLabelStyle}>Permissions</Text>
                  </View>

                  {permissionCategories.map((category) => {
                    const isExpanded = expandedCategories.has(category.name);

                    return (
                      <View key={category.name}>
                        <Pressable
                          style={categoryHeaderStyle}
                          onPress={() => handleToggleCategory(category.name)}
                          accessibilityRole="button"
                          accessibilityLabel={`${category.name} permissions`}
                          accessibilityState={{ expanded: isExpanded }}
                        >
                          <Text style={categoryLabelStyle}>{category.name}</Text>
                          <View
                            style={{
                              transform: [{ rotate: isExpanded ? '0deg' : '-90deg' }],
                            }}
                          >
                            <ChevronDownIcon size={14} color={colors.secondaryText} />
                          </View>
                        </Pressable>

                        {isExpanded &&
                          category.permissions.map((perm) => {
                            const currentValue =
                              selectedRole.permissions[perm.key] ?? null;

                            const allowActive = currentValue === true;
                            const inheritActive = currentValue === null;
                            const denyActive = currentValue === false;

                            return (
                              <View key={perm.key} style={permItemStyle}>
                                <View style={{ flex: 1, gap: 2 }}>
                                  <Text style={permLabelStyle}>{perm.label}</Text>
                                  {perm.description && (
                                    <Text style={permDescStyle}>
                                      {perm.description}
                                    </Text>
                                  )}
                                </View>

                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                  accessibilityRole="radiogroup"
                                  accessibilityLabel={`${perm.label} permission`}
                                >
                                  <Pressable
                                    onPress={() => handlePermissionToggle(perm.key, true)}
                                    accessibilityRole="button"
                                    accessibilityLabel="Allow"
                                    accessibilityState={{ selected: allowActive }}
                                    style={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: defaultRadii.md,
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backgroundColor: allowActive
                                        ? permColors.toggleAllowBg
                                        : 'transparent',
                                    }}
                                  >
                                    <CheckIcon
                                      size={12}
                                      color={
                                        allowActive
                                          ? permColors.toggleAllowIcon
                                          : permColors.inactiveIcon
                                      }
                                    />
                                  </Pressable>

                                  <Pressable
                                    onPress={() => handlePermissionToggle(perm.key, null)}
                                    accessibilityRole="button"
                                    accessibilityLabel="Inherit"
                                    accessibilityState={{ selected: inheritActive }}
                                    style={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: defaultRadii.md,
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backgroundColor: inheritActive
                                        ? permColors.toggleInheritBg
                                        : 'transparent',
                                    }}
                                  >
                                    <SlashIcon
                                      size={12}
                                      color={
                                        inheritActive
                                          ? permColors.toggleInheritIcon
                                          : permColors.inactiveIcon
                                      }
                                    />
                                  </Pressable>

                                  <Pressable
                                    onPress={() => handlePermissionToggle(perm.key, false)}
                                    accessibilityRole="button"
                                    accessibilityLabel="Deny"
                                    accessibilityState={{ selected: denyActive }}
                                    style={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: defaultRadii.md,
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backgroundColor: denyActive
                                        ? permColors.toggleDenyBg
                                        : 'transparent',
                                    }}
                                  >
                                    <XMarkIcon
                                      size={12}
                                      color={
                                        denyActive
                                          ? permColors.toggleDenyIcon
                                          : permColors.inactiveIcon
                                      }
                                    />
                                  </Pressable>
                                </View>
                              </View>
                            );
                          })}
                      </View>
                    );
                  })}
                </ScrollView>
              )}

              {/* ---- Members tab ---- */}
              {activeTab === 'members' && (
                <View style={{ flex: 1 }}>
                  {/* Search bar */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: defaultSpacing.sm,
                      paddingHorizontal: defaultSpacing.lg,
                      paddingVertical: defaultSpacing.sm,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <SearchIcon size={14} color={colors.mutedText} />
                    <TextInput
                      value={memberSearch}
                      onChangeText={setMemberSearch}
                      placeholder="Search members..."
                      placeholderTextColor={colors.mutedText}
                      style={{
                        flex: 1,
                        fontSize: defaultTypography.sizes.sm.fontSize,
                        color: colors.primaryText,
                        paddingVertical: 4,
                      }}
                      accessibilityLabel="Search members"
                    />
                  </View>

                  <ScrollView style={{ flex: 1 }}>
                    {/* Current role members */}
                    {filteredRoleMembers.length > 0 && (
                      <View style={{ paddingVertical: defaultSpacing.xs }}>
                        <View
                          style={{
                            paddingHorizontal: defaultSpacing.lg,
                            paddingVertical: defaultSpacing.xs,
                          }}
                        >
                          <Text style={sectionLabelStyle}>
                            Members — {roleMembers?.length ?? 0}
                          </Text>
                        </View>
                        {filteredRoleMembers.map((member) => (
                          <View
                            key={member.id}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: defaultSpacing.sm,
                              paddingVertical: defaultSpacing.xs,
                              paddingHorizontal: defaultSpacing.lg,
                            }}
                          >
                            {/* Initials avatar */}
                            <View
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                backgroundColor: selectedRole.color,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Text
                                style={{
                                  color: '#fff',
                                  fontSize: 11,
                                  fontWeight: '600',
                                }}
                              >
                                {member.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </Text>
                            </View>

                            <Text
                              style={{
                                flex: 1,
                                fontSize: defaultTypography.sizes.sm.fontSize,
                                color: colors.primaryText,
                              }}
                              numberOfLines={1}
                            >
                              {member.name}
                            </Text>

                            {/* Remove button */}
                            {onMemberRemove && (
                              <Pressable
                                onPress={() => handleMemberRemove(member.id)}
                                accessibilityRole="button"
                                accessibilityLabel={`Remove ${member.name}`}
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: defaultRadii.sm,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <CloseSmallIcon size={12} color={colors.mutedText} />
                              </Pressable>
                            )}
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Addable members */}
                    {addableMembers.length > 0 && onMemberAdd && (
                      <View style={{ paddingVertical: defaultSpacing.xs }}>
                        <View
                          style={{
                            paddingHorizontal: defaultSpacing.lg,
                            paddingVertical: defaultSpacing.xs,
                          }}
                        >
                          <Text style={sectionLabelStyle}>Add Members</Text>
                        </View>
                        {addableMembers.map((member) => (
                          <Pressable
                            key={member.id}
                            onPress={() => handleMemberAdd(member.id)}
                            accessibilityRole="button"
                            accessibilityLabel={`Add ${member.name}`}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: defaultSpacing.sm,
                              paddingVertical: defaultSpacing.xs,
                              paddingHorizontal: defaultSpacing.lg,
                            }}
                          >
                            {/* Initials avatar */}
                            <View
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                backgroundColor: colors.skeletonBlock,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Text
                                style={{
                                  color: '#fff',
                                  fontSize: 11,
                                  fontWeight: '600',
                                }}
                              >
                                {member.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </Text>
                            </View>

                            <Text
                              style={{
                                flex: 1,
                                fontSize: defaultTypography.sizes.sm.fontSize,
                                color: colors.secondaryText,
                              }}
                              numberOfLines={1}
                            >
                              {member.name}
                            </Text>

                            {/* Add button */}
                            <View
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: defaultRadii.sm,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <PlusIcon size={14} color={colors.accent} />
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    )}

                    {/* Empty state */}
                    {filteredRoleMembers.length === 0 && addableMembers.length === 0 && (
                      <View
                        style={{
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: defaultSpacing.xl,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.mutedText,
                            fontSize: defaultTypography.sizes.sm.fontSize,
                          }}
                        >
                          {memberSearch.trim()
                            ? 'No members found'
                            : 'No members with this role'}
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </>
          ) : (
            <View style={emptyStateStyle}>
              <Text
                style={{
                  color: colors.mutedText,
                  fontSize: defaultTypography.sizes.sm.fontSize,
                }}
              >
                Select a role to edit
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  },
);

RoleManagementPanel.displayName = 'RoleManagementPanel';
