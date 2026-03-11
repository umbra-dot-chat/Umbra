/**
 * @module FileChannelView
 * @description Enhanced file channel view with folder cards, context menus,
 * multi-select, sort, drag-and-drop (dnd-kit), file upload zone, and detail panel.
 */
import React, { forwardRef, useMemo, useCallback, useState, useRef } from 'react';
import type {
  FileChannelViewProps,
  FileFolder,
  FileEntry,
  FileViewMode,
  FileSortField,
  FileSortDirection,
} from '@coexist/wisp-core/types/FileChannelView.types';
import {
  buildFileChannelRootStyle,
  buildFileChannelSidebarStyle,
  buildFileChannelContentStyle,
  buildFileChannelToolbarStyle,
  buildFileChannelBreadcrumbStyle,
  buildFileChannelActionsStyle,
  buildFileChannelGridStyle,
  buildFileChannelListStyle,
  buildFileChannelListRowStyle,
  buildFileChannelEmptyStyle,
  buildFileChannelSkeletonStyle,
} from '@coexist/wisp-core/styles/FileChannelView.styles';
import { useTheme } from '../../providers';

// dnd-kit
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';

// Sub-components
import { FolderCard } from '../folder-card';
import { FileContextMenu, FolderContextMenu } from '../file-context-menu';
import { FileUploadZone } from '../file-upload-zone';
import { FileDetailPanel } from '../file-detail-panel';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '\u{1F5BC}';
  if (mimeType.startsWith('video/')) return '\u{1F3AC}';
  if (mimeType.startsWith('audio/')) return '\u{1F3B5}';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text'))
    return '\u{1F4C4}';
  return '\u{1F4CE}';
}

// ---------------------------------------------------------------------------
// Sort icon SVG
// ---------------------------------------------------------------------------

