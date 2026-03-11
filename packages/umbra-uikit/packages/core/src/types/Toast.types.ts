import type React from 'react';
import type { SurfaceVariant } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Toast Variants
// ---------------------------------------------------------------------------

/** Available toast color variant tokens. */
export const toastVariants = ['default', 'success', 'warning', 'danger', 'info'] as const;

/** Union of valid toast variant values derived from {@link toastVariants}. */
export type ToastVariant = (typeof toastVariants)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Toast} component.
 *
 * @remarks
 * Extends the native `<div>` element attributes so any valid HTML div
 * prop (e.g. `aria-*`, `data-*`) can be forwarded. The component renders
 * with `role="alert"` by default.
 */
export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Semantic color variant applied to background, border, and text.
   * @default 'default'
   */
  variant?: ToastVariant;
  /**
   * Surface rendering variant.
   * - `'solid'` (default) -- opaque background matching the semantic variant.
   * - `'glass'` -- frosted-glass / glassmorphism effect.
   * @default 'solid'
   */
  surface?: SurfaceVariant;
  /** Primary notification text (required). */
  title: string;
  /** Optional secondary description text displayed below the title. */
  description?: string;
  /** Optional leading icon element rendered before the content column. */
  icon?: React.ReactNode;
  /** Optional trailing action element (e.g. a {@link Button}) rendered after the content. */
  action?: React.ReactNode;
  /** Callback fired when the dismiss button is clicked. */
  onDismiss?: () => void;
  /**
   * Whether the dismiss (X) button is rendered when {@link ToastProps.onDismiss} is provided.
   * @default true
   */
  dismissible?: boolean;
}
