/**
 * @module MemberContextMenu
 * @description Context menu dropdown for community members.
 *
 * Appears on long-press of a member in the member list panel.
 * Shows role checkboxes for assigning/unassigning roles, plus
 * moderation actions (kick, ban).
 *
 * Uses Wisp DropdownMenu with anchorLayout for explicit positioning.
 */

import React, { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import {
  useTheme, Text,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@coexist/wisp-react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import Svg, { Polyline, Line } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MemberContextMenuRole {
  id: string;
  name: string;
  color: string;
}

export interface MemberContextMenuProps {
  /** Whether the menu is visible. */
  open: boolean;
  /** Called when the menu should open/close. */
  onOpenChange: (open: boolean) => void;
  /** Explicit anchor position (x, y, width, height in window coordinates). */
  anchorLayout: { x: number; y: number; width: number; height: number } | null;
  /** The member being acted on. */
  member: { id: string; name: string } | null;
  /** All community roles (excluding @everyone/default). */
  roles: MemberContextMenuRole[];
  /** Set of role IDs currently assigned to this member. */
  memberRoleIds: Set<string>;
  /** Called when a role checkbox is toggled. */
  onRoleToggle: (memberId: string, roleId: string, assign: boolean) => void;
  /** Called when "Kick" is selected. */
  onKick?: (memberId: string) => void;
  /** Called when "Ban" is selected. */
  onBan?: (memberId: string) => void;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CheckboxIcon({ checked, color }: { checked: boolean; color: string }) {
  return (
    <View
      style={{
        width: 16,
        height: 16,
        borderRadius: 3,
        borderWidth: 1.5,
        borderColor: checked ? color : 'rgba(255,255,255,0.3)',
        backgroundColor: checked ? color : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked && (
        <Svg
          width={10}
          height={10}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Polyline points="20,6 9,17 4,12" />
        </Svg>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MemberContextMenu({
  open,
  onOpenChange,
  anchorLayout,
  member,
  roles,
  memberRoleIds,
  onRoleToggle,
  onKick,
  onBan,
}: MemberContextMenuProps) {
  const { theme } = useTheme();

  const handleRolePress = useCallback(
    (roleId: string) => {
      if (!member) return;
      const isAssigned = memberRoleIds.has(roleId);
      onRoleToggle(member.id, roleId, !isAssigned);
    },
    [member, memberRoleIds, onRoleToggle],
  );

  if (!member) return null;

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} anchorLayout={anchorLayout}>
      <DropdownMenuContent>
        {/* Member name header */}
        <View
          style={{
            paddingHorizontal: defaultSpacing.md,
            paddingVertical: defaultSpacing.sm,
          }}
        >
          <Text
            size="sm"
            weight="semibold"
            style={{ color: theme.colors.text.primary }}
            numberOfLines={1}
          >
            {member.name}
          </Text>
        </View>

        <DropdownMenuSeparator />

        {/* Roles section header */}
        <View
          style={{
            paddingHorizontal: defaultSpacing.md,
            paddingTop: defaultSpacing.xs,
            paddingBottom: 2,
          }}
        >
          <Text
            size="xs"
            weight="semibold"
            style={{
              color: theme.colors.text.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            }}
          >
            Roles
          </Text>
        </View>

        {/* Role checkboxes — use Pressable instead of DropdownMenuItem so menu stays open */}
        {roles.map((role) => {
          const isAssigned = memberRoleIds.has(role.id);
          return (
            <Pressable
              key={role.id}
              onPress={() => handleRolePress(role.id)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: defaultSpacing.sm,
                paddingVertical: defaultSpacing.xs + 2,
                paddingHorizontal: defaultSpacing.md,
                backgroundColor: pressed
                  ? theme.colors.accent.highlight
                  : 'transparent',
              })}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isAssigned }}
              accessibilityLabel={`${role.name} role`}
            >
              <CheckboxIcon checked={isAssigned} color={role.color} />
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: role.color,
                }}
              />
              <Text
                size="sm"
                style={{ color: theme.colors.text.primary, flex: 1 }}
                numberOfLines={1}
              >
                {role.name}
              </Text>
            </Pressable>
          );
        })}

        {/* Moderation actions */}
        {(onKick || onBan) && (
          <>
            <DropdownMenuSeparator />
            {onKick && (
              <DropdownMenuItem
                danger
                onSelect={() => {
                  onKick(member.id);
                }}
              >
                Kick Member
              </DropdownMenuItem>
            )}
            {onBan && (
              <DropdownMenuItem
                danger
                onSelect={() => {
                  onBan(member.id);
                }}
              >
                Ban Member
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
