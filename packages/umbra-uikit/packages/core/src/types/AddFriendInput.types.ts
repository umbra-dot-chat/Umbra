/**
 * @module types/AddFriendInput
 * @description Type definitions for the AddFriendInput component —
 * a specialised input for sending friend requests by username.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Feedback state
// ---------------------------------------------------------------------------

export const addFriendFeedbackStates = ['idle', 'loading', 'success', 'error'] as const;
export type AddFriendFeedbackState = (typeof addFriendFeedbackStates)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the AddFriendInput component.
 *
 * @remarks
 * Renders an input field with a submit button for adding friends by username.
 * Shows inline feedback after submission (success / error messages).
 */
export interface AddFriendInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  /** Current input value (controlled). */
  value?: string;

  /** Default input value (uncontrolled). */
  defaultValue?: string;

  /** Placeholder text. @default 'Add friend by username...' */
  placeholder?: string;

  /** Called when the input value changes. */
  onValueChange?: (value: string) => void;

  /** Called when the user submits (Enter or button click). */
  onSubmit?: (value: string) => void;

  /** Current feedback state. @default 'idle' */
  feedbackState?: AddFriendFeedbackState;

  /** Feedback message (shown below the input). */
  feedbackMessage?: string;

  /** Whether the input is disabled. @default false */
  disabled?: boolean;

  /** Show loading skeleton. @default false */
  skeleton?: boolean;
}
