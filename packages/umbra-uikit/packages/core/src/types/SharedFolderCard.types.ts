/**
 * @module SharedFolderCard
 * @description Type definitions for the SharedFolderCard component —
 * a folder card with sync progress ring and shared-with avatars.
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

/** A member who has access to the shared folder. */
export interface SharedFolderMember {
  /** Member DID. */
  did: string;
  /** Display name. */
  name: string;
  /** Avatar image URL. */
  avatarUrl?: string;
}

/** Sync status of the folder. */
export type FolderSyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the SharedFolderCard component.
 */
export interface SharedFolderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Folder name. */
  name: string;
  /** Members with access to this folder. */
  sharedWith: SharedFolderMember[];
  /** Number of files in the folder. */
  fileCount: number;
  /** ISO timestamp of the last sync. */
  lastSyncAt?: string;
  /** Sync progress from 0 to 100. */
  syncProgress: number;
  /** Current sync status. */
  syncStatus: FolderSyncStatus;
  /** Called when the card is clicked. */
  onClick?: () => void;
  /** Called when the sync button is clicked. */
  onSync?: () => void;
  /** Show skeleton placeholder. @default false */
  skeleton?: boolean;
}
