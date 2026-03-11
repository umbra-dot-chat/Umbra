/**
 * @module types/CallTimer
 * @description Type definitions for the CallTimer primitive.
 *
 * A live-updating timer that displays call duration in "0:00" or "1:23:45" format.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Enums & constants
// ---------------------------------------------------------------------------

export const callTimerSizes = ['sm', 'md'] as const;
export type CallTimerSize = (typeof callTimerSizes)[number];

// ---------------------------------------------------------------------------
// Size config
// ---------------------------------------------------------------------------

export interface CallTimerSizeConfig {
  fontSize: number;
  lineHeight: number;
}

export const callTimerSizeMap: Record<CallTimerSize, CallTimerSizeConfig> = {
  sm: { fontSize: 12, lineHeight: 16 },
  md: { fontSize: 14, lineHeight: 20 },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CallTimerProps {
  /** Unix timestamp (ms) when the call started. */
  startedAt: number;
  /** Size variant. @default 'md' */
  size?: CallTimerSize;
  /** Custom text color. */
  color?: string;
  /** Additional style override. */
  style?: React.CSSProperties;
}
