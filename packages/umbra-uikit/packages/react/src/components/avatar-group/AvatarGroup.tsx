/**
 * @module AvatarGroup
 */
import React, { forwardRef, useMemo } from 'react';
import type { AvatarGroupProps } from '@coexist/wisp-core/types/AvatarGroup.types';
import { avatarSizeMap } from '@coexist/wisp-core/types/Avatar.types';
import {
  buildGroupStyle,
  buildAvatarWrapperStyle,
  buildOverflowStyle,
} from '@coexist/wisp-core/styles/AvatarGroup.styles';
import { useTheme } from '../../providers';

/**
 * AvatarGroup — Displays a stack of overlapping avatars with an optional
 * "+N" overflow indicator.
 *
 * @remarks
 * Key features:
 * - Overlapping layout with configurable spacing.
 * - Automatic overflow count when children exceed `max`.
 * - Passes `size` down to each Avatar child via `cloneElement`.
 * - Forwards a ref to the outer `<div>` wrapper.
 *
 * @example
 * ```tsx
 * <AvatarGroup max={3} size="md">
 *   <Avatar name="Alice" />
 *   <Avatar name="Bob" />
 *   <Avatar name="Carol" />
 *   <Avatar name="Dave" />
 *   <Avatar name="Eve" />
 * </AvatarGroup>
 * ```
 */
export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  function AvatarGroup(
    {
      children,
      max,
      size = 'md',
      spacing = 8,
      onSurface = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
  const themeColors = theme.colors;
    const sizeConfig = avatarSizeMap[size];

    const allChildren = React.Children.toArray(children);
    const visibleCount =
      max !== undefined && max < allChildren.length ? max : allChildren.length;
    const overflow = allChildren.length - visibleCount;
    const visibleChildren = allChildren.slice(0, visibleCount);

    const groupStyle = useMemo(() => buildGroupStyle(), []);

    const overflowStyle = useMemo(
      () => buildOverflowStyle(sizeConfig, spacing, theme),
      [sizeConfig, spacing, theme],
    );

    return (
      <div
        ref={ref}
        role="group"
        aria-label="Avatar group"
        className={className}
        style={{ ...groupStyle, ...userStyle }}
        {...rest}
      >
        {visibleChildren.map((child, index) => {
          const wrapperStyle = buildAvatarWrapperStyle(
            spacing,
            index,
            visibleCount,
            theme,
          );

          // Clone each Avatar child to inject the group's size prop
          const cloned = React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<any>, { size, onSurface })
            : child;

          return (
            <div key={index} style={wrapperStyle}>
              {cloned}
            </div>
          );
        })}

        {overflow > 0 && (
          <div style={overflowStyle} aria-label={`${overflow} more`}>
            +{overflow}
          </div>
        )}
      </div>
    );
  },
);

AvatarGroup.displayName = 'AvatarGroup';
