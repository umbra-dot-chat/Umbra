/**
 * Discord Permission to Umbra Permission Translation
 *
 * Maps Discord permission bitfields to Umbra community permissions.
 * Discord uses a 64-bit integer bitfield for permissions.
 *
 * @packageDocumentation
 */

/**
 * Discord permission bit flags.
 * @see https://discord.com/developers/docs/topics/permissions#permissions-bitwise-permission-flags
 */
export const DISCORD_PERMISSIONS = {
  // General Permissions
  CREATE_INSTANT_INVITE: 1n << 0n,
  KICK_MEMBERS: 1n << 1n,
  BAN_MEMBERS: 1n << 2n,
  ADMINISTRATOR: 1n << 3n,
  MANAGE_CHANNELS: 1n << 4n,
  MANAGE_GUILD: 1n << 5n,
  ADD_REACTIONS: 1n << 6n,
  VIEW_AUDIT_LOG: 1n << 7n,
  PRIORITY_SPEAKER: 1n << 8n,
  STREAM: 1n << 9n,
  VIEW_CHANNEL: 1n << 10n,
  SEND_MESSAGES: 1n << 11n,
  SEND_TTS_MESSAGES: 1n << 12n,
  MANAGE_MESSAGES: 1n << 13n,
  EMBED_LINKS: 1n << 14n,
  ATTACH_FILES: 1n << 15n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  MENTION_EVERYONE: 1n << 17n,
  USE_EXTERNAL_EMOJIS: 1n << 18n,
  VIEW_GUILD_INSIGHTS: 1n << 19n,
  CONNECT: 1n << 20n,
  SPEAK: 1n << 21n,
  MUTE_MEMBERS: 1n << 22n,
  DEAFEN_MEMBERS: 1n << 23n,
  MOVE_MEMBERS: 1n << 24n,
  USE_VAD: 1n << 25n,
  CHANGE_NICKNAME: 1n << 26n,
  MANAGE_NICKNAMES: 1n << 27n,
  MANAGE_ROLES: 1n << 28n,
  MANAGE_WEBHOOKS: 1n << 29n,
  MANAGE_GUILD_EXPRESSIONS: 1n << 30n,
  USE_APPLICATION_COMMANDS: 1n << 31n,
  REQUEST_TO_SPEAK: 1n << 32n,
  MANAGE_EVENTS: 1n << 33n,
  MANAGE_THREADS: 1n << 34n,
  CREATE_PUBLIC_THREADS: 1n << 35n,
  CREATE_PRIVATE_THREADS: 1n << 36n,
  USE_EXTERNAL_STICKERS: 1n << 37n,
  SEND_MESSAGES_IN_THREADS: 1n << 38n,
  USE_EMBEDDED_ACTIVITIES: 1n << 39n,
  MODERATE_MEMBERS: 1n << 40n,
  VIEW_CREATOR_MONETIZATION_ANALYTICS: 1n << 41n,
  USE_SOUNDBOARD: 1n << 42n,
  CREATE_GUILD_EXPRESSIONS: 1n << 43n,
  CREATE_EVENTS: 1n << 44n,
  USE_EXTERNAL_SOUNDS: 1n << 45n,
  SEND_VOICE_MESSAGES: 1n << 46n,
} as const;

/**
 * Umbra permission bit flags.
 * These MUST match the Rust `Permission` enum in umbra-core/src/community/permissions.rs.
 */
