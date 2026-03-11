/**
 * @module types/WebhookManagementPanel
 * @description Type definitions for the WebhookManagementPanel component —
 * manage webhooks for a channel with create/edit/delete.
 */

import type React from 'react';

/** A webhook entry. */
export interface WebhookEntry {
  /** Unique webhook ID. */
  id: string;
  /** Webhook display name. */
  name: string;
  /** Webhook avatar URL. */
  avatarUrl?: string;
  /** Channel name the webhook is attached to. */
  channelName: string;
  /** Channel ID. */
  channelId: string;
  /** Who created the webhook. */
  createdBy: string;
  /** Creation timestamp. */
  createdAt: string;
  /** Last used timestamp. */
  lastUsedAt?: string;
}

export interface WebhookManagementPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** List of webhooks to display. */
  webhooks: WebhookEntry[];
  /** Called when the create button is clicked. */
  onCreateClick?: () => void;
  /** Called when a webhook card is clicked. */
  onWebhookClick?: (webhookId: string) => void;
  /** Called when a webhook delete button is clicked. */
  onDeleteWebhook?: (webhookId: string) => void;
  /** Panel title. @default 'Webhooks' */
  title?: string;
  /** Maximum number of webhooks allowed. @default 10 */
  maxWebhooks?: number;
  /** Loading state. @default false */
  loading?: boolean;
  /** Skeleton state. @default false */
  skeleton?: boolean;
}
