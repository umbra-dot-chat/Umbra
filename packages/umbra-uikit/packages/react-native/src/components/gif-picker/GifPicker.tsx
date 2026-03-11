/**
 * @module components/gif-picker
 * @description GIF picker component backed by a relay-proxied Tenor API.
 *
 * Shows trending GIFs on mount, allows searching, and paginates via
 * Tenor's `next` token. Uses the relay server as a proxy so the API key
 * stays server-side.
 */

import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { GifItem } from '@coexist/wisp-core/types/GifPicker.types';
import type { EmojiPickerSize } from '@coexist/wisp-core/types/EmojiPicker.types';
import { emojiPickerSizeMap } from '@coexist/wisp-core/types/EmojiPicker.types';
import { useTheme } from '../../providers';
import { SearchInput } from '../search-input';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface GifPickerProps extends ViewProps {
  /** Size preset (shares dimensions with EmojiPicker). @default 'md' */
  size?: EmojiPickerSize;

  /** Called when a GIF is selected. */
  onSelect?: (gif: GifItem) => void;

  /** Relay server URL for the GIF proxy API. */
  relayUrl: string;
}

// ---------------------------------------------------------------------------
// Tenor response parsing
// ---------------------------------------------------------------------------

interface TenorMediaFormat {
  url: string;
  dims: [number, number];
  size: number;
}

interface TenorResult {
  id: string;
  title: string;
  media_formats: {
    gif?: TenorMediaFormat;
    tinygif?: TenorMediaFormat;
  };
}

interface TenorResponse {
  results: TenorResult[];
  next: string;
}

