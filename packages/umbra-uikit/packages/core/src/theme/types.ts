/**
 * @module theme/types
 * @description Core type definitions for the Wisp theme system.
 *
 * Defines the complete type hierarchy used to configure and resolve themes,
 * including color semantics, spacing scales, typography tokens, radii, and shadows.
 */

// ---------------------------------------------------------------------------
// Theme Mode
// ---------------------------------------------------------------------------

/**
 * The two supported visual modes for Wisp themes.
 *
 * - `'dark'`  -- light foreground on a dark canvas (default).
 * - `'light'` -- dark foreground on a light canvas.
 *
 * @remarks
 * The mode drives palette selection inside {@link createTheme} and is
 * surfaced to consumers via the {@link useTheme} hook so that components
 * can adapt layout or iconography beyond what colours alone provide.
 */
export type ThemeMode = 'dark' | 'light';

// ---------------------------------------------------------------------------
// Color Token Groups
// ---------------------------------------------------------------------------

/**
 * Background color tokens arranged by elevation layer.
 *
 * @remarks
 * Elevation increases from `canvas` (lowest) to `overlay` (highest).
 * Components should pick the token that matches their visual depth to
 * maintain a consistent sense of layering across the UI.
 *
 * | Token     | Purpose                                         |
 * | --------- | ----------------------------------------------- |
 * | `canvas`  | Root-level page / screen background              |
 * | `sunken`  | Recessed areas like wells, preview panels, inputs|
 * | `surface` | Cards, panels, and content containers            |
 * | `raised`  | Elevated elements such as popovers and tooltips  |
 * | `overlay` | Semi-transparent scrim behind modals / drawers   |
 */
export interface BackgroundColors {
  /** Root-level page / screen background. */
  canvas: string;
  /** Recessed / inset areas — preview wells, code blocks, input fields. */
  sunken: string;
  /** Cards, panels, and content containers. */
  surface: string;
  /** Elevated elements such as popovers and tooltips. */
  raised: string;
  /** Semi-transparent scrim behind modals / drawers. */
  overlay: string;
}

/**
 * Foreground / text color tokens.
 *
 * @remarks
 * These tokens cover the full range of text prominence levels plus
 * specialised tokens for inverse surfaces and raised containers.
 * Components should prefer semantic tokens (`primary`, `secondary`, etc.)
 * over raw hex values to stay theme-aware.
 *
 * | Token              | Purpose                                      |
 * | ------------------ | -------------------------------------------- |
 * | `primary`          | Default body text                            |
 * | `secondary`        | Supporting / less-prominent text              |
 * | `muted`            | Disabled or placeholder text                 |
 * | `inverse`          | Text rendered on the opposite-mode surface   |
 * | `link`             | Hyperlink and interactive text color          |
 * | `onRaised`         | Primary text on raised / elevated surfaces   |
 * | `onRaisedSecondary`| Secondary text on raised / elevated surfaces |
 */
export interface TextColors {
  /** Default body text. */
  primary: string;
  /** Supporting / less-prominent text. */
  secondary: string;
  /** Disabled or placeholder text. */
  muted: string;
  /** Text rendered on the opposite-mode surface. */
  inverse: string;
  /** Hyperlink and interactive text color. */
  link: string;
  /** Primary text on raised / elevated surfaces (always light — raised surfaces are dark in both themes). */
  onRaised: string;
  /** Secondary / muted text on raised / elevated surfaces. */
  onRaisedSecondary: string;
  /** Text rendered on accent-colored backgrounds. */
  onAccent: string;
}

/**
 * Border and outline color tokens.
 *
 * @remarks
 * Two contrast levels (`subtle` / `strong`) serve most decorative needs,
 * while `focus` and `active` are reserved for interactive state feedback
 * to ensure accessibility compliance.
 *
 * | Token    | Purpose                                   |
 * | -------- | ----------------------------------------- |
 * | `subtle` | Low-contrast dividers and separators      |
 * | `strong` | High-contrast borders for emphasis        |
 * | `focus`  | Focus-ring color for accessibility        |
 * | `active` | Active / pressed border state             |
 */
export interface BorderColors {
  /** Low-contrast dividers and separators. */
  subtle: string;
  /** High-contrast borders for emphasis. */
  strong: string;
  /** Focus-ring color for accessibility. */
  focus: string;
  /** Active / pressed border state. */
  active: string;
}

