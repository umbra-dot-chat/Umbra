/**
 * @module FileDetailPanel
 * @description Type definitions for the FileDetailPanel component —
 * a slide-out panel showing detailed file information.
 */
import type React from 'react';
import type { FileEntry } from './FileChannelView.types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Version history entry. */
export interface FileVersionEntry {
  /** Version number. */
  version: number;
  /** ISO timestamp of when this version was uploaded. */
  uploadedAt: string;
  /** Name of the user who uploaded this version. */
  uploadedBy: string;
  /** Size of this version in bytes. */
  size: number;
}

/** A peer that has this file. */
export interface FilePeer {
  /** Display name. */
  name: string;
  /** DID identifier. */
  did: string;
  /** Whether the peer has the file. */
  hasFile: boolean;
  /** Whether the peer is online. */
  online: boolean;
}

/** Active tab in the detail panel. */
export type FileDetailTab = 'info' | 'versions' | 'sharing';

/**
 * Props for the FileDetailPanel component.
 */
export interface FileDetailPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The file to display details for. */
  file: FileEntry;
  /** Called when the panel should close. */
  onClose: () => void;
  /** Called when Download is clicked. */
  onDownload?: () => void;
  /** Called when Rename is confirmed. */
  onRename?: (newName: string) => void;
  /** Called when Delete is clicked. */
  onDelete?: () => void;
  /** Whether the panel is visible. @default true */
  open?: boolean;

  // ---- Tabbed layout (Section 6.4) ----

  /** Currently active tab. @default 'info' */
  activeTab?: FileDetailTab;

  /** Callback fired when the active tab changes. */
  onTabChange?: (tab: FileDetailTab) => void;

  // ---- Versions tab ----

  /** Version history for this file. */
  versions?: FileVersionEntry[];

  /** Callback fired when a version is clicked. */
  onVersionClick?: (version: number) => void;

  /** Callback fired when a version revert is requested. */
  onRevert?: (version: number) => void;

  // ---- Sharing tab ----

  /** Sync status of the file. */
  syncStatus?: 'synced' | 'syncing' | 'offline' | 'error';

  /** Peers that have access to this file. */
  peers?: FilePeer[];

  /** Whether the file is end-to-end encrypted. @default false */
  encrypted?: boolean;

  /** Encryption algorithm used. */
  encryptionAlgorithm?: string;

  /** Key version used for encryption. */
  keyVersion?: number;
}
