/**
 * @module types/MessageSearch
 * @description Type definitions for the MessageSearch component —
 * a search panel with filters and message result previews.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

/** A search result item. */
export interface SearchResult {
  /** Unique identifier. */
  id: string;
  /** Sender display name. */
  sender: string;
  /** Sender avatar element. */
  avatar?: React.ReactNode;
  /** Message content (may contain highlighted spans). */
  content: string;
  /** Timestamp of the message. */
  timestamp: string;
  /** Channel or conversation name where the message was found. */
  channelName?: string;
}

/** Available search filter types. */
export type SearchFilterType = 'from' | 'in' | 'has' | 'before' | 'after' | 'is';

/** An active search filter. */
export interface SearchFilter {
  /** Filter type. */
  type: SearchFilterType;
  /** Filter value (e.g. user name, channel name, date string). */
  value: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the MessageSearch component.
 */
export interface MessageSearchProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'results'> {
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

  // -- Community search extensions --

  /** Search scope: search across whole community or within a specific channel. */
  scope?: 'community' | 'channel';

  /** Called when the search scope changes. */
  onScopeChange?: (scope: 'community' | 'channel') => void;

  /** Called when a filter is added (e.g. from a filter picker UI). */
  onFilterAdd?: (filter: SearchFilter) => void;
}
