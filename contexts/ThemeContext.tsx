/**
 * ThemeContext — Orchestrates all Wisp theme overrides.
 *
 * Single source of truth for theme preset selection, accent color, dark/light
 * mode, and font overrides. Composes them into one `setOverrides()` call so
 * that nothing conflicts.
 *
 * Persists preferences via the WASM KV store (same pattern as FontContext).
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useTheme } from '@coexist/wisp-react-native';
import { getWasm } from '@umbra/wasm';
import { useUmbra } from '@/contexts/UmbraContext';
import { useFonts } from '@/contexts/FontContext';
import type { ThemePreset, DeepPartial } from '@/themes/types';
import { THEME_REGISTRY, getThemeById } from '@/themes/registry';

// ─────────────────────────────────────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────────────────────────────────────

export interface ThemeContextValue {
  /** Currently active theme preset (`null` = default Umbra theme). */
  activeTheme: ThemePreset | null;
  /** All available theme presets (for marketplace browsing). */
  themes: ThemePreset[];
  /** Set of theme IDs that have been installed (downloaded from marketplace). */
  installedThemeIds: Set<string>;
  /** Install a theme from the marketplace. */
  installTheme: (id: string) => void;
  /** Uninstall a theme (removes from installed list). */
  uninstallTheme: (id: string) => void;
  /** Set the active theme by ID. Pass `null` to reset to default. */
  setTheme: (id: string | null) => void;
  /** User accent color override (`null` = use theme's default accent). */
  accentColor: string | null;
  /** Override the accent color on top of the active theme. */
  setAccentColor: (color: string | null) => void;
  /** Whether the dark/light mode toggle should be visible. */
  showModeToggle: boolean;
}

const ThemeCtx = createContext<ThemeContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Persistence keys
// ─────────────────────────────────────────────────────────────────────────────

const KV_NAMESPACE = '__umbra_system__';
const KEY_THEME_ID = 'theme_id';
const KEY_ACCENT_COLOR = 'accent_color';
const KEY_DARK_MODE = 'dark_mode';
const KEY_INSTALLED_THEMES = 'installed_themes';

// ─────────────────────────────────────────────────────────────────────────────
// Deep merge utility (matches Wisp's internal merge logic)
// ─────────────────────────────────────────────────────────────────────────────