function parseTenorResults(data: TenorResponse): GifItem[] {
  if (!data?.results) return [];
  return data.results
    .map((r) => {
      const gif = r.media_formats?.gif;
      const tiny = r.media_formats?.tinygif;
      if (!gif) return null;
      return {
        id: r.id,
        title: r.title || '',
        url: gif.url,
        previewUrl: tiny?.url || gif.url,
        width: tiny?.dims?.[0] || gif.dims?.[0] || 220,
        height: tiny?.dims?.[1] || gif.dims?.[1] || 160,
      } satisfies GifItem;
    })
    .filter(Boolean) as GifItem[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const COLUMNS = 2;
const GAP = 4;

export const GifPicker = forwardRef<View, GifPickerProps>(
  function GifPicker({ size = 'md', onSelect, relayUrl, style: userStyle, ...rest }, ref) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const sizeConfig = emojiPickerSizeMap[size];

    // Clamp width to screen
    const screenWidth = Dimensions.get('window').width;
    const clampedWidth = Math.min(sizeConfig.width, screenWidth - 24);

    // State
    const [query, setQuery] = useState('');
    const [gifs, setGifs] = useState<GifItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [nextPos, setNextPos] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const abortRef = useRef<AbortController | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Fetch helper ──────────────────────────────────────────────────

    const fetchGifs = useCallback(
      async (searchQuery: string, pos?: string | null) => {
        // Cancel any in-flight request
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const isSearch = searchQuery.trim().length > 0;
        const endpoint = isSearch ? '/api/gif/search' : '/api/gif/trending';
        const params = new URLSearchParams({ limit: '20' });
        if (isSearch) params.set('q', searchQuery.trim());
        if (pos) params.set('pos', pos);

        const url = `${relayUrl}${endpoint}?${params.toString()}`;

        try {
          setLoading(true);
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data: TenorResponse = await response.json();
          const items = parseTenorResults(data);

          if (pos) {
            // Append for pagination
            setGifs((prev) => [...prev, ...items]);
          } else {
            // Replace for new search/trending
            setGifs(items);
          }

          setNextPos(data.next || null);
          setHasMore(items.length > 0 && !!data.next);
        } catch (e: any) {
          if (e?.name !== 'AbortError') {
            console.warn('[GifPicker] Fetch failed:', e);
          }
        } finally {
          setLoading(false);
        }
      },
      [relayUrl],
    );

    // ── Initial load (trending) ───────────────────────────────────────

    useEffect(() => {
      fetchGifs('');
      return () => { abortRef.current?.abort(); };
    }, [fetchGifs]);

    // ── Search with debounce ──────────────────────────────────────────

    const handleSearch = useCallback(
      (value: string) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          setGifs([]);
          setNextPos(null);
          setHasMore(true);
          fetchGifs(value);
        }, 300);
      },
      [fetchGifs],
    );

    const handleClear = useCallback(() => {
      setQuery('');
      setGifs([]);
      setNextPos(null);
      setHasMore(true);
      fetchGifs('');
    }, [fetchGifs]);

    // ── Pagination ────────────────────────────────────────────────────

    const handleEndReached = useCallback(() => {
      if (!loading && hasMore && nextPos) {
        fetchGifs(query, nextPos);
      }
    }, [loading, hasMore, nextPos, query, fetchGifs]);

    // ── Layout ────────────────────────────────────────────────────────

    const contentPadding = 8;
    const cellWidth = Math.floor((clampedWidth - contentPadding * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

    // ── Styles ────────────────────────────────────────────────────────

    const containerStyle = useMemo<ViewStyle>(
      () => ({
        width: clampedWidth,
        height: sizeConfig.height,
        backgroundColor: themeColors.background.raised,
        borderRadius: theme.radii.xl ?? 16,
        borderWidth: 1,
        borderColor: themeColors.border.subtle,
        overflow: 'hidden',
      }),
      [clampedWidth, sizeConfig, themeColors, theme],
    );

    const attributionStyle = useMemo<TextStyle>(
      () => ({
        fontSize: 10,
        color: themeColors.text.tertiary,
        textAlign: 'center',
        paddingVertical: 4,
      }),
      [themeColors],
    );

    // ── Render cell ───────────────────────────────────────────────────

    const renderItem = useCallback(
      ({ item }: { item: GifItem }) => {
        const aspectRatio = item.width / item.height;
        const cellHeight = Math.round(cellWidth / aspectRatio);

        return (
          <Pressable
            onPress={() => onSelect?.(item)}
            style={({ pressed }) => ({
              width: cellWidth,
              height: cellHeight,
              borderRadius: 6,
              overflow: 'hidden',
              opacity: pressed ? 0.7 : 1,
              marginBottom: GAP,
            })}
            accessibilityLabel={item.title || 'GIF'}
            accessibilityRole="button"
          >
            <Image
              source={{ uri: item.previewUrl }}
              style={{ width: cellWidth, height: cellHeight }}
              resizeMode="cover"
            />
          </Pressable>
        );
      },
      [cellWidth, onSelect],
    );

    const keyExtractor = useCallback((item: GifItem) => item.id, []);

    // ── Footer ────────────────────────────────────────────────────────

    const renderFooter = useCallback(() => {
      if (loading && gifs.length > 0) {
        return (
          <View style={{ paddingVertical: 12, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={themeColors.text.tertiary} />
          </View>
        );
      }
      return <Text style={attributionStyle}>Powered by Tenor</Text>;
    }, [loading, gifs.length, themeColors, attributionStyle]);

    // ── Empty / loading state ─────────────────────────────────────────

    const renderEmpty = useCallback(() => {
      if (loading) {
        return (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
            <ActivityIndicator size="large" color={themeColors.text.tertiary} />
          </View>
        );
      }
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
          <Text style={{ color: themeColors.text.tertiary, fontSize: 13 }}>
            {query ? 'No GIFs found' : 'Search for GIFs'}
          </Text>
        </View>
      );
    }, [loading, query, themeColors]);

    // ── Render ────────────────────────────────────────────────────────

    return (
      <View ref={ref} style={[containerStyle, userStyle]} {...rest}>
        {/* Search bar */}
        <View style={{ padding: contentPadding, paddingBottom: 4 }}>
          <SearchInput
            size="sm"
            placeholder="Search GIFs..."
            value={query}
            onValueChange={handleSearch}
            onClear={handleClear}
            loading={loading && gifs.length === 0}
            fullWidth
            onSurface
          />
        </View>

        {/* GIF grid */}
        <FlatList
          data={gifs}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={COLUMNS}
          columnWrapperStyle={{
            gap: GAP,
            paddingHorizontal: contentPadding,
          }}
          contentContainerStyle={{
            paddingBottom: contentPadding,
          }}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    );
  },
);

GifPicker.displayName = 'GifPicker';
