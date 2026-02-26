/**
 * Community module — CRUD for communities, spaces, channels, members, roles, invites, and messaging.
 *
 * @packageDocumentation
 */

import { wasm, parseWasm } from './helpers';
import type {
  Community,
  CommunityCreateResult,
  CommunitySpace,
  CommunityCategory,
  CommunityChannel,
  CommunityMember,
  CommunityRole,
  CommunityMessage,
  CommunityInvite,
  CommunityEvent,
  CommunityFileRecord,
  CommunityFileFolderRecord,
  CommunitySeat,
  CommunityEmoji,
  CommunitySticker,
  StickerPack,
  MessageMetadata,
} from './types';
import type {
  MappedCommunityStructure,
  CommunityImportResult,
  CommunityImportProgress,
  MappedEmoji,
  MappedSticker,
  MappedAuditLogEntry,
} from './import/discord-community';
import { downloadAndStoreAsset } from './import/discord-community';
import { getRelayUrl } from './discovery/api';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Post-process a CommunityMessage from parseWasm to hydrate metadata.
 *
 * The WASM layer returns `metadataJson` as a raw JSON string.  We parse it
 * into a typed `metadata` object and remove the raw string key.
 */
function hydrateMessageMetadata(msg: CommunityMessage & { metadataJson?: string | null }): CommunityMessage {
  if (msg.metadataJson) {
    try {
      (msg as CommunityMessage).metadata = JSON.parse(msg.metadataJson);
    } catch { /* ignore invalid JSON */ }
  }
  delete (msg as any).metadataJson;
  return msg;
}

// =============================================================================
// COMMUNITY CRUD
// =============================================================================

/**
 * Create a new community.
 */
export async function createCommunity(
  name: string,
  ownerDid: string,
  description?: string,
  ownerNickname?: string,
  originCommunityId?: string,
): Promise<CommunityCreateResult> {
  const json = JSON.stringify({
    name,
    owner_did: ownerDid,
    description: description ?? null,
    owner_nickname: ownerNickname ?? null,
    origin_community_id: originCommunityId ?? null,
  });
  const resultJson = wasm().umbra_wasm_community_create(json);
  return await parseWasm<CommunityCreateResult>(resultJson);
}

/**
 * Find a community by its origin (remote) community ID.
 * Returns the local community ID if found, null otherwise.
 */
export async function findCommunityByOrigin(originId: string): Promise<string | null> {
  const resultJson = wasm().umbra_wasm_community_find_by_origin(originId);
  return await parseWasm<string | null>(resultJson);
}

/**
 * Get a community by ID.
 */
export async function getCommunity(communityId: string): Promise<Community> {
  const resultJson = wasm().umbra_wasm_community_get(communityId);
  return await parseWasm<Community>(resultJson);
}

/**
 * Get all communities the current user is a member of.
 */
export async function getCommunities(memberDid: string): Promise<Community[]> {
  const resultJson = wasm().umbra_wasm_community_get_mine(memberDid);
  return await parseWasm<Community[]>(resultJson);
}

/**
 * Update a community's name and/or description.
 */
export async function updateCommunity(
  id: string,
  actorDid: string,
  name?: string,
  description?: string,
): Promise<void> {
  const json = JSON.stringify({
    id,
    name: name ?? null,
    description: description ?? null,
    actor_did: actorDid,
  });
  wasm().umbra_wasm_community_update(json);
}

/**
 * Update a community's branding (icon, banner, etc.).
 */
export async function updateCommunityBranding(
  communityId: string,
  actorDid: string,
  options: {
    iconUrl?: string;
    bannerUrl?: string;
    splashUrl?: string;
    accentColor?: string;
    customCss?: string;
  },
): Promise<void> {
  const json = JSON.stringify({
    community_id: communityId,
    icon_url: options.iconUrl ?? null,
    banner_url: options.bannerUrl ?? null,
    splash_url: options.splashUrl ?? null,
    accent_color: options.accentColor ?? null,
    custom_css: options.customCss ?? null,
    actor_did: actorDid,
  });
  wasm().umbra_wasm_community_update_branding(json);
}

/**
 * Delete a community (owner only).
 */
export async function deleteCommunity(id: string, actorDid: string): Promise<void> {
  const json = JSON.stringify({ id, actor_did: actorDid });
  wasm().umbra_wasm_community_delete(json);
}

/**
 * Transfer community ownership.
 */
export async function transferOwnership(
  communityId: string,
  currentOwnerDid: string,
  newOwnerDid: string,
): Promise<void> {
  const json = JSON.stringify({
    community_id: communityId,
    current_owner_did: currentOwnerDid,
    new_owner_did: newOwnerDid,
  });
  wasm().umbra_wasm_community_transfer_ownership(json);
}

// =============================================================================
// SPACES
// =============================================================================

/**
 * Create a new space in a community.
 */
export async function createSpace(
  communityId: string,
  name: string,
  actorDid: string,
  position?: number,
): Promise<CommunitySpace> {
  const json = JSON.stringify({
    community_id: communityId,
    name,
    position: position ?? 0,
    actor_did: actorDid,
  });
  const resultJson = wasm().umbra_wasm_community_space_create(json);
  return await parseWasm<CommunitySpace>(resultJson);
}

/**
 * Get all spaces in a community.
 */
export async function getSpaces(communityId: string): Promise<CommunitySpace[]> {
  const resultJson = wasm().umbra_wasm_community_space_list(communityId);
  return await parseWasm<CommunitySpace[]>(resultJson);
}

/**
 * Update a space's name.
 */
export async function updateSpace(spaceId: string, name: string, actorDid: string): Promise<void> {
  const json = JSON.stringify({ space_id: spaceId, name, actor_did: actorDid });
  wasm().umbra_wasm_community_space_update(json);
}

/**
 * Delete a space.
 */
export async function deleteSpace(spaceId: string, actorDid: string): Promise<void> {
  const json = JSON.stringify({ space_id: spaceId, actor_did: actorDid });
  wasm().umbra_wasm_community_space_delete(json);
}

/**
 * Reorder spaces within a community.
 */
export async function reorderSpaces(communityId: string, spaceIds: string[]): Promise<void> {
  const json = JSON.stringify({
    community_id: communityId,
    space_ids: spaceIds,
  });
  wasm().umbra_wasm_community_space_reorder(json);
}

// =============================================================================
// CATEGORIES
// =============================================================================

/**
 * Create a new category in a space.
 */
export async function createCategory(
  communityId: string,
  spaceId: string,
  name: string,
  actorDid: string,
  position?: number,
): Promise<CommunityCategory> {
  const json = JSON.stringify({
    community_id: communityId,
    space_id: spaceId,
    name,
    position: position ?? 0,
    actor_did: actorDid,
  });
  const resultJson = wasm().umbra_wasm_community_category_create(json);
  return await parseWasm<CommunityCategory>(resultJson);
}

/**
 * Get all categories in a space.
 */
export async function getCategories(spaceId: string): Promise<CommunityCategory[]> {
  const resultJson = wasm().umbra_wasm_community_category_list(spaceId);
  return await parseWasm<CommunityCategory[]>(resultJson);
}

/**
 * Get all categories in a community (across all spaces).
 */
export async function getAllCategories(communityId: string): Promise<CommunityCategory[]> {
  const resultJson = wasm().umbra_wasm_community_category_list_all(communityId);
  return await parseWasm<CommunityCategory[]>(resultJson);
}

/**
 * Update a category's name.
 */
export async function updateCategory(
  categoryId: string,
  name: string,
  actorDid: string,
): Promise<void> {
  const json = JSON.stringify({
    category_id: categoryId,
    name,
    actor_did: actorDid,
  });
  wasm().umbra_wasm_community_category_update(json);
}

/**
 * Reorder categories in a space.
 */
export async function reorderCategories(
  spaceId: string,
  categoryIds: string[],
): Promise<void> {
  const json = JSON.stringify({
    space_id: spaceId,
    category_ids: categoryIds,
  });
  wasm().umbra_wasm_community_category_reorder(json);
}

/**
 * Delete a category. Channels in this category become uncategorized.
 */
