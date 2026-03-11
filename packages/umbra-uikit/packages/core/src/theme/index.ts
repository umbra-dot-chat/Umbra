/**
 * @module theme
 * @description Barrel export for the Wisp theme system.
 *
 * Re-exports theme types, the dark and light color palettes,
 * the theme factory, and CSS custom-property utilities.
 *
 * @example
 * ```ts
 * import {
 *   type WispTheme,
 *   type ThemeMode,
 *   createTheme,
 *   darkColors,
 *   lightColors,
 *   themeToCssVars,
 * } from '@wisp-ui/core/theme';
 * ```
 */

export * from './types';
export * from './create-theme';
export * from './dark';
export * from './light';
export * from './css-vars';
export * from './editor-fields';
