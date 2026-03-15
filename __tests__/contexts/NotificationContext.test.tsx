/**
 * NotificationContext — Unit Tests
 *
 * Tests for notification state management:
 *   - Initial state
 *   - Drawer open/close
 *   - Category filtering
 *   - Provider requirement
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => ({
    isReady: false, // Start with not ready to avoid DB calls
  }),
}));

jest.mock('@umbra/service', () => {
  const actual = jest.requireActual('@umbra/service');
  return {
    ...actual,
    createNotification: jest.fn().mockResolvedValue({ createdAt: Date.now() }),
    getNotifications: jest.fn().mockResolvedValue([]),
    markNotificationRead: jest.fn().mockResolvedValue(undefined),
    markAllNotificationsRead: jest.fn().mockResolvedValue(undefined),
    dismissNotification: jest.fn().mockResolvedValue(undefined),
    getUnreadCounts: jest.fn().mockResolvedValue({
      all: 0, social: 0, calls: 0, mentions: 0, system: 0,
    }),
  };
});

import {
  NotificationProvider,
  useNotifications,
} from '@/contexts/NotificationContext';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
  return <NotificationProvider>{children}</NotificationProvider>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NotificationContext — Provider requirement', () => {
  it('useNotifications throws when used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useNotifications());
    }).toThrow('useNotifications must be used within a NotificationProvider');
    spy.mockRestore();
  });
});

describe('NotificationContext — Default state', () => {
  it('notifications starts as empty array', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    expect(result.current.notifications).toEqual([]);
  });

  it('totalUnread starts as 0', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    expect(result.current.totalUnread).toBe(0);
  });

  it('isDrawerOpen starts as false', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    expect(result.current.isDrawerOpen).toBe(false);
  });

  it('activeCategory defaults to all', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    expect(result.current.activeCategory).toBe('all');
  });

  it('unreadCounts has all categories at 0', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    expect(result.current.unreadCounts).toEqual({
      all: 0,
      social: 0,
      calls: 0,
      mentions: 0,
      system: 0,
    });
  });
});

describe('NotificationContext — Drawer', () => {
  it('openDrawer opens the drawer', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      result.current.openDrawer();
    });

    expect(result.current.isDrawerOpen).toBe(true);
  });

  it('closeDrawer closes the drawer', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      result.current.openDrawer();
    });
    expect(result.current.isDrawerOpen).toBe(true);

    act(() => {
      result.current.closeDrawer();
    });
    expect(result.current.isDrawerOpen).toBe(false);
  });
});

describe('NotificationContext — Category filter', () => {
  it('setActiveCategory changes the filter', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      result.current.setActiveCategory('calls');
    });
    expect(result.current.activeCategory).toBe('calls');

    act(() => {
      result.current.setActiveCategory('social');
    });
    expect(result.current.activeCategory).toBe('social');
  });
});
