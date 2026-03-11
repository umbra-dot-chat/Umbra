/**
 * @module theme/WispProvider
 * @description Root context provider for the Wisp design system.
 *
 * `WispProvider` supplies the resolved theme (colors, spacing, typography,
 * radii, shadows) to every Wisp component in the tree.  It also manages
 * theme-mode toggling and optionally integrates the haptics sub-system.
 *
 * Wrap your application root with `<WispProvider>` to enable theming:
 *
 * ```tsx
 * import { WispProvider } from '../providers';
 *
 * function App() {
 *   return (
 *     <WispProvider mode="dark">
 *       <YourApp />
 *     </WispProvider>
 *   );
 * }
 * ```
 */

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ThemeColors, ThemeMode, WispTheme } from '@coexist/wisp-core/theme/types';
import { createTheme, type ThemeOverrides } from '@coexist/wisp-core/theme/create-theme';

// ---------------------------------------------------------------------------
// Context value shape
// ---------------------------------------------------------------------------

/**
 * The shape of the value exposed by the Wisp theme context.
 *
 * @remarks
 * Consumers typically access this through the {@link useTheme} hook rather
 * than reading the context directly. The value is memoised inside
 * {@link WispProvider} so that referential equality is preserved between
 * renders when neither the theme nor the mode changes.
 *
 * @see {@link useTheme} for the recommended consumption API.
 */
export interface WispThemeContextValue {
  /** The fully resolved theme object -- see {@link WispTheme}. */
  theme: WispTheme;
  /** Shortcut to `theme.mode` -- the active visual mode. */
  mode: ThemeMode;
  /** Shortcut to `theme.colors` -- the resolved colour map. */
  colors: ThemeColors;
  /** Toggle between `'dark'` and `'light'` mode. */
  toggleMode: () => void;
  /** Explicitly set the theme mode to a specific {@link ThemeMode}. */
  setMode: (mode: ThemeMode) => void;
  /** The current theme overrides (excluding mode). */
  overrides: Omit<ThemeOverrides, 'mode'>;
  /** Replace the current theme overrides (triggers live re-theme). */
  setOverrides: (overrides: Omit<ThemeOverrides, 'mode'>) => void;
  /** Reset overrides back to the initial prop value (or empty). */
  resetOverrides: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/**
 * React context that carries the current Wisp theme.
 *
 * @remarks
 * The default value is intentionally `null` so that {@link useTheme} can
 * detect when it is called outside of a `<WispProvider>` tree and throw a
 * descriptive error rather than silently returning `undefined`.
 *
 * A `displayName` is set for easier identification in React DevTools.
 *
 * @see {@link WispProvider} for the component that populates this context.
 * @see {@link useTheme} for the hook that reads from it.
 */
export const WispThemeContext = createContext<WispThemeContextValue | null>(
  null,
);
WispThemeContext.displayName = 'WispThemeContext';

// ---------------------------------------------------------------------------
// CSS variable injection (web only)
// ---------------------------------------------------------------------------

/**
 * Flatten the `ThemeColors` object into a flat record of CSS custom-property
 * declarations using the `--wisp-<group>-<token>` naming convention.
 *
 * @param colors - The resolved semantic color map.
 * @returns A flat `Record<string, string>` of CSS variable name to value.
 *
 * @internal
 */
function colorsToCssVars(colors: ThemeColors): Record<string, string> {
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
 *
 * @internal
 */
function applyCssVars(vars: Record<string, string>): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  for (const [prop, value] of Object.entries(vars)) {
    root.style.setProperty(prop, value);
  }
}

// ---------------------------------------------------------------------------
// Provider Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link WispProvider} component.
 *
 * @remarks
 * All props except `children` are optional -- sensible defaults are applied
 * internally (dark mode, no overrides, CSS vars injected, haptics off).
 */
export interface WispProviderProps {
  /**
   * Initial theme mode.
   *
   * @defaultValue `'dark'`
   */
  mode?: ThemeMode;

  /**
   * Optional partial theme overrides merged into the base theme for the
   * active mode.  Allows brand customisation without building a theme from
   * scratch.
   */
  overrides?: Omit<ThemeOverrides, 'mode'>;

  /**
   * Whether to inject CSS custom properties onto the document root.
   *
   * Set to `false` when rendering in React Native or in an SSR pass where
   * DOM access is unavailable.
   *
   * @defaultValue `true`
   */
  injectCssVars?: boolean;

  /**
   * Whether to enable the haptics sub-system.
   *
   * When `true` the provider will wrap children in a `HapticsProvider`
   * (imported lazily from `@wisp/haptics`) so that descendant components can
   * trigger platform haptic feedback.
   *
   * @defaultValue `false`
   */
  enableHaptics?: boolean;

