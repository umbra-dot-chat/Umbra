import type React from 'react';

// ---------------------------------------------------------------------------
// Alert Variants
// ---------------------------------------------------------------------------

/** Tuple of all supported {@link AlertVariant} values. */
export const alertVariants = ['default', 'info', 'success', 'warning', 'danger'] as const;

/**
 * Union of supported alert colour-scheme variants.
 *
 * @remarks
 * Derived from the {@link alertVariants} tuple so the two stay in sync automatically.
 */
export type AlertVariant = (typeof alertVariants)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Alert} component.
 *
 * @remarks
 * Extends the native `HTMLDivElement` attributes so standard DOM props such as
 * `className`, `id`, and event handlers are forwarded to the root element.
 */
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant controlling the alert colour scheme. @default 'default' */
  variant?: AlertVariant;
  /** Bold title rendered above the description text. */
  title?: string;
  /** Body / description text displayed beneath the title. */
  description?: string;
  /** Leading icon element rendered to the left of the content area. */
  icon?: React.ReactNode;
  /** Optional trailing action element (e.g. a {@link Button}) aligned to the right. */
  action?: React.ReactNode;
  /** Fallback body content rendered when the `description` prop is omitted. */
  children?: React.ReactNode;
}
