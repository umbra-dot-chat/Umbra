/**
 * @module Overlay.types
 *
 * Type definitions for the Wisp Overlay layout primitive.
 *
 * @remarks
 * Overlay provides a full-screen backdrop with z-index management and
 * body-scroll locking. Used by Lightbox, LoadingOverlay, CommandPalette, etc.
 */

import type React from 'react';
import type { ZIndexKey } from '../tokens/z-index';

// ---------------------------------------------------------------------------
// Backdrop variants
// ---------------------------------------------------------------------------

/** Available overlay backdrop visual styles. */
export const overlayBackdrops = ['dim', 'blur', 'transparent'] as const;

/** Union of overlay backdrop style keys. */
export type OverlayBackdrop = (typeof overlayBackdrops)[number];

// ---------------------------------------------------------------------------
// OverlayProps
// ---------------------------------------------------------------------------

/** Props for the {@link Overlay} component. */
export interface OverlayProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Content to render above the backdrop. */
  children?: React.ReactNode;

  /** Whether the overlay is visible. @default false */
  open?: boolean;

  /** Backdrop style. @default 'dim' */
  backdrop?: OverlayBackdrop;

  /** Z-index layer from the theme z-index scale. @default 'overlay' */
  zIndex?: ZIndexKey;

  /** Custom z-index number (overrides `zIndex` layer). */
  zIndexValue?: number;

  /** Lock body scroll when open. @default true */
  lockScroll?: boolean;

  /** Center children within the overlay. @default true */
  center?: boolean;

  /** Called when the backdrop area is clicked (not the children). */
  onBackdropClick?: () => void;

  /** Whether pressing Escape should trigger onBackdropClick. @default true */
  closeOnEscape?: boolean;

  /** Portal container for rendering. When undefined, renders in-place. */
  portalContainer?: HTMLElement;
}
