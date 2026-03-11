/**
 * @module types/UserSearchResult
 * @description Type definitions for the UserSearchResult component —
 * a search result row for the "Add Friend" flow showing a user
 * with contextual request state.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Request state
// ---------------------------------------------------------------------------

export const userSearchRequestStates = ['none', 'pending', 'friends'] as const;
export type UserSearchRequestState = (typeof userSearchRequestStates)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the UserSearchResult component.
 *
 * @remarks
 * Renders a user row in search results with avatar, name, username,
 * mutual friends count, and a button whose state reflects the current
 * relationship (Send Request / Pending / Already Friends).
 */
export interface UserSearchResultProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Display name. */
  name: string;

  /** Username handle (e.g. "@alice"). */
  username?: string;

  /** Avatar element (typically an `<Avatar>` component). */
  avatar?: React.ReactNode;

  /** Current request / relationship state. @default 'none' */
  requestState?: UserSearchRequestState;

  /** Number of mutual friends. */
  mutualFriends?: number;

  /** Called when "Send Request" is pressed (only active in 'none' state). */
  onSendRequest?: () => void;

  /** Whether the item is disabled. @default false */
  disabled?: boolean;

  /** Show loading skeleton. @default false */
  skeleton?: boolean;
}
