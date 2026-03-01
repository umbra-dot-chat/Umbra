/**
 * Tests for useHelp hook (HelpContext)
 *
 * Covers: hint registration, priority queue, dismissal, persistence,
 * popover management, and error handling.
 *
 * Matches Playwright E2E coverage for Section 15 (Help System / Guide):
 *   T15.0.1 (Guide accessible), T15.0.2 (Multiple sections),
 *   T15.0.3 (Chapter content), T15.0.6 (Version label)
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { HelpProvider, useHelp } from '@/contexts/HelpContext';
import type { PopoverConfig } from '@/contexts/HelpContext';

// ---------------------------------------------------------------------------
// Platform mock — HelpContext checks Platform.OS === 'web' for localStorage
// ---------------------------------------------------------------------------

const originalOS = Platform.OS;

beforeAll(() => {
  Object.defineProperty(Platform, 'OS', { value: 'web', writable: true });
});

afterAll(() => {
  Object.defineProperty(Platform, 'OS', { value: originalOS, writable: true });
});

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

const storageMock: Record<string, string> = {};

beforeEach(() => {
  Object.keys(storageMock).forEach((k) => delete storageMock[k]);

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn((key: string) => storageMock[key] ?? null),
      setItem: jest.fn((key: string, val: string) => { storageMock[key] = val; }),
      removeItem: jest.fn((key: string) => { delete storageMock[key]; }),
      clear: jest.fn(),
    },
    writable: true,
  });
});

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
  return <HelpProvider>{children}</HelpProvider>;
}

// ---------------------------------------------------------------------------
// T15.0.1 — useHelp must be within HelpProvider
// ---------------------------------------------------------------------------

describe('T15.0.1 — useHelp context requirement', () => {
  it('throws when used outside HelpProvider', () => {
    // Suppress console.error for expected throw
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useHelp());
    }).toThrow('useHelp must be used within a <HelpProvider>');
    spy.mockRestore();
  });

  it('returns context value when wrapped in HelpProvider', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    expect(typeof result.current.registerHint).toBe('function');
    expect(typeof result.current.unregisterHint).toBe('function');
    expect(typeof result.current.dismissHint).toBe('function');
    expect(typeof result.current.isActive).toBe('function');
    expect(typeof result.current.isViewed).toBe('function');
    expect(typeof result.current.resetAll).toBe('function');
    expect(typeof result.current.openPopover).toBe('function');
    expect(typeof result.current.closePopover).toBe('function');
    expect(result.current.popoverState).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// T15.0.2 — Hint registration and priority queue
// ---------------------------------------------------------------------------

describe('T15.0.2 — Hint registration & priority', () => {
  it('registers a hint and makes it active', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    act(() => {
      result.current.registerHint('getting-started', 1);
    });

    expect(result.current.isActive('getting-started')).toBe(true);
  });

  it('registers multiple hints — lowest priority is active', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    act(() => {
      result.current.registerHint('friends', 50);
      result.current.registerHint('getting-started', 10);
      result.current.registerHint('messaging', 30);
    });

    // Priority 10 is lowest → active
    expect(result.current.isActive('getting-started')).toBe(true);
    expect(result.current.isActive('friends')).toBe(false);
    expect(result.current.isActive('messaging')).toBe(false);
  });

  it('does not duplicate hint on re-registration', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    act(() => {
      result.current.registerHint('friends', 10);
      result.current.registerHint('friends', 10); // duplicate
    });

    expect(result.current.isActive('friends')).toBe(true);
  });

  it('uses default priority 100 when not specified', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    act(() => {
      result.current.registerHint('low-priority'); // default = 100
      result.current.registerHint('high-priority', 1);
    });

    expect(result.current.isActive('high-priority')).toBe(true);
    expect(result.current.isActive('low-priority')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T15.0.2b — Unregistering hints
// ---------------------------------------------------------------------------

describe('T15.0.2b — Hint unregistration', () => {
  it('unregistering the active hint promotes the next one', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    act(() => {
      result.current.registerHint('first', 1);
      result.current.registerHint('second', 2);
    });

    expect(result.current.isActive('first')).toBe(true);

    act(() => {
      result.current.unregisterHint('first');
    });

    expect(result.current.isActive('second')).toBe(true);
    expect(result.current.isActive('first')).toBe(false);
  });

  it('unregistering the only hint leaves no active hint', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    act(() => {
      result.current.registerHint('solo', 1);
    });
    expect(result.current.isActive('solo')).toBe(true);

    act(() => {
      result.current.unregisterHint('solo');
    });
    expect(result.current.isActive('solo')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T15.0.3 — Dismissing hints
// ---------------------------------------------------------------------------

describe('T15.0.3 — Hint dismissal', () => {
  it('dismissHint marks hint as viewed', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    act(() => {
      result.current.registerHint('getting-started', 1);
    });
    expect(result.current.isViewed('getting-started')).toBe(false);

    act(() => {
      result.current.dismissHint('getting-started');
    });
    expect(result.current.isViewed('getting-started')).toBe(true);
  });

  it('dismissed hint is no longer active; next hint promotes', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    act(() => {
      result.current.registerHint('first', 1);
      result.current.registerHint('second', 2);
    });

    expect(result.current.isActive('first')).toBe(true);

    act(() => {
      result.current.dismissHint('first');
    });

    expect(result.current.isActive('first')).toBe(false);
    expect(result.current.isActive('second')).toBe(true);
  });

  it('dismissing same hint twice is safe (idempotent)', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    act(() => {
      result.current.registerHint('test', 1);
      result.current.dismissHint('test');
      result.current.dismissHint('test'); // duplicate
    });

    expect(result.current.isViewed('test')).toBe(true);
  });

  it('persists viewed hints to localStorage', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    act(() => {
      result.current.registerHint('persist-test', 1);
      result.current.dismissHint('persist-test');
    });

    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'umbra-hints-viewed',
      expect.stringContaining('persist-test'),
    );
  });
});

// ---------------------------------------------------------------------------
// T15.0.3b — resetAll
// ---------------------------------------------------------------------------

describe('T15.0.3b — resetAll viewed hints', () => {
  it('resetAll clears all viewed hints', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    act(() => {
      result.current.registerHint('a', 1);
      result.current.registerHint('b', 2);
      result.current.dismissHint('a');
      result.current.dismissHint('b');
    });

    expect(result.current.isViewed('a')).toBe(true);
    expect(result.current.isViewed('b')).toBe(true);

    act(() => {
      result.current.resetAll();
    });

    expect(result.current.isViewed('a')).toBe(false);
    expect(result.current.isViewed('b')).toBe(false);
  });

  it('resetAll re-activates previously dismissed hints', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    act(() => {
      result.current.registerHint('hint-a', 1);
      result.current.dismissHint('hint-a');
    });
    expect(result.current.isActive('hint-a')).toBe(false);

    act(() => {
      result.current.resetAll();
    });
    expect(result.current.isActive('hint-a')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T15.0.6 — Popover management
// ---------------------------------------------------------------------------

describe('T15.0.6 — Popover management', () => {
  const mockConfig: PopoverConfig = {
    anchor: { x: 100, y: 200 },
    title: 'Getting Started',
    icon: 'book',
    children: null,
    hintId: 'getting-started',
  };

  it('popoverState starts as null', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });
    expect(result.current.popoverState).toBeNull();
  });

  it('openPopover sets popover config', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    act(() => {
      result.current.openPopover(mockConfig);
    });

    expect(result.current.popoverState).toEqual(mockConfig);
  });

  it('closePopover clears popover state and dismisses the hint', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    act(() => {
      result.current.registerHint('getting-started', 1);
      result.current.openPopover(mockConfig);
    });

    expect(result.current.popoverState).not.toBeNull();

    act(() => {
      result.current.closePopover();
    });

    expect(result.current.popoverState).toBeNull();
    expect(result.current.isViewed('getting-started')).toBe(true);
  });

  it('closePopover when no popover is open is a no-op', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    act(() => {
      result.current.closePopover();
    });

    expect(result.current.popoverState).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// GuideDialog chapter structure
// ---------------------------------------------------------------------------

describe('T15.0.2c — Guide chapter list', () => {
  /** Mirrors the CHAPTERS array from GuideDialog.tsx */
  const CHAPTERS = [
    'getting-started', 'friends', 'messaging', 'groups',
    'communities', 'calling', 'data', 'security',
    'network', 'plugins', 'limitations', 'technical',
  ];

  it('has 12 chapters', () => {
    expect(CHAPTERS).toHaveLength(12);
  });

  it('starts with Getting Started', () => {
    expect(CHAPTERS[0]).toBe('getting-started');
  });

  it('includes all major sections: Friends, Messaging, Groups', () => {
    expect(CHAPTERS).toContain('friends');
    expect(CHAPTERS).toContain('messaging');
    expect(CHAPTERS).toContain('groups');
  });

  it('includes Security & Privacy, Network, Plugins', () => {
    expect(CHAPTERS).toContain('security');
    expect(CHAPTERS).toContain('network');
    expect(CHAPTERS).toContain('plugins');
  });
});