/**
 * Accent color tokens used for primary actions and interactive highlights.
 *
 * @remarks
 * The accent group provides a three-state interaction ramp for the primary
 * action color (`primary` / `primaryHover` / `primaryActive`) plus tokens
 * for secondary actions, selection highlights, and raised-surface variants.
 *
 * | Token             | Purpose                                      |
 * | ----------------- | -------------------------------------------- |
 * | `primary`         | Primary brand / action color                 |
 * | `primaryHover`    | Hover state of the primary accent            |
 * | `primaryActive`   | Pressed / active state of the primary accent |
 * | `secondary`       | Secondary accent for supporting actions      |
 * | `highlight`       | Selection and highlight background on canvas |
 * | `highlightRaised` | Hover highlight on raised surfaces           |
 * | `mutedRaised`     | Muted foreground on raised surfaces          |
 * | `dividerRaised`   | Low-contrast divider on raised surfaces      |
 */
export interface AccentColors {
  /** Primary brand / action color. */
  primary: string;
  /** Hover state of the primary accent. */
  primaryHover: string;
  /** Pressed / active state of the primary accent. */
  primaryActive: string;
  /** Secondary accent for supporting actions. */
  secondary: string;
  /** Selection and highlight background on canvas. */
  highlight: string;
  /** Hover highlight on raised / elevated surfaces. */
  highlightRaised: string;
  /** Muted foreground on raised surfaces. */
  mutedRaised: string;
  /** Low-contrast divider on raised surfaces. */
  dividerRaised: string;
}

/**
 * Status / feedback color tokens, each paired with a matching surface tint
 * and subtle border.
 *
 * @remarks
 * Every status category provides a triplet of tokens:
 * 1. **Foreground** -- for text and icons (e.g. `success`).
 * 2. **Surface** -- a tinted background for containers (e.g. `successSurface`).
 * 3. **Border** -- a subtle outline for status containers (e.g. `successBorder`).
 *
 * This ensures sufficient contrast for both text-on-surface and bordered
 * variants in both dark and light modes.
 *
 * | Token            | Purpose                          |
 * | ---------------- | -------------------------------- |
 * | `success`        | Positive / success foreground     |
 * | `successSurface` | Tinted background for success    |
 * | `successBorder`  | Subtle border for success        |
 * | `warning`        | Cautionary foreground             |
 * | `warningSurface` | Tinted background for warnings   |
 * | `warningBorder`  | Subtle border for warnings       |
 * | `danger`         | Destructive / error foreground    |
 * | `dangerSurface`  | Tinted background for errors     |
 * | `dangerBorder`   | Subtle border for errors         |
 * | `info`           | Informational foreground          |
 * | `infoSurface`    | Tinted background for info       |
 * | `infoBorder`     | Subtle border for info           |
 */
export interface StatusColors {
  /** Positive / success foreground. */
  success: string;
  /** Tinted background for success. */
  successSurface: string;
  /** Subtle border for success containers. */
  successBorder: string;
  /** Cautionary foreground. */
  warning: string;
  /** Tinted background for warnings. */
  warningSurface: string;
  /** Subtle border for warning containers. */
  warningBorder: string;
  /** Destructive / error foreground. */
  danger: string;
  /** Tinted background for errors. */
  dangerSurface: string;
  /** Subtle border for danger containers. */
  dangerBorder: string;
  /** Informational foreground. */
  info: string;
  /** Tinted background for info. */
  infoSurface: string;
  /** Subtle border for info containers. */
  infoBorder: string;
}

/**
 * Brand color tokens for primary brand accent.
 *
 * @remarks
 * Provides a three-state interaction ramp plus surface/border tokens
 * for branded elements. The brand color is intended to be the single
 * pop of color in an otherwise monochrome UI.
 *
 * | Token     | Purpose                                  |
 * | --------- | ---------------------------------------- |
 * | `primary` | Main brand color for buttons and accents |
 * | `hover`   | Hover state of the brand color           |
 * | `active`  | Pressed / active state                   |
 * | `surface` | Tinted background for brand containers   |
 * | `border`  | Subtle border for brand containers       |
 * | `text`    | Text color for use on brand backgrounds  |
 */
export interface BrandColors {
  /** Main brand color. */
  primary: string;
  /** Hover state of the brand color. */
  hover: string;
  /** Pressed / active state. */
  active: string;
  /** Tinted background for brand containers. */
  surface: string;
  /** Subtle border for brand containers. */
  border: string;
  /** Text color for use on brand-colored backgrounds. */
  text: string;
}

/**
 * Data-visualization color tokens used for charts, graphs, and badges.
 *
 * @remarks
 * Five distinct hues are provided. Each has been selected for sufficient
 * contrast against both dark and light canvas backgrounds, and the set
 * passes WCAG AA for adjacent-series distinguishability.
 *
 * @example
 * ```ts
 * const seriesColors = [
 *   colors.data.blue,
 *   colors.data.violet,
 *   colors.data.amber,
 *   colors.data.emerald,
 *   colors.data.cyan,
 * ];
 * ```
 */
