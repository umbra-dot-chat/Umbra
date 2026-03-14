/**
 * useGroups — Thin wrapper around GroupsContext.
 *
 * All group fetching, event subscriptions, and state management
 * now happen in a single GroupsProvider instance.
 * This hook just reads from that context.
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

import { useGroupsContext } from '@/contexts/GroupsContext';
import type { GroupsContextValue } from '@/contexts/GroupsContext';

export type UseGroupsResult = GroupsContextValue;

export function useGroups(): UseGroupsResult {
  return useGroupsContext();
}
