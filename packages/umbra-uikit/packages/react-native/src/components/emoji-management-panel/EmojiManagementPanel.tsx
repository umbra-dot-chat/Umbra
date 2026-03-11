/**
 * @module components/emoji-management-panel
 * @description React Native EmojiManagementPanel component for the Wisp design system.
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import type { ViewProps, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import type { CustomEmoji } from '@coexist/wisp-core/types/EmojiManagementPanel.types';
import { resolveEmojiManagementPanelColors } from '@coexist/wisp-core/styles/EmojiManagementPanel.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface EmojiManagementPanelProps extends ViewProps {
  emojis: CustomEmoji[];
  onUpload?: (file: never, name: string) => void;
  onDelete?: (emojiId: string) => void;
  onRename?: (emojiId: string, name: string) => void;
  uploading?: boolean;
  maxEmojis?: number;
  title?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const EmojiManagementPanel = forwardRef<View, EmojiManagementPanelProps>(
  function EmojiManagementPanel(
    {
      emojis,
      onDelete,
      onRename,
      uploading = false,
      maxEmojis = 50,
      title = 'Custom Emoji',
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveEmojiManagementPanelColors(theme),
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

    const emojiCardStyle = useMemo<ViewStyle>(() => ({
      alignItems: 'center',
      gap: theme.spacing.xs,
      padding: theme.spacing.sm,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      width: 80,
    }), [theme, colors]);

    const renderEmoji = useCallback(({ item }: { item: CustomEmoji }) => (
      <View style={emojiCardStyle}>
        <Image
          source={{ uri: item.imageUrl }}
          style={{ width: 32, height: 32 }}
          resizeMode="contain"
        />
        <Text
          style={{ fontSize: theme.typography.sizes.xs.fontSize, color: colors.textSecondary, textAlign: 'center' }}
          numberOfLines={1}
        >
          :{item.name}:
        </Text>
        {onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(item.id)}
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
    ), [emojiCardStyle, onDelete, theme, colors]);

    return (
      <View ref={ref} style={[containerStyle, userStyle]} {...rest}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: theme.typography.sizes.base.fontSize, fontWeight: theme.typography.weights.semibold, color: colors.text }}>
            {title}
          </Text>
          <View style={{
            paddingHorizontal: 10,
            paddingVertical: 2,
            borderRadius: 9999,
            backgroundColor: colors.border,
          }}>
            <Text style={{ fontSize: theme.typography.sizes.xs.fontSize, color: colors.textMuted }}>
              {emojis.length}/{maxEmojis}
            </Text>
          </View>
        </View>

        {/* Grid */}
        <FlatList
          data={emojis}
          renderItem={renderEmoji}
          keyExtractor={(item) => item.id}
          numColumns={4}
          columnWrapperStyle={{ gap: theme.spacing.sm }}
          contentContainerStyle={{ gap: theme.spacing.sm }}
          scrollEnabled={false}
        />
      </View>
    );
  },
);

EmojiManagementPanel.displayName = 'EmojiManagementPanel';
