/**
 * Tests for ThemeContext / useAppTheme hook
 *
 * Covers theme preset selection, accent color overrides, text size settings,
 * install/uninstall lifecycle, KV persistence, relay sync, deep merge utility,
 * and showModeToggle logic.
 *
 * Test IDs: T11.4.1 - T11.4.45
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';

// ---------------------------------------------------------------------------
// Mock setup — all mocks BEFORE importing the module under test
// ---------------------------------------------------------------------------

const mockService = {
  getRelayWs: jest.fn(() => ({ send: jest.fn(), readyState: 1 })),
  onMetadataEvent: jest.fn(() => jest.fn()),
};

const mockIdentity = {
  did: 'did:key:z6MkTest',
  displayName: 'Test User',
  createdAt: Date.now() / 1000,
};

// Mock WASM KV store
let kvStore: Record<string, string> = {};
const mockWasm = {
  umbra_wasm_plugin_kv_set: jest.fn((ns: string, key: string, value: string) => {
    kvStore[`${ns}:${key}`] = value;
  }),
  umbra_wasm_plugin_kv_get: jest.fn((ns: string, key: string) => {
    const val = kvStore[`${ns}:${key}`];
    return Promise.resolve(
      val !== undefined ? JSON.stringify({ value: val }) : JSON.stringify({ value: null }),
    );
  }),
};

jest.mock('@umbra/wasm', () => ({
  getWasm: jest.fn(() => mockWasm),
}));

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: jest.fn(() => ({
    isReady: true,
    preferencesReady: true,
    didChanged: 0,
    service: mockService,
  })),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    identity: mockIdentity,
  })),
}));

// Mock Wisp useTheme hook
const mockSetOverrides = jest.fn();
const mockSetMode = jest.fn();
jest.mock('@coexist/wisp-react-native', () => ({
  useTheme: jest.fn(() => ({
    setOverrides: mockSetOverrides,
    setMode: mockSetMode,
    mode: 'dark',
  })),
}));

// Mock FontContext
jest.mock('@/contexts/FontContext', () => ({
  useFonts: jest.fn(() => ({ activeFont: null })),
  getFontFamily: jest.fn(() => ''),
}));

// The @umbra/service mock is auto-resolved via moduleNameMapper to
// __mocks__/@umbra/service.js which now exports syncMetadataViaRelay.

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { ThemeProvider, useAppTheme } from '@/contexts/ThemeContext';
import { THEME_REGISTRY } from '@/themes/registry';
import { syncMetadataViaRelay } from '@umbra/service';

const mockSyncMetadataViaRelay = syncMetadataViaRelay as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(ThemeProvider, null, children);

/** Render the hook and wait for initial preferences to load. */
async function renderAndWait() {
  const hook = renderHook(() => useAppTheme(), { wrapper });
  await waitFor(() => {
    expect(hook.result.current.preferencesLoaded).toBe(true);
  });
  return hook;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  kvStore = {};
  // Reset KV mock implementation (clearAllMocks does not reset implementations)
  mockWasm.umbra_wasm_plugin_kv_get.mockImplementation((ns: string, key: string) => {
    const val = kvStore[`${ns}:${key}`];
    return Promise.resolve(
      val !== undefined ? JSON.stringify({ value: val }) : JSON.stringify({ value: null }),
    );
  });
  mockWasm.umbra_wasm_plugin_kv_set.mockImplementation((ns: string, key: string, value: string) => {
    kvStore[`${ns}:${key}`] = value;
  });
});

// ===========================================================================
// T11.4.1 - T11.4.3 — Default state values
// ===========================================================================

describe('T11.4.1-3 — Default State', () => {
  it('T11.4.1 — activeTheme defaults to null', async () => {
    const { result } = await renderAndWait();
    expect(result.current.activeTheme).toBeNull();
  });

  it('T11.4.2 — accentColor defaults to null', async () => {
    const { result } = await renderAndWait();
    expect(result.current.accentColor).toBeNull();
  });

  it('T11.4.3 — textSize defaults to md, showModeToggle true, preferencesLoaded becomes true', async () => {
    const { result } = await renderAndWait();
    expect(result.current.textSize).toBe('md');
    expect(result.current.showModeToggle).toBe(true);
    expect(result.current.preferencesLoaded).toBe(true);
  });
});

// ===========================================================================
// T11.4.4 — preferencesLoaded starts false
// ===========================================================================

