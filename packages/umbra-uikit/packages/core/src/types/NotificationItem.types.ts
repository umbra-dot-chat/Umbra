/**
 * @module NotificationItem
 * @description Type definitions for the NotificationItem component.
 */

/**
 * All supported notification types.
 */
export const notificationTypes = [
  'friend_request_received',
  'friend_request_accepted',
  'friend_request_rejected',
  'call_missed',
  'call_completed',
  'group_invite',
  'community_invite',
  'mention',
  'system',
] as const;
export type NotificationType = (typeof notificationTypes)[number];

/**
 * Action button displayed in a notification row.
 */
export interface NotificationAction {
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  onPress: () => void;
}

/**
 * Props for the NotificationItem component.
 */
export interface NotificationItemProps {
  /** Unique notification ID. */
  id: string;
  /** Notification type — determines default icon and accent color. */
  type: NotificationType;
  /** Primary text. */
  title: string;
  /** Secondary descriptive text. */
  description?: string;
  /** Formatted timestamp string. */
  timestamp: string;
  /** Whether this notification has been read. */
  read: boolean;
  /** Avatar image URL. */
  avatar?: string;
  /** Fallback initials when no avatar. */
  avatarFallback?: string;
  /** Custom icon component (overrides type-based default). */
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  /** Custom icon color (overrides type-based default). */
  iconColor?: string;
  /** Action buttons (e.g., Accept/Decline for friend requests). */
  actions?: NotificationAction[];
  /** Called when the notification row is pressed. */
  onPress?: () => void;
  /** Called when the dismiss button is pressed. */
  onDismiss?: () => void;
  /** Style overrides. */
  style?: object;
}
