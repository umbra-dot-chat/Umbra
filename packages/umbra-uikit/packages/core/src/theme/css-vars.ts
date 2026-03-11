/**
 * @module theme/css-vars
 * @description CSS custom property utilities for the Wisp theme system.
 *
 * These functions convert the semantic {@link ThemeColors} object into flat
 * CSS custom-property declarations using the `--wisp-<group>-<token>` naming
 * convention, and apply them to the document root element.
 *
 * Framework-agnostic — works in any environment with `document` access.
 */

import type { ThemeColors } from './types';

/**
 * Flatten the `ThemeColors` object into a flat record of CSS custom-property
 * declarations using the `--wisp-<group>-<token>` naming convention.
 *
 * @param colors - The resolved semantic color map.
 * @returns A flat `Record<string, string>` of CSS variable name to value.
 */
export function colorsToCssVars(colors: ThemeColors): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const [group, tokens] of Object.entries(colors)) {
    for (const [token, value] of Object.entries(
      tokens as Record<string, string>,
    )) {
      vars[`--wisp-${group}-${token}`] = value;
    }
  }

  return vars;
}

/**
 * Apply CSS custom-property declarations to the document root element.
 *
 * This is a no-op when running outside of a browser environment
 * (e.g. React Native or SSR).
 *
 * @param vars - Flat CSS variable map produced by {@link colorsToCssVars}.
 */
export function applyCssVars(vars: Record<string, string>): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  for (const [prop, value] of Object.entries(vars)) {
    root.style.setProperty(prop, value);
  }
}
