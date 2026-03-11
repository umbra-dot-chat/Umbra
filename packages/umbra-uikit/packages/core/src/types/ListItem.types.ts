/**
 * Type definitions for the Wisp ListItem layout primitive.
 *
 * @remarks
 * ListItem provides a three-region horizontal layout:
 * leading slot (icon/avatar) + content slot (title/subtitle) + trailing slot (actions/metadata).
 * The building block for all list-based components.
 *
 * @module primitives/list-item
 */

import type React from 'react';
import type { ThemeSpacing } from '../theme/types';
import { defaultSpacing } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

/** Available size presets for ListItem. */
export const listItemSizes = ['sm', 'md', 'lg'] as const;

/** Union of valid ListItem size preset names. */
export type ListItemSize = (typeof listItemSizes)[number];

/**
 * Dimension tokens for a single ListItem size preset.
 *
 * @remarks
 * Each size maps to a fixed set of pixel values controlling the
 * list item's min-height, padding, and inter-slot gap.
 */
export interface ListItemSizeConfig {
  /** Minimum height in px. */
  minHeight: number;
  /** Horizontal padding in px. */
  paddingX: number;
  /** Vertical padding in px. */
  paddingY: number;
  /** Gap between leading/content/trailing regions in px. */
  gap: number;
}

/**
 * Maps each {@link ListItemSize} to its {@link ListItemSizeConfig} dimension tokens.
 */
export const listItemSizeMap: Record<ListItemSize, ListItemSizeConfig> = {
  sm: { minHeight: 28, paddingX: defaultSpacing.sm, paddingY: defaultSpacing['2xs'], gap: defaultSpacing.sm },
  md: { minHeight: 36, paddingX: defaultSpacing.md, paddingY: defaultSpacing.xs, gap: defaultSpacing.md },
  lg: { minHeight: 44, paddingX: defaultSpacing.lg, paddingY: defaultSpacing.sm, gap: defaultSpacing.md },
};

// ---------------------------------------------------------------------------
// ListItemProps
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link ListItem} component.
 *
 * @remarks
 * Extends standard HTML element attributes. The `as` prop enables
 * polymorphic rendering so a ListItem can be a `<li>`, `<a>`, or
 * any other element while retaining its three-slot layout.
 */
export interface ListItemProps extends React.HTMLAttributes<HTMLElement> {
  /** Render as a custom element. @default 'div' */
  as?: React.ElementType;

  /** Size preset. @default 'md' */
  size?: ListItemSize;

  /** Leading slot — icon, avatar, checkbox, etc. */
  leading?: React.ReactNode;

  /** Trailing slot — actions, metadata, badges, etc. */
  trailing?: React.ReactNode;

  /** Vertical alignment of leading/trailing with content. @default 'center' */
  align?: 'start' | 'center' | 'end';

  /** Make the list item interactive (add hover/active styles). @default false */
  interactive?: boolean;

  /** Whether the item is in an active/selected state. @default false */
  active?: boolean;

  /** Whether the item is disabled. @default false */
  disabled?: boolean;
}
