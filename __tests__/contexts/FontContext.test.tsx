/**
 * FontContext — Unit Tests
 *
 * Tests for font context state management:
 *   - Default state
 *   - Font registry
 *   - Provider requirement
 */

import React from 'react';
import { renderHook } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@umbra/wasm', () => ({
  getWasm: jest.fn(() => null),
}));

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => ({
    isReady: false,
    preferencesReady: false,
    didChanged: 0,
    syncVersion: 0,
  }),
}));

jest.mock('@/contexts/SyncContext', () => ({
  markSyncDirty: jest.fn(),
}));

jest.mock('@/services/googleFontsApi', () => ({
  fetchGoogleFontsCatalog: jest.fn().mockResolvedValue([]),
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn().mockResolvedValue(undefined),
}));

import { FontProvider, useFonts, FONT_REGISTRY, getFontFamily } from '@/contexts/FontContext';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
  return <FontProvider>{children}</FontProvider>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FontContext — Provider requirement', () => {
  it('useFonts throws when used outside FontProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useFonts());
    }).toThrow('useFonts must be used within a FontProvider');
    spy.mockRestore();
  });
});

describe('FontContext — Default state', () => {
  it('activeFont defaults to system font', () => {
    const { result } = renderHook(() => useFonts(), { wrapper });
    expect(result.current.activeFont.id).toBe('system');
    expect(result.current.activeFont.name).toBe('System Default');
  });

  it('installedFontIds contains system font', () => {
    const { result } = renderHook(() => useFonts(), { wrapper });
    expect(result.current.installedFontIds.has('system')).toBe(true);
  });

  it('loadingFontId starts as null', () => {
    const { result } = renderHook(() => useFonts(), { wrapper });
    expect(result.current.loadingFontId).toBeNull();
  });

  it('fonts includes the curated registry', () => {
    const { result } = renderHook(() => useFonts(), { wrapper });
    expect(result.current.fonts.length).toBeGreaterThanOrEqual(FONT_REGISTRY.length);
  });

  it('featuredFonts is the curated registry', () => {
    const { result } = renderHook(() => useFonts(), { wrapper });
    expect(result.current.featuredFonts).toEqual(FONT_REGISTRY);
  });

  it('categories includes all', () => {
    const { result } = renderHook(() => useFonts(), { wrapper });
    expect(result.current.categories).toContain('all');
    expect(result.current.categories).toContain('sans-serif');
  });
});

describe('FontContext — getFontFamily helper', () => {
  it('returns css for system font', () => {
    const systemFont = FONT_REGISTRY[0];
    expect(getFontFamily(systemFont)).toBe(systemFont.css);
  });
});
