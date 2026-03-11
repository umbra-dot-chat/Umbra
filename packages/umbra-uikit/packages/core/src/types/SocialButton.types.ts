/**
 * @module SocialButton
 */
import type React from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

/** Supported social/OAuth providers. */
export const socialProviders = [
  'google',
  'apple',
  'facebook',
  'github',
  'x',
  'microsoft',
  'discord',
  'slack',
] as const;

/** Union of valid social provider values. */
export type SocialProvider = (typeof socialProviders)[number];

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

/** Available social button sizes. */
export const socialButtonSizes = ['sm', 'md', 'lg'] as const;

/** Union of valid social button size values. */
export type SocialButtonSize = (typeof socialButtonSizes)[number];

/** Dimensional config for a social button size step. */
export interface SocialButtonSizeConfig {
  /** Button height in pixels. */
  height: number;
  /** Horizontal padding in pixels. */
  paddingX: number;
  /** Font size in pixels. */
  fontSize: number;
  /** Icon size in pixels. */
  iconSize: number;
  /** Gap between icon and label. */
  gap: number;
}

/** Size → config lookup. */
export const socialButtonSizeMap: Record<SocialButtonSize, SocialButtonSizeConfig> = {
  sm: { height: 36, paddingX: defaultSpacing.lg, fontSize: defaultTypography.sizes.sm.fontSize, iconSize: 18, gap: defaultSpacing.sm },
  md: { height: 40, paddingX: defaultSpacing.lg, fontSize: defaultTypography.sizes.sm.fontSize, iconSize: 20, gap: defaultSpacing.md },
  lg: { height: 44, paddingX: defaultSpacing.xl, fontSize: defaultTypography.sizes.base.fontSize, iconSize: 22, gap: defaultSpacing.md },
};

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

/** Available social button visual styles. */
export const socialButtonVariants = ['filled', 'outline'] as const;

/** Union of valid social button variant values. */
export type SocialButtonVariant = (typeof socialButtonVariants)[number];

// ---------------------------------------------------------------------------
// Provider config
// ---------------------------------------------------------------------------

/** Color + label config for a social provider. */
export interface SocialProviderConfig {
  /** Provider display name. */
  name: string;
  /** Filled background color. */
  bgColor: string;
  /** Filled text color. */
  textColor: string;
  /** Hover background color. */
  bgHover: string;
}

/** Pre-defined provider configs. */
export const socialProviderConfigs: Record<SocialProvider, SocialProviderConfig> = {
  google: {
    name: 'Google',
    bgColor: '#FFFFFF',
    textColor: '#1F1F1F',
    bgHover: '#F2F2F2',
  },
  apple: {
    name: 'Apple',
    bgColor: '#000000',
    textColor: '#FFFFFF',
    bgHover: '#1A1A1A',
  },
  facebook: {
    name: 'Facebook',
    bgColor: '#1877F2',
    textColor: '#FFFFFF',
    bgHover: '#166FE5',
  },
  github: {
    name: 'GitHub',
    bgColor: '#24292F',
    textColor: '#FFFFFF',
    bgHover: '#32383F',
  },
  x: {
    name: 'X',
    bgColor: '#000000',
    textColor: '#FFFFFF',
    bgHover: '#1A1A1A',
  },
  microsoft: {
    name: 'Microsoft',
    bgColor: '#2F2F2F',
    textColor: '#FFFFFF',
    bgHover: '#3D3D3D',
  },
  discord: {
    name: 'Discord',
    bgColor: '#5865F2',
    textColor: '#FFFFFF',
    bgHover: '#4752C4',
  },
  slack: {
    name: 'Slack',
    bgColor: '#4A154B',
    textColor: '#FFFFFF',
    bgHover: '#3C1040',
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link SocialButton} component.
 */
export interface SocialButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Social/OAuth provider determining icon and colors. */
  provider: SocialProvider;

  /**
   * Action label prefix (e.g. "Sign in with", "Continue with", "Sign up with").
   * @default 'Sign in with'
   */
  action?: string;

  /**
   * Visual style.
   * @default 'filled'
   */
  variant?: SocialButtonVariant;

  /**
   * Button size.
   * @default 'md'
   */
  size?: SocialButtonSize;

  /**
   * When `true`, stretches to full container width.
   * @default false
   */
  fullWidth?: boolean;

  /**
   * When `true`, shows only the icon without text.
   * @default false
   */
  iconOnly?: boolean;
}