describe('T11.4.4 — Preferences Loading', () => {
  it('T11.4.4 — preferencesLoaded starts false before KV restore completes', () => {
    // Delay KV reads so the initial render captures preferencesLoaded=false
    mockWasm.umbra_wasm_plugin_kv_get.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(JSON.stringify({ value: null })), 50)),
    );

    const { result } = renderHook(() => useAppTheme(), { wrapper });
    expect(result.current.preferencesLoaded).toBe(false);
  });
});

// ===========================================================================
// T11.4.5-6 — Theme browsing
// ===========================================================================

describe('T11.4.5-6 — Theme Browsing', () => {
  it('T11.4.5 — themes returns full THEME_REGISTRY array', async () => {
    const { result } = await renderAndWait();
    expect(result.current.themes).toBe(THEME_REGISTRY);
    expect(result.current.themes.length).toBe(THEME_REGISTRY.length);
  });

  it('T11.4.6 — every theme has required fields (id, name, description, author, mode, colors, swatches)', async () => {
    const { result } = await renderAndWait();
    for (const theme of result.current.themes) {
      expect(typeof theme.id).toBe('string');
      expect(typeof theme.name).toBe('string');
      expect(typeof theme.description).toBe('string');
      expect(typeof theme.author).toBe('string');
      expect(theme.mode).toBe('dark');
      expect(typeof theme.colors).toBe('object');
      expect(Array.isArray(theme.swatches)).toBe(true);
    }
  });
});

// ===========================================================================
// T11.4.7-8 — Installed themes
// ===========================================================================

describe('T11.4.7-8 — Installed Themes', () => {
  it('T11.4.7 — installedThemeIds is initially an empty Set', async () => {
    const { result } = await renderAndWait();
    expect(result.current.installedThemeIds).toBeInstanceOf(Set);
    expect(result.current.installedThemeIds.size).toBe(0);
  });

  it('T11.4.8 — installedThemeIds is a Set (not array)', async () => {
    const { result } = await renderAndWait();
    expect(result.current.installedThemeIds instanceof Set).toBe(true);
  });
});

// ===========================================================================
// T11.4.9-12 — Install / uninstall lifecycle
// ===========================================================================

describe('T11.4.9-12 — Install / Uninstall Lifecycle', () => {
  it('T11.4.9 — installTheme(id) adds id to installedThemeIds', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.installTheme('dracula');
    });

    expect(result.current.installedThemeIds.has('dracula')).toBe(true);
  });

  it('T11.4.10 — installTheme persists via KV', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.installTheme('nord');
    });

    // Verify KV was called with installed_themes
    expect(mockWasm.umbra_wasm_plugin_kv_set).toHaveBeenCalledWith(
      '__umbra_system__',
      'installed_themes',
      expect.any(String),
    );

    // Note: relay sync is now handled by SyncContext (Phase 4), not ThemeContext.
    // See sync-context.test.ts for sync upload tests.
  });

  it('T11.4.11 — uninstallTheme(id) removes from installed set', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.installTheme('dracula');
    });
    expect(result.current.installedThemeIds.has('dracula')).toBe(true);

    act(() => {
      result.current.uninstallTheme('dracula');
    });
    expect(result.current.installedThemeIds.has('dracula')).toBe(false);
  });

  it('T11.4.12 — installTheme with invalid id does nothing', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.installTheme('nonexistent-theme-id');
    });

    expect(result.current.installedThemeIds.size).toBe(0);
  });
});

// ===========================================================================
// T11.4.13-17 — Set theme
// ===========================================================================

describe('T11.4.13-17 — Set Theme', () => {
  it('T11.4.13 — setTheme(id) sets activeTheme to the matching preset', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.setTheme('dracula');
    });

    expect(result.current.activeTheme).not.toBeNull();
    expect(result.current.activeTheme!.id).toBe('dracula');
    expect(result.current.activeTheme!.name).toBe('Dracula');
  });

  it('T11.4.14 — setTheme auto-installs if theme not already installed', async () => {
    const { result } = await renderAndWait();

    expect(result.current.installedThemeIds.has('tokyo-night')).toBe(false);

    act(() => {
      result.current.setTheme('tokyo-night');
    });

    expect(result.current.installedThemeIds.has('tokyo-night')).toBe(true);
    expect(result.current.activeTheme!.id).toBe('tokyo-night');
  });

  it('T11.4.15 — setTheme resets accent color to null', async () => {
    const { result } = await renderAndWait();

    // Set an accent color first
    act(() => {
      result.current.setAccentColor('#ff0000');
    });
    expect(result.current.accentColor).toBe('#ff0000');

    // Setting a theme should reset accent
    act(() => {
      result.current.setTheme('nord');
    });
    expect(result.current.accentColor).toBeNull();
  });

  it('T11.4.16 — setTheme(null) resets to default', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.setTheme('dracula');
    });
    expect(result.current.activeTheme).not.toBeNull();

    act(() => {
      result.current.setTheme(null);
    });
    expect(result.current.activeTheme).toBeNull();
  });

  it('T11.4.17 — setTheme persists theme_id via KV', async () => {
    const { result } = await renderAndWait();
    jest.clearAllMocks();

    act(() => {
      result.current.setTheme('monokai');
    });

    expect(mockWasm.umbra_wasm_plugin_kv_set).toHaveBeenCalledWith(
      '__umbra_system__',
      'theme_id',
      'monokai',
    );

    // Note: relay sync is now handled by SyncContext (Phase 4), not ThemeContext.
  });
});

