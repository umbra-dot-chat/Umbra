/**
 * @module components/file-upload-zone
 * @description FileUploadZone for the Wisp design system.
 *
 * Wraps content as a drag-and-drop target for file uploads. Shows overlay
 * when files are dragged over, and a progress bar during uploads.
 */

import React, { forwardRef, useCallback, useRef, useState, useMemo } from 'react';
import type { FileUploadZoneProps } from '@coexist/wisp-core/types/FileUploadZone.types';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Upload icon
// ---------------------------------------------------------------------------

function UploadCloudIcon({ size = 48, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
      <polyline points="16 16 12 12 8 16" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// FileUploadZone
// ---------------------------------------------------------------------------

export const FileUploadZone = forwardRef<HTMLDivElement, FileUploadZoneProps>(
  function FileUploadZone(
    {
      onFileDrop,
      onFileSelect,
      uploading = false,
      uploadProgress,
      currentFileName,
      accept,
      maxSize,
      children,
      disabled = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const { colors, spacing, radii, typography } = theme;
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Drag event handlers
    const handleDragEnter = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setDragOver(true);
      },
      [disabled],
    );

    const handleDragLeave = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set false if leaving the container (not entering a child)
        if (e.currentTarget === e.target) {
          setDragOver(false);
        }
      },
      [],
    );

    const handleDragOver = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
      },
      [],
    );

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        if (disabled) return;

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0 && onFileDrop) {
          onFileDrop(files);
        }
      },
      [disabled, onFileDrop],
    );

    const handleFileInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length > 0 && onFileSelect) {
          onFileSelect(files);
        }
        // Reset the input so the same file can be selected again
        if (inputRef.current) inputRef.current.value = '';
      },
      [onFileSelect],
    );

    // Styles
    const containerStyle = useMemo<React.CSSProperties>(
      () => ({
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }),
      [],
    );

    const overlayStyle = useMemo<React.CSSProperties>(
      () => ({
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        backgroundColor: `${colors.accent.primary}15`,
        border: `2px dashed ${colors.accent.primary}`,
        borderRadius: radii.md,
        pointerEvents: 'none',
        transition: 'opacity 150ms ease',
        opacity: dragOver ? 1 : 0,
      }),
      [colors, spacing, radii, dragOver],
    );

    const overlayLabelStyle = useMemo<React.CSSProperties>(
      () => ({
        fontSize: typography.sizes.lg.fontSize,
        fontWeight: typography.weights.semibold,
        color: colors.accent.primary,
      }),
      [colors, typography],
    );

    const overlaySubStyle = useMemo<React.CSSProperties>(
      () => ({
        fontSize: typography.sizes.sm.fontSize,
        color: colors.text.muted,
      }),
      [colors, typography],
    );

    const progressBarContainerStyle = useMemo<React.CSSProperties>(
      () => ({
        display: uploading ? 'flex' : 'none',
        alignItems: 'center',
        gap: spacing.sm,
        padding: `${spacing.sm}px ${spacing.md}px`,
        backgroundColor: colors.background.surface,
        borderTop: `1px solid ${colors.border.subtle}`,
      }),
      [uploading, colors, spacing],
    );

    const progressBarTrackStyle = useMemo<React.CSSProperties>(
      () => ({
        flex: 1,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.border.subtle,
        overflow: 'hidden',
      }),
      [colors],
    );

    const progressBarFillStyle = useMemo<React.CSSProperties>(
      () => ({
        height: '100%',
        borderRadius: 3,
        backgroundColor: colors.accent.primary,
        width: `${uploadProgress ?? 0}%`,
        transition: 'width 200ms ease',
      }),
      [colors, uploadProgress],
    );

    const progressLabelStyle = useMemo<React.CSSProperties>(
      () => ({
        fontSize: typography.sizes.xs.fontSize,
        color: colors.text.muted,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: 200,
      }),
      [colors, typography],
    );

    return (
      <div
        ref={ref}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-testid="file-upload-zone"
        {...rest}
      >
        {/* Drop overlay */}
        <div style={overlayStyle}>
          <UploadCloudIcon size={48} color={colors.accent.primary} />
          <span style={overlayLabelStyle}>Drop files here</span>
          <span style={overlaySubStyle}>Files will be uploaded to this channel</span>
        </div>

        {/* Main content */}
        {children}

        {/* Upload progress bar */}
        <div style={progressBarContainerStyle}>
          {currentFileName && (
            <span style={progressLabelStyle} title={currentFileName}>{currentFileName}</span>
          )}
          <div style={progressBarTrackStyle}>
            <div style={progressBarFillStyle} />
          </div>
          <span style={{ ...progressLabelStyle, maxWidth: 'none' }}>
            {uploadProgress !== undefined ? `${Math.round(uploadProgress)}%` : ''}
          </span>
        </div>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
          data-testid="file-upload-input"
        />
      </div>
    );
  },
);

FileUploadZone.displayName = 'FileUploadZone';
