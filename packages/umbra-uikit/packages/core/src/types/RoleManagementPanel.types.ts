/**
 * @module types/RoleManagementPanel
 * @description Type definitions for the RoleManagementPanel component —
 * admin panel for creating and managing community roles with permissions.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

/** A role in the management panel. */
export interface ManagedRole {
  /** Unique role ID. */
  id: string;
  /** Role display name. */
  name: string;
  /** Role color (hex). */
  color: string;
  /** Position in the hierarchy (lower = higher authority). */
  position: number;
  /**
   * Permission states for this role.
   * - `true` = explicitly allowed
   * - `false` = explicitly denied
   * - `null` (or absent key) = inherit from lower roles / default
   */
  permissions: Record<string, boolean | null>;
  /** Number of members with this role. */
  memberCount: number;
  /** Whether this role is hoisted (shown separately in member list). */
  hoisted?: boolean;
  /** Whether this role can be @mentioned. */
  mentionable?: boolean;
  /** Whether this is the default @everyone role.
   *  Default roles cannot be deleted, renamed, or reordered. */
  isDefault?: boolean;
  /** Whether this role is protected from deletion and renaming
   *  but can still be reordered (e.g. the Owner role). */
  protected?: boolean;
}

/** A permission category for the grid display. */
export interface RolePermissionCategory {
  /** Category name (e.g. "General", "Text", "Voice"). */
  name: string;
  /** Permissions within this category. */
  permissions: RolePermissionItem[];
}

/** A single permission toggle. */
export interface RolePermissionItem {
  /** Permission key/bit identifier. */
  key: string;
  /** Display name. */
  label: string;
  /** Description of what this permission allows. */
  description?: string;
  /** Whether this is a dangerous permission. @default false */
  dangerous?: boolean;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RoleManagementPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** List of roles to manage. */
  roles: ManagedRole[];

  /** Permission categories for the grid. */
  permissionCategories: RolePermissionCategory[];

  /** Currently selected role ID. */
  selectedRoleId?: string;

  /** Called when a role is selected. */
  onRoleSelect?: (roleId: string) => void;

  /** Called when a role is updated. */
  onRoleUpdate?: (roleId: string, updates: Partial<ManagedRole>) => void;

  /** Called when a new role should be created. */
  onRoleCreate?: () => void;

  /** Called when a role should be deleted. */
  onRoleDelete?: (roleId: string) => void;

  /**
   * Called when a permission is toggled for the selected role.
   * - `true` = allow
   * - `false` = deny
   * - `null` = inherit from lower roles
   */
  onPermissionToggle?: (roleId: string, permissionKey: string, value: boolean | null) => void;

  /** Called when roles are reordered via drag-and-drop. */
  onRoleReorder?: (roleId: string, newPosition: number) => void;

  /** Preset colors for the role color picker. If omitted, a default palette is used. */
  colorPresets?: string[];

  /** Title. @default 'Roles' */
  title?: string;

  /** Loading state. @default false */
  loading?: boolean;

  /** Skeleton state. @default false */
  skeleton?: boolean;
}
