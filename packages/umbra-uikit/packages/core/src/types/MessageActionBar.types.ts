/**
 * @module types/MessageActionBar
 * @description Type definitions for the MessageActionBar component —
 * a floating action bar shown on message hover/long-press.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

/**
 * Represents a single action in the MessageActionBar.
 */
export interface MessageAction {
  /** Unique key for the action. */
  key: string;
  /** Tooltip / aria-label text. */
  label: string;
  /** Icon element to display. */
  icon: React.ReactNode;
  /** Called when the action is triggered. */
  onClick: () => void;
  /** Whether this action is destructive (e.g. delete). */
  destructive?: boolean;
  /** Whether this action is disabled. */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the MessageActionBar component.
 *
 * @remarks
 * Renders a compact, floating bar of icon buttons above a message.
 * Typically shown on hover (desktop) or long-press (mobile).
 * Similar to Discord's message action bar and Slack's message shortcuts.
 */
export interface MessageActionBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of actions to display. */
  actions: MessageAction[];

  /** Position relative to the message. @default 'top-right' */
  position?: 'top-left' | 'top-right';

  /** Show the emoji quick-react button. @default false */
  showEmojiReact?: boolean;

  /** Called when the emoji react button is clicked. */
  onEmojiReactClick?: () => void;
}