export async function deleteCategory(
  categoryId: string,
  actorDid: string,
): Promise<void> {
  const json = JSON.stringify({
    category_id: categoryId,
    actor_did: actorDid,
  });
  wasm().umbra_wasm_community_category_delete(json);
}

/**
 * Move a channel to a different category (or uncategorize it).
 */
export async function moveChannelToCategory(
  channelId: string,
  categoryId: string | null,
  actorDid: string,
): Promise<void> {
  const json = JSON.stringify({
    channel_id: channelId,
    category_id: categoryId,
    actor_did: actorDid,
  });
  wasm().umbra_wasm_community_channel_move_category(json);
}

// =============================================================================
// CHANNELS
// =============================================================================

/**
 * Create a new channel in a space.
 */
export async function createChannel(
  communityId: string,
  spaceId: string,
  name: string,
  channelType: string,
  actorDid: string,
  topic?: string,
  position?: number,
  categoryId?: string,
): Promise<CommunityChannel> {
  const json = JSON.stringify({
    community_id: communityId,
    space_id: spaceId,
    name,
    channel_type: channelType,
    topic: topic ?? null,
    position: position ?? 0,
    actor_did: actorDid,
    category_id: categoryId ?? null,
  });
  const resultJson = wasm().umbra_wasm_community_channel_create(json);
  return await parseWasm<CommunityChannel>(resultJson);
}

/**
 * Get all channels in a space.
 */
export async function getChannels(spaceId: string): Promise<CommunityChannel[]> {
  const resultJson = wasm().umbra_wasm_community_channel_list(spaceId);
  return await parseWasm<CommunityChannel[]>(resultJson);
}

/**
 * Get all channels in a community (across all spaces).
 */
export async function getAllChannels(communityId: string): Promise<CommunityChannel[]> {
  const resultJson = wasm().umbra_wasm_community_channel_list_all(communityId);
  return await parseWasm<CommunityChannel[]>(resultJson);
}

/**
 * Get a single channel by ID.
 */
export async function getChannel(channelId: string): Promise<CommunityChannel> {
  const resultJson = wasm().umbra_wasm_community_channel_get(channelId);
  return await parseWasm<CommunityChannel>(resultJson);
}

/**
 * Update a channel's name and/or topic.
 */
export async function updateChannel(
  channelId: string,
  actorDid: string,
  name?: string,
  topic?: string,
): Promise<void> {
  const json = JSON.stringify({
    channel_id: channelId,
    name: name ?? null,
    topic: topic ?? null,
    actor_did: actorDid,
  });
  wasm().umbra_wasm_community_channel_update(json);
}

/**
 * Delete a channel.
 */
export async function deleteChannel(channelId: string, actorDid: string): Promise<void> {
  const json = JSON.stringify({ channel_id: channelId, actor_did: actorDid });
  wasm().umbra_wasm_community_channel_delete(json);
}

/**
 * Reorder channels within a space.
 */
export async function reorderChannels(spaceId: string, channelIds: string[]): Promise<void> {
  const json = JSON.stringify({
    space_id: spaceId,
    channel_ids: channelIds,
  });
  wasm().umbra_wasm_community_channel_reorder(json);
}

/**
 * Set slow mode for a channel (seconds between messages per user, 0 = off).
 */
export async function setSlowMode(channelId: string, seconds: number, actorDid: string): Promise<void> {
  const json = JSON.stringify({
    channel_id: channelId,
    seconds,
    actor_did: actorDid,
  });
  wasm().umbra_wasm_community_channel_set_slow_mode(json);
}

/**
 * Toggle E2EE for a channel.
 */
export async function setChannelE2ee(channelId: string, enabled: boolean, actorDid: string): Promise<void> {
  const json = JSON.stringify({
    channel_id: channelId,
    enabled,
    actor_did: actorDid,
  });
  wasm().umbra_wasm_community_channel_set_e2ee(json);
}

// =============================================================================
// MEMBERS
// =============================================================================

/**
 * Join a community.
 */
export async function joinCommunity(communityId: string, memberDid: string, nickname?: string): Promise<void> {
  const json = JSON.stringify({ community_id: communityId, member_did: memberDid, nickname: nickname ?? null });
  wasm().umbra_wasm_community_join(json);
}

/**
 * Leave a community.
 */
export async function leaveCommunity(communityId: string, memberDid: string): Promise<void> {
  const json = JSON.stringify({ community_id: communityId, member_did: memberDid });
  wasm().umbra_wasm_community_leave(json);
}

/**
 * Get all members of a community.
 */
export async function getMembers(communityId: string): Promise<CommunityMember[]> {
  const resultJson = wasm().umbra_wasm_community_member_list(communityId);
  return await parseWasm<CommunityMember[]>(resultJson);
}

/**
 * Get a single member.
 */
export async function getMember(communityId: string, memberDid: string): Promise<CommunityMember> {
  const resultJson = wasm().umbra_wasm_community_member_get(communityId, memberDid);
  return await parseWasm<CommunityMember>(resultJson);
}

/**
 * Kick a member from a community.
 */
export async function kickMember(
  communityId: string,
  targetDid: string,
  actorDid: string,
): Promise<void> {
  const json = JSON.stringify({
    community_id: communityId,
    target_did: targetDid,
    actor_did: actorDid,
  });
  wasm().umbra_wasm_community_kick(json);
}

/**
 * Ban a member from a community.
 */
export async function banMember(
  communityId: string,
  targetDid: string,
  actorDid: string,
  reason?: string,
): Promise<void> {
  const json = JSON.stringify({
    community_id: communityId,
    target_did: targetDid,
    actor_did: actorDid,
    reason: reason ?? null,
  });
  wasm().umbra_wasm_community_ban(json);
}

/**
 * Unban a member.
 */
export async function unbanMember(
  communityId: string,
  targetDid: string,
  actorDid: string,
): Promise<void> {
  const json = JSON.stringify({
    community_id: communityId,
    target_did: targetDid,
    actor_did: actorDid,
  });
  wasm().umbra_wasm_community_unban(json);
}

// =============================================================================
// ROLES
// =============================================================================

/**
 * Get all roles in a community.
 */
export async function getRoles(communityId: string): Promise<CommunityRole[]> {
  const resultJson = wasm().umbra_wasm_community_role_list(communityId);
  return await parseWasm<CommunityRole[]>(resultJson);
}

/**
 * Get roles assigned to a specific member.
 */
export async function getMemberRoles(
  communityId: string,
  memberDid: string,
): Promise<CommunityRole[]> {
  const resultJson = wasm().umbra_wasm_community_member_roles(communityId, memberDid);
  return await parseWasm<CommunityRole[]>(resultJson);
}

/**
 * Assign a role to a member.
 */
export async function assignRole(
  communityId: string,
  memberDid: string,
  roleId: string,
  actorDid: string,
): Promise<void> {
  const json = JSON.stringify({
    community_id: communityId,
    member_did: memberDid,
    role_id: roleId,
    actor_did: actorDid,
  });
  wasm().umbra_wasm_community_role_assign(json);
}

/**
 * Unassign a role from a member.
 */
export async function unassignRole(
  communityId: string,
  memberDid: string,
  roleId: string,
  actorDid: string,
): Promise<void> {
  const json = JSON.stringify({
    community_id: communityId,
    member_did: memberDid,
    role_id: roleId,
    actor_did: actorDid,
  });
  wasm().umbra_wasm_community_role_unassign(json);
}

/**
 * Create a custom role in a community.
 */
export async function createCustomRole(
  communityId: string,
  name: string,
  actorDid: string,
  color?: string,
  position?: number,
  hoisted?: boolean,
  mentionable?: boolean,
  permissionsBitfield?: string,
): Promise<CommunityRole> {
  const json = JSON.stringify({
    community_id: communityId,
    name,
    color: color ?? null,
    position: position ?? 10,
    hoisted: hoisted ?? false,
    mentionable: mentionable ?? false,
    permissions_bitfield: permissionsBitfield ?? '0',
    actor_did: actorDid,
  });
  const resultJson = wasm().umbra_wasm_community_custom_role_create(json);
  return await parseWasm<CommunityRole>(resultJson);
}

