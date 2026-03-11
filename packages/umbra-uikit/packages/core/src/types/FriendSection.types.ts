/**
 * @module types/FriendSection
 * @description Type definitions for the FriendSection component —
 * a collapsible section header with count badge that groups friend list items.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the FriendSection component.
 *
 * @remarks
 * Wraps a group of FriendListItem or FriendRequestItem children with a
 * collapsible header showing the section title and item count.
 */
export interface FriendSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Section title (e.g. "Online", "Pending Requests"). */
  title: string;

  /** Item count displayed next to the title. */
  count?: number;

  /** Whether the section is initially collapsed. @default false */
  defaultCollapsed?: boolean;

  /** Controlled collapsed state. */
  collapsed?: boolean;

  /** Callback when collapsed state changes. */
  onCollapsedChange?: (collapsed: boolean) => void;

  /** Content (typically FriendListItem / FriendRequestItem children). */
  children?: React.ReactNode;

  /** Message shown when the section has no children. */
  emptyMessage?: string;
}
