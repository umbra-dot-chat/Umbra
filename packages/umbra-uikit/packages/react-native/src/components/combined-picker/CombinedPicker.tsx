/**
 * @module components/combined-picker
 * @description Combined Emoji + GIF picker with tabbed navigation.
 *
 * Wraps the existing EmojiPicker and GifPicker components behind a
 * top tab bar so users can switch between emoji and GIF selection
 * in a single popup panel.
 */

import React, { forwardRef, useState, useMemo, useCallback } from 'react';
import { View, Pressable, Text, Dimensions } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { EmojiItem } from '@coexist/wisp-core/types/EmojiPicker.types';
import type { EmojiPickerSize } from '@coexist/wisp-core/types/EmojiPicker.types';
import type { GifItem } from '@coexist/wisp-core/types/GifPicker.types';
import { emojiPickerSizeMap } from '@coexist/wisp-core/types/EmojiPicker.types';
import { useTheme } from '../../providers';
import { EmojiPicker } from '../emoji-picker';
import { GifPicker } from '../gif-picker';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type CombinedPickerTab = 'emoji' | 'gifs';

export interface CombinedPickerProps extends ViewProps {
  /** Size preset (passed through to inner pickers). @default 'md' */
  size?: EmojiPickerSize;

  // ── Emoji props ──────────────────────────────────────────────────────
  /** Called when an emoji is selected. */
  onEmojiSelect?: (emoji: string, item?: EmojiItem) => void;
  /** Custom community emoji for the 'custom' category tab. */
  customEmojis?: EmojiItem[];

  // ── GIF props ────────────────────────────────────────────────────────
  /** Relay server URL for the GIF search proxy. */
  relayUrl?: string;
  /** Called when a GIF is selected. */
  onGifSelect?: (gif: GifItem) => void;

  /** The initially active tab. @default 'emoji' */
  defaultTab?: CombinedPickerTab;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CombinedPicker = forwardRef<View, CombinedPickerProps>(
  function CombinedPicker(
    {
      size = 'md',
      onEmojiSelect,
      customEmojis,
      relayUrl,
      onGifSelect,
      defaultTab = 'emoji',
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const sizeConfig = emojiPickerSizeMap[size];
    const [activeTab, setActiveTab] = useState<CombinedPickerTab>(defaultTab);

    // Clamp width to screen so picker never overflows on mobile
    const screenWidth = Dimensions.get('window').width;
    const PICKER_H_MARGIN = 24;
    const clampedWidth = Math.min(sizeConfig.width, screenWidth - PICKER_H_MARGIN);

    // If no relay URL (GIF proxy not available), just render plain EmojiPicker
    if (!relayUrl) {
      return (
        <EmojiPicker
          ref={ref}
          size={size}
          onSelect={onEmojiSelect}
          customEmojis={customEmojis}
          style={userStyle}
          {...rest}
        />
      );
    }

    const TAB_BAR_HEIGHT = 36;

    const containerStyle = useMemo<ViewStyle>(() => ({
      width: clampedWidth,
      borderRadius: theme.radii.xl ?? 16,
      borderWidth: 1,
      borderColor: themeColors.border.subtle,
      backgroundColor: themeColors.background.raised,
      overflow: 'hidden',
    }), [clampedWidth, themeColors, theme]);

    const tabBarStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      height: TAB_BAR_HEIGHT,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border.subtle,
      backgroundColor: themeColors.background.surface,
    }), [themeColors]);

    const makeTabStyle = useCallback(
      (isActive: boolean): ViewStyle => ({
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 2,
        borderBottomColor: isActive ? themeColors.accent.primary : 'transparent',
      }),
      [themeColors],
    );

    const makeTabTextStyle = useCallback(
      (isActive: boolean): TextStyle => ({
        fontSize: 13,
        fontWeight: isActive ? '600' : '400',
        color: isActive ? themeColors.text.primary : themeColors.text.secondary,
      }),
      [themeColors],
    );

    return (
      <View ref={ref} style={[containerStyle, userStyle]} {...rest}>
        {/* Tab bar */}
        <View style={tabBarStyle}>
          <Pressable
            onPress={() => setActiveTab('emoji')}
            style={makeTabStyle(activeTab === 'emoji')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'emoji' }}
          >
            <Text style={makeTabTextStyle(activeTab === 'emoji')}>Emoji</Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('gifs')}
            style={makeTabStyle(activeTab === 'gifs')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'gifs' }}
          >
            <Text style={makeTabTextStyle(activeTab === 'gifs')}>GIFs</Text>
          </Pressable>
        </View>

        {/* Content */}
        {activeTab === 'emoji' ? (
          <EmojiPicker
            size={size}
            onSelect={onEmojiSelect}
            customEmojis={customEmojis}
            style={{ borderWidth: 0, borderRadius: 0 }}
          />
        ) : (
          <GifPicker
            size={size}
            relayUrl={relayUrl}
            onSelect={onGifSelect}
            style={{ borderWidth: 0, borderRadius: 0 }}
          />
        )}
      </View>
    );
  },
);

CombinedPicker.displayName = 'CombinedPicker';
