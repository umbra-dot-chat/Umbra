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
  RelayEnvelope,
} from './types';

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
): Promise<CommunityCreateResult> {
  const json = JSON.stringify({
    name,
    owner_did: ownerDid,
    description: description ?? null,
    owner_nickname: ownerNickname ?? null,
  });
  const resultJson = wasm().umbra_wasm_community_create(json);
  return await parseWasm<CommunityCreateResult>(resultJson);
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
    max_uses: maxUses ?? null,
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
  return await parseWasm<string>(resultJson);
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
): Promise<CommunityMessage> {
  const json = JSON.stringify({
    channel_id: channelId,
    sender_did: senderDid,
    content,
    reply_to_id: replyToId ?? null,
    thread_id: threadId ?? null,
    content_warning: null,
  });
  const resultJson = wasm().umbra_wasm_community_message_send(json);
  return await parseWasm<CommunityMessage>(resultJson);
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
  return await parseWasm<CommunityMessage[]>(resultJson);
}

/**
 * Get a single message by ID.
 */
export async function getMessage(messageId: string): Promise<CommunityMessage> {
  const resultJson = wasm().umbra_wasm_community_message_get(messageId);
  return await parseWasm<CommunityMessage>(resultJson);
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
    actor_did: actorDid,
  });
  wasm().umbra_wasm_community_pin_message(json);
}

/**
 * Unpin a message.
 */
export async function unpinMessage(
  messageId: string,
  channelId: string,
  actorDid: string,
): Promise<void> {
  const json = JSON.stringify({
    message_id: messageId,
    channel_id: channelId,
    actor_did: actorDid,
  });
  wasm().umbra_wasm_community_unpin_message(json);
}

/**
 * Get all pinned messages in a channel.
 */
export async function getPinnedMessages(channelId: string): Promise<CommunityMessage[]> {
  const resultJson = wasm().umbra_wasm_community_pin_list(channelId);
  return await parseWasm<CommunityMessage[]>(resultJson);
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
  return await parseWasm<CommunityMessage[]>(resultJson);
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
  if (!relayWs || relayWs.readyState !== WebSocket.OPEN) return;

  // Get all community members
  const members = await getMembers(communityId);

  const envelope: RelayEnvelope = {
    envelope: 'community_event',
    version: 1,
    payload: { communityId, event, senderDid, timestamp: Date.now() },
  };
  const payloadStr = JSON.stringify(envelope);

  // Fan-out to all members except sender
  for (const member of members) {
    if (member.memberDid === senderDid) continue;
    const relayMessage = JSON.stringify({
      type: 'send',
      to_did: member.memberDid,
      payload: payloadStr,
    });
    relayWs.send(relayMessage);
  }
}
