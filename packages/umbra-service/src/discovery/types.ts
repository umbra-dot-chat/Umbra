/**
 * Discovery service types
 *
 * TypeScript types matching the Rust types in umbra-relay.
 *
 * @packageDocumentation
 */

/**
 * Supported platforms for account linking.
 */
export type Platform = 'discord' | 'github' | 'steam' | 'bluesky' | 'xbox';

/**
 * Information about a linked platform account.
 */
export interface LinkedAccountInfo {
  /** The platform. */
  platform: Platform;
  /** The username on that platform. */
  username: string;
  /** When the account was linked (ISO 8601 date string from server). */
  linkedAt: string;
}

/**
 * Discovery status response from the server.
 */
export interface DiscoveryStatus {
  /** The user's DID. */
  did: string;
  /** Whether the user is discoverable by others. */
  discoverable: boolean;
  /** All linked accounts. */
  accounts: LinkedAccountInfo[];
}

/**
 * A hashed lookup request for privacy-preserving discovery.
 */
export interface HashedLookup {
  /** The platform to search. */
  platform: Platform;
  /** SHA-256 hash of (platform_id + salt). */
  idHash: string;
}

/**
 * Result of a discovery lookup.
 */
export interface LookupResult {
  /** The matched Umbra DID (if found and discoverable). */
  did: string | null;
  /** The platform that was matched. */
  platform: Platform;
  /** The hashed ID that was queried. */
  idHash: string;
}

/**
 * Response from the OAuth start endpoint.
 */
export interface StartAuthResponse {
  /** The URL to redirect the user to. */
  redirectUrl: string;
  /** The state parameter to verify on callback. */
  state: string;
}

/**
 * Result from a username-based search on the relay.
 */
export interface SearchResult {
  /** The matched Umbra DID. */
  did: string;
  /** The platform that was searched. */
  platform: Platform;
  /** The platform username of the matched user. */
  username: string;
}

// ── Username Types ────────────────────────────────────────────────────────

/**
 * Response from username registration, lookup, or get.
 */
export interface UsernameResponse {
  /** The user's DID. */
  did: string;
  /** The full username (Name#Tag), or null if no username set. */
  username: string | null;
  /** The name portion only. */
  name: string | null;
  /** The 5-digit tag portion only (e.g., "01283"). */
  tag: string | null;
  /** When the username was registered (ISO 8601 date string). */
  registeredAt: string | null;
}

/**
 * Result from an exact username lookup (Name#Tag → DID).
 */
export interface UsernameLookupResult {
  /** Whether a user was found. */
  found: boolean;
  /** The matched DID (if found). */
  did: string | null;
  /** The full username (if found). */
  username: string | null;
}

/**
 * A single result from a username search.
 */
export interface UsernameSearchResult {
  /** The user's DID. */
  did: string;
  /** The full username (Name#Tag). */
  username: string;
}

/**
 * Friend suggestion from discovered accounts.
 */
export interface FriendSuggestion {
  /** The matched Umbra DID. */
  umbraDid: string;
  /** The platform where they were found. */
  platform: Platform;
  /** Their username on that platform. */
  platformUsername: string;
  /** Optional: mutual servers/groups (for Discord). */
  mutualServers?: string[];
}

/**
 * Discovery event types.
 */
export type DiscoveryServiceEvent =
  | { type: 'accountLinked'; platform: Platform; username: string }
  | { type: 'accountUnlinked'; platform: Platform }
  | { type: 'discoverabilityChanged'; discoverable: boolean }
  | { type: 'suggestionsUpdated'; suggestions: FriendSuggestion[] }
  | { type: 'usernameRegistered'; username: string }
  | { type: 'usernameChanged'; username: string }
  | { type: 'usernameReleased' };