export const UMBRA_PERMISSIONS = {
  // ── General ──────────────────────────────────────────────────────────
  VIEW_CHANNELS: 1n << 0n,
  MANAGE_COMMUNITY: 1n << 1n,
  MANAGE_CHANNELS: 1n << 2n,
  MANAGE_ROLES: 1n << 3n,
  CREATE_INVITES: 1n << 4n,
  MANAGE_INVITES: 1n << 5n,

  // ── Members ──────────────────────────────────────────────────────────
  KICK_MEMBERS: 1n << 6n,
  BAN_MEMBERS: 1n << 7n,
  MODERATE_MEMBERS: 1n << 8n,
  CHANGE_NICKNAME: 1n << 9n,
  MANAGE_NICKNAMES: 1n << 10n,

  // ── Messages ─────────────────────────────────────────────────────────
  SEND_MESSAGES: 1n << 11n,
  EMBED_LINKS: 1n << 12n,
  ATTACH_FILES: 1n << 13n,
  ADD_REACTIONS: 1n << 14n,
  USE_EXTERNAL_EMOJI: 1n << 15n,
  MENTION_EVERYONE: 1n << 16n,
  MANAGE_MESSAGES: 1n << 17n,
  READ_MESSAGE_HISTORY: 1n << 18n,

  // ── Threads ──────────────────────────────────────────────────────────
  CREATE_THREADS: 1n << 19n,
  SEND_THREAD_MESSAGES: 1n << 20n,
  MANAGE_THREADS: 1n << 21n,

  // ── Voice ────────────────────────────────────────────────────────────
  VOICE_CONNECT: 1n << 22n,
  VOICE_SPEAK: 1n << 23n,
  VOICE_STREAM: 1n << 24n,
  VOICE_MUTE_OTHERS: 1n << 25n,
  VOICE_DEAFEN_OTHERS: 1n << 26n,
  VOICE_MOVE_OTHERS: 1n << 27n,

  // ── Moderation ───────────────────────────────────────────────────────
  VIEW_AUDIT_LOG: 1n << 28n,
  MANAGE_WEBHOOKS: 1n << 29n,
  MANAGE_EMOJI: 1n << 30n,
  MANAGE_BRANDING: 1n << 31n,

  // ── Files ────────────────────────────────────────────────────────────
  UPLOAD_FILES: 1n << 32n,
  MANAGE_FILES: 1n << 33n,

  // ── Administrator ────────────────────────────────────────────────────
  ADMINISTRATOR: 1n << 63n,
} as const;

/**
 * Discord to Umbra permission mapping.
 * Maps each Discord permission to its Umbra equivalent(s).
 */
