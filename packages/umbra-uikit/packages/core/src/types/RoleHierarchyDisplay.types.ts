/**
 * @module types/RoleHierarchyDisplay
 * @description Type definitions for the RoleHierarchyDisplay component —
 * visual role hierarchy with drag-to-reorder.
 */

import type React from 'react';

/** A role in the hierarchy. */
export interface HierarchyRole {
  /** Unique ID. */
  id: string;
  /** Display name. */
  name: string;
  /** Role color (hex). */
  color: string;
  /** Position (0 = highest authority). */
  position: number;
  /** Number of members. */
  memberCount?: number;
  /** Whether this is the default role. */
  isDefault?: boolean;
}

export interface RoleHierarchyDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Roles to display, will be sorted by position. */
  roles: HierarchyRole[];
  /** Called when roles are reordered. Receives new ordered role IDs. */
  onReorder?: (orderedIds: string[]) => void;
  /** Whether reordering is enabled. @default false */
  editable?: boolean;
  /** Called when a role is clicked. */
  onRoleClick?: (roleId: string) => void;
  /** Title. @default 'Role Hierarchy' */
  title?: string;
  /** Description text below title. */
  description?: string;
  /** Loading state. @default false */
  loading?: boolean;
  /** Skeleton state. @default false */
  skeleton?: boolean;
}
