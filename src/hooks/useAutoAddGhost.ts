/**
 * useAutoAddGhost — Automatically sends a friend request to Ghost AI agents
 * on first launch (after account creation).
 *
 * Uses a per-DID localStorage flag to ensure it only runs once per account.
 * Ghost auto-accepts friend requests, so the user gets a welcome message
 * shortly after.
 */

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNetwork } from '@/hooks/useNetwork';
import { AI_AGENTS } from '@/config/network';

const STORAGE_KEY_PREFIX = 'ghost_auto_added_';

function getStorageKey(did: string): string {
  return `${STORAGE_KEY_PREFIX}${did}`;
}

function hasAutoAdded(did: string): boolean {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(getStorageKey(did)) === '1';
    }
    // On native, use a global flag (AsyncStorage could be used for persistence)
    return (globalThis as any).__ghostAutoAdded?.[did] === true;
  } catch {
    return false;
  }
}

function markAutoAdded(did: string): void {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(getStorageKey(did), '1');
    } else {
      const store = (globalThis as any).__ghostAutoAdded ?? {};
      store[did] = true;
      (globalThis as any).__ghostAutoAdded = store;
    }
  } catch {
    // Silently fail — not critical
  }
}

/**
 * Hook that auto-sends friend requests to configured AI agents on first launch.
 * Should be called once in a component that has access to UmbraContext and AuthContext.
 */
export function useAutoAddGhost(): void {
  const { service, isReady } = useUmbra();
  const { identity } = useAuth();
  const { getRelayWs } = useNetwork();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!isReady || !service || !identity?.did || attemptedRef.current) return;

    // Don't run if already auto-added for this account
    if (hasAutoAdded(identity.did)) return;

    attemptedRef.current = true;

    // Filter agents that have DIDs configured
    const agents = AI_AGENTS.filter((a) => a.did.length > 0);
    if (agents.length === 0) {
      markAutoAdded(identity.did);
      return;
    }

    // Delay slightly to let the app fully initialize
    const timer = setTimeout(async () => {
      try {
        // Check existing friends to avoid duplicate requests
        const friends = await service.getFriends();
        const friendDids = new Set(friends.map((f) => f.did));

        // Check existing outgoing requests
        const outgoing = await service.getOutgoingRequests();
        const outgoingDids = new Set(outgoing.map((r) => r.toDid));

        const relayWs = getRelayWs();
        const fromIdentity = { did: identity.did, displayName: identity.displayName };

        for (const agent of agents) {
          // Skip if already friends or already sent a request
          if (friendDids.has(agent.did) || outgoingDids.has(agent.did)) continue;

          try {
            await service.sendFriendRequest(agent.did, undefined, relayWs, fromIdentity);
            console.log(`[AutoAddGhost] Sent friend request to ${agent.displayName}`);
          } catch (err) {
            console.warn(`[AutoAddGhost] Failed to add ${agent.displayName}:`, err);
          }
        }

        markAutoAdded(identity.did);
      } catch (err) {
        console.warn('[AutoAddGhost] Error during auto-add:', err);
      }
    }, 3000); // 3-second delay to ensure relay is connected

    return () => clearTimeout(timer);
  }, [isReady, service, identity, getRelayWs]);
}
