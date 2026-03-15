/**
 * HelpContext — Unit Tests
 *
 * Tests for hint registration, priority queue, dismiss/viewed state,
 * popover management, and reset.
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { HelpProvider, useHelp } from '@/contexts/HelpContext';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
  return <HelpProvider>{children}</HelpProvider>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HelpContext — Provider requirement', () => {
  it('useHelp throws when used outside HelpProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useHelp());
    }).toThrow('useHelp must be used within a <HelpProvider>');
    spy.mockRestore();
  });
});

describe('HelpContext — Hint queue', () => {
  it('no hints registered means nothing is active', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });
    expect(result.current.isActive('some-hint')).toBe(false);
  });

  it('registered hint becomes active if unviewed', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    act(() => {
      result.current.registerHint('hint-1', 10);
    });

    expect(result.current.isActive('hint-1')).toBe(true);
  });

  it('lowest priority hint is active among multiple', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    act(() => {
      result.current.registerHint('hint-high', 50);
      result.current.registerHint('hint-low', 5);
      result.current.registerHint('hint-mid', 25);
    });

    expect(result.current.isActive('hint-low')).toBe(true);
    expect(result.current.isActive('hint-high')).toBe(false);
    expect(result.current.isActive('hint-mid')).toBe(false);
  });

  it('dismissing active hint promotes next highest priority', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    act(() => {
      result.current.registerHint('hint-1', 10);
      result.current.registerHint('hint-2', 20);
    });
    expect(result.current.isActive('hint-1')).toBe(true);

    act(() => {
      result.current.dismissHint('hint-1');
    });

    expect(result.current.isActive('hint-1')).toBe(false);
    expect(result.current.isViewed('hint-1')).toBe(true);
    expect(result.current.isActive('hint-2')).toBe(true);
  });

  it('unregisterHint removes hint from queue', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    act(() => {
      result.current.registerHint('hint-temp', 10);
    });
    expect(result.current.isActive('hint-temp')).toBe(true);

    act(() => {
      result.current.unregisterHint('hint-temp');
    });
    expect(result.current.isActive('hint-temp')).toBe(false);
  });
});

describe('HelpContext — Popover', () => {
  it('popoverState starts as null', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });
    expect(result.current.popoverState).toBeNull();
  });

  it('openPopover sets popover state', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    const config = {
      anchor: { x: 100, y: 200 },
      title: 'Test Popover',
      icon: 'info',
      children: null,
      hintId: 'popover-hint',
    };

    act(() => {
      result.current.openPopover(config);
    });

    expect(result.current.popoverState).toEqual(config);
  });

  it('closePopover clears popover and dismisses hint', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    act(() => {
      result.current.registerHint('popover-hint', 10);
      result.current.openPopover({
        anchor: { x: 0, y: 0 },
        title: 'Test',
        icon: 'info',
        children: null,
        hintId: 'popover-hint',
      });
    });

    act(() => {
      result.current.closePopover();
    });

    expect(result.current.popoverState).toBeNull();
    expect(result.current.isViewed('popover-hint')).toBe(true);
  });
});

describe('HelpContext — Reset', () => {
  it('resetAll clears all viewed hints', () => {
    const { result } = renderHook(() => useHelp(), { wrapper });

    act(() => {
      result.current.registerHint('hint-1', 10);
      result.current.dismissHint('hint-1');
    });
    expect(result.current.isViewed('hint-1')).toBe(true);

    act(() => {
      result.current.resetAll();
    });

    expect(result.current.isViewed('hint-1')).toBe(false);
    // hint-1 is still registered, so it should become active again
    expect(result.current.isActive('hint-1')).toBe(true);
  });
});
