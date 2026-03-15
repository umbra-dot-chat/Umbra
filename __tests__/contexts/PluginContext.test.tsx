/**
 * PluginContext — Unit Tests
 *
 * Tests for plugin system context:
 *   - Default state
 *   - Provider requirement
 *   - Slot components
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
    service: null,
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    identity: null,
    isAuthenticated: false,
  }),
}));

jest.mock('@/utils/debug', () => ({
  dbg: {
    trackRender: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/services/VoiceStreamBridge', () => ({
  VoiceStreamBridge: {
    isActive: jest.fn(() => false),
    getParticipants: jest.fn(() => []),
    getPeerStream: jest.fn(() => null),
    getLocalStream: jest.fn(() => null),
    getScreenShareStream: jest.fn(() => null),
    onParticipantChange: jest.fn(() => jest.fn()),
    sendSignal: jest.fn(),
    onSignal: jest.fn(() => jest.fn()),
  },
}));

jest.mock('@/services/ShortcutRegistry', () => ({
  ShortcutRegistry: {
    register: jest.fn(() => jest.fn()),
  },
}));

jest.mock('@umbra/plugin-runtime', () => ({
  PluginRegistry: jest.fn().mockImplementation(() => ({
    onChange: jest.fn(() => jest.fn()),
    getEnabledPlugins: jest.fn(() => []),
    getPlugin: jest.fn(() => null),
    register: jest.fn(),
    unregister: jest.fn(),
    enable: jest.fn().mockResolvedValue(undefined),
    disable: jest.fn().mockResolvedValue(undefined),
    getSlotComponents: jest.fn(() => []),
  })),
  PluginLoader: jest.fn().mockImplementation(() => ({
    loadFromBundle: jest.fn().mockResolvedValue({}),
    invalidateCache: jest.fn(),
  })),
  PluginInstaller: jest.fn().mockImplementation(() => ({
    getInstalled: jest.fn().mockResolvedValue([]),
    install: jest.fn().mockResolvedValue({ id: 'test-plugin' }),
    loadBundle: jest.fn().mockResolvedValue(null),
    uninstall: jest.fn().mockResolvedValue(undefined),
  })),
  MarketplaceClient: jest.fn().mockImplementation(() => ({})),
  createPluginStorage: jest.fn(() => ({})),
  createSandboxedAPI: jest.fn(() => ({})),
}));

import { PluginProvider, usePlugins } from '@/contexts/PluginContext';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
  return <PluginProvider>{children}</PluginProvider>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PluginContext — Provider requirement', () => {
  it('usePlugins throws when used outside PluginProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => usePlugins());
    }).toThrow('usePlugins must be used within a PluginProvider');
    spy.mockRestore();
  });
});

describe('PluginContext — Default state', () => {
  it('isLoading starts as true', () => {
    const { result } = renderHook(() => usePlugins(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('enabledCount starts as 0', () => {
    const { result } = renderHook(() => usePlugins(), { wrapper });
    expect(result.current.enabledCount).toBe(0);
  });

  it('pluginCommands starts as empty array', () => {
    const { result } = renderHook(() => usePlugins(), { wrapper });
    expect(result.current.pluginCommands).toEqual([]);
  });

  it('pluginSlashCommands starts as empty array', () => {
    const { result } = renderHook(() => usePlugins(), { wrapper });
    expect(result.current.pluginSlashCommands).toEqual([]);
  });

  it('getSlotComponents returns empty array for unknown slot', () => {
    const { result } = renderHook(() => usePlugins(), { wrapper });
    expect(result.current.getSlotComponents('settings-panel' as any)).toEqual([]);
  });

  it('applyTextTransforms returns input unchanged with no transforms', () => {
    const { result } = renderHook(() => usePlugins(), { wrapper });
    expect(result.current.applyTextTransforms('hello world')).toBe('hello world');
  });
});
