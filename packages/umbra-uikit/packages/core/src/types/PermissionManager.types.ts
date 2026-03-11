/**
 * @module types/PermissionManager
 * @description Type definitions for the PermissionManager component.
 *
 * Displays a categorized list of permissions with tri-state toggles
 * (allow / deny / inherit) for managing role or channel permissions.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Permission model
// ---------------------------------------------------------------------------

export const permissionCategories = [
  'general',
  'text',
  'voice',
  'management',
] as const;
export type PermissionCategory = (typeof permissionCategories)[number];

/** A single permission definition. */
export interface Permission {
  /** Unique permission identifier. */
  id: string;
  /** Human-readable permission name. */
  name: string;
  /** Description of what this permission grants. */
  description: string;
  /** Category grouping. */
  category: PermissionCategory;
  /** Whether this permission is dangerous / should be highlighted. @default false */
  dangerous?: boolean;
}

/**
 * Permission state map.
 * - `true` = explicitly allowed
 * - `false` = explicitly denied
 * - `null` = inherit from parent / default
 */
export type PermissionState = Record<string, boolean | null>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PermissionManagerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Full list of available permissions. */
  permissions: Permission[];
  /** Current permission states. */
  state: PermissionState;
  /** Called when a permission value changes. */
  onChange: (permissionId: string, value: boolean | null) => void;
  /** Limit displayed categories. If omitted, all categories are shown. */
  categories?: PermissionCategory[];
  /** Disable all toggles. @default false */
  readOnly?: boolean;
}
