/**
 * @module types/MessageInput
 * @description Type definitions for the MessageInput component — rich chat
 * input with send, attachment, and emoji support.
 */

import type { ThemeRadii } from '../theme/types';
import type React from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

export const messageInputSizes = ['sm', 'md', 'lg'] as const;
export type MessageInputSize = (typeof messageInputSizes)[number];

// ---------------------------------------------------------------------------
// Variant
// ---------------------------------------------------------------------------

export const messageInputVariants = ['default', 'pill'] as const;
export type MessageInputVariant = (typeof messageInputVariants)[number];

export interface MessageInputSizeConfig {
  /** Minimum height (px). */
  minHeight: number;
  /** Maximum height before scroll (px). */
  maxHeight: number;
  /** Font size. */
  fontSize: number;
  /** Padding. */
  padding: number;
  /** Icon button size. */
  iconButtonSize: number;
  /** Icon size. */
  iconSize: number;
  /** Border radius. */
  borderRadius: keyof ThemeRadii;
  /** Gap between elements. */
  gap: number;
}

export const messageInputSizeMap: Record<MessageInputSize, MessageInputSizeConfig> = {
  sm: { minHeight: 36, maxHeight: 120, fontSize: defaultTypography.sizes.sm.fontSize, padding: defaultSpacing.sm, iconButtonSize: 28, iconSize: 16, borderRadius: 'xl', gap: defaultSpacing.xs },
  md: { minHeight: 44, maxHeight: 160, fontSize: defaultTypography.sizes.sm.fontSize, padding: defaultSpacing.md, iconButtonSize: 34, iconSize: 18, borderRadius: 'xl', gap: defaultSpacing.sm },
  lg: { minHeight: 52, maxHeight: 200, fontSize: defaultTypography.sizes.base.fontSize, padding: defaultSpacing.lg, iconButtonSize: 40, iconSize: 20, borderRadius: 'xl', gap: defaultSpacing.sm } };

// ---------------------------------------------------------------------------
// Reply context
// ---------------------------------------------------------------------------

/**
 * Metadata for the message being replied to, shown as a preview bar
 * above the input area.
 */
export interface MessageInputReplyContext {
  /** Display name of the original message sender. */
  sender: string;
  /** Truncated text preview of the original message. */
  text: string;
  /** Callback to clear/cancel the reply. */
  onClear: () => void;
}

// ---------------------------------------------------------------------------
// Edit context
// ---------------------------------------------------------------------------

/**
 * Metadata for the message being edited, shown as a preview bar
 * above the input area.
 */
export interface MessageInputEditContext {
  /** Text of the message being edited. */
  text: string;
  /** Callback to cancel editing. */
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Attachment preview
// ---------------------------------------------------------------------------

/**
 * Represents a queued attachment shown as a preview card before sending.
 */
export interface MessageInputAttachment {
  /** Unique ID for the attachment. */
  id: string;
  /** Display name of the file. */
  name: string;
  /** File size in bytes. */
  size?: number;
  /** MIME type. */
  type?: string;
  /** Optional thumbnail URL for images/videos. */
  thumbnail?: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MessageInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onSubmit'> {
  /** Current input value (controlled). */
  value?: string;

  /** Default input value (uncontrolled). */
  defaultValue?: string;

  /** Placeholder text. @default 'Type a message...' */
  placeholder?: string;

  /** Size preset. @default 'md' */
  size?: MessageInputSize;

  /**
   * Visual variant.
   * - `'default'` — standard rounded rectangle (uses size borderRadius).
   * - `'pill'` — fully rounded pill shape with tighter icon insets.
   * @default 'default'
   */
  variant?: MessageInputVariant;

  /** Called when the value changes. */
  onValueChange?: (value: string) => void;

  /** Called when the user submits the message (Enter or send button). */
  onSubmit?: (value: string) => void;

  /** Show attachment button. @default true */
  showAttachment?: boolean;

  /** Called when attachment button is clicked. */
  onAttachmentClick?: () => void;

  /** Show emoji trigger button. @default true */
  showEmoji?: boolean;

  /** Called when emoji button is clicked (use for external picker). */
  onEmojiClick?: () => void;

  /** Called when an emoji is selected from the built-in picker. */
  onEmojiSelect?: (emoji: string) => void;

  /** Whether the input is disabled. @default false */
  disabled?: boolean;

  /** Whether the message is being sent (shows spinner). @default false */
  sending?: boolean;

  /** Auto-expand textarea as user types. @default true */
  autoExpand?: boolean;

  /** Show loading skeleton. @default false */
  skeleton?: boolean;

  /**
   * Reply context. When provided, a reply preview bar is shown above
   * the input with the original sender name, text, and a close button.
   */
  replyingTo?: MessageInputReplyContext;

  /**
   * Edit context. When provided, an edit preview bar is shown above
   * the input with the original text and a cancel button.
   */
  editing?: MessageInputEditContext;

  /**
   * Show voice record button. @default false
   */
  showVoice?: boolean;

  /**
   * Called when the voice record button is clicked.
   */
  onVoiceClick?: () => void;

  /**
   * Maximum character count. When set, a counter is displayed and input
   * is visually warned when approaching the limit.
   */
  maxLength?: number;

  /**
   * Queued attachments shown as preview cards above the input area.
   */
  attachments?: MessageInputAttachment[];

  /**
   * Called when an attachment preview is removed.
   */
  onAttachmentRemove?: (id: string) => void;

  // -- Community extensions --

  /**
   * Whether content warning mode is enabled on this message.
   * Shows a toggle button and wraps content in a spoiler tag.
   * @default false
   */
  contentWarning?: boolean;

  /** Called when the content warning toggle is clicked. */
  onContentWarningToggle?: () => void;

  /** Show content warning toggle button. @default false */
  showContentWarning?: boolean;

  /**
   * Slow mode remaining seconds. When > 0, the input is disabled
   * and a countdown is shown. When 0 or undefined, slow mode is inactive.
   */
  slowModeRemaining?: number;

  /** Whether slow mode is enabled on this channel. @default false */
  slowModeEnabled?: boolean;
}
