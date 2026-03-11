/**
 * @module AttachmentPreview
 * @description Horizontal scrollable row of queued file preview cards
 * displayed above the message input area.
 */
import React, { forwardRef, useMemo, useCallback } from 'react';
import type { AttachmentPreviewProps, Attachment, AttachmentFileType } from '@coexist/wisp-core/types/AttachmentPreview.types';
import {
  resolveAttachmentPreviewColors,
  buildAttachmentContainerStyle,
  buildAttachmentCardStyle,
  buildThumbnailStyle,
  buildFileIconAreaStyle,
  buildFileInfoStyle,
  buildFileNameStyle,
  buildFileSizeStyle,
  buildRemoveButtonStyle,
  buildProgressBarContainerStyle,
  buildProgressBarFillStyle,
  buildErrorOverlayStyle,
} from '@coexist/wisp-core/styles/AttachmentPreview.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value % 1 === 0 ? value : value.toFixed(1)} ${units[i]}`;
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function CloseIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function FileIcon({ size = 24, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

function ImageIcon({ size = 24, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function VideoIcon({ size = 24, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.934a.5.5 0 0 0-.777-.416L16 11" />
      <rect width="14" height="12" x="2" y="6" rx="2" />
    </svg>
  );
}

function AudioIcon({ size = 24, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function ArchiveIcon({ size = 24, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="5" x="2" y="3" rx="1" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Icon resolver
// ---------------------------------------------------------------------------

function getFileTypeIcon(fileType: AttachmentFileType, color: string) {
  switch (fileType) {
    case 'image':
      return <ImageIcon size={24} color={color} />;
    case 'video':
      return <VideoIcon size={24} color={color} />;
    case 'audio':
      return <AudioIcon size={24} color={color} />;
    case 'archive':
      return <ArchiveIcon size={24} color={color} />;
    case 'document':
    case 'other':
    default:
      return <FileIcon size={24} color={color} />;
  }
}

// ---------------------------------------------------------------------------
// AttachmentPreview
// ---------------------------------------------------------------------------

/**
 * AttachmentPreview -- Horizontal scrollable row of queued file preview cards.
 *
 * @remarks
 * Each card shows a thumbnail (for images with thumbnailUrl) or a file type
 * icon, the file name, formatted size, an optional progress bar, error state,
 * and a remove button. Cards are horizontally scrollable.
 *
 * @example
 * ```tsx
 * <AttachmentPreview
 *   attachments={queuedFiles}
 *   onRemove={(id) => removeAttachment(id)}
 *   onPreview={(attachment) => openPreview(attachment)}
 * />
 * ```
 */
export const AttachmentPreview = forwardRef<HTMLDivElement, AttachmentPreviewProps>(
  function AttachmentPreview(
    {
      attachments,
      onRemove,
      onPreview,
      disabled = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    // -- Colors ---------------------------------------------------------------

    const colors = useMemo(
      () => resolveAttachmentPreviewColors(theme),
      [theme],
    );

    // -- Styles ---------------------------------------------------------------

    const containerStyle = useMemo(
      () => buildAttachmentContainerStyle(theme),
      [theme],
    );

    const thumbnailStyle = useMemo(
      () => buildThumbnailStyle(theme),
      [theme],
    );

    const iconAreaStyle = useMemo(
      () => buildFileIconAreaStyle(colors, theme),
      [colors, theme],
    );

    const fileInfoStyle = useMemo(
      () => buildFileInfoStyle(theme),
      [theme],
    );

    const fileNameStyle = useMemo(
      () => buildFileNameStyle(colors, theme),
      [colors, theme],
    );

    const fileSizeStyle = useMemo(
      () => buildFileSizeStyle(colors, theme),
      [colors, theme],
    );

    const removeBtnStyle = useMemo(
      () => buildRemoveButtonStyle(colors, theme),
      [colors, theme],
    );

    const progressContainerStyle = useMemo(
      () => buildProgressBarContainerStyle(theme),
      [theme],
    );

    // -- Callbacks ------------------------------------------------------------

    const handleRemove = useCallback(
      (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!disabled) onRemove?.(id);
      },
      [onRemove, disabled],
    );

    const handlePreview = useCallback(
      (attachment: Attachment) => {
        if (!disabled) onPreview?.(attachment);
      },
      [onPreview, disabled],
    );

    // -- Render ---------------------------------------------------------------

    const disabledStyle: React.CSSProperties = disabled
      ? { opacity: 0.5, pointerEvents: 'none' as const }
      : {};

    return (
      <div
        ref={ref}
        aria-label="Attachment previews"
        className={className}
        style={{ ...containerStyle, ...disabledStyle, ...userStyle }}
        {...rest}
      >
        {attachments.map((attachment) => {
          const hasError = attachment.error === true;
          const showProgress =
            attachment.progress !== undefined && attachment.progress < 100;

          const cardStyle = buildAttachmentCardStyle(colors, hasError, theme);

          return (
            <div
              key={attachment.id}
              role="button"
              tabIndex={disabled ? -1 : 0}
              style={cardStyle}
              onClick={() => handlePreview(attachment)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePreview(attachment);
                }
              }}
            >
              {/* Thumbnail or file icon area */}
              {attachment.fileType === 'image' && attachment.thumbnailUrl ? (
                <img
                  src={attachment.thumbnailUrl}
                  alt={attachment.fileName}
                  style={thumbnailStyle}
                />
              ) : (
                <div style={iconAreaStyle}>
                  {getFileTypeIcon(attachment.fileType, colors.textSecondary)}
                </div>
              )}

              {/* File info */}
              <div style={fileInfoStyle}>
                <span style={fileNameStyle} title={attachment.fileName}>
                  {attachment.fileName}
                </span>
                <span style={fileSizeStyle}>
                  {formatFileSize(attachment.fileSize)}
                </span>
              </div>

              {/* Remove button */}
              {onRemove && (
                <button
                  type="button"
                  aria-label={`Remove ${attachment.fileName}`}
                  style={removeBtnStyle}
                  onClick={(e) => handleRemove(e, attachment.id)}
                  tabIndex={disabled ? -1 : 0}
                >
                  <CloseIcon size={12} />
                </button>
              )}

              {/* Progress bar */}
              {showProgress && (
                <div style={progressContainerStyle}>
                  <div
                    style={buildProgressBarFillStyle(
                      colors,
                      attachment.progress!,
                      theme,
                    )}
                  />
                </div>
              )}

              {/* Error overlay */}
              {hasError && (
                <div style={buildErrorOverlayStyle(colors, theme)} />
              )}
            </div>
          );
        })}
      </div>
    );
  },
);

AttachmentPreview.displayName = 'AttachmentPreview';
