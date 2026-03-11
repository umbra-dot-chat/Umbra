/**
 * @module types/SystemMessageRenderer
 * @description Type definitions for the SystemMessageRenderer component —
 * centered, muted rendering for system/bot messages.
 */

import type React from 'react';

export type SystemMessageType = 'join' | 'leave' | 'pin' | 'channel_update' | 'role_update' | 'generic';

export interface SystemMessageRendererProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The message text content. */
  content: string;
  /** Timestamp. */
  timestamp?: string;
  /** System message type (determines icon). @default 'generic' */
  type?: SystemMessageType;
  /** Custom icon override. */
  icon?: React.ReactNode;
}
