/**
 * @module RoleBadge
 * @description A colored pill badge representing a user role with optional remove button.
 */
import React, { forwardRef, useMemo, useCallback } from 'react';
import type { RoleBadgeProps } from '@coexist/wisp-core/types/RoleBadge.types';
import {
  resolveRoleBadgeColors,
  roleBadgeSizeMap,
  buildRoleBadgeStyle,
  buildRoleBadgeDotStyle,
  buildRoleBadgeNameStyle,
  buildRoleBadgeRemoveButtonStyle,
} from '@coexist/wisp-core/styles/RoleBadge.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function RemoveIcon({ size = 10, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// RoleBadge
// ---------------------------------------------------------------------------

/**
 * RoleBadge -- A colored pill badge representing a user role.
 *
 * @remarks
 * Displays a small colored dot, the role name, and an optional remove button.
 * Supports five size presets (xs through xl). The badge background and border
 * use alpha-blended theme tokens while the dot uses the role's assigned color.
 *
 * @example
 * ```tsx
 * <RoleBadge
 *   role={{ id: '1', name: 'Admin', color: '#e74c3c', position: 10 }}
 *   size="sm"
 *   removable
 *   onRemove={() => handleRemove('1')}
 * />
 * ```
 */
export const RoleBadge = forwardRef<HTMLDivElement, RoleBadgeProps>(
  function RoleBadge(
    {
      role,
      size = 'sm',
      removable = false,
      onRemove,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveRoleBadgeColors(theme),
      [theme],
    );

    const sizeConfig = useMemo(
      () => roleBadgeSizeMap[size],
      [size],
    );

    const containerStyle = useMemo(
      () => buildRoleBadgeStyle(sizeConfig, colors, theme, userStyle as any),
      [sizeConfig, colors, theme, userStyle],
    );

    const dotStyle = useMemo(
      () => buildRoleBadgeDotStyle(sizeConfig, role.color, theme),
      [sizeConfig, role.color, theme],
    );

    const nameStyle = useMemo(
      () => buildRoleBadgeNameStyle(colors),
      [colors],
    );

    const removeButtonStyle = useMemo(
      () => buildRoleBadgeRemoveButtonStyle(sizeConfig, colors, theme),
      [sizeConfig, colors, theme],
    );

    const handleRemove = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove?.();
      },
      [onRemove],
    );

    return (
      <div
        ref={ref}
        className={className}
        style={containerStyle}
        aria-label={`Role: ${role.name}`}
        {...rest}
      >
        {/* Role color dot */}
        <span style={dotStyle} aria-hidden />

        {/* Optional icon */}
        {role.icon && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: sizeConfig.iconSize,
              height: sizeConfig.iconSize,
              flexShrink: 0,
            }}
            aria-hidden
          >
            {role.icon}
          </span>
        )}

        {/* Role name */}
        <span style={nameStyle}>{role.name}</span>

        {/* Remove button */}
        {removable && (
          <button
            type="button"
            aria-label={`Remove ${role.name} role`}
            style={removeButtonStyle}
            onClick={handleRemove}
          >
            <RemoveIcon size={sizeConfig.iconSize} />
          </button>
        )}
      </div>
    );
  },
);

RoleBadge.displayName = 'RoleBadge';