// ===========================================================================
// T11.4.18-20 — Uninstall active theme resets to default
// ===========================================================================

describe('T11.4.18-20 — Uninstall Active Theme', () => {
  it('T11.4.18 — uninstalling the active theme resets activeTheme to null', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.setTheme('dracula');
    });
    expect(result.current.activeTheme!.id).toBe('dracula');

    act(() => {
      result.current.uninstallTheme('dracula');
    });
    expect(result.current.activeTheme).toBeNull();
  });

  it('T11.4.19 — uninstalling inactive theme does not change active theme', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.installTheme('nord');
      result.current.setTheme('dracula');
    });

    act(() => {
      result.current.uninstallTheme('nord');
    });

    expect(result.current.activeTheme!.id).toBe('dracula');
    expect(result.current.installedThemeIds.has('nord')).toBe(false);
  });

  it('T11.4.20 — uninstalling active theme persists empty theme_id', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.setTheme('dracula');
    });
    jest.clearAllMocks();

    act(() => {
      result.current.uninstallTheme('dracula');
    });

    expect(mockWasm.umbra_wasm_plugin_kv_set).toHaveBeenCalledWith(
      '__umbra_system__',
      'theme_id',
      '',
    );
  });
});

// ===========================================================================
// T11.4.21-24 — Accent color
// ===========================================================================

describe('T11.4.21-24 — Accent Color', () => {
  it('T11.4.21 — setAccentColor sets the accent color', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.setAccentColor('#6366f1');
    });

    expect(result.current.accentColor).toBe('#6366f1');
  });

  it('T11.4.22 — setAccentColor(null) clears accent', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.setAccentColor('#ff0000');
    });
    expect(result.current.accentColor).toBe('#ff0000');

    act(() => {
      result.current.setAccentColor(null);
    });
    expect(result.current.accentColor).toBeNull();
  });

  it('T11.4.23 — setAccentColor applies overrides via setOverrides', async () => {
    const { result } = await renderAndWait();
    mockSetOverrides.mockClear();

    act(() => {
      result.current.setAccentColor('#00ff00');
    });

    expect(mockSetOverrides).toHaveBeenCalled();
    const lastCall = mockSetOverrides.mock.calls[mockSetOverrides.mock.calls.length - 1][0];
    expect(lastCall.colors.accent.primary).toBe('#00ff00');
  });

  it('T11.4.24 — setAccentColor persists via KV', async () => {
    const { result } = await renderAndWait();
    jest.clearAllMocks();

    act(() => {
      result.current.setAccentColor('#123abc');
    });

    expect(mockWasm.umbra_wasm_plugin_kv_set).toHaveBeenCalledWith(
      '__umbra_system__',
      'accent_color',
      '#123abc',
    );

    // Note: relay sync is now handled by SyncContext (Phase 4), not ThemeContext.
  });
});

// ===========================================================================
// T11.4.25-28 — Text size
// ===========================================================================

describe('T11.4.25-28 — Text Size', () => {
  it('T11.4.25 — setTextSize("sm") sets textSize to sm', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.setTextSize('sm');
    });

    expect(result.current.textSize).toBe('sm');
  });

  it('T11.4.26 — setTextSize("lg") sets textSize to lg', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.setTextSize('lg');
    });

    expect(result.current.textSize).toBe('lg');
  });

  it('T11.4.27 — setTextSize("md") keeps default', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.setTextSize('sm');
    });
    expect(result.current.textSize).toBe('sm');

    act(() => {
      result.current.setTextSize('md');
    });
    expect(result.current.textSize).toBe('md');
  });

  it('T11.4.28 — setTextSize persists via KV', async () => {
    const { result } = await renderAndWait();
    jest.clearAllMocks();

    act(() => {
      result.current.setTextSize('lg');
    });

    expect(mockWasm.umbra_wasm_plugin_kv_set).toHaveBeenCalledWith(
      '__umbra_system__',
      'text_size',
      'lg',
    );

    // Note: relay sync is now handled by SyncContext (Phase 4), not ThemeContext.
  });
});

