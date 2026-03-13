/**
 * useMessageNotifications — Hook for playing notification sounds on incoming messages.
 *
 * Subscribes to onMessageEvent() and plays a notification sound when:
 * - A message is received from another user
 * - The message is NOT in the currently active conversation
 *
 * This complements useMessages which handles sounds for the active conversation.
 *
 * ## Usage
 *
 * ```tsx
 * // In a layout or top-level component:
 * useMessageNotifications(activeConversationId);
 * ```
 */

import { useEffect, useRef } from 'react';
import { dbg } from '@/utils/debug';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSound } from '@/contexts/SoundContext';
import type { MessageEvent } from '@umbra/service';

const SRC = 'useMessageNotifications';

export function useMessageNotifications(activeConversationId: string | null): void {
  const { service, isReady } = useUmbra();
  const { identity } = useAuth();
  const { playSound } = useSound();
  const myDid = identity?.did ?? '';
  const mountedAtRef = useRef<number>(0);
  const lastSoundRef = useRef<number>(0);

  // Use refs for values that change but shouldn't cause re-subscription.
  // This prevents the effect from tearing down and re-subscribing the
  // onMessageEvent listener every time playSound, myDid, or
  // activeConversationId changes identity.
  const playSoundRef = useRef(playSound);
  playSoundRef.current = playSound;
  const myDidRef = useRef(myDid);
  myDidRef.current = myDid;
  const activeConvIdRef = useRef(activeConversationId);
  activeConvIdRef.current = activeConversationId;

  useEffect(() => {
    // Record mount time for the 1-second guard
    mountedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!service || !isReady) return;

    const unsubscribe = service.onMessageEvent((event: MessageEvent) => {
      // 1-second mount guard: ignore events that arrive within 1 second of mount
      // This prevents playing sounds for events that were queued before the component mounted
      const elapsed = Date.now() - mountedAtRef.current;
      if (elapsed < 1000) {
        return;
      }

      // Only handle received messages from other users
      if (event.type !== 'messageReceived') return;

      const msg = event.message;

      // Don't play sound for our own messages
      if (msg.senderDid === myDidRef.current) return;

      // Don't play sound for thread replies (handled separately)
      if (msg.threadId) return;

      // Don't play sound if this is the active conversation
      // (useMessages handles that case)
      if (msg.conversationId === activeConvIdRef.current) return;

      // Throttle: max 1 notification sound per 5 seconds
      const now = Date.now();
      if (now - lastSoundRef.current < 5000) return;
      lastSoundRef.current = now;

      // Play notification sound for messages in other conversations
      playSoundRef.current('message_receive');
    });

    return unsubscribe;
  }, [service, isReady]);
}