/**
 * Update a role's properties (name, color, hoisted, mentionable, position).
 */
export async function updateRole(
  roleId: string,
  actorDid: string,
  updates: {
    name?: string;
    color?: string;
    hoisted?: boolean;
    mentionable?: boolean;
    position?: number;
  },
): Promise<void> {
  const json = JSON.stringify({
    role_id: roleId,
    name: updates.name ?? null,
    color: updates.color ?? null,
    hoisted: updates.hoisted ?? null,
    mentionable: updates.mentionable ?? null,
    position: updates.position ?? null,
    actor_did: actorDid,
  });
  wasm().umbra_wasm_community_role_update(json);
}

/**
 * Update a role's permissions bitfield.
 */
export async function updateRolePermissions(
  roleId: string,
  permissionsBitfield: string,
  actorDid: string,
): Promise<void> {
  const json = JSON.stringify({
    role_id: roleId,
    permissions_bitfield: permissionsBitfield,
    actor_did: actorDid,
  });
  wasm().umbra_wasm_community_role_update_permissions(json);
}

/**
 * Delete a custom role.
 */
export async function deleteRole(
  roleId: string,
  actorDid: string,
): Promise<void> {
  const json = JSON.stringify({
    role_id: roleId,
    actor_did: actorDid,
  });
  wasm().umbra_wasm_community_role_delete(json);
}

// =============================================================================
// INVITES
// =============================================================================

/**
 * Create an invite for a community.
 */
export async function createInvite(
  communityId: string,
  creatorDid: string,
  maxUses?: number,
  expiresAt?: number,
): Promise<CommunityInvite> {
  const json = JSON.stringify({
    community_id: communityId,
    creator_did: creatorDid,
    max_uses: maxUses || null,
    expires_at: expiresAt ?? null,
  });
  const resultJson = wasm().umbra_wasm_community_invite_create(json);
  return await parseWasm<CommunityInvite>(resultJson);
}

/**
 * Use an invite code to join a community.
 */
export async function useInvite(code: string, memberDid: string, nickname?: string): Promise<string> {
  const json = JSON.stringify({ code, member_did: memberDid, nickname: nickname ?? null });
  const resultJson = wasm().umbra_wasm_community_invite_use(json);
  const result = await parseWasm<string | { communityId: string }>(resultJson);
  // WASM returns { community_id: "..." } which parseWasm converts to { communityId: "..." }
  return typeof result === 'string' ? result : result.communityId;
}

/**
 * Get all invites for a community.
 */
export async function getInvites(communityId: string): Promise<CommunityInvite[]> {
  const resultJson = wasm().umbra_wasm_community_invite_list(communityId);
  return await parseWasm<CommunityInvite[]>(resultJson);
}

/**
 * Delete an invite.
 */
export async function deleteInvite(inviteId: string, actorDid: string): Promise<void> {
  const json = JSON.stringify({ invite_id: inviteId, actor_did: actorDid });
  wasm().umbra_wasm_community_invite_delete(json);
}

/**
 * Import community and invite data from a relay-resolved invite payload.
 *
 * When a user tries to join via an invite code that doesn't exist locally,
 * the relay returns the community metadata and invite record. This function
 * creates the community and invite in the local database so that `useInvite`
 * can subsequently succeed.
 *
 * Note: `createCommunity` generates a new local community ID (UUIDs are local).
 * The invite record must reference this new local ID, not the relay's remote
 * community ID, so that `useInvite → join_community` succeeds.
 */
export async function importCommunityFromRelay(
  remoteCommunityId: string,
  communityName: string,
  description: string | null,
  ownerDid: string,
  inviteCode: string,
  maxUses?: number | null,
  expiresAt?: number | null,
  ownerNickname?: string,
): Promise<void> {
  // Check if we already imported this community (dedup on retried invites)
  let localCommunityId: string | undefined;
  try {
    const existingId = await findCommunityByOrigin(remoteCommunityId);
    if (existingId) {
      localCommunityId = existingId;
    }
  } catch { /* ignore — fall through to creation */ }

  // Create the community locally (this also creates default spaces/channels)
  if (!localCommunityId) {
    try {
      const result = await createCommunity(communityName, ownerDid, description ?? undefined, ownerNickname, remoteCommunityId);
      localCommunityId = result.communityId;
    } catch (err: any) {
      // If community already exists (e.g. re-resolving same invite), try to find it
      const msg = err?.message || String(err);
      if (msg.includes('already') || msg.includes('exists') || msg.includes('UNIQUE')) {
        // Community already exists locally — try to find it by name + owner
        try {
          const communities = await getCommunities(ownerDid);
          const match = communities.find((c) => c.name === communityName);
          if (match) localCommunityId = match.id;
        } catch { /* ignore */ }
      } else {
        throw err;
      }
    }
  }

  if (!localCommunityId) {
    throw new Error('Failed to create or find local community record');
  }

  // Create the invite record locally with the ORIGINAL code from the relay.
  // We use set_vanity_invite which lets us specify the exact code, so that
  // the subsequent useInvite(code) call can find it by the same code.
  try {
    const json = JSON.stringify({
      community_id: localCommunityId,
      vanity_code: inviteCode,
      creator_did: ownerDid,
    });
    wasm().umbra_wasm_community_invite_set_vanity(json);
  } catch (err: any) {
    // If invite already exists, that's fine
    const msg = err?.message || String(err);
    if (!msg.includes('already') && !msg.includes('exists') && !msg.includes('UNIQUE')) {
      throw err;
    }
  }
}

// =============================================================================
// INVITE RELAY (PUBLISH / RESOLVE)
// =============================================================================

/**
 * Metadata returned when resolving an invite via the relay HTTP API.
 */
export interface RelayInviteResolution {
  code: string;
  community_id: string;
  community_name: string;
  community_description: string | null;
  community_icon: string | null;
  member_count: number;
  max_uses: number | null;
  expires_at: number | null;
  invite_payload: string;
}

/**
 * Publish an invite to the relay server so it can be resolved by others.
 *
 * This is called after creating an invite locally. The relay stores the
 * invite metadata and propagates it across the federation mesh so any
 * client can resolve the code, even if the community owner is offline.
 *
 * @param relayWs - The active relay WebSocket connection
 * @param invite - The local invite record just created
 * @param communityName - Community display name
 * @param communityDescription - Optional community description
 * @param communityIcon - Optional community icon URL
 * @param memberCount - Current member count
 * @param invitePayload - The full invite bootstrap payload (community structure JSON)
 */
export function publishInviteToRelay(
  relayWs: WebSocket | null,
  invite: CommunityInvite,
  communityName: string,
  communityDescription?: string | null,
  communityIcon?: string | null,
  memberCount?: number,
  invitePayload?: string,
): void {
  if (!relayWs || relayWs.readyState !== WebSocket.OPEN) {
    console.warn(
      '[publishInviteToRelay] Relay WS not connected — invite not published:',
      invite.code,
      relayWs ? `readyState=${relayWs.readyState}` : 'ws=null',
    );
    return;
  }

  const msg = {
    type: 'publish_invite',
    code: invite.code,
    community_id: invite.communityId,
    community_name: communityName,
    community_description: communityDescription ?? null,
    community_icon: communityIcon ?? null,
    member_count: memberCount ?? 1,
    max_uses: invite.maxUses || null,
    expires_at: invite.expiresAt ?? null,
    invite_payload: invitePayload ?? '{}',
  };

  console.log('[publishInviteToRelay] Publishing invite to relay:', invite.code);
  relayWs.send(JSON.stringify(msg));
}

/**
 * Revoke a published invite on the relay.
 */
export function revokeInviteOnRelay(
  relayWs: WebSocket | null,
  code: string,
): void {
  if (!relayWs || relayWs.readyState !== WebSocket.OPEN) return;
  relayWs.send(JSON.stringify({ type: 'revoke_invite', code }));
}

/**
 * Resolve an invite code via the relay HTTP API.
 *
 * This is the fallback for when a user tries to join with a code that
 * doesn't exist in their local database. The relay maintains a registry
 * of published invites across the federation mesh.
 *
 * @param relayUrls - Array of relay WS URLs to try (e.g. DEFAULT_RELAY_SERVERS)
 * @param code - The invite code to resolve
 * @returns The invite metadata or null if not found
 */
