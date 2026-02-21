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
import { Platform } from 'react-native';
import { useTheme } from '@coexist/wisp-react-native';
import { getWasm } from '@umbra/wasm';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFonts, getFontFamily } from '@/contexts/FontContext';
import { syncMetadataViaRelay } from '@umbra/service';
import type { MetadataEvent } from '@umbra/service';
import type { ThemePreset, DeepPartial } from '@/themes/types';
import { THEME_REGISTRY, getThemeById } from '@/themes/registry';

// ─────────────────────────────────────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────────────────────────────────────

/** Text size presets */
export type TextSize = 'sm' | 'md' | 'lg';

/** Scale factors for each text size */
const TEXT_SIZE_SCALES: Record<TextSize, number> = {
  sm: 0.875,
  md: 1,
  lg: 1.125,
};

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
  /** Whether saved preferences have been loaded from the WASM KV store. */
  preferencesLoaded: boolean;
  /** Current text size setting. */
  textSize: TextSize;
  /** Set the text size. */
  setTextSize: (size: TextSize) => void;
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
const KEY_TEXT_SIZE = 'text_size';

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
  const { isReady, service } = useUmbra();
  const { identity } = useAuth();
  const { setOverrides, setMode, mode } = useTheme();
  const { activeFont } = useFonts();
  const activeFontFamily = getFontFamily(activeFont);

  const [activeTheme, setActiveTheme] = useState<ThemePreset | null>(null);
  const [accentColor, setAccentColorState] = useState<string | null>(null);
  const [installedThemeIds, setInstalledThemeIds] = useState<Set<string>>(new Set());
  const [textSize, setTextSizeState] = useState<TextSize>('md');
  const [loaded, setLoaded] = useState(false);

  // Track whether we've done initial restore so we don't clobber state
  const initialRestoreRef = useRef(false);

  // ── Persistence helpers ──────────────────────────────────────────────

  const kvSet = useCallback((key: string, value: string) => {
    try {
      const wasm = getWasm();
      if (!wasm) return;
      const result = (wasm as any).umbra_wasm_plugin_kv_set(KV_NAMESPACE, key, value);
      // Handle async returns (Tauri backend returns Promises)
      if (result && typeof result.then === 'function') {
        result.catch((err: any) => console.warn('[ThemeContext] Failed to save:', key, err));
      }
    } catch (err) {
      console.warn('[ThemeContext] Failed to save:', key, err);
    }
  }, []);

  /** Sync a key/value to other sessions via relay */
  const relaySync = useCallback((key: string, value: string) => {
    if (service && identity?.did) {
      try {
        const relayWs = service.getRelayWs();
        if (relayWs) {
          syncMetadataViaRelay(relayWs, identity.did, key, value);
        }
      } catch (err) {
        console.warn('[ThemeContext] Failed to sync via relay:', err);
      }
    }
  }, [service, identity]);

  const kvGet = useCallback(async (key: string): Promise<string | null> => {
    try {
      const wasm = getWasm();
      if (!wasm) return null;
      const result = await (wasm as any).umbra_wasm_plugin_kv_get(KV_NAMESPACE, key);
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;
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

  // ── Apply text size ──────────────────────────────────────────────────

  const applyTextSize = useCallback((size: TextSize) => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const scale = TEXT_SIZE_SCALES[size];
      // Set CSS custom property on :root so components can use it
      document.documentElement.style.fontSize = `${scale * 100}%`;
    }
  }, []);

  // ── Load saved state on mount ────────────────────────────────────────

  useEffect(() => {
    if (!isReady || initialRestoreRef.current) return;
    initialRestoreRef.current = true;

    async function restorePreferences() {
      // Load installed themes
      const savedInstalled = await kvGet(KEY_INSTALLED_THEMES);
      let installed = new Set<string>();
      if (savedInstalled) {
        try {
          const ids: string[] = JSON.parse(savedInstalled);
          ids.forEach((id) => installed.add(id));
        } catch {}
      }
      setInstalledThemeIds(installed);

      const savedThemeId = await kvGet(KEY_THEME_ID);
      const savedAccent = await kvGet(KEY_ACCENT_COLOR);
      const savedMode = await kvGet(KEY_DARK_MODE);
      const savedTextSize = await kvGet(KEY_TEXT_SIZE);

      const theme = savedThemeId ? getThemeById(savedThemeId) ?? null : null;
      const accent = savedAccent || null;

      setActiveTheme(theme);
      setAccentColorState(accent);

      // Restore text size
      if (savedTextSize && (savedTextSize === 'sm' || savedTextSize === 'md' || savedTextSize === 'lg')) {
        setTextSizeState(savedTextSize as TextSize);
        applyTextSize(savedTextSize as TextSize);
      }

      // Restore mode preference (only if no custom theme)
      if (!theme && savedMode) {
        setMode(savedMode === 'true' ? 'dark' : 'light');
      }

      // Apply everything
      applyOverrides(theme, accent, activeFontFamily);
      setLoaded(true);
    }

    restorePreferences();
  }, [isReady, kvGet, applyOverrides, applyTextSize, activeFontFamily, setMode]);

  // ── Re-apply when font changes ───────────────────────────────────────

  useEffect(() => {
    if (!loaded) return;
    applyOverrides(activeTheme, accentColor, activeFontFamily);
  }, [activeFontFamily, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Relay sync: listen for incoming metadata updates ─────────────

  useEffect(() => {
    if (!service) return;

    const unsub = service.onMetadataEvent((event: MetadataEvent) => {
      if (event.type !== 'metadataReceived') return;

      if (event.key === KEY_THEME_ID) {
        const theme = event.value ? getThemeById(event.value) ?? null : null;
        console.log('[ThemeContext] Relay sync: theme updated to', event.value || 'default');
        setActiveTheme(theme);
        applyOverrides(theme, accentColor, activeFontFamily);
        kvSet(KEY_THEME_ID, event.value);
        if (theme) setMode('dark');
      } else if (event.key === KEY_ACCENT_COLOR) {
        const accent = event.value || null;
        console.log('[ThemeContext] Relay sync: accent color updated to', accent);
        setAccentColorState(accent);
        applyOverrides(activeTheme, accent, activeFontFamily);
        kvSet(KEY_ACCENT_COLOR, event.value);
      } else if (event.key === KEY_DARK_MODE) {
        if (!activeTheme) {
          const newMode = event.value === 'true' ? 'dark' : 'light';
          console.log('[ThemeContext] Relay sync: mode updated to', newMode);
          setMode(newMode);
          kvSet(KEY_DARK_MODE, event.value);
        }
      } else if (event.key === KEY_INSTALLED_THEMES) {
        try {
          const ids: string[] = JSON.parse(event.value);
          console.log('[ThemeContext] Relay sync: installed themes updated');
          setInstalledThemeIds(new Set(ids));
          kvSet(KEY_INSTALLED_THEMES, event.value);
        } catch {}
      } else if (event.key === KEY_TEXT_SIZE) {
        const size = event.value as TextSize;
        if (size === 'sm' || size === 'md' || size === 'lg') {
          console.log('[ThemeContext] Relay sync: text size updated to', size);
          setTextSizeState(size);
          applyTextSize(size);
          kvSet(KEY_TEXT_SIZE, event.value);
        }
      }
    });

    return unsub;
  }, [service, kvSet, activeTheme, accentColor, activeFontFamily, applyOverrides, applyTextSize, setMode]);

  // ── Public setters ───────────────────────────────────────────────────

  const installTheme = useCallback(
    (id: string) => {
      const theme = getThemeById(id);
      if (!theme) return;

      setInstalledThemeIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        // Persist + relay sync
        const value = JSON.stringify(Array.from(next));
        kvSet(KEY_INSTALLED_THEMES, value);
        relaySync(KEY_INSTALLED_THEMES, value);
        return next;
      });
    },
    [kvSet, relaySync],
  );

  const uninstallTheme = useCallback(
    (id: string) => {
      // If this theme is active, reset to default first
      if (activeTheme?.id === id) {
        setActiveTheme(null);
        applyOverrides(null, accentColor, activeFontFamily);
        kvSet(KEY_THEME_ID, '');
        relaySync(KEY_THEME_ID, '');
      }

      setInstalledThemeIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        // Persist + relay sync
        const value = JSON.stringify(Array.from(next));
        kvSet(KEY_INSTALLED_THEMES, value);
        relaySync(KEY_INSTALLED_THEMES, value);
        return next;
      });
    },
    [activeTheme, accentColor, activeFontFamily, applyOverrides, kvSet, relaySync],
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
        relaySync(KEY_ACCENT_COLOR, '');
      }

      setActiveTheme(theme);
      applyOverrides(theme, null, activeFontFamily);

      // Persist + relay sync
      const themeId = theme ? theme.id : '';
      kvSet(KEY_THEME_ID, themeId);
      relaySync(KEY_THEME_ID, themeId);
    },
    [activeFontFamily, applyOverrides, kvSet, relaySync, installedThemeIds, installTheme],
  );

  const setAccentColor = useCallback(
    (color: string | null) => {
      setAccentColorState(color);
      applyOverrides(activeTheme, color, activeFontFamily);

      // Persist + relay sync
      const value = color ?? '';
      kvSet(KEY_ACCENT_COLOR, value);
      relaySync(KEY_ACCENT_COLOR, value);
    },
    [activeTheme, activeFontFamily, applyOverrides, kvSet, relaySync],
  );

  const setTextSize = useCallback(
    (size: TextSize) => {
      setTextSizeState(size);
      applyTextSize(size);
      kvSet(KEY_TEXT_SIZE, size);
      relaySync(KEY_TEXT_SIZE, size);
    },
    [applyTextSize, kvSet, relaySync],
  );

  // ── Persist mode changes ─────────────────────────────────────────────
  // When user toggles mode (only available when no custom theme), persist it

  useEffect(() => {
    if (!loaded || activeTheme) return;
    const value = mode === 'dark' ? 'true' : 'false';
    kvSet(KEY_DARK_MODE, value);
    relaySync(KEY_DARK_MODE, value);
  }, [mode, loaded, activeTheme, kvSet, relaySync]);

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
      preferencesLoaded: loaded,
      textSize,
      setTextSize,
    }),
    [activeTheme, installedThemeIds, installTheme, uninstallTheme, setTheme, accentColor, setAccentColor, loaded, textSize, setTextSize],
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
