/**
 * useCommunities — Hook for community list with real-time updates.
 *
 * Fetches all communities the current user is a member of and subscribes
 * to community events for real-time updates (create, delete, etc.).
 *
 * ## Usage
 *
 * ```tsx
 * const { communities, isLoading, error, refresh, createCommunity } = useCommunities();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Community, CommunityCreateResult, CommunityEvent } from '@umbra/service';

export interface UseCommunititesResult {
  /** List of communities the user is a member of */
  communities: Community[];
  /** Whether the initial load is in progress */
  isLoading: boolean;
  /** Error from fetching communities */
  error: Error | null;
  /** Manually refresh the community list */
  refresh: () => Promise<void>;
  /** Create a new community */
  createCommunity: (name: string, description?: string) => Promise<CommunityCreateResult | null>;
  /** Delete a community (owner only) */
  deleteCommunity: (communityId: string) => Promise<void>;
  /** Leave a community (non-owners only) */
  leaveCommunity: (communityId: string) => Promise<void>;
}

export function useCommunities(): UseCommunititesResult {
  const { service, isReady } = useUmbra();
  const { identity } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCommunities = useCallback(async () => {
    if (!service || !identity?.did) return;
    try {
      const result = await service.getCommunities(identity.did);
      setCommunities(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [service, identity?.did]);

  // Initial fetch
  useEffect(() => {
    if (isReady && service && identity?.did) {
      fetchCommunities();
    }
  }, [isReady, service, identity?.did, fetchCommunities]);

  // Subscribe to community events for real-time updates
  useEffect(() => {
    if (!service) return;

    const unsubscribe = service.onCommunityEvent((event: CommunityEvent) => {
      if (
        event.type === 'communityCreated' ||
        event.type === 'communityDeleted' ||
        event.type === 'communityUpdated' ||
        event.type === 'memberJoined' ||
        event.type === 'memberLeft'
      ) {
        fetchCommunities();
      }
    });

    return unsubscribe;
  }, [service, fetchCommunities]);

  const createCommunity = useCallback(
    async (name: string, description?: string): Promise<CommunityCreateResult | null> => {
      if (!service || !identity?.did) return null;
      try {
        const result = await service.createCommunity(name, identity.did, description, identity.displayName);
        await fetchCommunities();
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    [service, identity?.did, fetchCommunities],
  );

  const deleteCommunity = useCallback(
    async (communityId: string): Promise<void> => {
      if (!service || !identity?.did) return;
      try {
        await service.deleteCommunity(communityId, identity.did);
        await fetchCommunities();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [service, identity?.did, fetchCommunities],
  );

  const leaveCommunity = useCallback(
    async (communityId: string): Promise<void> => {
      if (!service || !identity?.did) return;
      try {
        await service.leaveCommunity(communityId, identity.did);
        await fetchCommunities();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [service, identity?.did, fetchCommunities],
  );

  return {
    communities,
    isLoading,
    error,
    refresh: fetchCommunities,
    createCommunity,
    deleteCommunity,
    leaveCommunity,
  };
}
