/**
 * NotificationDrawerContainer — Bridges the NotificationContext with the Wisp
 * NotificationDrawer, NotificationGroup, and NotificationItem components.
 *
 * Renders as a wide dropdown panel anchored near the notification bell icon
 * in the NavigationRail (bottom-left). The panel pops up to the right of
 * the rail with a fade+scale animation.
 *
 * Groups notifications by date ("Today", "Yesterday", "This Week", "Older").
 */

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { Animated, Pressable, View, useWindowDimensions } from 'react-native';
import {
  NotificationDrawer,
  NotificationGroup,
  NotificationItem,
  Text,
  useTheme,
} from '@coexist/wisp-react-native';
import { useNotifications } from '@/contexts/NotificationContext';
import type { NotificationRecord, NotificationType, NotificationCategory } from '@umbra/service';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Width of the NavigationRail — dropdown anchors to the right of it */
const RAIL_WIDTH = 64;
/** Dropdown panel width */
const DROPDOWN_WIDTH = 400;
/** Max height for the dropdown */
const DROPDOWN_MAX_HEIGHT = 520;
/** Animation duration in ms */
const ANIMATION_DURATION = 200;
/** Gap between rail edge and dropdown */
const DROPDOWN_GAP = 8;
/** Distance from bottom of viewport */
const DROPDOWN_BOTTOM_OFFSET = 80;

// ---------------------------------------------------------------------------
// Category mapping
// ---------------------------------------------------------------------------

const TYPE_TO_CATEGORY: Record<string, NotificationCategory> = {
  friend_request_received: 'social',
  friend_request_accepted: 'social',
  friend_request_rejected: 'social',
  group_invite: 'social',
  community_invite: 'social',
  call_missed: 'calls',
  call_completed: 'calls',
  mention: 'mentions',
  system: 'system',
};

// ---------------------------------------------------------------------------
// Date grouping helpers
// ---------------------------------------------------------------------------

function getDateGroup(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0 && now.getDate() === date.getDate()) return 'Today';
  if (diffDays <= 1 && now.getDate() - date.getDate() === 1) return 'Yesterday';
  if (diffDays <= 7) return 'This Week';
  return 'Older';
}

function formatTimestamp(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface GroupedNotifications {
  label: string;
  notifications: NotificationRecord[];
}

function groupByDate(notifications: NotificationRecord[]): GroupedNotifications[] {
  const groups: Record<string, NotificationRecord[]> = {};
  const order = ['Today', 'Yesterday', 'This Week', 'Older'];

  for (const n of notifications) {
    const group = getDateGroup(n.createdAt);
    if (!groups[group]) groups[group] = [];
    groups[group].push(n);
  }

  return order
    .filter((label) => groups[label]?.length)
    .map((label) => ({ label, notifications: groups[label] }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationDrawerContainer() {
  const {
    notifications,
    unreadCounts,
    isDrawerOpen,
    activeCategory,
    closeDrawer,
    setActiveCategory,
    markRead,
    markAllRead,
    dismiss,
  } = useNotifications();
  const { theme } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Animation — fade + scale from bottom-left origin
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (isDrawerOpen) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isDrawerOpen, fadeAnim, scaleAnim]);

  // Filter by active category
  const filtered = useMemo(() => {
    if (activeCategory === 'all') return notifications;
    return notifications.filter(
      (n) => (TYPE_TO_CATEGORY[n.type] ?? 'system') === activeCategory,
    );
  }, [notifications, activeCategory]);

  // Group by date
  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const handleCategoryChange = useCallback(
    (cat: NotificationCategory) => setActiveCategory(cat),
    [setActiveCategory],
  );

  const handleNotificationPress = useCallback(
    (n: NotificationRecord) => {
      if (!n.read) markRead(n.id);
    },
    [markRead],
  );

  if (!isDrawerOpen) return null;

  // Constrain dropdown to available screen space
  const dropdownWidth = Math.min(DROPDOWN_WIDTH, screenWidth - RAIL_WIDTH - DROPDOWN_GAP * 2);
  const dropdownMaxHeight = Math.min(DROPDOWN_MAX_HEIGHT, screenHeight - DROPDOWN_BOTTOM_OFFSET - 24);

  return (
    <>
      {/* Backdrop — transparent click catcher */}
      <Pressable
        onPress={closeDrawer}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.15)',
          zIndex: 100,
        }}
      />

      {/* Dropdown panel — anchored to the left near the bell icon */}
      <Animated.View
        style={{
          position: 'absolute',
          left: RAIL_WIDTH + DROPDOWN_GAP,
          bottom: DROPDOWN_BOTTOM_OFFSET,
          width: dropdownWidth,
          maxHeight: dropdownMaxHeight,
          backgroundColor: theme.colors.background.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          borderRadius: 12,
          zIndex: 101,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          // Shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 16,
          overflow: 'hidden',
        }}
      >
        <NotificationDrawer
          open={isDrawerOpen}
          onClose={closeDrawer}
          category={activeCategory}
          onCategoryChange={handleCategoryChange}
          unreadCounts={unreadCounts}
          onMarkAllRead={markAllRead}
          emptyState={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text size="sm" style={{ color: theme.colors.text.muted }}>
                No notifications yet
              </Text>
            </View>
          }
        >
          {grouped.map((group) => (
            <NotificationGroup
              key={group.label}
              label={group.label}
              count={group.notifications.length}
            >
              {group.notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  id={n.id}
                  type={n.type as any}
                  title={n.title}
                  description={n.description}
                  timestamp={formatTimestamp(n.createdAt)}
                  read={n.read}
                  avatar={n.avatar}
                  onPress={() => handleNotificationPress(n)}
                  onDismiss={() => dismiss(n.id)}
                />
              ))}
            </NotificationGroup>
          ))}
        </NotificationDrawer>
      </Animated.View>
    </>
  );
}
