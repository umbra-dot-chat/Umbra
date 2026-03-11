/**
 * @module DropdownMenu.types
 * @description Type definitions for the Wisp DropdownMenu primitive.
 */

import type React from 'react';
import type { SurfaceVariant } from '../tokens/shared';

/** Available horizontal alignment options for {@link DropdownMenuContentProps.align}. */
export const dropdownMenuAligns = ['start', 'center', 'end'] as const;

/** Union of allowed horizontal alignment values. */
export type DropdownMenuAlign = (typeof dropdownMenuAligns)[number];

/** Available vertical side options for {@link DropdownMenuContentProps.side}. */
export const dropdownMenuSides = ['top', 'bottom'] as const;

/** Union of allowed vertical side values. */
export type DropdownMenuSide = (typeof dropdownMenuSides)[number];

/** Props accepted by the root {@link DropdownMenu} compound component. */
export interface DropdownMenuProps {
  /**
   * Controlled open state. When provided, the component becomes controlled
   * and `onOpenChange` should be used to update this value.
   */
  open?: boolean;
  /**
   * Initial open state for uncontrolled usage.
   * @default false
   */
  defaultOpen?: boolean;
  /** Callback fired when the menu open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Compound component children (Trigger, Content, etc.). */
  children: React.ReactNode;
}

/** Props accepted by the {@link DropdownMenuTrigger} component. */
export interface DropdownMenuTriggerProps {
  /** Content rendered inside the trigger button. */
  children: React.ReactNode;
  /**
   * When `true`, merges trigger props onto the child element instead
   * of wrapping it in a default `<button>`.
   * @default false
   */
  asChild?: boolean;
  /** Additional inline styles applied to the trigger element. */
  style?: React.CSSProperties;
  /** Additional CSS class name applied to the trigger element. */
  className?: string;
}

/** Props accepted by the {@link DropdownMenuContent} component. */
export interface DropdownMenuContentProps {
  /** Menu items and separators rendered inside the dropdown panel. */
  children: React.ReactNode;
  /**
   * Horizontal alignment of the content relative to the trigger.
   * @default 'start'
   */
  align?: DropdownMenuAlign;
  /**
   * Which side of the trigger the content should appear on.
   * @default 'bottom'
   */
  side?: DropdownMenuSide;
  /**
   * Distance in pixels between the trigger edge and the content panel.
   * @default 4
   */
  sideOffset?: number;
  /**
   * Surface rendering variant.
   * - `'solid'` (default) -- opaque raised background.
   * - `'glass'` -- frosted-glass / glassmorphism effect.
   * @default 'solid'
   */
  variant?: SurfaceVariant;
  /** Additional CSS class name applied to the content panel. */
  className?: string;
  /** Additional inline styles applied to the content panel. */
  style?: React.CSSProperties;
}

/** Props accepted by the {@link DropdownMenuItem} component. */
export interface DropdownMenuItemProps {
  /** Label content rendered inside the menu item. */
  children: React.ReactNode;
  /** Callback fired when the item is selected (clicked or activated via keyboard). */
  onSelect?: () => void;
  /**
   * When `true`, the item is visually muted and non-interactive.
   * @default false
   */
  disabled?: boolean;
  /**
   * When `true`, the item uses the theme danger color for destructive actions.
   * @default false
   */
  danger?: boolean;
  /** Optional leading icon rendered before the item label. */
  icon?: React.ReactNode;
  /** Optional keyboard shortcut label rendered trailing the item label. */
  shortcut?: string;
  /** Additional inline styles applied to the menu item. */
  style?: React.CSSProperties;
  /** Additional CSS class name applied to the menu item. */
  className?: string;
}

/** Props accepted by the {@link DropdownMenuSeparator} component. */
export interface DropdownMenuSeparatorProps {
  /** Additional inline styles applied to the separator. */
  style?: React.CSSProperties;
  /** Additional CSS class name applied to the separator. */
  className?: string;
}

/**
 * Internal context value shared between DropdownMenu compound components.
 *
 * @remarks
 * Not intended for direct consumer use -- accessed internally via
 * `useDropdownMenuContext()`.
 */
export interface DropdownMenuContextValue {
  /** Whether the dropdown menu is currently open. */
  open: boolean;
  /** Callback to request an open-state change. */
  onOpenChange: (open: boolean) => void;
  /** Ref to the trigger DOM element, used for positioning. */
  triggerRef: React.RefObject<HTMLElement | null>;
  /** Index of the currently keyboard-focused menu item (-1 when none). */
  activeIndex: number;
  /** Setter for the keyboard-focused menu item index. */
  setActiveIndex: (index: number) => void;
}
