/**
 * @module components/notification-bell
 * @description Web NotificationBell for the Wisp design system.
 *
 * A bell icon button with an integrated notification count/dot badge
 * and an optional subtle shake animation when there are unread notifications.
 */

import React, { forwardRef, useMemo, useEffect, useCallback, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import type { NotificationBellProps } from '@coexist/wisp-core/types/NotificationBell.types';
import {
  notificationBellSizeMap,
  resolveNotificationBellColors,
  buildNotificationBellStyle,
  ensureNotificationBellKeyframes,
  SHAKE_KEYFRAME_NAME,
} from '@coexist/wisp-core/styles/NotificationBell.styles';
import { useTheme } from '../../providers';

export const NotificationBell = forwardRef<HTMLButtonElement, NotificationBellProps>(
  function NotificationBell(
    {
      count,
      max = 99,
      dot = false,
      size = 'md',
      animate = true,
      onPress,
      active = false,
      style: userStyle,
      className,
      onClick,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const colors = useMemo(() => resolveNotificationBellColors(theme), [theme]);
    const sizeConfig = notificationBellSizeMap[size];

    // Track previous count to detect increases
    const prevCountRef = useRef(count);
    const [shaking, setShaking] = useState(false);

    useEffect(() => {
      const prev = prevCountRef.current;
      prevCountRef.current = count;

      // Only shake when count increases (not on initial mount or decrease)
      if (
        animate &&
        count !== undefined &&
        prev !== undefined &&
        count > prev
      ) {
        ensureNotificationBellKeyframes();
        setShaking(true);
        // Stop after one animation cycle (~600ms)
        const timer = setTimeout(() => setShaking(false), 600);
        return () => clearTimeout(timer);
      }
    }, [count, animate]);

    // Hover state
    const [hovered, setHovered] = useState(false);

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onPress?.();
        onClick?.(e);
      },
      [onPress, onClick],
    );

    const buttonStyle = useMemo(
      () => buildNotificationBellStyle(size, active, colors, theme),
      [size, active, colors, theme],
    );

    // Badge visibility
    const showBadge = (count !== undefined && count > 0) || dot;
    const displayText = dot
      ? null
      : count !== undefined && count > max
        ? `${max}+`
        : count !== undefined && count > 0
          ? String(count)
          : null;

    return (
      <button
        ref={ref}
        type="button"
        className={className}
        aria-label={
          count !== undefined && count > 0
            ? `Notifications (${count} unread)`
            : 'Notifications'
        }
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          ...buttonStyle,
          ...(hovered && !active ? { background: colors.hoverBg } : {}),
          ...userStyle,
        } as React.CSSProperties}
        {...rest}
      >
        {/* Bell icon — shakes once when count increases */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: shaking
              ? `${SHAKE_KEYFRAME_NAME} 0.6s ease-in-out`
              : 'none',
            transformOrigin: 'top center',
          }}
        >
          <Bell
            size={sizeConfig.iconSize}
            strokeWidth={2}
            color="currentColor"
          />
        </span>

        {/* Badge */}
        {showBadge && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: dot ? 6 : 2,
              right: dot ? 6 : 2,
              transform: dot ? 'none' : 'translate(25%, -25%)',
              minWidth: dot ? 8 : 18,
              height: dot ? 8 : 18,
              borderRadius: 9999,
              background: theme.colors.status.danger,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingInline: dot ? 0 : 4,
              fontSize: 10,
              fontWeight: 700,
              lineHeight: 1,
              pointerEvents: 'none',
              border: `2px solid ${theme.colors.background.raised ?? theme.colors.background.canvas}`,
              boxSizing: 'border-box',
            }}
          >
            {displayText}
          </span>
        )}
      </button>
    );
  },
);

NotificationBell.displayName = 'NotificationBell';
