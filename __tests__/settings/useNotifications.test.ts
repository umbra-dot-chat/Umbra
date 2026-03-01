/**
 * Tests for NotificationContext / useNotifications hook
 *
 * Covers provider rendering, default state, CRUD operations (add, markRead,
 * markAllRead, dismiss), drawer open/close, category switching, initial DB
 * load, refresh, not-ready guards, and DB error handling.
 *
 * Test IDs: T11.6.1 - T11.6.28
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks — declared before imports so jest.mock hoisting works
// ---------------------------------------------------------------------------

let mockNotifications: any[] = [];
let mockUnreadCounts = { all: 0, social: 0, calls: 0, mentions: 0, system: 0 };

jest.mock('@umbra/service', () => ({
  createNotification: jest.fn(async (n: any) => ({
    createdAt: new Date().toISOString(),
  })),
  getNotifications: jest.fn(async () => mockNotifications),
  markNotificationRead: jest.fn(async () => {}),
  markAllNotificationsRead: jest.fn(async () => {}),
  dismissNotification: jest.fn(async () => {}),
  getUnreadCounts: jest.fn(async () => ({ ...mockUnreadCounts })),
}));

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: jest.fn(() => ({
    isReady: true,
  })),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  NotificationProvider,
  useNotifications,
} from '@/contexts/NotificationContext';
import { useUmbra } from '@/contexts/UmbraContext';
import {
  createNotification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
  getUnreadCounts,
} from '@umbra/service';

// Cast mocks for type safety
const mockCreateNotification = createNotification as jest.Mock;
const mockGetNotifications = getNotifications as jest.Mock;
const mockMarkNotificationRead = markNotificationRead as jest.Mock;
const mockMarkAllNotificationsRead = markAllNotificationsRead as jest.Mock;
const mockDismissNotification = dismissNotification as jest.Mock;
const mockGetUnreadCounts = getUnreadCounts as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(NotificationProvider, null, children);

function makeNotification(overrides: Record<string, any> = {}) {
  return {
    id: `notif_${Date.now()}_abc123`,
    type: 'message',
    title: 'New message',
    description: 'Hello world',
    read: false,
    dismissed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();

  mockNotifications = [];
  mockUnreadCounts = { all: 0, social: 0, calls: 0, mentions: 0, system: 0 };

  // Reset service mocks to defaults
  mockCreateNotification.mockImplementation(async (n: any) => ({
    createdAt: new Date().toISOString(),
  }));
  mockGetNotifications.mockImplementation(async () => [...mockNotifications]);
  mockMarkNotificationRead.mockImplementation(async () => {});
  mockMarkAllNotificationsRead.mockImplementation(async () => {});
  mockDismissNotification.mockImplementation(async () => {});
  mockGetUnreadCounts.mockImplementation(async () => ({ ...mockUnreadCounts }));

  // Ensure useUmbra returns ready state
  (useUmbra as jest.Mock).mockReturnValue({ isReady: true });
});

// ---------------------------------------------------------------------------
// T11.6.1 — Default state values
// ---------------------------------------------------------------------------

describe('T11.6.1 — Default State Values', () => {
  it('T11.6.1 — provides correct defaults before DB load completes', () => {
    // Prevent the initial load from resolving immediately
    mockGetNotifications.mockReturnValue(new Promise(() => {}));
    mockGetUnreadCounts.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useNotifications(), { wrapper });

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCounts).toEqual({
      all: 0,
      social: 0,
      calls: 0,
      mentions: 0,
      system: 0,
    });
    expect(result.current.totalUnread).toBe(0);
    expect(result.current.isDrawerOpen).toBe(false);
    expect(result.current.activeCategory).toBe('all');
  });
});

// ---------------------------------------------------------------------------
// T11.6.2 — Throws outside provider
// ---------------------------------------------------------------------------

describe('T11.6.2 — Throws Outside Provider', () => {
  it('T11.6.2 — useNotifications throws when used without NotificationProvider', () => {
    // Suppress console.error for the expected error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useNotifications());
    }).toThrow('useNotifications must be used within a NotificationProvider');

    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// T11.6.3-4 — Initial load from DB on mount
// ---------------------------------------------------------------------------

describe('T11.6.3-4 — Initial Load from DB', () => {
  it('T11.6.3 — loads notifications and counts from DB on mount when isReady=true', async () => {
    const existing = [
      makeNotification({ id: 'n1', title: 'First' }),
      makeNotification({ id: 'n2', title: 'Second' }),
    ];
    mockNotifications = existing;
    mockUnreadCounts = { all: 2, social: 1, calls: 0, mentions: 1, system: 0 };
    mockGetNotifications.mockResolvedValue([...existing]);
    mockGetUnreadCounts.mockResolvedValue({ ...mockUnreadCounts });

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });

    expect(result.current.notifications[0].title).toBe('First');
    expect(result.current.unreadCounts.all).toBe(2);
    expect(result.current.totalUnread).toBe(2);
    expect(mockGetNotifications).toHaveBeenCalledWith({ limit: 200 });
    expect(mockGetUnreadCounts).toHaveBeenCalled();
  });

  it('T11.6.4 — does not load from DB when isReady=false', async () => {
    (useUmbra as jest.Mock).mockReturnValue({ isReady: false });

    const { result } = renderHook(() => useNotifications(), { wrapper });

    // Give it a tick to potentially fire the effect
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(mockGetNotifications).not.toHaveBeenCalled();
    expect(mockGetUnreadCounts).not.toHaveBeenCalled();
    expect(result.current.notifications).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// T11.6.5-8 — addNotification
// ---------------------------------------------------------------------------

describe('T11.6.5-8 — addNotification', () => {
  it('T11.6.5 — creates a notification and prepends to list', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(mockGetNotifications).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.addNotification({
        type: 'friend_request' as any,
        title: 'Friend Request',
        description: 'Alice wants to be friends',
      });
    });

    expect(mockCreateNotification).toHaveBeenCalledTimes(1);
    const callArg = mockCreateNotification.mock.calls[0][0];
    expect(callArg.type).toBe('friend_request');
    expect(callArg.title).toBe('Friend Request');
    expect(callArg.id).toMatch(/^notif_/);

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe('Friend Request');
    expect(result.current.notifications[0].read).toBe(false);
  });

  it('T11.6.6 — addNotification generates a unique ID', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(mockGetNotifications).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.addNotification({
        type: 'message' as any,
        title: 'Msg 1',
      });
    });

    await act(async () => {
      await result.current.addNotification({
        type: 'message' as any,
        title: 'Msg 2',
      });
    });

    const ids = result.current.notifications.map((n) => n.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('T11.6.7 — addNotification prepends (most recent first)', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(mockGetNotifications).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.addNotification({
        type: 'message' as any,
        title: 'First',
      });
    });

    await act(async () => {
      await result.current.addNotification({
        type: 'message' as any,
        title: 'Second',
      });
    });

    expect(result.current.notifications[0].title).toBe('Second');
    expect(result.current.notifications[1].title).toBe('First');
  });

  it('T11.6.8 — addNotification refreshes unread counts after create', async () => {
    mockGetUnreadCounts.mockResolvedValueOnce({ all: 0, social: 0, calls: 0, mentions: 0, system: 0 });

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(mockGetNotifications).toHaveBeenCalled();
    });

    // After add, the counts refresh should be called
    mockGetUnreadCounts.mockResolvedValueOnce({ all: 1, social: 1, calls: 0, mentions: 0, system: 0 });

    await act(async () => {
      await result.current.addNotification({
        type: 'friend_request' as any,
        title: 'New friend',
      });
    });

    await waitFor(() => {
      expect(result.current.unreadCounts.all).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// T11.6.9-11 — markRead
// ---------------------------------------------------------------------------

describe('T11.6.9-11 — markRead', () => {
  it('T11.6.9 — optimistically sets read=true on matching notification', async () => {
    const existing = [
      makeNotification({ id: 'n1', title: 'Unread', read: false }),
      makeNotification({ id: 'n2', title: 'Another', read: false }),
    ];
    mockGetNotifications.mockResolvedValue([...existing]);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });

    act(() => {
      result.current.markRead('n1');
    });

    // Optimistic: immediately read
    expect(result.current.notifications.find((n) => n.id === 'n1')?.read).toBe(true);
    // Other notification unchanged
    expect(result.current.notifications.find((n) => n.id === 'n2')?.read).toBe(false);
  });

  it('T11.6.10 — markRead calls DB markNotificationRead', async () => {
    const existing = [makeNotification({ id: 'n1', read: false })];
    mockGetNotifications.mockResolvedValue([...existing]);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
    });

    act(() => {
      result.current.markRead('n1');
    });

    await waitFor(() => {
      expect(mockMarkNotificationRead).toHaveBeenCalledWith('n1');
    });
  });

  it('T11.6.11 — markRead refreshes unread counts after DB call', async () => {
    const existing = [makeNotification({ id: 'n1', read: false })];
    mockGetNotifications.mockResolvedValue([...existing]);
    mockGetUnreadCounts
      .mockResolvedValueOnce({ all: 1, social: 1, calls: 0, mentions: 0, system: 0 })  // initial load
      .mockResolvedValueOnce({ all: 0, social: 0, calls: 0, mentions: 0, system: 0 }); // after markRead

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
    });

    act(() => {
      result.current.markRead('n1');
    });

    await waitFor(() => {
      expect(result.current.unreadCounts.all).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// T11.6.12-14 — markAllRead
// ---------------------------------------------------------------------------

describe('T11.6.12-14 — markAllRead', () => {
  it('T11.6.12 — optimistically sets all notifications to read=true', async () => {
    const existing = [
      makeNotification({ id: 'n1', read: false }),
      makeNotification({ id: 'n2', read: false }),
      makeNotification({ id: 'n3', read: false }),
    ];
    mockGetNotifications.mockResolvedValue([...existing]);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(3);
    });

    act(() => {
      result.current.markAllRead();
    });

    expect(result.current.notifications.every((n) => n.read === true)).toBe(true);
  });

  it('T11.6.13 — markAllRead calls DB markAllNotificationsRead', async () => {
    const existing = [makeNotification({ id: 'n1', read: false })];
    mockGetNotifications.mockResolvedValue([...existing]);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
    });

    act(() => {
      result.current.markAllRead();
    });

    await waitFor(() => {
      expect(mockMarkAllNotificationsRead).toHaveBeenCalledTimes(1);
    });
  });

  it('T11.6.14 — markAllRead refreshes unread counts', async () => {
    const existing = [
      makeNotification({ id: 'n1', read: false }),
      makeNotification({ id: 'n2', read: false }),
    ];
    mockGetNotifications.mockResolvedValue([...existing]);
    mockGetUnreadCounts
      .mockResolvedValueOnce({ all: 2, social: 1, calls: 0, mentions: 1, system: 0 }) // initial
      .mockResolvedValueOnce({ all: 0, social: 0, calls: 0, mentions: 0, system: 0 }); // after markAll

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.unreadCounts.all).toBe(2);
    });

    act(() => {
      result.current.markAllRead();
    });

    await waitFor(() => {
      expect(result.current.unreadCounts.all).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// T11.6.15-17 — dismiss
// ---------------------------------------------------------------------------

describe('T11.6.15-17 — dismiss', () => {
  it('T11.6.15 — removes notification from list', async () => {
    const existing = [
      makeNotification({ id: 'n1', title: 'Keep' }),
      makeNotification({ id: 'n2', title: 'Remove' }),
    ];
    mockGetNotifications.mockResolvedValue([...existing]);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });

    act(() => {
      result.current.dismiss('n2');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].id).toBe('n1');
  });

  it('T11.6.16 — dismiss calls DB dismissNotification', async () => {
    const existing = [makeNotification({ id: 'n1' })];
    mockGetNotifications.mockResolvedValue([...existing]);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
    });

    act(() => {
      result.current.dismiss('n1');
    });

    await waitFor(() => {
      expect(mockDismissNotification).toHaveBeenCalledWith('n1');
    });
  });

  it('T11.6.17 — dismiss refreshes unread counts', async () => {
    const existing = [makeNotification({ id: 'n1', read: false })];
    mockGetNotifications.mockResolvedValue([...existing]);
    mockGetUnreadCounts
      .mockResolvedValueOnce({ all: 1, social: 0, calls: 0, mentions: 0, system: 1 }) // initial
      .mockResolvedValueOnce({ all: 0, social: 0, calls: 0, mentions: 0, system: 0 }); // after dismiss

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.unreadCounts.all).toBe(1);
    });

    act(() => {
      result.current.dismiss('n1');
    });

    await waitFor(() => {
      expect(result.current.unreadCounts.all).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// T11.6.18-19 — Drawer open/close
// ---------------------------------------------------------------------------

describe('T11.6.18-19 — Drawer Open / Close', () => {
  it('T11.6.18 — openDrawer sets isDrawerOpen to true', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    expect(result.current.isDrawerOpen).toBe(false);

    act(() => {
      result.current.openDrawer();
    });

    expect(result.current.isDrawerOpen).toBe(true);
  });

  it('T11.6.19 — closeDrawer sets isDrawerOpen to false', async () => {
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

// ---------------------------------------------------------------------------
// T11.6.20 — Active category switching
// ---------------------------------------------------------------------------

describe('T11.6.20 — Active Category Switching', () => {
  it('T11.6.20 — setActiveCategory updates activeCategory', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    expect(result.current.activeCategory).toBe('all');

    act(() => {
      result.current.setActiveCategory('social');
    });
    expect(result.current.activeCategory).toBe('social');

    act(() => {
      result.current.setActiveCategory('calls');
    });
    expect(result.current.activeCategory).toBe('calls');

    act(() => {
      result.current.setActiveCategory('mentions');
    });
    expect(result.current.activeCategory).toBe('mentions');

    act(() => {
      result.current.setActiveCategory('system');
    });
    expect(result.current.activeCategory).toBe('system');

    act(() => {
      result.current.setActiveCategory('all');
    });
    expect(result.current.activeCategory).toBe('all');
  });
});

// ---------------------------------------------------------------------------
// T11.6.21 — totalUnread reflects unreadCounts.all
// ---------------------------------------------------------------------------

describe('T11.6.21 — totalUnread reflects unreadCounts.all', () => {
  it('T11.6.21 — totalUnread equals unreadCounts.all after load', async () => {
    mockUnreadCounts = { all: 7, social: 3, calls: 1, mentions: 2, system: 1 };
    mockGetUnreadCounts.mockResolvedValue({ ...mockUnreadCounts });

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.totalUnread).toBe(7);
    });

    expect(result.current.totalUnread).toBe(result.current.unreadCounts.all);
  });
});

// ---------------------------------------------------------------------------
// T11.6.22 — refresh() reloads from DB
// ---------------------------------------------------------------------------

describe('T11.6.22 — refresh()', () => {
  it('T11.6.22 — refresh reloads notifications and counts from DB', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(mockGetNotifications).toHaveBeenCalledTimes(1);
    });

    // Simulate new data appearing in DB
    const updatedNotifications = [
      makeNotification({ id: 'n-new', title: 'Brand new' }),
    ];
    mockGetNotifications.mockResolvedValue([...updatedNotifications]);
    mockGetUnreadCounts.mockResolvedValue({ all: 1, social: 0, calls: 0, mentions: 0, system: 1 });

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockGetNotifications).toHaveBeenCalledTimes(2);
    expect(mockGetUnreadCounts).toHaveBeenCalledTimes(2);
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe('Brand new');
    expect(result.current.unreadCounts.all).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// T11.6.23-25 — Not ready (isReady=false): operations are no-ops
// ---------------------------------------------------------------------------

describe('T11.6.23-25 — Not Ready Guards', () => {
  beforeEach(() => {
    (useUmbra as jest.Mock).mockReturnValue({ isReady: false });
  });

  it('T11.6.23 — addNotification is a no-op when not ready', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await act(async () => {
      await result.current.addNotification({
        type: 'message' as any,
        title: 'Should not appear',
      });
    });

    expect(mockCreateNotification).not.toHaveBeenCalled();
    expect(result.current.notifications).toEqual([]);
  });

  it('T11.6.24 — markRead is a no-op when not ready', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      result.current.markRead('n1');
    });

    expect(mockMarkNotificationRead).not.toHaveBeenCalled();
  });

  it('T11.6.25 — markAllRead is a no-op when not ready', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      result.current.markAllRead();
    });

    expect(mockMarkAllNotificationsRead).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// T11.6.26 — dismiss is a no-op when not ready
// ---------------------------------------------------------------------------

describe('T11.6.26 — dismiss Not Ready', () => {
  it('T11.6.26 — dismiss is a no-op when not ready', async () => {
    (useUmbra as jest.Mock).mockReturnValue({ isReady: false });

    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      result.current.dismiss('n1');
    });

    expect(mockDismissNotification).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// T11.6.27-28 — DB error handling
// ---------------------------------------------------------------------------

describe('T11.6.27-28 — DB Error Handling', () => {
  it('T11.6.27 — refresh swallows errors and warns', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    mockGetNotifications.mockRejectedValue(new Error('DB read error'));

    const { result } = renderHook(() => useNotifications(), { wrapper });

    // Wait for the initial load to fail
    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalled();
    });

    expect(warnSpy).toHaveBeenCalledWith(
      '[NotificationContext] Failed to refresh:',
      expect.any(Error),
    );

    // State remains at defaults after error
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCounts.all).toBe(0);

    warnSpy.mockRestore();
  });

  it('T11.6.28 — addNotification swallows errors and warns', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(mockGetNotifications).toHaveBeenCalled();
    });

    mockCreateNotification.mockRejectedValue(new Error('Create failed'));

    await act(async () => {
      await result.current.addNotification({
        type: 'system' as any,
        title: 'Error test',
      });
    });

    expect(warnSpy).toHaveBeenCalledWith(
      '[NotificationContext] Failed to create notification:',
      expect.any(Error),
    );

    // Notification should NOT have been added to local state since the DB call failed
    // before the local state update
    expect(
      result.current.notifications.find((n) => n.title === 'Error test'),
    ).toBeUndefined();

    warnSpy.mockRestore();
  });
});
