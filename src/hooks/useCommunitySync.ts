/**
 * useCommunitySync — Hook for broadcasting community events to other clients.
 *
 * Wraps `dispatchCommunityEvent` (local UI refresh) with
 * `broadcastCommunityEvent` (relay fan-out to all community members).
 *
 * ## Usage
 *
 * ```tsx
 * const { syncEvent } = useCommunitySync(communityId);
 *
 * // After a CRUD operation:
 * syncEvent({ type: 'channelCreated', communityId, channelId: channel.id });
 * ```
 */

import { useCallback } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import type { CommunityEvent } from '@umbra/service';

export function useCommunitySync(communityId: string) {
  const { service } = useUmbra();
  const { identity } = useAuth();
  const myDid = identity?.did ?? '';

  /**
   * Dispatch a community event locally AND broadcast it to other clients.
   *
   * 1. Calls `service.dispatchCommunityEvent()` so the local UI updates
   *    immediately (same-client reactivity via `useCommunity`).
   * 2. Calls `service.broadcastCommunityEvent()` which sends a
   *    `community_event` relay envelope to all other community members.
   */
  const syncEvent = useCallback(
    (event: CommunityEvent) => {
      if (!service) return;

      // 1. Dispatch locally (same client)
      service.dispatchCommunityEvent(event);

      // 2. Broadcast to other clients via relay
      const relayWs = service.getRelayWs();
      service
        .broadcastCommunityEvent(communityId, event, myDid, relayWs)
        .catch((err) => {
          console.warn('[useCommunitySync] Failed to broadcast event:', err);
        });
    },
    [service, communityId, myDid],
  );

  return { syncEvent };
}
