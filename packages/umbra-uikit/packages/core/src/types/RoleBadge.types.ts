/**
 * @module types/RoleBadge
 * @description Type definitions for the RoleBadge component.
 *
 * Displays a colored pill badge representing a user role, with optional
 * icon and remove button.
 */

import type React from 'react';
import type { ComponentSize } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Role definition
// ---------------------------------------------------------------------------

export interface Role {
  /** Unique role identifier. */
  id: string;
  /** Display name. */
  name: string;
  /** Role color (hex). Used as badge background. */
  color: string;
  /** Optional icon displayed before the name. */
  icon?: React.ReactNode;
  /** Sort position — higher values = more authority. */
  position: number;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RoleBadgeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'role'> {
  /** The role to display. */
  role: Role;
  /** Badge size variant. @default 'sm' */
  size?: ComponentSize;
  /** Whether to show a remove button. @default false */
  removable?: boolean;
  /** Remove button click handler. */
  onRemove?: () => void;
}
