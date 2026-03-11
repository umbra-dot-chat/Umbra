/**
 * @module types/WarningDialog
 * @description Type definitions for the WarningDialog component --
 * a dialog form for issuing a warning to a community member.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the WarningDialog component.
 */
export interface WarningDialogProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  /** Whether the dialog is open. */
  open: boolean;

  /** Called when the dialog should close. */
  onClose: () => void;

  /** Target member name. */
  memberName: string;

  /** Target member avatar. */
  memberAvatar?: React.ReactNode;

  /** Called when the form is submitted with warning data. */
  onSubmit?: (data: { reason: string; expiresAt?: string }) => void;

  /** Whether submission is in progress. @default false */
  submitting?: boolean;

  /** Error message to display. */
  error?: string;

  /** Dialog title. @default 'Issue Warning' */
  title?: string;
}
