/**
 * @module theme/create-theme
 * @description Factory utility for creating custom Wisp themes.
 *
 * Allows consumers to derive new themes by merging partial overrides with the
 * built-in dark or light base themes.  The result is a fully resolved
 * {@link WispTheme} that can be passed directly to {@link WispProvider}.
 */

import type {
  ThemeColors,
  ThemeConfig,
  ThemeMode,
  ThemeRadii,
  ThemeShadows,
  ThemeSpacing,
  ThemeTypography,
  WispTheme,
} from './types';
import { darkColors } from './dark';
import { lightColors } from './light';

// ---------------------------------------------------------------------------
// Default scales
// ---------------------------------------------------------------------------

/**
 * Default spacing scale (values in logical pixels).
 *
 * Follows a 4-px base grid with a few half-step exceptions (`2xs`, `md`).
 */
export const defaultSpacing: ThemeSpacing = {
  none: 0,
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

/**
 * Default typography scale.
 *
 * Uses the system font stack so that Wisp renders with the platform's native
 * typeface on every operating system.
 */
export const defaultTypography: ThemeTypography = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  sizes: {
    '2xs': { fontSize: 10, lineHeight: 14 },
    xs: { fontSize: 12, lineHeight: 16 },
    sm: { fontSize: 14, lineHeight: 20 },
    base: { fontSize: 16, lineHeight: 24 },
    lg: { fontSize: 18, lineHeight: 28 },
    xl: { fontSize: 20, lineHeight: 28 },
    '2xl': { fontSize: 24, lineHeight: 32 },
    '3xl': { fontSize: 30, lineHeight: 36 },
    '4xl': { fontSize: 36, lineHeight: 40 },
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

/**
 * Default border-radius scale (values in logical pixels).
 */
export const defaultRadii: ThemeRadii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

/**
 * Default shadow presets expressed as CSS `box-shadow` strings.
 *
 * On React Native these will need to be translated to platform-native
 * elevation or shadow properties by the rendering layer.
 */
export const defaultShadows: ThemeShadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
};

// ---------------------------------------------------------------------------
// Utility types
// ---------------------------------------------------------------------------

/**
 * Utility type that recursively marks every property as optional.
 *
 * @typeParam T - The object type to make deeply partial.
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ---------------------------------------------------------------------------
// Deep merge helper
// ---------------------------------------------------------------------------

/**
 * Simple recursive merge of two plain objects.
 *
 * Arrays and non-plain values are overwritten rather than merged.
 *
 * @param base  - The base object to merge into.
 * @param patch - Partial overrides applied on top of `base`.
 * @returns A new object containing the merged result.
 *
 * @internal
 */
function deepMerge<T>(base: T, patch: DeepPartial<T>): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = { ...(base as any) };

  for (const key of Object.keys(patch as object)) {
    const baseVal = result[key];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patchVal = (patch as any)[key];

    if (
      patchVal !== null &&
      typeof patchVal === 'object' &&
      !Array.isArray(patchVal) &&
      baseVal !== null &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(baseVal, patchVal);
    } else {
      result[key] = patchVal;
    }
  }

  return result as T;
}

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

/** Auto-incrementing counter used to generate unique theme IDs. */
let themeCounter = 0;

/**
 * Generate a unique, deterministic theme identifier.
 *
 * @param mode - The theme mode prefix.
 * @returns A string ID like `"wisp-dark-3"`.
 *
 * @internal
 */
function generateThemeId(mode: ThemeMode): string {
  themeCounter += 1;
  return `wisp-${mode}-${themeCounter}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Partial override shape accepted by {@link createTheme}.
 *
 * Every field is optional.  When a field is omitted the corresponding
 * default value from the base dark or light theme is used instead.
 */
export type ThemeOverrides = {
  /** Override the visual mode.  Defaults to `'dark'`. */
  mode?: ThemeMode;
  /** Deep-partial color overrides merged on top of the base palette. */
  colors?: DeepPartial<ThemeColors>;
  /** Partial spacing overrides. */
  spacing?: Partial<ThemeSpacing>;
  /** Partial typography overrides. */
  typography?: DeepPartial<ThemeTypography>;
  /** Partial radii overrides. */
  radii?: Partial<ThemeRadii>;
  /** Partial shadow overrides. */
  shadows?: Partial<ThemeShadows>;
};

/**
 * Create a fully resolved {@link WispTheme} by merging optional overrides
 * with the built-in base theme for the selected mode.
 *
 * @param overrides - Partial theme overrides.  If omitted a default dark
 *   theme is returned.
 * @returns A complete {@link WispTheme} ready for use with {@link WispProvider}.
 *
 * @example
 * ```ts
 * import { createTheme } from '@wisp/theme';
 *
 * // Default dark theme
 * const dark = createTheme();
 *
 * // Light theme with a custom primary accent
 * const branded = createTheme({
 *   mode: 'light',
 *   colors: { accent: { primary: '#E11D48' } },
 * });
 * ```
 */
export function createTheme(overrides: ThemeOverrides = {}): WispTheme {
  const mode: ThemeMode = overrides.mode ?? 'dark';
  const baseColors: ThemeColors = mode === 'dark' ? darkColors : lightColors;

  const resolvedConfig: ThemeConfig = {
    mode,
    colors: overrides.colors
      ? deepMerge(baseColors, overrides.colors)
      : baseColors,
    spacing: overrides.spacing
      ? { ...defaultSpacing, ...overrides.spacing }
      : defaultSpacing,
    typography: overrides.typography
      ? deepMerge(defaultTypography, overrides.typography)
      : defaultTypography,
    radii: overrides.radii
      ? { ...defaultRadii, ...overrides.radii }
      : defaultRadii,
    shadows: overrides.shadows
      ? { ...defaultShadows, ...overrides.shadows }
      : defaultShadows,
  };

  return {
    ...resolvedConfig,
    id: generateThemeId(mode),
  };
}
