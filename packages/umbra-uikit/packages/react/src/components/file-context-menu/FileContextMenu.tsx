/**
 * @module components/file-context-menu
 * @description Context menus for file and folder operations.
 *
 * Composes from the base ContextMenu compound component to provide
 * file-specific and folder-specific right-click menus.
 */

import React, { useEffect, useRef } from 'react';
import type { FileContextMenuProps, FolderContextMenuProps } from '@coexist/wisp-core/types/FileContextMenu.types';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// SVG Icons for menu items
// ---------------------------------------------------------------------------

function DownloadIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function PenIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function MoveIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

function LinkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

function InfoIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function TrashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

function FolderOpenIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v1H7.5a2 2 0 00-1.8 1.1L2 18V6z" />
      <path d="M5.7 11.1A2 2 0 017.5 10H22l-3.3 8.1a2 2 0 01-1.8 1.1H2l3.7-8z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

interface MenuStyles {
  overlay: React.CSSProperties;
  menu: React.CSSProperties;
  item: React.CSSProperties;
  itemHover: React.CSSProperties;
  destructiveItem: React.CSSProperties;
  separator: React.CSSProperties;
  icon: React.CSSProperties;
}

function useMenuStyles(): MenuStyles {
  const { theme } = useTheme();
  const { colors, spacing, radii, typography, shadows } = theme;

  return {
    overlay: {
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
    },
    menu: {
      position: 'fixed',
      zIndex: 1001,
      minWidth: 180,
      backgroundColor: colors.background.surface,
      border: `1px solid ${colors.border.subtle}`,
      borderRadius: radii.md,
      boxShadow: shadows.lg,
      padding: `${spacing['2xs']}px 0`,
      overflow: 'hidden',
    },
    item: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      padding: `${spacing.xs}px ${spacing.sm}px`,
      fontSize: typography.sizes.sm.fontSize,
      color: colors.text.primary,
      cursor: 'pointer',
      border: 'none',
      backgroundColor: 'transparent',
      width: '100%',
      textAlign: 'left',
    },
    itemHover: {
      backgroundColor: colors.background.raised,
    },
    destructiveItem: {
      color: colors.status.danger,
    },
    separator: {
      height: 1,
      backgroundColor: colors.border.subtle,
      margin: `${spacing['2xs']}px 0`,
    },
    icon: {
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Menu item helper
// ---------------------------------------------------------------------------

function MenuItem({
  icon,
  label,
  onClick,
  destructive,
  styles,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  destructive?: boolean;
  styles: MenuStyles;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      type="button"
      style={{
        ...styles.item,
        ...(hovered ? styles.itemHover : {}),
        ...(destructive ? styles.destructiveItem : {}),
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={styles.icon}>{icon}</span>
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// FileContextMenu
// ---------------------------------------------------------------------------

/**
 * FileContextMenu — Right-click menu for file operations.
 *
 * @example
 * ```tsx
 * <FileContextMenu
 *   open={menuOpen}
 *   position={menuPosition}
 *   onClose={() => setMenuOpen(false)}
 *   onDownload={() => downloadFile(fileId)}
 *   onRename={() => startRename(fileId)}
 *   onDelete={() => deleteFile(fileId)}
 * />
 * ```
 */
export function FileContextMenu({
  open,
  position,
  onClose,
  onDownload,
  onRename,
  onMove,
  onCopyLink,
  onDetails,
  onDelete,
  multiSelect = false,
  selectedCount,
}: FileContextMenuProps) {
  const styles = useMenuStyles();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleAction = (action?: () => void) => {
    action?.();
    onClose();
  };

  const label = multiSelect && selectedCount
    ? `${selectedCount} files`
    : '';

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <div
        ref={menuRef}
        style={{ ...styles.menu, left: position.x, top: position.y }}
        role="menu"
        data-testid="file-context-menu"
      >
        {onDownload && (
          <MenuItem
            icon={<DownloadIcon />}
            label={multiSelect ? `Download ${label}` : 'Download'}
            onClick={() => handleAction(onDownload)}
            styles={styles}
          />
        )}
        {onRename && !multiSelect && (
          <MenuItem
            icon={<PenIcon />}
            label="Rename"
            onClick={() => handleAction(onRename)}
            styles={styles}
          />
        )}
        {onMove && (
          <MenuItem
            icon={<MoveIcon />}
            label="Move to..."
            onClick={() => handleAction(onMove)}
            styles={styles}
          />
        )}
        {onCopyLink && !multiSelect && (
          <MenuItem
            icon={<LinkIcon />}
            label="Copy Link"
            onClick={() => handleAction(onCopyLink)}
            styles={styles}
          />
        )}
        {(onDownload || onRename || onMove || onCopyLink) && (onDetails || onDelete) && (
          <div style={styles.separator} role="separator" />
        )}
        {onDetails && !multiSelect && (
          <MenuItem
            icon={<InfoIcon />}
            label="Details"
            onClick={() => handleAction(onDetails)}
            styles={styles}
          />
        )}
        {onDetails && onDelete && !multiSelect && (
          <div style={styles.separator} role="separator" />
        )}
        {onDelete && (
          <MenuItem
            icon={<TrashIcon />}
            label={multiSelect ? `Delete ${label}` : 'Delete'}
            onClick={() => handleAction(onDelete)}
            destructive
            styles={styles}
          />
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// FolderContextMenu
// ---------------------------------------------------------------------------

/**
 * FolderContextMenu — Right-click menu for folder operations.
 *
 * @example
 * ```tsx
 * <FolderContextMenu
 *   open={menuOpen}
 *   position={menuPosition}
 *   onClose={() => setMenuOpen(false)}
 *   onOpen={() => navigateInto(folderId)}
 *   onRename={() => startRename(folderId)}
 *   onDelete={() => deleteFolder(folderId)}
 * />
 * ```
 */
export function FolderContextMenu({
  open,
  position,
  onClose,
  onOpen,
  onRename,
  onMove,
  onDelete,
}: FolderContextMenuProps) {
  const styles = useMenuStyles();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleAction = (action?: () => void) => {
    action?.();
    onClose();
  };

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <div
        ref={menuRef}
        style={{ ...styles.menu, left: position.x, top: position.y }}
        role="menu"
        data-testid="folder-context-menu"
      >
        {onOpen && (
          <MenuItem
            icon={<FolderOpenIcon />}
            label="Open"
            onClick={() => handleAction(onOpen)}
            styles={styles}
          />
        )}
        {onRename && (
          <MenuItem
            icon={<PenIcon />}
            label="Rename"
            onClick={() => handleAction(onRename)}
            styles={styles}
          />
        )}
        {onMove && (
          <MenuItem
            icon={<MoveIcon />}
            label="Move to..."
            onClick={() => handleAction(onMove)}
            styles={styles}
          />
        )}
        {(onOpen || onRename || onMove) && onDelete && (
          <div style={styles.separator} role="separator" />
        )}
        {onDelete && (
          <MenuItem
            icon={<TrashIcon />}
            label="Delete"
            onClick={() => handleAction(onDelete)}
            destructive
            styles={styles}
          />
        )}
      </div>
    </>
  );
}

FileContextMenu.displayName = 'FileContextMenu';
FolderContextMenu.displayName = 'FolderContextMenu';
