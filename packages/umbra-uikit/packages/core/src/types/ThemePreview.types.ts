/**
 * @module types/ThemePreview
 * @description Type definitions for the ThemePreview component.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link ThemePreview} component.
 *
 * @remarks
 * Renders a self-contained Card showing a mini mockup of a community
 * with the applied accent color and custom CSS. Used alongside
 * BrandingSettingsPage for live theme previewing.
 */
export interface ThemePreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accent color hex applied to header and highlights. */
  accentColor?: string;

  /** Custom CSS string applied via a scoped style tag. */
  customCss?: string;

  /** Community name displayed in the preview header. */
  communityName?: string;

  /** Optional community icon rendered in the preview header. */
  communityIcon?: React.ReactNode;

  /**
   * When `true`, renders a pulsing skeleton placeholder instead of content.
   * @default false
   */
  skeleton?: boolean;
}
