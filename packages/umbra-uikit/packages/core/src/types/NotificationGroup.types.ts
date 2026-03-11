/**
 * @module NotificationGroup
 * @description Type definitions for the NotificationGroup component.
 */

/**
 * Props for the NotificationGroup component.
 */
export interface NotificationGroupProps {
  /** Group label text (e.g., "Today", "Yesterday", "This Week", "Older"). */
  label: string;
  /** Optional badge count shown next to the label. */
  count?: number;
  /** Notification items rendered within this group. */
  children: React.ReactNode;
  /** Style overrides. */
  style?: object;
}
