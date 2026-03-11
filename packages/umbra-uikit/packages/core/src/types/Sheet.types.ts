/**
 * Type definitions for the Wisp Sheet (bottom sheet) primitive.
 *
 * @remarks
 * A mobile-style bottom sheet that slides up from the viewport bottom with a
 * drag handle to pull it back down.
 *
 * @module primitives/sheet/types
 */

import type React from 'react';
import type { SurfaceVariant } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Size variants -- controls the max height
// ---------------------------------------------------------------------------

/** All valid sheet size variant keys. */
export const sheetSizes = ['sm', 'md', 'lg', 'full'] as const;

/** A sheet height preset -- `'sm'` | `'md'` | `'lg'` | `'full'`. */
export type SheetSize = (typeof sheetSizes)[number];

/** CSS `max-height` value for each {@link SheetSize} variant. */
export const sheetSizeMap: Record<SheetSize, string> = {
  sm: '40vh',
  md: '60vh',
  lg: '80vh',
  full: '100vh',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props accepted by the {@link Sheet} component. */
export interface SheetProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Whether the sheet is currently open. */
  open: boolean;

  /** Callback fired when the sheet requests to close (drag, Escape, overlay click). */
  onClose: () => void;

  /**
   * Maximum height preset for the sheet panel.
   * @default 'md'
   */
  size?: SheetSize;

  /**
   * Surface rendering variant.
   * - `'solid'` (default) -- opaque raised background.
   * - `'glass'` -- frosted-glass / glassmorphism effect.
   * @default 'solid'
   */
  variant?: SurfaceVariant;

  /**
   * Whether to render the dimmed overlay backdrop behind the sheet.
   * @default true
   */
  overlay?: boolean;

  /**
   * Whether clicking the overlay backdrop closes the sheet.
   * @default true
   */
  closeOnOverlayClick?: boolean;

  /**
   * Whether pressing the Escape key closes the sheet.
   * @default true
   */
  closeOnEscape?: boolean;

  /** Content rendered inside the sheet panel. */
  children?: React.ReactNode;
}
