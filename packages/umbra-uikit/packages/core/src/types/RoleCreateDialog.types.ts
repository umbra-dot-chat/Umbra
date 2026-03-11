/**
 * @module types/RoleCreateDialog
 * @description Type definitions for the RoleCreateDialog component —
 * dialog for creating new community roles with permissions.
 */

import type React from 'react';

/** Permission category for the grid. */
export interface RolePermissionCategory {
  name: string;
  permissions: Array<{
    key: string;
    label: string;
    description?: string;
    dangerous?: boolean;
  }>;
}

/** Data submitted when creating a role. */
export interface RoleCreateData {
  name: string;
  color: string;
  permissions: Record<string, boolean>;
  hoisted: boolean;
  mentionable: boolean;
}

export interface RoleCreateDialogProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  /** Whether the dialog is open. */
  open: boolean;
  /** Called when the dialog should close. */
  onClose: () => void;
  /** Called when the form is submitted. */
  onSubmit?: (data: RoleCreateData) => void;
  /** Permission categories for the grid. */
  permissionCategories: RolePermissionCategory[];
  /** Whether submission is in progress. @default false */
  submitting?: boolean;
  /** Error message. */
  error?: string;
  /** Title. @default 'Create Role' */
  title?: string;
  /** Default role color. @default '#99AAB5' */
  defaultColor?: string;
  /** Preset colors for the color picker. */
  colorPresets?: string[];
}
