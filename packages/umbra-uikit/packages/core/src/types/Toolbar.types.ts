/**
 * @module Toolbar.types
 *
 * Type definitions for the Wisp Toolbar layout primitive.
 *
 * @remarks
 * Toolbar is a horizontal action bar compound component with groups,
 * separators, and flexible spacing. It provides its size configuration
 * to child components via React context.
 */

import type React from 'react';
import type { ThemeSpacing } from '../theme/types';
import { defaultSpacing } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

/** Available toolbar size presets. */
export const toolbarSizes = ['sm', 'md', 'lg'] as const;

/** Union of toolbar size preset keys. */
export type ToolbarSize = (typeof toolbarSizes)[number];

// ---------------------------------------------------------------------------
// Variant
// ---------------------------------------------------------------------------

/** Available toolbar visual variants. */
export const toolbarVariants = ['elevated', 'transparent', 'pill'] as const;

/** Union of toolbar visual variant keys. */
export type ToolbarVariant = (typeof toolbarVariants)[number];

// ---------------------------------------------------------------------------
// Size configuration
// ---------------------------------------------------------------------------

/** Pixel-level measurements for a single toolbar size preset. */
export interface ToolbarSizeConfig {
  /** Total height of the toolbar in px. */
  height: number;
  /** Horizontal padding in px. */
  paddingX: number;
  /** Default gap between direct children in px. */
  gap: number;
  /** Height of the vertical separator line in px. */
  separatorHeight: number;
}

/** Maps each {@link ToolbarSize} to its concrete {@link ToolbarSizeConfig}. */
export const toolbarSizeMap: Record<ToolbarSize, ToolbarSizeConfig> = {
  sm: { height: 40, paddingX: defaultSpacing.sm, gap: defaultSpacing.xs, separatorHeight: 16 },
  md: { height: 48, paddingX: defaultSpacing.md, gap: defaultSpacing.sm, separatorHeight: 20 },
  lg: { height: 56, paddingX: defaultSpacing.lg, gap: defaultSpacing.sm, separatorHeight: 24 },
};

// ---------------------------------------------------------------------------
// Props — Toolbar (root)
// ---------------------------------------------------------------------------

/** Props for the root {@link Toolbar} component. */
export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Toolbar content (ToolbarGroup, ToolbarSeparator, or any React node). */
  children?: React.ReactNode;

  /**
   * Size preset controlling height, padding, gap, and separator height.
   * @default 'md'
   */
  size?: ToolbarSize;

  /**
   * Visual variant.
   * @default 'elevated'
   */
  variant?: ToolbarVariant;
}

// ---------------------------------------------------------------------------
// Props — ToolbarGroup
// ---------------------------------------------------------------------------

/** Props for the {@link ToolbarGroup} compound child component. */
export interface ToolbarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Grouped toolbar items. */
  children?: React.ReactNode;

  /**
   * Gap between children, resolved from the theme spacing scale.
   * @default 'xs'
   */
  gap?: keyof ThemeSpacing;
}

// ---------------------------------------------------------------------------
// Props — ToolbarSeparator
// ---------------------------------------------------------------------------

/**
 * Props for the {@link ToolbarSeparator} compound child component.
 *
 * @remarks
 * No additional props are needed; the separator's height is
 * derived from the parent Toolbar's size via React context.
 */
export interface ToolbarSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  // No additional props needed — size comes from context.
}
