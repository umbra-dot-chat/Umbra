/**
 * @module OnlineStatusIndicator
 * @description Standalone indicator dot for online/offline/idle/dnd status.
 */
import React, { forwardRef, useMemo, useEffect } from 'react';
import type { OnlineStatusIndicatorProps } from '@coexist/wisp-core/types/OnlineStatusIndicator.types';
import { onlineStatusIndicatorSizeMap } from '@coexist/wisp-core/types/OnlineStatusIndicator.types';
import {
  resolveOnlineStatusColor,
  resolveOnlineStatusLabel,
  buildOnlineStatusContainerStyle,
  buildOnlineStatusDotStyle,
  buildOnlineStatusLabelStyle,
  ensureOnlineStatusKeyframes,
} from '@coexist/wisp-core/styles/OnlineStatusIndicator.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * OnlineStatusIndicator -- A colored dot indicating user presence.
 *
 * @remarks
 * Green = online, amber = idle, red = dnd, gray = offline/invisible.
 * Supports optional pulse animation and text label.
 *
 * @example
 * ```tsx
 * <OnlineStatusIndicator status="online" pulse />
 * <OnlineStatusIndicator status="idle" showLabel size="md" />
 * ```
 */
export const OnlineStatusIndicator = forwardRef<HTMLDivElement, OnlineStatusIndicatorProps>(
  function OnlineStatusIndicator(
    {
      status,
      size = 'sm',
      showLabel = false,
      pulse = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const sizeConfig = useMemo(
      () => onlineStatusIndicatorSizeMap[size],
      [size],
    );

    const dotColor = useMemo(
      () => resolveOnlineStatusColor(status, theme),
      [status, theme],
    );

    const label = useMemo(
      () => resolveOnlineStatusLabel(status),
      [status],
    );

    const shouldPulse = pulse && status === 'online';

    useEffect(() => {
      if (shouldPulse) ensureOnlineStatusKeyframes();
    }, [shouldPulse]);

    const containerStyle = useMemo(
      () => buildOnlineStatusContainerStyle(sizeConfig),
      [sizeConfig],
    );

    const dotStyle = useMemo(
      () => buildOnlineStatusDotStyle(sizeConfig, dotColor, shouldPulse, theme),
      [sizeConfig, dotColor, shouldPulse, theme],
    );

    const labelStyle = useMemo(
      () => buildOnlineStatusLabelStyle(sizeConfig, theme),
      [sizeConfig, theme],
    );

    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        <div style={dotStyle} aria-hidden="true" />
        {showLabel && <span style={labelStyle}>{label}</span>}
      </div>
    );
  },
);

OnlineStatusIndicator.displayName = 'OnlineStatusIndicator';
