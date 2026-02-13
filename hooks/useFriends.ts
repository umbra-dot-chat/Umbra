/**
 * useFriends — Hook for friends list, requests, and CRUD operations.
 *
 * Fetches friends and pending requests from the Umbra backend
 * and subscribes to friend events for real-time updates.
 *
 * ## Usage
 *
 * ```tsx
 * const {
 *   friends, incomingRequests, outgoingRequests,
 *   isLoading, sendRequest, acceptRequest, rejectRequest,
 *   removeFriend, blockUser
 * } = useFriends();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNetwork } from '@/hooks/useNetwork';
import type { Friend, FriendRequest, FriendEvent } from '@umbra/service';

export interface UseFriendsResult {
  /** Confirmed friends list */
  friends: Friend[];
  /** Incoming friend requests */
  incomingRequests: FriendRequest[];
  /** Outgoing friend requests */
  outgoingRequests: FriendRequest[];
  /** Whether the initial load is in progress */
  isLoading: boolean;
  /** Error from operations */
  error: Error | null;
  /** Send a friend request by DID */
  sendRequest: (did: string, message?: string) => Promise<FriendRequest | null>;
  /** Accept an incoming request */
  acceptRequest: (requestId: string) => Promise<void>;
  /** Reject an incoming request */
  rejectRequest: (requestId: string) => Promise<void>;
  /** Remove a friend */
  removeFriend: (did: string) => Promise<boolean>;
  /** Block a user */
  blockUser: (did: string, reason?: string) => Promise<void>;
  /** Unblock a user */
  unblockUser: (did: string) => Promise<boolean>;
  /** Refresh all friend data */
  refresh: () => Promise<void>;
}

export function useFriends(): UseFriendsResult {
  const { service, isReady } = useUmbra();
  const { identity } = useAuth();
  const { getRelayWs } = useNetwork();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    if (!service) return;
    try {
      const [friendsList, incoming, outgoing] = await Promise.all([
        service.getFriends(),
        service.getIncomingRequests(),
        service.getOutgoingRequests(),
      ]);
      setFriends(friendsList);
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  // Initial fetch
  useEffect(() => {
    if (isReady && service) {
      fetchAll();
    }
  }, [isReady, service, fetchAll]);

  // Subscribe to friend events for real-time updates
  useEffect(() => {
    if (!service) return;

    const unsubscribe = service.onFriendEvent((_event: FriendEvent) => {
      // Refresh all friend data on any friend event
      fetchAll();
    });

    return unsubscribe;
  }, [service, fetchAll]);

  const sendRequest = useCallback(
    async (did: string, message?: string): Promise<FriendRequest | null> => {
      if (!service) return null;
      try {
        // Pass the relay WebSocket and frontend identity to send the request via relay.
        // We pass the frontend identity because on Tauri the backend may have
        // a different DID than the one stored in localStorage.
        const relayWs = getRelayWs();
        const fromIdentity = identity ? { did: identity.did, displayName: identity.displayName } : null;
        console.log('[useFriends] sendRequest — DID:', did.slice(0, 24) + '...');
        console.log('[useFriends] sendRequest — relayWs:', relayWs ? `readyState=${relayWs.readyState}` : 'null');
        console.log('[useFriends] sendRequest — fromDid:', fromIdentity?.did?.slice(0, 24) + '...');
        const request = await service.sendFriendRequest(did, message, relayWs, fromIdentity);
        console.log('[useFriends] sendRequest — result:', request ? 'success' : 'null');
        await fetchAll(); // Refresh to show the new outgoing request
        return request;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error; // Re-throw so caller gets the actual error message
      }
    },
    [service, fetchAll, getRelayWs, identity]
  );

  const acceptRequest = useCallback(
    async (requestId: string) => {
      if (!service) return;
      try {
        // Pass the relay WebSocket and frontend identity to send acceptance via relay
        const relayWs = getRelayWs();
        const fromIdentity = identity ? { did: identity.did, displayName: identity.displayName } : null;
        await service.acceptFriendRequest(requestId, relayWs, fromIdentity);
        await fetchAll(); // Refresh — request moves to friends list
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service, fetchAll, getRelayWs, identity]
  );

  const rejectRequest = useCallback(
    async (requestId: string) => {
      if (!service) return;
      try {
        await service.rejectFriendRequest(requestId);
        await fetchAll(); // Refresh — request removed from incoming
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service, fetchAll]
  );

  const removeFriend = useCallback(
    async (did: string): Promise<boolean> => {
      if (!service) return false;
      try {
        const result = await service.removeFriend(did);
        await fetchAll();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return false;
      }
    },
    [service, fetchAll]
  );

  const blockUser = useCallback(
    async (did: string, reason?: string) => {
      if (!service) return;
      try {
        await service.blockUser(did, reason);
        await fetchAll();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service, fetchAll]
  );

  const unblockUser = useCallback(
    async (did: string): Promise<boolean> => {
      if (!service) return false;
      try {
        const result = await service.unblockUser(did);
        await fetchAll();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return false;
      }
    },
    [service, fetchAll]
  );

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    isLoading,
    error,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    blockUser,
    unblockUser,
    refresh: fetchAll,
  };
}
