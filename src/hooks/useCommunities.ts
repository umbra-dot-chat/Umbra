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

import { useState, useEffect, useCallback, useRef } from 'react';
import { dbg } from '@/utils/debug';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Community, CommunityCreateResult, CommunityEvent } from '@umbra/service';

const SRC = 'useCommunities';

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

/** Throttle interval for event-driven refetches (30 s). Communities rarely
 *  change, so hammering the DB on every relay event is wasteful. */
const COMMUNITY_THROTTLE_MS = 30_000;

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

  // Stable ref for fetchCommunities — used in the event subscription to
  // avoid including it in the effect deps (which causes infinite loops).
  const fetchCommunitiesRef = useRef(fetchCommunities);
  fetchCommunitiesRef.current = fetchCommunities;

  // Throttle guard: at most one event-driven fetch per COMMUNITY_THROTTLE_MS.
  // Direct calls (initial load, create, delete, leave) bypass this guard.
  const lastEventFetchRef = useRef<number>(0);
  const eventFetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial fetch
  useEffect(() => {
    if (isReady && service && identity?.did) {
      fetchCommunities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, service, identity?.did]);

  // Subscribe to community events for real-time updates.
  // Throttled: at most one getCommunities call per 30 seconds from events.
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
        const now = Date.now();
        if (now - lastEventFetchRef.current >= COMMUNITY_THROTTLE_MS) {
          lastEventFetchRef.current = now;
          fetchCommunitiesRef.current();
        } else if (!eventFetchTimerRef.current) {
          // Schedule a trailing fetch so we don't miss the last event
          const remaining = COMMUNITY_THROTTLE_MS - (now - lastEventFetchRef.current);
          eventFetchTimerRef.current = setTimeout(() => {
            eventFetchTimerRef.current = null;
            lastEventFetchRef.current = Date.now();
            fetchCommunitiesRef.current();
          }, remaining);
        }
      }
    });

    return () => {
      unsubscribe();
      if (eventFetchTimerRef.current) {
        clearTimeout(eventFetchTimerRef.current);
        eventFetchTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

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