export async function resolveInviteFromRelay(
  relayUrls: readonly string[],
  code: string,
): Promise<RelayInviteResolution | null> {
  for (const wsUrl of relayUrls) {
    try {
      const httpUrl = wsUrl
        .replace('wss://', 'https://')
        .replace('ws://', 'http://')
        .replace(/\/ws\/?$/, `/api/invite/${encodeURIComponent(code)}`);

      const res = await fetch(httpUrl, {
        signal: AbortSignal.timeout(10000),
        headers: { 'Accept': 'application/json' },
      });

      if (res.ok) {
        const data: RelayInviteResolution = await res.json();
        if (data.code && data.community_id) {
          return data;
        }
      }

      // 404 = not found on this relay, try next
      if (res.status === 404) continue;
    } catch {
      // Network error — try next relay
      continue;
    }
  }

  return null;
}

// =============================================================================
// MESSAGES
// =============================================================================

/**
 * Send a message to a community channel.
 */
export async function sendMessage(
  channelId: string,
  senderDid: string,
  content: string,
  replyToId?: string,
  threadId?: string,
  metadata?: MessageMetadata,
): Promise<CommunityMessage> {
  const json = JSON.stringify({
    channel_id: channelId,
    sender_did: senderDid,
    content,
    reply_to_id: replyToId ?? null,
    thread_id: threadId ?? null,
    content_warning: null,
    metadata_json: metadata ? JSON.stringify(metadata) : null,
  });
  const resultJson = wasm().umbra_wasm_community_message_send(json);
  const msg = await parseWasm<CommunityMessage>(resultJson);
  return hydrateMessageMetadata(msg);
}

/**
 * Store a message received from another member via relay / bridge.
 * Uses INSERT OR IGNORE so duplicate IDs are silently skipped.
 */
export async function storeReceivedMessage(
  id: string,
  channelId: string,
  senderDid: string,
  content: string,
  createdAt: number,
  metadata?: MessageMetadata,
): Promise<void> {
  const json = JSON.stringify({
    id,
    channel_id: channelId,
    sender_did: senderDid,
    content,
    created_at: createdAt,
    metadata_json: metadata ? JSON.stringify(metadata) : null,
  });
  wasm().umbra_wasm_community_message_store_received(json);
}

/**
 * Get messages in a channel (paginated).
 */
export async function getMessages(
  channelId: string,
  limit?: number,
  beforeTimestamp?: number,
): Promise<CommunityMessage[]> {
  const json = JSON.stringify({
    channel_id: channelId,
    limit: limit ?? 50,
    before_timestamp: beforeTimestamp ?? null,
  });
  const resultJson = wasm().umbra_wasm_community_message_list(json);
  const msgs = await parseWasm<CommunityMessage[]>(resultJson);
  return msgs.map(hydrateMessageMetadata);
}

/**
 * Get a single message by ID.
 */
export async function getMessage(messageId: string): Promise<CommunityMessage> {
  const resultJson = wasm().umbra_wasm_community_message_get(messageId);
  const msg = await parseWasm<CommunityMessage>(resultJson);
  return hydrateMessageMetadata(msg);
}

/**
 * Edit a message.
 */
export async function editMessage(
  messageId: string,
  newContent: string,
  editorDid: string,
): Promise<void> {
  const json = JSON.stringify({
    message_id: messageId,
    new_content: newContent,
    editor_did: editorDid,
  });
  wasm().umbra_wasm_community_message_edit(json);
}

/**
 * Delete a message.
 */
export async function deleteMessage(messageId: string): Promise<void> {
  wasm().umbra_wasm_community_message_delete(messageId);
}

// =============================================================================
// REACTIONS
// =============================================================================

/**
 * Add a reaction to a message.
 */
export async function addReaction(
  messageId: string,
  memberDid: string,
  emoji: string,
): Promise<void> {
  const json = JSON.stringify({
    message_id: messageId,
    member_did: memberDid,
    emoji,
  });
  wasm().umbra_wasm_community_reaction_add(json);
}

/**
 * Remove a reaction from a message.
 */
export async function removeReaction(
  messageId: string,
  memberDid: string,
  emoji: string,
): Promise<void> {
  const json = JSON.stringify({
    message_id: messageId,
    member_did: memberDid,
    emoji,
  });
  wasm().umbra_wasm_community_reaction_remove(json);
}

// =============================================================================
// PINS
// =============================================================================

/**
 * Pin a message.
 */
export async function pinMessage(
  messageId: string,
  channelId: string,
  actorDid: string,
): Promise<void> {
  const json = JSON.stringify({
    message_id: messageId,
    channel_id: channelId,
    pinned_by: actorDid,
  });
  wasm().umbra_wasm_community_pin_message(json);
}

/**
 * Unpin a message.
 */
export async function unpinMessage(
  messageId: string,
  channelId: string,
): Promise<void> {
  const json = JSON.stringify({
    message_id: messageId,
    channel_id: channelId,
  });
  wasm().umbra_wasm_community_unpin_message(json);
}

/**
 * Get all pinned messages in a channel.
 */
export async function getPinnedMessages(channelId: string): Promise<CommunityMessage[]> {
  const resultJson = wasm().umbra_wasm_community_pin_list(channelId);
  const msgs = await parseWasm<CommunityMessage[]>(resultJson);
  return msgs.map(hydrateMessageMetadata);
}

// =============================================================================
// THREADS
// =============================================================================

/**
 * Create a thread on a message.
 */
export async function createThread(
  channelId: string,
  parentMessageId: string,
  title: string,
  creatorDid: string,
): Promise<string> {
  const json = JSON.stringify({
    channel_id: channelId,
    parent_message_id: parentMessageId,
    title,
    creator_did: creatorDid,
  });
  const resultJson = wasm().umbra_wasm_community_thread_create(json);
  return await parseWasm<string>(resultJson);
}

/**
 * Get thread messages.
 */
export async function getThreadMessages(
  threadId: string,
  limit?: number,
  beforeTimestamp?: number,
): Promise<CommunityMessage[]> {
  const json = JSON.stringify({
    thread_id: threadId,
    limit: limit ?? 50,
    before_timestamp: beforeTimestamp ?? null,
  });
  const resultJson = wasm().umbra_wasm_community_thread_messages(json);
  const msgs = await parseWasm<CommunityMessage[]>(resultJson);
  return msgs.map(hydrateMessageMetadata);
}

// =============================================================================
// READ RECEIPTS
// =============================================================================

/**
 * Mark a channel as read up to a timestamp.
 */
export async function markRead(
  channelId: string,
  memberDid: string,
  timestamp?: number,
): Promise<void> {
  const json = JSON.stringify({
    channel_id: channelId,
    member_did: memberDid,
    last_read_at: timestamp ?? Date.now(),
  });
  wasm().umbra_wasm_community_mark_read(json);
}

// =============================================================================
// FILES
// =============================================================================

/**
 * Upload a file record to a community file channel.
 *
 * This stores the file metadata (including chunk references) in the database.
 * Actual file data transfer happens via P2P at a higher level.
 */
export async function uploadFile(
  channelId: string,
  folderId: string | null,
  filename: string,
  description: string | null,
  fileSize: number,
  mimeType: string | null,
  storageChunksJson: string,
  uploadedBy: string,
): Promise<CommunityFileRecord> {
  const json = JSON.stringify({
    channel_id: channelId,
    folder_id: folderId ?? null,
    filename,
    description: description ?? null,
    file_size: fileSize,
    mime_type: mimeType ?? null,
    storage_chunks_json: storageChunksJson,
    uploaded_by: uploadedBy,
  });
  const resultJson = wasm().umbra_wasm_community_upload_file(json);
  return await parseWasm<CommunityFileRecord>(resultJson);
}

/**
 * List files in a channel, optionally filtered by folder.
 */
