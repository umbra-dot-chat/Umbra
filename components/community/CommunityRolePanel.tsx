/**
 * @module CommunityRolePanel
 * @description Umbra wrapper around the Wisp RoleManagementPanel component for communities.
 *
 * Transforms flat community role data (from WASM) into the Wisp ManagedRole
 * format, defines the full 34-permission Umbra permission categories, and
 * renders the RoleManagementPanel panel with drag-to-reorder, color picker,
 * permission toggles, and CRUD support.
 */

import React, { useMemo, useCallback } from 'react';
import type { ViewStyle } from 'react-native';
import { RoleManagementPanel } from '@coexist/wisp-react-native';
import type { ManagedRole, RolePermissionCategory, RoleMember } from '@coexist/wisp-react-native';

// ---------------------------------------------------------------------------
// Community data types (mirrors WASM JSON output shapes)
// ---------------------------------------------------------------------------

/** A role record from `umbra_wasm_community_role_list`. */
export interface CommunityRole {
  id: string;
  community_id: string;
  name: string;
  color?: string;
  icon?: string;
  badge?: string;
  position: number;
  hoisted: boolean;
  mentionable: boolean;
  is_preset: boolean;
  /** Decimal string of a u64 permissions bitfield. */
  permissions_bitfield: string;
  /** Creation timestamp in milliseconds since epoch. */
  created_at: number;
  /** Last-update timestamp in milliseconds since epoch. */
  updated_at: number;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CommunityRolePanelProps {
  /** Community identifier. */
  communityId: string;
  /** All role records for this community. */
  roles: CommunityRole[];
  /** Map of role ID → member count. */
  memberCounts?: Record<string, number>;
  /** Currently selected role ID. */
  selectedRoleId?: string;
  /** Called when a role is selected. */
  onRoleSelect?: (roleId: string) => void;
  /** Called when a new role should be created. */
  onRoleCreate?: () => void;
  /** Called when a role is updated (name, color, hoisted, mentionable). */
  onRoleUpdate?: (roleId: string, updates: Partial<CommunityRole>) => void;
  /** Called when a role should be deleted. */
  onRoleDelete?: (roleId: string) => void;
  /**
   * Called when a permission bit is toggled for a role.
   * - `true` = allow
   * - `false` = deny
   * - `null` = inherit from lower roles
   */
  onPermissionToggle?: (roleId: string, bitIndex: number, value: boolean | null) => void;
  /** Called when roles are reordered via drag-and-drop. */
  onRoleReorder?: (roleId: string, newPosition: number) => void;
  /** Whether the panel is in a loading state. @default false */
  loading?: boolean;
  /** Show loading skeleton. @default false */
  skeleton?: boolean;
  /** Panel title. @default 'Roles' */
  title?: string;
  /** Members who have the currently selected role. */
  roleMembers?: RoleMember[];
  /** All community members (for the add picker). */
  allMembers?: RoleMember[];
  /** Called to add a member to the selected role. */
  onMemberAdd?: (roleId: string, memberId: string) => void;
  /** Called to remove a member from the selected role. */
  onMemberRemove?: (roleId: string, memberId: string) => void;
  /** Optional style overrides for the underlying RoleManagementPanel container. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Umbra permission categories (34 permissions across 8 categories)
// ---------------------------------------------------------------------------

export const UMBRA_PERMISSION_CATEGORIES: RolePermissionCategory[] = [
  {
    name: 'General',
    permissions: [
      { key: '0', label: 'View Channels', description: 'View channels and read messages' },
      { key: '1', label: 'Manage Community', description: 'Manage community settings', dangerous: true },
      { key: '2', label: 'Manage Channels', description: 'Create, edit, and delete channels', dangerous: true },
      { key: '3', label: 'Manage Roles', description: 'Create, edit, and assign roles', dangerous: true },
      { key: '4', label: 'Create Invites', description: 'Create invite links' },
      { key: '5', label: 'Manage Invites', description: "Delete other members' invites", dangerous: true },
    ],
  },
  {
    name: 'Members',
    permissions: [
      { key: '6', label: 'Kick Members', description: 'Kick members from the community', dangerous: true },
      { key: '7', label: 'Ban Members', description: 'Ban members from the community', dangerous: true },
      { key: '8', label: 'Timeout Members', description: 'Mute or restrict members', dangerous: true },
      { key: '9', label: 'Change Nickname', description: 'Change your own nickname' },
      { key: '10', label: 'Manage Nicknames', description: "Change other members' nicknames", dangerous: true },
    ],
  },
  {
    name: 'Messages',
    permissions: [
      { key: '11', label: 'Send Messages', description: 'Send messages in text channels' },
      { key: '12', label: 'Embed Links', description: 'Show URL previews' },
      { key: '13', label: 'Attach Files', description: 'Upload attachments' },
      { key: '14', label: 'Add Reactions', description: 'React to messages' },
      { key: '15', label: 'Use External Emoji', description: 'Use emoji from other communities' },
      { key: '16', label: 'Mention Everyone', description: 'Use @everyone and @here', dangerous: true },
      { key: '17', label: 'Manage Messages', description: "Delete or pin others' messages", dangerous: true },
      { key: '18', label: 'Read Message History', description: 'Read past messages' },
    ],
  },
  {
    name: 'Threads',
    permissions: [
      { key: '19', label: 'Create Threads', description: 'Start new threads' },
      { key: '20', label: 'Send Thread Messages', description: 'Post in threads' },
      { key: '21', label: 'Manage Threads', description: 'Archive, delete, and lock threads', dangerous: true },
    ],
  },
  {
    name: 'Voice',
    permissions: [
      { key: '22', label: 'Connect', description: 'Join voice channels' },
      { key: '23', label: 'Speak', description: 'Speak in voice channels' },
      { key: '24', label: 'Stream', description: 'Share video and screen' },
      { key: '25', label: 'Mute Members', description: 'Mute others in voice', dangerous: true },
      { key: '26', label: 'Deafen Members', description: 'Deafen others in voice', dangerous: true },
      { key: '27', label: 'Move Members', description: 'Move members between voice channels', dangerous: true },
    ],
  },
  {
    name: 'Moderation',
    permissions: [
      { key: '28', label: 'View Audit Log', description: 'View audit logs' },
      { key: '29', label: 'Manage Webhooks', description: 'Create and delete webhooks', dangerous: true },
      { key: '30', label: 'Manage Emoji', description: 'Upload and delete emoji', dangerous: true },
      { key: '31', label: 'Manage Branding', description: 'Update banner, splash, accent', dangerous: true },
    ],
  },
  {
    name: 'Files',
    permissions: [
      { key: '32', label: 'Upload Files', description: 'Upload to file channels' },
      { key: '33', label: 'Manage Files', description: 'Delete and organize files', dangerous: true },
    ],
  },
  {
    name: 'Advanced',
    permissions: [
      { key: '63', label: 'Administrator', description: 'Bypasses all permission checks. Grant with caution.', dangerous: true },
    ],
  },
];

// ---------------------------------------------------------------------------
// Data transformation
// ---------------------------------------------------------------------------

/**
 * Maps Umbra `CommunityRole[]` to Wisp `ManagedRole[]`.
 *
 * - Converts permissions_bitfield (decimal string of u64) to a PermissionState
 *   Record (true = allowed, null = inherit, false = denied)
 * - Uses BigInt for safe handling of the full 64-bit bitfield (including bit 63)
 * - Uses memberCounts map for member count per role
 * - Default role: is_preset && name === 'Member'
 */
function toManagedRoles(
  roles: CommunityRole[],
  memberCounts?: Record<string, number>,
): ManagedRole[] {
  return roles.map((role): ManagedRole => {
    const bigPerms = BigInt(role.permissions_bitfield);

    // Convert bitfield to PermissionState Record
    const permissions: Record<string, boolean | null> = {};
    for (const cat of UMBRA_PERMISSION_CATEGORIES) {
      for (const perm of cat.permissions) {
        const bitIndex = parseInt(perm.key, 10);
        const isSet = (bigPerms & (BigInt(1) << BigInt(bitIndex))) !== BigInt(0);
        // Bit set = allow, bit unset = inherit
        // TODO: Full deny support requires a per-role deny_bitfield in the backend
        permissions[perm.key] = isSet ? true : null;
      }
    }

    return {
      id: role.id,
      name: role.name,
      color: role.color ?? '#95a5a6',
      position: role.position,
      permissions,
      memberCount: memberCounts?.[role.id] ?? 0,
      hoisted: role.hoisted,
      mentionable: role.mentionable,
      // @everyone "Member" role: fully locked (no delete, no rename, no drag)
      isDefault: role.is_preset && role.name.toLowerCase() === 'member',
      // Owner role: protected from deletion/rename but can still be reordered
      protected: role.is_preset && role.name.toLowerCase() === 'owner',
    };
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommunityRolePanel({
  communityId: _communityId,
  roles,
  memberCounts,
  selectedRoleId,
  onRoleSelect,
  onRoleCreate,
  onRoleUpdate,
  onRoleDelete,
  onPermissionToggle,
  onRoleReorder,
  loading = false,
  skeleton = false,
  title = 'Roles',
  roleMembers,
  allMembers,
  onMemberAdd,
  onMemberRemove,
  style,
}: CommunityRolePanelProps) {
  const managedRoles = useMemo(
    () => toManagedRoles(roles, memberCounts),
    [roles, memberCounts],
  );

  const handleRoleUpdate = useCallback(
    (roleId: string, updates: Partial<ManagedRole>) => {
      if (!onRoleUpdate) return;
      // Convert ManagedRole partial back to CommunityRole partial
      const communityUpdates: Partial<CommunityRole> = {};
      if (updates.name !== undefined) communityUpdates.name = updates.name;
      if (updates.color !== undefined) communityUpdates.color = updates.color;
      if (updates.hoisted !== undefined) communityUpdates.hoisted = updates.hoisted;
      if (updates.mentionable !== undefined) communityUpdates.mentionable = updates.mentionable;
      onRoleUpdate(roleId, communityUpdates);
    },
    [onRoleUpdate],
  );

  const handlePermissionToggle = useCallback(
    (roleId: string, permissionKey: string, value: boolean | null) => {
      onPermissionToggle?.(roleId, parseInt(permissionKey, 10), value);
    },
    [onPermissionToggle],
  );

  return (
    <RoleManagementPanel
      roles={managedRoles}
      permissionCategories={UMBRA_PERMISSION_CATEGORIES}
      selectedRoleId={selectedRoleId}
      onRoleSelect={onRoleSelect}
      onRoleUpdate={handleRoleUpdate}
      onRoleCreate={onRoleCreate}
      onRoleDelete={onRoleDelete}
      onPermissionToggle={handlePermissionToggle}
      onRoleReorder={onRoleReorder}
      loading={loading}
      skeleton={skeleton}
      title={title}
      roleMembers={roleMembers}
      allMembers={allMembers}
      onMemberAdd={onMemberAdd}
      onMemberRemove={onMemberRemove}
      style={style}
    />
  );
}
