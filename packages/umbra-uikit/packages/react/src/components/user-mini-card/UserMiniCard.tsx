/**
 * @module UserMiniCard
 * @description Compact inline user card for the Wisp design system.
 *
 * Shows avatar, name, username, status, and optional quick-action icons.
 * Designed for hover tooltips and mention popovers.
 */
import React, { forwardRef, useMemo } from 'react';
import type { UserMiniCardProps, UserMiniCardStatus } from '@coexist/wisp-core/types/UserMiniCard.types';
import {
  resolveUserMiniCardColors,
  buildUserMiniCardContainerStyle,
  buildUserMiniCardNameStyle,
  buildUserMiniCardUsernameStyle,
  buildUserMiniCardStatusStyle,
  buildUserMiniCardActionStyle,
} from '@coexist/wisp-core/styles/UserMiniCard.styles';
import type { UserMiniCardColors } from '@coexist/wisp-core/styles/UserMiniCard.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function getStatusColor(status: UserMiniCardStatus, colors: UserMiniCardColors): string {
  switch (status) {
    case 'online': return colors.statusOnline;
    case 'idle': return colors.statusIdle;
    case 'dnd': return colors.statusDnd;
    default: return colors.statusOffline;
  }
}

function getStatusLabel(status: UserMiniCardStatus): string {
  switch (status) {
    case 'online': return 'Online';
    case 'idle': return 'Idle';
    case 'dnd': return 'Do Not Disturb';
    default: return 'Offline';
  }
}

// ---------------------------------------------------------------------------
// UserMiniCard
// ---------------------------------------------------------------------------

/**
 * UserMiniCard — A compact inline user card for hover tooltips and popovers.
 *
 * @remarks
 * Lightweight card showing avatar, display name, username, online status,
 * and optional quick-action buttons. No banner, bio, or roles.
 *
 * @example
 * ```tsx
 * <UserMiniCard
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
export const UserMiniCard = forwardRef<HTMLDivElement, UserMiniCardProps>(
  function UserMiniCard(
    {
      name,
      username,
      avatar,
      status = 'offline',
      statusText,
      actions,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveUserMiniCardColors(theme),
      [theme],
    );

    // ------ Skeleton ------
    if (skeleton) {
      const skeletonContainerStyle = useMemo(
        () => ({
          display: 'flex' as const,
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          gap: theme.spacing.md,
          padding: theme.spacing.md,
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.background.surface,
          border: `1px solid ${theme.colors.border.subtle}`,
          minWidth: 240,
          boxSizing: 'border-box' as const,
        }),
        [theme],
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
            <div style={{ height: 12, width: '60%', borderRadius: theme.radii.sm, backgroundColor: theme.colors.border.subtle }} />
            <div style={{ height: 10, width: '40%', borderRadius: theme.radii.sm, backgroundColor: theme.colors.border.subtle }} />
          </div>
        </div>
      );
    }

    // ------ Normal render ------
    const containerStyle = useMemo(
      () => buildUserMiniCardContainerStyle(colors, theme),
      [colors, theme],
    );

    const nameStyle = useMemo(
      () => buildUserMiniCardNameStyle(colors, theme),
      [colors, theme],
    );

    const usernameStyle = useMemo(
      () => buildUserMiniCardUsernameStyle(colors, theme),
      [colors, theme],
    );

    const statusStyle = useMemo(
      () => buildUserMiniCardStatusStyle(colors, theme),
      [colors, theme],
    );

    const actionBtnStyle = useMemo(
      () => buildUserMiniCardActionStyle(colors, theme),
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
        borderColor: colors.bg,
        boxSizing: 'border-box' as const,
      }),
      [status, colors],
    );

    const displayStatus = statusText ?? getStatusLabel(status);

    return (
      <div
        ref={ref}
        role="group"
        aria-label={`User card for ${name}`}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        {/* Avatar + status dot */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {avatar}
          <div style={statusDotStyle} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' as const, gap: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={nameStyle}>{name}</span>
            {username && <span style={usernameStyle}>{username}</span>}
          </div>
          <span style={statusStyle}>{displayStatus}</span>
        </div>

        {/* Quick actions */}
        {actions && actions.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={action.onPress}
                aria-label={action.label}
                style={actionBtnStyle}
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

UserMiniCard.displayName = 'UserMiniCard';
