/**
 * @module components/file-detail-panel
 * @description FileDetailPanel for the Wisp design system.
 *
 * Slide-out panel showing file details: thumbnail, name, size,
 * MIME type, uploader, date, download count, version, and action buttons.
 */

import React, { forwardRef, useState, useCallback } from 'react';
import type { FileDetailPanelProps } from '@coexist/wisp-core/types/FileDetailPanel.types';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function CloseIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function DownloadIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function TrashIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function getFileTypeEmoji(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '\u{1F5BC}\uFE0F';
  if (mimeType.startsWith('video/')) return '\u{1F3AC}';
  if (mimeType.startsWith('audio/')) return '\u{1F3B5}';
  if (mimeType.includes('pdf')) return '\u{1F4C4}';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '\u{1F4E6}';
  if (mimeType.includes('text') || mimeType.includes('document')) return '\u{1F4DD}';
  return '\u{1F4CE}';
}

// ---------------------------------------------------------------------------
// FileDetailPanel
// ---------------------------------------------------------------------------

export const FileDetailPanel = forwardRef<HTMLDivElement, FileDetailPanelProps>(
  function FileDetailPanel(
    {
      file,
      onClose,
      onDownload,
      onRename,
      onDelete,
      open = true,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const { colors, spacing, radii, typography } = theme;
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState(file.name);

    const handleRenameSubmit = useCallback(() => {
      if (editName.trim() && editName !== file.name) {
        onRename?.(editName.trim());
      }
      setEditing(false);
    }, [editName, file.name, onRename]);

    const handleRenameKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleRenameSubmit();
        if (e.key === 'Escape') {
          setEditName(file.name);
          setEditing(false);
        }
      },
      [handleRenameSubmit, file.name],
    );

    if (!open) return null;

    const panelStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      width: 320,
      height: '100%',
      backgroundColor: colors.background.surface,
      borderLeft: '1px solid ' + colors.border.subtle,
      overflow: 'hidden',
      ...userStyle,
    };

    const headerStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.sm + 'px ' + spacing.md + 'px',
      borderBottom: '1px solid ' + colors.border.subtle,
    };

    const previewStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 200,
      backgroundColor: colors.background.raised,
      borderBottom: '1px solid ' + colors.border.subtle,
      fontSize: 64,
    };

    const bodyStyle: React.CSSProperties = {
      flex: 1,
      overflow: 'auto',
      padding: spacing.md,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.md,
    };

    const labelStyle: React.CSSProperties = {
      fontSize: typography.sizes.xs.fontSize,
      fontWeight: typography.weights.semibold,
      color: colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    };

    const valueStyle: React.CSSProperties = {
      fontSize: typography.sizes.sm.fontSize,
      color: colors.text.primary,
    };

    const actionsStyle: React.CSSProperties = {
      display: 'flex',
      gap: spacing.sm,
      padding: spacing.md,
      borderTop: '1px solid ' + colors.border.subtle,
    };

    const btnBase: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      flex: 1,
      padding: spacing.xs + 'px ' + spacing.sm + 'px',
      borderRadius: radii.md,
      fontSize: typography.sizes.sm.fontSize,
      fontWeight: typography.weights.medium,
      cursor: 'pointer',
      border: 'none',
    };

    return (
      <div ref={ref} className={className} style={panelStyle} data-testid="file-detail-panel" {...rest}>
        {/* Header */}
        <div style={headerStyle}>
          <span style={{ fontSize: typography.sizes.sm.fontSize, fontWeight: typography.weights.semibold, color: colors.text.primary }}>
            File Details
          </span>
          <button
            type="button"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex', color: colors.text.muted }}
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={18} color={colors.text.muted} />
          </button>
        </div>

        {/* Preview */}
        <div style={previewStyle}>
          {file.thumbnail ? (
            <img src={file.thumbnail} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span>{getFileTypeEmoji(file.mimeType)}</span>
          )}
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          {/* File name (click to edit) */}
          <div>
            {editing ? (
              <input
                style={{
                  fontSize: typography.sizes.base.fontSize,
                  fontWeight: typography.weights.semibold,
                  color: colors.text.primary,
                  backgroundColor: colors.background.raised,
                  border: '1px solid ' + colors.accent.primary,
                  borderRadius: radii.sm,
                  padding: '2px ' + spacing.xs + 'px',
                  outline: 'none',
                  width: '100%',
                }}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={handleRenameKeyDown}
                autoFocus
              />
            ) : (
              <span
                style={{
                  fontSize: typography.sizes.base.fontSize,
                  fontWeight: typography.weights.semibold,
                  color: colors.text.primary,
                  wordBreak: 'break-word',
                  cursor: onRename ? 'pointer' : 'default',
                }}
                onClick={() => { if (onRename) { setEditName(file.name); setEditing(true); } }}
                title={onRename ? 'Click to rename' : undefined}
              >
                {file.name}
              </span>
            )}
          </div>

          <div><span style={labelStyle}>Size</span><div style={valueStyle}>{formatFileSize(file.size)}</div></div>
          <div><span style={labelStyle}>Type</span><div style={valueStyle}>{file.mimeType}</div></div>
          <div><span style={labelStyle}>Uploaded by</span><div style={valueStyle}>{file.uploadedBy}</div></div>
          <div><span style={labelStyle}>Uploaded</span><div style={valueStyle}>{file.uploadedAt}</div></div>
          {file.downloadCount !== undefined && (
            <div><span style={labelStyle}>Downloads</span><div style={valueStyle}>{file.downloadCount}</div></div>
          )}
          {file.version !== undefined && (
            <div><span style={labelStyle}>Version</span><div style={valueStyle}>v{file.version}</div></div>
          )}
        </div>

        {/* Actions */}
        <div style={actionsStyle}>
          {onDownload && (
            <button type="button" style={{ ...btnBase, backgroundColor: colors.accent.primary, color: '#fff' }} onClick={onDownload}>
              <DownloadIcon size={16} color="#fff" /> Download
            </button>
          )}
          {onDelete && (
            <button type="button" style={{ ...btnBase, backgroundColor: 'transparent', border: '1px solid ' + colors.status.danger, color: colors.status.danger }} onClick={onDelete}>
              <TrashIcon size={16} color={colors.status.danger} /> Delete
            </button>
          )}
        </div>
      </div>
    );
  },
);

FileDetailPanel.displayName = 'FileDetailPanel';
