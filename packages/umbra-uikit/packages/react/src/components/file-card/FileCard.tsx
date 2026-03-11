/**
 * @module FileCard
 */
import React, { forwardRef, useMemo, useState } from 'react';
import type { FileCardProps } from '@coexist/wisp-core/types/FileCard.types';
import {
  buildFileCardStyle,
  buildFileCardThumbnailStyle,
  buildFileCardThumbnailImageStyle,
  buildFileCardIconStyle,
  buildFileCardBodyStyle,
  buildFileCardNameStyle,
  buildFileCardMetaStyle,
  buildFileCardDownloadOverlayStyle,
  buildFileCardSkeletonStyle,
} from '@coexist/wisp-core/styles/FileCard.styles';
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

/**
 * Returns an SVG icon element based on the MIME type.
 */
function FileTypeIcon({ mimeType, color }: { mimeType: string; color: string }) {
  const size = 32;
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (mimeType.startsWith('image/')) {
    return (
      <svg {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }
  if (mimeType.startsWith('video/')) {
    return (
      <svg {...props}>
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
        <line x1="7" y1="2" x2="7" y2="22" />
        <line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="7" x2="7" y2="7" />
        <line x1="2" y1="17" x2="7" y2="17" />
        <line x1="17" y1="17" x2="22" y2="17" />
        <line x1="17" y1="7" x2="22" y2="7" />
      </svg>
    );
  }
  if (mimeType.startsWith('audio/')) {
    return (
      <svg {...props}>
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    );
  }
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('text') ||
    mimeType.includes('word')
  ) {
    return (
      <svg {...props}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    );
  }
  // Default file icon
  return (
    <svg {...props}>
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// FileCard
// ---------------------------------------------------------------------------

/**
 * FileCard -- A card for individual files showing thumbnail, name, size, and download count.
 *
 * @remarks
 * Displays a file with type-specific icon (based on mimeType), optional thumbnail,
 * file name, formatted size, download count badge, and a download button on hover.
 * Supports a selected state with accent border.
 *
 * @example
 * ```tsx
 * <FileCard
 *   name="report.pdf"
 *   size={1024 * 1024 * 2.5}
 *   mimeType="application/pdf"
 *   downloadCount={42}
 *   onClick={() => openFile(id)}
 *   onDownload={() => downloadFile(id)}
 * />
 * ```
 */
export const FileCard = forwardRef<HTMLDivElement, FileCardProps>(function FileCard(
  {
    name,
    size,
    mimeType,
    thumbnail,
    downloadCount,
    uploadedBy,
    uploadedAt,
    version,
    onClick,
    onDownload,
    selected = false,
    skeleton = false,
    syncStatus,
    transferProgress,
    encrypted = false,
    peerCount,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [hovered, setHovered] = useState(false);

  const cardStyle = useMemo(
    () => buildFileCardStyle(theme, selected, hovered),
    [theme, selected, hovered],
  );
  const thumbnailAreaStyle = useMemo(() => buildFileCardThumbnailStyle(theme), [theme]);
  const thumbnailImgStyle = useMemo(() => buildFileCardThumbnailImageStyle(), []);
  const iconStyle = useMemo(() => buildFileCardIconStyle(theme), [theme]);
  const bodyStyle = useMemo(() => buildFileCardBodyStyle(theme), [theme]);
  const nameStyle = useMemo(() => buildFileCardNameStyle(theme), [theme]);
  const metaStyle = useMemo(() => buildFileCardMetaStyle(theme), [theme]);
  const downloadOverlayStyle = useMemo(
    () => buildFileCardDownloadOverlayStyle(theme, hovered),
    [theme, hovered],
  );
  const skeletonStyle = useMemo(() => buildFileCardSkeletonStyle(theme), [theme]);

  if (skeleton) {
    return (
      <div
        ref={ref}
        className={className}
        style={{ ...skeletonStyle, ...userStyle }}
        data-testid="file-card-skeleton"
        {...rest}
      />
    );
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...cardStyle, ...userStyle }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={name}
      aria-selected={selected}
      data-testid="file-card"
      {...rest}
    >
      {/* Thumbnail area */}
      <div style={thumbnailAreaStyle}>
        {thumbnail ? (
          <img src={thumbnail} alt={name} style={thumbnailImgStyle} />
        ) : (
          <div style={iconStyle}>
            <FileTypeIcon mimeType={mimeType} color={tc.text.muted} />
          </div>
        )}

        {/* Transfer progress overlay bar */}
        {transferProgress != null && transferProgress < 100 && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: tc.border.subtle }}>
            <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, transferProgress))}%`, backgroundColor: tc.accent.primary, transition: 'width 200ms ease-out' }} />
          </div>
        )}

        {/* Encrypted lock icon */}
        {encrypted && (
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: theme.radii.md, backgroundColor: tc.background.surface, boxShadow: theme.shadows.sm }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={tc.status.success} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        )}

        {/* Sync status dot */}
        {syncStatus && (
          <div style={{
            position: 'absolute', top: 8, right: onDownload ? 40 : 8,
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor:
              syncStatus === 'synced' ? tc.status.success
              : syncStatus === 'syncing' ? tc.accent.primary
              : syncStatus === 'downloading' ? tc.accent.primary
              : tc.status.danger,
          }} title={`Status: ${syncStatus}`} />
        )}

        {/* Download button overlay */}
        {onDownload && (
          <div style={downloadOverlayStyle}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: theme.radii.md,
                border: 'none',
                backgroundColor: tc.background.surface,
                boxShadow: theme.shadows.sm,
                cursor: 'pointer',
                color: tc.text.primary,
              }}
              aria-label="Download file"
            >
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={bodyStyle}>
        <div style={nameStyle} title={name}>
          {name}
        </div>
        <div style={metaStyle}>
          <span>{formatSize(size)}</span>
          {downloadCount != null && (
            <>
              <span>{'\u00B7'}</span>
              <span>
                {downloadCount} {downloadCount === 1 ? 'download' : 'downloads'}
              </span>
            </>
          )}
          {version != null && (
            <>
              <span>{'\u00B7'}</span>
              <span>v{version}</span>
            </>
          )}
          {peerCount != null && (
            <>
              <span>{'\u00B7'}</span>
              <span>{peerCount} {peerCount === 1 ? 'peer' : 'peers'}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

FileCard.displayName = 'FileCard';