function SortArrow({ direction }: { direction: 'asc' | 'desc' | null }) {
  if (!direction) return null;
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {direction === 'asc' ? (
        <polyline points="18 15 12 9 6 15" />
      ) : (
        <polyline points="6 9 12 15 18 9" />
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Draggable file card wrapper
// ---------------------------------------------------------------------------

function DraggableFileCard({
  file,
  children,
}: {
  file: FileEntry;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `file-${file.id}`,
    data: { type: 'file', id: file.id },
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Draggable folder card wrapper
// ---------------------------------------------------------------------------

function DraggableFolderCard({
  folder,
  children,
}: {
  folder: FileFolder;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `folder-${folder.id}`,
    data: { type: 'folder', id: folder.id },
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Droppable folder target wrapper
// ---------------------------------------------------------------------------

function DroppableFolderTarget({
  folderId,
  children,
}: {
  folderId: string;
  children: (isOver: boolean) => React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-folder-${folderId}`,
    data: { type: 'folder', id: folderId },
  });

  return (
    <div ref={setNodeRef}>
      {children(isOver)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Folder tree item (recursive)
// ---------------------------------------------------------------------------

function FolderTreeItem({
  folder,
  currentFolderId,
  onFolderClick,
  depth = 0,
}: {
  folder: FileFolder;
  currentFolderId?: string | null;
  onFolderClick?: (id: string) => void;
  depth?: number;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const isActive = currentFolderId === folder.id;

  // Make tree items droppable too
  const { setNodeRef, isOver } = useDroppable({
    id: `tree-drop-${folder.id}`,
    data: { type: 'folder', id: folder.id },
  });

  const style = useMemo(
    () => ({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.xs,
      padding: `${theme.spacing['2xs']}px ${theme.spacing.sm}px`,
      paddingLeft: theme.spacing.sm + depth * 16,
      borderRadius: theme.radii.md,
      cursor: 'pointer' as const,
      backgroundColor: isOver ? `${tc.accent.primary}15` : isActive ? tc.accent.highlight : 'transparent',
      color: isActive ? tc.accent.primary : tc.text.primary,
      fontSize: theme.typography.sizes.sm.fontSize,
      fontWeight: isActive ? theme.typography.weights.semibold : theme.typography.weights.regular,
      border: isOver ? `1px dashed ${tc.accent.primary}` : '1px solid transparent',
      outline: 'none',
      width: '100%',
      textAlign: 'left' as const,
      fontFamily: 'inherit',
      boxSizing: 'border-box' as const,
    }),
    [theme, tc, isActive, isOver, depth],
  );

  return (
    <>
      <button
        ref={setNodeRef}
        type="button"
        style={style}
        onClick={() => onFolderClick?.(folder.id)}
        aria-current={isActive ? 'page' : undefined}
      >
        <span>{isActive ? '\u{1F4C2}' : '\u{1F4C1}'}</span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {folder.name}
        </span>
        {folder.fileCount != null && (
          <span style={{ fontSize: theme.typography.sizes.xs.fontSize, color: tc.text.muted }}>
            {folder.fileCount}
          </span>
        )}
      </button>
      {folder.children?.map((child) => (
        <FolderTreeItem
          key={child.id}
          folder={child}
          currentFolderId={currentFolderId}
          onFolderClick={onFolderClick}
          depth={depth + 1}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// FileChannelView
// ---------------------------------------------------------------------------

export const FileChannelView = forwardRef<HTMLDivElement, FileChannelViewProps>(
  function FileChannelView(
    {
      folders,
      files,
      subfolders = [],
      currentFolderId,
      viewMode = 'grid',
      onViewModeChange,
      onFolderClick,
      onFileClick,
      onUploadClick,
      onCreateFolder,
      breadcrumbPath,
      onBreadcrumbClick,
      loading = false,
      skeleton = false,
      emptyText = 'No files yet',
      // Selection
      selectedFileIds,
      selectedFolderIds,
      onFileSelectionChange,
      onFolderSelectionChange,
      // Context menus
      onFileContextMenu,
      onFolderContextMenu,
      onFileDownload,
      onFileRename,
      onFileMove,
      onFileDelete,
      onFolderRename,
      onFolderDelete,
      // Drag and drop
      onFileDrop,
      onItemMove,
      // Detail panel
      onFileSelect,
      showDetailPanel = false,
      detailFile,
      onDetailPanelClose,
      // Sort
      sortBy,
      sortDirection,
      onSortChange,
      // Upload zone
      uploading = false,
      uploadProgress,
      currentUploadFileName,
      acceptMimeTypes,
      // HTML
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const tc = theme.colors;
    const [hoveredFileId, setHoveredFileId] = useState<string | null>(null);
    const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null);
    const lastClickedIdRef = useRef<string | null>(null);

    // Drag state
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [activeDragType, setActiveDragType] = useState<'file' | 'folder' | null>(null);

    // Internal context menu state
    const [fileMenuState, setFileMenuState] = useState<{ open: boolean; fileId: string; x: number; y: number }>({ open: false, fileId: '', x: 0, y: 0 });
    const [folderMenuState, setFolderMenuState] = useState<{ open: boolean; folderId: string; x: number; y: number }>({ open: false, folderId: '', x: 0, y: 0 });

    // dnd-kit sensors
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: { distance: 8 },
      }),
    );

    // Precomputed styles
    const rootStyle = useMemo(() => buildFileChannelRootStyle(theme), [theme]);
    const sidebarStyle = useMemo(() => buildFileChannelSidebarStyle(theme), [theme]);
    const contentStyle = useMemo(() => buildFileChannelContentStyle(theme), [theme]);
    const toolbarStyle = useMemo(() => buildFileChannelToolbarStyle(theme), [theme]);
    const breadcrumbAreaStyle = useMemo(() => buildFileChannelBreadcrumbStyle(theme), [theme]);
    const actionsStyle = useMemo(() => buildFileChannelActionsStyle(theme), [theme]);
    const gridStyle = useMemo(() => buildFileChannelGridStyle(theme), [theme]);
    const listStyle = useMemo(() => buildFileChannelListStyle(theme), [theme]);
    const emptyStyle = useMemo(() => buildFileChannelEmptyStyle(theme), [theme]);
    const skeletonBlockStyle = useMemo(() => buildFileChannelSkeletonStyle(theme), [theme]);

    const viewToggleStyle = useMemo(
      () => ({
        display: 'inline-flex',
        borderRadius: theme.radii.md,
        border: `1px solid ${tc.border.subtle}`,
        overflow: 'hidden' as const,
      }),
      [theme, tc],
    );

    const viewToggleBtnStyle = useCallback(
      (active: boolean) => ({
        padding: `${theme.spacing['2xs']}px ${theme.spacing.sm}px`,
        border: 'none',
        outline: 'none',
        cursor: 'pointer' as const,
        backgroundColor: active ? tc.accent.primary : 'transparent',
        color: active ? tc.text.inverse : tc.text.secondary,
        fontSize: theme.typography.sizes.xs.fontSize,
        fontFamily: 'inherit',
      }),
      [theme, tc],
    );

    const actionBtnStyle = useMemo(
      () => ({
        padding: `${theme.spacing['2xs']}px ${theme.spacing.sm}px`,
        border: `1px solid ${tc.border.subtle}`,
        borderRadius: theme.radii.md,
        backgroundColor: 'transparent',
        color: tc.text.primary,
        cursor: 'pointer' as const,
        fontSize: theme.typography.sizes.sm.fontSize,
        fontFamily: 'inherit',
      }),
      [theme, tc],
    );

    const uploadBtnStyle = useMemo(
      () => ({
        ...actionBtnStyle,
        backgroundColor: tc.accent.primary,
        color: tc.text.inverse,
        border: 'none',
      }),
      [actionBtnStyle, tc],
    );

    // List column header style
    const listHeaderStyle = useMemo<React.CSSProperties>(
      () => ({
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        padding: `${theme.spacing['2xs']}px ${theme.spacing.sm}px`,
        borderBottom: `1px solid ${tc.border.subtle}`,
        fontSize: theme.typography.sizes.xs.fontSize,
        fontWeight: theme.typography.weights.semibold,
        color: tc.text.muted,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        userSelect: 'none',
      }),
      [theme, tc],
    );

    // ---- Selection logic ----

    const handleFileClick = useCallback(
      (fileId: string, e: React.MouseEvent) => {
        onFileSelect?.(fileId);
        onFileClick?.(fileId);

        if (!onFileSelectionChange || !selectedFileIds) return;

        const newSet = new Set(selectedFileIds);

        if (e.metaKey || e.ctrlKey) {
          if (newSet.has(fileId)) newSet.delete(fileId);
          else newSet.add(fileId);
        } else if (e.shiftKey && lastClickedIdRef.current) {
          const allIds = files.map((f) => f.id);
          const start = allIds.indexOf(lastClickedIdRef.current);
          const end = allIds.indexOf(fileId);
          if (start !== -1 && end !== -1) {
            const [lo, hi] = start < end ? [start, end] : [end, start];
            for (let i = lo; i <= hi; i++) {
              newSet.add(allIds[i]);
            }
          }
        } else {
          newSet.clear();
          newSet.add(fileId);
        }

        lastClickedIdRef.current = fileId;
        onFileSelectionChange(newSet);
      },
      [selectedFileIds, onFileSelectionChange, onFileSelect, onFileClick, files],
    );

    const handleFolderItemClick = useCallback(
      (folderId: string) => {
        onFolderClick?.(folderId);
      },
      [onFolderClick],
    );

    // ---- Context menu handlers ----

    const handleFileRightClick = useCallback(
      (fileId: string, e: React.MouseEvent) => {
        e.preventDefault();
        if (onFileContextMenu) {
          onFileContextMenu(fileId, e.clientX, e.clientY);
        } else {
          setFileMenuState({ open: true, fileId, x: e.clientX, y: e.clientY });
        }
      },
      [onFileContextMenu],
    );

    const handleFolderRightClick = useCallback(
      (folderId: string, e: React.MouseEvent) => {
        e.preventDefault();
        if (onFolderContextMenu) {
          onFolderContextMenu(folderId, e.clientX, e.clientY);
        } else {
          setFolderMenuState({ open: true, folderId, x: e.clientX, y: e.clientY });
        }
      },
      [onFolderContextMenu],
    );

    // ---- Sort handler ----

    const handleSortClick = useCallback(
      (field: FileSortField) => {
        if (!onSortChange) return;
        if (sortBy === field) {
          onSortChange(field, sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
          onSortChange(field, 'asc');
        }
      },
      [onSortChange, sortBy, sortDirection],
    );

    // ---- Drag handlers ----

    const handleDragStart = useCallback((event: DragStartEvent) => {
      const data = event.active.data.current as { type: 'file' | 'folder'; id: string } | undefined;
      if (data) {
        setActiveDragId(data.id);
        setActiveDragType(data.type);
      }
    }, []);

    const handleDragEnd = useCallback(
      (event: DragEndEvent) => {
        setActiveDragId(null);
        setActiveDragType(null);

        if (!event.over || !onItemMove) return;

        const activeData = event.active.data.current as { type: 'file' | 'folder'; id: string } | undefined;
        const overData = event.over.data.current as { type: string; id: string } | undefined;

        if (!activeData || !overData) return;

        if (overData.type === 'folder') {
          if (activeData.type === 'folder' && activeData.id === overData.id) return;
          onItemMove(activeData.id, activeData.type, overData.id);
        }
      },
      [onItemMove],
    );

    // ---- Upload zone handlers ----
    const handleFileDrop = useCallback(
      (droppedFiles: File[]) => {
        onFileDrop?.(droppedFiles, currentFolderId ?? null);
      },
      [onFileDrop, currentFolderId],
    );

    const handleFileInputSelect = useCallback(
      (selectedFiles: File[]) => {
        onFileDrop?.(selectedFiles, currentFolderId ?? null);
      },
      [onFileDrop, currentFolderId],
    );

    // ---- Render: Skeleton ----
    if (skeleton) {
      return (
        <div ref={ref} className={className} style={{ ...rootStyle, ...userStyle }} {...rest}>
          <div style={sidebarStyle}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ ...skeletonBlockStyle, width: '100%', height: 28, marginBottom: 8 }} />
            ))}
          </div>
          <div style={contentStyle}>
            <div style={toolbarStyle}>
              <div style={{ ...skeletonBlockStyle, width: 200, height: 24 }} />
            </div>
            <div style={gridStyle}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} style={{ ...skeletonBlockStyle, width: '100%', height: 180 }} />
              ))}
            </div>
          </div>
        </div>
      );
    }

    // ---- Drag overlay content ----
    const dragOverlayContent = activeDragId ? (
      activeDragType === 'file' ? (
        <div
          style={{
            padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
            backgroundColor: tc.background.surface,
            borderRadius: theme.radii.md,
            border: `1px solid ${tc.accent.primary}`,
            boxShadow: theme.shadows.md,
            fontSize: theme.typography.sizes.sm.fontSize,
            color: tc.text.primary,
          }}
        >
          {files.find((f) => f.id === activeDragId)?.name ?? 'File'}
        </div>
      ) : (
        <div
          style={{
            padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
            backgroundColor: tc.background.surface,
            borderRadius: theme.radii.md,
            border: `1px solid ${tc.accent.primary}`,
            boxShadow: theme.shadows.md,
            fontSize: theme.typography.sizes.sm.fontSize,
            color: tc.text.primary,
          }}
        >
          {'\u{1F4C1}'} {subfolders.find((f) => f.id === activeDragId)?.name ?? 'Folder'}
        </div>
      )
    ) : null;

    const hasContent = subfolders.length > 0 || files.length > 0;

    // ---- Render helpers ----

    const renderFileCard = (file: FileEntry) => {
      const isSelected = selectedFileIds?.has(file.id) ?? false;

      const card = viewMode === 'grid' ? (
        <div
          key={file.id}
          onClick={(e) => handleFileClick(file.id, e)}
          onContextMenu={(e) => handleFileRightClick(file.id, e)}
          onMouseEnter={() => setHoveredFileId(file.id)}
          onMouseLeave={() => setHoveredFileId(null)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: theme.radii.lg,
            border: isSelected
              ? `2px solid ${tc.accent.primary}`
              : `1px solid ${tc.border.subtle}`,
            backgroundColor: tc.background.surface,
            cursor: 'pointer',
            overflow: 'hidden',
            boxShadow: hoveredFileId === file.id ? theme.shadows.sm : 'none',
            transition: 'box-shadow 150ms ease-out, border-color 150ms ease-out',
          }}
          role="button"
          tabIndex={0}
          aria-label={file.name}
          aria-selected={isSelected}
        >
          <div
            style={{
              height: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: tc.background.raised,
            }}
          >
            {file.thumbnail ? (
              <img src={file.thumbnail} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 28 }}>{getFileIcon(file.mimeType)}</span>
            )}
          </div>
          <div style={{ padding: theme.spacing.sm, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{
              fontSize: theme.typography.sizes.sm.fontSize,
              fontWeight: theme.typography.weights.medium,
              color: tc.text.primary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {file.name}
            </div>
            <div style={{
              fontSize: theme.typography.sizes.xs.fontSize,
              color: tc.text.muted,
            }}>
              {formatSize(file.size)}
            </div>
          </div>
        </div>
      ) : (
        <div
          key={file.id}
          onClick={(e) => handleFileClick(file.id, e)}
          onContextMenu={(e) => handleFileRightClick(file.id, e)}
          onMouseEnter={() => setHoveredFileId(file.id)}
          onMouseLeave={() => setHoveredFileId(null)}
          style={{
            ...buildFileChannelListRowStyle(theme, hoveredFileId === file.id),
            border: isSelected ? `1px solid ${tc.accent.primary}` : '1px solid transparent',
            backgroundColor: isSelected ? `${tc.accent.primary}10` : hoveredFileId === file.id ? tc.background.raised : 'transparent',
          }}
          role="button"
          tabIndex={0}
          aria-label={file.name}
          aria-selected={isSelected}
        >
          <span style={{ fontSize: 18 }}>{getFileIcon(file.mimeType)}</span>
          <span style={{
            flex: 1,
            fontSize: theme.typography.sizes.sm.fontSize,
            fontWeight: theme.typography.weights.medium,
            color: tc.text.primary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {file.name}
          </span>
          <span style={{
            fontSize: theme.typography.sizes.xs.fontSize,
            color: tc.text.muted,
            flexShrink: 0,
            minWidth: 70,
          }}>
            {formatSize(file.size)}
          </span>
          <span style={{
            fontSize: theme.typography.sizes.xs.fontSize,
            color: tc.text.muted,
            flexShrink: 0,
            minWidth: 100,
          }}>
            {file.uploadedAt}
          </span>
          <span style={{
            fontSize: theme.typography.sizes.xs.fontSize,
            color: tc.text.muted,
            flexShrink: 0,
            minWidth: 80,
            textAlign: 'right',
          }}>
            {file.uploadedBy}
          </span>
        </div>
      );

      if (onItemMove) {
        return (
          <DraggableFileCard key={file.id} file={file}>
            {card}
          </DraggableFileCard>
        );
      }
      return card;
    };

    const renderSubfolderCard = (folder: FileFolder) => {
      const card = (
        <DroppableFolderTarget key={folder.id} folderId={folder.id}>
          {(isDropOver) => (
            <FolderCard
              name={folder.name}
              fileCount={folder.fileCount}
              onClick={() => handleFolderItemClick(folder.id)}
              onDoubleClick={() => onFolderClick?.(folder.id)}
              onContextMenu={(e: React.MouseEvent) => handleFolderRightClick(folder.id, e)}
              selected={selectedFolderIds?.has(folder.id) ?? false}
              dropTarget={isDropOver}
            />
          )}
        </DroppableFolderTarget>
      );

      if (onItemMove) {
        return (
          <DraggableFolderCard key={folder.id} folder={folder}>
            {card}
          </DraggableFolderCard>
        );
      }
      return card;
    };

    const renderListHeader = () => {
      if (viewMode !== 'list') return null;

      const sortBtn = (field: FileSortField, label: string, extraStyle?: React.CSSProperties) => (
        <button
          type="button"
          onClick={() => handleSortClick(field)}
          style={{
            border: 'none',
            background: 'none',
            cursor: onSortChange ? 'pointer' : 'default',
            color: sortBy === field ? tc.accent.primary : tc.text.muted,
            fontWeight: sortBy === field ? theme.typography.weights.semibold : theme.typography.weights.regular,
            fontSize: 'inherit',
            fontFamily: 'inherit',
            letterSpacing: 'inherit',
            textTransform: 'inherit' as const,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            padding: 0,
            ...extraStyle,
          }}
        >
          {label}
          {sortBy === field && <SortArrow direction={sortDirection ?? null} />}
        </button>
      );

      return (
        <div style={listHeaderStyle}>
          <span style={{ width: 18 }} />
          <span style={{ flex: 1 }}>{sortBtn('name', 'Name')}</span>
          <span style={{ minWidth: 70 }}>{sortBtn('size', 'Size')}</span>
          <span style={{ minWidth: 100 }}>{sortBtn('date', 'Date')}</span>
          <span style={{ minWidth: 80, textAlign: 'right' }}>{sortBtn('type', 'Uploader')}</span>
        </div>
      );
    };

    // ---- Main content area ----

    const mainContent = (
      <div style={contentStyle}>
        {/* Toolbar */}
        <div style={toolbarStyle} role="toolbar" aria-label="File actions">
          <div style={breadcrumbAreaStyle}>
            {breadcrumbPath && breadcrumbPath.length > 0 ? (
              <nav
                aria-label="Breadcrumb"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing['2xs'],
                  fontSize: theme.typography.sizes.sm.fontSize,
                }}
              >
                <button
                  type="button"
                  onClick={() => onBreadcrumbClick?.(null)}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: tc.text.secondary,
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    padding: 0,
                  }}
                >
                  Root
                </button>
                {breadcrumbPath.map((seg) => (
                  <React.Fragment key={seg.id}>
                    <span style={{ color: tc.text.muted }}>/</span>
                    <button
                      type="button"
                      onClick={() => onBreadcrumbClick?.(seg.id)}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: tc.text.primary,
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        fontWeight: theme.typography.weights.medium,
                        padding: 0,
                      }}
                    >
                      {seg.name}
                    </button>
                  </React.Fragment>
                ))}
              </nav>
            ) : (
              <span style={{ fontSize: theme.typography.sizes.sm.fontSize, color: tc.text.primary }}>
                All Files
              </span>
            )}
          </div>

          <div style={actionsStyle}>
            <div style={viewToggleStyle}>
              <button
                type="button"
                style={viewToggleBtnStyle(viewMode === 'grid')}
                onClick={() => onViewModeChange?.('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
              >
                Grid
              </button>
              <button
                type="button"
                style={viewToggleBtnStyle(viewMode === 'list')}
                onClick={() => onViewModeChange?.('list')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
              >
                List
              </button>
            </div>

            {onCreateFolder && (
              <button type="button" style={actionBtnStyle} onClick={onCreateFolder}>
                New Folder
              </button>
            )}

            {onUploadClick && (
              <button type="button" style={uploadBtnStyle} onClick={onUploadClick}>
                Upload
              </button>
            )}
          </div>
        </div>

        {/* File area */}
        {loading ? (
          <div style={emptyStyle}>
            <span>Loading...</span>
          </div>
        ) : !hasContent ? (
          <div style={emptyStyle}>
            <span style={{ fontSize: 32 }}>{'\u{1F4C2}'}</span>
            <span>{emptyText}</span>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={gridStyle}>
            {subfolders.map(renderSubfolderCard)}
            {files.map(renderFileCard)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {renderListHeader()}
            <div style={listStyle}>
              {subfolders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => handleFolderItemClick(folder.id)}
                  onDoubleClick={() => onFolderClick?.(folder.id)}
                  onContextMenu={(e) => handleFolderRightClick(folder.id, e)}
                  onMouseEnter={() => setHoveredFolderId(folder.id)}
                  onMouseLeave={() => setHoveredFolderId(null)}
                  style={{
                    ...buildFileChannelListRowStyle(theme, hoveredFolderId === folder.id),
                    border: selectedFolderIds?.has(folder.id) ? `1px solid ${tc.accent.primary}` : '1px solid transparent',
                    backgroundColor: selectedFolderIds?.has(folder.id) ? `${tc.accent.primary}10` : hoveredFolderId === folder.id ? tc.background.raised : 'transparent',
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Folder: ${folder.name}`}
                >
                  <span style={{ fontSize: 18 }}>{'\u{1F4C1}'}</span>
                  <span style={{
                    flex: 1,
                    fontSize: theme.typography.sizes.sm.fontSize,
                    fontWeight: theme.typography.weights.medium,
                    color: tc.text.primary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {folder.name}
                  </span>
                  <span style={{ fontSize: theme.typography.sizes.xs.fontSize, color: tc.text.muted, flexShrink: 0, minWidth: 70 }}>
                    {folder.fileCount != null ? `${folder.fileCount} files` : '\u2014'}
                  </span>
                  <span style={{ fontSize: theme.typography.sizes.xs.fontSize, color: tc.text.muted, flexShrink: 0, minWidth: 100 }}>
                    {folder.createdAt ?? '\u2014'}
                  </span>
                  <span style={{ fontSize: theme.typography.sizes.xs.fontSize, color: tc.text.muted, flexShrink: 0, minWidth: 80, textAlign: 'right' }}>
                    {folder.createdBy ?? '\u2014'}
                  </span>
                </div>
              ))}
              {files.map(renderFileCard)}
            </div>
          </div>
        )}
      </div>
    );

    // Wrap in FileUploadZone if drag-drop handler provided
    const wrappedContent = onFileDrop ? (
      <FileUploadZone
        onFileDrop={handleFileDrop}
        onFileSelect={handleFileInputSelect}
        uploading={uploading}
        uploadProgress={uploadProgress}
        currentFileName={currentUploadFileName}
        accept={acceptMimeTypes}
      >
        {mainContent}
      </FileUploadZone>
    ) : (
      mainContent
    );

    return (
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={ref}
          className={className}
          style={{ ...rootStyle, ...userStyle }}
          data-testid="file-channel-view"
          {...rest}
        >
          {/* Sidebar */}
          <div style={sidebarStyle} role="navigation" aria-label="Folder tree">
            <div
              style={{
                fontSize: theme.typography.sizes.xs.fontSize,
                fontWeight: theme.typography.weights.semibold,
                color: tc.text.muted,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: theme.spacing.sm,
              }}
            >
              Folders
            </div>
            {folders.map((folder) => (
              <FolderTreeItem
                key={folder.id}
                folder={folder}
                currentFolderId={currentFolderId}
                onFolderClick={onFolderClick}
              />
            ))}
          </div>

          {/* Main content + optional upload zone */}
          {wrappedContent}

          {/* Detail panel */}
          {showDetailPanel && detailFile && (
            <FileDetailPanel
              file={detailFile}
              onClose={() => onDetailPanelClose?.()}
              onDownload={onFileDownload ? () => onFileDownload(detailFile.id) : undefined}
              onRename={onFileRename ? (newName) => onFileRename(detailFile.id, newName) : undefined}
              onDelete={onFileDelete ? () => onFileDelete([detailFile.id]) : undefined}
              open
            />
          )}
        </div>

        {/* dnd-kit drag overlay */}
        <DragOverlay>
          {dragOverlayContent}
        </DragOverlay>

        {/* Built-in context menus (shown if no external handlers provided) */}
        {!onFileContextMenu && (
          <FileContextMenu
            open={fileMenuState.open}
            position={{ x: fileMenuState.x, y: fileMenuState.y }}
            onClose={() => setFileMenuState((s) => ({ ...s, open: false }))}
            onDownload={onFileDownload ? () => { onFileDownload(fileMenuState.fileId); setFileMenuState((s) => ({ ...s, open: false })); } : undefined}
            onRename={onFileRename ? () => {
              const newName = window.prompt('Rename file:', files.find((f) => f.id === fileMenuState.fileId)?.name);
              if (newName) onFileRename(fileMenuState.fileId, newName);
              setFileMenuState((s) => ({ ...s, open: false }));
            } : undefined}
            onDetails={onFileSelect ? () => { onFileSelect(fileMenuState.fileId); setFileMenuState((s) => ({ ...s, open: false })); } : undefined}
            onDelete={onFileDelete ? () => {
              const selected = selectedFileIds && selectedFileIds.size > 0 ? Array.from(selectedFileIds) : [fileMenuState.fileId];
              onFileDelete(selected);
              setFileMenuState((s) => ({ ...s, open: false }));
            } : undefined}
            multiSelect={selectedFileIds ? selectedFileIds.size > 1 : false}
            selectedCount={selectedFileIds?.size}
          />
        )}

        {!onFolderContextMenu && (
          <FolderContextMenu
            open={folderMenuState.open}
            position={{ x: folderMenuState.x, y: folderMenuState.y }}
            onClose={() => setFolderMenuState((s) => ({ ...s, open: false }))}
            onOpen={() => { onFolderClick?.(folderMenuState.folderId); setFolderMenuState((s) => ({ ...s, open: false })); }}
            onRename={onFolderRename ? () => {
              const folder = [...folders, ...subfolders].find((f) => f.id === folderMenuState.folderId);
              const newName = window.prompt('Rename folder:', folder?.name);
              if (newName) onFolderRename(folderMenuState.folderId, newName);
              setFolderMenuState((s) => ({ ...s, open: false }));
            } : undefined}
            onDelete={onFolderDelete ? () => { onFolderDelete(folderMenuState.folderId); setFolderMenuState((s) => ({ ...s, open: false })); } : undefined}
          />
        )}
      </DndContext>
    );
  },
);

FileChannelView.displayName = 'FileChannelView';