export async function getFiles(
  channelId: string,
  folderId: string | null,
  limit: number,
  offset: number,
): Promise<CommunityFileRecord[]> {
  const json = JSON.stringify({
    channel_id: channelId,
    folder_id: folderId ?? null,
    limit,
    offset,
  });
  const resultJson = wasm().umbra_wasm_community_get_files(json);
  return await parseWasm<CommunityFileRecord[]>(resultJson);
}

/**
 * Get a single file by ID.
 */
export async function getFile(id: string): Promise<CommunityFileRecord> {
  const json = JSON.stringify({ id });
  const resultJson = wasm().umbra_wasm_community_get_file(json);
  return await parseWasm<CommunityFileRecord>(resultJson);
}

/**
 * Delete a file from a community file channel.
 */
export async function deleteFile(id: string, actorDid: string): Promise<void> {
  const json = JSON.stringify({ id, actor_did: actorDid });
  wasm().umbra_wasm_community_delete_file(json);
}

/**
 * Record a file download (increments download count).
 */
export async function recordFileDownload(id: string): Promise<void> {
  const json = JSON.stringify({ id });
  wasm().umbra_wasm_community_record_file_download(json);
}

// =============================================================================
// FOLDERS
// =============================================================================

/**
 * Create a folder inside a community file channel.
 */
export async function createFolder(
  channelId: string,
  parentFolderId: string | null,
  name: string,
  createdBy: string,
): Promise<CommunityFileFolderRecord> {
  const json = JSON.stringify({
    channel_id: channelId,
    parent_folder_id: parentFolderId ?? null,
    name,
    created_by: createdBy,
  });
  const resultJson = wasm().umbra_wasm_community_create_folder(json);
  return await parseWasm<CommunityFileFolderRecord>(resultJson);
}

/**
 * List folders in a channel, optionally filtered by parent folder.
 */
export async function getFolders(
  channelId: string,
  parentFolderId: string | null,
): Promise<CommunityFileFolderRecord[]> {
  const json = JSON.stringify({
    channel_id: channelId,
    parent_folder_id: parentFolderId ?? null,
  });
  const resultJson = wasm().umbra_wasm_community_get_folders(json);
  return await parseWasm<CommunityFileFolderRecord[]>(resultJson);
}

/**
 * Delete a folder (and optionally its contents).
 */
export async function deleteFolder(id: string): Promise<void> {
  const json = JSON.stringify({ id });
  wasm().umbra_wasm_community_delete_folder(json);
}

// =============================================================================
// SYNC / BROADCAST
// =============================================================================

/**
 * Broadcast a community event to all members via relay.
 *
 * Sends a `community_event` envelope to each community member (except the
 * sender) using the relay's existing `Send` message type. Receiving clients
 * call `dispatchCommunityEvent()` to trigger local UI refresh.
 */
export async function broadcastCommunityEvent(
  communityId: string,
  event: CommunityEvent,
  senderDid: string,
  relayWs: WebSocket | null,
): Promise<void> {
  console.log('[broadcastCommunityEvent]', event.type, 'ws=', relayWs ? `readyState=${relayWs.readyState}` : 'null');
  if (!relayWs || relayWs.readyState !== WebSocket.OPEN) {
    console.warn('[broadcastCommunityEvent] SKIPPED — relay WS not open');
    return;
  }

  // Resolve to origin community ID so all peers use the same canonical ID.
  // For the community owner, origin_community_id is NULL — use their local ID
  // (which IS the canonical origin for everyone else).
  // For joiners, origin_community_id points to the owner's original ID.
  let canonicalCommunityId = communityId;
  try {
    const community = await getCommunity(communityId);
    if (community.originCommunityId) {
      canonicalCommunityId = community.originCommunityId;
    }
  } catch { /* best-effort — fall back to local ID */ }

  // Build relay batch in Rust (resolves members, excludes sender, builds envelope)
  const json = JSON.stringify({
    community_id: communityId,
    event,
    sender_did: senderDid,
    canonical_community_id: canonicalCommunityId,
  });
  const resultJson = wasm().umbra_wasm_community_build_event_relay_batch(json);
  const relayMessages = await parseWasm<Array<{ toDid: string; payload: string }>>(resultJson);

  console.log('[broadcastCommunityEvent] Sending to', relayMessages.length, 'members, canonical=', canonicalCommunityId);
  for (const rm of relayMessages) {
    console.log('[broadcastCommunityEvent] → to_did:', rm.toDid.substring(0, 20) + '...');
    relayWs.send(JSON.stringify({ type: 'send', to_did: rm.toDid, payload: rm.payload }));
  }
}

// =============================================================================
// DISCORD IMPORT
// =============================================================================

/**
 * Create a community from an imported Discord structure.
 *
 * This creates:
 * 1. The community itself
 * 2. A default space
 * 3. All categories from the Discord server
 * 4. All channels (placed in their respective categories)
 * 5. All custom roles with translated permissions
 *
 * @param structure - The mapped Discord structure to import
 * @param ownerDid - The DID of the user creating the community
 * @param ownerNickname - Optional nickname for the owner
 * @param onProgress - Optional progress callback
 * @returns The import result with the created community ID
 */
