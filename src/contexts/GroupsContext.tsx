/**
 * GroupsContext — Single-instance provider for groups data.
 *
 * Previously, useGroups was a hook used by 6+ components, each
 * independently subscribing to group events and fetching from
 * the database.  This caused:
 *   - 12+ duplicate WASM calls per event (6 instances × 2 queries each)
 *   - 6+ redundant event listeners
 *   - Render cascades as each instance updates state independently
 *
 * This context centralizes everything into ONE provider instance.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNetwork } from '@/hooks/useNetwork';
import type { Group, GroupMember, PendingGroupInvite, GroupEvent } from '@umbra/service';
import { dbg } from '@/utils/debug';

const SRC = 'GroupsProvider';

export interface GroupsContextValue {
  groups: Group[];
  isLoading: boolean;
  error: Error | null;
  createGroup: (name: string, description?: string) => Promise<{ groupId: string; conversationId: string } | null>;
  updateGroup: (groupId: string, name: string, description?: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  addMember: (groupId: string, did: string, displayName?: string) => Promise<void>;
  removeMember: (groupId: string, did: string) => Promise<void>;
  getMembers: (groupId: string) => Promise<GroupMember[]>;
  pendingInvites: PendingGroupInvite[];
  sendInvite: (groupId: string, memberDid: string, displayName?: string) => Promise<void>;
  acceptInvite: (inviteId: string) => Promise<{ groupId: string; conversationId: string } | null>;
  declineInvite: (inviteId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  rotateGroupKey: (groupId: string) => Promise<void>;
  refreshInvites: () => Promise<void>;
  refresh: () => Promise<void>;
}

const GroupsContext = createContext<GroupsContextValue | null>(null);

export function GroupsProvider({ children }: { children: React.ReactNode }) {
  if (__DEV__) dbg.trackRender(SRC);
  const { service, isReady } = useUmbra();
  const { identity } = useAuth();
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
      if (__DEV__) dbg.warn('groups', 'failed to fetch pending invites', { error: String(err) }, SRC);
    }
  }, [service]);

  // Stable refs
  const fetchGroupsRef = useRef(fetchGroups);
  fetchGroupsRef.current = fetchGroups;
  const fetchPendingInvitesRef = useRef(fetchPendingInvites);
  fetchPendingInvitesRef.current = fetchPendingInvites;
  const identityRef = useRef(identity);
  identityRef.current = identity;
  const getRelayWsRef = useRef(getRelayWs);
  getRelayWsRef.current = getRelayWs;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, service]);

  // Subscribe to group events — ONE listener for the whole app
  useEffect(() => {
    if (!service) return;

    if (__DEV__) dbg.info('groups', 'subscribing to onGroupEvent (single instance)', undefined, SRC);
    const unsubscribe = service.onGroupEvent((event: GroupEvent) => {
      if (event.type === 'inviteReceived') {
        fetchPendingInvitesRef.current();
      } else if (event.type === 'inviteAccepted' || event.type === 'memberRemoved' || event.type === 'keyRotated') {
        fetchGroupsRef.current();
      }
    });

    return () => {
      if (__DEV__) dbg.info('groups', 'unsubscribing from onGroupEvent', undefined, SRC);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

  // ── Action callbacks (stable, use refs for latest values) ──

  const createGroup = useCallback(
    async (name: string, description?: string) => {
      if (!service) return null;
      try {
        const result = await service.createGroup(name, description);
        await fetchGroupsRef.current();
        return result;
      } catch (err) {
        if (__DEV__) dbg.error('groups', 'createGroup failed', { error: String(err) }, SRC);
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    [service],
  );

  const updateGroup = useCallback(
    async (groupId: string, name: string, description?: string) => {
      if (!service) return;
      try {
        await service.updateGroup(groupId, name, description);
        await fetchGroupsRef.current();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service],
  );

  const deleteGroup = useCallback(
    async (groupId: string) => {
      if (!service) return;
      try {
        await service.deleteGroup(groupId);
        await fetchGroupsRef.current();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service],
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
    [service],
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
    [service],
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
    [service],
  );

  const sendInvite = useCallback(
    async (groupId: string, memberDid: string, _displayName?: string) => {
      if (!service) return;
      try {
        const relayWs = getRelayWsRef.current();
        await service.sendGroupInvite(groupId, memberDid, relayWs);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service],
  );

  const acceptInvite = useCallback(
    async (inviteId: string): Promise<{ groupId: string; conversationId: string } | null> => {
      if (!service) return null;
      try {
        const relayWs = getRelayWsRef.current();
        const result = await service.acceptGroupInvite(inviteId, relayWs);
        await fetchGroupsRef.current();
        await fetchPendingInvitesRef.current();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    [service],
  );

  const declineInvite = useCallback(
    async (inviteId: string) => {
      if (!service) return;
      try {
        const relayWs = getRelayWsRef.current();
        await service.declineGroupInvite(inviteId, relayWs);
        await fetchPendingInvitesRef.current();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service],
  );

  const leaveGroup = useCallback(
    async (groupId: string) => {
      const id = identityRef.current;
      if (!service || !id?.did) return;
      try {
        await service.removeGroupMember(groupId, id.did);
        await service.deleteGroup(groupId);
        await fetchGroupsRef.current();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    [service],
  );

  const rotateGroupKey = useCallback(
    async (groupId: string) => {
      if (!service) return;
      try {
        await service.rotateGroupKey(groupId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    [service],
  );

  const value = React.useMemo<GroupsContextValue>(
    () => ({
      groups, isLoading, error, pendingInvites,
      createGroup, updateGroup, deleteGroup,
      addMember, removeMember, getMembers,
      sendInvite, acceptInvite, declineInvite,
      leaveGroup, rotateGroupKey,
      refreshInvites: fetchPendingInvites,
      refresh: fetchGroups,
    }),
    [groups, isLoading, error, pendingInvites,
     createGroup, updateGroup, deleteGroup,
     addMember, removeMember, getMembers,
     sendInvite, acceptInvite, declineInvite,
     leaveGroup, rotateGroupKey,
     fetchPendingInvites, fetchGroups],
  );

  return (
    <GroupsContext.Provider value={value}>
      {children}
    </GroupsContext.Provider>
  );
}

/**
 * Access groups data from the GroupsContext.
 *
 * Must be used within a `<GroupsProvider>`.
 */
export function useGroupsContext(): GroupsContextValue {
  const context = useContext(GroupsContext);
  if (!context) {
    throw new Error(
      'useGroupsContext must be used within a <GroupsProvider>.',
    );
  }
  return context;
}
