/**
 * useConnectionLink — Hook for connection link generation and parsing.
 *
 * Provides functionality to:
 * - Get the current user's connection info (DID, link)
 * - Parse connection links/DIDs from other users
 *
 * ## Usage
 *
 * ```tsx
 * const {
 *   myConnectionInfo,
 *   myDid,
 *   myLink,
 *   isLoading,
 *   parseLink,
 *   refresh,
 * } = useConnectionLink();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import type { ConnectionInfo } from '@umbra/service';

export interface ParseResult {
  success: boolean;
  connectionInfo?: ConnectionInfo;
  error?: string;
}

export interface UseConnectionLinkResult {
  /** Our connection info (DID, peerId, addresses, link) */
  myConnectionInfo: ConnectionInfo | null;
  /** Our DID string */
  myDid: string | null;
  /** Shareable connection link */
  myLink: string | null;
  /** Whether connection info is loading */
  isLoading: boolean;
  /** Error from operations */
  error: Error | null;
  /** Parse a connection link, DID, or base64 string */
  parseLink: (link: string) => Promise<ParseResult>;
  /** Refresh connection info */
  refresh: () => Promise<void>;
}

export function useConnectionLink(): UseConnectionLinkResult {
  const { service, isReady } = useUmbra();
  const { identity } = useAuth();
  const [myConnectionInfo, setMyConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConnectionInfo = useCallback(async () => {
    if (!service || !isReady || !identity) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const info = await service.getConnectionInfo();
      setMyConnectionInfo(info);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [service, isReady, identity]);

  // Initial fetch
  useEffect(() => {
    fetchConnectionInfo();
  }, [fetchConnectionInfo]);

  const parseLink = useCallback(
    async (link: string): Promise<ParseResult> => {
      if (!service) {
        return { success: false, error: 'Service not initialized' };
      }

      const trimmed = link.trim();
      if (!trimmed) {
        return { success: false, error: 'Empty input' };
      }

      try {
        // The service can parse various formats:
        // - DID (did:key:z6Mk...)
        // - Connection link (umbra://connect/...)
        // - Base64 encoded connection info
        // - JSON connection info
        const connectionInfo = await service.parseConnectionInfo(trimmed);
        return { success: true, connectionInfo };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to parse connection info';
        return { success: false, error: message };
      }
    },
    [service]
  );

  return {
    myConnectionInfo,
    myDid: myConnectionInfo?.did || identity?.did || null,
    myLink: myConnectionInfo?.link || null,
    isLoading,
    error,
    parseLink,
    refresh: fetchConnectionInfo,
  };
}
