/**
 * useGroups — Hook for group management.
 *
 * Provides CRUD operations for groups (create, list, update, delete)
 * and member management (add, remove, list members).
 *
 * ## Usage
 *
 * ```tsx
 * const {
 *   groups, isLoading,
 *   createGroup, updateGroup, deleteGroup,
 *   addMember, removeMember, getMembers,
 *   refresh,
 * } = useGroups();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import { useNetwork } from '@/hooks/useNetwork';
import type { Group, GroupMember, PendingGroupInvite, GroupEvent } from '@umbra/service';

export interface UseGroupsResult {
  /** All groups the user belongs to */
  groups: Group[];
  /** Whether the initial load is in progress */
  isLoading: boolean;
  /** Error from operations */
  error: Error | null;
  /** Create a new group */
  createGroup: (name: string, description?: string) => Promise<{ groupId: string; conversationId: string } | null>;
  /** Update a group's name/description */
  updateGroup: (groupId: string, name: string, description?: string) => Promise<void>;
  /** Delete a group (admin only) */
  deleteGroup: (groupId: string) => Promise<void>;
  /** Add a member to a group */
  addMember: (groupId: string, did: string, displayName?: string) => Promise<void>;
  /** Remove a member from a group */
  removeMember: (groupId: string, did: string) => Promise<void>;
  /** Get members of a group */
  getMembers: (groupId: string) => Promise<GroupMember[]>;
  /** Pending group invites */
  pendingInvites: PendingGroupInvite[];
  /** Send a group invite to a friend */
  sendInvite: (groupId: string, memberDid: string, displayName?: string) => Promise<void>;
  /** Accept a pending group invite */
  acceptInvite: (inviteId: string) => Promise<{ groupId: string; conversationId: string } | null>;
  /** Decline a pending group invite */
  declineInvite: (inviteId: string) => Promise<void>;
  /** Refresh the pending invites list */
  refreshInvites: () => Promise<void>;
  /** Refresh the groups list */
  refresh: () => Promise<void>;
}

export function useGroups(): UseGroupsResult {
  const { service, isReady } = useUmbra();
  const { getRelayWs } = useNetwork();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pendingInvites, setPendingInvites] = useState<PendingGroupInvite[]>([]);

  const fetchGroups = useCallback(async () => {
    if (!service) {
      setGroups([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const result = await service.getGroups();
      setGroups(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  const fetchPendingInvites = useCallback(async () => {
    if (!service) {
      setPendingInvites([]);
      return;
    }
    try {
      const result = await service.getPendingGroupInvites();
      setPendingInvites(result);
    } catch (err) {
      console.warn('[useGroups] Failed to fetch pending invites:', err);
    }
  }, [service]);

  // Initial fetch
  useEffect(() => {
    if (isReady && service) {
      fetchGroups();
      fetchPendingInvites();
    } else {
      setGroups([]);
      setPendingInvites([]);
      setIsLoading(false);
    }
  }, [isReady, service, fetchGroups, fetchPendingInvites]);

  // Subscribe to group events for real-time updates
  useEffect(() => {
    if (!service) return;

    const unsubscribe = service.onGroupEvent((event: GroupEvent) => {
      if (event.type === 'inviteReceived') {
        // Refresh pending invites when a new one arrives
        fetchPendingInvites();
      } else if (event.type === 'inviteAccepted' || event.type === 'memberRemoved' || event.type === 'keyRotated') {
        // Refresh groups when membership changes
        fetchGroups();
      } else if (event.type === 'inviteDeclined') {
        // No-op for the inviter side, but good to know
      } else if (event.type === 'groupMessageReceived') {
        // Messages are handled by useMessages; no group refresh needed
      }
    });

    return unsubscribe;
  }, [service, fetchGroups, fetchPendingInvites]);

  const createGroup = useCallback(
    async (name: string, description?: string) => {
      if (!service) return null;
      try {
        const result = await service.createGroup(name, description);
        await fetchGroups(); // Refresh list
        return result;
      } catch (err) {
        console.error('[useGroups] createGroup failed:', err);
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    [service, fetchGroups]
  );

  const updateGroup = useCallback(
    async (groupId: string, name: string, description?: string) => {
      if (!service) return;
      try {
        await service.updateGroup(groupId, name, description);
        await fetchGroups();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service, fetchGroups]
  );

  const deleteGroup = useCallback(
    async (groupId: string) => {
      if (!service) return;
      try {
        await service.deleteGroup(groupId);
        await fetchGroups();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service, fetchGroups]
  );

  const addMember = useCallback(
    async (groupId: string, did: string, displayName?: string) => {
      if (!service) return;
      try {
        await service.addGroupMember(groupId, did, displayName);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service]
  );

  const removeMember = useCallback(
    async (groupId: string, did: string) => {
      if (!service) return;
      try {
        await service.removeGroupMember(groupId, did);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service]
  );

  const getMembers = useCallback(
    async (groupId: string): Promise<GroupMember[]> => {
      if (!service) return [];
      try {
        return await service.getGroupMembers(groupId);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return [];
      }
    },
    [service]
  );

  const sendInvite = useCallback(
    async (groupId: string, memberDid: string, _displayName?: string) => {
      if (!service) return;
      try {
        const relayWs = getRelayWs();
        await service.sendGroupInvite(groupId, memberDid, relayWs);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service, getRelayWs]
  );

  const acceptInvite = useCallback(
    async (inviteId: string): Promise<{ groupId: string; conversationId: string } | null> => {
      if (!service) return null;
      try {
        const relayWs = getRelayWs();
        const result = await service.acceptGroupInvite(inviteId, relayWs);
        await fetchGroups();
        await fetchPendingInvites();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    [service, getRelayWs, fetchGroups, fetchPendingInvites]
  );

  const declineInvite = useCallback(
    async (inviteId: string) => {
      if (!service) return;
      try {
        const relayWs = getRelayWs();
        await service.declineGroupInvite(inviteId, relayWs);
        await fetchPendingInvites();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service, getRelayWs, fetchPendingInvites]
  );

  return {
    groups,
    isLoading,
    error,
    createGroup,
    updateGroup,
    deleteGroup,
    addMember,
    removeMember,
    getMembers,
    pendingInvites,
    sendInvite,
    acceptInvite,
    declineInvite,
    refreshInvites: fetchPendingInvites,
    refresh: fetchGroups,
  };
}