export interface DataColors {
  /** Blue data series color. */
  blue: string;
  /** Violet data series color. */
  violet: string;
  /** Amber data series color. */
  amber: string;
  /** Emerald data series color. */
  emerald: string;
  /** Cyan data series color. */
  cyan: string;
}

/**
 * Extended color palette for decorative and expressive use cases.
 *
 * @remarks
 * Twenty vibrant hues sourced from the Flat UI Colors Russian palette.
 * These are intended for avatars, tags, charts, illustrations, and any
 * context where the monochrome base needs a splash of personality.
 *
 * Colors are grouped loosely by hue family:
 * - **Warm:** peach, mustard, tigerlily, sawtoothOak
 * - **Yellow:** rosyHighlight, summertime
 * - **Blue:** softBlue, cornflower, blueCuracao, squeaky
 * - **Pink/Red:** oldGeranium, deepRose, roguePink, flamingoPink, porcelainRose, appleValley
 * - **Purple:** purpleMountainMajesty, purpleCorallite
 * - **Neutral:** pencilLead, biscay
 */
export interface PaletteColors {
  /** Warm peach — #f3a683. */
  creamyPeach: string;
  /** Soft gold highlight — #f7d794. */
  rosyHighlight: string;
  /** Muted periwinkle — #778beb. */
  softBlue: string;
  /** Warm salmon-orange — #e77f67. */
  brewedMustard: string;
  /** Dusty rose — #cf6a87. */
  oldGeranium: string;
  /** Darker peach-orange — #f19066. */
  sawtoothOak: string;
  /** Warm yellow — #f5cd79. */
  summertime: string;
  /** Rich indigo-blue — #546de5. */
  cornflower: string;
  /** Bold terracotta — #e15f41. */
  tigerlily: string;
  /** Deep magenta-rose — #c44569. */
  deepRose: string;
  /** Muted lavender — #786fa6. */
  purpleMountainMajesty: string;
  /** Soft pastel pink — #f8a5c2. */
  roguePink: string;
  /** Light cyan-turquoise — #63cdda. */
  squeaky: string;
  /** Warm blush — #ea8685. */
  appleValley: string;
  /** Slate blue-gray — #596275. */
  pencilLead: string;
  /** Deep indigo — #574b90. */
  purpleCorallite: string;
  /** Vivid pink — #f78fb3. */
  flamingoPink: string;
  /** Bright teal-cyan — #3dc1d3. */
  blueCuracao: string;
  /** Soft coral-red — #e66767. */
  porcelainRose: string;
  /** Dark navy — #303952. */
  biscay: string;
}

// ---------------------------------------------------------------------------
// Composite Color Map
// ---------------------------------------------------------------------------

/**
 * The full semantic color map resolved for a given {@link ThemeMode}.
 *
 * @remarks
 * Groups colors by purpose rather than raw palette value, making it
 * straightforward to build accessible, theme-aware components.
 * Access at runtime via `useTheme().colors` or the shorthand
 * {@link useThemeColors} hook.
 *
 * @see {@link BackgroundColors}
 * @see {@link TextColors}
 * @see {@link BorderColors}
 * @see {@link AccentColors}
 * @see {@link StatusColors}
 * @see {@link DataColors}
 */
export interface ThemeColors {
  /** Background / elevation colors. */
  background: BackgroundColors;
  /** Foreground / text colors. */
  text: TextColors;
  /** Border and outline colors. */
  border: BorderColors;
  /** Interactive accent colors. */
  accent: AccentColors;
  /** Status / feedback colors. */
  status: StatusColors;
  /** Brand accent colors. */
  brand: BrandColors;
  /** Data-visualization colors. */
  data: DataColors;
  /** Extended decorative color palette. */
  palette: PaletteColors;
}

// ---------------------------------------------------------------------------
// Design Token Scales
// ---------------------------------------------------------------------------

/**
 * Spacing scale used across padding, margin, and gap properties.
 *
 * @remarks
 * Values are in logical pixels (dp on mobile, px on web). The scale
 * follows a roughly geometric progression to provide harmonious spacing
 * at every level of the UI hierarchy.
 */
export interface ThemeSpacing {
  /** 0 px -- no spacing. */
  none: number;
  /** 2 px -- hairline spacing. */
  '2xs': number;
  /** 4 px -- extra-small spacing. */
  xs: number;
  /** 8 px -- small spacing. */
  sm: number;
  /** 12 px -- medium-small spacing. */
  md: number;
  /** 16 px -- default / base spacing. */
  lg: number;
  /** 24 px -- large spacing. */
  xl: number;
  /** 32 px -- extra-large spacing. */
  '2xl': number;
  /** 48 px -- jumbo spacing. */
  '3xl': number;
  /** 64 px -- maximum spacing. */
  '4xl': number;
}

