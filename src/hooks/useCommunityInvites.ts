/**
 * useCommunityInvites — Hook for community invite CRUD with real-time updates.
 *
 * Fetches all invites for a community and subscribes to community events
 * for real-time updates when invites are created or deleted.
 *
 * ## Usage
 *
 * ```tsx
 * const {
 *   invites, isLoading, error,
 *   createInvite, deleteInvite, useInvite,
 * } = useCommunityInvites(communityId);
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import type { CommunityInvite, CommunityEvent } from '@umbra/service';

export interface UseCommunityInvitesResult {
  /** All invite records for this community */
  invites: CommunityInvite[];
  /** Whether the initial load is in progress */
  isLoading: boolean;
  /** Error from fetching or mutating */
  error: Error | null;
  /** Manually refresh the invite list */
  refresh: () => Promise<void>;
  /** Create a new invite. Returns the invite record on success. */
  createInvite: (maxUses?: number, expiresAt?: number) => Promise<CommunityInvite | null>;
  /** Delete an invite by ID. */
  deleteInvite: (inviteId: string) => Promise<void>;
  /** Use an invite code to join a community. Returns the community ID on success. */
  useInvite: (code: string) => Promise<string | null>;
  /** Whether an invite is currently being created */
  creating: boolean;
}

export function useCommunityInvites(communityId: string | null): UseCommunityInvitesResult {
  const { service, isReady } = useUmbra();
  const { identity } = useAuth();
  const [invites, setInvites] = useState<CommunityInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchInvites = useCallback(async () => {
    if (!service || !communityId) return;
    try {
      const result = await service.getCommunityInvites(communityId);
      setInvites(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [service, communityId]);

  // Initial fetch
  useEffect(() => {
    if (isReady && service && communityId) {
      fetchInvites();
    }
  }, [isReady, service, communityId, fetchInvites]);

  // Reset when community changes
  useEffect(() => {
    if (!communityId) {
      setInvites([]);
      setIsLoading(false);
    }
  }, [communityId]);

  // Subscribe to invite events for real-time updates
  useEffect(() => {
    if (!service || !communityId) return;

    const unsubscribe = service.onCommunityEvent((event: CommunityEvent) => {
      if (
        (event.type === 'inviteCreated' || event.type === 'inviteDeleted') &&
        'communityId' in event &&
        event.communityId === communityId
      ) {
        fetchInvites();
      }
    });

    return unsubscribe;
  }, [service, communityId, fetchInvites]);

  const createInvite = useCallback(
    async (maxUses?: number, expiresAt?: number): Promise<CommunityInvite | null> => {
      if (!service || !identity?.did || !communityId) return null;
      try {
        setCreating(true);
        const invite = await service.createCommunityInvite(communityId, identity.did, maxUses, expiresAt);
        await fetchInvites();

        // Publish invite to relay for remote resolution
        try {
          const community = await service.getCommunity(communityId);
          const members = await service.getCommunityMembers(communityId);
          const relayWs = service.getRelayWs();
          const invitePayload = JSON.stringify({
            owner_did: identity.did,
            owner_nickname: identity.displayName,
            owner_avatar: identity.avatar,
          });
          service.publishCommunityInviteToRelay(
            relayWs,
            invite,
            community.name,
            community.description,
            community.iconUrl,
            members.length,
            invitePayload,
          );
        } catch (publishErr) {
          // Non-fatal — invite is still created locally
          console.warn('[useCommunityInvites] Failed to publish invite to relay:', publishErr);
        }

        return invite;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      } finally {
        setCreating(false);
      }
    },
    [service, identity?.did, communityId, fetchInvites],
  );

  const deleteInvite = useCallback(
    async (inviteId: string): Promise<void> => {
      if (!service || !identity?.did) return;
      try {
        // Find the invite code before deleting so we can revoke on relay
        const inv = invites.find((i) => i.id === inviteId);
        await service.deleteCommunityInvite(inviteId, identity.did);

        // Revoke on relay
        if (inv) {
          try {
            const relayWs = service.getRelayWs();
            service.revokeCommunityInviteOnRelay(relayWs, inv.code);
          } catch {
            // Non-fatal
          }
        }

        await fetchInvites();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service, identity?.did, invites, fetchInvites],
  );

  const useInvite = useCallback(
    async (code: string): Promise<string | null> => {
      if (!service || !identity?.did) return null;
      try {
        const communityId = await service.useCommunityInvite(code, identity.did, identity.displayName);
        return communityId;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    [service, identity?.did],
  );

  return {
    invites,
    isLoading,
    error,
    refresh: fetchInvites,
    createInvite,
    deleteInvite,
    useInvite,
    creating,
  };
}
