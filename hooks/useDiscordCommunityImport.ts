/**
 * Discord Community Import Hook
 *
 * React hook for managing the Discord server import flow.
 * Includes self-serve bot invite flow for reading server structure.
 *
 * @packageDocumentation
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { isTauri } from '@umbra/wasm';
import type {
  DiscordGuildInfo,
  DiscordImportedStructure,
  MappedCommunityStructure,
  MappedSeat,
  MappedPinnedMessage,
  MappedAuditLogEntry,
  CommunityImportProgress,
  CommunityImportResult,
  DiscordImportedMember,
  DiscordGuildMembersResponse,
  DiscordChannelPinsResponse,
  DiscordAuditLogResponse,
} from '@umbra/service';
import { mapDiscordToUmbra, validateImportStructure, getAvatarUrl, snowflakeToTimestamp } from '@umbra/service';

/**
 * Configuration for the relay endpoint.
 */
const RELAY_BASE_URL = process.env.EXPO_PUBLIC_RELAY_URL || 'https://relay.umbra.chat';

/**
 * Open a URL in the system browser via Tauri shell plugin.
 */
async function tauriShellOpen(url: string): Promise<void> {
  const { open } = await import('@tauri-apps/plugin-shell');
  await open(url);
}

/**
 * Poll the relay for a community import result (for Tauri/mobile where postMessage isn't available).
 */
async function pollCommunityImportResult(
  state: string,
  maxAttempts = 60,
  intervalMs = 2000,
): Promise<string | null> {
  const pollUrl = `${RELAY_BASE_URL}/community/import/discord/result/${encodeURIComponent(state)}`;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(pollUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token) return data.token;
      }
    } catch {
      // Network error, keep polling
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return null;
}

/**
 * State phases for the import flow.
 */
export type ImportPhase =
  | 'idle'
  | 'authenticating'
  | 'selecting_server'
  | 'loading_structure'
  | 'needs_bot'
  | 'previewing'
  | 'importing'
  | 'complete'
  | 'error';

/**
 * Bot status for the current guild.
 */
export type BotStatus = 'unknown' | 'checking' | 'not_in_guild' | 'in_guild' | 'disabled' | 'inviting';

/**
 * State for the Discord community import hook.
 */
export interface UseDiscordCommunityImportState {
  /** Current phase of the import flow. */
  phase: ImportPhase;
  /** Access token from Discord OAuth. */
  accessToken: string | null;
  /** List of manageable guilds. */
  guilds: DiscordGuildInfo[];
  /** Selected guild for import. */
  selectedGuild: DiscordGuildInfo | null;
  /** Imported structure from Discord. */
  importedStructure: DiscordImportedStructure | null;
  /** Mapped structure ready for Umbra. */
  mappedStructure: MappedCommunityStructure | null;
  /** Validation issues (if any). */
  validationIssues: string[];
  /** Import progress. */
  progress: CommunityImportProgress | null;
  /** Import result. */
  result: CommunityImportResult | null;
  /** Error message. */
  error: string | null;
  /** Whether an operation is in progress. */
  isLoading: boolean;
  /** Bot membership status for the selected guild. */
  botStatus: BotStatus;
  /** Imported guild members (for seat creation). */
  importedMembers: DiscordImportedMember[] | null;
  /** Whether the bot has GUILD_MEMBERS intent (can fetch members). */
  membersAvailable: boolean;
  /** Whether to import members as seats. */
  importMembers: boolean;
  /** Whether to import pinned messages. */
  importPins: boolean;
  /** Whether to enable the Discord bridge (bidirectional message sync). */
  enableBridge: boolean;
  /** Fetched pinned messages keyed by source (Discord) channel ID. */
  pinnedMessages: Record<string, MappedPinnedMessage[]> | null;
  /** Whether pinned messages are available (bot is in guild). */
  pinsAvailable: boolean;
  /** Total count of fetched pinned messages across all channels. */
  pinCount: number;
  /** Whether members are currently being fetched. */
  membersLoading: boolean;
  /** Whether pinned messages are currently being fetched. */
  pinsLoading: boolean;
  /** Fetched audit log entries. */
  auditLogEntries: MappedAuditLogEntry[] | null;
  /** Whether audit log is available (bot is in guild with required permissions). */
  auditLogAvailable: boolean;
  /** Whether audit log is currently being fetched. */
  auditLogLoading: boolean;
  /** Whether to import audit log. */
  importAuditLog: boolean;
  /** Total count of fetched audit log entries. */
  auditLogCount: number;
}

/**
 * Actions for the Discord community import hook.
 */
