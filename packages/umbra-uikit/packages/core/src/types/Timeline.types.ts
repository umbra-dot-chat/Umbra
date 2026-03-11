/**
 * @module Timeline
 */
import type React from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

/** Available timeline sizes. */
export const timelineSizes = ['sm', 'md', 'lg'] as const;

/** Union of valid timeline size values. */
export type TimelineSize = (typeof timelineSizes)[number];

/** Dimensional config for a timeline size step. */
export interface TimelineSizeConfig {
  /** Dot diameter in pixels. */
  dotSize: number;
  /** Connector line width in pixels. */
  lineWidth: number;
  /** Primary text font size in pixels. */
  fontSize: number;
  /** Secondary text font size in pixels. */
  secondaryFontSize: number;
  /** Gap between dot column and content. */
  gap: number;
  /** Vertical gap between content lines. */
  contentGap: number;
}

/** Size -> config lookup. */
export const timelineSizeMap: Record<TimelineSize, TimelineSizeConfig> = {
  sm: { dotSize: 10, lineWidth: 2, fontSize: defaultTypography.sizes.sm.fontSize, secondaryFontSize: 11, gap: defaultSpacing.md, contentGap: 4 },
  md: { dotSize: 12, lineWidth: 2, fontSize: defaultTypography.sizes.sm.fontSize, secondaryFontSize: 12, gap: defaultSpacing.lg, contentGap: 6 },
  lg: { dotSize: 16, lineWidth: 2, fontSize: defaultTypography.sizes.base.fontSize, secondaryFontSize: 13, gap: defaultSpacing.xl, contentGap: 8 },
};

// ---------------------------------------------------------------------------
// Orientation
// ---------------------------------------------------------------------------

/** Available timeline orientations. */
export const timelineOrientations = ['vertical', 'horizontal'] as const;

/** Union of valid orientation values. */
export type TimelineOrientation = (typeof timelineOrientations)[number];

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

/** Available timeline item statuses. */
export const timelineStatuses = ['completed', 'active', 'pending'] as const;

/** Union of valid timeline item status values. */
export type TimelineStatus = (typeof timelineStatuses)[number];

// ---------------------------------------------------------------------------
// Item definition
// ---------------------------------------------------------------------------

/** A single event in the timeline. */
export interface TimelineItem {
  /** Unique identifier for this item. */
  id: string;
  /** Primary title content. */
  title: React.ReactNode;
  /** Optional description beneath the title. */
  description?: React.ReactNode;
  /** Optional timestamp text (e.g. "Jan 15, 2025"). */
  timestamp?: string;
  /** Optional icon rendered inside the dot. */
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  /** Optional custom color for the dot (overrides status-based color). */
  color?: string;
  /**
   * Status of this timeline item.
   * @default 'completed'
   */
  status?: TimelineStatus;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Timeline} component.
 */
export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of timeline items to display. */
  items: TimelineItem[];

  /**
   * Size preset.
   * @default 'md'
   */
  size?: TimelineSize;

  /**
   * Layout orientation.
   * @default 'vertical'
   */
  orientation?: TimelineOrientation;

  /**
   * When `true` a pulsing skeleton placeholder is rendered instead of the component.
   *
   * @default false
   */
  skeleton?: boolean;
}
