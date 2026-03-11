/**
 * @module types/E2EEKeyExchangeUI
 * @description Type definitions for the E2EE key exchange status component.
 */

import type React from 'react';

export type KeyExchangeStatus = 'pending' | 'active' | 'rotating' | 'error';

export interface E2EEKeyExchangeUIProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current key exchange status. */
  status: KeyExchangeStatus;
  /** Current key version number. */
  keyVersion?: number;
  /** Error message (when status is 'error'). */
  errorMessage?: string;
  /** Called when retry is clicked (on error). */
  onRetry?: () => void;
  /** Called when rotate key is clicked. */
  onRotateKey?: () => void;
  /** Whether key rotation is in progress. @default false */
  rotating?: boolean;
  /** Show as a compact banner instead of a card. @default false */
  compact?: boolean;
  /** Skeleton state. @default false */
  skeleton?: boolean;
}
