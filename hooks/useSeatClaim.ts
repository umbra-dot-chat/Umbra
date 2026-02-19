/**
 * useSeatClaim — Hook for detecting and claiming ghost member seats.
 *
 * When a user enters a community that has unclaimed seats, this hook:
 * 1. Fetches their linked platform accounts (from the discovery service)
 * 2. Fetches unclaimed seats for the community
 * 3. Matches: seat.platform === account.platform && seat.platformUsername === account.username
 * 4. Returns matching seats + claimSeat action
 *
 * Claiming a seat auto-joins the community and assigns original roles.
 *
 * @packageDocumentation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CommunitySeat } from '@umbra/service';
import { getDiscoveryStatus } from '@umbra/service';
import { useUmbra } from '@/contexts/UmbraContext';

export interface UseSeatClaimResult {
  /** Seats matching the user's linked accounts. */
  matchingSeats: CommunitySeat[];
  /** Whether the hook is checking for matching seats. */
  isChecking: boolean;
  /** Claim a seat (auto-joins community + assigns roles). */
  claimSeat: (seatId: string) => Promise<void>;
  /** Dismiss a seat (hides it from the banner). */
  dismissSeat: (seatId: string) => void;
  /** Whether the check has completed at least once. */
  checked: boolean;
}

/**
 * Hook for detecting and claiming ghost member seats in a community.
 *
 * @param communityId - The community to check seats for.
 * @param userDid - The current user's DID.
 */
export function useSeatClaim(
  communityId: string | null,
  userDid: string | null,
): UseSeatClaimResult {
  const { service } = useUmbra();
  const [matchingSeats, setMatchingSeats] = useState<CommunitySeat[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const dismissedRef = useRef<Set<string>>(new Set());

  // Check for matching seats when community/user changes
  useEffect(() => {
    if (!communityId || !userDid || !service) {
      setMatchingSeats([]);
      setChecked(false);
      return;
    }

    let cancelled = false;

    const checkSeats = async () => {
      setIsChecking(true);
      try {
        // 1. Fetch user's linked platform accounts
        const status = await getDiscoveryStatus(userDid);
        if (cancelled) return;

        if (!status.accounts || status.accounts.length === 0) {
          setMatchingSeats([]);
          setChecked(true);
          return;
        }

        // 2. Fetch unclaimed seats for this community
        const seats = await service.getUnclaimedSeats(communityId);
        if (cancelled) return;

        if (!seats || seats.length === 0) {
          setMatchingSeats([]);
          setChecked(true);
          return;
        }

        // 3. Match by platform + username
        // Build a lookup from platform+username to linked account
        const accountMap = new Map<string, boolean>();
        for (const account of status.accounts) {
          accountMap.set(`${account.platform}:${account.username.toLowerCase()}`, true);
        }

        const matches = seats.filter((seat) => {
          if (dismissedRef.current.has(seat.id)) return false;
          const key = `${seat.platform}:${seat.platformUsername.toLowerCase()}`;
          return accountMap.has(key);
        });

        setMatchingSeats(matches);
        setChecked(true);
      } catch (err) {
        console.warn('[useSeatClaim] Failed to check seats:', err);
        setMatchingSeats([]);
        setChecked(true);
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    };

    checkSeats();

    return () => {
      cancelled = true;
    };
  }, [communityId, userDid, service]);

  const claimSeat = useCallback(
    async (seatId: string) => {
      if (!service || !userDid) return;

      await service.claimSeat(seatId, userDid);

      // Remove from matching list
      setMatchingSeats((prev) => prev.filter((s) => s.id !== seatId));
    },
    [service, userDid],
  );

  const dismissSeat = useCallback((seatId: string) => {
    dismissedRef.current.add(seatId);
    setMatchingSeats((prev) => prev.filter((s) => s.id !== seatId));
  }, []);

  return {
    matchingSeats,
    isChecking,
    claimSeat,
    dismissSeat,
    checked,
  };
}