const PERMISSION_MAP: Record<keyof typeof DISCORD_PERMISSIONS, bigint | null> = {
  // Direct mappings
  CREATE_INSTANT_INVITE: UMBRA_PERMISSIONS.CREATE_INVITES,
  KICK_MEMBERS: UMBRA_PERMISSIONS.KICK_MEMBERS,
  BAN_MEMBERS: UMBRA_PERMISSIONS.BAN_MEMBERS,
  ADMINISTRATOR: UMBRA_PERMISSIONS.ADMINISTRATOR,
  MANAGE_CHANNELS: UMBRA_PERMISSIONS.MANAGE_CHANNELS,
  MANAGE_GUILD: UMBRA_PERMISSIONS.MANAGE_COMMUNITY,
  ADD_REACTIONS: UMBRA_PERMISSIONS.ADD_REACTIONS,
  VIEW_AUDIT_LOG: UMBRA_PERMISSIONS.VIEW_AUDIT_LOG,
  PRIORITY_SPEAKER: null, // No direct equivalent
  STREAM: UMBRA_PERMISSIONS.VOICE_STREAM,
  VIEW_CHANNEL: UMBRA_PERMISSIONS.VIEW_CHANNELS,
  SEND_MESSAGES: UMBRA_PERMISSIONS.SEND_MESSAGES,
  SEND_TTS_MESSAGES: UMBRA_PERMISSIONS.SEND_MESSAGES, // Map to regular send
  MANAGE_MESSAGES: UMBRA_PERMISSIONS.MANAGE_MESSAGES,
  EMBED_LINKS: UMBRA_PERMISSIONS.EMBED_LINKS,
  ATTACH_FILES: UMBRA_PERMISSIONS.ATTACH_FILES,
  READ_MESSAGE_HISTORY: UMBRA_PERMISSIONS.READ_MESSAGE_HISTORY,
  MENTION_EVERYONE: UMBRA_PERMISSIONS.MENTION_EVERYONE,
  USE_EXTERNAL_EMOJIS: UMBRA_PERMISSIONS.USE_EXTERNAL_EMOJI,
  VIEW_GUILD_INSIGHTS: null, // No direct equivalent
  CONNECT: UMBRA_PERMISSIONS.VOICE_CONNECT,
  SPEAK: UMBRA_PERMISSIONS.VOICE_SPEAK,
  MUTE_MEMBERS: UMBRA_PERMISSIONS.VOICE_MUTE_OTHERS,
  DEAFEN_MEMBERS: UMBRA_PERMISSIONS.VOICE_DEAFEN_OTHERS,
  MOVE_MEMBERS: UMBRA_PERMISSIONS.VOICE_MOVE_OTHERS,
  USE_VAD: UMBRA_PERMISSIONS.VOICE_SPEAK, // Voice activity = speak
  CHANGE_NICKNAME: UMBRA_PERMISSIONS.CHANGE_NICKNAME,
  MANAGE_NICKNAMES: UMBRA_PERMISSIONS.MANAGE_NICKNAMES,
  MANAGE_ROLES: UMBRA_PERMISSIONS.MANAGE_ROLES,
  MANAGE_WEBHOOKS: UMBRA_PERMISSIONS.MANAGE_WEBHOOKS,
  MANAGE_GUILD_EXPRESSIONS: UMBRA_PERMISSIONS.MANAGE_EMOJI,
  USE_APPLICATION_COMMANDS: UMBRA_PERMISSIONS.SEND_MESSAGES, // Map to send
  REQUEST_TO_SPEAK: UMBRA_PERMISSIONS.VOICE_SPEAK,
  MANAGE_EVENTS: null, // No events yet
  MANAGE_THREADS: UMBRA_PERMISSIONS.MANAGE_THREADS,
  CREATE_PUBLIC_THREADS: UMBRA_PERMISSIONS.CREATE_THREADS,
  CREATE_PRIVATE_THREADS: UMBRA_PERMISSIONS.CREATE_THREADS,
  USE_EXTERNAL_STICKERS: UMBRA_PERMISSIONS.USE_EXTERNAL_EMOJI,
  SEND_MESSAGES_IN_THREADS: UMBRA_PERMISSIONS.SEND_THREAD_MESSAGES,
  USE_EMBEDDED_ACTIVITIES: null, // No activities
  MODERATE_MEMBERS: UMBRA_PERMISSIONS.MODERATE_MEMBERS,
  VIEW_CREATOR_MONETIZATION_ANALYTICS: null, // No monetization
  USE_SOUNDBOARD: null, // No soundboard
  CREATE_GUILD_EXPRESSIONS: UMBRA_PERMISSIONS.MANAGE_EMOJI,
  CREATE_EVENTS: null, // No events
  USE_EXTERNAL_SOUNDS: null, // No external sounds
  SEND_VOICE_MESSAGES: UMBRA_PERMISSIONS.SEND_MESSAGES,
};

/**
 * Convert a Discord permission bitfield string to an Umbra permission bitfield.
 *
 * @param discordPermissions - Discord permissions as a string (since it can exceed JS number limits)
 * @returns Umbra permission bitfield as a bigint
 */
export function translateDiscordPermissions(discordPermissions: string): bigint {
  const discordBits = BigInt(discordPermissions);

  // If Administrator, return full permissions
  if ((discordBits & DISCORD_PERMISSIONS.ADMINISTRATOR) !== 0n) {
    return UMBRA_PERMISSIONS.ADMINISTRATOR;
  }

  let umbraBits = 0n;

  // Map each Discord permission to Umbra
  for (const [discordPerm, umbraPerm] of Object.entries(PERMISSION_MAP)) {
    if (umbraPerm === null) continue;

    const discordBit = DISCORD_PERMISSIONS[discordPerm as keyof typeof DISCORD_PERMISSIONS];
    if ((discordBits & discordBit) !== 0n) {
      umbraBits |= umbraPerm;
    }
  }

  return umbraBits;
}

/**
 * Convert Umbra permission bitfield to a human-readable list of permissions.
 *
 * @param permissions - Umbra permission bitfield
 * @returns Array of permission names
 */
export function permissionsToNames(permissions: bigint): string[] {
  const names: string[] = [];

  for (const [name, bit] of Object.entries(UMBRA_PERMISSIONS)) {
    if ((permissions & bit) !== 0n) {
      names.push(name);
    }
  }

  return names;
}

