/**
 * Discord Community Import Types
 *
 * Types for importing Discord server (guild) structure into Umbra communities.
 *
 * @packageDocumentation
 */

import { translateDiscordPermissions } from './discord-permissions';

/**
 * Discord guild (server) information.
 */
export interface DiscordGuildInfo {
  /** Discord guild ID. */
  id: string;
  /** Guild name. */
  name: string;
  /** Guild icon hash (can be used to construct icon URL). */
  icon: string | null;
  /** Guild banner hash (for banner image). */
  banner: string | null;
  /** Guild splash hash (for invite splash image). */
  splash: string | null;
  /** Guild description. */
  description: string | null;
  /** Whether the authenticated user is the owner. */
  owner: boolean;
  /** User's permissions in this guild (as integer). */
  permissions: number;
  /** Whether the user has MANAGE_GUILD permission. */
  canManage: boolean;
}

/**
 * Discord custom emoji.
 */
export interface DiscordEmoji {
  /** Emoji ID (null for unicode emoji). */
  id: string | null;
  /** Emoji name. */
  name: string | null;
  /** Whether the emoji is animated. */
  animated: boolean;
}

/**
 * Discord channel types we support importing.
 */
export type DiscordChannelType =
  | 'text'
  | 'voice'
  | 'category'
  | 'announcement'
  | 'forum'
  | 'stage'
  | 'unknown';

/**
 * Discord permission overwrite for a channel.
 */
export interface DiscordPermissionOverwrite {
  /** ID of the role or user. */
  id: string;
  /** Type: 0 = role, 1 = member. */
  type: 0 | 1;
  /** Allowed permissions bitfield. */
  allow: string;
  /** Denied permissions bitfield. */
  deny: string;
}

/**
 * An imported Discord channel.
 */
export interface DiscordImportedChannel {
  /** Discord channel ID. */
  id: string;
  /** Channel name. */
  name: string;
  /** Channel type. */
  channelType: DiscordChannelType;
  /** Parent category ID (if any). */
  parentId: string | null;
  /** Position in the channel list. */
  position: number;
  /** Topic/description. */
  topic: string | null;
  /** Whether the channel is NSFW. */
  nsfw: boolean;
  /** Permission overwrites. */
  permissionOverwrites: DiscordPermissionOverwrite[];
}

/**
 * An imported Discord role.
 */
export interface DiscordImportedRole {
  /** Discord role ID. */
  id: string;
  /** Role name. */
  name: string;
  /** Role color (as integer). */
  color: number;
  /** Whether the role is hoisted (displayed separately). */
  hoist: boolean;
  /** Position in the role list. */
  position: number;
  /** Permissions bitfield (as string for large numbers). */
  permissions: string;
  /** Whether the role is managed by an integration. */
  managed: boolean;
  /** Whether the role is mentionable. */
  mentionable: boolean;
}

/**
 * Discord guild sticker.
 */
export interface DiscordSticker {
  /** Sticker ID. */
  id: string;
  /** Sticker name. */
  name: string;
  /** Sticker description. */
  description: string | null;
  /** Format type: 1 = PNG, 2 = APNG, 3 = Lottie, 4 = GIF. */
  formatType: number;
  /** Whether the sticker is available. */
  available: boolean;
}

/**
 * Full imported structure of a Discord guild.
 */
export interface DiscordImportedStructure {
  /** Guild info. */
  guild: DiscordGuildInfo;
  /** All channels (including categories). */
  channels: DiscordImportedChannel[];
  /** All roles (excluding @everyone). */
  roles: DiscordImportedRole[];
  /** Custom emojis. */
  emojis?: DiscordEmoji[];
  /** Guild stickers. */
  stickers?: DiscordSticker[];
}

/**
 * Response from the guilds list endpoint.
 */
export interface DiscordGuildsResponse {
  /** List of guilds the user can manage. */
  guilds: DiscordGuildInfo[];
}

/**
 * Response from the guild structure endpoint.
 */
export interface DiscordGuildStructureResponse {
  /** Whether the fetch was successful. */
  success: boolean;
  /** The imported structure (if successful). */
  structure: DiscordImportedStructure | null;
  /** Error message (if failed). */
  error: string | null;
}

/**
 * Mapped emoji for import.
 */
export interface MappedEmoji {
  /** Source platform emoji ID. */
  id: string;
  /** Emoji name (without colons). */
  name: string;
  /** Whether the emoji is animated. */
  animated: boolean;
  /** Full URL to the emoji image. */
  url: string;
}

