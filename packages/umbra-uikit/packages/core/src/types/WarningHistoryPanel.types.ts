/**
 * @module types/WarningHistoryPanel
 * @description Type definitions for the WarningHistoryPanel component --
 * a per-member panel showing their warning history.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Sub-types
// ---------------------------------------------------------------------------

/** A single warning entry in the history list. */
export interface WarningEntry {
  id: string;
  reason: string;
  issuedBy: string;
  issuedByAvatar?: React.ReactNode;
  issuedAt: string;
  expiresAt?: string | null;
  active?: boolean;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the WarningHistoryPanel component.
 */
export interface WarningHistoryPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Member whose warning history is displayed. */
  memberName: string;

  /** Member avatar node. */
  memberAvatar?: React.ReactNode;

  /** Array of warning entries. */
  warnings: WarningEntry[];

  /** Called when a warning should be deleted. */
  onDeleteWarning?: (warningId: string) => void;

  /** Called when the panel should close. */
  onClose?: () => void;

  /** Panel title. @default 'Warning History' */
  title?: string;

  /** Whether data is loading. @default false */
  loading?: boolean;

  /** Show loading skeleton. @default false */
  skeleton?: boolean;
}
