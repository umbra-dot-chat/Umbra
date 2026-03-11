/**
 * DevicePicker style helpers.
 */

import type { WispTheme } from '../theme/types';

export function resolveDevicePickerLabel(kind: 'audioinput' | 'videoinput' | 'audiooutput'): string {
  switch (kind) {
    case 'audioinput': return 'Microphone';
    case 'videoinput': return 'Camera';
    case 'audiooutput': return 'Speaker';
  }
}

export function resolvePickerBackground(theme: WispTheme): string {
  return theme.colors.background.surface;
}
