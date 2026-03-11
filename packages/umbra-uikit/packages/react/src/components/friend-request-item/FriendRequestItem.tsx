/**
 * @module FriendRequestItem
 * @description Friend request list item for the Wisp design system.
 *
 * Displays an incoming or outgoing friend request with contextual
 * accept/decline/cancel actions.
 */
import React, { forwardRef, useMemo } from 'react';
import type { FriendRequestItemProps } from '@coexist/wisp-core/types/FriendRequestItem.types';
import {
  resolveFriendRequestItemColors,
  buildFriendRequestItemStyle,
  buildFriendRequestItemNameStyle,
  buildFriendRequestItemSubtitleStyle,
  buildFriendRequestAcceptStyle,
  buildFriendRequestDeclineStyle,
} from '@coexist/wisp-core/styles/FriendRequestItem.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function CheckIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1={18} y1={6} x2={6} y2={18} />
      <line x1={6} y1={6} x2={18} y2={18} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// FriendRequestItem
// ---------------------------------------------------------------------------

/**
 * FriendRequestItem — A list item for incoming/outgoing friend requests.
 *
 * @remarks
 * Shows the requester's avatar, name, username, request type label,
 * timestamp, mutual friend count, and contextual action buttons.
 *
 * @example
 * ```tsx
 * <FriendRequestItem
 *   name="Alice"
 *   username="@alice"
 *   avatar={<Avatar src="..." size="md" />}
 *   type="incoming"
 *   timestamp="2 days ago"
 *   onAccept={() => {}}
 *   onDecline={() => {}}
 * />
 * ```
 */
export const FriendRequestItem = forwardRef<HTMLDivElement, FriendRequestItemProps>(
  function FriendRequestItem(
    {
      name,
      username,
      avatar,
      type,
      timestamp,
      mutualFriends,
      onAccept,
      onDecline,
      onCancel,
      disabled = false,
      skeleton = false,
      flat = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveFriendRequestItemColors(theme),
      [theme],
    );

    // ------ Skeleton ------
    if (skeleton) {
      const skeletonContainerStyle = useMemo(
        () => ({
          display: 'flex' as const,
          alignItems: 'center' as const,
          gap: theme.spacing.md,
          padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
          borderRadius: flat ? 0 : theme.radii.md,
          minHeight: 60,
          width: '100%',
          boxSizing: 'border-box' as const,
          borderBottom: `1px solid ${theme.colors.border.subtle}`,
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
            <div style={{ height: 12, width: '50%', borderRadius: theme.radii.sm, backgroundColor: theme.colors.border.subtle }} />
            <div style={{ height: 12, width: '35%', borderRadius: theme.radii.sm, backgroundColor: theme.colors.border.subtle }} />
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
      () => buildFriendRequestItemStyle(colors, disabled, theme, flat),
      [colors, disabled, theme, flat],
    );

    const nameStyle = useMemo(
      () => buildFriendRequestItemNameStyle(colors, theme),
      [colors, theme],
    );

    const subtitleStyle = useMemo(
      () => buildFriendRequestItemSubtitleStyle(colors, theme),
      [colors, theme],
    );

    const acceptBtnStyle = useMemo(
      () => buildFriendRequestAcceptStyle(colors, theme),
      [colors, theme],
    );

    const declineBtnStyle = useMemo(
      () => buildFriendRequestDeclineStyle(colors, theme),
      [colors, theme],
    );

    // Build subtitle
    const parts: string[] = [];
    if (type === 'incoming') parts.push('Incoming Friend Request');
    if (type === 'outgoing') parts.push('Outgoing Friend Request');
    if (timestamp) parts.push(`\u00B7 ${timestamp}`);
    if (mutualFriends != null && mutualFriends > 0) {
      parts.push(`\u00B7 ${mutualFriends} mutual`);
    }
    const subtitle = parts.join(' ');

    return (
      <div
        ref={ref}
        role="group"
        aria-label={`${type} friend request from ${name}`}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        {/* Avatar */}
        <div style={{ flexShrink: 0 }}>
          {avatar}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={nameStyle}>{name}</span>
            {username && <span style={subtitleStyle}>{username}</span>}
          </div>
          <span style={subtitleStyle}>{subtitle}</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {type === 'incoming' && (
            <>
              <button
                onClick={onAccept}
                disabled={disabled}
                aria-label="Accept"
                style={acceptBtnStyle}
              >
                <CheckIcon size={18} color={colors.acceptText} />
              </button>
              <button
                onClick={onDecline}
                disabled={disabled}
                aria-label="Decline"
                style={declineBtnStyle}
              >
                <XIcon size={18} color={colors.declineText} />
              </button>
            </>
          )}
          {type === 'outgoing' && (
            <button
              onClick={onCancel}
              disabled={disabled}
              aria-label="Cancel request"
              style={declineBtnStyle}
            >
              <XIcon size={18} color={colors.cancelText} />
            </button>
          )}
        </div>
      </div>
    );
  },
);

FriendRequestItem.displayName = 'FriendRequestItem';
