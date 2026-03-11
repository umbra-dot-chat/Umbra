/**
 * @module NotificationDrawer
 * @description Type definitions for the NotificationDrawer component.
 */

/**
 * Notification filter categories.
 */
export const notificationCategories = ['all', 'social', 'calls', 'mentions', 'system'] as const;
export type NotificationCategory = (typeof notificationCategories)[number];

/**
 * Props for the NotificationDrawer component.
 */
export interface NotificationDrawerProps {
  /** Whether the drawer is visible. */
  open: boolean;
  /** Close handler. */
  onClose: () => void;
  /** Active filter category tab. */
  category: NotificationCategory;
  /** Called when a category tab is pressed. */
  onCategoryChange: (category: NotificationCategory) => void;
  /** Unread counts per category (for tab badges). */
  unreadCounts?: Partial<Record<NotificationCategory, number>>;
  /** Mark all notifications as read. */
  onMarkAllRead?: () => void;
  /** Clear all notifications. */
  onClearAll?: () => void;
  /** Notification content (NotificationGroups + NotificationItems). */
  children?: React.ReactNode;
  /** Empty state content when no notifications exist. */
  emptyState?: React.ReactNode;
  /** Style overrides. */
  style?: object;
}
