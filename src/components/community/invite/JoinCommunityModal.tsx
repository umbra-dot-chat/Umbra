/**
 * @module JoinCommunityModal
 * @description Modal dialog for joining a community via an invite code.
 *
 * Provides:
 * - Text input for pasting an invite code or full invite URL
 * - "Join" button that calls the invite-use service method
 * - Loading / error / success states
 * - Navigates to the community on success
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, Button, Text, Input, Alert, useTheme, Box } from '@coexist/wisp-react-native';
import { defaultSpacing } from '@coexist/wisp-core/theme/create-theme';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { resolveInviteFromRelay } from '@umbra/service';
import { DEFAULT_RELAY_SERVERS } from '@/config';
import { useTranslation } from 'react-i18next';
import { dbg } from '@/utils/debug';

const SRC = 'JoinCommunityModal';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface JoinCommunityModalProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Called when the dialog should close. */
  onClose: () => void;
  /** Pre-filled invite code (e.g. from a deep link). */
  initialCode?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract an invite code from a raw input string.
 * Handles:
 * - Full URL: https://umbra.chat/invite/abc12def
 * - Deep link: umbra://invite/abc12def
 * - Bare code: abc12def
 */
function extractInviteCode(input: string): string {
  const trimmed = input.trim();

  // Match URL patterns: https://umbra.chat/invite/CODE or umbra://invite/CODE
  const urlMatch = trimmed.match(/(?:https?:\/\/[^/]+|umbra:)\/?\/?invite\/([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];

  // Otherwise treat the whole input as a bare code (strip non-alphanumeric)
  return trimmed.replace(/[^a-zA-Z0-9]/g, '');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JoinCommunityModal({
  open,
  onClose,
  initialCode,
}: JoinCommunityModalProps) {
  if (__DEV__) dbg.trackRender('JoinCommunityModal');
  const { theme } = useTheme();
  const { t } = useTranslation('common');
  const tc = theme.colors;
  const { service, isReady } = useUmbra();
  const { identity } = useAuth();
  const router = useRouter();

  const [rawInput, setRawInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoJoining, setAutoJoining] = useState(false);

  // Pre-fill and optionally auto-join when initialCode is provided
  useEffect(() => {
    if (open && initialCode) {
      setRawInput(initialCode);
      setError(null);
      setAutoJoining(true);
    }
  }, [open, initialCode]);

  // Auto-join when service becomes ready with an initial code
  useEffect(() => {
    if (autoJoining && isReady && service && identity?.did && rawInput) {
      setAutoJoining(false);
      handleJoin();
    }
  }, [autoJoining, isReady, service, identity?.did]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setRawInput('');
      setError(null);
      setIsJoining(false);
      setAutoJoining(false);
    }
  }, [open]);

  const handleJoin = useCallback(async () => {
    if (!service || !identity?.did) return;

    const code = extractInviteCode(rawInput);
    if (!code) {
      setError(t('invalidInviteCode'));
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      // Step 1: Try local DB lookup first
      const communityId = await service.useCommunityInvite(code, identity.did, identity.displayName);
      if (communityId) {
        // Broadcast memberJoined to other community members via relay
        try {
          const relayWs = service.getRelayWs();
          await service.broadcastCommunityEvent(
            communityId,
            { type: 'memberJoined', communityId, memberDid: identity.did, memberNickname: identity.displayName, memberAvatar: identity.avatar },
            identity.did,
            relayWs,
          );
        } catch { /* best-effort */ }
        onClose();
        router.push(`/community/${communityId}`);
        return;
      }
      setError(t('failedJoinCommunity'));
    } catch (err: any) {
      const msg = err?.message || String(err);
      const isNotFound = msg.includes('not found') || msg.includes('NotFound') || msg.includes('404');

      if (isNotFound) {
        // Step 2: Invite not in local DB — try resolving via relay network
        try {
          setError(null);
          const resolved = await resolveInviteFromRelay(DEFAULT_RELAY_SERVERS, code);

          if (resolved) {
            // Import the resolved community + invite into local DB, then retry
            try {
              const payload = resolved.invite_payload !== '{}' ? JSON.parse(resolved.invite_payload) : {};
              const ownerDid = payload.owner_did || identity.did;
              const ownerNickname = payload.owner_nickname || undefined;
              await service.importCommunityFromRelay(
                resolved.community_id,
                resolved.community_name,
                resolved.community_description,
                ownerDid,
                code,
                resolved.max_uses,
                resolved.expires_at,
                ownerNickname,
              );
            } catch (importErr) {
              if (__DEV__) dbg.warn('community', 'Failed to import from relay', importErr, SRC);
            }

            // Retry the local join with the now-imported data
            try {
              const communityId = await service.useCommunityInvite(code, identity.did, identity.displayName);
              if (communityId) {
                // Broadcast memberJoined to other community members via relay
                if (__DEV__) dbg.info('community', 'Join succeeded, broadcasting memberJoined', { communityId }, SRC);
                try {
                  const relayWs = service.getRelayWs();
                  if (__DEV__) dbg.info('community', 'relayWs state', { readyState: relayWs ? relayWs.readyState : null }, SRC);
                  await service.broadcastCommunityEvent(
                    communityId,
                    { type: 'memberJoined', communityId, memberDid: identity.did, memberNickname: identity.displayName, memberAvatar: identity.avatar },
                    identity.did,
                    relayWs,
                  );
                  if (__DEV__) dbg.info('community', 'memberJoined broadcast complete', undefined, SRC);
                } catch (broadcastErr) { if (__DEV__) dbg.warn('community', 'memberJoined broadcast failed', broadcastErr, SRC); }
                onClose();
                router.push(`/community/${communityId}`);
                return;
              }
            } catch (retryErr: any) {
              const retryMsg = retryErr?.message || String(retryErr);
              if (retryMsg.includes('already') || retryMsg.includes('AlreadyMember')) {
                setError(t('alreadyMember'));
              } else {
                // Show community preview info even if join failed
                setError(t('communityFoundButFailed', { name: resolved.community_name, count: resolved.member_count }));
              }
              return;
            }

            setError(t('communityFoundRetryFailed', { name: resolved.community_name }));
            return;
          }
        } catch (relayErr) {
          if (__DEV__) dbg.warn('community', 'Relay resolution failed', relayErr, SRC);
        }

        // Neither local nor relay resolution found the invite
        setError(t('inviteNotFound'));
      } else if (msg.includes('expired') || msg.includes('Expired')) {
        setError(t('inviteExpired'));
      } else if (msg.includes('max') || msg.includes('MaxUses')) {
        setError(t('inviteMaxUses'));
      } else if (msg.includes('already') || msg.includes('AlreadyMember')) {
        setError(t('alreadyMember'));
      } else if (msg.includes('banned') || msg.includes('Banned')) {
        setError(t('bannedFromCommunity'));
      } else {
        setError(msg || t('failedJoinCommunity'));
      }
    } finally {
      setIsJoining(false);
    }
  }, [service, identity?.did, identity?.displayName, rawInput, onClose, router]);

  const code = extractInviteCode(rawInput);
  const canJoin = code.length > 0 && !isJoining;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('joinCommunity')}
      size="sm"
    >
      <Box style={{ gap: defaultSpacing.md }}>
        <Text size="sm" style={{ color: tc.text.muted }}>
          {t('joinCommunityDesc')}
        </Text>

        <Input
          value={rawInput}
          onChangeText={(text: string) => {
            setRawInput(text);
            setError(null);
          }}
          placeholder={t('inviteCodePlaceholder')}
          autoFocus
          editable={!isJoining}
          onSubmitEditing={canJoin ? handleJoin : undefined}
          gradientBorder
        />

        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        <Box style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: defaultSpacing.sm }}>
          <Box style={{ flex: 1 }} />
          <Button
            variant="tertiary"
            onPress={onClose}
            disabled={isJoining}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="primary"
            onPress={handleJoin}
            disabled={!canJoin}
            isLoading={isJoining}
          >
            {t('joinCommunity')}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
