/**
 * FontContext — Manages font loading, selection, and persistence.
 *
 * Loads Google Fonts dynamically, persists selection via WASM KV store,
 * and applies the selected font globally via CSS injection.
 *
 * NOTE: Wisp `setOverrides({ typography })` is handled by ThemeContext,
 * which reads `activeFont` from this context and composes it with theme +
 * accent overrides in a single call.
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
import { Platform, Text as RNText, TextInput } from 'react-native';
import * as ExpoFont from 'expo-font';
import { getWasm } from '@umbra/wasm';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import { syncMetadataViaRelay } from '@umbra/service';
import type { MetadataEvent } from '@umbra/service';
import { fetchGoogleFontsCatalog } from '@/services/googleFontsApi';

// ─────────────────────────────────────────────────────────────────────────────
// Font Registry
// ─────────────────────────────────────────────────────────────────────────────

export interface FontEntry {
  /** Unique ID (lowercase, hyphenated) */
  id: string;
  /** Display name */
  name: string;
  /** Google Fonts family name (for URL) */
  family: string;
  /** Category for filtering */
  category: 'sans-serif' | 'serif' | 'monospace' | 'display' | 'handwriting';
  /** CSS font-family value (with fallbacks) */
  css: string;
  /** Google Fonts weights to load */
  weights: number[];
  /** Whether this font is bundled (always available) vs installable */
  builtin?: boolean;
  /** Preview text */
  preview?: string;
}

/**
 * Get the platform-appropriate fontFamily string for a FontEntry.
 * - Web: returns the CSS value with fallbacks (e.g. '"Inter", sans-serif')
 * - Native: returns just the font name (e.g. 'Inter') since RN expects the
 *   registered font name without quotes or fallbacks.
 */
export function getFontFamily(font: FontEntry): string {
  if (font.id === 'system') return font.css;
  if (Platform.OS === 'web') return font.css;
  // Native: use the display name which matches what we register via expo-font
  return font.name;
}

/** Default system font stack */
const SYSTEM_FONT: FontEntry = {
  id: 'system',
  name: 'System Default',
  family: '',
  category: 'sans-serif',
  css: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  weights: [400, 500, 600, 700],
  builtin: true,
};

