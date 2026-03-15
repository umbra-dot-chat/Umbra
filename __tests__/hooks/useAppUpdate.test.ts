/**
 * Tests for useAppUpdate hook
 *
 * Covers: GitHub release fetch, version comparison, dismiss persistence,
 * error handling, loading states.
 *
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Setup: Force web platform, no Tauri
// ---------------------------------------------------------------------------

const originalOS = Platform.OS;

beforeAll(() => {
  Object.defineProperty(Platform, 'OS', { value: 'web', writable: true });
  // Ensure no Tauri
  (window as any).__TAURI_INTERNALS__ = undefined;
});

afterAll(() => {
  Object.defineProperty(Platform, 'OS', { value: originalOS, writable: true });
});

// ---------------------------------------------------------------------------
// Mock localStorage
// ---------------------------------------------------------------------------

beforeEach(() => {
  window.localStorage.clear();
});

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { useAppUpdate } from '@/hooks/useAppUpdate';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CURRENT_VERSION = '1.7.3'; // from app.json

function makeRelease(version: string, assets: any[] = []) {
  return {
    tag_name: `v${version}`,
    html_url: `https://github.com/InfamousVague/Umbra/releases/tag/v${version}`,
    assets,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useAppUpdate', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('reports currentVersion from app.json', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useAppUpdate());
    expect(result.current.currentVersion).toBe(CURRENT_VERSION);
  });

  it('detects a newer version is available', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeRelease('2.0.0')),
    });

    const { result } = renderHook(() => useAppUpdate());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasVersionUpdate).toBe(true);
    expect(result.current.latestVersion).toBe('2.0.0');
  });

  it('returns no version update when current is latest', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeRelease(CURRENT_VERSION)),
    });

    const { result } = renderHook(() => useAppUpdate());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasVersionUpdate).toBe(false);
  });

  it('handles fetch error gracefully', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 403 });

    const { result } = renderHook(() => useAppUpdate());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.latestVersion).toBeNull();
    expect(result.current.hasVersionUpdate).toBe(false);
  });

  it('dismiss sets isDismissed', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeRelease('2.0.0')),
    });

    const { result } = renderHook(() => useAppUpdate());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.isDismissed).toBe(true);
  });

  it('parses release assets into download entries', async () => {
    const assets = [
      { name: 'Umbra_aarch64.dmg', browser_download_url: 'https://dl/arm.dmg', size: 50_000_000 },
      { name: 'Umbra.msi', browser_download_url: 'https://dl/win.msi', size: 60_000_000 },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeRelease('2.0.0', assets)),
    });

    const { result } = renderHook(() => useAppUpdate());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const macDownload = result.current.downloads.find((d) => d.platform === 'macos-arm');
    expect(macDownload?.url).toBe('https://dl/arm.dmg');

    const winDownload = result.current.downloads.find((d) => d.platform === 'windows');
    expect(winDownload?.url).toBe('https://dl/win.msi');
  });
});