/**
 * Convert a list of permission names to a bitfield.
 *
 * @param names - Array of permission names
 * @returns Umbra permission bitfield
 */
export function namesToPermissions(names: string[]): bigint {
  let bits = 0n;

  for (const name of names) {
    const bit = UMBRA_PERMISSIONS[name as keyof typeof UMBRA_PERMISSIONS];
    if (bit !== undefined) {
      bits |= bit;
    }
  }

  return bits;
}

/**
 * Check if a permission bitfield has a specific permission.
 *
 * @param permissions - Permission bitfield
 * @param permission - Permission to check
 * @returns True if the permission is set
 */
export function hasPermission(permissions: bigint, permission: bigint): boolean {
  // Administrator has all permissions
  if ((permissions & UMBRA_PERMISSIONS.ADMINISTRATOR) !== 0n) {
    return true;
  }
  return (permissions & permission) !== 0n;
}

/**
 * Get the default member permissions (what @everyone gets).
 * Matches Rust `Permissions::default_everyone()`.
 */
export function getDefaultMemberPermissions(): bigint {
  return (
    UMBRA_PERMISSIONS.VIEW_CHANNELS |
    UMBRA_PERMISSIONS.SEND_MESSAGES |
    UMBRA_PERMISSIONS.READ_MESSAGE_HISTORY |
    UMBRA_PERMISSIONS.ADD_REACTIONS |
    UMBRA_PERMISSIONS.EMBED_LINKS |
    UMBRA_PERMISSIONS.ATTACH_FILES |
    UMBRA_PERMISSIONS.USE_EXTERNAL_EMOJI |
    UMBRA_PERMISSIONS.CHANGE_NICKNAME |
    UMBRA_PERMISSIONS.CREATE_THREADS |
    UMBRA_PERMISSIONS.SEND_THREAD_MESSAGES |
    UMBRA_PERMISSIONS.VOICE_CONNECT |
    UMBRA_PERMISSIONS.VOICE_SPEAK |
    UMBRA_PERMISSIONS.VOICE_STREAM |
    UMBRA_PERMISSIONS.UPLOAD_FILES
  );
}

/**
 * Get moderator permissions preset.
 * Matches Rust `Permissions::moderator()`.
 */
export function getModeratorPermissions(): bigint {
  return (
    getDefaultMemberPermissions() |
    UMBRA_PERMISSIONS.KICK_MEMBERS |
    UMBRA_PERMISSIONS.MODERATE_MEMBERS |
    UMBRA_PERMISSIONS.MANAGE_MESSAGES |
    UMBRA_PERMISSIONS.MANAGE_THREADS |
    UMBRA_PERMISSIONS.MENTION_EVERYONE |
    UMBRA_PERMISSIONS.MANAGE_NICKNAMES |
    UMBRA_PERMISSIONS.VIEW_AUDIT_LOG
  );
}

/**
 * Get admin permissions preset (everything except Administrator flag).
 * Matches Rust `Permissions::admin()`.
 */
export function getAdminPermissions(): bigint {
  return (
    getModeratorPermissions() |
    UMBRA_PERMISSIONS.MANAGE_COMMUNITY |
    UMBRA_PERMISSIONS.MANAGE_CHANNELS |
    UMBRA_PERMISSIONS.MANAGE_ROLES |
    UMBRA_PERMISSIONS.CREATE_INVITES |
    UMBRA_PERMISSIONS.MANAGE_INVITES |
    UMBRA_PERMISSIONS.BAN_MEMBERS |
    UMBRA_PERMISSIONS.MANAGE_WEBHOOKS |
    UMBRA_PERMISSIONS.MANAGE_EMOJI |
    UMBRA_PERMISSIONS.MANAGE_BRANDING |
    UMBRA_PERMISSIONS.MANAGE_FILES
  );
}

/**
 * Format permissions bitfield as a string for storage/transmission.
 *
 * @param permissions - Permission bitfield
 * @returns String representation of the bitfield
 */
export function permissionsToString(permissions: bigint): string {
  return permissions.toString();
}

/**
 * Parse permissions from a string.
 *
 * @param str - String representation of permissions
 * @returns Permission bitfield
 */
export function permissionsFromString(str: string): bigint {
  return BigInt(str);
}
