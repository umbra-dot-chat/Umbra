/**
 * @module components/achievement-unlock
 * @description Type definitions for the Wisp AchievementUnlock component.
 *
 * Animated popup notification for achievement unlock events.
 */

import type React from 'react';
import type { AchievementRarity } from './AchievementCard.types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props for the {@link AchievementUnlock} component. */
export interface AchievementUnlockProps {
  /** Whether the popup is visible. */
  open: boolean;

  /** Callback fired when the popup should close. */
  onClose?: () => void;

  /** Achievement title. */
  title: string;

  /** Achievement description. */
  description?: string;

  /** Icon component for the achievement. */
  icon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number | string }>;

  /**
   * Rarity tier controlling accent colours.
   * @default 'common'
   */
  rarity?: AchievementRarity;

  /**
   * Auto-dismiss duration in ms. Set to 0 to disable auto-dismiss.
   * @default 5000
   */
  duration?: number;

  /** Label for the optional action button. */
  actionLabel?: string;

  /** Callback for the action button. */
  onAction?: () => void;
}
