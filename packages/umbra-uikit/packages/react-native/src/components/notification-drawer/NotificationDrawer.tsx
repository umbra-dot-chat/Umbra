/**
 * @module components/notification-drawer
 * @description React Native NotificationDrawer for the Wisp design system.
 *
 * Renders the notification panel content: header with title and actions,
 * category tab bar with unread indicators, and a scrollable content area.
 *
 * NOTE: This component renders the *content* of the drawer. The slide-in
 * animation, backdrop, and positioning are handled by the consuming app
 * (e.g., via Animated.View on desktop or Sheet on mobile).
 */

import React, { forwardRef, useMemo, Children } from 'react';
import { View, Pressable, ScrollView, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { resolveNotificationDrawerColors } from '@coexist/wisp-core/styles/NotificationDrawer.styles';
import type {
  NotificationDrawerProps,
  NotificationCategory,
  notificationCategories,
} from '@coexist/wisp-core/types/NotificationDrawer.types';
import { useTheme } from '../../providers';
import { Button } from '../../primitives';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  all: 'All',
  social: 'Social',
  calls: 'Calls',
  mentions: 'Mentions',
  system: 'System',
};

const CATEGORIES: NotificationCategory[] = ['all', 'social', 'calls', 'mentions', 'system'];

// ---------------------------------------------------------------------------
// NotificationDrawer
// ---------------------------------------------------------------------------

export const NotificationDrawer = forwardRef<View, NotificationDrawerProps>(
  function NotificationDrawer(
    {
      open,
      onClose,
      category,
      onCategoryChange,
      unreadCounts,
      onMarkAllRead,
      onClearAll,
      children,
      emptyState,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const colors = useMemo(
      () => resolveNotificationDrawerColors(theme),
      [theme],
    );

    const hasChildren = Children.count(children) > 0;

    if (!open) return null;

    return (
      <View
        ref={ref}
        style={[
          {
            flex: 1,
            backgroundColor: colors.bg,
          },
          userStyle as ViewStyle,
        ]}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: defaultSpacing.lg,
            paddingTop: defaultSpacing.lg,
            paddingBottom: defaultSpacing.sm,
          }}
        >
          <RNText
            style={{
              fontSize: defaultTypography.sizes.lg.fontSize,
              lineHeight: defaultTypography.sizes.lg.lineHeight,
              fontWeight: String(defaultTypography.weights.bold) as TextStyle['fontWeight'],
              color: colors.headerText,
              flex: 1,
            }}
          >
            Notifications
          </RNText>

          {onMarkAllRead && (
            <Button size="sm" variant="secondary" onPress={onMarkAllRead}>
              Mark all read
            </Button>
          )}

          {/* Close button — top-right corner */}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close notifications"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              position: 'absolute',
              top: defaultSpacing.sm,
              right: defaultSpacing.sm,
              width: 28,
              height: 28,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RNText style={{ fontSize: 16, color: colors.headerIcon }}>{'\u2715'}</RNText>
          </Pressable>
        </View>

        {/* ── Category tabs ──────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: defaultSpacing.md,
            paddingBottom: defaultSpacing.sm,
            gap: defaultSpacing.xs,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
          accessibilityRole="tablist"
        >
          {CATEGORIES.map((cat) => {
            const isActive = category === cat;
            const count = unreadCounts?.[cat] ?? 0;

            return (
              <Pressable
                key={cat}
                onPress={() => onCategoryChange(cat)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: defaultSpacing.sm,
                  paddingVertical: defaultSpacing.xs,
                  borderRadius: defaultRadii.full,
                  backgroundColor: isActive ? colors.tabActiveBg : 'transparent',
                }}
              >
                <RNText
                  style={{
                    fontSize: defaultTypography.sizes.xs.fontSize,
                    fontWeight: isActive
                      ? (String(defaultTypography.weights.semibold) as TextStyle['fontWeight'])
                      : (String(defaultTypography.weights.regular) as TextStyle['fontWeight']),
                    color: isActive ? colors.tabActiveText : colors.tabInactiveText,
                  }}
                >
                  {CATEGORY_LABELS[cat]}
                </RNText>
                {count > 0 && !isActive && (
                  <View
                    style={{
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: colors.badgeBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 4,
                    }}
                  >
                    <RNText
                      style={{
                        fontSize: 9,
                        fontWeight: String(defaultTypography.weights.bold) as TextStyle['fontWeight'],
                        color: colors.badgeText,
                      }}
                    >
                      {count > 99 ? '99+' : count}
                    </RNText>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── Content ────────────────────────────────────────────────── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: defaultSpacing.lg }}
          showsVerticalScrollIndicator={false}
        >
          {hasChildren ? children : emptyState ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: defaultSpacing['3xl'] ?? 48 }}>
              {emptyState}
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: defaultSpacing['3xl'] ?? 48 }}>
              <RNText
                style={{
                  fontSize: defaultTypography.sizes.sm.fontSize,
                  color: colors.emptyText,
                }}
              >
                No notifications
              </RNText>
            </View>
          )}
        </ScrollView>
      </View>
    );
  },
);

NotificationDrawer.displayName = 'NotificationDrawer';
