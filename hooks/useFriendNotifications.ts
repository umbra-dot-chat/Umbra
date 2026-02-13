/**
 * useFriendNotifications — Hook for displaying toast notifications on friend events.
 *
 * Subscribes to onFriendEvent() and shows toast notifications for:
 * - requestReceived: "Friend Request from X"
 * - requestAccepted: "Request Accepted"
 *
 * Includes a 1-second mount guard to prevent showing toasts for stale events.
 *
 * ## Usage
 *
 * ```tsx
 * // In a layout or top-level component:
 * useFriendNotifications();
 * ```
 */

import { useEffect, useRef } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import { useToast } from '@coexist/wisp-react-native';
import type { FriendEvent } from '@umbra/service';

export function useFriendNotifications(): void {
  const { service, isReady } = useUmbra();
  const { toast } = useToast();
  const mountedAtRef = useRef<number>(0);

  useEffect(() => {
    // Record mount time for the 1-second guard
    mountedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!service || !isReady) return;

    const unsubscribe = service.onFriendEvent((event: FriendEvent) => {
      // 1-second mount guard: ignore events that arrive within 1 second of mount
      // This prevents showing toasts for events that were queued before the component mounted
      const elapsed = Date.now() - mountedAtRef.current;
      if (elapsed < 1000) {
        return;
      }

      switch (event.type) {
        case 'requestReceived': {
          const senderName = event.request.fromDisplayName || event.request.fromDid.slice(0, 16) + '...';
          toast({
            title: 'Friend Request',
            description: `${senderName} wants to be your friend`,
            variant: 'default',
            duration: 5000,
          });
          break;
        }

        case 'requestAccepted': {
          const friendDid = event.did.slice(0, 16) + '...';
          toast({
            title: 'Request Accepted',
            description: `You are now friends with ${friendDid}`,
            variant: 'success',
            duration: 4000,
          });
          break;
        }

        case 'requestRejected': {
          toast({
            title: 'Request Declined',
            description: 'Your friend request was declined',
            variant: 'default',
            duration: 4000,
          });
          break;
        }

        case 'friendOnline': {
          // Optionally show online notification
          // Could be noisy, so keeping it silent for now
          break;
        }

        case 'friendOffline': {
          // Silent - no notification for offline
          break;
        }

        case 'friendUpdated': {
          // Silent - no notification for profile updates
          break;
        }
      }
    });

    return unsubscribe;
  }, [service, isReady, toast]);
}
