/**
 * @module components/notification-drawer
 * @description Web NotificationDrawer for the Wisp design system.
 */

import React, { forwardRef, useMemo, Children, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { resolveNotificationDrawerColors } from '@coexist/wisp-core/styles/NotificationDrawer.styles';
import type {
  NotificationDrawerProps,
  NotificationCategory,
} from '@coexist/wisp-core/types/NotificationDrawer.types';
import { useTheme } from '../../providers';
import { Button } from '../../primitives/button';
import { Icon } from '../../primitives/icon';

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  all: 'All',
  social: 'Social',
  calls: 'Calls',
  mentions: 'Mentions',
  system: 'System',
};

const CATEGORIES: NotificationCategory[] = ['all', 'social', 'calls', 'mentions', 'system'];

export const NotificationDrawer = forwardRef<HTMLDivElement, NotificationDrawerProps>(
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
    const colors = useMemo(() => resolveNotificationDrawerColors(theme), [theme]);
    const hasChildren = Children.count(children) > 0;

    if (!open) return null;

    return (
      <div
        ref={ref}
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          height: '100%',
          minHeight: 0,
          background: colors.bg,
          ...(userStyle as CSSProperties),
        }}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `${defaultSpacing.lg}px ${defaultSpacing.lg}px ${defaultSpacing.sm}px`,
          }}
        >
          <span
            style={{
              fontSize: defaultTypography.sizes.lg.fontSize,
              lineHeight: `${defaultTypography.sizes.lg.lineHeight}px`,
              fontWeight: defaultTypography.weights.bold,
              color: colors.headerText,
            }}
          >
            Notifications
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: defaultSpacing.sm }}>
            {onMarkAllRead && (
              <Button
                variant="tertiary"
                size="xs"
                onClick={onMarkAllRead}
                aria-label="Mark all as read"
              >
                Mark all read
              </Button>
            )}

            <Button
              variant="tertiary"
              size="xs"
              iconLeft={<Icon icon={X} size="xs" />}
              onClick={onClose}
              aria-label="Close notifications"
            />
          </div>
        </div>

        {/* ── Category tabs ───────────────────────────────── */}
        <div
          role="tablist"
          style={{
            display: 'flex',
            padding: `0 ${defaultSpacing.md}px ${defaultSpacing.sm}px`,
            gap: defaultSpacing.xs,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = category === cat;
            const count = unreadCounts?.[cat] ?? 0;

            return (
              <button
                key={cat}
                role="tab"
                aria-selected={isActive}
                onClick={() => onCategoryChange(cat)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: `${defaultSpacing.xs}px ${defaultSpacing.sm}px`,
                  borderRadius: defaultRadii.full,
                  background: isActive ? colors.tabActiveBg : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: defaultTypography.sizes.xs.fontSize,
                  fontWeight: isActive ? defaultTypography.weights.semibold : defaultTypography.weights.regular,
                  color: isActive ? colors.tabActiveText : colors.tabInactiveText,
                }}
              >
                {CATEGORY_LABELS[cat]}
                {count > 0 && !isActive && (
                  <span
                    style={{
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      background: colors.badgeBg,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingInline: 4,
                      fontSize: 9,
                      fontWeight: defaultTypography.weights.bold,
                      color: colors.badgeText,
                    }}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Content ─────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: defaultSpacing.lg }}>
          {hasChildren ? children : emptyState ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `${(defaultSpacing as any)['3xl'] ?? 48}px 0` }}>
              {emptyState}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: `${(defaultSpacing as any)['3xl'] ?? 48}px 0` }}>
              <span style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: colors.emptyText }}>
                No notifications
              </span>
            </div>
          )}
        </div>
      </div>
    );
  },
);

NotificationDrawer.displayName = 'NotificationDrawer';
