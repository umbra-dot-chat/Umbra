/**
 * @module types/WebhookMessagePreview
 * @description Type definitions for the WebhookMessagePreview component —
 * renders messages posted by webhooks with a "BOT" badge.
 */

import type React from 'react';

export interface WebhookMessagePreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Webhook sender name. */
  webhookName: string;
  /** Webhook avatar node. */
  webhookAvatar?: React.ReactNode;
  /** Message content. */
  content: string;
  /** Message timestamp. */
  timestamp?: string;
  /** Media node to render below the content. */
  media?: React.ReactNode;
  /** Reactions list. */
  reactions?: Array<{ emoji: string; count: number; reacted?: boolean }>;
  /** Called when a reaction is clicked. */
  onReactionClick?: (emoji: string) => void;
}
