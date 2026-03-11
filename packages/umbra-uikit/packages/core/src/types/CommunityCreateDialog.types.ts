/**
 * @module types/CommunityCreateDialog
 * @description Type definitions for the CommunityCreateDialog component —
 * a dialog for creating new communities with name, description, and icon.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the CommunityCreateDialog component.
 */
export interface CommunityCreateDialogProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  /** Whether the dialog is open. */
  open: boolean;

  /** Called when the dialog should close. */
  onClose: () => void;

  /** Called when the form is submitted with community data. */
  onSubmit?: (data: CommunityCreateData) => void;

  /** Whether submission is in progress. @default false */
  submitting?: boolean;

  /** Error message to display (e.g. "Name already taken"). */
  error?: string;

  /** Dialog title. @default 'Create Community' */
  title?: string;

  /** Max name length. @default 100 */
  maxNameLength?: number;

  /** Max description length. @default 1000 */
  maxDescriptionLength?: number;

  /** Show loading skeleton. @default false */
  skeleton?: boolean;
}

/** Data submitted when creating a community. */
export interface CommunityCreateData {
  /** Community name. */
  name: string;
  /** Community description. */
  description: string;
  /** Selected icon file (if any). */
  iconFile?: File;
}
