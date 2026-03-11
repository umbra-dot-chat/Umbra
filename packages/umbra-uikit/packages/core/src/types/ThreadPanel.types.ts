/**
 * @module types/ThreadPanel
 * @description Type definitions for the ThreadPanel component.
 */

/**
 * Represents a message in the thread (parent or reply).
 */
export interface ThreadMessage {
  /** Unique identifier for the message. */
  id: string;
  /** Display name of the sender. */
  sender: string;
  /** Avatar element for the sender. */
  avatar?: React.ReactNode;
  /** Message text content. */
  content: string;
  /** Timestamp string (e.g. "2:30 PM", "Yesterday"). */
  timestamp: string;
  /** Whether this message is from the current user. */
  isOwn?: boolean;
}

/**
 * Props for the ThreadPanel component.
 *
 * @remarks
 * Renders a side panel for threaded message replies, similar to
 * Slack's thread panel or Discord's thread view. Contains the
 * parent message, reply chain, and an input for new replies.
 */
export interface ThreadPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The parent message that started the thread. */
  parentMessage: ThreadMessage;

  /** Array of reply messages in the thread. */
  replies: ThreadMessage[];

  /** Total number of replies (may differ from replies.length if paginated). */
  replyCount?: number;

  /** Called when the close button is clicked. */
  onClose?: () => void;

  /** Called when a new reply is submitted. */
  onReply?: (text: string) => void;

  /** Title text for the panel header. @default 'Thread' */
  title?: string;

  /** Whether the reply input is in a sending state. @default false */
  sending?: boolean;

  /** Placeholder text for the reply input. @default 'Reply...' */
  placeholder?: string;

  /** Whether to show a loading state for replies. @default false */
  loading?: boolean;

  /** Custom renderer for each message. Falls back to built-in rendering. */
  renderMessage?: (message: ThreadMessage) => React.ReactNode;

  // -- Community thread extensions --

  /** Thread name (for named threads). Shown in the header below the title. */
  threadName?: string;

  /** Whether the current user is following this thread. @default false */
  isFollowing?: boolean;

  /** Called when the follow/unfollow button is toggled. */
  onFollowToggle?: () => void;

  /** Show the follow/unfollow button in the header. @default false */
  showFollowButton?: boolean;
}
