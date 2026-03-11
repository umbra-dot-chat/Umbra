/**
 * @module ActivityFeed
 */
import type React from 'react';
import { defaultSpacing } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

/** Available feed sizes. */
export const activityFeedSizes = ['sm', 'md'] as const;

/** Union of valid feed size values. */
export type ActivityFeedSize = (typeof activityFeedSizes)[number];

/** Dimensional config for a feed size step. */
export interface ActivityFeedSizeConfig {
  /** Avatar diameter in pixels. */
  avatarSize: number;
  /** Primary text font size. */
  primaryFontSize: number;
  /** Secondary text font size. */
  secondaryFontSize: number;
  /** Gap between avatar and content. */
  gap: number;
  /** Vertical gap between items. */
  itemGap: number;
  /** Connector line width. */
  lineWidth: number;
}

/** Size → config lookup. */
export const activityFeedSizeMap: Record<ActivityFeedSize, ActivityFeedSizeConfig> = {
  sm: { avatarSize: 28, primaryFontSize: 13, secondaryFontSize: 12, gap: defaultSpacing.md, itemGap: 0, lineWidth: 2 },
  md: { avatarSize: 36, primaryFontSize: 14, secondaryFontSize: 13, gap: defaultSpacing.md, itemGap: 0, lineWidth: 2 },
};

// ---------------------------------------------------------------------------
// Item definition
// ---------------------------------------------------------------------------

/** A single event in the activity feed. */
export interface ActivityFeedItem {
  /** Unique ID. */
  id: string;
  /** Primary message content (can include bold names, etc.). */
  content: React.ReactNode;
  /** Timestamp text (e.g. "2 hours ago"). */
  timestamp: string;
  /** Optional avatar URL. When absent, uses icon fallback. */
  avatarUrl?: string;
  /** Initials fallback for avatar. */
  avatarInitials?: string;
  /** Optional icon (used instead of avatar when no avatarUrl provided). */
  icon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;
  /** Optional icon background color. */
  iconColor?: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link ActivityFeed} component.
 */
export interface ActivityFeedProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of feed items to display. */
  items: ActivityFeedItem[];

  /**
   * Size preset.
   * @default 'md'
   */
  size?: ActivityFeedSize;

  /**
   * When `true`, shows a vertical connector line between items.
   * @default true
   */
  showConnector?: boolean;
}
