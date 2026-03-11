import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type { StickerManagementPanelProps } from '@coexist/wisp-core/types/StickerManagementPanel.types';
import {
  resolveStickerManagementPanelColors,
  buildStickerManagementPanelContainerStyle,
  buildStickerManagementPanelHeaderStyle,
  buildStickerManagementPanelTitleStyle,
  buildStickerManagementPanelGridStyle,
  buildStickerManagementPanelStickerCardStyle,
  buildStickerManagementPanelStickerImageStyle,
  buildStickerManagementPanelStickerNameStyle,
  buildStickerManagementPanelDeleteButtonStyle,
  buildStickerManagementPanelUploadSectionStyle,
  buildStickerManagementPanelUploadRowStyle,
  buildStickerManagementPanelCreateRowStyle,
  buildStickerManagementPanelSkeletonStyle,
} from '@coexist/wisp-core/styles/StickerManagementPanel.styles';
import { useTheme } from '../../providers';

/**
 * StickerManagementPanel -- Admin panel for managing sticker packs.
 *
 * @remarks
 * Uses tabs for each sticker pack, displays a grid of stickers within
 * each pack, and provides upload and create/delete functionality.
 *
 * @module components/sticker-management-panel
 */
export const StickerManagementPanel = forwardRef<HTMLDivElement, StickerManagementPanelProps>(
  function StickerManagementPanel(
    {
      packs,
      onCreatePack,
      onDeletePack,
      onUploadSticker,
      onDeleteSticker,
      title = 'Sticker Packs',
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [activePackIndex, setActivePackIndex] = useState(0);
    const [newPackName, setNewPackName] = useState('');
    const [uploadName, setUploadName] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [hoveredStickerId, setHoveredStickerId] = useState<string | null>(null);

    const colors = useMemo(
      () => resolveStickerManagementPanelColors(theme),
      [theme],
    );

    // Skeleton early return
    if (skeleton) {
      const skeletonStyle = buildStickerManagementPanelSkeletonStyle(theme);
      return (
        <div
          aria-hidden
          className={className}
          style={{ ...skeletonStyle, ...userStyle }}
        />
      );
    }

    const containerStyle = useMemo(
      () => buildStickerManagementPanelContainerStyle(colors, theme),
      [colors, theme],
    );

    const headerStyle = useMemo(
      () => buildStickerManagementPanelHeaderStyle(theme),
      [theme],
    );

    const titleStyle = useMemo(
      () => buildStickerManagementPanelTitleStyle(colors, theme),
      [colors, theme],
    );

    const gridStyle = useMemo(
      () => buildStickerManagementPanelGridStyle(theme),
      [theme],
    );

    const stickerCardStyle = useMemo(
      () => buildStickerManagementPanelStickerCardStyle(colors, theme),
      [colors, theme],
    );

    const stickerImageStyle = useMemo(
      () => buildStickerManagementPanelStickerImageStyle(),
      [],
    );

    const stickerNameStyle = useMemo(
      () => buildStickerManagementPanelStickerNameStyle(colors, theme),
      [colors, theme],
    );

    const deleteButtonStyle = useMemo(
      () => buildStickerManagementPanelDeleteButtonStyle(colors, theme),
      [colors, theme],
    );

    const uploadSectionStyle = useMemo(
      () => buildStickerManagementPanelUploadSectionStyle(colors, theme),
      [colors, theme],
    );

    const uploadRowStyle = useMemo(
      () => buildStickerManagementPanelUploadRowStyle(theme),
      [theme],
    );

    const createRowStyle = useMemo(
      () => buildStickerManagementPanelCreateRowStyle(theme),
      [theme],
    );

    const activePack = packs[activePackIndex] ?? null;

    const handleCreatePack = useCallback(() => {
      if (newPackName && onCreatePack) {
        onCreatePack(newPackName);
        setNewPackName('');
      }
    }, [newPackName, onCreatePack]);

    const handleUploadSticker = useCallback(() => {
      if (activePack && uploadFile && uploadName && onUploadSticker) {
        onUploadSticker(activePack.id, uploadFile, uploadName);
        setUploadName('');
        setUploadFile(null);
      }
    }, [activePack, uploadFile, uploadName, onUploadSticker]);

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
        </div>

        {/* Create New Pack */}
        <div style={createRowStyle}>
          <input
            type="text"
            value={newPackName}
            onChange={(e) => setNewPackName(e.target.value)}
            placeholder="New pack name"
            style={{
              padding: '6px 10px',
              borderRadius: theme.radii.md,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.bg,
              color: colors.text,
              fontSize: theme.typography.sizes.sm.fontSize,
              outline: 'none',
              flex: 1,
            }}
          />
          <button
            type="button"
            onClick={handleCreatePack}
            disabled={!newPackName}
            style={{
              padding: '6px 16px',
              borderRadius: theme.radii.md,
              border: 'none',
              backgroundColor: theme.colors.accent.primary,
              color: '#ffffff',
              fontWeight: 600,
              fontSize: theme.typography.sizes.sm.fontSize,
              cursor: newPackName ? 'pointer' : 'not-allowed',
              opacity: newPackName ? 1 : 0.5,
            }}
          >
            Create Pack
          </button>
        </div>

        {/* Tabs */}
        {packs.length > 0 && (
          <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${colors.border}`, overflow: 'auto' }}>
            {packs.map((pack, i) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => setActivePackIndex(i)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: i === activePackIndex ? theme.colors.accent.primary : colors.textSecondary,
                  fontWeight: i === activePackIndex ? theme.typography.weights.semibold : theme.typography.weights.regular,
                  fontSize: theme.typography.sizes.sm.fontSize,
                  cursor: 'pointer',
                  borderBottom: i === activePackIndex ? `2px solid ${theme.colors.accent.primary}` : '2px solid transparent',
                  whiteSpace: 'nowrap',
                }}
              >
                {pack.name}
              </button>
            ))}
          </div>
        )}

        {/* Active Pack Content */}
        {activePack && (
          <>
            {/* Pack Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: theme.typography.sizes.sm.fontSize, color: colors.textMuted }}>
                {activePack.stickers.length} sticker{activePack.stickers.length !== 1 ? 's' : ''}
              </span>
              {onDeletePack && (
                <button
                  type="button"
                  onClick={() => {
                    onDeletePack(activePack.id);
                    setActivePackIndex(0);
                  }}
                  style={{
                    padding: '4px 12px',
                    borderRadius: theme.radii.md,
                    border: `1px solid ${colors.danger}`,
                    backgroundColor: 'transparent',
                    color: colors.danger,
                    fontSize: theme.typography.sizes.xs.fontSize,
                    cursor: 'pointer',
                  }}
                >
                  Delete Pack
                </button>
              )}
            </div>

            {/* Sticker Grid */}
            <div style={gridStyle}>
              {activePack.stickers.map((sticker) => (
                <div
                  key={sticker.id}
                  style={stickerCardStyle}
                  onMouseEnter={() => setHoveredStickerId(sticker.id)}
                  onMouseLeave={() => setHoveredStickerId(null)}
                >
                  <img
                    src={sticker.imageUrl}
                    alt={sticker.name}
                    style={stickerImageStyle}
                  />
                  <span style={stickerNameStyle}>{sticker.name}</span>
                  {onDeleteSticker && (
                    <button
                      type="button"
                      aria-label={`Delete sticker ${sticker.name}`}
                      style={{
                        ...deleteButtonStyle,
                        opacity: hoveredStickerId === sticker.id ? 1 : 0,
                      }}
                      onClick={() => onDeleteSticker(activePack.id, sticker.id)}
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Upload Sticker */}
            <div style={uploadSectionStyle}>
              <span style={{ fontSize: theme.typography.sizes.sm.fontSize, fontWeight: theme.typography.weights.medium, color: colors.textSecondary }}>
                Add Sticker to &ldquo;{activePack.name}&rdquo;
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
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="Sticker name"
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
                  onClick={handleUploadSticker}
                  disabled={!uploadFile || !uploadName}
                  style={{
                    padding: '6px 16px',
                    borderRadius: theme.radii.md,
                    border: 'none',
                    backgroundColor: theme.colors.accent.primary,
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: theme.typography.sizes.sm.fontSize,
                    cursor: !uploadFile || !uploadName ? 'not-allowed' : 'pointer',
                    opacity: !uploadFile || !uploadName ? 0.5 : 1,
                  }}
                >
                  Upload
                </button>
              </div>
            </div>
          </>
        )}

        {packs.length === 0 && (
          <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: colors.textMuted, fontSize: theme.typography.sizes.sm.fontSize }}>
            No sticker packs yet. Create one above.
          </div>
        )}
      </div>
    );
  },
);

StickerManagementPanel.displayName = 'StickerManagementPanel';
