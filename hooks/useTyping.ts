/**
 * useTyping — Hook for typing indicator management.
 *
 * Tracks who is typing in a conversation and provides a function to
 * send typing indicators to other participants. Supports both DM
 * and group conversations with multiple simultaneous typers.
 *
 * ## Usage
 *
 * ```tsx
 * const { typingUsers, typingDisplay, sendTyping } = useTyping(conversationId);
 * // typingDisplay: "Alice is typing..." or "Alice and Bob are typing..."
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNetwork } from '@/hooks/useNetwork';
import type { MessageEvent } from '@umbra/service';

/** How long before a typing indicator expires (no refresh received) */
const TYPING_TIMEOUT_MS = 4000;

/** Minimum interval between sending typing indicators */
const TYPING_THROTTLE_MS = 2000;

export interface UseTypingResult {
  /** Map of DID → display name for users currently typing */
  typingUsers: Map<string, string>;
  /** Formatted display string (e.g., "Alice is typing..." or "Alice and Bob are typing...") */
  typingDisplay: string | null;
  /** Call this when the local user is typing (will auto-throttle) */
  sendTyping: () => void;
  /** Call this when the local user stops typing (e.g., cleared input, sent message) */
  sendStopTyping: () => void;
}

export function useTyping(
  conversationId: string | null,
  /** DIDs of conversation participants to send typing indicators to */
  participantDids?: string[],
): UseTypingResult {
  const { service } = useUmbra();
  const { identity } = useAuth();
  const { getRelayWs } = useNetwork();
  const myDid = identity?.did ?? '';
  const myName = identity?.displayName ?? '';

  // Track typing users: DID → { name, timeoutId }
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const lastSentRef = useRef<number>(0);
  const isSendingRef = useRef(false);

  // Subscribe to typing events
  useEffect(() => {
    if (!service || !conversationId) return;

    const unsubscribe = service.onMessageEvent((event: MessageEvent) => {
      if (event.type === 'typingStarted' && event.conversationId === conversationId) {
        const did = event.did;
        if (did === myDid) return; // Ignore our own typing

        setTypingUsers((prev) => {
          const next = new Map(prev);
          // We don't have the name in the event, use DID as fallback
          if (!next.has(did)) {
            next.set(did, did.slice(0, 12) + '...');
          }
          return next;
        });

        // Clear existing timeout for this user
        const existingTimeout = timeoutsRef.current.get(did);
        if (existingTimeout) clearTimeout(existingTimeout);

        // Set new timeout to clear this user's typing status
        const timeout = setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Map(prev);
            next.delete(did);
            return next;
          });
          timeoutsRef.current.delete(did);
        }, TYPING_TIMEOUT_MS);

        timeoutsRef.current.set(did, timeout);
      } else if (event.type === 'typingStopped' && event.conversationId === conversationId) {
        const did = event.did;
        if (did === myDid) return;

        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.delete(did);
          return next;
        });

        const existingTimeout = timeoutsRef.current.get(did);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          timeoutsRef.current.delete(did);
        }
      }
    });

    return () => {
      unsubscribe();
      // Clear all timeouts on unmount
      for (const timeout of timeoutsRef.current.values()) {
        clearTimeout(timeout);
      }
      timeoutsRef.current.clear();
      setTypingUsers(new Map());
    };
  }, [service, conversationId, myDid]);

  // Send typing indicator (throttled)
  const sendTyping = useCallback(() => {
    if (!service || !conversationId || !myDid || !participantDids?.length) return;

    const now = Date.now();
    if (now - lastSentRef.current < TYPING_THROTTLE_MS) return;
    if (isSendingRef.current) return;

    lastSentRef.current = now;
    isSendingRef.current = true;

    const relayWs = getRelayWs();
    // Send to each participant
    for (const did of participantDids) {
      if (did === myDid) continue;
      service.sendTypingIndicator(
        conversationId, did, myDid, myName, true, relayWs
      ).catch(() => {});
    }

    // Allow next send after throttle period
    setTimeout(() => {
      isSendingRef.current = false;
    }, TYPING_THROTTLE_MS);
  }, [service, conversationId, myDid, myName, participantDids, getRelayWs]);

  // Send stop typing
  const sendStopTyping = useCallback(() => {
    if (!service || !conversationId || !myDid || !participantDids?.length) return;

    const relayWs = getRelayWs();
    for (const did of participantDids) {
      if (did === myDid) continue;
      service.sendTypingIndicator(
        conversationId, did, myDid, myName, false, relayWs
      ).catch(() => {});
    }

    lastSentRef.current = 0; // Reset throttle
    isSendingRef.current = false;
  }, [service, conversationId, myDid, myName, participantDids, getRelayWs]);

  // Format display string
  const typingDisplay = (() => {
    if (typingUsers.size === 0) return null;
    const names = Array.from(typingUsers.values());
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names.length} people are typing...`;
  })();

  return { typingUsers, typingDisplay, sendTyping, sendStopTyping };
}
