/**
 * @module types/UserMiniCard
 * @description Type definitions for the UserMiniCard component —
 * a compact inline card for hovering over a username, lighter than
 * the full UserProfileCard.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Quick action
// ---------------------------------------------------------------------------

/** A quick action icon button on the mini card. */
export interface UserMiniCardAction {
  /** Unique identifier. */
  id: string;
  /** Accessible label (e.g. "Message", "View Profile"). */
  label: string;
  /** Icon element. */
  icon: React.ReactNode;
  /** Callback when pressed. */
  onPress?: () => void;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type UserMiniCardStatus = 'online' | 'idle' | 'dnd' | 'offline';

/**
 * Props for the UserMiniCard component.
 *
 * @remarks
 * A lightweight user card for hover tooltips and mention popovers.
 * Shows avatar, name, username, and status on a compact card with
 * optional quick-action icon buttons. No banner, bio, or roles.
 */
export interface UserMiniCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** User's display name. */
  name: string;

  /** Username handle (e.g. "@alice"). */
  username?: string;

  /** Avatar element (typically an `<Avatar>` component). */
  avatar?: React.ReactNode;

  /** Online / presence status. @default 'offline' */
  status?: UserMiniCardStatus;

  /** Custom status text (e.g. "In a meeting"). */
  statusText?: string;

  /** Quick-action icon buttons. */
  actions?: UserMiniCardAction[];

  /** Show loading skeleton. @default false */
  skeleton?: boolean;
}