/** Curated Google Fonts collection */
export const FONT_REGISTRY: FontEntry[] = [
  SYSTEM_FONT,
  // ── Sans-Serif ──────────────────────────────────────────────────────
  { id: 'inter', name: 'Inter', family: 'Inter', category: 'sans-serif', css: '"Inter", sans-serif', weights: [400, 500, 600, 700] },
  { id: 'roboto', name: 'Roboto', family: 'Roboto', category: 'sans-serif', css: '"Roboto", sans-serif', weights: [400, 500, 700] },
  { id: 'open-sans', name: 'Open Sans', family: 'Open+Sans', category: 'sans-serif', css: '"Open Sans", sans-serif', weights: [400, 500, 600, 700] },
  { id: 'lato', name: 'Lato', family: 'Lato', category: 'sans-serif', css: '"Lato", sans-serif', weights: [400, 700] },
  { id: 'poppins', name: 'Poppins', family: 'Poppins', category: 'sans-serif', css: '"Poppins", sans-serif', weights: [400, 500, 600, 700] },
  { id: 'nunito', name: 'Nunito', family: 'Nunito', category: 'sans-serif', css: '"Nunito", sans-serif', weights: [400, 600, 700] },
  { id: 'montserrat', name: 'Montserrat', family: 'Montserrat', category: 'sans-serif', css: '"Montserrat", sans-serif', weights: [400, 500, 600, 700] },
  { id: 'raleway', name: 'Raleway', family: 'Raleway', category: 'sans-serif', css: '"Raleway", sans-serif', weights: [400, 500, 600, 700] },
  { id: 'dm-sans', name: 'DM Sans', family: 'DM+Sans', category: 'sans-serif', css: '"DM Sans", sans-serif', weights: [400, 500, 700] },
  { id: 'manrope', name: 'Manrope', family: 'Manrope', category: 'sans-serif', css: '"Manrope", sans-serif', weights: [400, 500, 600, 700] },
  { id: 'plus-jakarta-sans', name: 'Plus Jakarta Sans', family: 'Plus+Jakarta+Sans', category: 'sans-serif', css: '"Plus Jakarta Sans", sans-serif', weights: [400, 500, 600, 700] },
  { id: 'source-sans-3', name: 'Source Sans 3', family: 'Source+Sans+3', category: 'sans-serif', css: '"Source Sans 3", sans-serif', weights: [400, 600, 700] },
  { id: 'work-sans', name: 'Work Sans', family: 'Work+Sans', category: 'sans-serif', css: '"Work Sans", sans-serif', weights: [400, 500, 600, 700] },
  { id: 'outfit', name: 'Outfit', family: 'Outfit', category: 'sans-serif', css: '"Outfit", sans-serif', weights: [400, 500, 600, 700] },
  { id: 'figtree', name: 'Figtree', family: 'Figtree', category: 'sans-serif', css: '"Figtree", sans-serif', weights: [400, 500, 600, 700] },
  // ── Serif ───────────────────────────────────────────────────────────
  { id: 'merriweather', name: 'Merriweather', family: 'Merriweather', category: 'serif', css: '"Merriweather", serif', weights: [400, 700] },
  { id: 'playfair-display', name: 'Playfair Display', family: 'Playfair+Display', category: 'serif', css: '"Playfair Display", serif', weights: [400, 500, 600, 700] },
  { id: 'lora', name: 'Lora', family: 'Lora', category: 'serif', css: '"Lora", serif', weights: [400, 500, 600, 700] },
  { id: 'crimson-pro', name: 'Crimson Pro', family: 'Crimson+Pro', category: 'serif', css: '"Crimson Pro", serif', weights: [400, 500, 600, 700] },
  { id: 'eb-garamond', name: 'EB Garamond', family: 'EB+Garamond', category: 'serif', css: '"EB Garamond", serif', weights: [400, 500, 600, 700] },
  // ── Monospace ───────────────────────────────────────────────────────
  { id: 'jetbrains-mono', name: 'JetBrains Mono', family: 'JetBrains+Mono', category: 'monospace', css: '"JetBrains Mono", monospace', weights: [400, 500, 700] },
  { id: 'fira-code', name: 'Fira Code', family: 'Fira+Code', category: 'monospace', css: '"Fira Code", monospace', weights: [400, 500, 700] },
  { id: 'source-code-pro', name: 'Source Code Pro', family: 'Source+Code+Pro', category: 'monospace', css: '"Source Code Pro", monospace', weights: [400, 500, 700] },
  // ── Display ─────────────────────────────────────────────────────────
  { id: 'space-grotesk', name: 'Space Grotesk', family: 'Space+Grotesk', category: 'display', css: '"Space Grotesk", sans-serif', weights: [400, 500, 600, 700] },
  { id: 'sora', name: 'Sora', family: 'Sora', category: 'display', css: '"Sora", sans-serif', weights: [400, 500, 600, 700] },
  { id: 'clash-display', name: 'Lexend', family: 'Lexend', category: 'display', css: '"Lexend", sans-serif', weights: [400, 500, 600, 700] },
  // ── Handwriting ─────────────────────────────────────────────────────
  { id: 'caveat', name: 'Caveat', family: 'Caveat', category: 'handwriting', css: '"Caveat", cursive', weights: [400, 500, 600, 700] },
  { id: 'dancing-script', name: 'Dancing Script', family: 'Dancing+Script', category: 'handwriting', css: '"Dancing Script", cursive', weights: [400, 500, 600, 700] },
];

// ─────────────────────────────────────────────────────────────────────────────
// Google Fonts loader (web + native)
// ─────────────────────────────────────────────────────────────────────────────

/** Track which fonts have been loaded natively to avoid re-registering */
const nativeLoadedFonts = new Set<string>();

function buildGoogleFontsUrl(font: FontEntry): string {
  const weights = font.weights.join(';');
  return `https://fonts.googleapis.com/css2?family=${font.family}:wght@${weights}&display=swap`;
}

/**
 * Build a direct .ttf download URL via the fontsource CDN.
 * fontsource hosts Google Fonts as npm packages on jsDelivr.
 * URL pattern: https://cdn.jsdelivr.net/fontsource/fonts/{id}@latest/latin-{weight}-normal.ttf
 */
