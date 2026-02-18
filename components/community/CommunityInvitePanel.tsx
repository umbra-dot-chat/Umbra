/**
 * @module CommunityInvitePanel
 * @description Umbra wrapper around the Wisp InviteManager component for communities.
 *
 * Transforms flat community invite data (from WASM) into the Wisp InviteLink
 * format and renders the InviteManager panel with create, delete, copy, and
 * vanity URL support.
 */

import React, { useMemo, useCallback } from 'react';
import { InviteManager } from '@coexist/wisp-react-native';
import type { InviteLink, InviteCreateOptions } from '@coexist/wisp-react-native';
import * as Clipboard from 'expo-clipboard';

// ---------------------------------------------------------------------------
// Community data types (mirrors WASM JSON output shapes)
// ---------------------------------------------------------------------------

/** An invite record from `umbra_wasm_community_invite_list`. */
export interface CommunityInvite {
  id: string;
  community_id: string;
  code: string;
  /** Whether this is a vanity URL invite. */
  vanity: boolean;
  /** DID of the member who created the invite. */
  creator_did: string;
  /** Maximum number of uses (undefined = unlimited). */
  max_uses?: number;
  /** Current number of uses. */
  use_count: number;
  /** Expiry timestamp in milliseconds since epoch (undefined = never). */
  expires_at?: number;
  /** Creation timestamp in milliseconds since epoch. */
  created_at: number;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CommunityInvitePanelProps {
  /** Community identifier. */
  communityId: string;
  /** All invite records for this community. */
  invites: CommunityInvite[];
  /** Called when a new invite is created. Receives expiry (seconds) and maxUses. */
  onCreateInvite?: (options: InviteCreateOptions) => void;
  /** Called when an invite is deleted/revoked. */
  onDeleteInvite?: (inviteId: string) => void;
  /** Called when vanity URL slug is changed. */
  onVanityChange?: (slug: string) => void;
  /** Current vanity URL slug. Omit to hide vanity section. */
  vanitySlug?: string;
  /** Whether invite creation is in progress. @default false */
  creating?: boolean;
  /** Called when the close/back button is pressed. If omitted, no close button. */
  onClose?: () => void;
  /** Whether the panel is in a loading state. @default false */
  loading?: boolean;
  /** Show loading skeleton. @default false */
  skeleton?: boolean;
  /** Panel title. @default 'Invite People' */
  title?: string;
}

// ---------------------------------------------------------------------------
// Data transformation
// ---------------------------------------------------------------------------

/**
 * Maps Umbra `CommunityInvite[]` to Wisp `InviteLink[]`.
 *
 * - Converts unix timestamps to ISO strings
 * - Truncates creator DID to 12 chars for display
 * - Maps max_uses / use_count to maxUses / uses
 */
function toInviteLinks(invites: CommunityInvite[]): InviteLink[] {
  return invites.map((invite): InviteLink => ({
    id: invite.id,
    code: invite.code,
    createdBy: invite.creator_did.slice(0, 12),
    createdAt: new Date(invite.created_at).toISOString(),
    expiresAt: invite.expires_at != null
      ? new Date(invite.expires_at).toISOString()
      : null,
    maxUses: invite.max_uses ?? null,
    uses: invite.use_count,
    isVanity: invite.vanity,
  }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommunityInvitePanel({
  communityId: _communityId,
  invites,
  onCreateInvite,
  onDeleteInvite,
  onVanityChange,
  vanitySlug,
  creating = false,
  onClose,
  loading = false,
  skeleton = false,
  title = 'Invite People',
}: CommunityInvitePanelProps) {
  const links = useMemo(() => toInviteLinks(invites), [invites]);

  const handleCopy = useCallback((fullUrl: string) => {
    Clipboard.setStringAsync(fullUrl);
  }, []);

  return (
    <InviteManager
      invites={links}
      onCreateInvite={onCreateInvite}
      onDeleteInvite={onDeleteInvite}
      onCopy={handleCopy}
      onVanityChange={onVanityChange}
      vanitySlug={vanitySlug}
      creating={creating}
      onClose={onClose}
      loading={loading}
      skeleton={skeleton}
      title={title}
    />
  );
}
