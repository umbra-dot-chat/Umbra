/**
 * @module types/WebhookCreateDialog
 * @description Type definitions for the WebhookCreateDialog component —
 * dialog for creating a new webhook.
 */

import type React from 'react';

/** Data submitted when creating a webhook. */
export interface WebhookCreateData {
  /** Webhook name. */
  name: string;
  /** Target channel ID. */
  channelId: string;
  /** Optional avatar file. */
  avatarFile?: File;
}

export interface WebhookCreateDialogProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  /** Whether the dialog is open. */
  open: boolean;
  /** Called when the dialog should close. */
  onClose: () => void;
  /** Called when the form is submitted. */
  onSubmit?: (data: WebhookCreateData) => void;
  /** Available channels for the channel selector. */
  channels: Array<{ id: string; name: string }>;
  /** Whether the form is currently submitting. @default false */
  submitting?: boolean;
  /** Error message to display. */
  error?: string;
  /** Dialog title. @default 'Create Webhook' */
  title?: string;
}