function buildNativeFontUrl(font: FontEntry, weight: number): string {
  return `https://cdn.jsdelivr.net/fontsource/fonts/${font.id}@latest/latin-${weight}-normal.ttf`;
}

/**
 * Load a Google Font.
 * - Web: injects a <link> stylesheet and waits for the Font Loading API.
 * - Native (iOS/Android): downloads .ttf from fontsource CDN and registers
 *   via expo-font's Font.loadAsync. The font becomes available as the font's
 *   display name (e.g. "Inter", "Poppins") for use in style fontFamily.
 */
export async function loadGoogleFont(font: FontEntry): Promise<void> {
  if (font.id === 'system') return;

  if (Platform.OS === 'web') {
    // Web: CSS injection approach
    const url = buildGoogleFontsUrl(font);
    const linkId = `font-${font.id}`;

    return new Promise((resolve) => {
      if (document.getElementById(linkId)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = () => {
        if ('fonts' in document) {
          document.fonts
            .load(`400 16px ${font.css.split(',')[0]}`)
            .then(() => resolve())
            .catch(() => resolve());
        } else {
          resolve();
        }
      };
      link.onerror = () => resolve();
      document.head.appendChild(link);
    });
  }

  // Native: download .ttf files and register via expo-font
  if (nativeLoadedFonts.has(font.id)) return;

  try {
    // Build a map of font names to remote URLs for each weight.
    // expo-font's loadAsync accepts remote URLs and handles caching.
    const fontMap: Record<string, string> = {};
    for (const weight of font.weights) {
      // Use weight suffix for non-400 weights (e.g. "Inter_500", "Inter_700")
      // The primary weight (400) registers as just the font name
      const key = weight === 400 ? font.name : `${font.name}_${weight}`;
      fontMap[key] = buildNativeFontUrl(font, weight);
    }

    await ExpoFont.loadAsync(fontMap);
    nativeLoadedFonts.add(font.id);
  } catch (err) {
    console.warn(`[FontContext] Failed to load native font "${font.name}":`, err);
    // Don't block — font will fall back to system default
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

export interface FontContextValue {
  /** Currently active font */
  activeFont: FontEntry;
  /** All available fonts (curated + catalog) */
  fonts: FontEntry[];
  /** Curated featured fonts only */
  featuredFonts: FontEntry[];
  /** Set of font IDs that have been installed (loaded) */
  installedFontIds: Set<string>;
  /** Whether a font is currently loading */
  loadingFontId: string | null;
  /** Install (download/load) a font */
  installFont: (fontId: string) => Promise<void>;
  /** Set the active font (must be installed first) */
  setActiveFont: (fontId: string) => Promise<void>;
  /** Category filter options */
  categories: string[];
  /** Whether the full Google Fonts catalog has been loaded */
  catalogLoaded: boolean;
}

const FontContext = createContext<FontContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_FONT_KV_ID = '__umbra_system__';
const FONT_STATE_KEY = 'active_font';
const INSTALLED_FONTS_KEY = 'installed_fonts';

export function FontProvider({ children }: { children: React.ReactNode }) {
  const { isReady, service } = useUmbra();
  const { identity } = useAuth();
  const [activeFont, setActiveFontState] = useState<FontEntry>(SYSTEM_FONT);
  const [installedFontIds, setInstalledFontIds] = useState<Set<string>>(new Set(['system']));
  const [loadingFontId, setLoadingFontId] = useState<string | null>(null);
  const [allFonts, setAllFonts] = useState<FontEntry[]>(FONT_REGISTRY);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const pendingFontIdRef = useRef<string | null>(null);

  // ── Persistence helpers ──────────────────────────────────────────────

  /** Sync a key/value to other sessions via relay */
  const relaySync = useCallback((key: string, value: string) => {
    if (service && identity?.did) {
      try {
        const relayWs = service.getRelayWs();
        if (relayWs) {
          syncMetadataViaRelay(relayWs, identity.did, key, value);
        }
      } catch (err) {
        console.warn('[FontContext] Failed to sync via relay:', err);
      }
    }
  }, [service, identity]);

  const saveFontState = useCallback((key: string, value: string) => {
    try {
      const wasm = getWasm();
      if (!wasm) return;
      const result = (wasm as any).umbra_wasm_plugin_kv_set(SYSTEM_FONT_KV_ID, key, value);
      // Handle async returns (Tauri backend returns Promises)
      if (result && typeof result.then === 'function') {
        result.catch((err: any) => console.warn('[FontContext] Failed to save:', key, err));
      }
    } catch (err) {
      console.warn('[FontContext] Failed to save:', key, err);
    }
  }, []);

  const loadFontState = useCallback(async (key: string): Promise<string | null> => {
    try {
      const wasm = getWasm();
      if (!wasm) return null;
      const result = await (wasm as any).umbra_wasm_plugin_kv_get(SYSTEM_FONT_KV_ID, key);
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;
      return parsed.value ?? null;
    } catch {
      return null;
    }
  }, []);

  // ── Apply font override (web: CSS injection, native: defaultProps) ──
  // NOTE: Wisp typography override is handled by ThemeContext (reads activeFont).
  // On web this injects a global CSS rule; on native it sets Text.defaultProps
  // so every RN <Text> and <TextInput> inherits the fontFamily.

  const applyFont = useCallback((font: FontEntry) => {
    if (Platform.OS === 'web') {
      if (typeof document !== 'undefined') {
        let style = document.getElementById('umbra-font-override');
        if (!style) {
          style = document.createElement('style');
          style.id = 'umbra-font-override';
          document.head.appendChild(style);
        }
        style.textContent = `
          * { font-family: ${font.css} !important; }
        `;
      }
    } else {
      // Native: set defaultProps.style.fontFamily on RN Text and TextInput.
      // This makes every <Text> and <TextInput> use the selected font globally.
      const nativeFamily = font.id === 'system' ? undefined : font.name;

      // Apply to RN Text
      const textDefaults = (RNText as any).defaultProps || {};
      (RNText as any).defaultProps = {
        ...textDefaults,
        style: [textDefaults.style, nativeFamily ? { fontFamily: nativeFamily } : {}],
      };

      // Apply to RN TextInput
      const inputDefaults = (TextInput as any).defaultProps || {};
      (TextInput as any).defaultProps = {
        ...inputDefaults,
        style: [inputDefaults.style, nativeFamily ? { fontFamily: nativeFamily } : {}],
      };
    }
  }, []);

  // ── Load saved state on mount ───────────────────────────────────────

  useEffect(() => {
    if (!isReady) return;

    async function restoreFontState() {
      // Load installed fonts
      const savedInstalled = await loadFontState(INSTALLED_FONTS_KEY);
      let installed = new Set(['system']);
      if (savedInstalled) {
        try {
          const ids: string[] = JSON.parse(savedInstalled);
          ids.forEach((id) => installed.add(id));
        } catch {}
      }

      // Load active font
      const savedFontId = await loadFontState(FONT_STATE_KEY);
      const savedFont = savedFontId
        ? FONT_REGISTRY.find((f) => f.id === savedFontId)
        : null;

      if (savedFont && savedFont.id !== 'system') {
        // Found in curated registry — load immediately
        installed.add(savedFont.id);
        setInstalledFontIds(new Set(installed));

        loadGoogleFont(savedFont).then(() => {
          setActiveFontState(savedFont);
          applyFont(savedFont);
        });
      } else if (savedFontId && savedFontId !== 'system' && !savedFont) {
        // Font from catalog — defer until catalog loads
        pendingFontIdRef.current = savedFontId;
        setInstalledFontIds(installed);
      } else {
        setInstalledFontIds(installed);
      }
    }

    restoreFontState();
  }, [isReady, loadFontState, applyFont]);

  // ── Fetch Google Fonts catalog ─────────────────────────────────────

  useEffect(() => {
    if (!isReady) return;

    fetchGoogleFontsCatalog()
      .then((catalogFonts) => {
        // Merge: curated fonts first, then catalog fonts not already curated
        const curatedIds = new Set(FONT_REGISTRY.map((f) => f.id));
        const newFonts = catalogFonts.filter((f) => !curatedIds.has(f.id));
        setAllFonts([...FONT_REGISTRY, ...newFonts]);
        setCatalogLoaded(true);

        // If there's a pending font from a previous session, restore it now
        const pendingId = pendingFontIdRef.current;
        if (pendingId) {
          pendingFontIdRef.current = null;
          const pendingFont = newFonts.find((f) => f.id === pendingId);
          if (pendingFont) {
            loadGoogleFont(pendingFont).then(() => {
              setActiveFontState(pendingFont);
              applyFont(pendingFont);
              setInstalledFontIds((prev) => {
                const next = new Set(prev);
                next.add(pendingId);
                return next;
              });
            });
          }
        }
      })
      .catch((err) => {
        console.warn('[FontContext] Failed to fetch Google Fonts catalog:', err);
        // Falls back to curated FONT_REGISTRY only — allFonts stays as-is
      });
  }, [isReady, applyFont]);

  // ── Relay sync: listen for incoming metadata updates ─────────────

  useEffect(() => {
    if (!service) return;

    const unsub = service.onMetadataEvent((event: MetadataEvent) => {
      if (event.type !== 'metadataReceived') return;

      if (event.key === FONT_STATE_KEY) {
        const fontId = event.value;
        console.log('[FontContext] Relay sync: active font updated to', fontId);

        if (!fontId || fontId === 'system') {
          setActiveFontState(SYSTEM_FONT);
          applyFont(SYSTEM_FONT);
          saveFontState(FONT_STATE_KEY, 'system');
          return;
        }

        // Try curated registry first, then allFonts
        const font = allFonts.find((f) => f.id === fontId);
        if (font) {
          loadGoogleFont(font).then(() => {
            setActiveFontState(font);
            applyFont(font);
            saveFontState(FONT_STATE_KEY, fontId);
            setInstalledFontIds((prev) => {
              const next = new Set(prev);
              next.add(fontId);
              return next;
            });
          });
        }
      } else if (event.key === INSTALLED_FONTS_KEY) {
        try {
          const ids: string[] = JSON.parse(event.value);
          console.log('[FontContext] Relay sync: installed fonts updated');
          setInstalledFontIds(new Set(['system', ...ids]));
          saveFontState(INSTALLED_FONTS_KEY, event.value);
        } catch {}
      }
    });

    return unsub;
  }, [service, allFonts, applyFont, saveFontState]);

  // ── Install a font ──────────────────────────────────────────────────

  const installFont = useCallback(async (fontId: string) => {
    const font = allFonts.find((f) => f.id === fontId);
    if (!font || fontId === 'system') return;

    setLoadingFontId(fontId);
    try {
      await loadGoogleFont(font);
      setInstalledFontIds((prev) => {
        const next = new Set(prev);
        next.add(fontId);
        // Persist + relay sync
        const value = JSON.stringify(Array.from(next));
        saveFontState(INSTALLED_FONTS_KEY, value);
        relaySync(INSTALLED_FONTS_KEY, value);
        return next;
      });
    } finally {
      setLoadingFontId(null);
    }
  }, [allFonts, saveFontState, relaySync]);

  // ── Set active font ─────────────────────────────────────────────────

  const setActiveFont = useCallback(async (fontId: string) => {
    const font = allFonts.find((f) => f.id === fontId);
    if (!font) return;

    // Install if not yet loaded
    if (!installedFontIds.has(fontId)) {
      await installFont(fontId);
    }

    setActiveFontState(font);
    applyFont(font);
    saveFontState(FONT_STATE_KEY, fontId);
    relaySync(FONT_STATE_KEY, fontId);
  }, [allFonts, installedFontIds, installFont, applyFont, saveFontState, relaySync]);

  // ── Context value ───────────────────────────────────────────────────

  const categories = useMemo(() => {
    const cats = new Set(allFonts.map((f) => f.category));
    return ['all', ...Array.from(cats)];
  }, [allFonts]);

  const value = useMemo<FontContextValue>(
    () => ({
      activeFont,
      fonts: allFonts,
      featuredFonts: FONT_REGISTRY,
      installedFontIds,
      loadingFontId,
      installFont,
      setActiveFont,
      categories,
      catalogLoaded,
    }),
    [activeFont, allFonts, installedFontIds, loadingFontId, installFont, setActiveFont, categories, catalogLoaded],
  );

  return <FontContext.Provider value={value}>{children}</FontContext.Provider>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useFonts(): FontContextValue {
  const ctx = useContext(FontContext);
  if (!ctx) {
    throw new Error('useFonts must be used within a FontProvider');
  }
  return ctx;
}
