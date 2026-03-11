/**
 * @module SystemMessageRenderer
 * @description Distinct visual rendering for system messages — centered, muted
 * text with horizontal lines on each side and a type-appropriate icon.
 *
 * @remarks
 * Renders system events (user joined, user left, message pinned, channel
 * updated, role updated) with a small icon, centered text, and optional
 * timestamp. Horizontal lines extend on both sides like a divider.
 *
 * @example
 * ```tsx
 * <SystemMessageRenderer type="join" content="Alice joined the channel" timestamp="2:34 PM" />
 * <SystemMessageRenderer type="pin" content="Bob pinned a message" />
 * ```
 */
import React, { forwardRef, useMemo } from 'react';
import type { SystemMessageRendererProps, SystemMessageType } from '@coexist/wisp-core/types/SystemMessageRenderer.types';
import {
  buildSystemMessageContainerStyle,
  buildSystemMessageLineStyle,
  buildSystemMessageContentStyle,
  buildSystemMessageTextStyle,
  buildSystemMessageTimestampStyle,
  resolveSystemMessageIconColor,
} from '@coexist/wisp-core/styles/SystemMessageRenderer.styles';
import { useTheme } from '../../providers';
import { UserPlus, UserMinus, Pin, Settings, Shield, Info } from 'lucide-react';

// ---------------------------------------------------------------------------
// Icon resolver
// ---------------------------------------------------------------------------

function SystemIcon({
  type,
  color,
  size,
}: {
  type: SystemMessageType;
  color: string;
  size: number;
}) {
  const props = { size, color, strokeWidth: 2 };
  switch (type) {
    case 'join':
      return <UserPlus {...props} />;
    case 'leave':
      return <UserMinus {...props} />;
    case 'pin':
      return <Pin {...props} />;
    case 'channel_update':
      return <Settings {...props} />;
    case 'role_update':
      return <Shield {...props} />;
    case 'generic':
    default:
      return <Info {...props} />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SystemMessageRenderer = forwardRef<HTMLDivElement, SystemMessageRendererProps>(
  function SystemMessageRenderer(
    {
      content,
      timestamp,
      type = 'generic',
      icon: customIcon,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;

    const containerStyle = useMemo(
      () => buildSystemMessageContainerStyle(theme),
      [theme],
    );

    const lineStyle = useMemo(
      () => buildSystemMessageLineStyle(theme),
      [theme],
    );

    const contentStyle = useMemo(
      () => buildSystemMessageContentStyle(theme),
      [theme],
    );

    const textStyle = useMemo(
      () => buildSystemMessageTextStyle(theme),
      [theme],
    );

    const timestampStyle = useMemo(
      () => buildSystemMessageTimestampStyle(theme),
      [theme],
    );

    const iconColor = useMemo(
      () => resolveSystemMessageIconColor(theme),
      [theme],
    );

    return (
      <div
        ref={ref}
        role="log"
        className={className}
        style={{ ...containerStyle, ...userStyle } as React.CSSProperties}
        {...rest}
      >
        {/* Left line */}
        <div style={lineStyle as React.CSSProperties} />

        {/* Center content */}
        <div style={contentStyle as React.CSSProperties}>
          {customIcon ?? <SystemIcon type={type} color={iconColor} size={12} />}
          <span style={textStyle as React.CSSProperties}>{content}</span>
          {timestamp && (
            <span style={timestampStyle as React.CSSProperties}>{timestamp}</span>
          )}
        </div>

        {/* Right line */}
        <div style={lineStyle as React.CSSProperties} />
      </div>
    );
  },
);

SystemMessageRenderer.displayName = 'SystemMessageRenderer';
