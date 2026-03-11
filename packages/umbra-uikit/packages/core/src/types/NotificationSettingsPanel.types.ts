/**
 * @module types/NotificationSettingsPanel
 * @description Type definitions for the NotificationSettingsPanel component --
 * per-community/space/channel notification controls.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Notification Level
// ---------------------------------------------------------------------------

/**
 * How much notification the user wants for a given target.
 *
 * - `'all'`      -- notify for all messages.
 * - `'mentions'` -- only @mentions.
 * - `'none'`     -- suppress everything.
 */
export type NotificationLevel = 'all' | 'mentions' | 'none';

// ---------------------------------------------------------------------------
// Target
// ---------------------------------------------------------------------------

/**
 * Represents a community, space, or channel that notifications
 * can be configured for.
 */
export interface NotificationTarget {
  id: string;
  name: string;
  type: 'community' | 'space' | 'channel';
  icon?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Setting
// ---------------------------------------------------------------------------

/**
 * Notification configuration for a single target.
 */
export interface NotificationSetting {
  targetId: string;
  level: NotificationLevel;
  muteUntil?: string | null;
  suppressEveryone: boolean;
  suppressRoles: boolean;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the NotificationSettingsPanel component.
 */
export interface NotificationSettingsPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Notification targets (communities, spaces, channels). */
  targets: NotificationTarget[];

  /** Current settings per target. */
  settings: NotificationSetting[];

  /** Called when a setting changes. */
  onSettingChange?: (targetId: string, updates: Partial<NotificationSetting>) => void;

  /** Panel title. @default 'Notification Settings' */
  title?: string;

  /** Called when the panel is closed. */
  onClose?: () => void;

  /** Whether the panel is loading. */
  loading?: boolean;

  /** Whether to render in skeleton/loading state. */
  skeleton?: boolean;
}
