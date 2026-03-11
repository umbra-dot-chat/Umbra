/**
 * @module components/quest-tracker
 * @description Type definitions for the Wisp QuestTracker component.
 *
 * Compact quest objective list with completion indicators and overall progress.
 */

import type React from 'react';
import { defaultSpacing } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Objective statuses
// ---------------------------------------------------------------------------

/** Available objective statuses. */
export const questObjectiveStatuses = ['incomplete', 'complete', 'in-progress'] as const;

/** Union of quest objective status keys. */
export type QuestObjectiveStatus = (typeof questObjectiveStatuses)[number];

// ---------------------------------------------------------------------------
// Objective
// ---------------------------------------------------------------------------

/** A single quest objective. */
export interface QuestObjective {
  /** Unique identifier. */
  id: string;

  /** Objective label. */
  label: string;

  /**
   * Status.
   * @default 'incomplete'
   */
  status?: QuestObjectiveStatus;

  /** Current count (for countable objectives). */
  current?: number;

  /** Target count (for countable objectives). */
  target?: number;
}

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

/** Available size presets. */
export const questTrackerSizes = ['sm', 'md', 'lg'] as const;

/** Union of quest-tracker size keys. */
export type QuestTrackerSize = (typeof questTrackerSizes)[number];

/** Size configuration. */
export interface QuestTrackerSizeConfig {
  titleFontSize: number;
  labelFontSize: number;
  indicatorSize: number;
  gap: number;
  padding: string;
}

/** Size map. */
export const questTrackerSizeMap: Record<QuestTrackerSize, QuestTrackerSizeConfig> = {
  sm: { titleFontSize: 13, labelFontSize: 12, indicatorSize: 16, gap: defaultSpacing.sm, padding: '10px 14px' },
  md: { titleFontSize: 14, labelFontSize: 13, indicatorSize: 18, gap: defaultSpacing.sm, padding: '14px 16px' },
  lg: { titleFontSize: 16, labelFontSize: 14, indicatorSize: 20, gap: defaultSpacing.md, padding: '16px 20px' },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props for the {@link QuestTracker} component. */
export interface QuestTrackerProps {
  /** Quest title. */
  title: string;

  /** Array of quest objectives. */
  objectives: QuestObjective[];

  /**
   * Overall progress (0–100). If not provided, auto-calculated from objectives.
   */
  progress?: number;

  /**
   * Size preset.
   * @default 'md'
   */
  size?: QuestTrackerSize;

  /**
   * Whether the objective list can be collapsed.
   * @default false
   */
  collapsible?: boolean;

  /**
   * Whether the objective list starts expanded.
   * @default true
   */
  defaultExpanded?: boolean;

  /**
   * Whether to show the progress bar.
   * @default true
   */
  showProgress?: boolean;

  /** Callback when an objective is clicked. */
  onObjectiveClick?: (id: string) => void;

  /** Additional class name. */
  className?: string;

  /** Additional inline style. */
  style?: React.CSSProperties;
}
