/**
 * @module FileChannelView
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

/**
 * Represents a folder in the file channel tree.
 */
export interface FileFolder {
  id: string;
  name: string;
  parentId?: string | null;
  children?: FileFolder[];
  fileCount?: number;
  createdBy?: string;
  createdAt?: string;
}

/**
 * Represents a file entry in the file channel.
 */
export interface FileEntry {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  thumbnail?: string;
  downloadCount?: number;
  version?: number;
  folderId?: string | null;
}

/**
 * View mode for the file listing area.
 */
export type FileViewMode = 'grid' | 'list';

/**
 * Sort field for the file listing.
 */
export type FileSortField = 'name' | 'size' | 'date' | 'type';

/**
 * Sort direction.
 */
export type FileSortDirection = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link FileChannelView} component.
 */
export interface FileChannelViewProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of folders for the tree view sidebar. */
  folders: FileFolder[];

  /** Array of files to display in the main content area. */
  files: FileEntry[];

  /** Array of folders within the current folder (shown in the grid/list). */
  subfolders?: FileFolder[];

  /** The currently selected folder id. */
  currentFolderId?: string | null;

  /**
   * Controls grid vs list display of files.
   * @default 'grid'
   */
  viewMode?: FileViewMode;

  /** Callback fired when the view mode toggle changes. */
  onViewModeChange?: (mode: FileViewMode) => void;

  /** Callback fired when a folder is clicked in the tree view. */
  onFolderClick?: (folderId: string) => void;

  /** Callback fired when a file is clicked. */
  onFileClick?: (fileId: string) => void;

  /** Callback fired when the upload button is clicked. */
  onUploadClick?: () => void;

  /** Callback fired when the create folder button is clicked. */
  onCreateFolder?: () => void;

  /** Breadcrumb navigation path from root to current folder. */
  breadcrumbPath?: Array<{ id: string; name: string }>;

  /** Callback fired when a breadcrumb segment is clicked. */
  onBreadcrumbClick?: (folderId: string | null) => void;

  /**
   * When `true`, shows a loading state.
   * @default false
   */
  loading?: boolean;

  /**
   * When `true`, renders skeleton placeholders.
   * @default false
   */
  skeleton?: boolean;

  /**
   * Empty state text when no files exist in the current folder.
   * @default 'No files yet'
   */
  emptyText?: string;

  // ---- Selection ----

  /** Set of selected file ids. */
  selectedFileIds?: Set<string>;

  /** Set of selected folder ids. */
  selectedFolderIds?: Set<string>;

  /** Callback fired when file selection changes. */
  onFileSelectionChange?: (selected: Set<string>) => void;

  /** Callback fired when folder selection changes. */
  onFolderSelectionChange?: (selected: Set<string>) => void;

  // ---- Context menus ----

  /** Callback fired on right-click of a file. */
  onFileContextMenu?: (fileId: string, x: number, y: number) => void;

  /** Callback fired on right-click of a folder. */
  onFolderContextMenu?: (folderId: string, x: number, y: number) => void;

  /** Callback fired when file download is requested. */
  onFileDownload?: (fileId: string) => void;

  /** Callback fired when file rename is requested. */
  onFileRename?: (fileId: string, newName: string) => void;

  /** Callback fired when file move is requested. */
  onFileMove?: (fileId: string, targetFolderId: string | null) => void;

  /** Callback fired when files are deleted. */
  onFileDelete?: (fileIds: string[]) => void;

  /** Callback fired when folder rename is requested. */
  onFolderRename?: (folderId: string, newName: string) => void;

  /** Callback fired when a folder is deleted. */
  onFolderDelete?: (folderId: string) => void;

  // ---- Drag and drop ----

  /** Callback fired when OS files are dropped. */
  onFileDrop?: (files: File[], targetFolderId: string | null) => void;

  /** Callback fired when an item is moved to a folder via drag. */
  onItemMove?: (itemId: string, itemType: 'file' | 'folder', targetFolderId: string | null) => void;

  // ---- Detail panel ----

  /** Callback fired when a file is selected for detail view. */
  onFileSelect?: (fileId: string) => void;

  /** Whether to show the detail panel. */
  showDetailPanel?: boolean;

  /** The file currently displayed in the detail panel. */
  detailFile?: FileEntry | null;

  /** Callback fired when the detail panel is closed. */
  onDetailPanelClose?: () => void;

  // ---- Sort ----

  /** Current sort field. */
  sortBy?: FileSortField;

  /** Current sort direction. */
  sortDirection?: FileSortDirection;

  /** Callback fired when sort changes. */
  onSortChange?: (sortBy: FileSortField, direction: FileSortDirection) => void;

  // ---- Upload zone ----

  /** Whether a file is currently being uploaded. */
  uploading?: boolean;

  /** Upload progress (0-100). */
  uploadProgress?: number;

  /** Name of the file currently being uploaded. */
  currentUploadFileName?: string;

  /** MIME filter for file picker. */
  acceptMimeTypes?: string;

  // ---- Transfer integration (Section 6.1) ----

  /** Active file transfers displayed in a bar at the top of the channel. */
  activeTransfers?: Array<{
    filename: string;
    direction: 'upload' | 'download';
    state: string;
    progress: number;
    bytesTransferred: number;
    totalBytes: number;
    speedBps?: number;
  }>;

  /** Callback fired when a transfer is paused. */
  onTransferPause?: (filename: string) => void;

  /** Callback fired when a transfer is resumed. */
  onTransferResume?: (filename: string) => void;

  /** Callback fired when a transfer is cancelled. */
  onTransferCancel?: (filename: string) => void;

  /** Upload ring progress for nav icon indicator (0-100). */
  uploadRingProgress?: number;

  // ---- Search integration (Section 6.5) ----

  /** Callback fired when the user searches. */
  onSearch?: (query: string, filters?: FileSearchFilters) => void;

  /** Search results to display (overrides files when present). */
  searchResults?: FileEntry[];

  /** Whether search is active. @default false */
  searchActive?: boolean;
}

/**
 * Filters for file search.
 */
export interface FileSearchFilters {
  /** Filter by file type/mime. */
  type?: string;
  /** Start of date range. */
  dateFrom?: string;
  /** End of date range. */
  dateTo?: string;
  /** Filter by uploader name. */
  uploader?: string;
  /** Minimum file size in bytes. */
  sizeMin?: number;
  /** Maximum file size in bytes. */
  sizeMax?: number;
}
