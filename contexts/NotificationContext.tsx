/**
 * NotificationContext — Manages persistent notification state, drawer visibility,
 * and category filtering. Loads notifications from the database on mount and
 * provides CRUD operations that keep local state and DB in sync.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import {
  createNotification as createNotificationDb,
  getNotifications as getNotificationsDb,
  markNotificationRead as markNotificationReadDb,
  markAllNotificationsRead as markAllNotificationsReadDb,
  dismissNotification as dismissNotificationDb,
  getUnreadCounts as getUnreadCountsDb,
} from '@umbra/service';
import type {
  NotificationRecord,
  NotificationType,
  UnreadCounts,
  NotificationCategory,
} from '@umbra/service';

// ---------------------------------------------------------------------------
// Context value
// ---------------------------------------------------------------------------

interface NotificationContextValue {
  /** All loaded notifications (most recent first) */
  notifications: NotificationRecord[];
  /** Unread counts per category */
  unreadCounts: UnreadCounts;
  /** Total unread count (badge number) */
  totalUnread: number;
  /** Whether the drawer is open */
  isDrawerOpen: boolean;
  /** Active category filter */
  activeCategory: NotificationCategory;
  /** Open/close the drawer */
  openDrawer: () => void;
  closeDrawer: () => void;
  setActiveCategory: (cat: NotificationCategory) => void;
  /** CRUD */
  addNotification: (n: {
    type: NotificationType;
    title: string;
    description?: string;
    relatedDid?: string;
    relatedId?: string;
    avatar?: string;
  }) => Promise<void>;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  /** Refresh from DB */
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isReady } = useUmbra();

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({
    all: 0,
    social: 0,
    calls: 0,
    mentions: 0,
    system: 0,
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const initialLoadRef = useRef(false);

  // ------ Load from DB on mount ------
  const refresh = useCallback(async () => {
    if (!isReady) return;
    try {
      const [records, counts] = await Promise.all([
        getNotificationsDb({ limit: 200 }),
        getUnreadCountsDb(),
      ]);
      setNotifications(records);
      setUnreadCounts(counts);
    } catch (err) {
      console.warn('[NotificationContext] Failed to refresh:', err);
    }
  }, [isReady]);

  useEffect(() => {
    if (isReady && !initialLoadRef.current) {
      initialLoadRef.current = true;
      refresh();
    }
  }, [isReady, refresh]);

  // ------ CRUD ------
  const addNotification = useCallback(
    async (n: {
      type: NotificationType;
      title: string;
      description?: string;
      relatedDid?: string;
      relatedId?: string;
      avatar?: string;
    }) => {
      if (!isReady) return;
      const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      try {
        const { createdAt } = await createNotificationDb({ id, ...n });
        // Prepend to local state
        const record: NotificationRecord = {
          id,
          type: n.type,
          title: n.title,
          description: n.description,
          relatedDid: n.relatedDid,
          relatedId: n.relatedId,
          avatar: n.avatar,
          read: false,
          dismissed: false,
          createdAt,
          updatedAt: createdAt,
        };
        setNotifications((prev) => [record, ...prev]);
        // Refresh counts
        const counts = await getUnreadCountsDb();
        setUnreadCounts(counts);
      } catch (err) {
        console.warn('[NotificationContext] Failed to create notification:', err);
      }
    },
    [isReady],
  );

  const markRead = useCallback(
    (id: string) => {
      if (!isReady) return;
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      markNotificationReadDb(id)
        .then(() => getUnreadCountsDb())
        .then(setUnreadCounts)
        .catch((err) => console.warn('[NotificationContext] markRead failed:', err));
    },
    [isReady],
  );

  const markAllRead = useCallback(() => {
    if (!isReady) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllNotificationsReadDb()
      .then(() => getUnreadCountsDb())
      .then(setUnreadCounts)
      .catch((err) => console.warn('[NotificationContext] markAllRead failed:', err));
  }, [isReady]);

  const dismiss = useCallback(
    (id: string) => {
      if (!isReady) return;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      dismissNotificationDb(id)
        .then(() => getUnreadCountsDb())
        .then(setUnreadCounts)
        .catch((err) => console.warn('[NotificationContext] dismiss failed:', err));
    },
    [isReady],
  );

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const totalUnread = unreadCounts.all;

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCounts,
      totalUnread,
      isDrawerOpen,
      activeCategory,
      openDrawer,
      closeDrawer,
      setActiveCategory,
      addNotification,
      markRead,
      markAllRead,
      dismiss,
      refresh,
    }),
    [
      notifications,
      unreadCounts,
      totalUnread,
      isDrawerOpen,
      activeCategory,
      openDrawer,
      closeDrawer,
      addNotification,
      markRead,
      markAllRead,
      dismiss,
      refresh,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}