/**
 * Mapped sticker for import.
 */
export interface MappedSticker {
  /** Source platform sticker ID. */
  id: string;
  /** Sticker name. */
  name: string;
  /** Full URL to the sticker image. */
  url: string;
  /** Whether the sticker is animated. */
  animated: boolean;
  /** Sticker format: 'png' | 'apng' | 'gif' | 'lottie'. */
  format: string;
}

/**
 * Mapped structure ready for Umbra community creation.
 *
 * This is the platform-agnostic output contract for all import adapters.
 * Each platform (Discord, GitHub, Steam, etc.) should transform its native
 * data into this structure. The community creation function
 * (`createCommunityFromDiscordImport` and future platform equivalents)
 * consumes this structure generically.
 *
 * Optional `seats` and `pinnedMessages` extend the base structure
 * for platforms that support member and message import.
 */
export interface MappedCommunityStructure {
  /** Community name (from guild name). */
  name: string;
  /** Community description. */
  description: string;
  /** Source Discord guild ID (for later re-sync / fetch-users). */
  sourceGuildId?: string;
  /** Community icon URL (from source platform). */
  iconUrl?: string;
  /** Community banner URL (from source platform). */
  bannerUrl?: string;
  /** Categories to create. */
  categories: MappedCategory[];
  /** Channels to create (sorted by position within categories). */
  channels: MappedChannel[];
  /** Custom roles to create. */
  roles: MappedRole[];
  /** Imported member seats (ghost members). */
  seats?: MappedSeat[];
  /** Pinned messages by source channel ID. */
  pinnedMessages?: Record<string, MappedPinnedMessage[]>;
  /** Custom emojis from the source platform. */
  emojis?: MappedEmoji[];
  /** Custom stickers from the source platform. */
  stickers?: MappedSticker[];
  /** Audit log entries from the source platform. */
  auditLog?: MappedAuditLogEntry[];
}

/**
 * A category mapped for Umbra.
 */
export interface MappedCategory {
  /** Original Discord category ID (for reference). */
  discordId: string;
  /** Category name. */
  name: string;
  /** Position (order). */
  position: number;
}

/**
 * A channel mapped for Umbra.
 */
export interface MappedChannel {
  /** Original Discord channel ID (for reference). */
  discordId: string;
  /** Channel name. */
  name: string;
  /** Channel type: 'text', 'voice', or 'announcement'. */
  type: 'text' | 'voice' | 'announcement';
  /** Discord category ID this channel belongs to (or null for uncategorized). */
  categoryDiscordId: string | null;
  /** Position within category. */
  position: number;
  /** Channel topic/description. */
  topic: string | null;
  /** Whether the channel is NSFW. */
  nsfw: boolean;
}

/**
 * A role mapped for Umbra.
 */
export interface MappedRole {
  /** Original Discord role ID (for reference). */
  discordId: string;
  /** Role name. */
  name: string;
  /** Role color (hex string, e.g., "#FF0000"). */
  color: string;
  /** Whether the role is displayed separately in member list. */
  hoist: boolean;
  /** Position (order). */
  position: number;
  /** Umbra permissions bitfield (as string). */
  permissions: string;
  /** Whether the role is mentionable. */
  mentionable: boolean;
}

/**
 * A member seat mapped for import (platform-agnostic).
 *
 * ## Platform Contract
 *
 * This interface is generic across all platforms. To add seat import for a
 * new platform (e.g., GitHub, Steam), create a platform-specific import
 * adapter that produces `MappedSeat[]` objects. The rest of the system
 * (WASM core, claim flow, UI) handles them generically by the `platform`
 * string field. No changes to core seat logic are needed.
 *
 * `sourceRoleIds` are the platform's original role IDs. During import,
 * these are mapped to newly-created Umbra role IDs via a `roleIdMap`
 * built from the role creation phase.
 */
export interface MappedSeat {
  /** Source platform (e.g., 'discord', 'github'). */
  platform: string;
  /** User ID on the source platform. */
  platformUserId: string;
  /** Username on the source platform. */
  platformUsername: string;
  /** Nickname from the source platform. */
  nickname?: string;
  /** Avatar URL from the source platform. */
  avatarUrl?: string;
  /** Source platform role IDs (mapped to Umbra role IDs during import). */
  sourceRoleIds: string[];
}

/**
 * A pinned message mapped for import.
 */
