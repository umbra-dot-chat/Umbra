/**
 * @module NotificationBadge
 */
import React, { forwardRef, useMemo, useEffect } from 'react';
import type { NotificationBadgeProps } from '@coexist/wisp-core/types/NotificationBadge.types';
import {
  resolveNotificationBadgeColors,
  buildNotificationBadgeWrapperStyle,
  buildNotificationBadgeStyle,
  ensureNotificationBadgeKeyframes,
} from '@coexist/wisp-core/styles/NotificationBadge.styles';
import { useTheme } from '../../providers';

/**
 * NotificationBadge — Count / dot overlay primitive for the Wisp design system.
 *
 * @remarks
 * Wraps a child element (icon, avatar, button) and renders a small count
 * or dot badge at the top-right corner to convey unread counts, alerts,
 * or activity indicators.
 *
 * - Five color variants: `danger`, `warning`, `success`, `info`, `default`.
 * - Dot mode for minimal presence.
 * - Automatic overflow: shows `{max}+` when count exceeds `max`.
 * - Optional pulse animation to draw attention.
 *
 * @module primitives/notification-badge
 *
 * @example
 * ```tsx
 * <NotificationBadge count={5}>
 *   <Bell size={24} />
 * </NotificationBadge>
 *
 * <NotificationBadge dot color="success">
 *   <Mail size={24} />
 * </NotificationBadge>
 * ```
 */
export const NotificationBadge = forwardRef<HTMLDivElement, NotificationBadgeProps>(
  function NotificationBadge(
    {
      count,
      max = 99,
      dot = false,
      color = 'danger',
      invisible = false,
      pulse = false,
      children,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
  const themeColors = theme.colors;

    useEffect(() => {
      if (pulse) ensureNotificationBadgeKeyframes();
    }, [pulse]);

    const colors = useMemo(
      () => resolveNotificationBadgeColors(color, theme),
      [color, theme],
    );

    const wrapperStyle = useMemo(() => buildNotificationBadgeWrapperStyle(), [theme]);

    const badgeStyle = useMemo(
      () => buildNotificationBadgeStyle(colors, dot, invisible, pulse, theme),
      [colors, dot, invisible, pulse, theme],
    );

    // Determine badge content
    const showBadge = !invisible && (dot || (count !== undefined && count > 0));
    const displayText = dot
      ? null
      : count !== undefined && count > max
        ? `${max}+`
        : count !== undefined
          ? String(count)
          : null;

    return (
      <div
        ref={ref}
        className={className}
        style={{ ...wrapperStyle, ...userStyle }}
        {...rest}
      >
        {children}
        {showBadge && (
          <span aria-hidden="true" style={badgeStyle}>
            {displayText}
          </span>
        )}
      </div>
    );
  },
);

NotificationBadge.displayName = 'NotificationBadge';
