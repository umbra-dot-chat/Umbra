/**
 * Permission utility — BigInt-based permission checks for community roles.
 *
 * Works with the Umbra permission bitfield (u64 stored as decimal string).
 * Bit positions match `umbra-core/src/community/permissions.rs`.
 *
 * @packageDocumentation
 */

import type { CommunityRole } from '@umbra/service';

// ---------------------------------------------------------------------------
// Permission bit constants (must match Rust `Permission` enum bit indices)
// ---------------------------------------------------------------------------

/** View channels and read messages */
export const PERM_VIEW_CHANNELS = 0;
/** Manage community settings */
export const PERM_MANAGE_COMMUNITY = 1;
/** Create, edit, and delete channels */
export const PERM_MANAGE_CHANNELS = 2;
/** Create, edit, and assign roles */
export const PERM_MANAGE_ROLES = 3;
/** Create invite links */
export const PERM_CREATE_INVITES = 4;
/** Delete other members' invites */
export const PERM_MANAGE_INVITES = 5;
/** Kick members */
export const PERM_KICK_MEMBERS = 6;
/** Ban members */
export const PERM_BAN_MEMBERS = 7;
/** Timeout members */
export const PERM_TIMEOUT_MEMBERS = 8;
/** Change own nickname */
export const PERM_CHANGE_NICKNAME = 9;
/** Change other members' nicknames */
export const PERM_MANAGE_NICKNAMES = 10;
/** Send messages in text channels */
export const PERM_SEND_MESSAGES = 11;
/** Show URL previews */
export const PERM_EMBED_LINKS = 12;
/** Upload attachments in messages */
export const PERM_ATTACH_FILES = 13;
/** React to messages */
export const PERM_ADD_REACTIONS = 14;
/** Use emoji from other communities */
export const PERM_USE_EXTERNAL_EMOJI = 15;
/** Mention @everyone */
export const PERM_MENTION_EVERYONE = 16;
/** Delete or pin others' messages */
export const PERM_MANAGE_MESSAGES = 17;
/** Read past messages */
export const PERM_READ_HISTORY = 18;
/** Start new threads */
export const PERM_CREATE_THREADS = 19;
/** Post in threads */
export const PERM_SEND_THREAD_MESSAGES = 20;
/** Manage threads */
export const PERM_MANAGE_THREADS = 21;
/** Join voice channels */
export const PERM_VOICE_CONNECT = 22;
/** Speak in voice channels */
export const PERM_VOICE_SPEAK = 23;
/** Share screen / video */
export const PERM_VOICE_STREAM = 24;
/** Mute others in voice */
export const PERM_VOICE_MUTE = 25;
/** Deafen others in voice */
export const PERM_VOICE_DEAFEN = 26;
/** Move members between voice channels */
export const PERM_VOICE_MOVE = 27;
/** View audit logs */
export const PERM_VIEW_AUDIT_LOG = 28;
/** Create and delete webhooks */
export const PERM_MANAGE_WEBHOOKS = 29;
/** Upload and delete emoji */
export const PERM_MANAGE_EMOJI = 30;
/** Update banner, splash, accent */
export const PERM_MANAGE_BRANDING = 31;
/** Upload files to file channels */
export const PERM_UPLOAD_FILES = 32;
/** Delete and organize files in file channels */
export const PERM_MANAGE_FILES = 33;
/** Administrator — bypasses all permission checks */
export const PERM_ADMINISTRATOR = 63;

// ---------------------------------------------------------------------------
// Core permission check
// ---------------------------------------------------------------------------

/**
 * Check whether a permission bitfield has a specific bit set.
 *
 * @param bitfield - Decimal string of a u64 bitfield (from CommunityRole.permissionsBitfield)
 * @param bit - The bit index to check (0-63)
 * @returns true if the bit is set
 */
export function hasPermissionBit(bitfield: string, bit: number): boolean {
  const big = BigInt(bitfield);
  return (big & (1n << BigInt(bit))) !== 0n;
}

/**
 * Compute the effective permission bitfield by OR-ing all role bitfields.
 *
 * @param roles - The roles assigned to a member
 * @returns Combined BigInt bitfield
 */
export function computeEffectivePermissions(roles: CommunityRole[]): bigint {
  let combined = 0n;
  for (const role of roles) {
    combined |= BigInt(role.permissionsBitfield);
  }
  return combined;
}

/**
 * Check if a member has a specific permission, considering all their roles.
 *
 * Administrators automatically have all permissions.
 *
 * @param roles - The roles assigned to the member
 * @param bit - The permission bit to check
 * @param isOwner - Whether the member is the community owner (owners have all perms)
 * @returns true if the member has the permission
 */
export function hasPermission(
  roles: CommunityRole[],
  bit: number,
  isOwner = false,
): boolean {
  // Owners always have all permissions
  if (isOwner) return true;

  const effective = computeEffectivePermissions(roles);

  // Administrators bypass all permission checks
  if ((effective & (1n << BigInt(PERM_ADMINISTRATOR))) !== 0n) return true;

  return (effective & (1n << BigInt(bit))) !== 0n;
}

/**
 * Check if a member can upload files to a file channel.
 */
export function canUploadFiles(
  roles: CommunityRole[],
  isOwner = false,
): boolean {
  return hasPermission(roles, PERM_UPLOAD_FILES, isOwner);
}

/**
 * Check if a member can manage (delete/organize) files in a file channel.
 */
export function canManageFiles(
  roles: CommunityRole[],
  isOwner = false,
): boolean {
  return hasPermission(roles, PERM_MANAGE_FILES, isOwner);
}
