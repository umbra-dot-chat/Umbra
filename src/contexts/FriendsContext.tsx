/**
 * FriendsContext — Single-instance provider for friends data.
 *
 * Previously, useFriends was a hook used by 12+ components, each
 * independently subscribing to friend events and fetching from
 * the database.  This caused:
 *   - 48+ duplicate WASM calls per event (12 instances × 4 queries each)
 *   - 12+ redundant event listeners
 *   - Render cascades as each instance updates state independently
 *
 * With 5 bots in group chat, this produced 1074+ friends_list WASM calls.
 *
 * This context centralizes everything into ONE provider instance.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNetwork } from '@/hooks/useNetwork';
import type { Friend, FriendRequest, FriendEvent, BlockedUser } from '@umbra/service';
import { dbg } from '@/utils/debug';

const SRC = 'FriendsProvider';

/** Minimum interval between event-triggered fetches (ms). */
const FETCH_THROTTLE_MS = 2000;

export interface FriendsContextValue {
  friends: Friend[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  blockedUsers: BlockedUser[];
  isLoading: boolean;
  error: Error | null;
  sendRequest: (did: string, message?: string) => Promise<FriendRequest | null>;
  acceptRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  removeFriend: (did: string) => Promise<boolean>;
  blockUser: (did: string, reason?: string) => Promise<void>;
  unblockUser: (did: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const FriendsContext = createContext<FriendsContextValue | null>(null);

export function FriendsProvider({ children }: { children: React.ReactNode }) {
  if (__DEV__) dbg.trackRender(SRC);
  const { service, isReady } = useUmbra();
  const { identity } = useAuth();
  const { getRelayWs } = useNetwork();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    if (!service) return;
    try {
      const [friendsList, incoming, outgoing, blocked] = await Promise.all([
        service.getFriends(),
        service.getIncomingRequests(),
        service.getOutgoingRequests(),
        service.getBlockedUsers(),
      ]);
      // Filter out outgoing requests whose recipient is already a confirmed
      // friend.  The WASM layer adds the friend on acceptance but may not
      // remove the corresponding outgoing request, causing stale entries.
      const friendDids = new Set(friendsList.map((f) => f.did));
      const filteredOutgoing = outgoing.filter(
        (req) => !friendDids.has(req.toDid),
      );
      setFriends(friendsList);
      setIncomingRequests(incoming);
      setOutgoingRequests(filteredOutgoing);
      setBlockedUsers(blocked);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  // Stable ref for fetchAll
  const fetchAllRef = useRef(fetchAll);
  fetchAllRef.current = fetchAll;

  // Stable refs for values used in action callbacks
  const identityRef = useRef(identity);
  identityRef.current = identity;
  const getRelayWsRef = useRef(getRelayWs);
  getRelayWsRef.current = getRelayWs;

  // Throttled version for event-triggered refreshes (leading + trailing).
  const lastThrottleFetchRef = useRef(0);
  const trailingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const throttledFetch = useCallback(() => {
    const now = Date.now();
    const elapsed = now - lastThrottleFetchRef.current;

    if (elapsed >= FETCH_THROTTLE_MS) {
      lastThrottleFetchRef.current = now;
      fetchAllRef.current();
    } else if (!trailingTimerRef.current) {
      trailingTimerRef.current = setTimeout(() => {
        trailingTimerRef.current = null;
        lastThrottleFetchRef.current = Date.now();
        fetchAllRef.current();
      }, FETCH_THROTTLE_MS - elapsed);
    }
  }, []);

  // Clean up trailing timer on unmount
  useEffect(() => {
    return () => {
      if (trailingTimerRef.current) {
        clearTimeout(trailingTimerRef.current);
      }
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    if (isReady && service) {
      fetchAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, service]);

  // Subscribe to friend events — ONE listener for the whole app
  useEffect(() => {
    if (!service) return;

    if (__DEV__) dbg.info('friends', 'subscribing to onFriendEvent (single instance)', undefined, SRC);
    const unsubscribe = service.onFriendEvent((_event: FriendEvent) => {
      if (__DEV__) dbg.debug('friends', 'onFriendEvent → throttled refresh', undefined, SRC);
      throttledFetch();
    });

    return () => {
      if (__DEV__) dbg.info('friends', 'unsubscribing from onFriendEvent', undefined, SRC);
      unsubscribe();
    };
  }, [service, throttledFetch]);

  // ── Action callbacks (stable, use refs for latest values) ──

  const sendRequest = useCallback(
    async (did: string, message?: string): Promise<FriendRequest | null> => {
      if (!service) return null;
      try {
        const relayWs = getRelayWsRef.current();
        const id = identityRef.current;
        const fromIdentity = id ? { did: id.did, displayName: id.displayName } : null;
        const request = await service.sendFriendRequest(did, message, relayWs, fromIdentity);
        await fetchAllRef.current();
        return request;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    [service],
  );

  const acceptRequest = useCallback(
    async (requestId: string) => {
      if (!service) return;
      try {
        const relayWs = getRelayWsRef.current();
        const id = identityRef.current;
        const fromIdentity = id ? { did: id.did, displayName: id.displayName } : null;
        await service.acceptFriendRequest(requestId, relayWs, fromIdentity);
        await fetchAllRef.current();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service],
  );

  const rejectRequest = useCallback(
    async (requestId: string) => {
      if (!service) return;
      try {
        await service.rejectFriendRequest(requestId);
        await fetchAllRef.current();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service],
  );

  const removeFriend = useCallback(
    async (did: string): Promise<boolean> => {
      if (!service) return false;
      try {
        const result = await service.removeFriend(did);
        await fetchAllRef.current();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return false;
      }
    },
    [service],
  );

  const blockUser = useCallback(
    async (did: string, reason?: string) => {
      if (!service) return;
      try {
        await service.blockUser(did, reason);
        await fetchAllRef.current();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service],
  );

  const unblockUser = useCallback(
    async (did: string): Promise<boolean> => {
      if (!service) return false;
      try {
        const result = await service.unblockUser(did);
        await fetchAllRef.current();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return false;
      }
    },
    [service],
  );

  const value = React.useMemo<FriendsContextValue>(
    () => ({
      friends, incomingRequests, outgoingRequests, blockedUsers,
      isLoading, error,
      sendRequest, acceptRequest, rejectRequest, removeFriend, blockUser, unblockUser,
      refresh: fetchAll,
    }),
    [friends, incomingRequests, outgoingRequests, blockedUsers,
     isLoading, error,
     sendRequest, acceptRequest, rejectRequest, removeFriend, blockUser, unblockUser,
     fetchAll],
  );

  return (
    <FriendsContext.Provider value={value}>
      {children}
    </FriendsContext.Provider>
  );
}

/**
 * Access friends data from the FriendsContext.
 *
 * Must be used within a `<FriendsProvider>`.
 */
export function useFriendsContext(): FriendsContextValue {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error(
      'useFriendsContext must be used within a <FriendsProvider>.',
    );
  }
  return context;
}