// ===========================================================================
// T11.4.29 — TEXT_SIZE_SCALES
// ===========================================================================

describe('T11.4.29 — TEXT_SIZE_SCALES Constants', () => {
  it('T11.4.29 — text size states cycle correctly through sm, md, lg', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.setTextSize('sm');
    });
    expect(result.current.textSize).toBe('sm');

    act(() => {
      result.current.setTextSize('md');
    });
    expect(result.current.textSize).toBe('md');

    act(() => {
      result.current.setTextSize('lg');
    });
    expect(result.current.textSize).toBe('lg');
  });
});

// ===========================================================================
// T11.4.30-31 — showModeToggle logic
// ===========================================================================

describe('T11.4.30-31 — Show Mode Toggle', () => {
  it('T11.4.30 — showModeToggle is true when no custom theme is active', async () => {
    const { result } = await renderAndWait();
    expect(result.current.activeTheme).toBeNull();
    expect(result.current.showModeToggle).toBe(true);
  });

  it('T11.4.31 — showModeToggle is false when a theme is active', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.setTheme('dracula');
    });

    expect(result.current.activeTheme).not.toBeNull();
    expect(result.current.showModeToggle).toBe(false);
  });
});

// ===========================================================================
// T11.4.32-34 — KV persistence (verify kvSet calls)
// ===========================================================================

describe('T11.4.32-34 — KV Persistence', () => {
  it('T11.4.32 — setTheme persists theme_id to KV store', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.setTheme('synthwave');
    });

    expect(kvStore['__umbra_system__:theme_id']).toBe('synthwave');
  });

  it('T11.4.33 — setAccentColor persists accent_color to KV store', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.setAccentColor('#abcdef');
    });

    expect(kvStore['__umbra_system__:accent_color']).toBe('#abcdef');
  });

  it('T11.4.34 — installTheme persists installed_themes as JSON array to KV store', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.installTheme('dracula');
    });

    const stored = kvStore['__umbra_system__:installed_themes'];
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toContain('dracula');
  });
});

// ===========================================================================
// T11.4.35-36 — KV Persistence (replaces deprecated relay sync tests)
// ===========================================================================

describe('T11.4.35-36 — KV Persistence for Sync', () => {
  it('T11.4.35 — setTheme persists theme_id to KV store for SyncContext', async () => {
    const { result } = await renderAndWait();
    jest.clearAllMocks();

    act(() => {
      result.current.setTheme('rose-pine');
    });

    // Theme ID is written to KV; SyncContext (not ThemeContext) handles
    // syncing to the relay via markDirty() → debounced upload.
    expect(kvStore['__umbra_system__:theme_id']).toBe('rose-pine');
  });

  it('T11.4.36 — setTextSize persists text_size to KV store for SyncContext', async () => {
    const { result } = await renderAndWait();
    jest.clearAllMocks();

    act(() => {
      result.current.setTextSize('sm');
    });

    expect(kvStore['__umbra_system__:text_size']).toBe('sm');
  });
});

// ===========================================================================
// T11.4.37 — Deep merge behavior
// ===========================================================================

describe('T11.4.37 — Deep Merge via Accent Override', () => {
  it('T11.4.37 — setting accent on top of theme deep-merges accent.primary into theme colors', async () => {
    const { result } = await renderAndWait();

    // Set a theme first (which has its own colors)
    act(() => {
      result.current.setTheme('nord');
    });
    mockSetOverrides.mockClear();

    // Now set an accent color — this should deep-merge accent.primary
    act(() => {
      result.current.setAccentColor('#ff5500');
    });

    expect(mockSetOverrides).toHaveBeenCalled();
    const lastOverrides = mockSetOverrides.mock.calls[mockSetOverrides.mock.calls.length - 1][0];
    // The colors object should include the Nord theme colors with accent.primary overridden
    expect(lastOverrides.colors).toBeDefined();
    expect(lastOverrides.colors.accent.primary).toBe('#ff5500');
  });
});

// ===========================================================================
// T11.4.38 — Preferences restore on mount
// ===========================================================================

