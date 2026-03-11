/**
 * @module types/TimeoutDialog
 * @description Type definitions for the TimeoutDialog component --
 * a dialog for temporarily timing out (muting) a community member.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Sub-types
// ---------------------------------------------------------------------------

/** The type of timeout action. */
export type TimeoutType = 'mute' | 'restrict';

/** A preset duration option for the timeout selector. */
export interface TimeoutDurationPreset {
  label: string;
  value: number;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the TimeoutDialog component.
 */
export interface TimeoutDialogProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  /** Whether the dialog is open. */
  open: boolean;

  /** Called when the dialog should close. */
  onClose: () => void;

  /** Target member name. */
  memberName: string;

  /** Target member avatar. */
  memberAvatar?: React.ReactNode;

  /** Called when the form is submitted with timeout data. */
  onSubmit?: (data: { duration: number; reason?: string; type: TimeoutType }) => void;

  /** Whether submission is in progress. @default false */
  submitting?: boolean;

  /** Error message to display. */
  error?: string;

  /** Dialog title. @default 'Timeout Member' */
  title?: string;

  /** Preset duration options in seconds. */
  durationPresets?: TimeoutDurationPreset[];
}