export async function createCommunityFromDiscordImport(
  structure: MappedCommunityStructure,
  ownerDid: string,
  ownerNickname?: string,
  onProgress?: (progress: CommunityImportProgress) => void,
): Promise<CommunityImportResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let categoriesCreated = 0;
  let channelsCreated = 0;
  let rolesCreated = 0;
  let seatsCreated = 0;
  let pinsImported = 0;
  let auditLogImported = 0;
  let emojiImported = 0;
  let stickersImported = 0;
  let communityId: string | undefined;

  try {
    // Phase 1: Create the community
    onProgress?.({
      phase: 'creating_community',
      percent: 0,
      currentItem: structure.name,
    });

    const createResult = await createCommunity(
      structure.name,
      ownerDid,
      structure.description,
      ownerNickname,
    );
    communityId = createResult.communityId;

    // Download and store branding images locally (icon/banner)
    // Instead of using Discord CDN URLs directly, we download and re-upload to our relay
    if (structure.iconUrl || structure.bannerUrl) {
      try {
        onProgress?.({
          phase: 'downloading_branding',
          percent: 5,
          currentItem: 'Downloading branding images...',
        });

        const relayUrl = getRelayUrl();

        // Download and store each branding image in parallel
        const [localIconUrl, localBannerUrl] = await Promise.all([
          structure.iconUrl
            ? downloadAndStoreAsset(structure.iconUrl, createResult.communityId, 'icon', ownerDid, relayUrl)
            : Promise.resolve(null),
          structure.bannerUrl
            ? downloadAndStoreAsset(structure.bannerUrl, createResult.communityId, 'banner', ownerDid, relayUrl)
            : Promise.resolve(null),
        ]);

        // Update branding with local URLs
        await updateCommunityBranding(createResult.communityId, ownerDid, {
          iconUrl: localIconUrl ?? undefined,
          bannerUrl: localBannerUrl ?? undefined,
        });

        // Log if any downloads failed
        if (structure.iconUrl && !localIconUrl) {
          warnings.push('Failed to download community icon - using no icon');
        }
        if (structure.bannerUrl && !localBannerUrl) {
          warnings.push('Failed to download community banner - using no banner');
        }
      } catch (err) {
        const msg = `Failed to set community branding: ${err instanceof Error ? err.message : String(err)}`;
        warnings.push(msg);
      }
    }

    // Get the default space that was created with the community
    const spaces = await getSpaces(createResult.communityId);
    const defaultSpace = spaces[0]; // First space is created automatically

    if (!defaultSpace) {
      throw new Error('No default space found after community creation');
    }

    // Phase 2: Create categories
    onProgress?.({
      phase: 'creating_categories',
      percent: 10,
      totalItems: structure.categories.length,
      completedItems: 0,
    });

    // Map Discord category IDs to Umbra category IDs
    const categoryIdMap = new Map<string, string>();

    for (let i = 0; i < structure.categories.length; i++) {
      const cat = structure.categories[i];
      try {
        const category = await createCategory(
          createResult.communityId,
          defaultSpace.id,
          cat.name,
          ownerDid,
          cat.position,
        );
        categoryIdMap.set(cat.discordId, category.id);
        categoriesCreated++;

        onProgress?.({
          phase: 'creating_categories',
          percent: 10 + Math.round((i / structure.categories.length) * 30),
          totalItems: structure.categories.length,
          completedItems: i + 1,
          currentItem: cat.name,
        });
      } catch (err) {
        const msg = `Failed to create category "${cat.name}": ${err instanceof Error ? err.message : String(err)}`;
        warnings.push(msg);
      }
    }

    // Phase 3: Create channels (and build Discord→Umbra channel ID map for pins)
    const channelIdMap = new Map<string, string>(); // Discord channel ID → Umbra channel ID

    onProgress?.({
      phase: 'creating_channels',
      percent: 40,
      totalItems: structure.channels.length,
      completedItems: 0,
    });

    for (let i = 0; i < structure.channels.length; i++) {
      const ch = structure.channels[i];
      try {
        // Resolve the Umbra category ID (if any)
        const categoryId = ch.categoryDiscordId
          ? categoryIdMap.get(ch.categoryDiscordId)
          : undefined;

        const createdChannel = await createChannel(
          createResult.communityId,
          defaultSpace.id,
          ch.name,
          ch.type,
          ownerDid,
          ch.topic ?? undefined,
          ch.position,
          categoryId,
        );
        channelIdMap.set(ch.discordId, createdChannel.id);
        channelsCreated++;

        onProgress?.({
          phase: 'creating_channels',
          percent: 40 + Math.round((i / structure.channels.length) * 40),
          totalItems: structure.channels.length,
          completedItems: i + 1,
          currentItem: ch.name,
        });
      } catch (err) {
        const msg = `Failed to create channel "${ch.name}": ${err instanceof Error ? err.message : String(err)}`;
        warnings.push(msg);
      }
    }

    // Phase 4: Create roles (and build Discord→Umbra role ID map for seats)
    const roleIdMap = new Map<string, string>(); // Discord role ID → Umbra role ID

    onProgress?.({
      phase: 'creating_roles',
      percent: 70,
      totalItems: structure.roles.length,
      completedItems: 0,
    });

    for (let i = 0; i < structure.roles.length; i++) {
      const role = structure.roles[i];
      try {
        const createdRole = await createCustomRole(
          createResult.communityId,
          role.name,
          ownerDid,
          role.color,
          role.position,
          role.hoist,
          role.mentionable,
          role.permissions,
        );
        roleIdMap.set(role.discordId, createdRole.id);
        rolesCreated++;

        onProgress?.({
          phase: 'creating_roles',
          percent: 70 + Math.round((i / structure.roles.length) * 15),
          totalItems: structure.roles.length,
          completedItems: i + 1,
          currentItem: role.name,
        });
      } catch (err) {
        const msg = `Failed to create role "${role.name}": ${err instanceof Error ? err.message : String(err)}`;
        warnings.push(msg);
      }
    }

    // Phase 5: Create seats (ghost members) — chunked to avoid blocking the UI
    if (structure.seats && structure.seats.length > 0) {
      const SEAT_CHUNK_SIZE = 100;
      const totalSeats = structure.seats.length;

      onProgress?.({
        phase: 'creating_seats',
        percent: 85,
        totalItems: totalSeats,
        completedItems: 0,
        currentItem: `0 / ${totalSeats} members`,
      });

      try {
        // Map source role IDs to Umbra role IDs
        const seatData = structure.seats.map((seat) => ({
          platform: seat.platform,
          platform_user_id: seat.platformUserId,
          platform_username: seat.platformUsername,
          nickname: seat.nickname,
          avatar_url: seat.avatarUrl,
          role_ids: seat.sourceRoleIds
            .map((srcId) => roleIdMap.get(srcId))
            .filter((id): id is string => id !== undefined),
        }));

        // Process in chunks to keep the UI responsive
        for (let i = 0; i < seatData.length; i += SEAT_CHUNK_SIZE) {
          const chunk = seatData.slice(i, i + SEAT_CHUNK_SIZE);
          const created = await createSeatsBatch(createResult.communityId, chunk);
          seatsCreated += created;

          const pct = 85 + Math.round((seatsCreated / totalSeats) * 12); // 85% → 97%
          onProgress?.({
            phase: 'creating_seats',
            percent: Math.min(pct, 97),
            totalItems: totalSeats,
            completedItems: seatsCreated,
            currentItem: `${seatsCreated} / ${totalSeats} members`,
          });

          // Yield to the event loop so React can re-render progress
          if (i + SEAT_CHUNK_SIZE < seatData.length) {
            await new Promise((r) => setTimeout(r, 0));
          }
        }
      } catch (err) {
        const msg = `Failed to create seats: ${err instanceof Error ? err.message : String(err)}`;
        warnings.push(msg);
      }
    }

    // Phase 6: Import pinned messages
    if (structure.pinnedMessages && Object.keys(structure.pinnedMessages).length > 0) {
      const allPinEntries = Object.entries(structure.pinnedMessages);
      let totalPinCount = 0;
      for (const [, pins] of allPinEntries) {
        totalPinCount += pins.length;
      }

      onProgress?.({
        phase: 'importing_pins',
        percent: 93,
        totalItems: totalPinCount,
        completedItems: 0,
        currentItem: `0 / ${totalPinCount} pins`,
      });

      const PIN_CHUNK_SIZE = 20;
      let pinsDone = 0;

      for (const [sourceChannelId, pins] of allPinEntries) {
        const umbraChannelId = channelIdMap.get(sourceChannelId);
        if (!umbraChannelId) {
          warnings.push(`No Umbra channel found for source channel ${sourceChannelId} — skipping ${pins.length} pins`);
          continue;
        }

        for (let i = 0; i < pins.length; i++) {
          const pin = pins[i];
          try {
            // Create the message in the channel (owned by the community owner)
            const message = await sendMessage(
              umbraChannelId,
              ownerDid,
              pin.content || '[empty pinned message]',
            );

            // Pin the message
            await pinMessage(message.id, umbraChannelId, ownerDid);

            pinsImported++;
          } catch (err) {
            const msg = `Failed to import pin in channel ${sourceChannelId}: ${err instanceof Error ? err.message : String(err)}`;
            warnings.push(msg);
          }

          pinsDone++;

          // Report progress every chunk
          if (pinsDone % PIN_CHUNK_SIZE === 0 || pinsDone === totalPinCount) {
            const pct = 93 + Math.round((pinsDone / totalPinCount) * 3); // 93% → 96%
            onProgress?.({
              phase: 'importing_pins',
              percent: Math.min(pct, 96),
              totalItems: totalPinCount,
              completedItems: pinsDone,
              currentItem: `${pinsDone} / ${totalPinCount} pins`,
            });

            // Yield to the event loop
            await new Promise((r) => setTimeout(r, 0));
          }
        }
      }
    }

    // Phase 7: Import audit log
    if (structure.auditLog && structure.auditLog.length > 0) {
      const totalAuditEntries = structure.auditLog.length;

      onProgress?.({
        phase: 'importing_audit_log',
        percent: 96,
        totalItems: totalAuditEntries,
        completedItems: 0,
        currentItem: `0 / ${totalAuditEntries} entries`,
      });

      try {
        // Create audit log entries in batch
        // Each entry is associated with the actor's seat (if available) via actorPlatformUserId
        const created = await createAuditLogBatch(createResult.communityId, structure.auditLog);
        auditLogImported = created;

        onProgress?.({
          phase: 'importing_audit_log',
          percent: 99,
          totalItems: totalAuditEntries,
          completedItems: created,
          currentItem: `${created} / ${totalAuditEntries} entries`,
        });
      } catch (err) {
        // Audit log storage may not be implemented yet - log count anyway
        console.warn('[Import] Audit log storage not yet implemented:', err);
        auditLogImported = totalAuditEntries; // Count entries even if storage fails
        warnings.push(`Audit log entries fetched (${totalAuditEntries}) but storage not yet implemented`);

        onProgress?.({
          phase: 'importing_audit_log',
          percent: 99,
          totalItems: totalAuditEntries,
          completedItems: totalAuditEntries,
          currentItem: `${totalAuditEntries} entries (pending storage)`,
        });
      }
    }

    // Phase 8: Import custom emoji
    if (structure.emojis && structure.emojis.length > 0) {
      const totalEmoji = structure.emojis.length;
      const relayUrl = getRelayUrl();

      onProgress?.({
        phase: 'importing_emoji',
        percent: 93,
        totalItems: totalEmoji,
        completedItems: 0,
        currentItem: `0 / ${totalEmoji} emoji`,
      });

      for (let i = 0; i < totalEmoji; i++) {
        const mappedEmoji = structure.emojis[i];
        try {
          // Fetch the emoji image from Discord CDN
          const imgRes = await fetch(mappedEmoji.url);
          if (!imgRes.ok) {
            warnings.push(`Failed to fetch emoji "${mappedEmoji.name}" from Discord CDN (${imgRes.status})`);
            continue;
          }
          const blob = await imgRes.blob();

          // Re-host to our relay via asset upload endpoint
          const formData = new FormData();
          formData.append('file', blob, `${mappedEmoji.name}.${mappedEmoji.animated ? 'gif' : 'png'}`);
          formData.append('type', 'emoji');
          formData.append('did', ownerDid);

          const uploadRes = await fetch(
            `${relayUrl}/api/community/${encodeURIComponent(createResult.communityId)}/assets/upload`,
            { method: 'POST', body: formData },
          );

          if (!uploadRes.ok) {
            const body = await uploadRes.json().catch(() => ({}));
            warnings.push(`Failed to upload emoji "${mappedEmoji.name}" to relay: ${(body as any).error || uploadRes.status}`);
            continue;
          }

          const { data } = await uploadRes.json() as { data: { url: string; hash: string } };
          const imageUrl = `${relayUrl}${data.url}`;

          // Persist to local WASM DB
          await createEmoji(
            createResult.communityId,
            mappedEmoji.name,
            imageUrl,
            mappedEmoji.animated,
            ownerDid,
          );

          emojiImported++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          warnings.push(`Failed to import emoji "${mappedEmoji.name}": ${msg}`);
        }

        // Report progress every 5 emoji or on the last one
        if ((i + 1) % 5 === 0 || i === totalEmoji - 1) {
          onProgress?.({
            phase: 'importing_emoji',
            percent: 93 + Math.round(((i + 1) / totalEmoji) * 3),
            totalItems: totalEmoji,
            completedItems: emojiImported,
            currentItem: `${emojiImported} / ${totalEmoji} emoji`,
          });
        }
      }
    }

    // Phase 9: Import stickers
    if (structure.stickers && structure.stickers.length > 0) {
      const totalStickers = structure.stickers.length;
      const relayUrl = getRelayUrl();

      // Create a "Discord Import" sticker pack to group imported stickers
      let importPackId: string | undefined;
      try {
        const importPack = await createStickerPack(
          createResult.communityId,
          'Discord Import',
          ownerDid,
          `Stickers imported from Discord server "${structure.name}"`,
        );
        importPackId = importPack.id;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        warnings.push(`Failed to create sticker import pack: ${msg}`);
      }

      onProgress?.({
        phase: 'importing_stickers',
        percent: 97,
        totalItems: totalStickers,
        completedItems: 0,
        currentItem: `0 / ${totalStickers} stickers`,
      });

      for (let i = 0; i < totalStickers; i++) {
        const mappedSticker = structure.stickers[i];
        try {
          // Fetch the sticker from Discord CDN
          const imgRes = await fetch(mappedSticker.url);
          if (!imgRes.ok) {
            warnings.push(`Failed to fetch sticker "${mappedSticker.name}" from Discord CDN (${imgRes.status})`);
            continue;
          }
          const blob = await imgRes.blob();

          // Determine file extension
          let ext = 'png';
          if (mappedSticker.format === 'gif') ext = 'gif';
          else if (mappedSticker.format === 'apng') ext = 'png';
          else if (mappedSticker.format === 'lottie') ext = 'json';

          // Re-host to our relay via asset upload endpoint
          const formData = new FormData();
          formData.append('file', blob, `${mappedSticker.name}.${ext}`);
          formData.append('type', 'sticker');
          formData.append('did', ownerDid);

          const uploadRes = await fetch(
            `${relayUrl}/api/community/${encodeURIComponent(createResult.communityId)}/assets/upload`,
            { method: 'POST', body: formData },
          );

          if (!uploadRes.ok) {
            const body = await uploadRes.json().catch(() => ({}));
            warnings.push(`Failed to upload sticker "${mappedSticker.name}" to relay: ${(body as any).error || uploadRes.status}`);
            continue;
          }

          const { data } = await uploadRes.json() as { data: { url: string; hash: string } };
          const imageUrl = `${relayUrl}${data.url}`;

          // Persist to local WASM DB
          await createSticker(
            createResult.communityId,
            mappedSticker.name,
            imageUrl,
            mappedSticker.animated,
            mappedSticker.format,
            ownerDid,
            importPackId,
          );

          stickersImported++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          warnings.push(`Failed to import sticker "${mappedSticker.name}": ${msg}`);
        }

        // Report progress every 3 stickers or on the last one
        if ((i + 1) % 3 === 0 || i === totalStickers - 1) {
          onProgress?.({
            phase: 'importing_stickers',
            percent: 97 + Math.round(((i + 1) / totalStickers) * 2),
            totalItems: totalStickers,
            completedItems: stickersImported,
            currentItem: `${stickersImported} / ${totalStickers} stickers`,
          });
        }
      }
    }

    // Complete
    onProgress?.({
      phase: 'complete',
      percent: 100,
    });

    // Convert channelIdMap to a plain object for the result
    const channelIdMapObj: Record<string, string> = {};
    channelIdMap.forEach((umbraId, discordId) => {
      channelIdMapObj[discordId] = umbraId;
    });

    return {
      success: true,
      communityId,
      categoriesCreated,
      channelsCreated,
      rolesCreated,
      seatsCreated,
      pinsImported,
      auditLogImported,
      emojiImported,
      stickersImported,
      errors,
      warnings,
      channelIdMap: channelIdMapObj,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);

    return {
      success: false,
      communityId,
      categoriesCreated,
      channelsCreated,
      rolesCreated,
      seatsCreated,
      pinsImported,
      auditLogImported,
      emojiImported,
      stickersImported,
      errors,
      warnings,
    };
  }
}

