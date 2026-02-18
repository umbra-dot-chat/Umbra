/**
 * useCommunity — Hook for a single community's data (spaces, channels, members, roles).
 *
 * Fetches all structural data for a community and subscribes to events
 * for real-time updates when channels, spaces, or members change.
 *
 * ## Usage
 *
 * ```tsx
 * const { community, spaces, channels, members, roles, isLoading } = useCommunity(communityId);
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import type {
  Community,
  CommunitySpace,
  CommunityCategory,
  CommunityChannel,
  CommunityMember,
  CommunityRole,
  CommunityEvent,
} from '@umbra/service';

/** Map of member DID → their assigned role IDs */
export type MemberRolesMap = Record<string, CommunityRole[]>;

export interface UseCommunityResult {
  /** Community metadata */
  community: Community | null;
  /** Spaces (categories) in the community */
  spaces: CommunitySpace[];
  /** Categories across all spaces */
  categories: CommunityCategory[];
  /** All channels across all spaces */
  channels: CommunityChannel[];
  /** All members */
  members: CommunityMember[];
  /** All roles */
  roles: CommunityRole[];
  /** Map of member DID → their assigned roles */
  memberRolesMap: MemberRolesMap;
  /** Whether the initial load is in progress */
  isLoading: boolean;
  /** Error from fetching */
  error: Error | null;
  /** Manually refresh all data */
  refresh: () => Promise<void>;
}

export function useCommunity(communityId: string | null): UseCommunityResult {
  const { service, isReady } = useUmbra();
  const [community, setCommunity] = useState<Community | null>(null);
  const [spaces, setSpaces] = useState<CommunitySpace[]>([]);
  const [categories, setCategories] = useState<CommunityCategory[]>([]);
  const [channels, setChannels] = useState<CommunityChannel[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [roles, setRoles] = useState<CommunityRole[]>([]);
  const [memberRolesMap, setMemberRolesMap] = useState<MemberRolesMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    if (!service || !communityId) return;
    try {
      setIsLoading(true);
      const [communityData, spacesData, categoriesData, channelsData, membersData, rolesData] = await Promise.all([
        service.getCommunity(communityId),
        service.getSpaces(communityId),
        service.getAllCategories(communityId),
        service.getAllChannels(communityId),
        service.getCommunityMembers(communityId),
        service.getCommunityRoles(communityId),
      ]);

      setCommunity(communityData);
      setSpaces(spacesData);
      setCategories(categoriesData);
      setChannels(channelsData);
      setMembers(membersData);
      setRoles(rolesData);

      // Fetch per-member role assignments
      const rolesMapResult: MemberRolesMap = {};
      await Promise.all(
        membersData.map(async (member) => {
          try {
            const memberRoles = await service.getMemberRoles(communityId, member.memberDid);
            rolesMapResult[member.memberDid] = memberRoles;
          } catch {
            rolesMapResult[member.memberDid] = [];
          }
        }),
      );
      setMemberRolesMap(rolesMapResult);

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
      fetchAll();
    }
  }, [isReady, service, communityId, fetchAll]);

  // Reset state when community changes
  useEffect(() => {
    if (!communityId) {
      setCommunity(null);
      setSpaces([]);
      setCategories([]);
      setChannels([]);
      setMembers([]);
      setRoles([]);
      setMemberRolesMap({});
      setIsLoading(false);
    }
  }, [communityId]);

  // Subscribe to community events for real-time updates
  useEffect(() => {
    if (!service || !communityId) return;

    const unsubscribe = service.onCommunityEvent((event: CommunityEvent) => {
      // Only handle events for this community
      if ('communityId' in event && event.communityId !== communityId) return;

      switch (event.type) {
        case 'communityUpdated':
          // Refresh community metadata
          service.getCommunity(communityId).then(setCommunity).catch(() => {});
          break;

        case 'spaceCreated':
        case 'spaceUpdated':
        case 'spaceDeleted':
          // Refresh spaces
          service.getSpaces(communityId).then(setSpaces).catch(() => {});
          break;

        case 'categoryCreated':
        case 'categoryUpdated':
        case 'categoryDeleted':
          // Refresh categories
          service.getAllCategories(communityId).then(setCategories).catch(() => {});
          break;

        case 'channelCreated':
        case 'channelUpdated':
        case 'channelDeleted':
          // Refresh channels
          service.getAllChannels(communityId).then(setChannels).catch(() => {});
          break;

        case 'memberJoined':
        case 'memberLeft':
        case 'memberKicked':
        case 'memberBanned':
        case 'memberUnbanned':
          // Refresh members
          service.getCommunityMembers(communityId).then(setMembers).catch(() => {});
          break;

        case 'roleAssigned':
        case 'roleUnassigned':
          // Refresh roles and members (role changes affect member display)
          service.getCommunityRoles(communityId).then(setRoles).catch(() => {});
          service.getCommunityMembers(communityId).then((membersData) => {
            setMembers(membersData);
            // Re-fetch member-role mappings
            const rolesMapResult: MemberRolesMap = {};
            Promise.all(
              membersData.map(async (member) => {
                try {
                  const memberRoles = await service.getMemberRoles(communityId, member.memberDid);
                  rolesMapResult[member.memberDid] = memberRoles;
                } catch {
                  rolesMapResult[member.memberDid] = [];
                }
              }),
            ).then(() => setMemberRolesMap(rolesMapResult)).catch(() => {});
          }).catch(() => {});
          break;

        case 'communityRoleCreated':
        case 'communityRoleUpdated':
        case 'communityRolePermissionsUpdated':
        case 'communityRoleDeleted':
          // Refresh roles when roles are created, updated, or deleted
          service.getCommunityRoles(communityId).then(setRoles).catch(() => {});
          break;
      }
    });

    return unsubscribe;
  }, [service, communityId]);

  return {
    community,
    spaces,
    categories,
    channels,
    members,
    roles,
    memberRolesMap,
    isLoading,
    error,
    refresh: fetchAll,
  };
}
