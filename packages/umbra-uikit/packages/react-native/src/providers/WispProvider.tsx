/**
 * @module providers/WispProvider
 * @description Root context provider for the Wisp design system (React Native).
 *
 * Supplies the resolved theme (colors, spacing, typography, radii, shadows)
 * to every Wisp RN component in the tree. Manages theme-mode toggling.
 *
 * Unlike the React DOM provider this version does NOT:
 * - Inject CSS custom properties
 * - Set `data-wisp-mode` on the document
 * - Integrate haptics via lazy require
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
// Context value shape (identical to React DOM)
// ---------------------------------------------------------------------------

export interface WispThemeContextValue {
  theme: WispTheme;
  mode: ThemeMode;
  colors: ThemeColors;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  overrides: Omit<ThemeOverrides, 'mode'>;
  setOverrides: (overrides: Omit<ThemeOverrides, 'mode'>) => void;
  resetOverrides: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const WispThemeContext = createContext<WispThemeContextValue | null>(null);
WispThemeContext.displayName = 'WispThemeContext';

// ---------------------------------------------------------------------------
// Provider Props
// ---------------------------------------------------------------------------

export interface WispProviderProps {
  /** @defaultValue `'dark'` */
  mode?: ThemeMode;
  overrides?: Omit<ThemeOverrides, 'mode'>;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WispProvider({
  mode: initialMode = 'dark',
  overrides,
  children,
}: WispProviderProps): React.JSX.Element {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const [overrideState, setOverrideState] = useState<Omit<ThemeOverrides, 'mode'>>(
    overrides ?? {},
  );

  useEffect(() => {
    setModeState(initialMode);
  }, [initialMode]);

  useEffect(() => {
    setOverrideState(overrides ?? {});
  }, [overrides]);

  const theme = useMemo<WispTheme>(
    () => createTheme({ ...overrideState, mode }),
    [mode, overrideState],
  );

  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
  }, []);

  const setOverridesCallback = useCallback(
    (next: Omit<ThemeOverrides, 'mode'>) => {
      setOverrideState(next);
    },
    [],
  );

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

  return (
    <WispThemeContext.Provider value={contextValue}>
      {children}
    </WispThemeContext.Provider>
  );
}
