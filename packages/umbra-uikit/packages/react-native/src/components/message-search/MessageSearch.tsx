/**
 * @module components/message-search
 * @description React Native MessageSearch for the Wisp design system.
 *
 * Reuses color resolution from `@coexist/wisp-core`. Renders via `<View>` + `<Text>`.
 */

import React, { forwardRef, useMemo, useCallback, useEffect } from 'react';
import { Platform, View, Text, Pressable, ScrollView } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type {
  SearchResult,
  SearchFilter,
} from '@coexist/wisp-core/types/MessageSearch.types';
import {
  resolveMessageSearchColors,
} from '@coexist/wisp-core/styles/MessageSearch.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import { SearchInput } from '../search-input';
import Svg, { Line, Circle } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Gradient highlight helpers
// ---------------------------------------------------------------------------

const GRADIENT_COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#8B5CF6'];
const GRADIENT_SPEED = 3000;
const HIGHLIGHT_KEYFRAMES_ID = 'wisp-search-highlight-keyframes';

let highlightKeyframesInjected = false;

function injectHighlightKeyframes(): void {
  if (highlightKeyframesInjected || typeof document === 'undefined') return;
  highlightKeyframesInjected = true;
  const sheet = document.createElement('style');
  sheet.id = HIGHLIGHT_KEYFRAMES_ID;
  sheet.textContent = `@keyframes wisp-gradient-shift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}`;
  document.head.appendChild(sheet);
}

/**
 * Split text into segments, highlighting substrings that match the query
 * with an animated gradient on web, or accent color on native.
 */
function renderHighlightedText(
  text: string,
  query: string,
  accentColor: string,
): React.ReactNode {
  const trimmed = query.trim();
  if (!trimmed) return text;

  // Escape regex special chars in the query
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  if (parts.length <= 1) return text;

  const isWeb = Platform.OS === 'web';
  const gradientStr = `linear-gradient(90deg, ${GRADIENT_COLORS.join(', ')})`;

  return parts.map((part, i) => {
    const isMatch = regex.test(part);
    // Reset lastIndex since we re-use the regex with `g` flag
    regex.lastIndex = 0;

    if (!isMatch) return part;

    if (isWeb) {
      return (
        <Text
          key={i}
          style={{
            backgroundImage: gradientStr,
            backgroundSize: '300% 300%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            animationName: 'wisp-gradient-shift',
            animationDuration: `${GRADIENT_SPEED}ms`,
            animationTimingFunction: 'ease',
            animationIterationCount: 'infinite',
            fontWeight: '600',
          } as any}
        >
          {part}
        </Text>
      );
    }

    // Native fallback: accent-colored bold text
    return (
      <Text key={i} style={{ color: accentColor, fontWeight: '600' }}>
        {part}
      </Text>
    );
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MessageSearchProps extends ViewProps {
  /** Current search query string. */
  query: string;
  /** Called when the search query changes. */
  onQueryChange: (query: string) => void;
  /** Search results to display. */
  results: SearchResult[];
  /** Active filters. */
  filters?: SearchFilter[];
  /** Called when a filter is removed. */
  onFilterRemove?: (filter: SearchFilter) => void;
  /** Called when a result is clicked. */
  onResultClick?: (result: SearchResult) => void;
  /** Whether search is in progress. @default false */
  loading?: boolean;
  /** Total result count (for display, may differ from results.length if paginated). */
  totalResults?: number;
  /** Placeholder text for the search input. @default 'Search messages...' */
  placeholder?: string;
  /** Called when the close/clear button is clicked. */
  onClose?: () => void;
  /** Show animated gradient border on the search input when focused. @default false */
  gradientBorder?: boolean;
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function SearchIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={11} cy={11} r={8} />
      <Line x1={21} y1={21} x2={16.65} y2={16.65} />
    </Svg>
  );
}

function CloseIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={18} y1={6} x2={6} y2={18} />
      <Line x1={6} y1={6} x2={18} y2={18} />
    </Svg>
  );
}