describe('T11.4.38 — Preferences Restore on Mount', () => {
  it('T11.4.38 — restores installed themes and text size from KV on mount', async () => {
    // Pre-populate KV store with saved preferences
    kvStore['__umbra_system__:installed_themes'] = JSON.stringify(['dracula', 'nord']);
    kvStore['__umbra_system__:text_size'] = 'lg';

    const { result } = renderHook(() => useAppTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current.preferencesLoaded).toBe(true);
    });

    // Installed themes should be restored from KV
    expect(result.current.installedThemeIds.has('dracula')).toBe(true);
    expect(result.current.installedThemeIds.has('nord')).toBe(true);
    expect(result.current.installedThemeIds.size).toBe(2);
    expect(result.current.textSize).toBe('lg');
  });
});

// ===========================================================================
// T11.4.39 — useAppTheme throws outside provider
// ===========================================================================

describe('T11.4.39 — useAppTheme Outside Provider', () => {
  it('T11.4.39 — useAppTheme throws when used outside ThemeProvider', () => {
    // Suppress console.error for the expected error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAppTheme());
    }).toThrow('useAppTheme must be used within a ThemeProvider');

    spy.mockRestore();
  });
});

// ===========================================================================
// T11.4.40 — setTheme(null) persists empty string
// ===========================================================================

describe('T11.4.40 — Reset Theme Persistence', () => {
  it('T11.4.40 — setTheme(null) persists empty theme_id', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.setTheme('dracula');
    });
    jest.clearAllMocks();

    act(() => {
      result.current.setTheme(null);
    });

    expect(mockWasm.umbra_wasm_plugin_kv_set).toHaveBeenCalledWith(
      '__umbra_system__',
      'theme_id',
      '',
    );

    // Note: relay sync is now handled by SyncContext (Phase 4), not ThemeContext.
  });
});

// ===========================================================================
// T11.4.41 — setTheme does not auto-install if already installed
// ===========================================================================

describe('T11.4.41 — No Duplicate Install', () => {
  it('T11.4.41 — setTheme skips installTheme if theme already installed', async () => {
    const { result } = await renderAndWait();

    // Pre-install the theme
    act(() => {
      result.current.installTheme('dracula');
    });
    jest.clearAllMocks();

    // Now set the same theme — should NOT call installTheme again
    act(() => {
      result.current.setTheme('dracula');
    });

    // The installed_themes KV set should NOT be called again since it was already installed
    const installedThemeCalls = mockWasm.umbra_wasm_plugin_kv_set.mock.calls.filter(
      (c: any[]) => c[1] === 'installed_themes',
    );
    expect(installedThemeCalls.length).toBe(0);
  });
});

// ===========================================================================
// T11.4.42 — setTheme forces dark mode
// ===========================================================================

describe('T11.4.42 — Theme Forces Dark Mode', () => {
  it('T11.4.42 — setting a theme calls setMode("dark")', async () => {
    const { result } = await renderAndWait();
    mockSetMode.mockClear();

    act(() => {
      result.current.setTheme('nord');
    });

    // applyOverrides calls setMode('dark') when theme is not null
    expect(mockSetMode).toHaveBeenCalledWith('dark');
  });
});

// ===========================================================================
// T11.4.43 — Multiple installs accumulate
// ===========================================================================

describe('T11.4.43 — Multiple Theme Installs', () => {
  it('T11.4.43 — installing multiple themes accumulates them in the set', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.installTheme('dracula');
    });
    act(() => {
      result.current.installTheme('nord');
    });
    act(() => {
      result.current.installTheme('monokai');
    });

    expect(result.current.installedThemeIds.size).toBe(3);
    expect(result.current.installedThemeIds.has('dracula')).toBe(true);
    expect(result.current.installedThemeIds.has('nord')).toBe(true);
    expect(result.current.installedThemeIds.has('monokai')).toBe(true);
  });
});

// ===========================================================================
// T11.4.44 — setAccentColor(null) persists empty string
// ===========================================================================

describe('T11.4.44 — Clear Accent Persistence', () => {
  it('T11.4.44 — setAccentColor(null) persists empty accent_color', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.setAccentColor('#ff0000');
    });
    jest.clearAllMocks();

    act(() => {
      result.current.setAccentColor(null);
    });

    expect(mockWasm.umbra_wasm_plugin_kv_set).toHaveBeenCalledWith(
      '__umbra_system__',
      'accent_color',
      '',
    );
  });
});

// ===========================================================================
// T11.4.45 — showModeToggle returns true after resetting theme
// ===========================================================================

describe('T11.4.45 — Mode Toggle After Reset', () => {
  it('T11.4.45 — showModeToggle returns true after theme is reset to null', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.setTheme('dracula');
    });
    expect(result.current.showModeToggle).toBe(false);

    act(() => {
      result.current.setTheme(null);
    });
    expect(result.current.showModeToggle).toBe(true);
  });
});
