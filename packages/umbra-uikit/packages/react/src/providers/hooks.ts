/**
 * @module theme/hooks
 * @description React hooks for consuming the Wisp theme context.
 *
 * These hooks are the primary public API for reading theme values inside
 * components.  They must be called within a `<WispProvider>` tree -- an
 * informative error is thrown otherwise.
 */

import { useContext } from 'react';
import type { ThemeColors, ThemeMode, WispTheme } from '@coexist/wisp-core/theme/types';
import type { ThemeOverrides } from '@coexist/wisp-core/theme/create-theme';
import { WispThemeContext, type WispThemeContextValue } from './WispProvider';

// ---------------------------------------------------------------------------
// useTheme
// ---------------------------------------------------------------------------

/**
 * Return value of the {@link useTheme} hook.
 *
 * @remarks
 * Provides both the complete {@link WispTheme} and convenient destructured
 * shortcuts (`mode`, `colors`, `toggleMode`, `setMode`) so that consumers
 * can pick the minimal surface they need without reaching into the theme
 * object manually.
 */
export interface UseThemeReturn {
  /** The fully resolved Wisp theme -- see {@link WispTheme}. */
  theme: WispTheme;
  /** The current visual mode (`'dark'` or `'light'`). */
  mode: ThemeMode;
  /** Shortcut to `theme.colors` -- see {@link ThemeColors}. */
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

/**
 * Access the full Wisp theme context.
 *
 * @remarks
 * This is the primary public API for reading theme values inside
 * components. It returns the resolved {@link WispTheme} along with
 * convenience shortcuts for mode, colours, and mode-toggling helpers.
 *
 * The hook reads from {@link WispThemeContext} and will throw a
 * descriptive error if no `<WispProvider>` ancestor is found.
 *
 * @returns A {@link UseThemeReturn} object with the theme, mode, colors,
 *   and mode-switching utilities.
 * @throws {Error} If called outside of a `<WispProvider>`.
 *
 * @see {@link useThemeColors} for a lighter alternative when only colours
 *   are needed.
 * @see {@link WispProvider} for how to mount the theme context.
 *
 * @example
 * ```tsx
 * function Header() {
 *   const { colors, mode, toggleMode } = useTheme();
 *
 *   return (
 *     <header style={{ background: colors.background.surface }}>
 *       <button onClick={toggleMode}>
 *         {mode === 'dark' ? 'Light mode' : 'Dark mode'}
 *       </button>
 *     </header>
 *   );
 * }
 * ```
 */
export function useTheme(): UseThemeReturn {
  const ctx: WispThemeContextValue | null = useContext(WispThemeContext);

  if (ctx === null) {
    throw new Error(
      '[Wisp] useTheme must be used within a <WispProvider>. ' +
        'Wrap your component tree with <WispProvider> to provide theme context.',
    );
  }

  return {
    theme: ctx.theme,
    mode: ctx.mode,
    colors: ctx.colors,
    toggleMode: ctx.toggleMode,
    setMode: ctx.setMode,
    overrides: ctx.overrides,
    setOverrides: ctx.setOverrides,
    resetOverrides: ctx.resetOverrides,
  };
}

// ---------------------------------------------------------------------------
// useThemeColors
// ---------------------------------------------------------------------------

/**
 * Convenience hook that returns only the resolved {@link ThemeColors}.
 *
 * @remarks
 * A thin wrapper around {@link useTheme} that destructures just the
 * `colors` field. Prefer this hook when a component needs colour values
 * but has no use for mode toggling or the full theme config -- it makes
 * the dependency surface explicit and keeps component signatures narrow.
 *
 * @returns The {@link ThemeColors} object for the active theme mode.
 * @throws {Error} If called outside of a `<WispProvider>`.
 *
 * @see {@link useTheme} for the full theme context including mode controls.
 *
 * @example
 * ```tsx
 * function Badge({ label }: { label: string }) {
 *   const colors = useThemeColors();
 *
 *   return (
 *     <span style={{ color: colors.text.primary, background: colors.accent.highlight }}>
 *       {label}
 *     </span>
 *   );
 * }
 * ```
 */
export function useThemeColors(): ThemeColors {
  const { colors } = useTheme();
  return colors;
}
