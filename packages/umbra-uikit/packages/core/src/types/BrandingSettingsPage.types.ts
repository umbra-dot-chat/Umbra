/**
 * @module types/BrandingSettingsPage
 * @description Type definitions for the BrandingSettingsPage component.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link BrandingSettingsPage} component.
 *
 * @remarks
 * Provides a full-page settings experience for community branding,
 * including icon, banner, splash uploads, accent color selection,
 * and custom CSS editing.
 */
export interface BrandingSettingsPageProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Current icon image URL. */
  iconUrl?: string;

  /** Current banner image URL. */
  bannerUrl?: string;

  /** Current splash image URL. */
  splashUrl?: string;

  /**
   * Current accent color hex value.
   * @default '#6366f1'
   */
  accentColor?: string;

  /** Current custom CSS string. */
  customCss?: string;

  /** Callback fired when a new icon file is selected. */
  onIconChange?: (file: File) => void;

  /** Callback fired when a new banner file is selected. */
  onBannerChange?: (file: File) => void;

  /** Callback fired when a new splash file is selected. */
  onSplashChange?: (file: File) => void;

  /** Callback fired when the accent color changes. */
  onAccentColorChange?: (color: string) => void;

  /** Callback fired when the custom CSS content changes. */
  onCustomCssChange?: (css: string) => void;

  /** Callback fired when the save button is clicked. */
  onSave?: () => void;

  /**
   * When `true`, the save button shows a loading state.
   * @default false
   */
  saving?: boolean;

  /**
   * When `true`, renders a pulsing skeleton placeholder instead of content.
   * @default false
   */
  skeleton?: boolean;
}
