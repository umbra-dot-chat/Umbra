/**
 * @module types/AdvancedSearchPanel
 * @description Type definitions for the AdvancedSearchPanel component --
 * extended search filters panel with dedicated inputs for advanced search syntax.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

/**
 * Shape of the advanced search filter state.
 */
export interface AdvancedSearchFilters {
  query?: string;
  fromUser?: string;
  inChannel?: string;
  before?: string;
  after?: string;
  hasFile?: boolean;
  hasReaction?: boolean;
  isPinned?: boolean;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the AdvancedSearchPanel component.
 */
export interface AdvancedSearchPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current filter state. */
  filters: AdvancedSearchFilters;

  /** Called when any filter changes. */
  onFiltersChange: (filters: AdvancedSearchFilters) => void;

  /** Called when the search button is clicked. */
  onSearch?: () => void;

  /** Called when the reset button is clicked. */
  onReset?: () => void;

  /** Available channels for the "in:" filter. */
  channels?: Array<{ id: string; name: string }>;

  /** Available users for the "from:" filter. */
  users?: Array<{ id: string; name: string }>;

  /** Whether search is in progress. */
  loading?: boolean;

  /** Total result count to display. */
  resultCount?: number;

  /** Panel title. @default 'Advanced Search' */
  title?: string;

  /** Whether to render in skeleton/loading state. */
  skeleton?: boolean;
}
