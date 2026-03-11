/**
 * @module FileUploadDialog
 */
import React, { forwardRef, useMemo, useCallback, useRef, useState } from 'react';
import type {
  FileUploadDialogProps,
  UploadingFile,
} from '@coexist/wisp-core/types/FileUploadDialog.types';
import {
  buildUploadDialogBodyStyle,
  buildUploadDialogFolderLabelStyle,
  buildUploadFileListStyle,
  buildUploadFileRowStyle,
  buildUploadFileRowHeaderStyle,
  buildUploadFileInfoStyle,
  buildUploadFileNameStyle,
  buildUploadFileSizeStyle,
  buildUploadFileActionsStyle,
  buildUploadFileErrorStyle,
  buildUploadDialogFooterStyle,
} from '@coexist/wisp-core/styles/FileUploadDialog.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function getStatusColor(status: UploadingFile['status'], tc: any): string {
  switch (status) {
    case 'complete':
      return tc.status.success;
    case 'error':
      return tc.status.error;
    case 'uploading':
      return tc.accent.primary;
    default:
      return tc.text.muted;
  }
}

function getStatusLabel(status: UploadingFile['status']): string {
  switch (status) {
    case 'complete':
      return 'Complete';
    case 'error':
      return 'Failed';
    case 'uploading':
      return 'Uploading';
    default:
      return 'Pending';
  }
}

// ---------------------------------------------------------------------------
// FileUploadDialog
// ---------------------------------------------------------------------------

/**
 * FileUploadDialog -- Upload dialog with drag-and-drop, progress, and upload status.
 *
 * @remarks
 * Shows a dialog overlay with a dropzone area, list of uploading files with
 * individual progress bars, cancel/retry buttons per file, and overall upload status.
 *
 * @example
 * ```tsx
 * <FileUploadDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onFilesSelected={(files) => startUpload(files)}
 *   uploadingFiles={uploadQueue}
 * />
 * ```
 */