export interface MappedPinnedMessage {
  /** Platform user ID of the message author. */
  authorPlatformUserId: string;
  /** Username of the message author. */
  authorUsername: string;
  /** Message content (plaintext). */
  content: string;
  /** Original timestamp from the source platform. */
  originalTimestamp: number;
  /** Source channel ID. */
  sourceChannelId: string;
}

/**
 * Imported Discord guild member.
 */
export interface DiscordImportedMember {
  /** Discord user ID. */
  userId: string;
  /** Discord username. */
  username: string;
  /** Avatar hash. */
  avatar: string | null;
  /** Nickname in the guild. */
  nickname: string | null;
  /** Discord role IDs. */
  roleIds: string[];
  /** When the user joined the guild. */
  joinedAt: string | null;
  /** Whether this is a bot account. */
  bot: boolean;
}

/**
 * Response from the guild members endpoint.
 */
export interface DiscordGuildMembersResponse {
  /** List of members. */
  members: DiscordImportedMember[];
  /** Total count of members fetched. */
  totalCount: number;
  /** Whether the bot has the GUILD_MEMBERS intent. */
  hasMembersIntent: boolean;
}

/**
 * A pinned message from Discord.
 */
export interface DiscordPinnedMessage {
  /** Discord message ID. */
  id: string;
  /** Message content. */
  content: string;
  /** Author's Discord user ID. */
  authorId: string;
  /** Author's username. */
  authorUsername: string;
  /** ISO timestamp. */
  timestamp: string;
}

/**
 * Response from the channel pins endpoint.
 */
export interface DiscordChannelPinsResponse {
  /** List of pinned messages. */
  pins: DiscordPinnedMessage[];
}

/**
 * A Discord audit log entry.
 */
export interface DiscordAuditLogEntry {
  /** Entry ID. */
  id: string;
  /** Umbra-mapped action type (e.g., "member_ban_add"). */
  actionType: string;
  /** Original Discord action type number. */
  discordActionType: number;
  /** Discord user ID of who performed the action. */
  actorUserId: string;
  /** Username of who performed the action. */
  actorUsername: string;
  /** Avatar hash of the actor. */
  actorAvatar: string | null;
  /** Target ID (user, channel, role, etc.). */
  targetId: string | null;
  /** Target type (member, channel, role, etc.). */
  targetType: string;
  /** Reason provided for the action. */
  reason: string | null;
  /** Changes made (for update actions). */
  changes?: unknown[];
  /** Additional options (for specific actions). */
  options?: Record<string, unknown>;
}

/**
 * Response from the guild audit log endpoint.
 */
export interface DiscordAuditLogResponse {
  /** List of audit log entries. */
  entries: DiscordAuditLogEntry[];
  /** Error message if fetch failed. */
  error?: string;
}

/**
 * Mapped audit log entry for Umbra import.
 */
export interface MappedAuditLogEntry {
  /** Action type (e.g., "member_ban_add", "channel_create"). */
  actionType: string;
  /** Platform user ID of who performed the action. */
  actorPlatformUserId: string;
  /** Username of the actor. */
  actorUsername: string;
  /** Avatar URL of the actor. */
  actorAvatarUrl?: string;
  /** Target type (member, channel, role, etc.). */
  targetType: string;
  /** Target ID (platform-specific). */
  targetId?: string;
  /** Reason for the action. */
  reason?: string;
  /** Additional metadata. */
  metadata?: Record<string, unknown>;
  /** Original timestamp (approximated from snowflake ID). */
  timestamp: number;
}

/**
 * Convert Discord avatar to CDN URL.
 */
export function getAvatarUrl(userId: string, avatarHash: string | null, size = 128): string | null {
  if (!avatarHash) return null;
  const format = avatarHash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${format}?size=${size}`;
}

/**
 * Extract timestamp from Discord snowflake ID.
 * Discord epoch is 2015-01-01T00:00:00.000Z
 */
export function snowflakeToTimestamp(snowflake: string): number {
  const DISCORD_EPOCH = 1420070400000;
  const id = BigInt(snowflake);
  return Number((id >> 22n) + BigInt(DISCORD_EPOCH));
}

/**
 * Convert Discord color integer to hex string.
 */
export function discordColorToHex(color: number): string {
  if (color === 0) return '#99AAB5'; // Discord's default gray
  return `#${color.toString(16).padStart(6, '0').toUpperCase()}`;
}

