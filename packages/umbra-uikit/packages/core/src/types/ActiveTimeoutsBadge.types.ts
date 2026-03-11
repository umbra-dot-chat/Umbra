/**
 * @module types/ActiveTimeoutsBadge
 * @description Type definitions for the ActiveTimeoutsBadge component --
 * a badge/indicator on member profiles showing active timeout status.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Timeout Type
// ---------------------------------------------------------------------------

/**
 * The kind of timeout applied to the member.
 *
 * - `'mute'`     -- member cannot send messages.
 * - `'restrict'` -- member has restricted permissions.
 */
export type TimeoutType = 'mute' | 'restrict';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the ActiveTimeoutsBadge component.
 */
export interface ActiveTimeoutsBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether the member is currently timed out. */
  active: boolean;

  /** Type of timeout. */
  type?: TimeoutType;

  /** When the timeout expires (ISO string or formatted). */
  expiresAt?: string;

  /** Reason for the timeout. */
  reason?: string;

  /** Size. @default 'sm' */
  size?: 'xs' | 'sm' | 'md';

  /** Show tooltip with details on hover. @default true */
  showTooltip?: boolean;
}
