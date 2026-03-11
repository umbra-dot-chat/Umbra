import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type { StickerPickerProps } from '@coexist/wisp-core/types/StickerPicker.types';
import { stickerPickerSizeMap } from '@coexist/wisp-core/types/StickerPicker.types';
import {
  resolveStickerPickerColors,
  buildStickerPickerContainerStyle,
  buildStickerPickerGridStyle,
  buildStickerPickerCellStyle,
  buildStickerPickerCellImageStyle,
  buildStickerPickerTabBarStyle,
  buildStickerPickerTabStyle,
  buildStickerPickerTabIconStyle,
  buildStickerPickerEmptyStyle,
  buildStickerPickerSkeletonStyle,
} from '@coexist/wisp-core/styles/StickerPicker.styles';
import { useTheme } from '../../providers';

/**
 * StickerPicker -- User-facing sticker selection picker.
 *
 * @remarks
 * Displays a compact panel with pack tabs at the bottom and a scrollable
 * grid of sticker images. Click a sticker to select it.
 *
 * @module components/sticker-picker
 */
export const StickerPicker = forwardRef<HTMLDivElement, StickerPickerProps>(
  function StickerPicker(
    {
      packs,
      onSelect,
      size = 'md',
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [activePackIndex, setActivePackIndex] = useState(0);
    const sizeConfig = stickerPickerSizeMap[size];

    const colors = useMemo(
      () => resolveStickerPickerColors(theme),
      [theme],
    );

    // Skeleton early return
    if (skeleton) {
      const skeletonStyle = buildStickerPickerSkeletonStyle(sizeConfig, theme);
      return (
        <div
          aria-hidden
          className={className}
          style={{ ...skeletonStyle, ...userStyle }}
        />
      );
    }

    const containerStyle = useMemo(
      () => buildStickerPickerContainerStyle(sizeConfig, colors, theme),
      [sizeConfig, colors, theme],
    );

    const gridStyle = useMemo(
      () => buildStickerPickerGridStyle(sizeConfig),
      [sizeConfig],
    );

    const cellStyle = useMemo(
      () => buildStickerPickerCellStyle(sizeConfig, theme),
      [sizeConfig, theme],
    );

    const cellImageStyle = useMemo(
      () => buildStickerPickerCellImageStyle(sizeConfig),
      [sizeConfig],
    );

    const tabBarStyle = useMemo(
      () => buildStickerPickerTabBarStyle(sizeConfig, colors),
      [sizeConfig, colors],
    );

    const tabIconStyle = useMemo(
      () => buildStickerPickerTabIconStyle(sizeConfig),
      [sizeConfig],
    );

    const emptyStyle = useMemo(
      () => buildStickerPickerEmptyStyle(colors, theme),
      [colors, theme],
    );

    const activePack = packs[activePackIndex] ?? null;

    const handleStickerClick = useCallback(
      (stickerId: string, packId: string) => {
        onSelect?.(stickerId, packId);
      },
      [onSelect],
    );

    return (
      <div
        ref={ref}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        {/* Sticker Grid */}
        {activePack && activePack.stickers.length > 0 ? (
          <div style={gridStyle}>
            {activePack.stickers.map((sticker) => (
              <button
                key={sticker.id}
                type="button"
                aria-label={sticker.name}
                title={sticker.name}
                style={cellStyle}
                onClick={() => handleStickerClick(sticker.id, activePack.id)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = colors.cellHover;
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                }}
              >
                <img
                  src={sticker.imageUrl}
                  alt={sticker.name}
                  style={cellImageStyle}
                />
              </button>
            ))}
          </div>
        ) : (
          <div style={emptyStyle}>
            {packs.length === 0 ? 'No sticker packs available' : 'No stickers in this pack'}
          </div>
        )}

        {/* Tab Bar */}
        {packs.length > 0 && (
          <div style={tabBarStyle}>
            {packs.map((pack, i) => (
              <button
                key={pack.id}
                type="button"
                aria-label={pack.name}
                title={pack.name}
                style={buildStickerPickerTabStyle(sizeConfig, colors, i === activePackIndex)}
                onClick={() => setActivePackIndex(i)}
              >
                {pack.iconUrl ? (
                  <img
                    src={pack.iconUrl}
                    alt={pack.name}
                    style={tabIconStyle}
                  />
                ) : (
                  <span style={{
                    fontSize: sizeConfig.tabIconSize * 0.6,
                    color: i === activePackIndex ? colors.tabTextActive : colors.tabText,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}>
                    {pack.name.charAt(0)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
);

StickerPicker.displayName = 'StickerPicker';
