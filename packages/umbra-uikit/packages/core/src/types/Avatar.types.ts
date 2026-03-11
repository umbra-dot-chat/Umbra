import type { ThemeRadii } from '../theme/types';
import type React from 'react';
import type { ComponentSize } from '../tokens/shared';
import { defaultTypography } from '../theme/create-theme';

/** Available avatar size presets. */
export const avatarSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

/** Union of allowed avatar size values. */
export type AvatarSize = (typeof avatarSizes)[number];

/** Available avatar shape options. */
export const avatarShapes = ['circle', 'square'] as const;

/** Union of allowed avatar shape values. */
export type AvatarShape = (typeof avatarShapes)[number];

/** Available avatar status indicator states. */
export const avatarStatuses = ['online', 'offline', 'busy', 'away'] as const;

/** Union of allowed avatar status values. */
export type AvatarStatus = (typeof avatarStatuses)[number];

/**
 * Pixel-level dimension configuration for a single {@link AvatarSize} preset.
 */
export interface AvatarSizeConfig {
  /** Overall width and height of the avatar container in pixels. */
  container: number;
  /** Font size for initials text in pixels. */
  fontSize: number;
  /** Size of the fallback icon in pixels. */
  iconSize: number;
  /** Diameter of the status indicator dot in pixels. */
  statusSize: number;
  /** Border width around the status indicator dot in pixels. */
  statusBorder: number;
  /** Border radius applied when {@link AvatarShape} is `'square'`. */
  squareRadius: keyof ThemeRadii;
}

/**
 * Maps each {@link AvatarSize} to its corresponding {@link AvatarSizeConfig}.
 */
export const avatarSizeMap: Record<AvatarSize, AvatarSizeConfig> = {
  xs: { container: 24, fontSize: defaultTypography.sizes['2xs'].fontSize, iconSize: 12, statusSize: 8, statusBorder: 1.5, squareRadius: 'sm' },
  sm: { container: 32, fontSize: defaultTypography.sizes.xs.fontSize, iconSize: 16, statusSize: 10, statusBorder: 2, squareRadius: 'sm' },
  md: { container: 40, fontSize: defaultTypography.sizes.sm.fontSize, iconSize: 20, statusSize: 12, statusBorder: 2, squareRadius: 'md' },
  lg: { container: 48, fontSize: defaultTypography.sizes.base.fontSize, iconSize: 24, statusSize: 14, statusBorder: 2, squareRadius: 'md' },
  xl: { container: 64, fontSize: defaultTypography.sizes.xl.fontSize, iconSize: 28, statusSize: 16, statusBorder: 2.5, squareRadius: 'lg' },
};

/**
 * Props accepted by the {@link Avatar} component.
 *
 * @remarks
 * Extends the native `HTMLDivElement` attributes so any standard `div` prop
 * (e.g. `data-*`, event handlers) is also accepted.
 */
export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Image URL for the avatar. Falls back to initials or icon on error. */
  src?: string;
  /** Accessible alt text for the avatar image. */
  alt?: string;
  /** Full name used to derive initials when no image is available. */
  name?: string;
  /** Size preset for the avatar. @default 'md' */
  size?: AvatarSize;
  /** Shape of the avatar container. @default 'circle' */
  shape?: AvatarShape;
  /** Custom icon component rendered when no image or initials are available. @default User */
  fallbackIcon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;
  /** Optional status indicator displayed at the bottom-right corner. */
  status?: AvatarStatus;
  /** When `true`, renders a pulsing skeleton placeholder instead of content. @default false */
  skeleton?: boolean;
  /**
   * When `true`, adapts colors for dark / raised surfaces (e.g. sidebar).
   * Uses light background with dark initials instead of the default accent background.
   * @default false
   */
  onSurface?: boolean;
  /** Additional CSS class name applied to the outermost element. */
  className?: string;
  /** Inline style overrides merged onto the outermost element. */
  style?: React.CSSProperties;
}
