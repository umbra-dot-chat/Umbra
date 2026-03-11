import type React from 'react';
import type { ChatBubbleAlignment } from './ChatBubble.types';

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

/** Available typing indicator animation styles. */
export const typingIndicatorAnimations = [
  'bounce',
  'pulse',
  'scale',
  'wave',
] as const;

/** Union of valid animation values derived from {@link typingIndicatorAnimations}. */
export type TypingIndicatorAnimation = (typeof typingIndicatorAnimations)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link TypingIndicator} component.
 *
 * @remarks
 * Renders an animated "someone is typing…" indicator. Can be rendered as
 * bare dots, inside a chat-bubble container, or with an avatar + bubble.
 *
 * Extends the native `<div>` element attributes so any valid HTML div
 * prop (e.g. `aria-*`, `data-*`) can be forwarded.
 */
export interface TypingIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Animation style for the dots.
   * - `'bounce'`: dots jump up and down (default)
   * - `'pulse'`: dots fade in and out
   * - `'scale'`: dots grow and shrink
   * - `'wave'`: smooth sine-wave vertical motion
   * @default 'bounce'
   */
  animation?: TypingIndicatorAnimation;

  /**
   * When `true`, wraps the dots inside a chat-bubble-shaped container.
   * @default false
   */
  bubble?: boolean;

  /**
   * Message direction / alignment. Only relevant when `bubble` is `true`.
   * Controls which corner is sharp and overall alignment.
   * @default 'incoming'
   */
  align?: ChatBubbleAlignment;

  /**
   * Optional avatar element rendered beside the bubble.
   * Only shown when `bubble` is `true`.
   */
  avatar?: React.ReactNode;

  /**
   * Optional sender name shown above the bubble.
   * Only shown when `bubble` is `true`.
   */
  sender?: string;

  /** Override color for the dots. Defaults to theme muted text. */
  color?: string;

  /**
   * Size of each dot in pixels.
   * @default 8
   */
  dotSize?: number;
}
