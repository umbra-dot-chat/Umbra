/**
 * Discovery API client
 *
 * HTTP client for the discovery service endpoints.
 *
 * @packageDocumentation
 */

import type {
  DiscoveryStatus,
  HashedLookup,
  LookupResult,
  Platform,
  SearchResult,
  StartAuthResponse,
  UsernameLookupResult,
  UsernameResponse,
  UsernameSearchResult,
} from './types';

/**
 * Default relay URL (can be overridden).
 */
let _relayUrl = 'https://relay.umbra.chat';

/**
 * Set the relay URL for discovery API calls.
 */
export function setRelayUrl(url: string): void {
  _relayUrl = url.replace(/\/$/, ''); // Remove trailing slash
}

/**
 * Get the current relay URL.
 */
export function getRelayUrl(): string {
  return _relayUrl;
}

/**
 * Convert snake_case to camelCase for response objects.
 */
function snakeToCamel<T>(obj: unknown): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel) as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = snakeToCamel(value);
  }
  return result as T;
}

/**
 * Convert camelCase to snake_case for request objects.
 */
function camelToSnake<T>(obj: unknown): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(camelToSnake) as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    result[snakeKey] = camelToSnake(value);
  }
  return result as T;
}

/**
 * Start OAuth flow for a platform.
 *
 * Returns the URL to redirect the user to and a state parameter.
 *
 * @param platform - The platform to link (discord or github)
 * @param did - The user's Umbra DID
 * @returns The redirect URL and state
 */
export async function startAuth(
  platform: Platform,
  did: string
): Promise<StartAuthResponse> {
  const response = await fetch(
    `${_relayUrl}/auth/${platform}/start?did=${encodeURIComponent(did)}`,
    {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to start ${platform} auth: ${error}`);
  }

  const data = await response.json();
  return snakeToCamel<StartAuthResponse>(data);
}

/**
 * Start profile import OAuth flow for a platform.
 *
 * Uses the profile import endpoints (which have registered redirect URIs)
 * and returns the redirect URL for the OAuth popup.
 *
 * When `did` is provided, the relay callback will also auto-link the
 * authenticated platform account to that DID for friend discovery.
 *
 * @param platform - The platform to import from
 * @param did - Optional Umbra DID for auto-linking during import
 * @returns The redirect URL and state
 */
export async function startProfileImport(
  platform: Platform,
  did?: string
): Promise<StartAuthResponse> {
  const response = await fetch(
    `${_relayUrl}/profile/import/${platform}/start`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: did ? JSON.stringify({ did }) : undefined,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to start ${platform} profile import: ${error}`);
  }

  const data = await response.json();
  return snakeToCamel<StartAuthResponse>(data);
}

/**
 * Link a platform account directly.
 *
 * Used after profile import OAuth to associate the imported profile
 * with the user's Umbra DID for friend discovery.
 *
 * @param did - The user's Umbra DID
 * @param platform - The platform to link
 * @param platformId - Platform-specific user ID
 * @param username - Platform-specific username
 * @returns Updated discovery status
 */
export async function linkAccountDirect(
  did: string,
  platform: Platform,
  platformId: string,
  username: string
): Promise<DiscoveryStatus> {
  const response = await fetch(`${_relayUrl}/discovery/link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      did,
      platform,
      platform_id: platformId,
      username,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to link ${platform} account: ${error}`);
  }

  const data = await response.json();
  return snakeToCamel<DiscoveryStatus>(data);
}

/**
 * Get discovery status for a DID.
 *
 * Returns linked accounts and discoverability settings.
 *
 * @param did - The user's Umbra DID
 * @returns Discovery status
 */
export async function getStatus(did: string): Promise<DiscoveryStatus> {
  const response = await fetch(
    `${_relayUrl}/discovery/status?did=${encodeURIComponent(did)}`,
    {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get discovery status: ${error}`);
  }

  const data = await response.json();
  return snakeToCamel<DiscoveryStatus>(data);
}

/**
 * Update discoverability setting.
 *
 * @param did - The user's Umbra DID
 * @param discoverable - Whether the user should be discoverable
 * @returns Updated discovery status
 */
export async function updateSettings(
  did: string,
  discoverable: boolean
): Promise<DiscoveryStatus> {
  const response = await fetch(`${_relayUrl}/discovery/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ did, discoverable }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update settings: ${error}`);
  }

  const data = await response.json();
  return snakeToCamel<DiscoveryStatus>(data);
}

/**
 * Batch lookup hashed platform IDs.
 *
 * For privacy-preserving friend discovery. The caller is responsible
 * for hashing platform IDs before calling this.
 *
 * @param lookups - Array of hashed lookups
 * @returns Array of lookup results (in same order)
 */
export async function batchLookup(
  lookups: HashedLookup[]
): Promise<LookupResult[]> {
  const response = await fetch(`${_relayUrl}/discovery/lookup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(camelToSnake({ lookups })),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to batch lookup: ${error}`);
  }

  const data = await response.json();
  const result = snakeToCamel<{ results: LookupResult[] }>(data);
  return result.results;
}

/**
 * Unlink a platform account.
 *
 * @param did - The user's Umbra DID
 * @param platform - The platform to unlink
 * @returns Updated discovery status
 */
export async function unlinkAccount(
  did: string,
  platform: Platform
): Promise<DiscoveryStatus> {
  const response = await fetch(`${_relayUrl}/discovery/unlink`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ did, platform }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to unlink account: ${error}`);
  }

  const data = await response.json();
  return snakeToCamel<DiscoveryStatus>(data);
}

