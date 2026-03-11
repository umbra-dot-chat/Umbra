/**
 * @module components/screen-share-picker
 * @description Type definitions for the ScreenSharePicker component.
 *
 * A dialog for selecting which screen, window, or tab to share.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Source types
// ---------------------------------------------------------------------------

/** Available types for a screen share source. */
export const screenShareSourceTypes = ['screen', 'window', 'tab'] as const;

/** Union of screen share source type values. */
export type ScreenShareSourceType = (typeof screenShareSourceTypes)[number];

// ---------------------------------------------------------------------------
// Source
// ---------------------------------------------------------------------------

/**
 * Describes a single screen share source (screen, window, or tab).
 */
export interface ScreenShareSource {
  /** Unique identifier for this source. */
  id: string;
  /** Display name for this source (e.g. window title). */
  name: string;
  /** Optional thumbnail preview element. */
  thumbnail?: React.ReactNode;
  /** Type of share source. */
  type: ScreenShareSourceType;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link ScreenSharePicker} component.
 *
 * @remarks
 * Extends the native `<div>` element attributes (excluding `onSelect`)
 * so any valid HTML div prop can be forwarded.
 */
export interface ScreenSharePickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Whether the picker dialog is open. */
  open: boolean;

  /** Callback fired when the dialog should close. */
  onClose: () => void;

  /** Available screen share sources to display. */
  sources?: ScreenShareSource[];

  /** Callback fired when a source is selected. */
  onSelect?: (sourceId: string) => void;

  /**
   * Title text displayed at the top of the picker.
   * @default 'Share Your Screen'
   */
  title?: string;

  /**
   * When `true`, shows a loading spinner instead of source cards.
   * @default false
   */
  loading?: boolean;

  /**
   * When `true`, renders a pulsing skeleton placeholder instead of content.
   * @default false
   */
  skeleton?: boolean;
}
