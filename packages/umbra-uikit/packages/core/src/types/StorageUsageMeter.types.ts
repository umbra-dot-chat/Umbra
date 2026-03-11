/**
 * @module StorageUsageMeter
 * @description Type definitions for the StorageUsageMeter component —
 * a storage breakdown visualization with cleanup actions.
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

/** A segment of the storage breakdown. */
export interface StorageSegment {
  /** Category label (e.g. "Images", "Documents"). */
  label: string;
  /** Bytes used by this category. */
  bytes: number;
  /** Color for this segment. */
  color: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the StorageUsageMeter component.
 */
export interface StorageUsageMeterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Total bytes used across all categories. */
  totalUsed: number;
  /** Total available storage in bytes. */
  totalAvailable?: number;
  /** Breakdown of usage by category. */
  breakdown: StorageSegment[];
  /** Called when the cleanup button is clicked. */
  onCleanup?: () => void;
  /** Called when the manage storage button is clicked. */
  onManageStorage?: () => void;
  /** Show skeleton placeholder. @default false */
  skeleton?: boolean;
}
