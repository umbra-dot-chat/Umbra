/**
 * @module SyncStatusIndicator
 * @description Type definitions for the SyncStatusIndicator component —
 * a small badge with an optional progress ring.
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the SyncStatusIndicator component.
 */
export interface SyncStatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current sync status. */
  status: 'synced' | 'syncing' | 'offline' | 'error';
  /** Sync progress from 0 to 100. */
  progress: number;
  /** Size variant. @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show a text label next to the indicator. @default false */
  showLabel?: boolean;
}