export const FileUploadDialog = forwardRef<HTMLDivElement, FileUploadDialogProps>(
  function FileUploadDialog(
    {
      open,
      onClose,
      onFilesSelected,
      uploadingFiles = [],
      onCancelUpload,
      onRetryUpload,
      accept,
      maxSize,
      multiple = true,
      title = 'Upload Files',
      targetFolderName,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const tc = theme.colors;
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const bodyStyle = useMemo(() => buildUploadDialogBodyStyle(theme), [theme]);
    const folderLabelStyle = useMemo(() => buildUploadDialogFolderLabelStyle(theme), [theme]);
    const fileListStyle = useMemo(() => buildUploadFileListStyle(theme), [theme]);
    const fileRowStyle = useMemo(() => buildUploadFileRowStyle(theme), [theme]);
    const fileRowHeaderStyle = useMemo(() => buildUploadFileRowHeaderStyle(theme), [theme]);
    const fileInfoStyle = useMemo(() => buildUploadFileInfoStyle(theme), [theme]);
    const fileNameStyle = useMemo(() => buildUploadFileNameStyle(theme), [theme]);
    const fileSizeStyle = useMemo(() => buildUploadFileSizeStyle(theme), [theme]);
    const fileActionsStyle = useMemo(() => buildUploadFileActionsStyle(theme), [theme]);
    const fileErrorStyle = useMemo(() => buildUploadFileErrorStyle(theme), [theme]);
    const footerStyle = useMemo(() => buildUploadDialogFooterStyle(theme), [theme]);

    const overlayStyle = useMemo(
      () => ({
        position: 'fixed' as const,
        inset: 0,
        display: open ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
      }),
      [open],
    );

    const dialogStyle = useMemo(
      () => ({
        backgroundColor: tc.background.surface,
        borderRadius: theme.radii.xl,
        border: `1px solid ${tc.border.subtle}`,
        boxShadow: theme.shadows.lg,
        width: '100%',
        maxWidth: 520,
        padding: theme.spacing.lg,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: theme.spacing.md,
        fontFamily: 'inherit',
        boxSizing: 'border-box' as const,
      }),
      [theme, tc],
    );

    const dropzoneStyle = useMemo(
      () => ({
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        padding: `${theme.spacing.xl}px`,
        borderRadius: theme.radii.lg,
        border: `2px dashed ${isDragOver ? tc.accent.primary : tc.border.strong}`,
        backgroundColor: isDragOver ? tc.accent.highlight : 'transparent',
        cursor: 'pointer',
        textAlign: 'center' as const,
        transition: 'border-color 150ms ease-out, background-color 150ms ease-out',
      }),
      [theme, tc, isDragOver],
    );

    const progressBarBgStyle = useMemo(
      () => ({
        width: '100%',
        height: 4,
        borderRadius: theme.radii.full,
        backgroundColor: tc.border.subtle,
        overflow: 'hidden' as const,
      }),
      [theme, tc],
    );

    const smallBtnStyle = useMemo(
      () => ({
        padding: `${theme.spacing['2xs']}px ${theme.spacing.xs}px`,
        border: `1px solid ${tc.border.subtle}`,
        borderRadius: theme.radii.sm,
        backgroundColor: 'transparent',
        color: tc.text.secondary,
        cursor: 'pointer' as const,
        fontSize: theme.typography.sizes.xs.fontSize,
        fontFamily: 'inherit',
      }),
      [theme, tc],
    );

    const processFiles = useCallback(
      (fileList: FileList | null) => {
        if (!fileList) return;
        const files = Array.from(fileList);
        if (files.length > 0) {
          onFilesSelected?.(files);
        }
      },
      [onFilesSelected],
    );

    const handleDragOver = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
      },
      [],
    );

    const handleDragLeave = useCallback(() => {
      setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        processFiles(e.dataTransfer.files);
      },
      [processFiles],
    );

    const handleBrowseClick = useCallback(() => {
      inputRef.current?.click();
    }, []);

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        processFiles(e.target.files);
        if (inputRef.current) inputRef.current.value = '';
      },
      [processFiles],
    );

    const handleOverlayClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
      },
      [onClose],
    );

    const completedCount = uploadingFiles.filter((f) => f.status === 'complete').length;
    const totalCount = uploadingFiles.length;

    if (!open) return null;

    return (
      <div
        style={overlayStyle}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          ref={ref}
          className={className}
          style={{ ...dialogStyle, ...userStyle }}
          data-testid="file-upload-dialog"
          {...rest}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2
              style={{
                fontSize: theme.typography.sizes.lg.fontSize,
                fontWeight: theme.typography.weights.semibold,
                color: tc.text.primary,
                margin: 0,
              }}
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: tc.text.muted,
                fontSize: 18,
                padding: 4,
                fontFamily: 'inherit',
              }}
              aria-label="Close"
            >
              {'\u2715'}
            </button>
          </div>

          {/* Body */}
          <div style={bodyStyle}>
            {/* Target folder label */}
            {targetFolderName && (
              <div style={folderLabelStyle}>
                <span>{'\u{1F4C1}'}</span>
                <span>Uploading to: {targetFolderName}</span>
              </div>
            )}

            {/* Dropzone */}
            <div
              style={dropzoneStyle}
              onClick={handleBrowseClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              aria-label="Drop files here or click to browse"
            >
              <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handleInputChange}
                style={{ display: 'none' }}
                tabIndex={-1}
              />
              <svg
                width={28}
                height={28}
                viewBox="0 0 24 24"
                fill="none"
                stroke={tc.text.muted}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <div style={{ fontSize: theme.typography.sizes.sm.fontSize, color: tc.text.primary }}>
                <span style={{ color: tc.accent.primary, fontWeight: theme.typography.weights.semibold }}>
                  Click to upload
                </span>
                {' '}or drag and drop
              </div>
              {(accept || maxSize) && (
                <div style={{ fontSize: theme.typography.sizes.xs.fontSize, color: tc.text.muted }}>
                  {[accept, maxSize && `up to ${(maxSize / 1024 / 1024).toFixed(0)}MB`]
                    .filter(Boolean)
                    .join(' \u00B7 ')}
                </div>
              )}
            </div>

            {/* Uploading files list */}
            {uploadingFiles.length > 0 && (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: theme.typography.sizes.xs.fontSize,
                    color: tc.text.muted,
                  }}
                >
                  <span>
                    {completedCount} of {totalCount} complete
                  </span>
                </div>
                <div style={fileListStyle}>
                  {uploadingFiles.map((file) => (
                    <div key={file.id} style={fileRowStyle}>
                      <div style={fileRowHeaderStyle}>
                        <div style={fileInfoStyle}>
                          <div style={fileNameStyle}>{file.name}</div>
                          <div style={fileSizeStyle}>
                            {formatSize(file.size)} \u00B7{' '}
                            <span style={{ color: getStatusColor(file.status, tc) }}>
                              {getStatusLabel(file.status)}
                            </span>
                          </div>
                        </div>
                        <div style={fileActionsStyle}>
                          {file.status === 'uploading' && onCancelUpload && (
                            <button
                              type="button"
                              style={smallBtnStyle}
                              onClick={() => onCancelUpload(file.id)}
                            >
                              Cancel
                            </button>
                          )}
                          {file.status === 'error' && onRetryUpload && (
                            <button
                              type="button"
                              style={smallBtnStyle}
                              onClick={() => onRetryUpload(file.id)}
                            >
                              Retry
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Progress bar */}
                      {(file.status === 'uploading' || file.status === 'pending') && (
                        <div style={progressBarBgStyle}>
                          <div
                            style={{
                              width: `${file.progress}%`,
                              height: '100%',
                              borderRadius: theme.radii.full,
                              backgroundColor: tc.accent.primary,
                              transition: 'width 200ms ease-out',
                            }}
                          />
                        </div>
                      )}
                      {/* Error message */}
                      {file.status === 'error' && file.error && (
                        <div style={fileErrorStyle}>{file.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div style={footerStyle}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
                border: `1px solid ${tc.border.subtle}`,
                borderRadius: theme.radii.md,
                backgroundColor: 'transparent',
                color: tc.text.primary,
                cursor: 'pointer',
                fontSize: theme.typography.sizes.sm.fontSize,
                fontFamily: 'inherit',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  },
);

FileUploadDialog.displayName = 'FileUploadDialog';
