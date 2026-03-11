/**
 * @module types/PinnedMessages
 * @description Type definitions for the PinnedMessages component.
 */

/**
 * Represents a pinned message.
 */
export interface PinnedMessage {
  /** Unique identifier for the message. */
  id: string;
  /** Display name of the sender. */
  sender: string;
  /** Avatar element for the sender. */
  avatar?: React.ReactNode;
  /** Message text content (may be truncated). */
  content: string;
  /** Timestamp string (e.g. "Jan 5", "2:30 PM"). */
  timestamp: string;
  /** Who pinned this message. */
  pinnedBy?: string;
}

/**
 * Props for the PinnedMessages component.
 *
 * @remarks
 * Renders a panel listing all pinned messages in a channel or conversation.
 * Each message card shows the sender, content preview, timestamp, and
 * an unpin action. Supports empty and loading states.
 */
export interface PinnedMessagesProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of pinned messages. */
  messages: PinnedMessage[];

  /** Called when the close button is clicked. */
  onClose?: () => void;

  /** Called when a pinned message is clicked (e.g. to jump to it). */
  onMessageClick?: (message: PinnedMessage) => void;

  /** Called when the unpin button is clicked. */
  onUnpin?: (message: PinnedMessage) => void;

  /** Title text for the panel header. @default 'Pinned Messages' */
  title?: string;

  /** Whether to show a loading state. @default false */
  loading?: boolean;

  /** Text shown when there are no pinned messages. @default 'No pinned messages' */
  emptyText?: string;

  /** Icon or element shown in the empty state. */
  emptyIcon?: React.ReactNode;
}
