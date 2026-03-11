import type React from 'react';

// ---------------------------------------------------------------------------
// Alignment
// ---------------------------------------------------------------------------

/** Available chat bubble alignment options. */
export const chatBubbleAlignments = ['incoming', 'outgoing'] as const;

/** Union of valid alignment values derived from {@link chatBubbleAlignments}. */
export type ChatBubbleAlignment = (typeof chatBubbleAlignments)[number];

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

/** Available chat bubble visual variants. */
export const chatBubbleVariants = ['default', 'accent'] as const;

/** Union of valid variant values derived from {@link chatBubbleVariants}. */
export type ChatBubbleVariant = (typeof chatBubbleVariants)[number];

// ---------------------------------------------------------------------------
// Delivery status
// ---------------------------------------------------------------------------

/** Available delivery status indicators for outgoing messages. */
export const chatBubbleStatuses = ['sent', 'delivered', 'read'] as const;

/** Union of valid status values derived from {@link chatBubbleStatuses}. */
export type ChatBubbleStatus = (typeof chatBubbleStatuses)[number];

// ---------------------------------------------------------------------------
// Reactions
// ---------------------------------------------------------------------------

/**
 * Represents a single emoji reaction attached to a message.
 */
export interface ChatBubbleReaction {
  /** The emoji character (e.g. "👍", "❤️"). */
  emoji: string;
  /** Total reaction count. */
  count: number;
  /** Whether the current user has reacted with this emoji. */
  reacted?: boolean;
}

// ---------------------------------------------------------------------------
// Reply-to metadata
// ---------------------------------------------------------------------------

/**
 * Metadata for the quoted message being replied to, shown as a preview
 * strip above the bubble content.
 */
export interface ChatBubbleReplyTo {
  /** Display name of the original message sender. */
  sender: string;
  /** Truncated text preview of the original message. */
  text: string;
  /** Optional callback when the reply preview is clicked (e.g. to scroll to the original message). */
  onClick?: () => void;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link ChatBubble} component.
 *
 * @remarks
 * Extends the native `<div>` element attributes so any valid HTML div
 * prop (e.g. `aria-*`, `data-*`) can be forwarded.
 *
 * The bubble renders with one sharp corner to visually indicate the
 * message direction:
 * - `incoming`: sharp bottom-left corner (points toward sender on the left)
 * - `outgoing`: sharp bottom-right corner (points toward sender on the right)
 */
export interface ChatBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Message direction / alignment.
   * - `'incoming'`: renders on the left with a sharp bottom-left corner.
   * - `'outgoing'`: renders on the right with a sharp bottom-right corner.
   * @default 'incoming'
   */
  align?: ChatBubbleAlignment;

  /**
   * Visual color variant.
   * - `'default'`: theme surface colors (subtle for incoming, raised for outgoing).
   * - `'accent'`: brand/accent color (typically for outgoing messages).
   * @default 'default'
   */
  variant?: ChatBubbleVariant;

  /** Optional timestamp text displayed below the message (e.g. "2:34 PM"). */
  timestamp?: string;

  /**
   * Delivery status indicator for outgoing messages.
   * - `'sent'`: single check
   * - `'delivered'`: double check
   * - `'read'`: double check (accent color)
   */
  status?: ChatBubbleStatus;

  /** Optional array of emoji reactions displayed below the bubble. */
  reactions?: ChatBubbleReaction[];

  /** Callback fired when a reaction chip is clicked. Receives the emoji string. */
  onReactionClick?: (emoji: string) => void;

  /**
   * Quoted reply metadata. When provided, a compact reply preview strip
   * is rendered above the message content with the original sender name
   * and a truncated text preview.
   */
  replyTo?: ChatBubbleReplyTo;

  /**
   * Marks the message as forwarded. When `true`, a "Forwarded" label is
   * displayed above the content. When an object with `from`, the
   * originator's name is shown (e.g. "Forwarded from Alice").
   */
  forwarded?: boolean | { from: string };

  /**
   * When `true`, an "(edited)" indicator is appended to the timestamp
   * in the footer row.
   */
  edited?: boolean;

  /**
   * When `true`, the bubble receives a brief highlight animation,
   * typically used when scrolling/jumping to a specific message.
   */
  highlighted?: boolean;

  /**
   * Slot for media content (images, video, file cards) rendered above
   * the text content inside the bubble.
   */
  media?: React.ReactNode;

  /**
   * Custom sender name color for group chats where each participant
   * has a distinct color. Applied to the reply-to sender name.
   */
  senderColor?: string;

  /**
   * @internal
   * When `true`, the bubble suppresses its own timestamp/status footer
   * because the parent `MessageGroup` renders it instead.
   * **Do not set this prop manually** — it is injected by `MessageGroup`.
   */
  _inGroup?: boolean;

  // -- Community thread extensions --

  /**
   * Thread indicator metadata. When provided, a "View Thread" button
   * with reply count is rendered below the bubble.
   */
  threadInfo?: {
    /** Number of replies in the thread. */
    replyCount: number;
    /** Avatars of recent thread participants (rendered as a mini AvatarGroup). */
    participantAvatars?: React.ReactNode[];
    /** Last reply timestamp text. */
    lastReplyAt?: string;
    /** Called when the thread indicator is clicked. */
    onClick?: () => void;
  };

  /**
   * Whether this is a system message (e.g. "User joined", "Channel created").
   * System messages render with a centered, muted appearance.
   * @default false
   */
  system?: boolean;
}
