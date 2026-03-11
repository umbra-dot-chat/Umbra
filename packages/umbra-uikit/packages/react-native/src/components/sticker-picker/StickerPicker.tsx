/**
 * @module components/sticker-picker
 * @description React Native StickerPicker component for the Wisp design system.
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import type { ViewProps, ViewStyle } from 'react-native';
import type { StickerPickerSize, StickerPickerPack } from '@coexist/wisp-core/types/StickerPicker.types';
import { stickerPickerSizeMap } from '@coexist/wisp-core/types/StickerPicker.types';
import { resolveStickerPickerColors } from '@coexist/wisp-core/styles/StickerPicker.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface StickerPickerProps extends ViewProps {
  packs: StickerPickerPack[];
  onSelect?: (stickerId: string, packId: string) => void;
  size?: StickerPickerSize;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const StickerPicker = forwardRef<View, StickerPickerProps>(
  function StickerPicker(
    {
      packs,
      onSelect,
      size = 'md',
      style: userStyle,
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

    const containerStyle = useMemo<ViewStyle>(() => ({
      width: sizeConfig.width,
      height: sizeConfig.height,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      overflow: 'hidden',
    }), [sizeConfig, colors, theme]);

    const cellStyle = useMemo<ViewStyle>(() => ({
      width: sizeConfig.cellSize,
      height: sizeConfig.cellSize,
      borderRadius: theme.radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 4,
    }), [sizeConfig, theme]);

    const activePack = packs[activePackIndex] ?? null;

    const handleStickerPress = useCallback(
      (stickerId: string, packId: string) => {
        onSelect?.(stickerId, packId);
      },
      [onSelect],
    );

    const renderSticker = useCallback(({ item }: { item: StickerPickerPack['stickers'][0] }) => (
      <TouchableOpacity
        onPress={() => activePack && handleStickerPress(item.id, activePack.id)}
        style={cellStyle}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.imageUrl }}
          style={{ width: sizeConfig.cellSize - 8, height: sizeConfig.cellSize - 8 }}
          resizeMode="contain"
        />
      </TouchableOpacity>
    ), [cellStyle, sizeConfig, activePack, handleStickerPress]);

    return (
      <View ref={ref} style={[containerStyle, userStyle]} {...rest}>
        {/* Sticker Grid */}
        {activePack && activePack.stickers.length > 0 ? (
          <FlatList
            data={activePack.stickers}
            renderItem={renderSticker}
            keyExtractor={(item) => item.id}
            numColumns={sizeConfig.columns}
            contentContainerStyle={{ padding: sizeConfig.padding, gap: sizeConfig.gap }}
            columnWrapperStyle={{ gap: sizeConfig.gap }}
            style={{ flex: 1 }}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl }}>
            <Text style={{ color: colors.textMuted, fontSize: theme.typography.sizes.sm.fontSize, textAlign: 'center' }}>
              {packs.length === 0 ? 'No sticker packs available' : 'No stickers in this pack'}
            </Text>
          </View>
        )}

        {/* Tab Bar */}
        {packs.length > 0 && (
          <View style={{
            flexDirection: 'row',
            height: sizeConfig.tabHeight,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingHorizontal: sizeConfig.padding,
          }}>
            {packs.map((pack, i) => (
              <TouchableOpacity
                key={pack.id}
                onPress={() => setActivePackIndex(i)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderTopWidth: i === activePackIndex ? 2 : 0,
                  borderTopColor: colors.tabIndicator,
                }}
              >
                {pack.iconUrl ? (
                  <Image
                    source={{ uri: pack.iconUrl }}
                    style={{ width: sizeConfig.tabIconSize, height: sizeConfig.tabIconSize, borderRadius: 4 }}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={{
                    fontSize: sizeConfig.tabIconSize * 0.6,
                    color: i === activePackIndex ? colors.tabTextActive : colors.tabText,
                    fontWeight: '600',
                    textTransform: 'uppercase',
                  }}>
                    {pack.name.charAt(0)}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  },
);

StickerPicker.displayName = 'StickerPicker';
