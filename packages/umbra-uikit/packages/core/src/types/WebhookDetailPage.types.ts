/**
 * @module types/WebhookDetailPage
 * @description Type definitions for the WebhookDetailPage component —
 * detail view for a single webhook with token display and edit.
 */

import type React from 'react';

export interface WebhookDetailPageProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Webhook display name. */
  name: string;
  /** Webhook avatar URL. */
  avatarUrl?: string;
  /** Channel name. */
  channelName: string;
  /** Webhook token. */
  token: string;
  /** Who created the webhook. */
  createdBy: string;
  /** Creation timestamp. */
  createdAt: string;
  /** Called when the name is changed. */
  onNameChange?: (name: string) => void;
  /** Called when the avatar file is changed. */
  onAvatarChange?: (file: File) => void;
  /** Called when regenerate token is requested. */
  onRegenerateToken?: () => void;
  /** Called when delete is requested. */
  onDelete?: () => void;
  /** Called when copy token is clicked. */
  onCopyToken?: (token: string) => void;
  /** Whether the form is saving. @default false */
  saving?: boolean;
  /** Called when save is requested. */
  onSave?: () => void;
  /** Skeleton state. @default false */
  skeleton?: boolean;
}
