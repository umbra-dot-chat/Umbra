/**
 * ActiveTimeoutsBadge -- Badge/indicator on member profiles showing active
 * timeout status.
 *
 * @remarks
 * Displays a warning-colored badge for mute timeouts and a danger-colored
 * badge for restrict timeouts. Includes an optional tooltip with details
 * (reason and expiry). Hidden when `active` is false.
 *
 * @module components/active-timeouts-badge
 * @example
 * ```tsx
 * <ActiveTimeoutsBadge
 *   active={true}
 *   type="mute"
 *   expiresAt="2025-02-01T12:00:00Z"
 *   reason="Spam messages"
 * />
 * ```
 */
import React, { forwardRef, useMemo } from 'react';
import type { ActiveTimeoutsBadgeProps } from '@coexist/wisp-core/types/ActiveTimeoutsBadge.types';
import {
  resolveActiveTimeoutsBadgeColors,
  buildBadgeStyle,
  buildIconStyle,
  buildTooltipContainerStyle,
  buildTooltipLabelStyle,
  buildTooltipDetailStyle,
} from '@coexist/wisp-core/styles/ActiveTimeoutsBadge.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Clock Icon (inline SVG)
// ---------------------------------------------------------------------------

function ClockIcon({ size = 12, color }: { size?: number; color?: string }) {
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
      aria-hidden="true"
    >
      <circle cx={12} cy={12} r={10} />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// ActiveTimeoutsBadge
// ---------------------------------------------------------------------------

/**
 * ActiveTimeoutsBadge -- Displays timeout status on member profiles.
 *
 * @remarks
 * Renders nothing when `active` is false. Uses warning colors for mute
 * timeouts and danger colors for restrict timeouts.
 */
export const ActiveTimeoutsBadge = forwardRef<HTMLDivElement, ActiveTimeoutsBadgeProps>(
  function ActiveTimeoutsBadge(
    {
      active,
      type = 'mute',
      expiresAt,
      reason,
      size = 'sm',
      showTooltip = true,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    // -----------------------------------------------------------------------
    // Colors
    // -----------------------------------------------------------------------
    const tcColors = useMemo(
      () => resolveActiveTimeoutsBadgeColors(theme),
      [theme],
    );

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------
    const badgeStyle = useMemo(
      () => buildBadgeStyle(theme, tcColors, type, size),
      [theme, tcColors, type, size],
    );

    const iconStyle = useMemo(() => buildIconStyle(size), [size]);

    const tooltipContainerStyle = useMemo(
      () => buildTooltipContainerStyle(theme, tcColors),
      [theme, tcColors],
    );

    const tooltipLabelStyle = useMemo(
      () => buildTooltipLabelStyle(theme, tcColors),
      [theme, tcColors],
    );

    const tooltipDetailStyle = useMemo(
      () => buildTooltipDetailStyle(theme, tcColors),
      [theme, tcColors],
    );

    // -----------------------------------------------------------------------
    // Early return
    // -----------------------------------------------------------------------
    if (!active) return null;

    const label = type === 'mute' ? 'Muted' : 'Restricted';
    const hasTooltipContent = showTooltip && (reason || expiresAt);

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
      <div
        ref={ref}
        className={className}
        style={{ ...badgeStyle, ...userStyle } as React.CSSProperties}
        role="status"
        aria-label={`${label}${expiresAt ? ` until ${expiresAt}` : ''}`}
        {...rest}
      >
        <span style={iconStyle as React.CSSProperties}>
          <ClockIcon
            size={iconStyle.width as number}
            color={type === 'mute' ? tcColors.muteText : tcColors.restrictText}
          />
        </span>
        <span>{label}</span>

        {/* Tooltip rendered as a title attribute for simplicity;
            more advanced tooltip behavior can be layered via composition. */}
        {hasTooltipContent && (
          <div
            data-testid="timeout-tooltip"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              zIndex: 50,
              display: 'none',
              ...tooltipContainerStyle,
            } as React.CSSProperties}
          >
            <p style={tooltipLabelStyle as React.CSSProperties}>{label}</p>
            {reason && (
              <p style={tooltipDetailStyle as React.CSSProperties}>
                Reason: {reason}
              </p>
            )}
            {expiresAt && (
              <p style={tooltipDetailStyle as React.CSSProperties}>
                Expires: {expiresAt}
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
);

ActiveTimeoutsBadge.displayName = 'ActiveTimeoutsBadge';
