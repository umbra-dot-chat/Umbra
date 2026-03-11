/**
 * @module types/InviteManager
 * @description Type definitions for the InviteManager component —
 * create and manage community invite links.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

/** An active invite link. */
export interface InviteLink {
  /** Unique identifier. */
  id: string;
  /** The invite code or URL. */
  code: string;
  /** Who created this invite. */
  createdBy: string;
  /** Creation timestamp. */
  createdAt: string;
  /** Expiry timestamp (null = never). */
  expiresAt?: string | null;
  /** Maximum number of uses (null = unlimited). */
  maxUses?: number | null;
  /** Current number of uses. */
  uses: number;
  /** Whether this is a vanity URL. */
  isVanity?: boolean;
}

/** Options for creating a new invite. */
export interface InviteCreateOptions {
  /** Expiry duration in seconds (0 = never). */
  expiresIn: number;
  /** Max uses (0 = unlimited). */
  maxUses: number;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the InviteManager component.
 */
export interface InviteManagerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onCopy'> {
  /** List of active invite links. */
  invites: InviteLink[];

  /** Called when a new invite is created. */
  onCreateInvite?: (options: InviteCreateOptions) => void;

  /** Called when an invite is deleted/revoked. */
  onDeleteInvite?: (inviteId: string) => void;

  /** Called when an invite code is copied. */
  onCopy?: (code: string) => void;

  /** Base URL for constructing full invite links. @default 'https://umbra.app/invite/' */
  baseUrl?: string;

  /** Whether creation is in progress. @default false */
  creating?: boolean;

  /** Title text. @default 'Invite People' */
  title?: string;

  /** Vanity URL slug (if set). */
  vanitySlug?: string;

  /** Called when vanity URL is changed. */
  onVanityChange?: (slug: string) => void;

  /** Show loading skeleton. @default false */
  skeleton?: boolean;

  /** Called when close/back is clicked. */
  onClose?: () => void;
}
