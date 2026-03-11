/**
 * @module types/UserProfileCard
 * @description Type definitions for the UserProfileCard component —
 * a popover or panel showing user profile details with actions.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

/** A role badge displayed on the user profile. */
export interface ProfileRole {
  /** Unique identifier for the role. */
  id: string;
  /** Display label for the role (e.g. "Admin", "Moderator"). */
  label: string;
  /** Optional color for the role badge (hex). Falls back to theme muted. */
  color?: string;
}

/** An action button on the user profile card. */
export interface ProfileAction {
  /** Unique identifier for the action. */
  id: string;
  /** Display label (e.g. "Message", "Voice Call"). */
  label: string;
  /** Optional icon to display in the button. */
  icon?: React.ReactNode;
  /** Callback when the action button is clicked. */
  onClick?: () => void;
  /** Whether the action button is disabled. */
  disabled?: boolean;
}

/** Online status for the user. */
export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the UserProfileCard component.
 *
 * @remarks
 * Displays a user's profile information in a card format, similar to
 * Discord's user popover or Slack's profile panel.
 */
export interface UserProfileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** User's display name. */
  name: string;

  /** User's username or handle (e.g. "@johndoe"). */
  username?: string;

  /** Avatar element (typically an `<Avatar>` component). */
  avatar?: React.ReactNode;

  /** User's online status. @default 'offline' */
  status?: UserStatus;

  /** Custom status text (e.g. "In a meeting", "Working from home"). */
  statusText?: string;

  /** User's bio or about text. */
  bio?: string;

  /** List of role badges to display. */
  roles?: ProfileRole[];

  /** Action buttons (e.g. Message, Call). */
  actions?: ProfileAction[];

  /** Optional banner image URL displayed at the top of the card. */
  bannerUrl?: string;

  /** Optional banner color (used if no bannerUrl). */
  bannerColor?: string;

  /** Whether the card is in a loading/skeleton state. @default false */
  skeleton?: boolean;

  /** Called when the close button is clicked. If omitted, no close button is shown. */
  onClose?: () => void;

  // -- Community profile extensions --

  /** Community-specific nickname (overrides name display). */
  nickname?: string;

  /** Date the user joined the community (ISO string or formatted). */
  joinedAt?: string;

  /** Custom status emoji. */
  statusEmoji?: string;

  /** Label for the joined date section. @default 'Joined' */
  joinedLabel?: string;
}
