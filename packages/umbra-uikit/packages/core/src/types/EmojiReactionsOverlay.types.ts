/**
 * @module EmojiReactionsOverlay
 * @description Type definitions for the EmojiReactionsOverlay component.
 */

/**
 * A single emoji reaction event.
 */
export interface EmojiReaction {
  /** Unique identifier for this reaction instance. */
  id: string;
  /** The emoji character to display. */
  emoji: string;
  /** Display name of the person who reacted. */
  fromName: string;
  /** Timestamp (ms) when the reaction was created. */
  timestamp: number;
}

/**
 * Default set of quick-access emojis shown in the reaction bar.
 */
export const QUICK_EMOJIS = ['\u{1F44D}', '\u2764\uFE0F', '\u{1F602}', '\u{1F389}', '\u{1F525}', '\u{1F44F}'] as const;

/**
 * Props for the EmojiReactionsOverlay component.
 */
export interface EmojiReactionsOverlayProps {
  /** Active reactions to display as animated bubbles. */
  reactions: EmojiReaction[];
  /** Callback fired when the user taps a quick emoji. */
  onReact: (emoji: string) => void;
  /** Custom set of quick-access emojis. @default QUICK_EMOJIS */
  quickEmojis?: readonly string[];
  /** Whether to show the quick-reaction bar at the bottom. @default true */
  showQuickBar?: boolean;
}
