/**
 * @module MemberSearchFilter
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link MemberSearchFilter} component.
 *
 * @remarks
 * A search/filter input for the member list panel. Wraps SearchInput with
 * an optional result count badge.
 */
export interface MemberSearchFilterProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /**
   * Controlled search value.
   */
  value?: string;

  /**
   * Initial uncontrolled value.
   */
  defaultValue?: string;

  /**
   * Callback fired when the search value changes.
   */
  onChange?: (value: string) => void;

  /**
   * Callback fired when the clear button is clicked.
   */
  onClear?: () => void;

  /**
   * Placeholder text for the search input.
   * @default 'Search members...'
   */
  placeholder?: string;

  /**
   * Input size token.
   * @default 'sm'
   */
  size?: 'sm' | 'md';

  /**
   * When true, shows a loading spinner in the input.
   * @default false
   */
  loading?: boolean;

  /**
   * When set, displays a result count badge next to the input.
   */
  resultCount?: number;

  /**
   * When true, renders a skeleton placeholder instead of the real component.
   * @default false
   */
  skeleton?: boolean;
}
