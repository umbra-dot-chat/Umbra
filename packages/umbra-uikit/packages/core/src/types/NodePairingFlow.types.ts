import type React from 'react';

// ---------------------------------------------------------------------------
// Pairing Status
// ---------------------------------------------------------------------------

/** Tuple of all supported {@link PairingStatus} values. */
export const pairingStatuses = ['idle', 'waiting', 'connected', 'failed'] as const;

/**
 * Union of supported pairing progress states.
 */
export type PairingStatus = (typeof pairingStatuses)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link NodePairingFlow} component.
 *
 * @remarks
 * Extends the native `HTMLDivElement` attributes so standard DOM props such as
 * `className`, `id`, and event handlers are forwarded to the root element.
 */
export interface NodePairingFlowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether the pairing dialog is open. */
  open: boolean;
  /** Callback fired when the dialog is closed. */
  onClose: () => void;
  /** The pairing token to display as QR code and text. */
  pairingToken?: string;
  /** The remote address of the node being paired. */
  remoteAddress?: string;
  /** Callback fired to generate a new pairing token. */
  onGenerateToken?: () => void;
  /** Callback fired to verify a manually entered pairing token. */
  onVerifyPairing?: (token: string) => void;
  /** Current status of the pairing process. @default 'idle' */
  pairingStatus?: PairingStatus;
  /** Error message to display. */
  error?: string;
}
