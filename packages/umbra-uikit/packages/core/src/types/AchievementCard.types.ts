/**
 * @module components/achievement-card
 * @description Type definitions for the Wisp AchievementCard component.
 *
 * Card showing achievement with locked/in-progress/unlocked states and rarity tier.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Statuses
// ---------------------------------------------------------------------------

/** Available achievement statuses. */
export const achievementStatuses = ['locked', 'in-progress', 'unlocked'] as const;

/** Union of achievement status keys. */
export type AchievementStatus = (typeof achievementStatuses)[number];

// ---------------------------------------------------------------------------
// Rarities (shared with AchievementUnlock)
// ---------------------------------------------------------------------------

/** Available achievement rarities. */
export const achievementRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;

/** Union of achievement rarity keys. */
export type AchievementRarity = (typeof achievementRarities)[number];

/** Configuration for a single rarity tier. */
export interface AchievementRarityConfig {
  color: string;
  label: string;
}

/** Map of rarity to visual config. */
export const achievementRarityMap: Record<AchievementRarity, AchievementRarityConfig> = {
  common:    { color: '#9CA3AF', label: 'Common' },
  uncommon:  { color: '#34D399', label: 'Uncommon' },
  rare:      { color: '#60A5FA', label: 'Rare' },
  epic:      { color: '#A78BFA', label: 'Epic' },
  legendary: { color: '#FBBF24', label: 'Legendary' },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props for the {@link AchievementCard} component. */
export interface AchievementCardProps {
  /** Achievement title. */
  title: string;

  /** Achievement description. */
  description?: string;

  /** Icon component for the achievement. */
  icon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number | string }>;

  /**
   * Current status.
   * @default 'locked'
   */
  status?: AchievementStatus;

  /**
   * Progress value (0–100) for in-progress status.
   * @default 0
   */
  progress?: number;

  /**
   * Rarity tier.
   * @default 'common'
   */
  rarity?: AchievementRarity;

  /** Date when the achievement was unlocked. */
  unlockedAt?: string;

  /** Click handler. */
  onClick?: () => void;

  /** Additional class name. */
  className?: string;

  /** Additional inline style. */
  style?: React.CSSProperties;
}
