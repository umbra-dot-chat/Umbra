/**
 * Theme registry — central list of all available theme presets.
 */

import type { ThemePreset } from './types';
import {
  draculaTheme,
  tokyoNightTheme,
  monokaiTheme,
  nordTheme,
  catppuccinMochaTheme,
  gruvboxDarkTheme,
  solarizedDarkTheme,
  oneDarkTheme,
  rosePineTheme,
  synthwaveTheme,
} from './presets';

/** All built-in theme presets, ordered for the selector dropdown. */
export const THEME_REGISTRY: ThemePreset[] = [
  draculaTheme,
  tokyoNightTheme,
  monokaiTheme,
  nordTheme,
  catppuccinMochaTheme,
  gruvboxDarkTheme,
  solarizedDarkTheme,
  oneDarkTheme,
  rosePineTheme,
  synthwaveTheme,
];

/** Look up a theme by ID. Returns `undefined` if not found. */
export function getThemeById(id: string): ThemePreset | undefined {
  return THEME_REGISTRY.find((t) => t.id === id);
}
