/**
 * Discovery React hooks
 *
 * Hooks for managing linked accounts and friend discovery.
 *
 * @packageDocumentation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform as RNPlatform } from 'react-native';

import * as api from './api';
import type {
  DiscoveryStatus,
  FriendSuggestion,
  HashedLookup,
  LinkedAccountInfo,
  LookupResult,
  Platform,
  UsernameLookupResult,
  UsernameResponse,
  UsernameSearchResult,
} from './types';

/**
 * Open a centered popup for OAuth.
 * Returns the popup window reference or null if blocked.
 */
function openOAuthPopup(url: string): Window | null {
  const width = 500;
  const height = 700;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  return window.open(
    url,
    'umbra_link_oauth_popup',
    `width=${width},height=${height},left=${left},top=${top},popup=yes`
  );
}

/**
 * Hook for managing linked accounts.
 *
 * Uses profile import OAuth (which has registered redirect URIs) to
 * authenticate the user on each platform, then calls the direct link
 * endpoint to associate the account with their Umbra DID.
 *
 * @param did - The user's Umbra DID
 * @returns Linked accounts state and management functions
 *
 * @example
 * ```tsx
 * const { accounts, discoverable, linkDiscord, unlinkAccount } = useLinkedAccounts(did);
 * ```
 */
export function useLinkedAccounts(did: string | null) {
  const [status, setStatus] = useState<DiscoveryStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const popupRef = useRef<Window | null>(null);
  const pendingLinkRef = useRef<{ platform: Platform; resolve: (v: boolean) => void; reject: (e: Error) => void } | null>(null);

  // Fetch status on mount and when DID changes
  const fetchStatus = useCallback(async () => {
    if (!did) {
      setStatus(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.getStatus(did);
      setStatus(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [did]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Listen for postMessage from OAuth popup (web only)
  useEffect(() => {
    if (RNPlatform.OS !== 'web') return;

    const handleMessage = async (event: MessageEvent) => {
      // Only handle profile import messages
      if (!event.data || event.data.type !== 'UMBRA_PROFILE_IMPORT') return;

      const pending = pendingLinkRef.current;
      if (!pending) return;

      try {
        if (event.data.success && event.data.profile) {
          // The relay already linked the account server-side (we passed the DID).
          // Just refresh the status to pick up the new linked account.
          await fetchStatus();
          pending.resolve(true);
        } else if (event.data.error) {
          pending.reject(new Error(event.data.error));
        } else {
          pending.resolve(false);
        }
      } catch (err) {
        pending.reject(err instanceof Error ? err : new Error(String(err)));
      } finally {
        pendingLinkRef.current = null;
        setIsLoading(false);
        // Close popup if still open
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
        }
        popupRef.current = null;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchStatus]);

  // Link account via profile import OAuth (relay auto-links when DID is provided)
  const linkAccount = useCallback(
    async (platform: Platform): Promise<boolean> => {
      if (!did) return false;

      try {
        setIsLoading(true);
        setError(null);

        // Use profile import OAuth with DID — relay will auto-link the account
        const { redirectUrl } = await api.startProfileImport(platform, did);

        if (RNPlatform.OS === 'web') {
          // Open OAuth in popup
          popupRef.current = openOAuthPopup(redirectUrl);

          if (!popupRef.current) {
            throw new Error('Popup was blocked. Please allow popups for this site.');
          }

          // Return a promise that resolves when postMessage is received
          return new Promise<boolean>((resolve, reject) => {
            pendingLinkRef.current = { platform, resolve, reject };

            // Poll for popup close (user cancelled)
            const pollInterval = setInterval(() => {
              if (popupRef.current && popupRef.current.closed) {
                clearInterval(pollInterval);
                if (pendingLinkRef.current) {
                  pendingLinkRef.current = null;
                  setIsLoading(false);
                  resolve(false);
                }
              }
            }, 500);
          });
        } else {
          // For native, open in system browser and refresh on return
          const { Linking } = await import('react-native');
          await Linking.openURL(redirectUrl);
          await fetchStatus();
          return true;
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsLoading(false);
        return false;
      }
    },
    [did, fetchStatus]
  );

  // Unlink account
  const unlinkAccount = useCallback(
    async (platform: Platform): Promise<boolean> => {
      if (!did) return false;

      try {
        setIsLoading(true);
        setError(null);

        const result = await api.unlinkAccount(did, platform);
        setStatus(result);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [did]
  );

  // Convenience methods
  const linkDiscord = useCallback(() => linkAccount('discord'), [linkAccount]);
  const linkGitHub = useCallback(() => linkAccount('github'), [linkAccount]);
  const linkSteam = useCallback(() => linkAccount('steam'), [linkAccount]);
  const linkBluesky = useCallback(() => linkAccount('bluesky'), [linkAccount]);
  const linkXbox = useCallback(() => linkAccount('xbox'), [linkAccount]);

  return {
    /** All linked accounts. */
    accounts: status?.accounts ?? [],
    /** Whether the user is discoverable. */
    discoverable: status?.discoverable ?? false,
    /** Whether a request is in progress. */
    isLoading,
    /** The last error, if any. */
    error,
    /** Link a Discord account via OAuth. */
    linkDiscord,
    /** Link a GitHub account via OAuth. */
    linkGitHub,
    /** Link a Steam account via OpenID. */
    linkSteam,
    /** Link a Bluesky account via OAuth. */
    linkBluesky,
    /** Link an Xbox account via Microsoft OAuth. */
    linkXbox,
    /** Link any platform account via OAuth. */
    linkAccount,
    /** Unlink an account. */
    unlinkAccount,
    /** Refresh the status. */
    refresh: fetchStatus,
  };
}

/**
 * Hook for managing discoverability settings.
 *
 * @param did - The user's Umbra DID
 * @returns Discoverability state and toggle function
 */
export function useDiscovery(did: string | null) {
  const [discoverable, setDiscoverable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch initial state
  useEffect(() => {
    if (!did) {
      setDiscoverable(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const status = await api.getStatus(did);
        setDiscoverable(status.discoverable);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    fetchStatus();
  }, [did]);

  // Toggle discoverability
  const setDiscoverability = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      if (!did) return false;

      try {
        setIsLoading(true);
        setError(null);

        const status = await api.updateSettings(did, enabled);
        setDiscoverable(status.discoverable);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [did]
  );

  const toggle = useCallback(
    () => setDiscoverability(!discoverable),
    [discoverable, setDiscoverability]
  );

  return {
    /** Whether the user is discoverable. */
    discoverable,
    /** Whether a request is in progress. */
    isLoading,
    /** The last error, if any. */
    error,
    /** Set discoverability to a specific value. */
    setDiscoverability,
    /** Toggle discoverability. */
    toggle,
  };
}

/**
 * Hook for finding friends from other platforms.
 *
 * @returns Friend suggestion lookup functions
 *
 * @example
 * ```tsx
 * const { lookupFriends, suggestions } = useFriendSuggestions();
 *
 * // When user imports their Discord friends list
 * const discordIds = ['123', '456', '789'];
 * await lookupFriends('discord', discordIds);
 * ```
 */
export function useFriendSuggestions() {
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Cache for platform ID to username mapping
  const usernameCache = useRef<Map<string, string>>(new Map());

  /**
   * Look up friends by their platform IDs.
   *
   * @param platform - The platform to search
   * @param platformIds - Array of platform user IDs
   * @param usernames - Optional map of platform ID to username (for display)
   */
  const lookupFriends = useCallback(
    async (
      platform: Platform,
      platformIds: string[],
      usernames?: Record<string, string>
    ): Promise<FriendSuggestion[]> => {
      if (platformIds.length === 0) return [];

      try {
        setIsLoading(true);
        setError(null);

        // Store usernames in cache
        if (usernames) {
          for (const [id, name] of Object.entries(usernames)) {
            usernameCache.current.set(`${platform}:${id}`, name);
          }
        }

        // Create hashes for all platform IDs
        const lookups = await api.batchCreateHashes(platform, platformIds);

        // Perform batch lookup
        const results = await api.batchLookup(lookups);

        // Convert results to suggestions
        const newSuggestions: FriendSuggestion[] = results
          .filter((r): r is LookupResult & { did: string } => r.did !== null)
          .map((r, index) => {
            const platformId = platformIds[index];
            const username =
              usernameCache.current.get(`${platform}:${platformId}`) ??
              platformId;

            return {
              umbraDid: r.did,
              platform: r.platform,
              platformUsername: username,
            };
          });

        // Merge with existing suggestions (dedupe by DID)
        setSuggestions((prev) => {
          const didSet = new Set(prev.map((s) => s.umbraDid));
          const unique = newSuggestions.filter((s) => !didSet.has(s.umbraDid));
          return [...prev, ...unique];
        });

        return newSuggestions;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Dismiss a friend suggestion.
   */
  const dismissSuggestion = useCallback((did: string) => {
    setSuggestions((prev) => prev.filter((s) => s.umbraDid !== did));
  }, []);

  /**
   * Clear all suggestions.
   */
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    /** Current friend suggestions. */
    suggestions,
    /** Whether a lookup is in progress. */
    isLoading,
    /** The last error, if any. */
    error,
    /** Look up friends by platform IDs. */
    lookupFriends,
    /** Dismiss a specific suggestion. */
    dismissSuggestion,
    /** Clear all suggestions. */
    clearSuggestions,
  };
}

// ── Username Hooks ──────────────────────────────────────────────────────────

/**
 * Hook for managing the user's own username (Name#Tag).
 *
 * Fetches the current username on mount and provides functions
 * to register, change, and release usernames.
 *
 * @param did - The user's Umbra DID
 * @returns Username state and management functions
 *
 * @example
 * ```tsx
 * const { username, name, tag, register, change, release } = useUsername(did);
 *
 * // Register a new username
 * await register('Matt');
 * // → username = "Matt#01283"
 * ```
 */
export function useUsername(did: string | null) {
  const [data, setData] = useState<UsernameResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch username on mount and when DID changes
  const refresh = useCallback(async () => {
    if (!did) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.getUsername(did);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [did]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Register a new username
  const register = useCallback(
    async (name: string): Promise<UsernameResponse | null> => {
      if (!did) return null;

      try {
        setIsLoading(true);
        setError(null);

        const result = await api.registerUsername(did, name);
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [did]
  );

  // Change username (releases old, registers new with fresh tag)
  const change = useCallback(
    async (name: string): Promise<UsernameResponse | null> => {
      if (!did) return null;

      try {
        setIsLoading(true);
        setError(null);

        const result = await api.changeUsername(did, name);
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [did]
  );

  // Release (delete) the username
  const release = useCallback(async (): Promise<boolean> => {
    if (!did) return false;

    try {
      setIsLoading(true);
      setError(null);

      const success = await api.releaseUsername(did);
      if (success) {
        setData((prev) =>
          prev
            ? { ...prev, username: null, name: null, tag: null, registeredAt: null }
            : null
        );
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [did]);

  return {
    /** The full username (Name#Tag), or null if not set. */
    username: data?.username ?? null,
    /** The name portion only, or null. */
    name: data?.name ?? null,
    /** The 5-digit tag, or null. */
    tag: data?.tag ?? null,
    /** When the username was registered, or null. */
    registeredAt: data?.registeredAt ?? null,
    /** Whether a request is in progress. */
    isLoading,
    /** The last error, if any. */
    error,
    /** Register a new username. */
    register,
    /** Change username (releases old, registers new). */
    change,
    /** Release (delete) the username. */
    release,
    /** Refresh username from server. */
    refresh,
  };
}

/**
 * Hook for searching usernames.
 *
 * Supports both partial name search and exact Name#Tag lookup.
 * Auto-detects which to use based on whether the query contains '#'.
 *
 * @returns Username search state and functions
 *
 * @example
 * ```tsx
 * const { results, search, isLoading } = useUsernameSearch();
 *
 * // Partial search
 * await search('Matt');
 * // → results = [{ did: '...', username: 'Matt#01283' }, ...]
 *
 * // Exact lookup
 * await search('Matt#01283');
 * // → results = [{ did: '...', username: 'Matt#01283' }]
 * ```
 */
export function useUsernameSearch() {
  const [results, setResults] = useState<UsernameSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(async (query: string): Promise<UsernameSearchResult[]> => {
    if (!query || query.length < 2) {
      setResults([]);
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);

      // Auto-detect: if query contains '#', try exact lookup first
      if (query.includes('#')) {
        const lookupResult = await api.lookupUsername(query);
        if (lookupResult.found && lookupResult.did && lookupResult.username) {
          const items: UsernameSearchResult[] = [
            { did: lookupResult.did, username: lookupResult.username },
          ];
          setResults(items);
          return items;
        }
        // If exact lookup fails, fall through to partial search
        // (user might be typing "Matt#" before finishing)
      }

      // Partial name search (strip '#' and anything after for the search)
      const nameQuery = query.includes('#') ? query.split('#')[0] : query;
      if (nameQuery.length < 2) {
        setResults([]);
        return [];
      }

      const items = await api.searchUsernames(nameQuery);
      setResults(items);
      return items;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setResults([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    /** Search results. */
    results,
    /** Whether a search is in progress. */
    isLoading,
    /** The last error, if any. */
    error,
    /** Search for usernames (partial name or exact Name#Tag). */
    search,
    /** Clear results and errors. */
    clear,
  };
}

/**
 * Combined hook for all discovery features.
 *
 * @param did - The user's Umbra DID
 * @returns All discovery state and functions
 */
export function useDiscoveryService(did: string | null) {
  const linkedAccounts = useLinkedAccounts(did);
  const discovery = useDiscovery(did);
  const suggestions = useFriendSuggestions();
  const usernameHook = useUsername(did);

  return {
    // Linked accounts
    accounts: linkedAccounts.accounts,
    linkDiscord: linkedAccounts.linkDiscord,
    linkGitHub: linkedAccounts.linkGitHub,
    linkSteam: linkedAccounts.linkSteam,
    linkBluesky: linkedAccounts.linkBluesky,
    linkXbox: linkedAccounts.linkXbox,
    unlinkAccount: linkedAccounts.unlinkAccount,

    // Discoverability
    discoverable: discovery.discoverable,
    setDiscoverability: discovery.setDiscoverability,
    toggleDiscoverability: discovery.toggle,

    // Friend suggestions
    suggestions: suggestions.suggestions,
    lookupFriends: suggestions.lookupFriends,
    dismissSuggestion: suggestions.dismissSuggestion,
    clearSuggestions: suggestions.clearSuggestions,

    // Username
    username: usernameHook.username,
    usernameName: usernameHook.name,
    usernameTag: usernameHook.tag,
    registerUsername: usernameHook.register,
    changeUsername: usernameHook.change,
    releaseUsername: usernameHook.release,

    // Loading states
    isLinking: linkedAccounts.isLoading,
    isUpdatingDiscovery: discovery.isLoading,
    isLookingUp: suggestions.isLoading,
    isUsernameLoading: usernameHook.isLoading,

    // Errors
    linkError: linkedAccounts.error,
    discoveryError: discovery.error,
    lookupError: suggestions.error,
    usernameError: usernameHook.error,

    // Refresh
    refresh: linkedAccounts.refresh,
    refreshUsername: usernameHook.refresh,
  };
}
