/**
 * @module providers/hooks
 * @description React hooks for consuming the Wisp theme context (React Native).
 *
 * Identical API to the React DOM hooks so that consumer code is portable.
 */

import { useContext } from 'react';
import type { ThemeColors, ThemeMode, WispTheme } from '@coexist/wisp-core/theme/types';
import type { ThemeOverrides } from '@coexist/wisp-core/theme/create-theme';
import { WispThemeContext, type WispThemeContextValue } from './WispProvider';

export interface UseThemeReturn {
  theme: WispTheme;
  mode: ThemeMode;
  colors: ThemeColors;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  overrides: Omit<ThemeOverrides, 'mode'>;
  setOverrides: (overrides: Omit<ThemeOverrides, 'mode'>) => void;
  resetOverrides: () => void;
}

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

export function useThemeColors(): ThemeColors {
  const { colors } = useTheme();
  return colors;
}