/**
 * Get the Discord CDN URL for a guild icon.
 */
export function getGuildIconUrl(guildId: string, iconHash: string | null, size = 128): string | null {
  if (!iconHash) return null;
  const format = iconHash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.${format}?size=${size}`;
}

/**
 * Get the Discord CDN URL for a guild banner.
 * Note: Discord CDN only supports specific sizes (powers of 2): 16, 32, 64, 128, 256, 512, 1024, 2048, 4096
 */
export function getGuildBannerUrl(guildId: string, bannerHash: string | null, size = 1024): string | null {
  if (!bannerHash) return null;
  const format = bannerHash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/banners/${guildId}/${bannerHash}.${format}?size=${size}`;
}

/**
 * Get the Discord CDN URL for a guild splash.
 * Note: Discord CDN only supports specific sizes (powers of 2): 16, 32, 64, 128, 256, 512, 1024, 2048, 4096
 */
export function getGuildSplashUrl(guildId: string, splashHash: string | null, size = 512): string | null {
  if (!splashHash) return null;
  return `https://cdn.discordapp.com/splashes/${guildId}/${splashHash}.png?size=${size}`;
}

/**
 * Download an image from a URL and upload it to the relay's asset storage.
 * Returns the local asset URL that can be used instead of the original URL.
 *
 * @param sourceUrl - The URL to download the image from
 * @param communityId - The community to store the asset under
 * @param assetType - The type of asset (icon, banner, splash, emoji, sticker)
 * @param uploaderDid - The DID of the uploader
 * @param relayUrl - The relay URL (defaults to env EXPO_PUBLIC_RELAY_URL)
 * @returns The local asset URL, or null if download/upload failed
 */
export async function downloadAndStoreAsset(
  sourceUrl: string,
  communityId: string,
  assetType: 'icon' | 'banner' | 'splash' | 'emoji' | 'sticker',
  uploaderDid: string,
  relayUrl?: string,
): Promise<string | null> {
  const relay = relayUrl || process.env.EXPO_PUBLIC_RELAY_URL || 'https://relay.umbra.chat';

  try {
    // Download the image from the source URL
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      console.warn(`[downloadAndStoreAsset] Failed to download from ${sourceUrl}: ${response.status}`);
      return null;
    }

    const blob = await response.blob();
    const contentType = blob.type || 'image/png';

    // Create form data for upload
    const formData = new FormData();
    formData.append('file', blob, `${assetType}.${contentType.split('/')[1] || 'png'}`);
    formData.append('type', assetType === 'emoji' || assetType === 'sticker' ? assetType : 'branding');
    formData.append('did', uploaderDid);

    // Upload to relay
    const uploadUrl = `${relay}/api/community/${encodeURIComponent(communityId)}/assets/upload`;
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.warn(`[downloadAndStoreAsset] Failed to upload to relay: ${uploadResponse.status} - ${errorText}`);
      return null;
    }

    const result = await uploadResponse.json();
    if (!result.ok || !result.data?.url) {
      console.warn('[downloadAndStoreAsset] Upload failed:', result.error);
      return null;
    }

    // Return the full URL to the asset
    return `${relay}${result.data.url}`;
  } catch (error) {
    console.warn('[downloadAndStoreAsset] Error:', error);
    return null;
  }
}

/**
 * Download and store guild branding assets (icon, banner, splash) to local storage.
 * This replaces Discord CDN URLs with locally-stored copies.
 *
 * @param guildId - Discord guild ID
 * @param icon - Guild icon hash
 * @param banner - Guild banner hash
 * @param splash - Guild splash hash
 * @param communityId - The Umbra community ID to store assets under
 * @param uploaderDid - The DID of the uploader
 * @param relayUrl - The relay URL
 * @returns Object with local URLs for each asset, or null for failed downloads
 */
export async function downloadAndStoreGuildBranding(
  guildId: string,
  icon: string | null,
  banner: string | null,
  splash: string | null,
  communityId: string,
  uploaderDid: string,
  relayUrl?: string,
): Promise<{ iconUrl: string | null; bannerUrl: string | null; splashUrl: string | null }> {
  const results = await Promise.all([
    // Icon
    icon
      ? downloadAndStoreAsset(
          getGuildIconUrl(guildId, icon, 256)!,
          communityId,
          'icon',
          uploaderDid,
          relayUrl,
        )
      : Promise.resolve(null),
    // Banner
    banner
      ? downloadAndStoreAsset(
          getGuildBannerUrl(guildId, banner, 1024)!,
          communityId,
          'banner',
          uploaderDid,
          relayUrl,
        )
      : Promise.resolve(null),
    // Splash
    splash
      ? downloadAndStoreAsset(
          getGuildSplashUrl(guildId, splash, 512)!,
          communityId,
          'splash',
          uploaderDid,
          relayUrl,
        )
      : Promise.resolve(null),
  ]);

  return {
    iconUrl: results[0],
    bannerUrl: results[1],
    splashUrl: results[2],
  };
}

