/**
 * @module types/ModerationDashboard
 * @description Type definitions for the ModerationDashboard component --
 * an overview dashboard with moderation statistics and recent activity.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Sub-types
// ---------------------------------------------------------------------------

/** A single moderation statistic card entry. */
export interface ModerationStat {
  label: string;
  value: number;
  /** Change from previous period (+/-). */
  change?: number;
  color?: 'default' | 'success' | 'warning' | 'danger';
}

/** A recent moderation action entry. */
export interface RecentModerationAction {
  id: string;
  type: 'warning' | 'timeout' | 'kick' | 'ban';
  actorName: string;
  actorAvatar?: React.ReactNode;
  targetName: string;
  targetAvatar?: React.ReactNode;
  reason?: string;
  timestamp: string;
}

/** A ban-evasion alert entry. */
export interface BanEvasionAlert {
  id: string;
  suspectedMemberName: string;
  suspectedMemberAvatar?: React.ReactNode;
  matchedBanName: string;
  matchType: 'device_fingerprint' | 'ip_pattern';
  confidence: 'high' | 'medium' | 'low';
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the ModerationDashboard component.
 */
export interface ModerationDashboardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of statistic entries shown as cards. */
  stats: ModerationStat[];

  /** Array of recent moderation actions. */
  recentActions: RecentModerationAction[];

  /** Optional array of ban-evasion alerts. */
  banEvasionAlerts?: BanEvasionAlert[];

  /** Called when a recent-action row is clicked. */
  onActionClick?: (actionId: string) => void;

  /** Called when a ban-evasion alert is dismissed. */
  onAlertDismiss?: (alertId: string) => void;

  /** Called when a ban-evasion alert is investigated. */
  onAlertInvestigate?: (alertId: string) => void;

  /** Dashboard title. @default 'Moderation' */
  title?: string;

  /** Whether data is loading. @default false */
  loading?: boolean;

  /** Show loading skeleton. @default false */
  skeleton?: boolean;
}
