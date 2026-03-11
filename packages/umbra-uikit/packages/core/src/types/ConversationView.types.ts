/**
 * @module types/ConversationView
 * @description Type definitions for the ConversationView wrapper component.
 *
 * ConversationView wraps the message area of both DM chats and community
 * channels, providing:
 * - E2EE status banner at the top when `encrypted` is true
 * - Consistent padding and layout
 * - Slot for header, messages, and input
 */

import type { KeyExchangeStatus } from './E2EEKeyExchangeUI.types';

export interface ConversationViewProps {
  /** Whether the conversation/channel uses end-to-end encryption. @default false */
  encrypted?: boolean;

  /** Current E2EE key exchange status. Shown when `encrypted` is true. @default 'active' */
  e2eeStatus?: KeyExchangeStatus;

  /** Current key version number for the E2EE badge. */
  e2eeKeyVersion?: number;

  /** Error message to display in the E2EE banner when status is 'error'. */
  e2eeErrorMessage?: string;

  /** Called when the E2EE retry button is pressed (error state). */
  onE2eeRetry?: () => void;

  /** Called when the E2EE key rotation button is pressed (active state). */
  onE2eeRotateKey?: () => void;

  /** Whether E2EE key rotation is in progress. @default false */
  e2eeRotating?: boolean;

  /** Children are rendered as the conversation body (messages, input, etc.). */
  children: React.ReactNode;
}