/**
 * Get the Discord CDN URL for a custom emoji.
 */
export function getEmojiUrl(emojiId: string, animated: boolean, size = 128): string {
  const format = animated ? 'gif' : 'png';
  return `https://cdn.discordapp.com/emojis/${emojiId}.${format}?size=${size}`;
}

/**
 * Get the Discord CDN URL for a guild sticker.
 *
 * Discord sticker format types: 1 = PNG, 2 = APNG, 3 = Lottie (JSON), 4 = GIF.
 */
export function getStickerUrl(stickerId: string, formatType: number): string {
  // Lottie stickers are served as JSON
  if (formatType === 3) {
    return `https://cdn.discordapp.com/stickers/${stickerId}.json`;
  }
  // GIF format
  if (formatType === 4) {
    return `https://cdn.discordapp.com/stickers/${stickerId}.gif`;
  }
  // APNG format (Discord serves these as PNG but they're animated PNGs)
  if (formatType === 2) {
    return `https://cdn.discordapp.com/stickers/${stickerId}.png`;
  }
  // Default PNG
  return `https://cdn.discordapp.com/stickers/${stickerId}.png`;
}

/**
 * Map Discord sticker format type to Umbra format string.
 */
export function mapStickerFormat(formatType: number): string {
  switch (formatType) {
    case 2: return 'apng';
    case 3: return 'lottie';
    case 4: return 'gif';
    default: return 'png';
  }
}

/**
 * Map a Discord channel type number to our type string.
 */
export function mapChannelType(type: number | string): DiscordChannelType {
  const typeNum = typeof type === 'string' ? parseInt(type, 10) : type;
  switch (typeNum) {
    case 0:
      return 'text';
    case 2:
      return 'voice';
    case 4:
      return 'category';
    case 5:
      return 'announcement';
    case 13:
      return 'stage';
    case 15:
      return 'forum';
    default:
      return 'unknown';
  }
}

/**
 * Map Discord imported structure to Umbra community structure.
 *
 * @param structure - The imported Discord structure
 * @returns Mapped structure ready for Umbra community creation
 */
export function mapDiscordToUmbra(structure: DiscordImportedStructure): MappedCommunityStructure {
  // Separate categories from channels
  const categories = structure.channels
    .filter((c) => c.channelType === 'category')
    .sort((a, b) => a.position - b.position)
    .map((c) => ({
      discordId: c.id,
      name: c.name,
      position: c.position,
    }));

  // Map channels (excluding categories and unknown types)
  // Forum and stage channels are mapped to text and voice respectively
  const supportedTypes = ['text', 'voice', 'announcement', 'forum', 'stage'];
  const channels = structure.channels
    .filter((c) => supportedTypes.includes(c.channelType))
    .sort((a, b) => {
      // Sort by category first, then by position
      const catA = a.parentId || '';
      const catB = b.parentId || '';
      if (catA !== catB) {
        return catA.localeCompare(catB);
      }
      return a.position - b.position;
    })
    .map((c) => {
      // Map Discord-specific types to Umbra equivalents
      let channelType: 'text' | 'voice' | 'announcement' = 'text';
      if (c.channelType === 'voice' || c.channelType === 'stage') {
        channelType = 'voice';
      } else if (c.channelType === 'announcement') {
        channelType = 'announcement';
      }
      // 'text' and 'forum' both map to 'text'

      return {
        discordId: c.id,
        name: c.name,
        type: channelType,
        categoryDiscordId: c.parentId,
        position: c.position,
        topic: c.topic,
        nsfw: c.nsfw,
      };
    });

  // Map roles (excluding managed roles like bot roles)
  const roles = structure.roles
    .filter((r) => !r.managed)
    .sort((a, b) => b.position - a.position) // Higher position = more important
    .map((r) => ({
      discordId: r.id,
      name: r.name,
      color: discordColorToHex(r.color),
      hoist: r.hoist,
      position: r.position,
      permissions: translateDiscordPermissions(r.permissions).toString(),
      mentionable: r.mentionable,
    }));

  // Build icon and banner URLs
  const iconUrl = getGuildIconUrl(structure.guild.id, structure.guild.icon, 256);
  const bannerUrl = getGuildBannerUrl(structure.guild.id, structure.guild.banner, 1024);

  // Map emojis
  const emojis: MappedEmoji[] = (structure.emojis || [])
    .filter((e) => e.id && e.name)
    .map((e) => ({
      id: e.id!,
      name: e.name!,
      animated: e.animated,
      url: getEmojiUrl(e.id!, e.animated),
    }));

  // Map stickers
  const stickers: MappedSticker[] = (structure.stickers || [])
    .filter((s) => s.id && s.name)
    .map((s) => ({
      id: s.id,
      name: s.name,
      url: getStickerUrl(s.id, s.formatType),
      animated: s.formatType === 2 || s.formatType === 3 || s.formatType === 4,
      format: mapStickerFormat(s.formatType),
    }));

  // Use Discord description if available, otherwise generate one
  const description = structure.guild.description || `Imported from Discord server "${structure.guild.name}"`;

  return {
    name: structure.guild.name,
    description,
    sourceGuildId: structure.guild.id,
    iconUrl: iconUrl ?? undefined,
    bannerUrl: bannerUrl ?? undefined,
    categories,
    channels,
    roles,
    emojis: emojis.length > 0 ? emojis : undefined,
    stickers: stickers.length > 0 ? stickers : undefined,
  };
}

