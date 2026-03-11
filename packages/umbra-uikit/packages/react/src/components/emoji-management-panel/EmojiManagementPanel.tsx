import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type { EmojiManagementPanelProps } from '@coexist/wisp-core/types/EmojiManagementPanel.types';
import {
  resolveEmojiManagementPanelColors,
  buildEmojiManagementPanelContainerStyle,
  buildEmojiManagementPanelHeaderStyle,
  buildEmojiManagementPanelTitleStyle,
  buildEmojiManagementPanelCountStyle,
  buildEmojiManagementPanelGridStyle,
  buildEmojiManagementPanelEmojiCardStyle,
  buildEmojiManagementPanelEmojiImageStyle,
  buildEmojiManagementPanelEmojiNameStyle,
  buildEmojiManagementPanelDeleteButtonStyle,
  buildEmojiManagementPanelUploadSectionStyle,
  buildEmojiManagementPanelUploadRowStyle,
  buildEmojiManagementPanelSkeletonStyle,
} from '@coexist/wisp-core/styles/EmojiManagementPanel.styles';
import { useTheme } from '../../providers';

/**
 * EmojiManagementPanel -- Admin panel for managing custom community emoji.
 *
 * @remarks
 * Displays a grid of emoji cards with image and name, hover-to-show delete
 * button, an upload section with file input and name input, and a count badge.
 *
 * @module components/emoji-management-panel
 */
export const EmojiManagementPanel = forwardRef<HTMLDivElement, EmojiManagementPanelProps>(
  function EmojiManagementPanel(
    {
      emojis,
      onUpload,
      onDelete,
      onRename,
      uploading = false,
      maxEmojis = 50,
      title = 'Custom Emoji',
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [uploadName, setUploadName] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const colors = useMemo(
      () => resolveEmojiManagementPanelColors(theme),
      [theme],
    );

    // Skeleton early return
    if (skeleton) {
      const skeletonStyle = buildEmojiManagementPanelSkeletonStyle(theme);
      return (
        <div
          aria-hidden
          className={className}
          style={{ ...skeletonStyle, ...userStyle }}
        />
      );
    }

    const containerStyle = useMemo(
      () => buildEmojiManagementPanelContainerStyle(colors, theme),
      [colors, theme],
    );

    const headerStyle = useMemo(
      () => buildEmojiManagementPanelHeaderStyle(theme),
      [theme],
    );

    const titleStyle = useMemo(
      () => buildEmojiManagementPanelTitleStyle(colors, theme),
      [colors, theme],
    );

    const countStyle = useMemo(
      () => buildEmojiManagementPanelCountStyle(colors, theme),
      [colors, theme],
    );

    const gridStyle = useMemo(
      () => buildEmojiManagementPanelGridStyle(theme),
      [theme],
    );

    const emojiCardStyle = useMemo(
      () => buildEmojiManagementPanelEmojiCardStyle(colors, theme),
      [colors, theme],
    );

    const emojiImageStyle = useMemo(
      () => buildEmojiManagementPanelEmojiImageStyle(),
      [],
    );

    const emojiNameStyle = useMemo(
      () => buildEmojiManagementPanelEmojiNameStyle(colors, theme),
      [colors, theme],
    );

    const deleteButtonStyle = useMemo(
      () => buildEmojiManagementPanelDeleteButtonStyle(colors, theme),
      [colors, theme],
    );

    const uploadSectionStyle = useMemo(
      () => buildEmojiManagementPanelUploadSectionStyle(colors, theme),
      [colors, theme],
    );

    const uploadRowStyle = useMemo(
      () => buildEmojiManagementPanelUploadRowStyle(theme),
      [theme],
    );

    const handleUpload = useCallback(() => {
      if (uploadFile && uploadName && onUpload) {
        onUpload(uploadFile, uploadName);
        setUploadName('');
        setUploadFile(null);
      }
    }, [uploadFile, uploadName, onUpload]);

    return (
      <div
        ref={ref}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        {/* Header */}
        <div style={headerStyle}>
          <div style={titleStyle}>{title}</div>
          <span
            style={{
              ...countStyle,
              padding: '2px 10px',
              borderRadius: theme.radii.full,
              backgroundColor: colors.border,
              fontSize: theme.typography.sizes.xs.fontSize,
              fontWeight: theme.typography.weights.medium,
            }}
          >
            {emojis.length}/{maxEmojis}
          </span>
        </div>

        {/* Emoji Grid */}
        <div style={gridStyle}>
          {emojis.map((emoji) => (
            <div
              key={emoji.id}
              style={emojiCardStyle}
              onMouseEnter={() => setHoveredId(emoji.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <img
                src={emoji.imageUrl}
                alt={emoji.name}
                style={emojiImageStyle}
              />
              <span style={emojiNameStyle}>:{emoji.name}:</span>
              {onDelete && (
                <button
                  type="button"
                  aria-label={`Delete ${emoji.name}`}
                  style={{
                    ...deleteButtonStyle,
                    opacity: hoveredId === emoji.id ? 1 : 0,
                  }}
                  onClick={() => onDelete(emoji.id)}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Upload Section */}
        {emojis.length < maxEmojis && (
          <div style={uploadSectionStyle}>
            <span style={{ fontSize: theme.typography.sizes.sm.fontSize, fontWeight: theme.typography.weights.medium, color: colors.textSecondary }}>
              Upload New Emoji
            </span>
            <div style={uploadRowStyle}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                style={{ fontSize: 13, color: colors.textSecondary }}
              />
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="emoji_name"
                style={{
                  padding: '6px 10px',
                  borderRadius: theme.radii.md,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.bg,
                  color: colors.text,
                  fontSize: theme.typography.sizes.sm.fontSize,
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || !uploadFile || !uploadName}
                style={{
                  padding: '6px 16px',
                  borderRadius: theme.radii.md,
                  border: 'none',
                  backgroundColor: theme.colors.accent.primary,
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: theme.typography.sizes.sm.fontSize,
                  cursor: uploading || !uploadFile || !uploadName ? 'not-allowed' : 'pointer',
                  opacity: uploading || !uploadFile || !uploadName ? 0.5 : 1,
                }}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);

EmojiManagementPanel.displayName = 'EmojiManagementPanel';
