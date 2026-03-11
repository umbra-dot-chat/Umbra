/**
 * @module ThreadFollowButton
 * @description A toggle button to follow/unfollow a thread.
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type { ThreadFollowButtonProps } from '@coexist/wisp-core/types/ThreadFollowButton.types';
import {
  buildThreadFollowButtonStyle,
  threadFollowButtonSizeMap,
} from '@coexist/wisp-core/styles/ThreadFollowButton.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function BellIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function BellOffIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5" />
      <path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// ThreadFollowButton
// ---------------------------------------------------------------------------

/**
 * ThreadFollowButton — A toggle button to follow/unfollow a thread.
 *
 * @remarks
 * - When **following**: secondary variant with BellOff icon and "Following" label.
 * - When **not following**: outlined variant with Bell icon and "Follow" label.
 * - Supports two sizes (`sm` and `md`) and a disabled state.
 *
 * @example
 * ```tsx
 * <ThreadFollowButton
 *   isFollowing={false}
 *   onToggle={() => toggleFollow(threadId)}
 * />
 * ```
 */
export const ThreadFollowButton = forwardRef<HTMLButtonElement, ThreadFollowButtonProps>(
  function ThreadFollowButton(
    {
      isFollowing,
      onToggle,
      size = 'sm',
      disabled = false,
      followingLabel = 'Following',
      followLabel = 'Follow',
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [hovered, setHovered] = useState(false);

    const sizeConfig = threadFollowButtonSizeMap[size];

    const buttonStyle = useMemo(
      () => buildThreadFollowButtonStyle(isFollowing, size, theme, hovered, disabled),
      [isFollowing, size, theme, hovered, disabled],
    );

    const handleMouseEnter = useCallback(() => {
      if (!disabled) setHovered(true);
    }, [disabled]);

    const handleMouseLeave = useCallback(() => setHovered(false), []);

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled) return;
        rest.onClick?.(e);
        onToggle?.();
      },
      [disabled, onToggle, rest],
    );

    const label = isFollowing ? followingLabel : followLabel;
    const iconSize = sizeConfig.iconSize;

    return (
      <button
        ref={ref}
        type="button"
        className={className}
        style={{ ...buttonStyle, ...userStyle }}
        disabled={disabled}
        aria-label={isFollowing ? 'Unfollow thread' : 'Follow thread'}
        aria-pressed={isFollowing}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...rest}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          {isFollowing
            ? <BellOffIcon size={iconSize} color="currentColor" />
            : <BellIcon size={iconSize} color="currentColor" />
          }
        </span>
        <span>{label}</span>
      </button>
    );
  },
);

ThreadFollowButton.displayName = 'ThreadFollowButton';
