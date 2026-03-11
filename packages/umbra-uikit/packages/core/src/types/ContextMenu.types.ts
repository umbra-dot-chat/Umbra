/**
 * @module ContextMenu
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ContextMenuProps {
  children?: React.ReactNode;
}

export interface ContextMenuTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export interface ContextMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export interface ContextMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Callback when the item is selected. */
  onSelect?: () => void;
  /** Disables the item. @default false */
  disabled?: boolean;
  /** Styles the item as destructive (red). @default false */
  destructive?: boolean;
  /** Icon rendered before the label. */
  icon?: React.ReactNode;
  /** Keyboard shortcut hint rendered on the right. */
  shortcut?: string;
  children?: React.ReactNode;
}

export interface ContextMenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}
