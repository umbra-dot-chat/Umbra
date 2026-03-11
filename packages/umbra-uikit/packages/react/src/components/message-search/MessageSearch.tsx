/**
 * @module MessageSearch
 * @description Search panel with filters and message result previews.
 */
import React, { forwardRef, useMemo, useCallback } from 'react';
import type {
  MessageSearchProps,
  SearchResult,
  SearchFilter,
} from '@coexist/wisp-core/types/MessageSearch.types';
import {
  resolveMessageSearchColors,
  buildMessageSearchContainerStyle,
  buildSearchHeaderStyle,
  buildSearchInputStyle,
  buildSearchCloseStyle,
  buildFiltersContainerStyle,
  buildFilterPillStyle,
  buildFilterRemoveStyle,
  buildResultsContainerStyle,
  buildResultItemStyle,
  buildResultSenderStyle,
  buildResultContentStyle,
  buildResultTimestampStyle,
  buildResultChannelStyle,
  buildSearchEmptyStyle,
  buildSearchLoadingStyle,
  buildResultCountStyle,
} from '@coexist/wisp-core/styles/MessageSearch.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function SearchIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CloseIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function FilterRemoveIcon({ size = 10, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
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
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#333',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
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
export const MessageSearch = forwardRef<HTMLDivElement, MessageSearchProps>(
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
      style: userStyle,
      className,
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

    // -- Styles ---------------------------------------------------------------
    const containerStyle = useMemo(
      () => buildMessageSearchContainerStyle(colors, theme),
      [colors, theme],
    );

    const headerStyle = useMemo(
      () => buildSearchHeaderStyle(colors, theme),
      [colors, theme],
    );

    const inputStyle = useMemo(
      () => buildSearchInputStyle(colors, theme),
      [colors, theme],
    );

    const closeBtnStyle = useMemo(
      () => buildSearchCloseStyle(colors, theme),
      [colors, theme],
    );

    const filtersContainerStyle = useMemo(
      () => buildFiltersContainerStyle(theme),
      [theme],
    );

    const pillStyle = useMemo(
      () => buildFilterPillStyle(colors, theme),
      [colors, theme],
    );

    const pillRemoveStyle = useMemo(
      () => buildFilterRemoveStyle(colors, theme),
      [colors, theme],
    );

    const resultsContainerStyle = useMemo(
      () => buildResultsContainerStyle(theme),
      [theme],
    );

    const resultItemStyle = useMemo(
      () => buildResultItemStyle(colors, theme),
      [colors, theme],
    );

    const senderStyle = useMemo(
      () => buildResultSenderStyle(colors, theme),
      [colors, theme],
    );

    const contentStyle = useMemo(
      () => buildResultContentStyle(colors, theme),
      [colors, theme],
    );

    const timestampStyle = useMemo(
      () => buildResultTimestampStyle(colors, theme),
      [colors, theme],
    );

    const channelStyle = useMemo(
      () => buildResultChannelStyle(colors, theme),
      [colors, theme],
    );

    const emptyStyle = useMemo(
      () => buildSearchEmptyStyle(colors, theme),
      [colors, theme],
    );

    const loadingStyle = useMemo(
      () => buildSearchLoadingStyle(colors, theme),
      [colors, theme],
    );

    const countStyle = useMemo(
      () => buildResultCountStyle(colors, theme),
      [colors, theme],
    );

    // -- Handlers -------------------------------------------------------------
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onQueryChange(e.target.value);
      },
      [onQueryChange],
    );

    const handleResultClick = useCallback(
      (result: SearchResult) => {
        onResultClick?.(result);
      },
      [onResultClick],
    );

    const handleFilterRemove = useCallback(
      (e: React.MouseEvent, filter: SearchFilter) => {
        e.stopPropagation();
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
      <div
        ref={ref}
        role="complementary"
        aria-label="Message search"
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        {/* Header with search input and close button */}
        <div role="search" style={headerStyle}>
          <SearchIcon size={16} color={colors.headerTextMuted} />
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            aria-label="Search messages"
            style={inputStyle}
          />
          {onClose && (
            <button
              type="button"
              aria-label="Close search"
              style={closeBtnStyle}
              onClick={onClose}
            >
              <CloseIcon size={16} />
            </button>
          )}
        </div>

        {/* Filter pills */}
        {hasFilters && (
          <div style={filtersContainerStyle}>
            {filters!.map((filter, idx) => (
              <span key={`${filter.type}-${filter.value}-${idx}`} style={pillStyle}>
                {filter.type}: {filter.value}
                {onFilterRemove && (
                  <button
                    type="button"
                    aria-label={`Remove ${filter.type} filter`}
                    style={pillRemoveStyle}
                    onClick={(e) => handleFilterRemove(e, filter)}
                  >
                    <FilterRemoveIcon size={10} />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Result count */}
        {showResults && (
          <div style={countStyle}>
            {displayCount} {displayCount === 1 ? 'result' : 'results'} found
          </div>
        )}

        {/* Results container */}
        <div style={resultsContainerStyle}>
          {/* Loading state */}
          {loading && (
            <div style={loadingStyle}>Searching...</div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div style={emptyStyle}>
              <SearchIcon size={32} color={colors.emptyText} />
              <span>No results found for &ldquo;{query}&rdquo;</span>
            </div>
          )}

          {/* Result items */}
          {showResults &&
            results.map((result) => (
              <div
                key={result.id}
                role="button"
                tabIndex={0}
                style={resultItemStyle}
                onClick={() => handleResultClick(result)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleResultClick(result);
                  }
                }}
              >
                {/* Avatar */}
                {result.avatar || <DefaultAvatar name={result.sender} />}

                {/* Content body */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Sender row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={senderStyle}>{result.sender}</span>
                    <span style={timestampStyle}>{result.timestamp}</span>
                  </div>

                  {/* Message content */}
                  <p style={contentStyle}>{result.content}</p>

                  {/* Channel name */}
                  {result.channelName && (
                    <span style={channelStyle}>#{result.channelName}</span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  },
);

MessageSearch.displayName = 'MessageSearch';
