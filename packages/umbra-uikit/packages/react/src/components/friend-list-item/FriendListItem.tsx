/**
 * @module FriendListItem
 * @description Rich friend list item for messaging app sidebars.
 *
 * Shows avatar (with optional status dot), name, username, status text,
 * mutual friends, and trailing action buttons.
 */
import React, { forwardRef, useMemo, useCallback } from 'react';
import type { FriendListItemProps, FriendStatus } from '@coexist/wisp-core/types/FriendListItem.types';
import {
  resolveFriendListItemColors,
  buildFriendListItemStyle,
  buildFriendListItemNameStyle,
  buildFriendListItemUsernameStyle,
  buildFriendListItemStatusTextStyle,
  buildFriendListItemActionStyle,
  buildFriendListItemSkeletonStyle,
} from '@coexist/wisp-core/styles/FriendListItem.styles';
import type { FriendListItemColors } from '@coexist/wisp-core/styles/FriendListItem.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Status color helper
// ---------------------------------------------------------------------------

function getStatusColor(status: FriendStatus, colors: FriendListItemColors): string {
  switch (status) {
    case 'online': return colors.statusOnline;
    case 'idle': return colors.statusIdle;
    case 'dnd': return colors.statusDnd;
    default: return colors.statusOffline;
  }
}

// ---------------------------------------------------------------------------
// FriendListItem
// ---------------------------------------------------------------------------

/**
 * FriendListItem — A rich list item for friend lists.
 *
 * @remarks
 * Designed for friend list sidebars (Discord-style). Shows avatar with optional
 * online indicator, display name, username, status text or mutual friend count,
 * and trailing action buttons.
 *
 * @example
 * ```tsx
 * <FriendListItem
 *   name="Alice"
 *   username="@alice"
 *   avatar={<Avatar src="..." size="md" />}
 *   status="online"
 *   actions={[
 *     { id: 'msg', label: 'Message', icon: <MessageIcon />, onPress: () => {} },
 *   ]}
 * />
 * ```
 */
export const FriendListItem = forwardRef<HTMLDivElement, FriendListItemProps>(
  function FriendListItem(
    {
      name,
      username,
      avatar,
      status = 'offline',
      statusText,
      mutualFriends,
      actions,
      disabled = false,
      skeleton = false,
      flat = false,
      onClick,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveFriendListItemColors(theme),
      [theme],
    );

    // ------ Skeleton ------
    if (skeleton) {
      const skeletonContainerStyle = useMemo(
        () => buildFriendListItemSkeletonStyle(theme, flat),
        [theme, flat],
      );

      return (
        <div
          ref={ref}
          aria-hidden
          className={className}
          style={{ ...skeletonContainerStyle, ...userStyle }}
          {...rest}
        >
          <div style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.border.subtle, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
            <div style={{ height: 12, width: '50%', borderRadius: theme.radii.sm, backgroundColor: theme.colors.border.subtle }} />
            <div style={{ height: 12, width: '30%', borderRadius: theme.radii.sm, backgroundColor: theme.colors.border.subtle }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.border.subtle }} />
            <div style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.border.subtle }} />
          </div>
        </div>
      );
    }

    // ------ Normal render ------
    const containerStyle = useMemo(
      () => buildFriendListItemStyle(colors, disabled, theme, flat),
      [colors, disabled, theme, flat],
    );

    const nameStyle = useMemo(
      () => buildFriendListItemNameStyle(colors, theme),
      [colors, theme],
    );

    const usernameStyle = useMemo(
      () => buildFriendListItemUsernameStyle(colors, theme),
      [colors, theme],
    );

    const statusTextStyleMemo = useMemo(
      () => buildFriendListItemStatusTextStyle(colors, theme),
      [colors, theme],
    );

    const actionStyle = useMemo(
      () => buildFriendListItemActionStyle(colors, theme),
      [colors, theme],
    );

    const statusDotStyle = useMemo(
      () => ({
        position: 'absolute' as const,
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: getStatusColor(status, colors),
        borderWidth: 2,
        borderStyle: 'solid' as const,
        borderColor: theme.colors.background.canvas,
        boxSizing: 'border-box' as const,
      }),
      [status, colors, theme],
    );

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (!disabled) onClick?.(e);
      },
      [disabled, onClick],
    );

    // Build subtitle text
    const subtitle = statusText
      ?? (mutualFriends != null && mutualFriends > 0
        ? `${mutualFriends} mutual friend${mutualFriends === 1 ? '' : 's'}`
        : undefined);

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(e as unknown as React.MouseEvent);
          }
        }}
        {...rest}
      >
        {/* Avatar + status dot */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {avatar}
          {status !== 'offline' && <div style={statusDotStyle} />}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={nameStyle}>{name}</span>
            {username && <span style={usernameStyle}>{username}</span>}
          </div>
          {subtitle && (
            <span style={statusTextStyleMemo}>{subtitle}</span>
          )}
        </div>

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onPress?.();
                }}
                aria-label={action.label}
                style={actionStyle}
              >
                {action.icon}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
);

FriendListItem.displayName = 'FriendListItem';