function FilterRemoveIcon({ size = 10, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={18} y1={6} x2={6} y2={18} />
      <Line x1={6} y1={6} x2={18} y2={18} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Default Avatar
// ---------------------------------------------------------------------------

function DefaultAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
        {initials}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// MessageSearch
// ---------------------------------------------------------------------------

/**
 * MessageSearch -- A search panel with query input, active filter pills,
 * and a scrollable list of message result previews.
 *
 * @remarks
 * Displays a search input, optional filter pills, result count, and a
 * scrollable list of search results with sender info, content snippet,
 * timestamp, and channel name. Supports loading and empty states.
 *
 * @example
 * ```tsx
 * <MessageSearch
 *   query={query}
 *   onQueryChange={setQuery}
 *   results={searchResults}
 *   filters={activeFilters}
 *   onFilterRemove={(f) => removeFilter(f)}
 *   onResultClick={(r) => navigateToMessage(r.id)}
 *   onClose={() => setSearchOpen(false)}
 * />
 * ```
 */
export const MessageSearch = forwardRef<View, MessageSearchProps>(
  function MessageSearch(
    {
      query,
      onQueryChange,
      results,
      filters,
      onFilterRemove,
      onResultClick,
      loading = false,
      totalResults,
      placeholder = 'Search messages...',
      onClose,
      gradientBorder = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    // -- Colors ---------------------------------------------------------------
    const colors = useMemo(
      () => resolveMessageSearchColors(theme),
      [theme],
    );

    // Inject gradient keyframes on web (once)
    useEffect(() => {
      if (Platform.OS === 'web') injectHighlightKeyframes();
    }, []);

    // -- Styles ---------------------------------------------------------------
    const containerStyle: ViewStyle = {
      flex: 1,
      backgroundColor: colors.bg,
    };

    const headerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.sm,
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      minHeight: 56,
    };

    const closeButtonStyle: ViewStyle = {
      width: 28,
      height: 28,
      borderRadius: defaultRadii.md,
      alignItems: 'center',
      justifyContent: 'center',
    };

    const filtersContainerStyle: ViewStyle = {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: defaultSpacing.xs,
      paddingVertical: defaultSpacing.xs,
      paddingHorizontal: defaultSpacing.md,
    };

    const pillStyle: ViewStyle & TextStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      height: 24,
      paddingHorizontal: 8,
      backgroundColor: colors.pillBg,
      borderWidth: 1,
      borderColor: colors.pillBorder,
      borderRadius: defaultRadii.full,
    };

    const pillTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      lineHeight: defaultTypography.sizes['2xs'].lineHeight,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: colors.pillText,
    };

    const pillRemoveStyle: ViewStyle = {
      width: 14,
      height: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: defaultRadii.full,
    };

    const resultItemStyle: ViewStyle = {
      flexDirection: 'row',
      gap: defaultSpacing.sm,
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.md,
      backgroundColor: colors.resultBg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    };

    const senderTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.resultSender,
    };

    const contentTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      fontWeight: String(defaultTypography.weights.regular) as TextStyle['fontWeight'],
      color: colors.resultContent,
    };

    const timestampTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      lineHeight: defaultTypography.sizes['2xs'].lineHeight,
      color: colors.resultTimestamp,
    };

    const channelTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      lineHeight: defaultTypography.sizes['2xs'].lineHeight,
      color: colors.resultChannel,
    };

    const emptyContainerStyle: ViewStyle = {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: defaultSpacing.sm,
      padding: defaultSpacing.xl,
    };

    const emptyTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      color: colors.emptyText,
      textAlign: 'center',
    };

    const loadingContainerStyle: ViewStyle = {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: defaultSpacing.xl,
    };

    const loadingTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      color: colors.loadingText,
    };

    const countTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      fontWeight: String(defaultTypography.weights.regular) as TextStyle['fontWeight'],
      color: colors.countText,
      paddingVertical: defaultSpacing.xs,
      paddingHorizontal: defaultSpacing.md,
    };

    // -- Handlers -------------------------------------------------------------
    const handleResultClick = useCallback(
      (result: SearchResult) => {
        onResultClick?.(result);
      },
      [onResultClick],
    );

    const handleFilterRemove = useCallback(
      (filter: SearchFilter) => {
        onFilterRemove?.(filter);
      },
      [onFilterRemove],
    );

    // -- Derived values -------------------------------------------------------
    const displayCount = totalResults ?? results.length;
    const hasFilters = filters && filters.length > 0;
    const hasQuery = query.trim().length > 0;
    const showEmpty = !loading && hasQuery && results.length === 0;
    const showResults = !loading && results.length > 0;

    return (
      <View
        ref={ref}
        accessibilityRole="summary"
        accessibilityLabel="Message search"
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        {/* Header with search input and close button */}
        <View style={headerStyle}>
          <SearchInput
            value={query}
            onValueChange={onQueryChange}
            placeholder={placeholder}
            size="sm"
            fullWidth
            loading={loading}
            gradientBorder={gradientBorder}
            onClear={() => onQueryChange('')}
          />
          {onClose && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close search"
              onPress={onClose}
              style={closeButtonStyle}
            >
              <CloseIcon size={16} color={colors.headerTextMuted} />
            </Pressable>
          )}
        </View>

        {/* Filter pills */}
        {hasFilters && (
          <View style={filtersContainerStyle}>
            {filters!.map((filter, idx) => (
              <View key={`${filter.type}-${filter.value}-${idx}`} style={pillStyle}>
                <Text style={pillTextStyle}>
                  {filter.type}: {filter.value}
                </Text>
                {onFilterRemove && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${filter.type} filter`}
                    onPress={() => handleFilterRemove(filter)}
                    style={pillRemoveStyle}
                  >
                    <FilterRemoveIcon size={10} color={colors.pillText} />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Result count */}
        {showResults && (
          <Text style={countTextStyle}>
            {displayCount} {displayCount === 1 ? 'result' : 'results'} found
          </Text>
        )}

        {/* Results container */}
        <ScrollView style={{ flex: 1 }}>
          {/* Loading state */}
          {loading && (
            <View style={loadingContainerStyle}>
              <Text style={loadingTextStyle}>Searching...</Text>
            </View>
          )}

          {/* Empty state */}
          {showEmpty && (
            <View style={emptyContainerStyle}>
              <SearchIcon size={32} color={colors.emptyText} />
              <Text style={emptyTextStyle}>
                No results found for &ldquo;{query}&rdquo;
              </Text>
            </View>
          )}

          {/* Result items */}
          {showResults &&
            results.map((result) => (
              <Pressable
                key={result.id}
                accessibilityRole="button"
                onPress={() => handleResultClick(result)}
                style={resultItemStyle}
              >
                {/* Avatar */}
                <View style={{ flexShrink: 0 }}>
                  {result.avatar || <DefaultAvatar name={result.sender} />}
                </View>

                {/* Content body */}
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  {/* Sender row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <Text style={senderTextStyle} numberOfLines={1}>{result.sender}</Text>
                    <Text style={timestampTextStyle}>{result.timestamp}</Text>
                  </View>

                  {/* Message content with gradient-highlighted matches */}
                  <Text style={contentTextStyle} numberOfLines={2}>
                    {renderHighlightedText(result.content, query, colors.highlightText)}
                  </Text>

                  {/* Channel name */}
                  {result.channelName && (
                    <Text style={channelTextStyle} numberOfLines={1}>#{result.channelName}</Text>
                  )}
                </View>
              </Pressable>
            ))}
        </ScrollView>
      </View>
    );
  },
);

MessageSearch.displayName = 'MessageSearch';
