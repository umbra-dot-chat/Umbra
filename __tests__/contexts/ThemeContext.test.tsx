/**
 * ThemeContext — Unit Tests
 *
 * Tests for theme management context:
 *   - Default state
 *   - Theme selection
 *   - Accent color
 *   - Text size
 *   - Motion preferences
 *   - Provider requirement
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockKvStore: Record<string, string> = {};

jest.mock('@umbra/wasm', () => ({
  getWasm: jest.fn(() => ({
    umbra_wasm_plugin_kv_set: jest.fn((ns: string, key: string, value: string) => {
      mockKvStore[`${ns}:${key}`] = value;
    }),
    umbra_wasm_plugin_kv_get: jest.fn((ns: string, key: string) => {
      const val = mockKvStore[`${ns}:${key}`];
      return Promise.resolve(JSON.stringify({ value: val ?? null }));
    }),
  })),
}));

const mockSetOverrides = jest.fn();
const mockSetMode = jest.fn();
let mockMode = 'dark';

jest.mock('@coexist/wisp-react-native', () => ({
  useTheme: () => ({
    setOverrides: mockSetOverrides,
    setMode: mockSetMode,
    mode: mockMode,
    colors: {},
  }),
  MotionProvider: ({ children }: any) => children,
}));

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => ({
    isReady: true,
    service: null,
    preferencesReady: true,
    didChanged: 0,
    syncVersion: 0,
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    identity: { did: 'did:key:z6MkThemeTest', displayName: 'ThemeTest' },
  }),
}));

jest.mock('@/contexts/FontContext', () => ({
  useFonts: () => ({
    activeFont: { id: 'system', name: 'System Default', css: 'sans-serif' },
  }),
  getFontFamily: (font: any) => font.css,
}));

jest.mock('@/contexts/SyncContext', () => ({
  markSyncDirty: jest.fn(),
}));

jest.mock('@/themes/registry', () => ({
  THEME_REGISTRY: [
    {
      id: 'midnight',
      name: 'Midnight',
      colors: { background: { canvas: '#0a0a0a' } },
    },
  ],
  getThemeById: (id: string) => {
    if (id === 'midnight') {
      return {
        id: 'midnight',
        name: 'Midnight',
        colors: { background: { canvas: '#0a0a0a' } },
      };
    }
    return null;
  },
}));

import { ThemeProvider, useAppTheme } from '@/contexts/ThemeContext';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  for (const key of Object.keys(mockKvStore)) {
    delete mockKvStore[key];
  }
  mockMode = 'dark';
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ThemeContext — Provider requirement', () => {
  it('useAppTheme throws when used outside ThemeProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useAppTheme());
    }).toThrow('useAppTheme must be used within a ThemeProvider');
    spy.mockRestore();
  });
});

describe('ThemeContext — Default state', () => {
  it('activeTheme starts as null', async () => {
    const { result } = renderHook(() => useAppTheme(), { wrapper });
    await waitFor(() => expect(result.current.preferencesLoaded).toBe(true));
    expect(result.current.activeTheme).toBeNull();
  });

  it('accentColor starts as null', async () => {
    const { result } = renderHook(() => useAppTheme(), { wrapper });
    await waitFor(() => expect(result.current.preferencesLoaded).toBe(true));
    expect(result.current.accentColor).toBeNull();
  });

  it('textSize defaults to md', async () => {
    const { result } = renderHook(() => useAppTheme(), { wrapper });
    await waitFor(() => expect(result.current.preferencesLoaded).toBe(true));
    expect(result.current.textSize).toBe('md');
  });

  it('showModeToggle is true when no custom theme', async () => {
    const { result } = renderHook(() => useAppTheme(), { wrapper });
    await waitFor(() => expect(result.current.preferencesLoaded).toBe(true));
    expect(result.current.showModeToggle).toBe(true);
  });

  it('themes is populated from registry', async () => {
    const { result } = renderHook(() => useAppTheme(), { wrapper });
    await waitFor(() => expect(result.current.preferencesLoaded).toBe(true));
    expect(result.current.themes.length).toBeGreaterThan(0);
  });
});

describe('ThemeContext — Text size', () => {
  it('setTextSize changes the text size', async () => {
    const { result } = renderHook(() => useAppTheme(), { wrapper });
    await waitFor(() => expect(result.current.preferencesLoaded).toBe(true));

    act(() => {
      result.current.setTextSize('lg');
    });
    expect(result.current.textSize).toBe('lg');

    act(() => {
      result.current.setTextSize('sm');
    });
    expect(result.current.textSize).toBe('sm');
  });
});

describe('ThemeContext — Motion preferences', () => {
  it('motionPreferences has default values', async () => {
    const { result } = renderHook(() => useAppTheme(), { wrapper });
    await waitFor(() => expect(result.current.preferencesLoaded).toBe(true));

    expect(result.current.motionPreferences).toEqual({
      reduceMotion: false,
      enableShimmer: true,
      enableAnimations: true,
    });
  });

  it('setMotionPreferences merges partial updates', async () => {
    const { result } = renderHook(() => useAppTheme(), { wrapper });
    await waitFor(() => expect(result.current.preferencesLoaded).toBe(true));

    act(() => {
      result.current.setMotionPreferences({ reduceMotion: true });
    });

    expect(result.current.motionPreferences.reduceMotion).toBe(true);
    expect(result.current.motionPreferences.enableShimmer).toBe(true);
  });
});
