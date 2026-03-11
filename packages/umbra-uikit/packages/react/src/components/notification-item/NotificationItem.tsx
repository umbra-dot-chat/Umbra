/**
 * @module components/notification-item
 * @description Web NotificationItem for the Wisp design system.
 */

import React, { forwardRef, useMemo, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import {
  resolveNotificationItemColors,
  resolveNotificationAccent,
} from '@coexist/wisp-core/styles/NotificationItem.styles';
import type {
  NotificationItemProps,
} from '@coexist/wisp-core/types/NotificationItem.types';
import { useTheme } from '../../providers';
import { Button } from '../../primitives/button';
import { Icon } from '../../primitives/icon';

const AVATAR_SIZE = 36;
const UNREAD_BORDER_WIDTH = 3;

export const NotificationItem = forwardRef<HTMLDivElement, NotificationItemProps>(
  function NotificationItem(
    {
      id,
      type,
      title,
      description,
      timestamp,
      read,
      avatar,
      avatarFallback,
      icon: CustomIcon,
      iconColor,
      actions,
      onPress,
      onDismiss,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const colors = useMemo(() => resolveNotificationItemColors(type, read, theme), [type, read, theme]);
    const accent = useMemo(() => resolveNotificationAccent(type, theme), [type, theme]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: `${defaultSpacing.sm}px ${defaultSpacing.md}px`,
        paddingLeft: read ? defaultSpacing.md : defaultSpacing.md - UNREAD_BORDER_WIDTH,
        gap: defaultSpacing.md,
        borderLeft: read ? 'none' : `${UNREAD_BORDER_WIDTH}px solid ${accent}`,
        background: read ? 'transparent' : colors.bgUnread,
        borderRadius: defaultRadii.md,
        minHeight: 56,
        cursor: onPress ? 'pointer' : 'default',
        transition: 'opacity 150ms',
      }),
      [read, accent, colors.bgUnread, onPress],
    );

    const CustomIconComponent = CustomIcon;
    const resolvedIconColor = iconColor ?? accent;

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={onPress ? 0 : undefined}
        aria-label={`${read ? '' : 'Unread '}notification: ${title}`}
        onClick={onPress}
        onKeyDown={onPress ? (e) => e.key === 'Enter' && onPress() : undefined}
        style={{ ...containerStyle, ...(userStyle as CSSProperties) }}
      >
        {/* Avatar / Icon */}
        <div
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: '50%',
            background: colors.avatarBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {avatar ? (
            <img src={avatar} alt="" style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: '50%', objectFit: 'cover' }} />
          ) : CustomIconComponent ? (
            <CustomIconComponent size={AVATAR_SIZE * 0.5} color={resolvedIconColor} />
          ) : avatarFallback ? (
            <span style={{ fontSize: AVATAR_SIZE * 0.4, fontWeight: defaultTypography.weights.semibold, color: accent }}>
              {avatarFallback}
            </span>
          ) : null}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: defaultTypography.sizes.sm.fontSize,
                lineHeight: `${defaultTypography.sizes.sm.lineHeight}px`,
                fontWeight: read ? defaultTypography.weights.regular : defaultTypography.weights.semibold,
                color: colors.text,
              }}
            >
              {title}
            </span>
            <span
              style={{
                fontSize: (defaultTypography.sizes as any)['2xs']?.fontSize ?? 10,
                lineHeight: `${(defaultTypography.sizes as any)['2xs']?.lineHeight ?? 14}px`,
                color: colors.textMuted,
                marginTop: 2,
                flexShrink: 0,
                marginLeft: 8,
              }}
            >
              {timestamp}
            </span>
          </div>

          {description && (
            <span
              style={{
                fontSize: defaultTypography.sizes.xs.fontSize,
                lineHeight: `${defaultTypography.sizes.xs.lineHeight}px`,
                color: colors.textMuted,
                marginTop: 2,
              }}
            >
              {description}
            </span>
          )}

          {actions && actions.length > 0 && (
            <div style={{ display: 'flex', gap: defaultSpacing.xs, marginTop: defaultSpacing.xs }}>
              {actions.map((action) => (
                <Button
                  key={action.label}
                  variant={
                    action.variant === 'primary'
                      ? 'primary'
                      : action.variant === 'danger'
                        ? 'destructive'
                        : 'secondary'
                  }
                  size="xs"
                  onClick={(e) => { e.stopPropagation(); action.onPress(); }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <Button
            variant="tertiary"
            size="xs"
            iconLeft={<Icon icon={X} size="xs" />}
            aria-label="Dismiss notification"
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            style={{ flexShrink: 0, marginTop: 2 }}
          />
        )}
      </div>
    );
  },
);

NotificationItem.displayName = 'NotificationItem';
