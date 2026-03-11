/**
 * @module types/FriendRequestItem
 * @description Type definitions for the FriendRequestItem component —
 * a list item for incoming or outgoing friend requests with accept/decline actions.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Request type
// ---------------------------------------------------------------------------

export const friendRequestTypes = ['incoming', 'outgoing'] as const;
export type FriendRequestType = (typeof friendRequestTypes)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the FriendRequestItem component.
 *
 * @remarks
 * Renders a friend request row with avatar, name, request type indicator,
 * and contextual action buttons (Accept / Decline for incoming, Cancel for outgoing).
 */
export interface FriendRequestItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Display name. */
  name: string;

  /** Username handle (e.g. "@alice"). */
  username?: string;

  /** Avatar element (typically an `<Avatar>` component). */
  avatar?: React.ReactNode;

  /** Whether this is an incoming or outgoing request. */
  type: FriendRequestType;

  /** When the request was sent (e.g. "2 days ago"). */
  timestamp?: string;

  /** Number of mutual friends. */
  mutualFriends?: number;

  /** Called when the accept button is pressed (incoming only). */
  onAccept?: () => void;

  /** Called when the decline button is pressed (incoming only). */
  onDecline?: () => void;

  /** Called when the cancel button is pressed (outgoing only). */
  onCancel?: () => void;

  /** Whether the item is disabled. @default false */
  disabled?: boolean;

  /** Show loading skeleton. @default false */
  skeleton?: boolean;

  /** Remove border radius for flat list contexts. @default false */
  flat?: boolean;
}
