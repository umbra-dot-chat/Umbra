/**
 * Type definitions for the Wisp Dialog primitive.
 *
 * @module primitives/dialog/types
 */

import type React from 'react';
import type { SurfaceVariant } from '../tokens/shared';
import type { ThemeMode } from '../theme/types';

// ---------------------------------------------------------------------------
// Size variants
// ---------------------------------------------------------------------------

/** All valid dialog size variant keys. */
export const dialogSizes = ['sm', 'md', 'lg'] as const;

/** A dialog width preset -- `'sm'` | `'md'` | `'lg'`. */
export type DialogSize = (typeof dialogSizes)[number];

/** Pixel max-width for each {@link DialogSize} variant. */
export const dialogSizeMap: Record<DialogSize, number> = {
  sm: 400,
  md: 520,
  lg: 640,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props accepted by the {@link Dialog} component. */
export interface DialogProps {
  /** Whether the dialog is currently open. */
  open: boolean;

  /** Callback fired when the dialog requests to close (e.g. Escape, overlay click). */
  onClose: () => void;

  /** Title text displayed in the dialog header. */
  title: string;

  /** Optional descriptive text displayed below the title. */
  description?: string;

  /**
   * Optional icon or element rendered above the title.
   * Commonly used for a featured icon circle (e.g. destructive, warning).
   */
  icon?: React.ReactNode;

  /** Body content rendered inside the scrollable area. */
  children?: React.ReactNode;

  /** Footer content, typically action buttons like "Cancel" and "Confirm". */
  footer?: React.ReactNode;

  /**
   * Width preset for the dialog panel.
   * @default 'md'
   */
  size?: DialogSize;

  /**
   * Surface rendering variant.
   * - `'solid'` (default) -- opaque raised background.
   * - `'glass'` -- frosted-glass / glassmorphism effect.
   * @default 'solid'
   */
  variant?: SurfaceVariant;

  /**
   * Whether clicking the overlay backdrop closes the dialog.
   * @default true
   */
  closeOnOverlayClick?: boolean;

  /**
   * Whether pressing the Escape key closes the dialog.
   * @default true
   */
  closeOnEscape?: boolean;

  /**
   * Whether to render the close (X) button in the header.
   * @default true
   */
  showCloseButton?: boolean;

  /**
   * Force a specific theme mode for all child components inside the dialog.
   *
   * @remarks
   * Dialogs render on a `background.raised` surface which is always dark in
   * both light and dark themes.  When the app is in light mode, child
   * components (Toggle, Slider, Select, etc.) may render with light-mode
   * colors that are invisible on the dark raised background.
   *
   * Set `forceMode="dark"` to wrap dialog children in a nested
   * `WispProvider` that overrides the theme mode, ensuring all interactive
   * controls render with dark-mode colors regardless of the app's active
   * theme.
   *
   * When `undefined` (default), no mode override is applied and children
   * inherit the ambient theme.
   */
  forceMode?: ThemeMode;

  /** Additional CSS class name applied to the dialog panel. */
  className?: string;

  /** Additional inline styles merged onto the dialog panel. */
  style?: React.CSSProperties;
}
