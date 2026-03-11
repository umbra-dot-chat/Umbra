/**
 * @module Navbar
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

export const navbarVariants = ['solid', 'transparent', 'glass'] as const;
export type NavbarVariant = (typeof navbarVariants)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  /** Visual variant. @default 'solid' */
  variant?: NavbarVariant;
  /** Sticks the navbar to the top of the viewport. @default false */
  sticky?: boolean;
  /** Navbar height in px. @default 56 */
  height?: number;
  children?: React.ReactNode;
}

export interface NavbarBrandProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export interface NavbarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Alignment of items within the content area. @default 'end' */
  align?: 'start' | 'center' | 'end';
  children?: React.ReactNode;
}

export interface NavbarItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Highlights this item as the active/current route. @default false */
  active?: boolean;
  children?: React.ReactNode;
}
