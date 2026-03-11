/**
 * Type definitions for the Wisp Command palette primitive.
 *
 * @module primitives/command/types
 */

import type React from 'react';
import type { SurfaceVariant } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Size variants
// ---------------------------------------------------------------------------

/** All valid command palette size variant keys. */
export const commandSizes = ['sm', 'md', 'lg'] as const;

/** A command palette width preset -- `'sm'` | `'md'` | `'lg'`. */
export type CommandSize = (typeof commandSizes)[number];

/** Pixel max-width for each {@link CommandSize} variant. */
export const commandSizeMap: Record<CommandSize, number> = {
  sm: 400,
  md: 520,
  lg: 640,
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/** Registered item entry stored in the internal registry. */
export interface CommandItemEntry {
  id: string;
  value: string;
  groupId?: string;
  disabled?: boolean;
  keywords?: string[];
}

/** Internal React context value shared between Command compound components. */
export interface CommandContextValue {
  /** Current search query text. */
  search: string;
  /** Update the search query. */
  onSearchChange: (value: string) => void;
  /** ID of the currently keyboard-active item. */
  activeItemId: string | null;
  /** Set the keyboard-active item. */
  setActiveItemId: (id: string | null) => void;
  /** Callback when an item is selected. */
  onItemSelect: (value: string) => void;
  /** Register an item for search filtering and keyboard nav. */
  registerItem: (entry: CommandItemEntry) => void;
  /** Unregister an item when it unmounts. */
  unregisterItem: (id: string) => void;
  /** Get all currently visible (non-filtered) item IDs in DOM order. */
  getVisibleItemIds: () => string[];
  /** Custom filter function override. */
  filter?: (value: string, search: string, keywords?: string[]) => boolean;
  /** Whether keyboard nav wraps around. */
  loop: boolean;
  /** Current size preset. */
  size: CommandSize;
  /** Whether the palette is in a loading state. */
  loading: boolean;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props accepted by the root {@link Command} component. */
export interface CommandProps {
  /** Whether the command palette is open. */
  open: boolean;
  /** Callback fired when the open state should change. */
  onOpenChange: (open: boolean) => void;
  /** Callback fired when an item is selected. */
  onSelect?: (value: string) => void;
  /**
   * Width preset for the command palette.
   * @default 'md'
   */
  size?: CommandSize;
  /**
   * Custom filter function. Receives the item value, search text, and optional keywords.
   * Return `true` to show the item.
   */
  filter?: (value: string, search: string, keywords?: string[]) => boolean;
  /**
   * Whether keyboard navigation wraps from last to first and vice versa.
   * @default true
   */
  loop?: boolean;
  /**
   * Whether the palette is in a loading state (shows a spinner).
   * @default false
   */
  loading?: boolean;
  /**
   * Whether to close the palette when an item is selected.
   * @default true
   */
  closeOnSelect?: boolean;
  /**
   * Whether pressing Escape closes the palette.
   * @default true
   */
  closeOnEscape?: boolean;
  /** Additional CSS class name applied to the panel. */
  className?: string;
  /**
   * Surface rendering variant for the panel.
   * - `'solid'` -- opaque raised background (default).
   * - `'glass'` -- frosted-glass translucent background.
   * @default 'solid'
   */
  variant?: SurfaceVariant;
  /** Additional inline styles merged onto the panel. */
  style?: React.CSSProperties;
  /** Compound component children. */
  children: React.ReactNode;
}

/** Props accepted by the {@link CommandInput} component. */
export interface CommandInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  /** Placeholder text for the search input. */
  placeholder?: string;
  /** Optional icon component rendered before the input. */
  icon?: React.ComponentType<{ size?: number | string }>;
}

/** Props accepted by the {@link CommandList} component. */
export interface CommandListProps {
  /** List children (groups, items, empty, separator). */
  children: React.ReactNode;
  /** Additional CSS class name. */
  className?: string;
  /** Additional inline styles. */
  style?: React.CSSProperties;
}

/** Props accepted by the {@link CommandGroup} component. */
export interface CommandGroupProps {
  /** Optional heading label for the group. */
  heading?: string;
  /** Group children (items, separators). */
  children: React.ReactNode;
  /** Additional CSS class name. */
  className?: string;
  /** Additional inline styles. */
  style?: React.CSSProperties;
}

/** Props accepted by the {@link CommandItem} component. */
export interface CommandItemProps {
  /** Unique value and primary search target for this item. */
  value: string;
  /** Per-item select handler. */
  onSelect?: (value: string) => void;
  /**
   * Whether this item is disabled (non-selectable, skipped in keyboard nav).
   * @default false
   */
  disabled?: boolean;
  /** Optional icon component rendered before the label. */
  icon?: React.ComponentType<{ size?: number | string }>;
  /** Keyboard shortcut label (e.g. "Ctrl+K"). */
  shortcut?: string;
  /** Secondary description text rendered below the label. */
  description?: string;
  /** Additional search terms that don't appear in the label. */
  keywords?: string[];
  /** Label content. */
  children: React.ReactNode;
  /** Additional CSS class name. */
  className?: string;
  /** Additional inline styles. */
  style?: React.CSSProperties;
}

/** Props accepted by the {@link CommandSeparator} component. */
export interface CommandSeparatorProps {
  /** Additional CSS class name. */
  className?: string;
  /** Additional inline styles. */
  style?: React.CSSProperties;
}

/** Props accepted by the {@link CommandEmpty} component. */
export interface CommandEmptyProps {
  /** Custom empty state content. Defaults to "No results found." */
  children?: React.ReactNode;
  /** Additional CSS class name. */
  className?: string;
  /** Additional inline styles. */
  style?: React.CSSProperties;
}