export interface UseDiscordCommunityImportActions {
  /** Start the OAuth flow to authenticate with Discord. */
  startAuth: () => Promise<void>;
  /** Refresh the list of guilds. */
  refreshGuilds: () => Promise<void>;
  /** Select a guild for import. */
  selectGuild: (guild: DiscordGuildInfo) => Promise<void>;
  /** Go back to guild selection. */
  backToSelection: () => void;
  /** Start the import process. */
  startImport: (onCreateCommunity: (structure: MappedCommunityStructure) => Promise<CommunityImportResult>) => Promise<void>;
  /** Open a popup to invite the bot to the selected guild, then poll for membership and re-fetch structure. */
  inviteBot: () => Promise<void>;
  /** Re-fetch the guild structure for the currently selected guild. */
  refetchStructure: () => Promise<void>;
  /** Toggle whether to import members as seats. */
  toggleMemberImport: () => void;
  /** Toggle whether to import pinned messages. */
  togglePinImport: () => void;
  /** Toggle whether to enable the Discord bridge. */
  toggleBridge: () => void;
  /** Toggle whether to import audit log. */
  toggleAuditLogImport: () => void;
  /** Reset to initial state. */
  reset: () => void;
}

/**
 * Hook for managing Discord community import.
 */
export function useDiscordCommunityImport(): UseDiscordCommunityImportState & UseDiscordCommunityImportActions {
  // State
  const [phase, setPhase] = useState<ImportPhase>('idle');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [guilds, setGuilds] = useState<DiscordGuildInfo[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<DiscordGuildInfo | null>(null);
  const [importedStructure, setImportedStructure] = useState<DiscordImportedStructure | null>(null);
  const [mappedStructure, setMappedStructure] = useState<MappedCommunityStructure | null>(null);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [progress, setProgress] = useState<CommunityImportProgress | null>(null);
  const [result, setResult] = useState<CommunityImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [botStatus, setBotStatus] = useState<BotStatus>('unknown');
  const [importedMembers, setImportedMembers] = useState<DiscordImportedMember[] | null>(null);
  const [membersAvailable, setMembersAvailable] = useState(false);
  const [importMembers, setImportMembers] = useState(true);
  const [importPins, setImportPins] = useState(true);
  const [pinnedMessages, setPinnedMessages] = useState<Record<string, MappedPinnedMessage[]> | null>(null);
  const [pinsAvailable, setPinsAvailable] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [pinsLoading, setPinsLoading] = useState(false);
  const [enableBridge, setEnableBridge] = useState(false);
  const [auditLogEntries, setAuditLogEntries] = useState<MappedAuditLogEntry[] | null>(null);
  const [auditLogAvailable, setAuditLogAvailable] = useState(false);
  const [auditLogLoading, setAuditLogLoading] = useState(false);
  const [importAuditLog, setImportAuditLog] = useState(true);

  // Refs
  const popupRef = useRef<Window | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const authSucceededRef = useRef(false);
  const accessTokenRef = useRef<string | null>(null);

  // Keep accessTokenRef in sync with state (avoids stale closures in setInterval callbacks)
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  // Listen for OAuth callback message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify the message is from our popup
      if (event.data?.type === 'UMBRA_COMMUNITY_IMPORT') {
        if (event.data.success && event.data.token) {
          authSucceededRef.current = true;
          setAccessToken(event.data.token);
          setPhase('selecting_server');
          setError(null);
          // Close popup if still open
          if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.close();
          }
        } else if (event.data.error) {
          setError(event.data.error);
          setPhase('error');
        }
      }
    };

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  // Mobile fallback: Check URL hash for Discord import token on mount
  // When popups aren't available, the relay redirects back with #discord_import_token=TOKEN
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash.startsWith('#discord_import_token=')) {
      const token = decodeURIComponent(hash.replace('#discord_import_token=', ''));
      if (token) {
        // Clean up the hash from the URL
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        authSucceededRef.current = true;
        setAccessToken(token);
        setPhase('selecting_server');
        setError(null);
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch guilds when we have an access token
  useEffect(() => {
    if (accessToken && phase === 'selecting_server' && guilds.length === 0) {
      fetchGuilds();
    }
  }, [accessToken, phase]);

  /**
   * Fetch the list of guilds the user can manage.
   */
  const fetchGuilds = useCallback(async () => {
    const token = accessTokenRef.current;
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${RELAY_BASE_URL}/community/import/discord/guilds?token=${encodeURIComponent(token)}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch guilds');
      }

      const data = await response.json();
      setGuilds(data.guilds || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch guilds');
      setPhase('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch guild structure from the relay.
   * Returns the mapped structure, or null on failure.
   * Uses `accessTokenRef` to avoid stale closures in setInterval callbacks.
   */
  const fetchStructure = useCallback(
    async (guildId: string): Promise<MappedCommunityStructure | null> => {
      const token = accessTokenRef.current;
      if (!token) return null;

      const response = await fetch(
        `${RELAY_BASE_URL}/community/import/discord/guild/${guildId}/structure?token=${encodeURIComponent(token)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch server structure');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch server structure');
      }

      setImportedStructure(data.structure);

      // Map to Umbra structure
      const mapped = mapDiscordToUmbra(data.structure);
      setMappedStructure(mapped);

      // Validate
      const validation = validateImportStructure(mapped);
      setValidationIssues(validation.issues);

      return mapped;
    },
    []
  );

  /**
   * Check if the structure is empty (no channels/categories/roles).
   */
  const isStructureEmpty = (structure: MappedCommunityStructure): boolean => {
    return (
      structure.categories.length === 0 &&
      structure.channels.length === 0 &&
      structure.roles.length === 0
    );
  };

  /**
   * Check bot status for a guild.
   */
  const checkBotStatusForGuild = useCallback(async (guildId: string): Promise<{ botEnabled: boolean; inGuild: boolean }> => {
    try {
      const response = await fetch(
        `${RELAY_BASE_URL}/community/import/discord/bot-status?guild_id=${encodeURIComponent(guildId)}`
      );
      if (!response.ok) {
        return { botEnabled: false, inGuild: false };
      }
      const data = await response.json();
      return {
        botEnabled: data.bot_enabled ?? false,
        inGuild: data.in_guild ?? false,
      };
    } catch {
      return { botEnabled: false, inGuild: false };
    }
  }, []);

  /**
   * Fetch guild members from the relay (requires bot with GUILD_MEMBERS intent).
   *
   * Uses `accessTokenRef` instead of the `accessToken` closure to avoid stale
   * values when called from inside `inviteBot`'s setInterval callback.
   */
  const fetchMembers = useCallback(
    async (guildId: string) => {
      const token = accessTokenRef.current;
      console.log('[fetchMembers] called for guild', guildId, 'accessToken?', !!token);
      if (!token) {
        console.warn('[fetchMembers] No accessToken — skipping');
        return;
      }

      setMembersLoading(true);
      try {
        const url = `${RELAY_BASE_URL}/community/import/discord/guild/${guildId}/members?token=${encodeURIComponent(token)}`;
        console.log('[fetchMembers] Fetching:', url.replace(/token=[^&]+/, 'token=***'));
        const response = await fetch(url);
        console.log('[fetchMembers] Response status:', response.status);

        if (!response.ok) {
          // 403 likely means the bot doesn't have GUILD_MEMBERS intent
          if (response.status === 403) {
            console.warn('[fetchMembers] 403 — bot likely lacks GUILD_MEMBERS intent');
            setMembersAvailable(false);
            setImportedMembers(null);
            return;
          }
          // Other errors — silently fail (members are optional)
          console.warn('[fetchMembers] Non-OK response:', response.status);
          setMembersAvailable(false);
          setImportedMembers(null);
          return;
        }

        const data: DiscordGuildMembersResponse = await response.json();
        console.log('[fetchMembers] Response data:', {
          hasMembersIntent: data.hasMembersIntent,
          memberCount: data.members?.length ?? 0,
          error: (data as any).error,
        });
        setMembersAvailable(data.hasMembersIntent);

        if (data.hasMembersIntent && data.members.length > 0) {
          // Filter out bots
          const humanMembers = data.members.filter((m) => !m.bot);
          console.log('[fetchMembers] Human members:', humanMembers.length);
          setImportedMembers(humanMembers);
        } else {
          setImportedMembers(null);
        }
      } catch (err) {
        // Network error — members are optional, don't fail the flow
        console.error('[fetchMembers] Error:', err);
        setMembersAvailable(false);
        setImportedMembers(null);
      } finally {
        setMembersLoading(false);
      }
    },
    [] // No dependency on accessToken — uses ref instead
  );

  /**
   * Map imported Discord members to platform-agnostic MappedSeat objects.
   */
  const mapMembersToSeats = useCallback(
    (members: DiscordImportedMember[]): MappedSeat[] => {
      return members.map((m) => ({
        platform: 'discord',
        platformUserId: m.userId,
        platformUsername: m.username,
        nickname: m.nickname ?? undefined,
        avatarUrl: m.avatar
          ? `https://cdn.discordapp.com/avatars/${m.userId}/${m.avatar}.png`
          : undefined,
        sourceRoleIds: m.roleIds,
      }));
    },
    []
  );

  /**
   * Fetch pinned messages for all text/announcement channels in the mapped structure.
   * Requires the bot to be in the guild (uses bot token via relay).
   */
  const fetchPins = useCallback(
    async (channels: MappedCommunityStructure['channels']) => {
      const token = accessTokenRef.current;
      if (!token) return;

      // Only fetch pins for text and announcement channels
      const textChannels = channels.filter((c) => c.type === 'text' || c.type === 'announcement');
      if (textChannels.length === 0) {
        setPinnedMessages(null);
        setPinsAvailable(false);
        return;
      }

      setPinsLoading(true);
      console.log('[fetchPins] Fetching pins for', textChannels.length, 'channels');
      const allPins: Record<string, MappedPinnedMessage[]> = {};
      let totalPins = 0;

      for (const ch of textChannels) {
        try {
          const response = await fetch(
            `${RELAY_BASE_URL}/community/import/discord/channel/${ch.discordId}/pins?token=${encodeURIComponent(token)}`
          );

          if (!response.ok) {
            console.warn(`[fetchPins] Failed to fetch pins for channel ${ch.name}:`, response.status);
            continue;
          }

          const data: DiscordChannelPinsResponse = await response.json();

          if (data.pins && data.pins.length > 0) {
            allPins[ch.discordId] = data.pins.map((pin) => ({
              authorPlatformUserId: pin.authorId,
              authorUsername: pin.authorUsername,
              content: pin.content,
              originalTimestamp: new Date(pin.timestamp).getTime(),
              sourceChannelId: ch.discordId,
            }));
            totalPins += data.pins.length;
          }
        } catch (err) {
          console.warn(`[fetchPins] Error fetching pins for channel ${ch.name}:`, err);
        }
      }

      console.log('[fetchPins] Total pins fetched:', totalPins, 'across', Object.keys(allPins).length, 'channels');

      if (totalPins > 0) {
        setPinnedMessages(allPins);
        setPinsAvailable(true);
      } else {
        setPinnedMessages(null);
        setPinsAvailable(false);
      }
      setPinsLoading(false);
    },
    []
  );

  /**
   * Fetch audit log for a guild.
   * Requires the bot to be in the guild with VIEW_AUDIT_LOG permission.
   */
  const fetchAuditLog = useCallback(
    async (guildId: string) => {
      const token = accessTokenRef.current;
      console.log('[fetchAuditLog] ===== CALLED =====');
      console.log('[fetchAuditLog] guildId:', guildId);
      console.log('[fetchAuditLog] accessToken present?', !!token);
      if (!token) {
        console.warn('[fetchAuditLog] No accessToken — skipping');
        return;
      }

      setAuditLogLoading(true);
      try {
        const url = `${RELAY_BASE_URL}/community/import/discord/guild/${guildId}/audit-log?token=${encodeURIComponent(token)}`;
        console.log('[fetchAuditLog] Fetching:', url.replace(/token=[^&]+/, 'token=***'));
        const response = await fetch(url);
        console.log('[fetchAuditLog] Response status:', response.status);

        if (!response.ok) {
          // 403 likely means the bot doesn't have VIEW_AUDIT_LOG permission
          if (response.status === 403) {
            console.warn('[fetchAuditLog] 403 — bot likely lacks VIEW_AUDIT_LOG permission');
            setAuditLogAvailable(false);
            setAuditLogEntries(null);
            return;
          }
          // Other errors — silently fail (audit log is optional)
          console.warn('[fetchAuditLog] Non-OK response:', response.status);
          setAuditLogAvailable(false);
          setAuditLogEntries(null);
          return;
        }

        const data: DiscordAuditLogResponse = await response.json();
        console.log('[fetchAuditLog] Response data:', {
          entryCount: data.entries?.length ?? 0,
          error: data.error,
        });

        // Check for error in response
        if (data.error) {
          console.warn('[fetchAuditLog] Error in response:', data.error);
          setAuditLogAvailable(false);
          setAuditLogEntries(null);
          return;
        }

        if (data.entries && data.entries.length > 0) {
          // Map audit log entries to MappedAuditLogEntry format
          const mappedEntries: MappedAuditLogEntry[] = data.entries.map((entry) => ({
            actionType: entry.actionType,
            actorPlatformUserId: entry.actorUserId,
            actorUsername: entry.actorUsername,
            actorAvatarUrl: entry.actorAvatar ? getAvatarUrl(entry.actorUserId, entry.actorAvatar) ?? undefined : undefined,
            targetType: entry.targetType,
            targetId: entry.targetId ?? undefined,
            reason: entry.reason ?? undefined,
            metadata: entry.changes ? { changes: entry.changes, options: entry.options } : entry.options,
            timestamp: snowflakeToTimestamp(entry.id),
          }));
          console.log('[fetchAuditLog] Mapped entries:', mappedEntries.length);
          setAuditLogEntries(mappedEntries);
          setAuditLogAvailable(true);
        } else {
          setAuditLogEntries(null);
          setAuditLogAvailable(false);
        }
      } catch (err) {
        // Network error — audit log is optional, don't fail the flow
        console.error('[fetchAuditLog] Error:', err);
        setAuditLogAvailable(false);
        setAuditLogEntries(null);
      } finally {
        setAuditLogLoading(false);
      }
    },
    []
  );

  /**
   * Start the OAuth authentication flow.
   *
   * On desktop: Opens a popup window for Discord OAuth.
   * On mobile: Falls back to same-window redirect if window.open is unavailable.
   */
  const startAuth = useCallback(async () => {
    setPhase('authenticating');
    setError(null);
    setIsLoading(true);

    const runningInTauri = isTauri();

    // Check if window.open is available (may be undefined on mobile web views)
    const canOpenPopup = !runningInTauri && typeof window !== 'undefined' && typeof window.open === 'function';

    let popup: Window | null = null;

    if (canOpenPopup) {
      // Open popup IMMEDIATELY in the click handler (before any async work)
      // to avoid browser popup blockers that require a direct user gesture.
      const width = 500;
      const height = 700;
      const left = (window.screenX ?? 0) + ((window.innerWidth ?? 500) - width) / 2;
      const top = (window.screenY ?? 0) + ((window.innerHeight ?? 700) - height) / 2;

      popup = window.open(
        'about:blank',
        'discord_community_import',
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,status=no`
      );
    }

    popupRef.current = popup;

    try {
      // Request the OAuth URL from the relay
      const response = await fetch(`${RELAY_BASE_URL}/community/import/discord/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        if (popup && !popup.closed) popup.close();
        throw new Error('Failed to start Discord authentication');
      }

      const data = await response.json();

      if (runningInTauri) {
        // Tauri: open in system browser, poll relay for result
        await tauriShellOpen(data.redirect_url);
        const token = await pollCommunityImportResult(data.state);
        if (token) {
          authSucceededRef.current = true;
          setAccessToken(token);
          setPhase('selecting_server');
          setError(null);
        } else {
          setPhase('idle');
        }
        setIsLoading(false);
      } else if (popup && !popup.closed) {
        // Desktop web: Navigate the already-open popup to the Discord OAuth URL
        popup.location.href = data.redirect_url;

        // Poll for popup close (in case user closes without completing)
        authSucceededRef.current = false;
        const pollTimer = setInterval(() => {
          if (popupRef.current?.closed) {
            clearInterval(pollTimer);
            setIsLoading(false);
            if (!authSucceededRef.current) {
              setPhase('idle');
            }
          }
        }, 500);
      } else {
        // Mobile fallback: redirect in the same window
        // The OAuth callback will redirect back with the token
        if (typeof window !== 'undefined' && data.redirect_url) {
          window.location.href = data.redirect_url;
        } else {
          throw new Error('Cannot open Discord authentication. Please try on a desktop browser.');
        }
      }
    } catch (err: any) {
      if (popup && !popup.closed) {
        popup.close();
      }
      setError(err.message || 'Failed to start authentication');
      setPhase('error');
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh the list of guilds.
   */
  const refreshGuilds = useCallback(async () => {
    if (!accessTokenRef.current) {
      setError('Not authenticated');
      return;
    }
    await fetchGuilds();
  }, [fetchGuilds]);

  /**
   * Select a guild and load its structure.
   * If structure is empty, checks bot status and transitions to 'needs_bot' if appropriate.
   */
  const selectGuild = useCallback(
    async (guild: DiscordGuildInfo) => {
      if (!accessTokenRef.current) {
        setError('Not authenticated');
        return;
      }

      setSelectedGuild(guild);
      setPhase('loading_structure');
      setIsLoading(true);
      setError(null);
      setBotStatus('unknown');
      setImportedMembers(null);
      setMembersAvailable(false);
      setImportMembers(true);

      try {
        const mapped = await fetchStructure(guild.id);

        if (!mapped) {
          throw new Error('Failed to load server structure');
        }

        // If structure is empty, check if the bot needs to be invited
        if (isStructureEmpty(mapped)) {
          setBotStatus('checking');
          const { botEnabled, inGuild } = await checkBotStatusForGuild(guild.id);

          if (!botEnabled) {
            setBotStatus('disabled');
            // Bot not configured on this relay — show preview anyway (with 0s)
            setPhase('previewing');
          } else if (inGuild) {
            setBotStatus('in_guild');
            // Bot is in guild but structure is still empty — unusual, show preview
            // Try to fetch members anyway (they may be available even with empty structure)
            fetchMembers(guild.id);
            if (mapped) fetchPins(mapped.channels);
            fetchAuditLog(guild.id);
            setPhase('previewing');
          } else {
            setBotStatus('not_in_guild');
            // Bot needs to be invited — show the bot invite screen
            setPhase('needs_bot');
          }
        } else {
          // Structure loaded via OAuth — check if bot is also in guild for enhanced features
          const { botEnabled, inGuild } = await checkBotStatusForGuild(guild.id);
          console.log('[selectGuild] Bot status:', { botEnabled, inGuild, guildId: guild.id });
          if (botEnabled && inGuild) {
            setBotStatus('in_guild');
            // Bot is in guild — fetch members, pins, and audit log in background
            console.log('[selectGuild] Calling fetchMembers + fetchPins + fetchAuditLog for guild', guild.id);
            fetchMembers(guild.id);
            if (mapped) fetchPins(mapped.channels);
            fetchAuditLog(guild.id);
          } else if (botEnabled) {
            setBotStatus('not_in_guild');
            console.log('[selectGuild] Bot enabled but NOT in guild — skipping fetchMembers');
            // Bot exists but not in this guild — preview will show "Connect Bot" banner
          } else {
            setBotStatus('disabled');
            console.log('[selectGuild] Bot disabled on relay');
            // Bot not configured on relay
          }
          setPhase('previewing');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load server structure');
        setPhase('selecting_server');
      } finally {
        setIsLoading(false);
      }
    },
    [fetchStructure, checkBotStatusForGuild, fetchMembers, fetchPins, fetchAuditLog]
  );

  /**
   * Go back to guild selection.
   */
  const backToSelection = useCallback(() => {
    // Stop any ongoing polling
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setSelectedGuild(null);
    setImportedStructure(null);
    setMappedStructure(null);
    setValidationIssues([]);
    setBotStatus('unknown');
    setImportedMembers(null);
    setMembersAvailable(false);
    setImportMembers(true);
    setMembersLoading(false);
    setPinnedMessages(null);
    setPinsAvailable(false);
    setImportPins(true);
    setPinsLoading(false);
    setEnableBridge(false);
    setAuditLogEntries(null);
    setAuditLogAvailable(false);
    setAuditLogLoading(false);
    setImportAuditLog(true);
    setPhase('selecting_server');
  }, []);

  /**
   * Open a popup to invite the bot to the selected guild.
   * Polls bot-status until the bot joins, then re-fetches structure.
   */
  const inviteBot = useCallback(async () => {
    if (!selectedGuild) {
      setError('No guild selected');
      return;
    }

    setError(null);
    setBotStatus('inviting');

    const runningInTauri = isTauri();

    // Check if window.open is available
    const canOpenPopup = !runningInTauri && typeof window !== 'undefined' && typeof window.open === 'function';

    let popup: Window | null = null;

    if (canOpenPopup) {
      // Open popup IMMEDIATELY (same pattern as startAuth to avoid blockers)
      const width = 500;
      const height = 750;
      const left = (window.screenX ?? 0) + ((window.innerWidth ?? 500) - width) / 2;
      const top = (window.screenY ?? 0) + ((window.innerHeight ?? 750) - height) / 2;

      popup = window.open(
        'about:blank',
        'discord_bot_invite',
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,status=no`
      );
    }

    popupRef.current = popup;

    try {
      // Fetch bot invite URL from relay
      const response = await fetch(
        `${RELAY_BASE_URL}/community/import/discord/bot-invite?guild_id=${encodeURIComponent(selectedGuild.id)}`
      );

      if (!response.ok) {
        if (popup && !popup.closed) popup.close();
        throw new Error('Failed to get bot invite URL');
      }

      const data = await response.json();

      if (!data.bot_enabled || !data.invite_url) {
        if (popup && !popup.closed) popup.close();
        setBotStatus('disabled');
        setError(data.message || 'Bot is not configured on this relay.');
        return;
      }

      if (runningInTauri) {
        // Tauri: open in system browser
        await tauriShellOpen(data.invite_url);
      } else if (popup && !popup.closed) {
        // Desktop web: Navigate popup to Discord bot authorization page
        popup.location.href = data.invite_url;
      } else {
        // Mobile fallback: redirect in the same window
        if (typeof window !== 'undefined' && data.invite_url) {
          window.location.href = data.invite_url;
          return; // Don't set up polling — user will return to app manually
        } else {
          throw new Error('Cannot open bot invite. Please try on a desktop browser.');
        }
      }

      // Poll bot-status every 2 seconds until the bot joins
      pollTimerRef.current = setInterval(async () => {
        // If popup was closed by user, stop polling but keep the status as inviting
        // in case the bot was actually added
        const popupClosed = !popupRef.current || popupRef.current.closed;

        try {
          const { inGuild } = await checkBotStatusForGuild(selectedGuild.id);

          if (inGuild) {
            // Bot has joined! Stop polling.
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }

            // Close popup if still open
            if (popupRef.current && !popupRef.current.closed) {
              popupRef.current.close();
            }

            setBotStatus('in_guild');

            // Re-fetch structure now that the bot can read it
            setIsLoading(true);
            try {
              const mapped = await fetchStructure(selectedGuild.id);
              // Also fetch members, pins, and audit log now that bot is in guild
              fetchMembers(selectedGuild.id);
              if (mapped) fetchPins(mapped.channels);
              fetchAuditLog(selectedGuild.id);
              if (mapped && !isStructureEmpty(mapped)) {
                setPhase('previewing');
              } else {
                // Bot is in guild but structure still empty — show preview anyway
                setPhase('previewing');
              }
            } catch {
              setPhase('previewing');
            } finally {
              setIsLoading(false);
            }
            return;
          }
        } catch {
          // Network error during poll — continue trying
        }

        // If popup closed and bot still not detected after 3 more checks, stop
        if (popupClosed) {
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          // Do one final check
          const { inGuild } = await checkBotStatusForGuild(selectedGuild.id);
          if (inGuild) {
            setBotStatus('in_guild');
            setIsLoading(true);
            try {
              const mapped = await fetchStructure(selectedGuild.id);
              // Also fetch members, pins, and audit log now that bot is in guild
              fetchMembers(selectedGuild.id);
              if (mapped) fetchPins(mapped.channels);
              fetchAuditLog(selectedGuild.id);
            } catch {
              // ignore
            } finally {
              setIsLoading(false);
            }
            setPhase('previewing');
          } else {
            setBotStatus('not_in_guild');
          }
        }
      }, 2000);
    } catch (err: any) {
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      setError(err.message || 'Failed to invite bot');
      setBotStatus('not_in_guild');
    }
  }, [selectedGuild, fetchStructure, fetchMembers, fetchPins, fetchAuditLog, checkBotStatusForGuild]);

  /**
   * Re-fetch the guild structure for the currently selected guild.
   * Always transitions to 'previewing' — used both after bot joins and for skip.
   */
  const refetchStructure = useCallback(async () => {
    if (!selectedGuild || !accessTokenRef.current) {
      // If called as a skip (no structure change expected), just go to preview
      setPhase('previewing');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const mapped = await fetchStructure(selectedGuild.id);
      // Also re-fetch members, pins, and audit log in background
      fetchMembers(selectedGuild.id);
      if (mapped) fetchPins(mapped.channels);
      fetchAuditLog(selectedGuild.id);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh structure');
    } finally {
      setIsLoading(false);
      setPhase('previewing');
    }
  }, [selectedGuild, fetchStructure, fetchMembers, fetchPins, fetchAuditLog]);

  /**
   * Start the import process.
   */
  const startImport = useCallback(
    async (onCreateCommunity: (structure: MappedCommunityStructure) => Promise<CommunityImportResult>) => {
      if (!mappedStructure) {
        setError('No structure to import');
        return;
      }

      setPhase('importing');
      setIsLoading(true);
      setError(null);
      setProgress({
        phase: 'creating_community',
        percent: 0,
      });

      try {
        // Build the final structure with optional seats
        const finalStructure: MappedCommunityStructure = {
          ...mappedStructure,
        };

        // Inject seats if member import is enabled and we have members
        if (importMembers && importedMembers && importedMembers.length > 0) {
          finalStructure.seats = mapMembersToSeats(importedMembers);
        }

        // Inject pinned messages if pin import is enabled
        if (importPins && pinnedMessages) {
          finalStructure.pinnedMessages = pinnedMessages;
        }

        // Inject audit log if audit log import is enabled
        if (importAuditLog && auditLogEntries) {
          finalStructure.auditLog = auditLogEntries;
        }

        const importResult = await onCreateCommunity(finalStructure);
        setResult(importResult);

        if (importResult.success) {
          // Register bridge config with relay if bridge is enabled
          if (enableBridge && selectedGuild && importResult.communityId) {
            try {
              // Build channel mapping using Discord IDs from mappedStructure
              // and Umbra IDs from the import result
              const channelMapping = (mappedStructure.channels || [])
                .filter((ch) => ch.discordId)
                .map((ch) => ({
                  discordChannelId: ch.discordId,
                  umbraChannelId: importResult.channelIdMap?.[ch.discordId] ?? ch.discordId,
                  name: ch.name,
                }));

              // Build seat list from imported members
              const seatList = (importedMembers || []).map((m) => ({
                discordUserId: m.userId,
                discordUsername: m.username,
                avatarUrl: m.avatar
                  ? `https://cdn.discordapp.com/avatars/${m.userId}/${m.avatar}.png`
                  : null,
                seatDid: null,
              }));

              // Build member DID list (community members)
              const memberDids = importResult.memberDids ?? [];

              await fetch(`${RELAY_BASE_URL}/api/bridge/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  communityId: importResult.communityId,
                  guildId: selectedGuild.id,
                  channels: channelMapping,
                  seats: seatList,
                  memberDids,
                }),
              });

              console.log('[Import] Bridge config registered with relay');
            } catch (bridgeErr) {
              // Bridge registration failure is non-fatal — community was still created
              console.warn('[Import] Failed to register bridge config:', bridgeErr);
            }
          }

          setPhase('complete');
        } else {
          setError(importResult.errors.join('. '));
          setPhase('error');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to create community');
        setPhase('error');
      } finally {
        setIsLoading(false);
        setProgress(null);
      }
    },
    [mappedStructure, importMembers, importedMembers, mapMembersToSeats, importPins, pinnedMessages, importAuditLog, auditLogEntries, enableBridge, selectedGuild]
  );

  /**
   * Reset to initial state.
   */
  /**
   * Toggle member import on/off.
   */
  const toggleMemberImport = useCallback(() => {
    setImportMembers((prev) => !prev);
  }, []);

  /**
   * Toggle pin import on/off.
   */
  const togglePinImport = useCallback(() => {
    setImportPins((prev) => !prev);
  }, []);

  /**
   * Toggle bridge on/off.
   */
  const toggleBridge = useCallback(() => {
    setEnableBridge((prev) => !prev);
  }, []);

  /**
   * Toggle audit log import on/off.
   */
  const toggleAuditLogImport = useCallback(() => {
    setImportAuditLog((prev) => !prev);
  }, []);

  /**
   * Reset to initial state.
   */
  const reset = useCallback(() => {
    // Stop any ongoing polling
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setPhase('idle');
    setAccessToken(null);
    setGuilds([]);
    setSelectedGuild(null);
    setImportedStructure(null);
    setMappedStructure(null);
    setValidationIssues([]);
    setProgress(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
    setBotStatus('unknown');
    setImportedMembers(null);
    setMembersAvailable(false);
    setImportMembers(true);
    setMembersLoading(false);
    setPinnedMessages(null);
    setPinsAvailable(false);
    setImportPins(true);
    setPinsLoading(false);
    setEnableBridge(false);
    setAuditLogEntries(null);
    setAuditLogAvailable(false);
    setAuditLogLoading(false);
    setImportAuditLog(true);
  }, []);

  // Compute total pin count
  const pinCount = pinnedMessages
    ? Object.values(pinnedMessages).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  // Compute total audit log count
  const auditLogCount = auditLogEntries?.length ?? 0;

  return {
    // State
    phase,
    accessToken,
    guilds,
    selectedGuild,
    importedStructure,
    mappedStructure,
    validationIssues,
    progress,
    result,
    error,
    isLoading,
    botStatus,
    importedMembers,
    membersAvailable,
    importMembers,
    importPins,
    enableBridge,
    pinnedMessages,
    pinsAvailable,
    pinCount,
    membersLoading,
    pinsLoading,
    auditLogEntries,
    auditLogAvailable,
    auditLogLoading,
    importAuditLog,
    auditLogCount,

    // Actions
    startAuth,
    refreshGuilds,
    selectGuild,
    backToSelection,
    startImport,
    inviteBot,
    refetchStructure,
    toggleMemberImport,
    togglePinImport,
    toggleBridge,
    toggleAuditLogImport,
    reset,
  };
}
