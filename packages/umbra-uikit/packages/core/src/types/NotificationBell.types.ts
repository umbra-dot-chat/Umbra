/**
 * @module NotificationBell
 * @description Type definitions for the NotificationBell component.
 */

/**
 * Size presets for the NotificationBell.
 */
export const notificationBellSizes = ['sm', 'md', 'lg'] as const;
export type NotificationBellSize = (typeof notificationBellSizes)[number];

/**
 * Props for the NotificationBell component.
 */
export interface NotificationBellProps extends React.HTMLAttributes<HTMLButtonElement> {
  /** Number of unread notifications (shown as badge count). */
  count?: number;
  /** Maximum count before showing `{max}+`. */
  max?: number;
  /** Whether to show a dot instead of count. */
  dot?: boolean;
  /** Size preset. */
  size?: NotificationBellSize;
  /** Whether to animate (shake) when there are unread notifications. */
  animate?: boolean;
  /** Called when the bell is pressed. */
  onPress?: () => void;
  /** Whether the bell is in active/open state. */
  active?: boolean;
  /** Override style. */
  style?: object;
  /** CSS class name. */
  className?: string;
}
