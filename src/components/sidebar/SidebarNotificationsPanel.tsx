/**
 * SidebarNotificationsPanel — Inline sidebar section for notifications.
 *
 * Renders as a native sidebar section matching the "CONVERSATIONS" pattern:
 * uppercase header, category filter pills, and notification items in a ScrollView.
 * No modal chrome — seamlessly integrated into the sidebar.
 */

import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, Pressable, ScrollView } from 'react-native';
import {
  Box,
  Button,
  NotificationItem,
  Text,
  useTheme,
} from '@coexist/wisp-react-native';
import { CheckIcon, XIcon } from '@/components/ui';
import { useNotifications } from '@/contexts/NotificationContext';
import { useGroupsContext } from '@/contexts/GroupsContext';
import type { NotificationRecord, NotificationCategory } from '@umbra/service';
import { dbg } from '@/utils/debug';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ANIM_DURATION_IN = 200;
const ANIM_DURATION_OUT = 150;
const SLIDE_DISTANCE = 80;

const CATEGORY_KEYS: { key: NotificationCategory; labelKey: string }[] = [
  { key: 'all', labelKey: 'categoryAll' },
  { key: 'social', labelKey: 'categorySocial' },
  { key: 'calls', labelKey: 'categoryCalls' },
  { key: 'mentions', labelKey: 'categoryMentions' },
  { key: 'system', labelKey: 'categorySystem' },
];

// ---------------------------------------------------------------------------
// Helpers
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

function getDateGroup(timestamp: number, t: (key: string) => string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0 && now.getDate() === date.getDate()) return t('dateToday');
  if (diffDays <= 1 && now.getDate() - date.getDate() === 1) return t('dateYesterday');
  if (diffDays <= 7) return t('dateThisWeek');
  return t('dateOlder');
}

function formatTimestamp(timestamp: number, tc: (key: string, opts?: Record<string, unknown>) => string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return tc('justNow');
  if (diffMins < 60) return tc('minutesAgo', { count: diffMins });
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return tc('hoursAgo', { count: diffHours });
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return tc('daysAgo', { count: diffDays });
  return date.toLocaleDateString();
}

interface GroupedNotifications {
  label: string;
  notifications: NotificationRecord[];
}

