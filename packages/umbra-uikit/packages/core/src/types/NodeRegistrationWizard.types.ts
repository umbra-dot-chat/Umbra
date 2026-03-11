import type React from 'react';
import type { BoostNodeType } from './BoostNodeDashboard.types';

// ---------------------------------------------------------------------------
// Registration Data
// ---------------------------------------------------------------------------

/**
 * Data model for a new node registration submission.
 */
export interface NodeRegistrationData {
  /** Human-readable display name for the node. */
  name: string;
  /** Deployment type — local or remote. */
  nodeType: BoostNodeType;
  /** Maximum storage capacity in bytes. */
  maxStorageBytes: number;
  /** Maximum bandwidth limit in Mbps. */
  maxBandwidthMbps: number;
}

// ---------------------------------------------------------------------------
// Wizard Steps
// ---------------------------------------------------------------------------

/** Tuple of all wizard step identifiers. */
export const wizardSteps = ['type', 'configure', 'review'] as const;

/** Union of wizard step identifiers. */
export type WizardStep = (typeof wizardSteps)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link NodeRegistrationWizard} component.
 *
 * @remarks
 * Extends the native `HTMLDivElement` attributes so standard DOM props such as
 * `className`, `id`, and event handlers are forwarded to the root element.
 */
export interface NodeRegistrationWizardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether the wizard dialog is open. */
  open: boolean;
  /** Callback fired when the wizard is closed. */
  onClose: () => void;
  /** Callback fired when registration is completed. */
  onComplete?: (data: NodeRegistrationData) => void;
  /** Whether the form is currently submitting. */
  submitting?: boolean;
  /** Error message to display. */
  error?: string;
  /** Generated public key shown on the review step. */
  generatedPublicKey?: string;
}
