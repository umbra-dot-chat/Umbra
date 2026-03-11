/**
 * @module components/sticker-management-panel
 * @description React Native StickerManagementPanel component for the Wisp design system.
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { StickerPack, Sticker } from '@coexist/wisp-core/types/StickerManagementPanel.types';
import { resolveStickerManagementPanelColors } from '@coexist/wisp-core/styles/StickerManagementPanel.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface StickerManagementPanelProps extends ViewProps {
  packs: StickerPack[];
  onCreatePack?: (name: string) => void;
  onDeletePack?: (packId: string) => void;
  onUploadSticker?: (packId: string, file: never, name: string) => void;
  onDeleteSticker?: (packId: string, stickerId: string) => void;
  title?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const StickerManagementPanel = forwardRef<View, StickerManagementPanelProps>(
  function StickerManagementPanel(
    {
      packs,
      onCreatePack,
      onDeletePack,
      onDeleteSticker,
      title = 'Sticker Packs',
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [activePackIndex, setActivePackIndex] = useState(0);
    const [newPackName, setNewPackName] = useState('');

    const colors = useMemo(
      () => resolveStickerManagementPanelColors(theme),
      [theme],
    );

    const containerStyle = useMemo<ViewStyle>(() => ({
      padding: theme.spacing.lg,
      backgroundColor: colors.cardBg,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: theme.spacing.lg,
    }), [theme, colors]);

    const stickerCardStyle = useMemo<ViewStyle>(() => ({
      alignItems: 'center',
      gap: theme.spacing.xs,
      padding: theme.spacing.sm,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      width: 100,
    }), [theme, colors]);

    const activePack = packs[activePackIndex] ?? null;

    const handleCreatePack = useCallback(() => {
      if (newPackName && onCreatePack) {
        onCreatePack(newPackName);
        setNewPackName('');
      }
    }, [newPackName, onCreatePack]);

    const renderSticker = useCallback(({ item }: { item: Sticker }) => (
      <View style={stickerCardStyle}>
        <Image
          source={{ uri: item.imageUrl }}
          style={{ width: 64, height: 64 }}
          resizeMode="contain"
        />
        <Text
          style={{ fontSize: theme.typography.sizes.xs.fontSize, color: colors.textSecondary, textAlign: 'center' }}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {onDeleteSticker && activePack && (
          <TouchableOpacity
            onPress={() => onDeleteSticker(activePack.id, item.id)}
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: colors.dangerSurface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.danger, fontSize: 12, lineHeight: 14 }}>&times;</Text>
          </TouchableOpacity>
        )}
      </View>
    ), [stickerCardStyle, onDeleteSticker, activePack, theme, colors]);

    return (
      <View ref={ref} style={[containerStyle, userStyle]} {...rest}>
        {/* Header */}
        <Text style={{ fontSize: theme.typography.sizes.base.fontSize, fontWeight: theme.typography.weights.semibold, color: colors.text }}>
          {title}
        </Text>

        {/* Create pack */}
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <TextInput
            value={newPackName}
            onChangeText={setNewPackName}
            placeholder="New pack name"
            placeholderTextColor={colors.textMuted}
            style={{
              flex: 1,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
              borderRadius: theme.radii.md,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.bg,
              color: colors.text,
              fontSize: theme.typography.sizes.sm.fontSize,
            }}
          />
          <TouchableOpacity
            onPress={handleCreatePack}
            disabled={!newPackName}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: theme.radii.md,
              backgroundColor: theme.colors.accent.primary,
              opacity: newPackName ? 1 : 0.5,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: theme.typography.sizes.sm.fontSize }}>
              Create Pack
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        {packs.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
            {packs.map((pack, i) => (
              <TouchableOpacity
                key={pack.id}
                onPress={() => setActivePackIndex(i)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderBottomWidth: i === activePackIndex ? 2 : 0,
                  borderBottomColor: theme.colors.accent.primary,
                }}
              >
                <Text style={{
                  fontSize: theme.typography.sizes.sm.fontSize,
                  color: i === activePackIndex ? theme.colors.accent.primary : colors.textSecondary,
                  fontWeight: i === activePackIndex ? theme.typography.weights.semibold : theme.typography.weights.regular,
                }}>
                  {pack.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Sticker grid */}
        {activePack && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: theme.typography.sizes.sm.fontSize, color: colors.textMuted }}>
                {activePack.stickers.length} sticker{activePack.stickers.length !== 1 ? 's' : ''}
              </Text>
              {onDeletePack && (
                <TouchableOpacity
                  onPress={() => { onDeletePack(activePack.id); setActivePackIndex(0); }}
                  style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: theme.radii.md, borderWidth: 1, borderColor: colors.danger }}
                >
                  <Text style={{ color: colors.danger, fontSize: theme.typography.sizes.xs.fontSize }}>Delete Pack</Text>
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={activePack.stickers}
              renderItem={renderSticker}
              keyExtractor={(item) => item.id}
              numColumns={3}
              columnWrapperStyle={{ gap: theme.spacing.sm }}
              contentContainerStyle={{ gap: theme.spacing.sm }}
              scrollEnabled={false}
            />
          </>
        )}

        {packs.length === 0 && (
          <Text style={{ textAlign: 'center', padding: theme.spacing.xl, color: colors.textMuted, fontSize: theme.typography.sizes.sm.fontSize }}>
            No sticker packs yet. Create one above.
          </Text>
        )}
      </View>
    );
  },
);

StickerManagementPanel.displayName = 'StickerManagementPanel';
