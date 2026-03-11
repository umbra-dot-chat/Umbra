/**
 * @module SearchInput
 */
import type React from 'react';
import type { ComponentSize } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link SearchInput} component.
 *
 * @remarks
 * A specialized input pre-configured with a search icon, clear button,
 * loading spinner, and optional debounced search callback.
 */
export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Input size token.
   * @default 'md'
   */
  size?: ComponentSize;

  /**
   * Callback fired on Enter key or after debounce period.
   */
  onSearch?: (value: string) => void;

  /**
   * Callback fired when the clear button is clicked.
   */
  onClear?: () => void;

  /**
   * When true, shows a spinner in the trailing slot.
   * @default false
   */
  loading?: boolean;

  /**
   * Debounce delay in milliseconds. When > 0, `onSearch` fires after the
   * user stops typing for this duration.
   * @default 0
   */
  debounceMs?: number;

  /**
   * When true, the input stretches to 100% of its container width.
   * @default false
   */
  fullWidth?: boolean;
}
