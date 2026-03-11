/**
 * @module Sidebar.types
 *
 * Type definitions for the Wisp Sidebar layout primitive.
 *
 * @remarks
 * Sidebar is a vertical navigation compound component with sections and
 * items. It supports multiple width presets, left/right positioning, and
 * controlled or uncontrolled collapse state.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Sidebar Widths
// ---------------------------------------------------------------------------

/** Available sidebar width presets. */
export const sidebarWidths = ['collapsed', 'compact', 'default', 'wide'] as const;

/** Union of sidebar width preset keys. */
export type SidebarWidth = (typeof sidebarWidths)[number];

/** Maps each {@link SidebarWidth} to its pixel value. */
export const sidebarWidthMap: Record<SidebarWidth, number> = {
  collapsed: 48,
  compact: 64,
  default: 240,
  wide: 320,
};

// ---------------------------------------------------------------------------
// Sidebar Positions
// ---------------------------------------------------------------------------

/** Available sidebar anchor positions. */
export const sidebarPositions = ['left', 'right'] as const;

/** Union of sidebar position keys. */
export type SidebarPosition = (typeof sidebarPositions)[number];

// ---------------------------------------------------------------------------
// Sidebar Context
// ---------------------------------------------------------------------------

/** Value provided by the Sidebar's React context to descendant components. */
export interface SidebarContextValue {
  /** Whether the sidebar is currently in a narrow (collapsed or compact) state. */
  collapsed: boolean;
  /** The resolved width variant after applying collapsible logic. */
  width: SidebarWidth;
}

// ---------------------------------------------------------------------------
// Sidebar Props
// ---------------------------------------------------------------------------

/** Props for the root {@link Sidebar} component. */
export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  /** Sidebar content (SidebarSection, SidebarItem, or any React node). */
  children?: React.ReactNode;

  /**
   * Width variant controlling the sidebar's pixel width.
   * @default 'default'
   */
  width?: SidebarWidth;

  /**
   * Whether the sidebar supports collapsing via an internal toggle button.
   * @default false
   */
  collapsible?: boolean;

  /** Controlled collapsed state. When provided, the component becomes controlled. */
  collapsed?: boolean;

  /** Callback fired when the collapsed state changes (both controlled and uncontrolled modes). */
  onCollapsedChange?: (collapsed: boolean) => void;

  /**
   * Which edge the sidebar is anchored to.
   * @default 'left'
   */
  position?: SidebarPosition;
}

// ---------------------------------------------------------------------------
// SidebarSection Props
// ---------------------------------------------------------------------------

/** Props for the {@link SidebarSection} compound child component. */
export interface SidebarSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Section content, typically {@link SidebarItem} elements. */
  children?: React.ReactNode;

  /** Optional section heading text. Hidden when the sidebar is collapsed. */
  title?: string;

  /**
   * Whether the section can be collapsed by clicking its title.
   * @default false
   */
  collapsible?: boolean;

  /**
   * Whether the section starts in a collapsed state.
   * @default false
   */
  defaultCollapsed?: boolean;
}

// ---------------------------------------------------------------------------
// SidebarItem Props
// ---------------------------------------------------------------------------

/** Props for the {@link SidebarItem} compound child component. */
export interface SidebarItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Leading icon node. */
  icon?: React.ReactNode;

  /** Navigation label text. */
  label: string;

  /**
   * Whether this item is the active / current route.
   * @default false
   */
  active?: boolean;

  /**
   * Whether interaction is disabled.
   * @default false
   */
  disabled?: boolean;

  /** Trailing badge or count node. */
  badge?: React.ReactNode;

  /** Optional link href -- when provided, the item renders as an `<a>` element. */
  href?: string;

  /** Click handler. */
  onClick?: (e: React.MouseEvent) => void;
}
