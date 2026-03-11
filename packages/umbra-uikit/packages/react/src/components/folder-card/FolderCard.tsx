/**
 * @module components/folder-card
 * @description FolderCard for the Wisp design system.
 *
 * Displays a folder in a file channel grid view with icon, name, and file count.
 * Supports selection, hover, context menu, and drop-target states.
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type { FolderCardProps } from '@coexist/wisp-core/types/FolderCard.types';
import {
  buildFolderCardStyle,
  buildFolderCardIconAreaStyle,
  buildFolderCardIconStyle,
  buildFolderCardBodyStyle,
  buildFolderCardNameStyle,
  buildFolderCardMetaStyle,
  buildFolderCardSkeletonStyle,
} from '@coexist/wisp-core/styles/FolderCard.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Inline SVG — Folder icon
// ---------------------------------------------------------------------------

function FolderIcon({ size = 40, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color ?? 'currentColor'}
      stroke="none"
    >
      <path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );
}

function FolderOpenIcon({ size = 40, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color ?? 'currentColor'}
      stroke="none"
    >
      <path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v1H7.5a2 2 0 00-1.8 1.1L2 18V6z" />
      <path d="M5.7 11.1A2 2 0 017.5 10H22l-3.3 8.1a2 2 0 01-1.8 1.1H2l3.7-8z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// FolderCard
// ---------------------------------------------------------------------------

/**
 * FolderCard — A card for displaying folders in a file channel grid view.
 *
 * @remarks
 * Renders a folder icon with the folder name and optional file count.
 * Supports selection state (accent border), hover effects, and drop-target
 * highlighting for drag-and-drop operations.
 *
 * @example
 * ```tsx
 * <FolderCard
 *   name="Documents"
 *   fileCount={12}
 *   onClick={() => selectFolder(id)}
 *   onDoubleClick={() => navigateIntoFolder(id)}
 *   selected={selectedId === id}
 * />
 * ```
 */
export const FolderCard = forwardRef<HTMLDivElement, FolderCardProps>(
  function FolderCard(
    {
      name,
      fileCount,
      onClick,
      onDoubleClick,
      onContextMenu,
      selected = false,
      skeleton = false,
      dropTarget = false,
      createdBy,
      createdAt,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [hovered, setHovered] = useState(false);

    // Styles
    const cardStyle = useMemo(
      () => buildFolderCardStyle(theme, selected, hovered, dropTarget),
      [theme, selected, hovered, dropTarget],
    );

    const iconAreaStyle = useMemo(
      () => buildFolderCardIconAreaStyle(theme),
      [theme],
    );

    const iconStyle = useMemo(
      () => buildFolderCardIconStyle(theme),
      [theme],
    );

    const bodyStyle = useMemo(
      () => buildFolderCardBodyStyle(theme),
      [theme],
    );

    const nameStyle = useMemo(
      () => buildFolderCardNameStyle(theme),
      [theme],
    );

    const metaStyle = useMemo(
      () => buildFolderCardMetaStyle(theme),
      [theme],
    );

    const skeletonStyle = useMemo(
      () => buildFolderCardSkeletonStyle(theme),
      [theme],
    );

    // Event handlers
    const handleMouseEnter = useCallback(() => setHovered(true), []);
    const handleMouseLeave = useCallback(() => setHovered(false), []);

    // Skeleton
    if (skeleton) {
      return (
        <div
          ref={ref}
          className={className}
          style={{ ...skeletonStyle, ...userStyle }}
          data-testid="folder-card-skeleton"
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
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="button"
        tabIndex={0}
        aria-label={`Folder: ${name}`}
        aria-selected={selected}
        data-testid="folder-card"
        {...rest}
      >
        {/* Icon area */}
        <div style={iconAreaStyle}>
          <div style={iconStyle}>
            {hovered || dropTarget ? (
              <FolderOpenIcon size={40} />
            ) : (
              <FolderIcon size={40} />
            )}
          </div>
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          <p style={nameStyle} title={name}>{name}</p>
          <p style={metaStyle}>
            {fileCount !== undefined && (
              <span>{fileCount} {fileCount === 1 ? 'file' : 'files'}</span>
            )}
          </p>
        </div>
      </div>
    );
  },
);

FolderCard.displayName = 'FolderCard';
