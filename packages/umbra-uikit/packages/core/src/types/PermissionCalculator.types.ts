/**
 * @module types/PermissionCalculator
 * @description Type definitions for the PermissionCalculator component —
 * displays effective computed permissions for a user in a channel.
 */

import type React from 'react';

/** A computed permission result. */
export interface ComputedPermission {
  /** Permission key. */
  key: string;
  /** Display label. */
  label: string;
  /** Category name. */
  category: string;
  /** Whether this permission is granted. */
  granted: boolean;
  /** Source of the permission value. */
  source: 'role' | 'channel-override' | 'administrator' | 'owner';
  /** Name of the role or override that grants/denies this. */
  sourceName?: string;
}

export interface PermissionCalculatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** User display name. */
  userName: string;
  /** User avatar. */
  userAvatar?: React.ReactNode;
  /** Channel name. */
  channelName: string;
  /** Computed permissions to display. */
  permissions: ComputedPermission[];
  /** Title. @default 'Effective Permissions' */
  title?: string;
  /** Called when close is clicked. */
  onClose?: () => void;
  /** Loading state. @default false */
  loading?: boolean;
  /** Skeleton state. @default false */
  skeleton?: boolean;
}
