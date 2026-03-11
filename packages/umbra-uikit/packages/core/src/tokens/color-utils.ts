/**
 * @module color-utils
 * @description Color manipulation utilities for the Wisp UI kit.
 *
 * Pure functions for runtime color transformations. Every function accepts
 * and returns standard hex or rgba strings, making them safe to use directly
 * in React Native `style` objects or CSS.
 *
 * @example
 * ```ts
 * import { withAlpha, lighten, darken, mixColors } from '@/tokens/color-utils';
 *
 * withAlpha('#A78BFA', 0.5)          // 'rgba(167, 139, 250, 0.5)'
 * lighten('#334155', 0.2)            // lighter hex
 * darken('#A78BFA', 0.15)            // darker hex
 * mixColors('#A78BFA', '#6D28D9', 0.5) // blended hex
 * ```
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a hex string to a 6-character (or 8-character) lowercase form
 * without the leading `#`.
 *
 * @internal
 */
function normaliseHex(hex: string): string {
  let h = hex.replace(/^#/, '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  } else if (h.length === 4) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  }
  return h.toLowerCase();
}

/**
 * Clamp a number between 0 and 255 and round to the nearest integer.
 *
 * @internal
 */
function clamp255(n: number): number {
  return Math.min(255, Math.max(0, Math.round(n)));
}

/**
 * Clamp a number between 0 and 1.
 *
 * @internal
 */
function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

// ---------------------------------------------------------------------------
// hexToRgb
// ---------------------------------------------------------------------------

/**
 * RGB color components.
 */
export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert a hex color string to its RGB components.
 *
 * Accepts 3-, 4-, 6-, or 8-character hex values with or without a leading `#`.
 * Alpha channels in 4- or 8-character hex values are silently ignored.
 *
 * @param hex - A hex color string (e.g. `'#A78BFA'`, `'A78BFA'`, `'#abc'`).
 * @returns An object with `r`, `g`, `b` properties (0-255).
 * @throws {Error} If the input cannot be parsed as a hex color.
 *
 * @example
 * ```ts
 * hexToRgb('#A78BFA') // { r: 167, g: 139, b: 250 }
 * hexToRgb('#fff')    // { r: 255, g: 255, b: 255 }
 * ```
 */
export function hexToRgb(hex: string): RgbColor {
  const h = normaliseHex(hex);
  if (h.length !== 6 && h.length !== 8) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

// ---------------------------------------------------------------------------
// rgbToHex
// ---------------------------------------------------------------------------

/**
 * Convert individual RGB values (0-255) to a 6-character hex string with
 * a leading `#`.
 *
 * Values outside the 0-255 range are clamped automatically.
 *
 * @param r - Red channel (0-255).
 * @param g - Green channel (0-255).
 * @param b - Blue channel (0-255).
 * @returns A hex color string (e.g. `'#a78bfa'`).
 *
 * @example
 * ```ts
 * rgbToHex(167, 139, 250) // '#a78bfa'
 * rgbToHex(0, 0, 0)       // '#000000'
 * rgbToHex(255, 255, 255)  // '#ffffff'
 * ```
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => clamp255(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ---------------------------------------------------------------------------
// withAlpha
// ---------------------------------------------------------------------------

/**
 * Produce an `rgba(...)` string from a hex color and an alpha value.
 *
 * This is the primary way to apply transparency to design-token colors
 * without mutating the original hex value.
 *
 * @param hex   - A hex color string (e.g. `'#A78BFA'`).
 * @param alpha - Opacity value between 0 (transparent) and 1 (opaque).
 * @returns An `rgba(r, g, b, a)` string.
 *
 * @example
 * ```ts
 * withAlpha('#A78BFA', 0.5)  // 'rgba(167, 139, 250, 0.5)'
 * withAlpha('#000', 0.1)     // 'rgba(0, 0, 0, 0.1)'
 * ```
 */
export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  const a = clamp01(alpha);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ---------------------------------------------------------------------------
// lighten
// ---------------------------------------------------------------------------

/**
 * Lighten a hex color by mixing it with white.
 *
 * @param hex    - A hex color string.
 * @param amount - How much to lighten (0 = no change, 1 = pure white).
 * @returns A lightened hex color string.
 *
 * @example
 * ```ts
 * lighten('#334155', 0.2)  // a lighter shade of slate-700
 * lighten('#000000', 0.5)  // '#808080' (mid-gray)
 * lighten('#A78BFA', 0)    // '#a78bfa' (unchanged)
 * ```
 */
export function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const t = clamp01(amount);
  return rgbToHex(
    r + (255 - r) * t,
    g + (255 - g) * t,
    b + (255 - b) * t,
  );
}

// ---------------------------------------------------------------------------
// darken
// ---------------------------------------------------------------------------

/**
 * Darken a hex color by mixing it with black.
 *
 * @param hex    - A hex color string.
 * @param amount - How much to darken (0 = no change, 1 = pure black).
 * @returns A darkened hex color string.
 *
 * @example
 * ```ts
 * darken('#A78BFA', 0.15)  // a slightly deeper violet
 * darken('#ffffff', 0.5)   // '#808080' (mid-gray)
 * darken('#A78BFA', 0)     // '#a78bfa' (unchanged)
 * ```
 */
export function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const t = clamp01(amount);
  return rgbToHex(
    r * (1 - t),
    g * (1 - t),
    b * (1 - t),
  );
}

// ---------------------------------------------------------------------------
// mixColors
// ---------------------------------------------------------------------------

/**
 * Linearly interpolate between two hex colors.
 *
 * @param color1 - The starting hex color.
 * @param color2 - The ending hex color.
 * @param ratio  - Blend ratio (0 = 100% color1, 1 = 100% color2).
 * @returns A blended hex color string.
 *
 * @example
 * ```ts
 * mixColors('#A78BFA', '#6D28D9', 0.5) // midpoint between primary & secondary
 * mixColors('#000000', '#ffffff', 0.25) // 25% white => dark gray
 * mixColors('#ff0000', '#0000ff', 0.5)  // purple-ish blend
 * ```
 */
export function mixColors(color1: string, color2: string, ratio: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const t = clamp01(ratio);
  return rgbToHex(
    c1.r + (c2.r - c1.r) * t,
    c1.g + (c2.g - c1.g) * t,
    c1.b + (c2.b - c1.b) * t,
  );
}
