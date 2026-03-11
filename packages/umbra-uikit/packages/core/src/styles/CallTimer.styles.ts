/**
 * @module styles/CallTimer
 * @description Pure style-builder functions for the CallTimer primitive.
 */

import type { WispTheme } from '../theme/types';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface CallTimerColors {
  text: string;
}

export function resolveCallTimerColors(
  theme: WispTheme,
): CallTimerColors {
  return {
    text: theme.colors.text.secondary,
  };
}
