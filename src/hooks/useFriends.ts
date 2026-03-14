/**
 * useFriends — Thin wrapper around FriendsContext.
 *
 * All friend fetching, event subscriptions, and throttling
 * now happen in a single FriendsProvider instance.
 * This hook just reads from that context.
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

import { useFriendsContext } from '@/contexts/FriendsContext';
import type { FriendsContextValue } from '@/contexts/FriendsContext';

export type UseFriendsResult = FriendsContextValue;

export function useFriends(): UseFriendsResult {
  return useFriendsContext();
}
