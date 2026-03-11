/**
 * @module NotificationBadge
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

/** Available notification badge color variants. */
export const notificationBadgeColors = ['danger', 'warning', 'success', 'info', 'default'] as const;

/** Union of valid notification badge color values. */
export type NotificationBadgeColor = (typeof notificationBadgeColors)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link NotificationBadge} component.
 *
 * @remarks
 * Wraps a child element and overlays a small count or dot badge at the
 * top-right corner. Useful for conveying unread counts, alerts, or
 * activity indicators on icons, avatars, and buttons.
 */
export interface NotificationBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Numeric count displayed inside the badge.
   * When omitted (and `dot` is false), the badge is hidden unless `dot` is set.
   */
  count?: number;

  /**
   * Maximum number to display before showing `{max}+`.
   * @default 99
   */
  max?: number;

  /**
   * When `true`, renders a small dot instead of a count.
   * @default false
   */
  dot?: boolean;

  /**
   * Semantic color variant.
   * @default 'danger'
   */
  color?: NotificationBadgeColor;

  /**
   * When `true`, hides the badge completely (useful for animated transitions).
   * @default false
   */
  invisible?: boolean;

  /**
   * When `true`, applies a pulsing animation to draw attention.
   * @default false
   */
  pulse?: boolean;

  /** The element the badge is anchored to (typically an icon or avatar). */
  children?: React.ReactNode;
}
