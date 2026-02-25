/**
 * SoundContext — Orchestrates the SoundEngine and persists preferences.
 *
 * Follows the exact same pattern as ThemeContext:
 *   • Uses `useUmbra().isReady` to gate KV reads
 *   • Persists master volume, muted, category volumes, and active theme
 *     via WASM KV store (`__umbra_system__` namespace)
 *   • Provides `playSound()` and volume/mute/theme controls to children
 *
 * Sounds are **on by default** at 80% master volume with the "playful"
 * synth theme.
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
import { getWasm } from '@umbra/wasm';
import { useUmbra } from '@/contexts/UmbraContext';
import {
  SoundEngine,
  SOUND_CATEGORIES,
  type SoundCategory,
  type SoundName,
  type SoundThemeId,
} from '@/services/SoundEngine';

// ─────────────────────────────────────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────────────────────────────────────

export interface SoundContextValue {
  /** Play a named sound effect. */
  playSound: (name: SoundName) => void;
  /** Master volume 0–1 (default 0.8). */
  masterVolume: number;
  /** Set master volume 0–1. */
  setMasterVolume: (v: number) => void;
  /** Whether all sounds are muted. */
  muted: boolean;
  /** Mute or unmute all sounds. */
  setMuted: (m: boolean) => void;
  /** Per-category volume 0–1. */
  categoryVolumes: Record<SoundCategory, number>;
  /** Set volume for a specific category. */
  setCategoryVolume: (cat: SoundCategory, v: number) => void;
  /** Per-category enabled/disabled. */
  categoryEnabled: Record<SoundCategory, boolean>;
  /** Enable or disable a specific category. */
  setCategoryEnabled: (cat: SoundCategory, enabled: boolean) => void;
  /** Active sound theme ID. */
  activeTheme: SoundThemeId;
  /** Switch the active sound theme. */
  setActiveTheme: (id: SoundThemeId) => void;
  /** Whether saved preferences have been restored from KV. */
  preferencesLoaded: boolean;
}

const SoundCtx = createContext<SoundContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Persistence keys
// ─────────────────────────────────────────────────────────────────────────────

const KV_NAMESPACE = '__umbra_system__';
const KEY_MASTER_VOLUME = 'sound_master_volume';
const KEY_MUTED = 'sound_muted';
const KEY_CATEGORY_VOLUMES = 'sound_category_volumes';
const KEY_CATEGORY_ENABLED = 'sound_category_enabled';
const KEY_THEME = 'sound_theme';

// ─────────────────────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_MASTER_VOLUME = 0.8;
const DEFAULT_MUTED = false;
const DEFAULT_THEME: SoundThemeId = 'playful';

function defaultCategoryVolumes(): Record<SoundCategory, number> {
  return { message: 1.0, call: 1.0, navigation: 1.0, social: 1.0, system: 1.0 };
}

