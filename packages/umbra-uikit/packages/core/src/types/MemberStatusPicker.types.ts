/**
 * @module MemberStatusPicker
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

/** Data shape for a custom member status. */
export interface MemberStatusData {
  /** Custom status text. */
  text?: string;
  /** Emoji character or shortcode. */
  emoji?: string;
  /** ISO date string or duration key for expiry, null = never expires. */
  expiresAt?: string | null;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link MemberStatusPicker} component.
 *
 * @remarks
 * A picker for setting custom status (text + emoji + expiry).
 * Renders as a dialog/popover with emoji selection, text input,
 * expiry dropdown, and action buttons.
 */
export interface MemberStatusPickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  /**
   * Whether the picker dialog is open.
   */
  open: boolean;

  /**
   * Callback fired when the picker is closed.
   */
  onClose: () => void;

  /**
   * Callback fired when the user saves their status.
   */
  onSubmit?: (data: MemberStatusData) => void;

  /**
   * Callback fired when the user clears their status.
   */
  onClear?: () => void;

  /**
   * Current status data to pre-populate the picker.
   */
  currentStatus?: MemberStatusData;

  /**
   * When true, disables the save button and shows a loading state.
   * @default false
   */
  submitting?: boolean;

  /**
   * Title text for the picker dialog.
   * @default 'Set Status'
   */
  title?: string;

  /**
   * Preset options for the expiry dropdown.
   * @example [{label:'1 hour',value:'1h'},{label:'Today',value:'today'},{label:'Never',value:null}]
   */
  expiryPresets?: Array<{ label: string; value: string | null }>;
}
