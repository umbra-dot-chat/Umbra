/**
 * Notifications module
 *
 * CRUD operations for persistent notification records.
 *
 * @packageDocumentation
 */

import { wasm, parseWasm } from './helpers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationType =
  | 'friend_request_received'
  | 'friend_request_accepted'
  | 'friend_request_rejected'
  | 'call_missed'
  | 'call_completed'
  | 'group_invite'
  | 'community_invite'
  | 'mention'
  | 'system';

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  relatedDid?: string;
  relatedId?: string;
  avatar?: string;
  read: boolean;
  dismissed: boolean;
  actionTaken?: string;
  createdAt: number;
  updatedAt: number;
}

export interface UnreadCounts {
  all: number;
  social: number;
  calls: number;
  mentions: number;
  system: number;
}

export type NotificationCategory = 'all' | 'social' | 'calls' | 'mentions' | 'system';

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * Create a new notification record.
 */
export async function createNotification(record: {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  relatedDid?: string;
  relatedId?: string;
  avatar?: string;
}): Promise<{ id: string; createdAt: number }> {
  const json = JSON.stringify({
    id: record.id,
    type: record.type,
    title: record.title,
    description: record.description ?? null,
    related_did: record.relatedDid ?? null,
    related_id: record.relatedId ?? null,
    avatar: record.avatar ?? null,
  });
  const result = wasm().umbra_wasm_notifications_create(json);
  return await parseWasm<{ id: string; createdAt: number }>(result);
}

/**
 * Get notifications with optional filters.
 */
export async function getNotifications(opts?: {
  type?: NotificationType;
  read?: boolean;
  limit?: number;
  offset?: number;
}): Promise<NotificationRecord[]> {
  const json = JSON.stringify({
    type: opts?.type ?? null,
    read: opts?.read ?? null,
    limit: opts?.limit ?? 100,
    offset: opts?.offset ?? 0,
  });
  const result = wasm().umbra_wasm_notifications_get(json);
  return await parseWasm<NotificationRecord[]>(result);
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(id: string): Promise<void> {
  const json = JSON.stringify({ id });
  const result = wasm().umbra_wasm_notifications_mark_read(json);
  await parseWasm(result);
}

/**
 * Mark all notifications as read, optionally filtered by type.
 */
export async function markAllNotificationsRead(type?: NotificationType): Promise<{ count: number }> {
  const json = JSON.stringify({ type: type ?? null });
  const result = wasm().umbra_wasm_notifications_mark_all_read(json);
  return await parseWasm<{ count: number }>(result);
}

/**
 * Dismiss (soft-delete) a notification.
 */
export async function dismissNotification(id: string): Promise<void> {
  const json = JSON.stringify({ id });
  const result = wasm().umbra_wasm_notifications_dismiss(json);
  await parseWasm(result);
}

/**
 * Get unread notification counts by category.
 */
export async function getUnreadCounts(): Promise<UnreadCounts> {
  const json = JSON.stringify({});
  const result = wasm().umbra_wasm_notifications_unread_counts(json);
  return await parseWasm<UnreadCounts>(result);
}
