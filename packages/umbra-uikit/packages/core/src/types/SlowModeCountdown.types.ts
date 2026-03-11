/**
 * @module types/SlowModeCountdown
 * @description Type definitions for the SlowModeCountdown component.
 */

import type React from 'react';

export interface SlowModeCountdownProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Remaining seconds until the user can send again. */
  remaining: number;
  /** Called when countdown reaches 0. */
  onComplete?: () => void;
  /** Visual size. @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Show as inline text or as a circular indicator. @default 'inline' */
  variant?: 'inline' | 'circular';
}