  /** React children to render inside the provider. */
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Root provider for the Wisp design system.
 *
 * @remarks
 * Internally, `WispProvider` performs several side-effects:
 *
 * 1. **Theme resolution** -- calls `createTheme` with the current mode and
 *    any overrides, memoising the result.
 * 2. **CSS variable injection** -- flattens {@link ThemeColors} into
 *    `--wisp-<group>-<token>` custom properties on `<html>` (web only,
 *    controlled by `injectCssVars`).
 * 3. **Mode attribute** -- sets `data-wisp-mode` on `<html>` so that
 *    global CSS selectors can target the active mode.
 * 4. **Haptics integration** -- when `enableHaptics` is `true`, lazily
 *    wraps children in a `HapticsProvider` from `@wisp/haptics`.
 *
 * The provider re-syncs its internal mode state whenever the `mode` prop
 * changes from above, supporting both controlled and semi-controlled usage.
 *
 * @param props - {@link WispProviderProps}
 * @returns A React element wrapping `children` in the theme context.
 *
 * @see {@link useTheme} to consume the theme from descendant components.
 * @see {@link WispThemeContext} for the underlying React context.
 *
 * @example
 * ```tsx
 * // Minimal setup (dark mode, default tokens)
 * <WispProvider>
 *   <App />
 * </WispProvider>
 * ```
 *
 * @example
 * ```tsx
 * // Custom mode with overrides and haptics
 * <WispProvider mode="light" overrides={{ colors: { accent: { primary: '#6366F1' } } }} enableHaptics>
 *   <App />
 * </WispProvider>
 * ```
 */
export function WispProvider({
  mode: initialMode = 'dark',
  overrides,
  injectCssVars = true,
  enableHaptics = false,
  children,
}: WispProviderProps): React.JSX.Element {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const [overrideState, setOverrideState] = useState<Omit<ThemeOverrides, 'mode'>>(
    overrides ?? {},
  );

  // Re-sync when the controlled `mode` prop changes from above.
  useEffect(() => {
    setModeState(initialMode);
  }, [initialMode]);

  // Re-sync when the controlled `overrides` prop changes from above.
  useEffect(() => {
    setOverrideState(overrides ?? {});
  }, [overrides]);

  // Build the resolved theme whenever mode or overrides change.
  const theme = useMemo<WispTheme>(
    () => createTheme({ ...overrideState, mode }),
    [mode, overrideState],
  );

  // Inject / update CSS custom properties on the document root (web only).
  useEffect(() => {
    if (!injectCssVars) return;
    const vars = colorsToCssVars(theme.colors);
    applyCssVars(vars);
  }, [theme.colors, injectCssVars]);

  // Set a `data-wisp-mode` attribute on <html> for global CSS selectors.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-wisp-mode', mode);
  }, [mode]);

  /** Toggle between dark and light mode. */
  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  /** Explicitly set the mode. */
  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
  }, []);

  /** Replace the current overrides (triggers live re-theme). */
  const setOverridesCallback = useCallback(
    (next: Omit<ThemeOverrides, 'mode'>) => {
      setOverrideState(next);
    },
    [],
  );

  /** Reset overrides back to the initial prop value. */
  const resetOverrides = useCallback(() => {
    setOverrideState(overrides ?? {});
  }, [overrides]);

  const contextValue = useMemo<WispThemeContextValue>(
    () => ({
      theme,
      mode,
      colors: theme.colors,
      toggleMode,
      setMode,
      overrides: overrideState,
      setOverrides: setOverridesCallback,
      resetOverrides,
    }),
    [theme, mode, toggleMode, setMode, overrideState, setOverridesCallback, resetOverrides],
  );

  // Compose the provider tree.  When haptics are enabled we lazily wrap
  // children in the haptics provider so that the haptics module is not a hard
  // dependency of the theme system.
  let content: React.ReactNode = children;

  if (enableHaptics) {
    // The HapticsProvider is expected to live at `@wisp/haptics`.
    // We import it lazily here to avoid coupling the theme package to haptics.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    try {
      // Dynamic require wrapped in try/catch -- if the haptics module is not
      // installed the provider is simply skipped.
      // In a future iteration this can be replaced with React.lazy + Suspense.
      const { HapticsProvider } =
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('../haptics') as {
          HapticsProvider: React.ComponentType<{ children: React.ReactNode }>;
        };
      content = <HapticsProvider>{children}</HapticsProvider>;
    } catch {
      // Haptics module not available -- fall through silently.
    }
  }

  return (
    <WispThemeContext.Provider value={contextValue}>
      {content}
    </WispThemeContext.Provider>
  );
}