// =============================================================================
// COMMUNITY SEATS (Ghost Member Placeholders)
// =============================================================================

/**
 * Get all seats for a community.
 */
export async function getSeats(communityId: string): Promise<CommunitySeat[]> {
  const resultJson = wasm().umbra_wasm_community_seat_list(communityId);
  return await parseWasm<CommunitySeat[]>(resultJson);
}

/**
 * Get unclaimed (ghost) seats for a community.
 */
export async function getUnclaimedSeats(communityId: string): Promise<CommunitySeat[]> {
  const resultJson = wasm().umbra_wasm_community_seat_list_unclaimed(communityId);
  return await parseWasm<CommunitySeat[]>(resultJson);
}

/**
 * Find a seat matching a platform account.
 */
export async function findMatchingSeat(
  communityId: string,
  platform: string,
  platformUserId: string
): Promise<CommunitySeat | null> {
  const resultJson = wasm().umbra_wasm_community_seat_find_match(
    JSON.stringify({ community_id: communityId, platform, platform_user_id: platformUserId })
  );
  const parsed = await parseWasm<CommunitySeat | null>(resultJson);
  return parsed;
}

/**
 * Claim a seat (auto-join + assign roles).
 */
export async function claimSeat(seatId: string, claimerDid: string): Promise<CommunitySeat> {
  const resultJson = wasm().umbra_wasm_community_seat_claim(
    JSON.stringify({ seat_id: seatId, claimer_did: claimerDid })
  );
  return await parseWasm<CommunitySeat>(resultJson);
}

/**
 * Delete a seat (admin action).
 */
export async function deleteSeat(seatId: string, actorDid: string): Promise<void> {
  wasm().umbra_wasm_community_seat_delete(
    JSON.stringify({ seat_id: seatId, actor_did: actorDid })
  );
}