/**
 * Create a hash for a platform ID (using server's salt).
 *
 * This endpoint is useful when you have raw platform IDs (e.g., from
 * a GDPR export) and need to hash them for lookup.
 *
 * @param platform - The platform
 * @param platformId - The platform-specific user ID
 * @returns The hashed ID for lookup
 */
export async function createHash(
  platform: Platform,
  platformId: string
): Promise<string> {
  const response = await fetch(
    `${_relayUrl}/discovery/hash?platform=${platform}&platform_id=${encodeURIComponent(platformId)}`,
    {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create hash: ${error}`);
  }

  const data = await response.json();
  return data.id_hash;
}

/**
 * Search for discoverable users by platform username.
 *
 * Performs a case-insensitive substring match on platform usernames
 * for all users who have opted into discovery.
 *
 * @param platform - The platform to search on
 * @param username - The username query (minimum 2 characters)
 * @returns Array of matching users with their DIDs and platform usernames
 */
export async function searchByUsername(
  platform: Platform,
  username: string
): Promise<SearchResult[]> {
  const response = await fetch(
    `${_relayUrl}/discovery/search?platform=${platform}&username=${encodeURIComponent(username)}`,
    {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to search by username: ${error}`);
  }

  const data = await response.json();
  return (data.results ?? []) as SearchResult[];
}

/**
 * Batch create hashes for multiple platform IDs.
 *
 * Utility function that calls createHash for each ID.
 *
 * @param platform - The platform
 * @param platformIds - Array of platform-specific user IDs
 * @returns Array of HashedLookup objects for batch lookup
 */
export async function batchCreateHashes(
  platform: Platform,
  platformIds: string[]
): Promise<HashedLookup[]> {
  const hashes = await Promise.all(
    platformIds.map(async (id) => {
      const idHash = await createHash(platform, id);
      return { platform, idHash };
    })
  );
  return hashes;
}

// ── Username API ────────────────────────────────────────────────────────────

/**
 * Register a username for a DID.
 *
 * The relay auto-assigns a 5-digit numeric tag for uniqueness.
 * If the DID already has a username, the old one is released first.
 *
 * @param did - The user's Umbra DID
 * @param name - The desired name portion (1-32 chars, alphanumeric + _ + -)
 * @returns The registered username with assigned tag
 */
export async function registerUsername(
  did: string,
  name: string
): Promise<UsernameResponse> {
  const response = await fetch(`${_relayUrl}/discovery/username/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ did, name }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? `Failed to register username: ${response.statusText}`);
  }

  const data = await response.json();
  return snakeToCamel<UsernameResponse>(data);
}

/**
 * Get the username for a DID.
 *
 * @param did - The user's Umbra DID
 * @returns The username info (fields may be null if no username set)
 */
export async function getUsername(did: string): Promise<UsernameResponse> {
  const response = await fetch(
    `${_relayUrl}/discovery/username?did=${encodeURIComponent(did)}`,
    {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get username: ${error}`);
  }

  const data = await response.json();
  return snakeToCamel<UsernameResponse>(data);
}

/**
 * Look up a user by exact username (Name#Tag).
 *
 * Case-insensitive. Returns the DID if found.
 *
 * @param username - The full username (e.g., "Matt#01283")
 * @returns Lookup result with found status and DID
 */
export async function lookupUsername(
  username: string
): Promise<UsernameLookupResult> {
  const response = await fetch(
    `${_relayUrl}/discovery/username/lookup?username=${encodeURIComponent(username)}`,
    {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to lookup username: ${error}`);
  }

  const data = await response.json();
  return snakeToCamel<UsernameLookupResult>(data);
}

/**
 * Search for users by partial name.
 *
 * Case-insensitive substring match on the name portion.
 * Minimum 2 characters, max 50 results.
 *
 * @param name - The search query (minimum 2 characters)
 * @param limit - Maximum results to return (default 20, max 50)
 * @returns Array of matching users with DIDs and usernames
 */
export async function searchUsernames(
  name: string,
  limit?: number
): Promise<UsernameSearchResult[]> {
  let url = `${_relayUrl}/discovery/username/search?name=${encodeURIComponent(name)}`;
  if (limit !== undefined) {
    url += `&limit=${limit}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? `Failed to search usernames: ${response.statusText}`);
  }

  const data = await response.json();
  return (data.results ?? []) as UsernameSearchResult[];
}

/**
 * Change username (releases old, registers new with fresh tag).
 *
 * @param did - The user's Umbra DID
 * @param name - The new name portion
 * @returns The new username with assigned tag
 */
export async function changeUsername(
  did: string,
  name: string
): Promise<UsernameResponse> {
  const response = await fetch(`${_relayUrl}/discovery/username/change`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ did, name }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? `Failed to change username: ${response.statusText}`);
  }

  const data = await response.json();
  return snakeToCamel<UsernameResponse>(data);
}

/**
 * Release (delete) a username.
 *
 * @param did - The user's Umbra DID
 * @returns Whether the release was successful
 */
export async function releaseUsername(did: string): Promise<boolean> {
  const response = await fetch(`${_relayUrl}/discovery/username/release`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ did }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to release username: ${error}`);
  }

  const data = await response.json();
  return data.success === true;
}
