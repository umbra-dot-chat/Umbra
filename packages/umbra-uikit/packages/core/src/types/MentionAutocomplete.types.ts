/**
 * @module types/MentionAutocomplete
 * @description Type definitions for the MentionAutocomplete component —
 * a dropdown overlay for @mention user search.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Mention user
// ---------------------------------------------------------------------------

/**
 * Represents a user in the mention autocomplete dropdown.
 */
export interface MentionUser {
  /** Unique user identifier. */
  id: string;
  /** Display name shown in the dropdown. */
  name: string;
  /** Optional username (e.g. "@alice"). */
  username?: string;
  /** Avatar element or image URL. */
  avatar?: React.ReactNode;
  /** Whether the user is online. */
  online?: boolean;
}

// ---------------------------------------------------------------------------
// Mention role (community roles)
// ---------------------------------------------------------------------------

/**
 * Represents a role that can be @mentioned in community channels.
 */
export interface MentionRole {
  /** Unique role identifier. */
  id: string;
  /** Role display name. */
  name: string;
  /** Role color (hex). */
  color?: string;
  /** Number of members with this role. */
  memberCount?: number;
}

// ---------------------------------------------------------------------------
// Mention special (@everyone, @here)
// ---------------------------------------------------------------------------

/** Type of special mention. */
export type MentionSpecialType = 'everyone' | 'here';

/**
 * Represents a special mention target (@everyone, @here).
 */
export interface MentionSpecial {
  /** Special mention type. */
  type: MentionSpecialType;
  /** Description shown below the label. */
  description?: string;
}

// ---------------------------------------------------------------------------
// Union mention item
// ---------------------------------------------------------------------------

/**
 * Discriminated union for all mention item types.
 */
export type MentionItem =
  | { kind: 'user'; data: MentionUser }
  | { kind: 'role'; data: MentionRole }
  | { kind: 'special'; data: MentionSpecial };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the MentionAutocomplete component.
 *
 * @remarks
 * Renders a dropdown list of matching users for @mention autocomplete.
 * Typically positioned above or below the input area. Supports keyboard
 * navigation with arrow keys and Enter to select.
 */
export interface MentionAutocompleteProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Filtered list of matching users. */
  users: MentionUser[];

  /** The current search query (text after "@"). */
  query?: string;

  /** Index of the currently highlighted item (keyboard navigation). */
  activeIndex?: number;

  /** Called when a user is selected. */
  onSelect: (user: MentionUser) => void;

  /** Called when the active index changes (keyboard navigation). */
  onActiveIndexChange?: (index: number) => void;

  /** Maximum number of visible items before scrolling. @default 5 */
  maxVisible?: number;

  /** Whether the dropdown is currently visible. @default true */
  open?: boolean;

  /** Show loading state. @default false */
  loading?: boolean;

  /** Text shown when no users match. @default 'No users found' */
  emptyText?: string;

  // -- Community mention extensions --

  /** Roles available for @role mention. */
  roles?: MentionRole[];

  /** Show special mentions (@everyone, @here) at the top. @default false */
  showSpecialMentions?: boolean;

  /** Called when any mention item (user, role, or special) is selected. */
  onItemSelect?: (item: MentionItem) => void;
}
