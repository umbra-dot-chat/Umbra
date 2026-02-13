/**
 * useDiscovery — Hook for peer discovery and connection info.
 *
 * Provides methods for looking up peers, generating shareable
 * connection info, and parsing connection strings.
 *
 * ## Usage
 *
 * ```tsx
 * const { connectionInfo, lookupPeer, getConnectionInfo } = useDiscovery();
 * ```
 */

import { useState, useCallback } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import type { ConnectionInfo, DiscoveryResult } from '@umbra/service';

export interface UseDiscoveryResult {
  /** Our connection info (null until fetched) */
  connectionInfo: ConnectionInfo | null;
  /** Whether an operation is in progress */
  isLoading: boolean;
  /** Error from discovery operations */
  error: Error | null;
  /** Look up a peer by DID */
  lookupPeer: (did: string) => Promise<DiscoveryResult>;
  /** Fetch and cache our connection info */
  getConnectionInfo: () => Promise<ConnectionInfo | null>;
  /** Parse a connection string (link, base64, or JSON) */
  parseConnectionInfo: (info: string) => Promise<ConnectionInfo | null>;
  /** Connect directly to a peer using connection info */
  connectDirect: (info: ConnectionInfo) => Promise<void>;
}

export function useDiscovery(): UseDiscoveryResult {
  const { service } = useUmbra();
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const lookupPeer = useCallback(
    async (did: string): Promise<DiscoveryResult> => {
      if (!service) return { status: 'notFound' };
      try {
        setIsLoading(true);
        return await service.lookupPeer(did);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return { status: 'notFound' };
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  const getConnectionInfo = useCallback(async (): Promise<ConnectionInfo | null> => {
    if (!service) return null;
    try {
      setIsLoading(true);
      const info = await service.getConnectionInfo();
      setConnectionInfo(info);
      setError(null);
      return info;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  const parseConnectionInfo = useCallback(
    async (info: string): Promise<ConnectionInfo | null> => {
      if (!service) return null;
      try {
        return await service.parseConnectionInfo(info);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    [service]
  );

  const connectDirect = useCallback(
    async (info: ConnectionInfo) => {
      if (!service) return;
      try {
        setIsLoading(true);
        await service.connectDirect(info);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  return {
    connectionInfo,
    isLoading,
    error,
    lookupPeer,
    getConnectionInfo,
    parseConnectionInfo,
    connectDirect,
  };
}
