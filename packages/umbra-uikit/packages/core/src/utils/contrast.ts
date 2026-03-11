/**
 * @module utils/contrast
 * @description WCAG 2.1 contrast ratio utilities for automated accessibility testing.
 *
 * Used by both Storybook stories (visual badges) and unit tests (automated audits).
 */

// ---------------------------------------------------------------------------
// Color parsing
// ---------------------------------------------------------------------------

/** Parse a hex color (#RGB, #RRGGBB) into [r, g, b] 0-255 */
export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ---------------------------------------------------------------------------
// Luminance
// ---------------------------------------------------------------------------

/** Relative luminance per WCAG 2.1 (0 = darkest, 1 = lightest) */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ---------------------------------------------------------------------------
// Contrast ratio
// ---------------------------------------------------------------------------

/** WCAG contrast ratio between two hex colors (range: 1:1 to 21:1) */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// WCAG pass helpers
// ---------------------------------------------------------------------------

export type WcagLevel = 'AAA' | 'AA' | 'AA-large' | 'fail';

/** Determine the highest WCAG level a contrast ratio passes */
export function wcagLevel(ratio: number): WcagLevel {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA-large';
  return 'fail';
}

/** Check if fg on bg passes WCAG AA for normal text (4.5:1) */
export function passesAA(fg: string, bg: string): boolean {
  return contrastRatio(fg, bg) >= 4.5;
}

/** Check if fg on bg passes WCAG AA for large text (3:1) */
export function passesAALarge(fg: string, bg: string): boolean {
  return contrastRatio(fg, bg) >= 3;
}

/** Check if fg on bg passes WCAG AAA for normal text (7:1) */
export function passesAAA(fg: string, bg: string): boolean {
  return contrastRatio(fg, bg) >= 7;
}

// ---------------------------------------------------------------------------
// Best text color picker
// ---------------------------------------------------------------------------

/** Pick white or near-black text based on which has better contrast against bg */
export function bestTextColor(bgHex: string): '#FFFFFF' | '#0F1219' {
  const whiteRatio = contrastRatio(bgHex, '#FFFFFF');
  const blackRatio = contrastRatio(bgHex, '#0F1219');
  return whiteRatio > blackRatio ? '#FFFFFF' : '#0F1219';
}

// ---------------------------------------------------------------------------
// Batch audit helper (for tests)
// ---------------------------------------------------------------------------

export interface ContrastPair {
  fg: string;
  bg: string;
  label: string;
}

export interface ContrastAuditResult extends ContrastPair {
  ratio: number;
  level: WcagLevel;
  passesAA: boolean;
  passesAALarge: boolean;
}

/** Audit a batch of fg/bg pairs and return results */
export function auditContrast(pairs: ContrastPair[]): ContrastAuditResult[] {
  return pairs.map((pair) => {
    const ratio = contrastRatio(pair.fg, pair.bg);
    return {
      ...pair,
      ratio,
      level: wcagLevel(ratio),
      passesAA: ratio >= 4.5,
      passesAALarge: ratio >= 3,
    };
  });
}
