/**
 * useNotificationListener — Subscribes to all service events and creates
 * persistent notification records via NotificationContext.
 *
 * Replaces the direct sound/toast calls in useFriendNotifications with a
 * unified pipeline: event -> DB record -> state update -> sound.
 *
 * Includes a 1-second mount guard to prevent stale events.
 */

import { useEffect, useRef } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useSound } from '@/contexts/SoundContext';
import type { FriendEvent, GroupEvent, CommunityEvent } from '@umbra/service';

export function useNotificationListener(): void {
  const { service, isReady } = useUmbra();
  const { addNotification } = useNotifications();
  const { playSound } = useSound();
  const mountedAtRef = useRef<number>(0);

  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);

  // ------ Friend events ------
  useEffect(() => {
    if (!service || !isReady) return;

    const unsubscribe = service.onFriendEvent((event: FriendEvent) => {
      const elapsed = Date.now() - mountedAtRef.current;
      if (elapsed < 1000) return;

      switch (event.type) {
        case 'requestReceived': {
          const senderName =
            event.request?.fromDisplayName ??
            (event.request?.fromDid ? event.request.fromDid.slice(0, 16) + '...' : 'Someone');
          playSound('friend_request');
          addNotification({
            type: 'friend_request_received',
            title: 'Friend Request',
            description: `${senderName} sent you a friend request`,
            relatedDid: event.request?.fromDid,
            relatedId: event.request?.id,
            avatar: event.request?.fromAvatar,
          });
          break;
        }

        case 'requestAccepted': {
          const friendDid = event.did?.slice(0, 16) + '...';
          playSound('friend_accept');
          addNotification({
            type: 'friend_request_accepted',
            title: 'Request Accepted',
            description: `You are now friends with ${friendDid}`,
            relatedDid: event.did,
          });
          break;
        }

        case 'requestRejected': {
          playSound('notification');
          addNotification({
            type: 'friend_request_rejected',
            title: 'Request Declined',
            description: 'Your friend request was declined',
            relatedDid: event.did,
          });
          break;
        }

        // friendOnline, friendOffline, friendUpdated — silent, no notification
        default:
          break;
      }
    });

    return unsubscribe;
  }, [service, isReady, addNotification, playSound]);

  // ------ Call events ------
  useEffect(() => {
    if (!service || !isReady) return;

    const unsubscribe = service.onCallEvent((event: any) => {
      const elapsed = Date.now() - mountedAtRef.current;
      if (elapsed < 1000) return;

      if (event.type === 'callEnded' || event.type === 'call_ended') {
        const status = event.status ?? event.reason;
        if (status === 'missed' || status === 'timeout' || status === 'declined') {
          playSound('notification');
          addNotification({
            type: 'call_missed',
            title: 'Missed Call',
            description: event.callerName ?? (event.callerDid ? event.callerDid.slice(0, 16) + '...' : 'Unknown caller'),
            relatedDid: event.callerDid,
            relatedId: event.callId,
          });
        }
      }
    });

    return unsubscribe;
  }, [service, isReady, addNotification, playSound]);

  // ------ Group events ------
  useEffect(() => {
    if (!service || !isReady) return;

    const unsubscribe = service.onGroupEvent((event: GroupEvent) => {
      const elapsed = Date.now() - mountedAtRef.current;
      if (elapsed < 1000) return;

      switch (event.type) {
        case 'inviteReceived': {
          const groupName = event.invite?.groupName ?? 'a group';
          const inviterName = event.invite?.inviterName ?? 'Someone';
          playSound('notification');
          addNotification({
            type: 'group_invite',
            title: 'Group Invite',
            description: `${inviterName} invited you to ${groupName}`,
            relatedDid: event.invite?.inviterDid,
            relatedId: event.invite?.id,
          });
          break;
        }

        // inviteAccepted, inviteDeclined, memberRemoved, keyRotated, groupMessageReceived — silent
        default:
          break;
      }
    });

    return unsubscribe;
  }, [service, isReady, addNotification, playSound]);

  // ------ Community events ------
  useEffect(() => {
    if (!service || !isReady) return;

    const unsubscribe = service.onCommunityEvent((event: CommunityEvent) => {
      const elapsed = Date.now() - mountedAtRef.current;
      if (elapsed < 1000) return;

      switch (event.type) {
        case 'memberJoined': {
          // Only notify when someone else joins a community we're in
          playSound('notification');
          addNotification({
            type: 'community_invite',
            title: 'New Member',
            description: `A new member joined your community`,
            relatedDid: event.memberDid,
            relatedId: event.communityId,
          });
          break;
        }

        case 'memberKicked':
        case 'memberBanned': {
          playSound('notification');
          addNotification({
            type: 'system',
            title: event.type === 'memberKicked' ? 'Member Kicked' : 'Member Banned',
            description: `A member was ${event.type === 'memberKicked' ? 'kicked from' : 'banned from'} your community`,
            relatedId: event.communityId,
          });
          break;
        }

        // Other community events are silent (channel created, role changes, etc.)
        default:
          break;
      }
    });

    return unsubscribe;
  }, [service, isReady, addNotification, playSound]);
}