function defaultCategoryEnabled(): Record<SoundCategory, boolean> {
  return { message: true, call: true, navigation: false, social: true, system: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const { isReady } = useUmbra();

  // Singleton engine (created once, never destroyed)
  const engineRef = useRef<SoundEngine>(new SoundEngine());

  const [masterVolume, setMasterVolumeState] = useState(DEFAULT_MASTER_VOLUME);
  const [muted, setMutedState] = useState(DEFAULT_MUTED);
  const [categoryVolumes, setCategoryVolumesState] = useState<Record<SoundCategory, number>>(
    defaultCategoryVolumes,
  );
  const [categoryEnabled, setCategoryEnabledState] = useState<Record<SoundCategory, boolean>>(
    defaultCategoryEnabled,
  );
  const [activeTheme, setActiveThemeState] = useState<SoundThemeId>(DEFAULT_THEME);
  const [loaded, setLoaded] = useState(false);

  const initialRestoreRef = useRef(false);

  // ── KV helpers (same pattern as ThemeContext) ──────────────────────

  const kvSet = useCallback((key: string, value: string) => {
    try {
      const wasm = getWasm();
      if (!wasm) return;
      (wasm as any).umbra_wasm_plugin_kv_set(KV_NAMESPACE, key, value);
    } catch (err) {
      console.warn('[SoundContext] Failed to save:', key, err);
    }
  }, []);

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

  // ── Restore from KV on mount ──────────────────────────────────────

  useEffect(() => {
    if (!isReady || initialRestoreRef.current) return;
    initialRestoreRef.current = true;

    async function restorePreferences() {
      const engine = engineRef.current;

      // Master volume
      const savedVol = await kvGet(KEY_MASTER_VOLUME);
      if (savedVol !== null) {
        const v = parseFloat(savedVol);
        if (!isNaN(v)) {
          setMasterVolumeState(v);
          engine.setMasterVolume(v);
        }
      } else {
        engine.setMasterVolume(DEFAULT_MASTER_VOLUME);
      }

      // Muted
      const savedMuted = await kvGet(KEY_MUTED);
      if (savedMuted !== null) {
        const m = savedMuted === 'true';
        setMutedState(m);
        engine.setMuted(m);
      }

      // Category volumes
      const savedCat = await kvGet(KEY_CATEGORY_VOLUMES);
      if (savedCat) {
        try {
          const parsed = JSON.parse(savedCat);
          const vols = defaultCategoryVolumes();
          for (const cat of SOUND_CATEGORIES) {
            if (typeof parsed[cat] === 'number') {
              vols[cat] = parsed[cat];
              engine.setCategoryVolume(cat, parsed[cat]);
            }
          }
          setCategoryVolumesState(vols);
        } catch {
          // ignore corrupt data
        }
      }

      // Category enabled/disabled
      const savedEnabled = await kvGet(KEY_CATEGORY_ENABLED);
      if (savedEnabled) {
        try {
          const parsed = JSON.parse(savedEnabled);
          const enabled = defaultCategoryEnabled();
          for (const cat of SOUND_CATEGORIES) {
            if (typeof parsed[cat] === 'boolean') {
              enabled[cat] = parsed[cat];
              engine.setCategoryEnabled(cat, parsed[cat]);
            }
          }
          setCategoryEnabledState(enabled);
        } catch {
          // ignore corrupt data — use defaults
          const defaults = defaultCategoryEnabled();
          for (const cat of SOUND_CATEGORIES) {
            engine.setCategoryEnabled(cat, defaults[cat]);
          }
        }
      } else {
        // Apply defaults to engine
        const defaults = defaultCategoryEnabled();
        for (const cat of SOUND_CATEGORIES) {
          engine.setCategoryEnabled(cat, defaults[cat]);
        }
      }

      // Theme
      const savedTheme = await kvGet(KEY_THEME);
      if (savedTheme) {
        setActiveThemeState(savedTheme as SoundThemeId);
        engine.setActiveTheme(savedTheme as SoundThemeId);
      } else {
        engine.setActiveTheme(DEFAULT_THEME);
      }

      setLoaded(true);
    }

    restorePreferences();
  }, [isReady, kvGet]);

  // ── Resume AudioContext on first user interaction ──────────────────

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const resume = () => {
      engineRef.current.resumeContext();
      document.removeEventListener('click', resume);
      document.removeEventListener('touchstart', resume);
      document.removeEventListener('keydown', resume);
    };

    document.addEventListener('click', resume, { once: true });
    document.addEventListener('touchstart', resume, { once: true });
    document.addEventListener('keydown', resume, { once: true });

    return () => {
      document.removeEventListener('click', resume);
      document.removeEventListener('touchstart', resume);
      document.removeEventListener('keydown', resume);
    };
  }, []);

  // ── Actions ───────────────────────────────────────────────────────

  const playSound = useCallback((name: SoundName) => {
    engineRef.current.playSound(name);
  }, []);

  const setMasterVolume = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      setMasterVolumeState(clamped);
      engineRef.current.setMasterVolume(clamped);
      kvSet(KEY_MASTER_VOLUME, String(clamped));
    },
    [kvSet],
  );

  const setMuted = useCallback(
    (m: boolean) => {
      setMutedState(m);
      engineRef.current.setMuted(m);
      kvSet(KEY_MUTED, m ? 'true' : 'false');
    },
    [kvSet],
  );

  const setCategoryVolume = useCallback(
    (cat: SoundCategory, v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      setCategoryVolumesState((prev) => {
        const next = { ...prev, [cat]: clamped };
        engineRef.current.setCategoryVolume(cat, clamped);
        kvSet(KEY_CATEGORY_VOLUMES, JSON.stringify(next));
        return next;
      });
    },
    [kvSet],
  );

  const setCategoryEnabled = useCallback(
    (cat: SoundCategory, enabled: boolean) => {
      setCategoryEnabledState((prev) => {
        const next = { ...prev, [cat]: enabled };
        engineRef.current.setCategoryEnabled(cat, enabled);
        kvSet(KEY_CATEGORY_ENABLED, JSON.stringify(next));
        return next;
      });
    },
    [kvSet],
  );

  const setActiveTheme = useCallback(
    (id: SoundThemeId) => {
      setActiveThemeState(id);
      engineRef.current.setActiveTheme(id);
      kvSet(KEY_THEME, id);

      // Pre-load audio pack files if switching to an audio theme
      if (id === 'aurora' || id === 'mechanical') {
        engineRef.current.preloadAudioPack(id);
      }
    },
    [kvSet],
  );

  // ── Context value ─────────────────────────────────────────────────

  const value = useMemo<SoundContextValue>(
    () => ({
      playSound,
      masterVolume,
      setMasterVolume,
      muted,
      setMuted,
      categoryVolumes,
      setCategoryVolume,
      categoryEnabled,
      setCategoryEnabled,
      activeTheme,
      setActiveTheme,
      preferencesLoaded: loaded,
    }),
    [
      playSound,
      masterVolume,
      setMasterVolume,
      muted,
      setMuted,
      categoryVolumes,
      setCategoryVolume,
      categoryEnabled,
      setCategoryEnabled,
      activeTheme,
      setActiveTheme,
      loaded,
    ],
  );

  return <SoundCtx.Provider value={value}>{children}</SoundCtx.Provider>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useSound(): SoundContextValue {
  const ctx = useContext(SoundCtx);
  if (!ctx) {
    throw new Error('useSound() must be used within a <SoundProvider>');
  }
  return ctx;
}
