/**
 * @module styles/TextEffectPicker
 * @description Color resolution for the TextEffectPicker component.
 */

import type { WispTheme as Theme } from '../theme/types';

export interface TextEffectPickerColors {
  /** Backdrop / container background. */
  bg: string;
  /** Border color. */
  border: string;
  /** Card background (normal). */
  cardBg: string;
  /** Card background (hovered / pressed). */
  cardBgHover: string;
  /** Card background (selected). */
  cardBgSelected: string;
  /** Card border (selected). */
  cardBorderSelected: string;
  /** Effect label text. */
  label: string;
  /** Effect description text. */
  description: string;
  /** Divider between header and grid. */
  divider: string;
  /** Header text ("Send with effect"). */
  header: string;
}

export function resolveTextEffectPickerColors(theme: Theme): TextEffectPickerColors {
  const isDark = theme.mode === 'dark';

  return {
    bg: isDark ? '#1e1e2e' : '#ffffff',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    cardBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    cardBgHover: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    cardBgSelected: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.10)',
    cardBorderSelected: isDark ? '#818cf8' : '#6366f1',
    label: isDark ? '#e2e8f0' : '#1e293b',
    description: isDark ? '#94a3b8' : '#64748b',
    divider: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    header: isDark ? '#cbd5e1' : '#334155',
  };
}