function groupByDate(notifications: NotificationRecord[], t: (key: string) => string): GroupedNotifications[] {
  const groups: Record<string, NotificationRecord[]> = {};
  const order = [t('dateToday'), t('dateYesterday'), t('dateThisWeek'), t('dateOlder')];

  for (const n of notifications) {
    const group = getDateGroup(n.createdAt, t);
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

interface SidebarNotificationsPanelProps {
  onClose?: () => void;
}

export function SidebarNotificationsPanel({ onClose }: SidebarNotificationsPanelProps) {
  if (__DEV__) dbg.trackRender('SidebarNotificationsPanel');
  const {
    notifications,
    unreadCounts,
    activeCategory,
    setActiveCategory,
    markRead,
    markAllRead,
    dismiss,
  } = useNotifications();
  const { t } = useTranslation('notifications');
  const { t: tCommon } = useTranslation('common');
  const { theme } = useTheme();
  const tc = theme.colors;
  const { acceptInvite, declineInvite } = useGroupsContext();

  // Track which invite is being processed (accept or decline)
  const [processingInvite, setProcessingInvite] = useState<{ id: string; action: 'join' | 'decline' } | null>(null);

  const handleJoinInvite = useCallback(async (notificationId: string, inviteId: string) => {
    setProcessingInvite({ id: inviteId, action: 'join' });
    try {
      await acceptInvite(inviteId);
      dismiss(notificationId);
    } finally {
      setProcessingInvite(null);
    }
  }, [acceptInvite, dismiss]);

  const handleDeclineInvite = useCallback(async (notificationId: string, inviteId: string) => {
    setProcessingInvite({ id: inviteId, action: 'decline' });
    try {
      await declineInvite(inviteId);
      dismiss(notificationId);
    } finally {
      setProcessingInvite(null);
    }
  }, [declineInvite, dismiss]);

  // Animation — slide up + fade in
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SLIDE_DISTANCE)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIM_DURATION_IN,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIM_DURATION_IN,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Filter by active category
  const filtered = useMemo(() => {
    if (activeCategory === 'all') return notifications;
    return notifications.filter(
      (n) => (TYPE_TO_CATEGORY[n.type] ?? 'system') === activeCategory,
    );
  }, [notifications, activeCategory]);

  // Group by date
  const grouped = useMemo(() => groupByDate(filtered, t), [filtered, t]);

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

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: ANIM_DURATION_OUT,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SLIDE_DISTANCE,
        duration: ANIM_DURATION_OUT,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  }, [fadeAnim, slideAnim, onClose]);

  const totalUnread = (unreadCounts?.all ?? 0);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {/* Section header — matches "CONVERSATIONS" pattern */}
      <Box style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 }}>
        <Text size="xs" weight="semibold" style={{ color: tc.text.onRaisedSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {t('title')}
        </Text>
        <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {totalUnread > 0 && (
            <Button
              variant="tertiary"
              onSurface
              size="xs"
              onPress={markAllRead}
              accessibilityLabel={t('markAllRead')}
              iconLeft={<CheckIcon size={12} color={tc.text.onRaisedSecondary} />}
              shape="pill"
            />
          )}
          <Button
            variant="tertiary"
            onSurface
            size="xs"
            onPress={handleClose}
            accessibilityLabel={t('closeNotifications')}
            iconLeft={<XIcon size={13} color={tc.text.onRaisedSecondary} />}
            shape="pill"
          />
        </Box>
      </Box>

      {/* Category filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, paddingHorizontal: 8, marginBottom: 4 }}
        contentContainerStyle={{ gap: 4, paddingHorizontal: 4 }}
      >
        {CATEGORY_KEYS.map(({ key, labelKey }) => {
          const isActive = activeCategory === key;
          const count = unreadCounts?.[key] ?? 0;

          return (
            <Pressable
              key={key}
              onPress={() => handleCategoryChange(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 99,
                backgroundColor: isActive ? tc.background.raised : 'transparent',
              }}
            >
              <Text
                size="xs"
                weight={isActive ? 'semibold' : 'regular'}
                style={{ color: isActive ? tc.text.onRaised : tc.text.onRaisedSecondary }}
              >
                {t(labelKey)}
              </Text>
              {count > 0 && !isActive && (
                <Box style={{
                  minWidth: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: tc.status.danger,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 3,
                }}>
                  <Text size="xs" weight="bold" style={{ fontSize: 9, lineHeight: 11, color: tc.text.inverse, textAlign: 'center' }}>
                    {count > 99 ? '99+' : count}
                  </Text>
                </Box>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Notification items */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}
      >
        {grouped.length === 0 ? (
          <Box style={{ paddingVertical: 24, alignItems: 'center' }}>
            <Text size="sm" style={{ color: tc.text.muted }}>
              {t('noNotifications')}
            </Text>
          </Box>
        ) : (
          grouped.map((group) => (
            <Box key={group.label}>
              {/* Date group label */}
              <Box style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4 }}>
                <Text size="xs" weight="semibold" style={{ color: tc.text.onRaisedSecondary }}>
                  {group.label}
                </Text>
              </Box>
              {group.notifications.map((n) => (
                <Box key={n.id}>
                  <NotificationItem
                    id={n.id}
                    type={n.type as any}
                    title={n.title}
                    description={n.description}
                    timestamp={formatTimestamp(n.createdAt, tCommon)}
                    read={n.read}
                    avatar={n.avatar}
                    onPress={() => handleNotificationPress(n)}
                    onDismiss={() => dismiss(n.id)}
                  />
                  {n.type === 'group_invite' && n.relatedId && (
                    <Box style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8, marginLeft: 48 }}>
                      <Button
                        variant="success"
                        size="xs"
                        disabled={processingInvite !== null}
                        onPress={() => handleJoinInvite(n.id, n.relatedId!)}
                      >
                        {processingInvite?.id === n.relatedId && processingInvite.action === 'join' ? t('joining') : t('join')}
                      </Button>
                      <Button
                        variant="secondary"
                        size="xs"
                        disabled={processingInvite !== null}
                        onPress={() => handleDeclineInvite(n.id, n.relatedId!)}
                      >
                        {processingInvite?.id === n.relatedId && processingInvite.action === 'decline' ? t('declining') : t('decline')}
                      </Button>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          ))
        )}
      </ScrollView>
    </Animated.View>
  );
}