function deepMerge<T extends Record<string, any>>(base: T, patch: DeepPartial<T>): T {
  const result: any = { ...base };
  for (const key of Object.keys(patch)) {
    const baseVal = result[key];
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

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isReady } = useUmbra();
  const { setOverrides, setMode, mode } = useTheme();
  const { activeFont } = useFonts();

  const [activeTheme, setActiveTheme] = useState<ThemePreset | null>(null);
  const [accentColor, setAccentColorState] = useState<string | null>(null);
  const [installedThemeIds, setInstalledThemeIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  // Track whether we've done initial restore so we don't clobber state
  const initialRestoreRef = useRef(false);

  // ── Persistence helpers ──────────────────────────────────────────────

  const kvSet = useCallback((key: string, value: string) => {
    try {
      const wasm = getWasm();
      if (!wasm) return;
      (wasm as any).umbra_wasm_plugin_kv_set(KV_NAMESPACE, key, value);
    } catch (err) {
      console.warn('[ThemeContext] Failed to save:', key, err);
    }
  }, []);

  const kvGet = useCallback((key: string): string | null => {
    try {
      const wasm = getWasm();
      if (!wasm) return null;
      const result = (wasm as any).umbra_wasm_plugin_kv_get(KV_NAMESPACE, key);
      const parsed = JSON.parse(result);
      return parsed.value ?? null;
    } catch {
      return null;
    }
  }, []);

  // ── Compose and apply all overrides ──────────────────────────────────

  const applyOverrides = useCallback(
    (theme: ThemePreset | null, accent: string | null, fontCss: string) => {
      // Start with empty overrides
      let colors: Record<string, any> = {};

      // Layer 1: Theme preset colors
      if (theme) {
        colors = { ...theme.colors };
      }

      // Layer 2: User accent color override
      if (accent) {
        colors = deepMerge(colors, {
          accent: { primary: accent },
        });
      }

      // Build the full override object
      const overrides: Record<string, any> = {};

      if (Object.keys(colors).length > 0) {
        overrides.colors = colors;
      }

      // Layer 3: Font override
      if (fontCss) {
        overrides.typography = { fontFamily: fontCss };
      }

      setOverrides(overrides);

      // Force dark mode when a custom theme is active
      if (theme) {
        setMode('dark');
      }
    },
    [setOverrides, setMode],
  );

  // ── Load saved state on mount ────────────────────────────────────────

  useEffect(() => {
    if (!isReady || initialRestoreRef.current) return;
    initialRestoreRef.current = true;

    // Load installed themes
    const savedInstalled = kvGet(KEY_INSTALLED_THEMES);
    let installed = new Set<string>();
    if (savedInstalled) {
      try {
        const ids: string[] = JSON.parse(savedInstalled);
        ids.forEach((id) => installed.add(id));
      } catch {}
    }
    setInstalledThemeIds(installed);

    const savedThemeId = kvGet(KEY_THEME_ID);
    const savedAccent = kvGet(KEY_ACCENT_COLOR);
    const savedMode = kvGet(KEY_DARK_MODE);

    const theme = savedThemeId ? getThemeById(savedThemeId) ?? null : null;
    const accent = savedAccent || null;

    setActiveTheme(theme);
    setAccentColorState(accent);

    // Restore mode preference (only if no custom theme)
    if (!theme && savedMode) {
      setMode(savedMode === 'true' ? 'dark' : 'light');
    }

    // Apply everything
    applyOverrides(theme, accent, activeFont.css);
    setLoaded(true);
  }, [isReady, kvGet, applyOverrides, activeFont.css, setMode]);

  // ── Re-apply when font changes ───────────────────────────────────────

  useEffect(() => {
    if (!loaded) return;
    applyOverrides(activeTheme, accentColor, activeFont.css);
  }, [activeFont.css, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Public setters ───────────────────────────────────────────────────

  const installTheme = useCallback(
    (id: string) => {
      const theme = getThemeById(id);
      if (!theme) return;

      setInstalledThemeIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        // Persist
        kvSet(KEY_INSTALLED_THEMES, JSON.stringify(Array.from(next)));
        return next;
      });
    },
    [kvSet],
  );

  const uninstallTheme = useCallback(
    (id: string) => {
      // If this theme is active, reset to default first
      if (activeTheme?.id === id) {
        setActiveTheme(null);
        applyOverrides(null, accentColor, activeFont.css);
        kvSet(KEY_THEME_ID, '');
      }

      setInstalledThemeIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        // Persist
        kvSet(KEY_INSTALLED_THEMES, JSON.stringify(Array.from(next)));
        return next;
      });
    },
    [activeTheme, accentColor, activeFont.css, applyOverrides, kvSet],
  );

  const setTheme = useCallback(
    (id: string | null) => {
      const theme = id ? getThemeById(id) ?? null : null;

      // Auto-install theme if not already installed
      if (theme && !installedThemeIds.has(theme.id)) {
        installTheme(theme.id);
      }

      // When switching to a new theme, reset the custom accent color so the
      // theme's own primary/accent colors take effect immediately.
      if (theme) {
        setAccentColorState(null);
        kvSet(KEY_ACCENT_COLOR, '');
      }

      setActiveTheme(theme);
      applyOverrides(theme, null, activeFont.css);

      // Persist
      if (theme) {
        kvSet(KEY_THEME_ID, theme.id);
      } else {
        kvSet(KEY_THEME_ID, '');
      }
    },
    [activeFont.css, applyOverrides, kvSet, installedThemeIds, installTheme],
  );

  const setAccentColor = useCallback(
    (color: string | null) => {
      setAccentColorState(color);
      applyOverrides(activeTheme, color, activeFont.css);

      // Persist
      kvSet(KEY_ACCENT_COLOR, color ?? '');
    },
    [activeTheme, activeFont.css, applyOverrides, kvSet],
  );

  // ── Persist mode changes ─────────────────────────────────────────────
  // When user toggles mode (only available when no custom theme), persist it

  useEffect(() => {
    if (!loaded || activeTheme) return;
    kvSet(KEY_DARK_MODE, mode === 'dark' ? 'true' : 'false');
  }, [mode, loaded, activeTheme, kvSet]);

  // ── Context value ────────────────────────────────────────────────────

  const value = useMemo<ThemeContextValue>(
    () => ({
      activeTheme,
      themes: THEME_REGISTRY,
      installedThemeIds,
      installTheme,
      uninstallTheme,
      setTheme,
      accentColor,
      setAccentColor,
      showModeToggle: activeTheme === null,
    }),
    [activeTheme, installedThemeIds, installTheme, uninstallTheme, setTheme, accentColor, setAccentColor],
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeCtx);
  if (!ctx) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return ctx;
}
