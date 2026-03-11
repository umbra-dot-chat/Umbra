/**
 * @module UserSearchResult
 * @description User search result row for the Wisp design system.
 *
 * Displays a user in search results with a contextual action button
 * reflecting the current relationship state (Send Request / Pending / Friends).
 */
import React, { forwardRef, useMemo } from 'react';
import type { UserSearchResultProps, UserSearchRequestState } from '@coexist/wisp-core/types/UserSearchResult.types';
import {
  resolveUserSearchResultColors,
  buildUserSearchResultStyle,
  buildUserSearchResultButtonStyle,
} from '@coexist/wisp-core/styles/UserSearchResult.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REQUEST_LABELS: Record<UserSearchRequestState, string> = {
  none: 'Send Request',
  pending: 'Pending',
  friends: 'Friends',
};

// ---------------------------------------------------------------------------
// UserSearchResult
// ---------------------------------------------------------------------------

/**
 * UserSearchResult — A search result row with relationship-aware action button.
 *
 * @remarks
 * Shows avatar, name, username, mutual friend count, and a button that
 * reflects whether the user can send a request, has a pending request,
 * or is already friends.
 *
 * @example
 * ```tsx
 * <UserSearchResult
 *   name="Alice"
 *   username="@alice"
 *   avatar={<Avatar src="..." size="md" />}
 *   requestState="none"
 *   onSendRequest={() => {}}
 * />
 * ```
 */
export const UserSearchResult = forwardRef<HTMLDivElement, UserSearchResultProps>(
  function UserSearchResult(
    {
      name,
      username,
      avatar,
      requestState = 'none',
      mutualFriends,
      onSendRequest,
      disabled = false,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveUserSearchResultColors(theme),
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
          borderRadius: theme.radii.md,
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
            <div style={{ height: 12, width: '30%', borderRadius: theme.radii.sm, backgroundColor: theme.colors.border.subtle }} />
          </div>
          <div style={{ width: 90, height: 32, borderRadius: theme.radii.md, backgroundColor: theme.colors.border.subtle }} />
        </div>
      );
    }

    // ------ Normal render ------
    const containerStyle = useMemo(
      () => buildUserSearchResultStyle(colors, disabled, theme),
      [colors, disabled, theme],
    );

    const nameStyle = useMemo(
      () => ({
        fontFamily: 'inherit',
        fontSize: theme.typography.sizes.sm.fontSize,
        lineHeight: `${theme.typography.sizes.sm.lineHeight}px`,
        fontWeight: theme.typography.weights.semibold,
        color: colors.text,
        overflow: 'hidden' as const,
        textOverflow: 'ellipsis' as const,
        whiteSpace: 'nowrap' as const,
      }),
      [colors, theme],
    );

    const subtitleStyle = useMemo(
      () => ({
        fontFamily: 'inherit',
        fontSize: theme.typography.sizes.xs.fontSize,
        lineHeight: `${theme.typography.sizes.xs.lineHeight}px`,
        fontWeight: theme.typography.weights.regular,
        color: colors.textMuted,
      }),
      [colors, theme],
    );

    const btnStyle = useMemo(
      () => buildUserSearchResultButtonStyle(colors, requestState, theme),
      [colors, requestState, theme],
    );

    // Subtitle text
    const subtitleText = mutualFriends != null && mutualFriends > 0
      ? `${mutualFriends} mutual friend${mutualFriends === 1 ? '' : 's'}`
      : username;

    return (
      <div
        ref={ref}
        role="group"
        aria-label={`Search result for ${name}`}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        {/* Avatar */}
        <div style={{ flexShrink: 0 }}>{avatar}</div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={nameStyle}>{name}</span>
            {username && requestState === 'none' && (
              <span style={subtitleStyle}>{username}</span>
            )}
          </div>
          {subtitleText && (
            <span style={subtitleStyle}>{subtitleText}</span>
          )}
        </div>

        {/* Action button */}
        <button
          onClick={requestState === 'none' ? onSendRequest : undefined}
          disabled={disabled || requestState !== 'none'}
          aria-label={REQUEST_LABELS[requestState]}
          style={btnStyle}
        >
          {REQUEST_LABELS[requestState]}
        </button>
      </div>
    );
  },
);

UserSearchResult.displayName = 'UserSearchResult';
