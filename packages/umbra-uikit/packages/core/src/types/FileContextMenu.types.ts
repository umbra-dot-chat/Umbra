/**
 * @module FileContextMenu
 * @description Type definitions for the FileContextMenu component —
 * a context menu with file-specific actions (download, rename, move, delete, etc).
 */

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the FileContextMenu component.
 */
export interface FileContextMenuProps {
  /** Whether the menu is open. */
  open: boolean;
  /** Position for the menu (from the right-click event). */
  position: { x: number; y: number };
  /** Called when the menu should close. */
  onClose: () => void;

  // Actions
  /** Called when Download is selected. */
  onDownload?: () => void;
  /** Called when Rename is selected. */
  onRename?: () => void;
  /** Called when Move To... is selected. */
  onMove?: () => void;
  /** Called when Copy Link is selected. */
  onCopyLink?: () => void;
  /** Called when Details is selected. */
  onDetails?: () => void;
  /** Called when Delete is selected. */
  onDelete?: () => void;

  /** Whether multiple files are selected. Adjusts menu labels. @default false */
  multiSelect?: boolean;
  /** Number of selected files (shown in multi-select mode). */
  selectedCount?: number;
}

/**
 * Props for the FolderContextMenu component.
 */
export interface FolderContextMenuProps {
  /** Whether the menu is open. */
  open: boolean;
  /** Position for the menu (from the right-click event). */
  position: { x: number; y: number };
  /** Called when the menu should close. */
  onClose: () => void;

  // Actions
  /** Called when Open is selected. */
  onOpen?: () => void;
  /** Called when Rename is selected. */
  onRename?: () => void;
  /** Called when Move To... is selected. */
  onMove?: () => void;
  /** Called when Delete is selected. */
  onDelete?: () => void;
}