/**
 * Create seats in batch (for import).
 */
export async function createSeatsBatch(
  communityId: string,
  seats: Array<{
    platform: string;
    platform_user_id: string;
    platform_username: string;
    nickname?: string;
    avatar_url?: string;
    role_ids: string[];
  }>
): Promise<number> {
  const resultJson = wasm().umbra_wasm_community_seat_create_batch(
    JSON.stringify({ community_id: communityId, seats })
  );
  const result = await parseWasm<{ created: number }>(resultJson);
  return result.created;
}

/**
 * Count seats for a community.
 */
export async function countSeats(communityId: string): Promise<{ total: number; unclaimed: number }> {
  const resultJson = wasm().umbra_wasm_community_seat_count(communityId);
  return await parseWasm<{ total: number; unclaimed: number }>(resultJson);
}

// =============================================================================
// COMMUNITY AUDIT LOG
// =============================================================================

/**
 * Audit log entry stored in the database.
 */
export interface CommunityAuditLogEntry {
  id: string;
  communityId: string;
  actionType: string;
  actorPlatformUserId: string;
  actorUsername: string;
  actorAvatarUrl?: string;
  targetType: string;
  targetId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
  createdAt: number;
}

/**
 * Create audit log entries in batch (for import).
 */
export async function createAuditLogBatch(
  communityId: string,
  entries: MappedAuditLogEntry[]
): Promise<number> {
  const resultJson = wasm().umbra_wasm_community_audit_log_create_batch(
    JSON.stringify({
      community_id: communityId,
      entries: entries.map((e) => ({
        action_type: e.actionType,
        actor_platform_user_id: e.actorPlatformUserId,
        actor_username: e.actorUsername,
        actor_avatar_url: e.actorAvatarUrl,
        target_type: e.targetType,
        target_id: e.targetId,
        reason: e.reason,
        metadata: e.metadata,
        timestamp: e.timestamp,
      })),
    })
  );
  const result = await parseWasm<{ created: number }>(resultJson);
  return result.created;
}

/**
 * Get audit log entries for a community.
 */
export async function getAuditLog(
  communityId: string,
  limit?: number,
  beforeTimestamp?: number
): Promise<CommunityAuditLogEntry[]> {
  const resultJson = wasm().umbra_wasm_community_audit_log_list(
    JSON.stringify({
      community_id: communityId,
      limit: limit ?? 100,
      before_timestamp: beforeTimestamp ?? null,
    })
  );
  return await parseWasm<CommunityAuditLogEntry[]>(resultJson);
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Emoji
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a custom emoji in a community.
 */
export async function createEmoji(
  communityId: string,
  name: string,
  imageUrl: string,
  animated: boolean,
  uploadedBy: string,
): Promise<CommunityEmoji> {
  const json = JSON.stringify({
    community_id: communityId,
    name,
    image_url: imageUrl,
    animated,
    uploaded_by: uploadedBy,
  });
  const resultJson = wasm().umbra_wasm_community_emoji_create(json);
  return await parseWasm<CommunityEmoji>(resultJson);
}

/**
 * List all custom emoji for a community.
 */
export async function listEmoji(communityId: string): Promise<CommunityEmoji[]> {
  const resultJson = wasm().umbra_wasm_community_emoji_list(communityId);
  return await parseWasm<CommunityEmoji[]>(resultJson);
}

/**
 * Delete a custom emoji.
 */
export async function deleteEmoji(emojiId: string, actorDid: string): Promise<void> {
  const json = JSON.stringify({
    emoji_id: emojiId,
    actor_did: actorDid,
  });
  wasm().umbra_wasm_community_emoji_delete(json);
}

/**
 * Rename a custom emoji.
 */
export async function renameEmoji(emojiId: string, newName: string): Promise<void> {
  const json = JSON.stringify({
    emoji_id: emojiId,
    new_name: newName,
  });
  wasm().umbra_wasm_community_emoji_rename(json);
}

/**
 * Store a received emoji from a relay broadcast (INSERT OR IGNORE).
 */
export async function storeReceivedEmoji(
  id: string,
  communityId: string,
  name: string,
  imageUrl: string,
  animated: boolean,
  uploadedBy: string,
  createdAt: number,
): Promise<void> {
  const json = JSON.stringify({
    id,
    community_id: communityId,
    name,
    image_url: imageUrl,
    animated,
    uploaded_by: uploadedBy,
    created_at: createdAt,
  });
  wasm().umbra_wasm_community_emoji_create(json);
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Stickers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a custom sticker in a community.
 */
export async function createSticker(
  communityId: string,
  name: string,
  imageUrl: string,
  animated: boolean,
  format: string,
  uploadedBy: string,
  packId?: string,
): Promise<CommunitySticker> {
  const json = JSON.stringify({
    community_id: communityId,
    name,
    image_url: imageUrl,
    animated,
    format,
    uploaded_by: uploadedBy,
    pack_id: packId ?? null,
  });
  const resultJson = wasm().umbra_wasm_community_sticker_create(json);
  return await parseWasm<CommunitySticker>(resultJson);
}

/**
 * List all custom stickers for a community.
 */
export async function listStickers(communityId: string): Promise<CommunitySticker[]> {
  const resultJson = wasm().umbra_wasm_community_sticker_list(communityId);
  return await parseWasm<CommunitySticker[]>(resultJson);
}

/**
 * Delete a custom sticker.
 */
export async function deleteSticker(stickerId: string): Promise<void> {
  wasm().umbra_wasm_community_sticker_delete(stickerId);
}

/**
 * Store a received sticker from a relay broadcast (INSERT OR IGNORE).
 */
export async function storeReceivedSticker(
  id: string,
  communityId: string,
  name: string,
  imageUrl: string,
  animated: boolean,
  format: string,
  uploadedBy: string,
  createdAt: number,
  packId?: string,
): Promise<void> {
  const json = JSON.stringify({
    id,
    community_id: communityId,
    name,
    image_url: imageUrl,
    animated,
    format,
    uploaded_by: uploadedBy,
    created_at: createdAt,
    pack_id: packId ?? null,
  });
  wasm().umbra_wasm_community_sticker_create(json);
}

// ─────────────────────────────────────────────────────────────────────────────
// Sticker Packs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a sticker pack in a community.
 */
export async function createStickerPack(
  communityId: string,
  name: string,
  createdBy: string,
  description?: string,
  coverStickerId?: string,
): Promise<StickerPack> {
  const json = JSON.stringify({
    community_id: communityId,
    name,
    description: description ?? null,
    cover_sticker_id: coverStickerId ?? null,
    created_by: createdBy,
  });
  const resultJson = wasm().umbra_wasm_community_sticker_pack_create(json);
  return await parseWasm<StickerPack>(resultJson);
}

/**
 * List all sticker packs for a community.
 */
export async function listStickerPacks(communityId: string): Promise<StickerPack[]> {
  const resultJson = wasm().umbra_wasm_community_sticker_pack_list(communityId);
  return await parseWasm<StickerPack[]>(resultJson);
}

/**
 * Delete a sticker pack.
 */
export async function deleteStickerPack(packId: string): Promise<void> {
  wasm().umbra_wasm_community_sticker_pack_delete(packId);
}

/**
 * Rename a sticker pack.
 */
export async function renameStickerPack(packId: string, newName: string): Promise<void> {
  const json = JSON.stringify({ pack_id: packId, new_name: newName });
  wasm().umbra_wasm_community_sticker_pack_rename(json);
}

/**
 * Store a received sticker pack from a relay broadcast (INSERT OR IGNORE).
 */
export async function storeReceivedStickerPack(
  id: string,
  communityId: string,
  name: string,
  createdBy: string,
  createdAt: number,
  description?: string,
  coverStickerId?: string,
): Promise<void> {
  const json = JSON.stringify({
    id,
    community_id: communityId,
    name,
    description: description ?? null,
    cover_sticker_id: coverStickerId ?? null,
    created_by: createdBy,
    created_at: createdAt,
  });
  wasm().umbra_wasm_community_sticker_pack_create(json);
}
