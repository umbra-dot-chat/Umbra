/**
 * @module typography
 * @description Typography tokens for the Wisp UI kit.
 *
 * Covers font families, font sizes, font weights, line heights, and letter
 * spacing. All values are platform-aware: font families fall back through
 * a system font stack that works on iOS, Android, and the web.
 *
 * @example
 * ```tsx
 * import { fontFamilies, fontSizes, fontWeights, lineHeights } from '@/tokens';
 *
 * <Text
 *   style={{
 *     fontFamily: fontFamilies.sans,
 *     fontSize: fontSizes.lg,
 *     fontWeight: fontWeights.semibold,
 *     lineHeight: lineHeights.relaxed,
 *   }}
 * >
 *   Welcome to Wisp
 * </Text>
 * ```
 */

// ---------------------------------------------------------------------------
// Font families
// ---------------------------------------------------------------------------

/**
 * System font stacks that ensure native-quality rendering on every platform.
 *
 * - `sans` - default UI typeface
 * - `serif` - editorial / long-form reading
 * - `mono` - code blocks, technical content
 *
 * @example
 * ```ts
 * fontFamilies.sans  // '-apple-system, BlinkMacSystemFont, ...'
 * fontFamilies.mono  // '"SF Mono", "Fira Code", ...'
 * ```
 */
export const fontFamilies = {
  /** System sans-serif stack for UI text */
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
  /** System serif stack for editorial content */
  serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
  /** Monospaced stack for code and technical content */
  mono: '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
} as const;

// ---------------------------------------------------------------------------
// Font sizes
// ---------------------------------------------------------------------------

/**
 * Font size scale in pixels.
 *
 * Named with t-shirt sizing for ergonomic access. Numeric prefixed sizes
 * (`2xs`, `2xl`, etc.) extend both ends of the scale.
 *
 * | Token | px  | Typical use              |
 * |-------|-----|--------------------------|
 * | 2xs   | 10  | Fine-print, footnotes    |
 * | xs    | 12  | Captions, labels         |
 * | sm    | 14  | Secondary body text      |
 * | md    | 16  | Primary body text        |
 * | lg    | 18  | Subtitles                |
 * | xl    | 20  | Section headings         |
 * | 2xl   | 24  | Card titles              |
 * | 3xl   | 30  | Page headings            |
 * | 4xl   | 36  | Hero headings            |
 * | 5xl   | 48  | Display / marketing      |
 *
 * @example
 * ```ts
 * fontSizes.md  // 16
 * fontSizes['3xl'] // 30
 * ```
 */
export const fontSizes = {
  /** 10 px - fine-print, footnotes */
  '2xs': 10,
  /** 12 px - captions, labels */
  xs: 12,
  /** 14 px - secondary body text */
  sm: 14,
  /** 16 px - primary body text (base) */
  md: 16,
  /** 18 px - subtitles */
  lg: 18,
  /** 20 px - section headings */
  xl: 20,
  /** 24 px - card titles */
  '2xl': 24,
  /** 30 px - page headings */
  '3xl': 30,
  /** 36 px - hero headings */
  '4xl': 36,
  /** 48 px - display / marketing */
  '5xl': 48,
} as const;

// ---------------------------------------------------------------------------
// Font weights
// ---------------------------------------------------------------------------

/**
 * Font weight tokens mapped to their numeric CSS / React Native equivalents.
 *
 * @example
 * ```ts
 * fontWeights.regular  // '400'
 * fontWeights.bold     // '700'
 * ```
 */
export const fontWeights = {
  /** 300 - light emphasis */
  light: '300' as const,
  /** 400 - default body text */
  regular: '400' as const,
  /** 500 - slightly emphasised */
  medium: '500' as const,
  /** 600 - headings, labels */
  semibold: '600' as const,
  /** 700 - strong emphasis */
  bold: '700' as const,
  /** 800 - extra-strong emphasis, display text */
  extrabold: '800' as const,
} as const;

// ---------------------------------------------------------------------------
// Line heights
// ---------------------------------------------------------------------------

/**
 * Line height multipliers relative to the current font size.
 *
 * Use `tight` for headings, `normal` for body text, and `relaxed` or
 * `loose` for long-form reading.
 *
 * @example
 * ```ts
 * // For a 16 px body paragraph:
 * lineHeights.normal  // 1.5  -> 24 px computed
 *
 * // For a 36 px heading:
 * lineHeights.tight   // 1.25 -> 45 px computed
 * ```
 */
export const lineHeights = {
  /** No extra leading - single-line elements */
  none: 1,
  /** Very tight leading - large display text */
  tight: 1.25,
  /** Slightly snug leading - headings */
  snug: 1.375,
  /** Default leading - body text */
  normal: 1.5,
  /** Comfortable leading - long-form text */
  relaxed: 1.625,
  /** Generous leading - maximum readability */
  loose: 2,
} as const;

// ---------------------------------------------------------------------------
// Letter spacing
// ---------------------------------------------------------------------------

/**
 * Letter spacing (tracking) values in pixels.
 *
 * Negative values tighten characters (headings); positive values loosen
 * them (uppercase labels, small text).
 *
 * @example
 * ```ts
 * letterSpacing.tight   // -0.5
 * letterSpacing.wide    //  0.5
 * ```
 */
export const letterSpacing = {
  /** -0.8 px - very tight tracking for large display text */
  tighter: -0.8,
  /** -0.5 px - tight tracking for headings */
  tight: -0.5,
  /** 0 px - default tracking */
  normal: 0,
  /** 0.5 px - slightly loose, body emphasis */
  wide: 0.5,
  /** 1 px - loose, uppercase labels */
  wider: 1,
  /** 1.6 px - very loose, decorative / all-caps */
  widest: 1.6,
} as const;

// ---------------------------------------------------------------------------
// Aggregate export
// ---------------------------------------------------------------------------

/**
 * Complete typography system for the Wisp UI kit.
 *
 * @example
 * ```ts
 * import { typography } from '@/tokens';
 *
 * typography.fontFamilies.sans
 * typography.fontSizes.md        // 16
 * typography.fontWeights.bold    // '700'
 * typography.lineHeights.normal  // 1.5
 * typography.letterSpacing.tight // -0.5
 * ```
 */
export const typography = {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacing,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Union of font family keys */
export type FontFamily = keyof typeof fontFamilies;

/** Union of font size keys */
export type FontSize = keyof typeof fontSizes;

/** Union of font weight keys */
export type FontWeight = keyof typeof fontWeights;

/** Union of line height keys */
export type LineHeight = keyof typeof lineHeights;

/** Union of letter spacing keys */
export type LetterSpacing = keyof typeof letterSpacing;
