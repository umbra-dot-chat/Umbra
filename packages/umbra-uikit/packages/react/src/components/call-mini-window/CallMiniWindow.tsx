/**
 * @module CallMiniWindow
 * @description Small floating PiP window for active calls with participant info,
 * duration badge, and hover overlay with expand/end-call controls.
 */
import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type { CallMiniWindowProps, SnapPosition } from '@coexist/wisp-core/types/CallMiniWindow.types';
import {
  resolveCallMiniWindowColors,
  buildCallMiniWindowContainerStyle,
  buildCallMiniWindowVideoStyle,
  buildCallMiniWindowOverlayStyle,
  buildExpandButtonStyle,
  buildEndCallButtonStyle,
  buildCallMiniWindowBottomBarStyle,
  buildDurationTextStyle,
  buildMiniWindowMuteIconStyle,
} from '@coexist/wisp-core/styles/CallMiniWindow.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function ExpandIcon({ size = 16, color }: { size?: number; color?: string }) {
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
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function PhoneOffIcon({ size = 16, color }: { size?: number; color?: string }) {
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
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <line x1="23" y1="1" x2="1" y2="23" />
    </svg>
  );
}

function MicOffIcon({ size = 14, color }: { size?: number; color?: string }) {
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
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Default Avatar
// ---------------------------------------------------------------------------

function DefaultAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#333',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        fontWeight: 600,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hrs > 0
    ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
    : `${pad(mins)}:${pad(secs)}`;
}

/** Map a snap position to CSS positioning values. */
function snapPositionToStyle(
  snap: SnapPosition,
): React.CSSProperties {
  switch (snap) {
    case 'top-left':
      return { top: 16, left: 16, bottom: 'auto', right: 'auto' };
    case 'top-right':
      return { top: 16, right: 16, bottom: 'auto', left: 'auto' };
    case 'bottom-left':
      return { bottom: 16, left: 16, top: 'auto', right: 'auto' };
    case 'bottom-right':
    default:
      return { bottom: 16, right: 16, top: 'auto', left: 'auto' };
  }
}

// ---------------------------------------------------------------------------
// CallMiniWindow
// ---------------------------------------------------------------------------

/**
 * CallMiniWindow -- Small floating PiP window for active calls.
 *
 * @remarks
 * Displays a compact picture-in-picture view of the current call
 * with the focused participant's avatar, a duration badge, and
 * a hover overlay containing expand and end-call controls.
 * Can be snapped to any corner via the `snapPosition` prop.
 *
 * @example
 * ```tsx
 * <CallMiniWindow
 *   participant={{ id: '1', name: 'Alice', isMuted: false }}
 *   localParticipant={{ id: '2', name: 'You', isMuted: true }}
 *   callType="video"
 *   duration={125}
 *   onExpand={() => navigateToCall()}
 *   onEndCall={() => endCall()}
 * />
 * ```
 */
export const CallMiniWindow = forwardRef<HTMLDivElement, CallMiniWindowProps>(
  function CallMiniWindow(
    {
      participant,
      localParticipant,
      callType,
      duration,
      onExpand,
      onEndCall,
      snapPosition = 'bottom-right',
      onSnapChange,
      draggable = true,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [hovered, setHovered] = useState(false);

    // ----- Colors -----
    const colors = useMemo(
      () => resolveCallMiniWindowColors(theme),
      [theme],
    );

    // ----- Styles -----
    const containerStyle = useMemo(
      () => buildCallMiniWindowContainerStyle(colors, theme),
      [colors, theme],
    );

    const videoStyle = useMemo(
      () => buildCallMiniWindowVideoStyle(colors, theme),
      [colors, theme],
    );

    const overlayStyle = useMemo(
      () => buildCallMiniWindowOverlayStyle(colors, theme),
      [colors, theme],
    );

    const expandBtnStyle = useMemo(
      () => buildExpandButtonStyle(colors, theme),
      [colors, theme],
    );

    const endCallBtnStyle = useMemo(
      () => buildEndCallButtonStyle(colors, theme),
      [colors, theme],
    );

    const bottomBarStyle = useMemo(
      () => buildCallMiniWindowBottomBarStyle(theme),
      [theme],
    );

    const durationTextStyle = useMemo(
      () => buildDurationTextStyle(colors, theme),
      [colors, theme],
    );

    const muteIconStyle = useMemo(
      () => buildMiniWindowMuteIconStyle(colors, theme),
      [colors, theme],
    );

    const positionStyle = useMemo(
      () => snapPositionToStyle(snapPosition),
      [snapPosition],
    );

    // ----- Handlers -----
    const handleMouseEnter = useCallback(() => setHovered(true), []);
    const handleMouseLeave = useCallback(() => setHovered(false), []);

    const handleExpandClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onExpand();
      },
      [onExpand],
    );

    const handleEndCallClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onEndCall();
      },
      [onEndCall],
    );

    return (
      <div
        ref={ref}
        role="region"
        aria-label="Active call"
        className={className}
        style={{ ...containerStyle, ...positionStyle, ...userStyle }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...rest}
      >
        {/* Video / avatar area */}
        <div style={videoStyle}>
          {participant.avatar || <DefaultAvatar name={participant.name} />}

          {/* Hover overlay with controls */}
          {hovered && (
            <div style={overlayStyle}>
              <button
                type="button"
                aria-label="Expand call"
                style={expandBtnStyle}
                onClick={handleExpandClick}
              >
                <ExpandIcon size={16} color={colors.expandButtonIcon} />
              </button>
              <button
                type="button"
                aria-label="End call"
                style={endCallBtnStyle}
                onClick={handleEndCallClick}
              >
                <PhoneOffIcon size={16} color={colors.endCallIcon} />
              </button>
            </div>
          )}
        </div>

        {/* Bottom bar: duration + mute indicator */}
        <div style={bottomBarStyle}>
          <span style={durationTextStyle}>
            {duration != null ? formatDuration(duration) : '--:--'}
          </span>
          {participant.isMuted && (
            <span style={muteIconStyle} aria-label={`${participant.name} is muted`}>
              <MicOffIcon size={14} color={colors.muteIcon} />
            </span>
          )}
        </div>
      </div>
    );
  },
);

CallMiniWindow.displayName = 'CallMiniWindow';
