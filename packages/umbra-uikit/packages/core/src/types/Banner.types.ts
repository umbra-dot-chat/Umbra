/**
 * @module Banner
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

/** Available banner color variants. */
export const bannerVariants = ['default', 'info', 'success', 'warning', 'danger'] as const;

/** Union of valid banner variant values. */
export type BannerVariant = (typeof bannerVariants)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Banner} component.
 */
export interface BannerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Primary message text or content. */
  children: React.ReactNode;

  /** Optional title displayed above the message. */
  title?: string;

  /**
   * Semantic color variant.
   * @default 'default'
   */
  variant?: BannerVariant;

  /** Optional icon displayed on the left. */
  icon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;

  /** Optional action element (e.g. a Button) rendered on the right. */
  action?: React.ReactNode;

  /**
   * When `true`, shows a dismiss (X) button and calls `onDismiss`.
   * @default false
   */
  dismissible?: boolean;

  /** Callback fired when the dismiss button is clicked. */
  onDismiss?: () => void;

  /**
   * When `true`, renders full-width with no border-radius (for page-top banners).
   * @default false
   */
  fullWidth?: boolean;
}