/**
 * Typography scale describing font sizes and line heights.
 *
 * @remarks
 * Each entry in `sizes` maps to a named step (e.g. `sm`, `base`, `xl`)
 * and provides both a `fontSize` and a matching `lineHeight`. The
 * `weights` sub-object mirrors the shared {@link FontWeightKey} tokens.
 */
export interface ThemeTypography {
  /** Font family stack. */
  fontFamily: string;
  /** Font-size / line-height pairs keyed by named step. */
  sizes: {
    /** 10 / 14 */
    '2xs': { fontSize: number; lineHeight: number };
    /** 12 / 16 */
    xs: { fontSize: number; lineHeight: number };
    /** 14 / 20 */
    sm: { fontSize: number; lineHeight: number };
    /** 16 / 24 */
    base: { fontSize: number; lineHeight: number };
    /** 18 / 28 */
    lg: { fontSize: number; lineHeight: number };
    /** 20 / 28 */
    xl: { fontSize: number; lineHeight: number };
    /** 24 / 32 */
    '2xl': { fontSize: number; lineHeight: number };
    /** 30 / 36 */
    '3xl': { fontSize: number; lineHeight: number };
    /** 36 / 40 */
    '4xl': { fontSize: number; lineHeight: number };
  };
  /** Font weight values. */
  weights: {
    regular: 400;
    medium: 500;
    semibold: 600;
    bold: 700;
  };
}

/**
 * Border-radius scale.
 *
 * @remarks
 * Values are in logical pixels. Use `full` (9999 px) for fully rounded
 * / pill-shaped elements such as tags and avatars.
 */
export interface ThemeRadii {
  /** 0 px -- sharp corners. */
  none: number;
  /** 4 px -- subtle rounding. */
  sm: number;
  /** 8 px -- default rounding. */
  md: number;
  /** 12 px -- pronounced rounding. */
  lg: number;
  /** 16 px -- large rounding. */
  xl: number;
  /** 9999 px -- fully rounded / pill shape. */
  full: number;
}

/**
 * Shadow presets arranged by elevation level.
 *
 * @remarks
 * Each shadow is expressed as a CSS-compatible `box-shadow` string on web
 * and can be translated to platform-native elevation values on mobile.
 * The steps intentionally mirror the {@link ThemeRadii} naming for
 * cognitive consistency (`sm`, `md`, `lg`, `xl`).
 */
export interface ThemeShadows {
  /** No shadow. */
  none: string;
  /** Subtle lift (cards, inputs). */
  sm: string;
  /** Medium elevation (dropdowns, popovers). */
  md: string;
  /** High elevation (modals, dialogs). */
  lg: string;
  /** Maximum elevation (toasts, notifications). */
  xl: string;
}

// ---------------------------------------------------------------------------
// Theme Configuration & Resolved Theme
// ---------------------------------------------------------------------------

/**
 * Static configuration object used to define a Wisp theme.
 *
 * @remarks
 * This is the *input* shape accepted by `createTheme` and the
 * {@link WispProvider} `theme` prop. It contains every token category
 * needed to fully describe a visual theme. To create a resolved runtime
 * theme (with an `id` for memoisation), pass a partial config through
 * `createTheme`.
 *
 * @see {@link WispTheme} for the resolved runtime extension.
 */
export interface ThemeConfig {
  /** Active visual mode. */
  mode: ThemeMode;
  /** Semantic color tokens resolved for the active {@link ThemeMode}. */
  colors: ThemeColors;
  /** Spacing scale -- see {@link ThemeSpacing}. */
  spacing: ThemeSpacing;
  /** Typography scale -- see {@link ThemeTypography}. */
  typography: ThemeTypography;
  /** Border-radius scale -- see {@link ThemeRadii}. */
  radii: ThemeRadii;
  /** Shadow presets -- see {@link ThemeShadows}. */
  shadows: ThemeShadows;
}

/**
 * Fully resolved Wisp theme object available at runtime via context.
 *
 * @remarks
 * Extends {@link ThemeConfig} with a unique `id` string so that
 * consumers can detect theme changes efficiently (e.g. as a key in
 * memoisation caches). The `id` is generated deterministically by
 * `createTheme` based on the mode and overrides.
 *
 * Access the resolved theme at runtime through the {@link useTheme} hook.
 *
 * @example
 * ```tsx
 * const { theme } = useTheme();
 * console.log(theme.id);     // deterministic identifier
 * console.log(theme.mode);   // 'dark' | 'light'
 * console.log(theme.colors); // ThemeColors
 * ```
 */
export interface WispTheme extends ThemeConfig {
  /**
   * A unique identifier for this theme instance, useful for memoisation
   * and cache-busting when the theme object reference changes.
   */
  id: string;
}
