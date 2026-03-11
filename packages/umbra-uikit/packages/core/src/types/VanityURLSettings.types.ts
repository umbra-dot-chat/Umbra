/**
 * @module types/VanityURLSettings
 * @description Type definitions for the VanityURLSettings component.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Availability Status
// ---------------------------------------------------------------------------

/** Possible states for vanity URL availability checking. */
export const vanityUrlAvailabilityStates = ['available', 'taken', 'checking', 'invalid'] as const;

/** Union of valid vanity URL availability states. */
export type VanityUrlAvailability = (typeof vanityUrlAvailabilityStates)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link VanityURLSettings} component.
 *
 * @remarks
 * Renders an input for setting a vanity URL slug with availability checking.
 */
export interface VanityURLSettingsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** The current slug value. */
  currentSlug?: string;

  /**
   * Base URL prefix displayed before the slug input.
   * @default 'umbra.app/c/'
   */
  baseUrl?: string;

  /** Callback fired when the slug value changes. */
  onChange?: (slug: string) => void;

  /** Callback fired when the check availability button is clicked. */
  onCheck?: (slug: string) => void;

  /** Callback fired when the save button is clicked. */
  onSave?: (slug: string) => void;

  /** Current availability status of the slug. */
  availability?: VanityUrlAvailability;

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
