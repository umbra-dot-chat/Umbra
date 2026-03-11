/**
 * @module types/ChannelPermissionEditor
 * @description Type definitions for the ChannelPermissionEditor component --
 * per-channel permission override editor for roles/members.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Override Value
// ---------------------------------------------------------------------------

/**
 * Tri-state override value for a single permission.
 *
 * - `'allow'`   -- explicitly grant.
 * - `'deny'`    -- explicitly deny.
 * - `'inherit'` -- fall through to parent (role/category default).
 */
export type OverrideValue = 'allow' | 'deny' | 'inherit';

// ---------------------------------------------------------------------------
// Target
// ---------------------------------------------------------------------------

/**
 * A role or member that can have per-channel permission overrides.
 */
export interface PermissionOverrideTarget {
  id: string;
  name: string;
  type: 'role' | 'member';
  color?: string;
  avatar?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Permission
// ---------------------------------------------------------------------------

/**
 * A single permission entry with its current override value.
 */
export interface PermissionOverride {
  key: string;
  label: string;
  description?: string;
  category: string;
  value: OverrideValue;
  dangerous?: boolean;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the ChannelPermissionEditor component.
 */
export interface ChannelPermissionEditorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Name of the channel being edited. */
  channelName: string;

  /** Available roles/members to configure. */
  targets: PermissionOverrideTarget[];

  /** Currently selected target ID. */
  selectedTargetId?: string;

  /** Called when a target is selected. */
  onTargetSelect?: (targetId: string) => void;

  /** Called when the "add target" button is clicked. */
  onAddTarget?: () => void;

  /** Called when a target is removed. */
  onRemoveTarget?: (targetId: string) => void;

  /** Permission overrides for the selected target. */
  permissions: PermissionOverride[];

  /** Called when a permission value changes. */
  onPermissionChange?: (targetId: string, permKey: string, value: OverrideValue) => void;

  /** Called when save is clicked. */
  onSave?: () => void;

  /** Called when reset is clicked. */
  onReset?: () => void;

  /** Whether save is in progress. */
  saving?: boolean;

  /** Panel title. @default 'Channel Permissions' */
  title?: string;

  /** Whether to render in skeleton/loading state. */
  skeleton?: boolean;
}