/**
 * Validate that a structure can be imported.
 *
 * @param structure - The structure to validate
 * @returns Validation result with any issues found
 */
export function validateImportStructure(
  structure: MappedCommunityStructure
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check name
  if (!structure.name || structure.name.trim().length === 0) {
    issues.push('Community name is required');
  } else if (structure.name.length > 100) {
    issues.push('Community name must be 100 characters or less');
  }

  // Check categories
  if (structure.categories.length > 50) {
    issues.push('Maximum 50 categories allowed');
  }
  for (const cat of structure.categories) {
    if (cat.name.length > 50) {
      issues.push(`Category "${cat.name}" name is too long (max 50 characters)`);
    }
  }

  // Check channels
  if (structure.channels.length > 500) {
    issues.push('Maximum 500 channels allowed');
  }
  for (const ch of structure.channels) {
    if (ch.name.length > 100) {
      issues.push(`Channel "${ch.name}" name is too long (max 100 characters)`);
    }
  }

  // Check roles
  if (structure.roles.length > 250) {
    issues.push('Maximum 250 roles allowed');
  }
  for (const role of structure.roles) {
    if (role.name.length > 100) {
      issues.push(`Role "${role.name}" name is too long (max 100 characters)`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Import progress for the community import process.
 */
export interface CommunityImportProgress {
  /** Current phase of import. */
  phase: 'creating_community' | 'downloading_branding' | 'creating_categories' | 'creating_channels' | 'creating_roles' | 'creating_seats' | 'importing_pins' | 'importing_audit_log' | 'importing_emoji' | 'importing_stickers' | 'complete';
  /** Progress percentage (0-100). */
  percent: number;
  /** Current item being created. */
  currentItem?: string;
  /** Total items in current phase. */
  totalItems?: number;
  /** Items completed in current phase. */
  completedItems?: number;
}

/**
 * Result of a community import operation.
 */
export interface CommunityImportResult {
  /** Whether the import was successful. */
  success: boolean;
  /** The created community ID (if successful). */
  communityId?: string;
  /** Number of categories created. */
  categoriesCreated: number;
  /** Number of channels created. */
  channelsCreated: number;
  /** Number of roles created. */
  rolesCreated: number;
  /** Number of member seats created. */
  seatsCreated: number;
  /** Number of pinned messages imported. */
  pinsImported: number;
  /** Number of audit log entries imported. */
  auditLogImported: number;
  /** Number of custom emoji imported. */
  emojiImported: number;
  /** Number of stickers imported. */
  stickersImported: number;
  /** Any errors that occurred. */
  errors: string[];
  /** Warnings (non-fatal issues). */
  warnings: string[];
  /** Discord channel ID → Umbra channel ID mapping (for bridge config). */
  channelIdMap?: Record<string, string>;
  /** DIDs of all community members (for bridge fan-out). */
  memberDids?: string[];
}
