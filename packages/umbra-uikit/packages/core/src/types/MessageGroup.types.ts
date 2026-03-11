import type React from 'react';
import type { ChatBubbleAlignment, ChatBubbleStatus } from './ChatBubble.types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link MessageGroup} component.
 *
 * @remarks
 * Groups consecutive chat bubbles from the same sender together, displaying
 * the avatar and sender name once at the top with tightly-spaced bubbles below.
 *
 * The timestamp and delivery status are rendered once below the entire group
 * rather than on each individual bubble.
 *
 * Extends the native `<div>` element attributes so any valid HTML div
 * prop (e.g. `aria-*`, `data-*`) can be forwarded.
 */
export interface MessageGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Alignment of the entire group.
   * - `'incoming'`: avatar + bubbles left-aligned.
   * - `'outgoing'`: bubbles right-aligned (avatar typically omitted for self).
   * @default 'incoming'
   */
  align?: ChatBubbleAlignment;

  /** Sender display name shown above the first bubble. */
  sender?: string;

  /**
   * Optional avatar element rendered beside the sender name.
   * Typically an `<Avatar>` component.
   */
  avatar?: React.ReactNode;

  /** Timestamp text displayed below the entire group (e.g. "2:34 PM"). */
  timestamp?: string;

  /**
   * Delivery status indicator shown in the group footer.
   * - `'sent'`: single check
   * - `'delivered'`: double check
   * - `'read'`: double check (accent color)
   */
  status?: ChatBubbleStatus;
}
