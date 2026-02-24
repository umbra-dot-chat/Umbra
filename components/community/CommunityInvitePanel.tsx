/**
 * @module CommunityInvitePanel
 * @description Umbra wrapper around the Wisp InviteManager component for communities.
 *
 * Transforms flat community invite data (from WASM) into the Wisp InviteLink
 * format and renders the InviteManager panel with create, delete, copy, and
 * vanity URL support. Includes a QR code for the most recent invite link.
 */

import React, { useMemo, useCallback, useState } from 'react';
import { View, Pressable } from 'react-native';
import { QRCode, Text, useTheme, InviteManager } from '@coexist/wisp-react-native';
import type { InviteLink, InviteCreateOptions } from '@coexist/wisp-react-native';
import { defaultSpacing } from '@coexist/wisp-core/theme/create-theme';
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
// Constants
// ---------------------------------------------------------------------------

/** Base URL for invite links — used to construct shareable URLs. */
const INVITE_BASE_URL = 'https://umbra.chat/invite/';

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
  const { theme } = useTheme();
  const tc = theme.colors;
  const links = useMemo(() => toInviteLinks(invites), [invites]);
  const [showQr, setShowQr] = useState(false);

  const handleCopy = useCallback((fullUrl: string) => {
    Clipboard.setStringAsync(fullUrl);
  }, []);

  // Build the QR code URL from the most recent non-vanity invite
  const qrInvite = useMemo(() => {
    const nonVanity = invites.filter((i) => !i.vanity);
    if (nonVanity.length === 0) return null;
    // Sort by created_at descending, pick newest
    const sorted = [...nonVanity].sort((a, b) => b.created_at - a.created_at);
    return sorted[0];
  }, [invites]);

  const qrUrl = qrInvite ? `${INVITE_BASE_URL}${qrInvite.code}` : null;

  return (
    <View style={{ gap: defaultSpacing.md }}>
      <InviteManager
        invites={links}
        baseUrl={INVITE_BASE_URL}
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

      {/* QR Code Section */}
      {qrUrl && (
        <View
          style={{
            alignItems: 'center',
            gap: defaultSpacing.sm,
            paddingVertical: defaultSpacing.md,
            borderTopWidth: 1,
            borderTopColor: tc.border.subtle,
          }}
        >
          <Pressable onPress={() => setShowQr((v) => !v)}>
            <Text size="sm" weight="medium" style={{ color: tc.text.link }}>
              {showQr ? 'Hide QR Code' : 'Show QR Code'}
            </Text>
          </Pressable>

          {showQr && (
            <View style={{ alignItems: 'center', gap: defaultSpacing.sm }}>
              <QRCode
                value={qrUrl}
                size="md"
                dotStyle="rounded"
                eyeFrameStyle="rounded"
                eyePupilStyle="rounded"
              />
              <Text size="xs" style={{ color: tc.text.muted, textAlign: 'center' }}>
                Scan this QR code to join the community
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
