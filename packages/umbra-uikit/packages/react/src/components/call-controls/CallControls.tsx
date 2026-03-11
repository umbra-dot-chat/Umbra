/**
 * @module CallControls
 * @description A row of circular control buttons for audio/video calls.
 */
import React, { forwardRef, useMemo, useCallback } from 'react';
import type { CallControlsProps } from '@coexist/wisp-core/types/CallControls.types';
import {
  resolveCallControlsColors,
  buildCallControlsContainerStyle,
  buildCallControlButtonStyle,
  buildCallControlItemStyle,
  buildCallControlLabelStyle,
} from '@coexist/wisp-core/styles/CallControls.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function MicIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1={12} y1={19} x2={12} y2={23} />
      <line x1={8} y1={23} x2={16} y2={23} />
    </svg>
  );
}

function MicOffIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1={1} y1={1} x2={23} y2={23} />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .67-.08 1.32-.22 1.94" />
      <line x1={12} y1={19} x2={12} y2={23} />
      <line x1={8} y1={23} x2={16} y2={23} />
    </svg>
  );
}

function CameraIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x={1} y={5} width={15} height={14} rx={2} ry={2} />
    </svg>
  );
}

function CameraOffIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1={1} y1={1} x2={23} y2={23} />
      <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" />
    </svg>
  );
}

function MonitorIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x={2} y={3} width={20} height={14} rx={2} ry={2} />
      <line x1={8} y1={21} x2={16} y2={21} />
      <line x1={12} y1={17} x2={12} y2={21} />
    </svg>
  );
}

function SpeakerIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function SpeakerOffIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <line x1={23} y1={9} x2={17} y2={15} />
      <line x1={17} y1={9} x2={23} y2={15} />
    </svg>
  );
}

function PhoneOffIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <line x1={23} y1={1} x2={1} y2={23} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// CallControls
// ---------------------------------------------------------------------------

/**
 * CallControls -- A row of circular control buttons for audio/video calls.
 *
 * @remarks
 * Displays mute, video, screen share, speaker, and end call buttons in a
 * horizontal row. Supports horizontal and compact layouts. Active toggles
 * show filled backgrounds. The end call button is always red.
 *
 * @example
 * ```tsx
 * <CallControls
 *   isMuted={false}
 *   isVideoOff={false}
 *   isScreenSharing={false}
 *   isSpeakerOn={true}
 *   onToggleMute={() => toggleMute()}
 *   onToggleVideo={() => toggleVideo()}
 *   onToggleScreenShare={() => toggleScreen()}
 *   onToggleSpeaker={() => toggleSpeaker()}
 *   onEndCall={() => endCall()}
 *   callType="video"
 * />
 * ```
 */
export const CallControls = forwardRef<HTMLDivElement, CallControlsProps>(
  function CallControls(
    {
      isMuted,
      isVideoOff,
      isScreenSharing,
      isSpeakerOn,
      onToggleMute,
      onToggleVideo,
      onToggleScreenShare,
      onToggleSpeaker,
      onEndCall,
      callType,
      layout = 'horizontal',
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveCallControlsColors(theme),
      [theme],
    );

    const isCompact = layout === 'compact';
    const iconSize = isCompact ? 18 : 20;

    // -- Handlers -----------------------------------------------------------

    const handleToggleMute = useCallback(() => {
      onToggleMute();
    }, [onToggleMute]);

    const handleToggleVideo = useCallback(() => {
      onToggleVideo();
    }, [onToggleVideo]);

    const handleToggleScreenShare = useCallback(() => {
      onToggleScreenShare();
    }, [onToggleScreenShare]);

    const handleToggleSpeaker = useCallback(() => {
      onToggleSpeaker();
    }, [onToggleSpeaker]);

    const handleEndCall = useCallback(() => {
      onEndCall();
    }, [onEndCall]);

    // -- Styles -------------------------------------------------------------

    const containerStyle = useMemo(
      () => {
        const base = buildCallControlsContainerStyle(colors, theme);
        if (isCompact) {
          return { ...base, gap: theme.spacing.sm };
        }
        return base;
      },
      [colors, theme, isCompact],
    );

    const defaultButtonStyle = useMemo(
      () => {
        const base = buildCallControlButtonStyle(colors, theme, 'default');
        if (isCompact) {
          return { ...base, width: 40, height: 40 };
        }
        return base;
      },
      [colors, theme, isCompact],
    );

    const activeButtonStyle = useMemo(
      () => {
        const base = buildCallControlButtonStyle(colors, theme, 'active');
        if (isCompact) {
          return { ...base, width: 40, height: 40 };
        }
        return base;
      },
      [colors, theme, isCompact],
    );

    const dangerButtonStyle = useMemo(
      () => {
        const base = buildCallControlButtonStyle(colors, theme, 'danger');
        if (isCompact) {
          return { ...base, width: 40, height: 40 };
        }
        return base;
      },
      [colors, theme, isCompact],
    );

    const itemStyle = useMemo(
      () => buildCallControlItemStyle(theme),
      [theme],
    );

    const labelStyle = useMemo(
      () => buildCallControlLabelStyle(colors, theme),
      [colors, theme],
    );

    return (
      <div
        ref={ref}
        role="toolbar"
        aria-label="Call controls"
        className={className}
        style={{ ...containerStyle, ...userStyle } as React.CSSProperties}
        {...rest}
      >
        {/* Mute button */}
        <div style={itemStyle as React.CSSProperties}>
          <button
            type="button"
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            aria-pressed={isMuted}
            style={(isMuted ? activeButtonStyle : defaultButtonStyle) as React.CSSProperties}
            onClick={handleToggleMute}
          >
            {isMuted ? (
              <MicOffIcon size={iconSize} color={colors.buttonIconActive} />
            ) : (
              <MicIcon size={iconSize} color={colors.buttonIcon} />
            )}
          </button>
          {!isCompact && (
            <span style={labelStyle as React.CSSProperties}>
              {isMuted ? 'Unmute' : 'Mute'}
            </span>
          )}
        </div>

        {/* Video button (only for video calls) */}
        {callType === 'video' && (
          <div style={itemStyle as React.CSSProperties}>
            <button
              type="button"
              aria-label={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
              aria-pressed={isVideoOff}
              style={(isVideoOff ? activeButtonStyle : defaultButtonStyle) as React.CSSProperties}
              onClick={handleToggleVideo}
            >
              {isVideoOff ? (
                <CameraOffIcon size={iconSize} color={colors.buttonIconActive} />
              ) : (
                <CameraIcon size={iconSize} color={colors.buttonIcon} />
              )}
            </button>
            {!isCompact && (
              <span style={labelStyle as React.CSSProperties}>
                {isVideoOff ? 'Start Video' : 'Stop Video'}
              </span>
            )}
          </div>
        )}

        {/* Screen share button */}
        <div style={itemStyle as React.CSSProperties}>
          <button
            type="button"
            aria-label={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
            aria-pressed={isScreenSharing}
            style={(isScreenSharing ? activeButtonStyle : defaultButtonStyle) as React.CSSProperties}
            onClick={handleToggleScreenShare}
          >
            <MonitorIcon
              size={iconSize}
              color={isScreenSharing ? colors.buttonIconActive : colors.buttonIcon}
            />
          </button>
          {!isCompact && (
            <span style={labelStyle as React.CSSProperties}>
              {isScreenSharing ? 'Stop Share' : 'Share'}
            </span>
          )}
        </div>

        {/* Speaker button */}
        <div style={itemStyle as React.CSSProperties}>
          <button
            type="button"
            aria-label={isSpeakerOn ? 'Turn off speaker' : 'Turn on speaker'}
            aria-pressed={!isSpeakerOn}
            style={(!isSpeakerOn ? activeButtonStyle : defaultButtonStyle) as React.CSSProperties}
            onClick={handleToggleSpeaker}
          >
            {isSpeakerOn ? (
              <SpeakerIcon size={iconSize} color={colors.buttonIcon} />
            ) : (
              <SpeakerOffIcon size={iconSize} color={colors.buttonIconActive} />
            )}
          </button>
          {!isCompact && (
            <span style={labelStyle as React.CSSProperties}>
              {isSpeakerOn ? 'Speaker' : 'Speaker Off'}
            </span>
          )}
        </div>

        {/* End call button */}
        <div style={itemStyle as React.CSSProperties}>
          <button
            type="button"
            aria-label="End call"
            style={dangerButtonStyle as React.CSSProperties}
            onClick={handleEndCall}
          >
            <PhoneOffIcon size={iconSize} color={colors.buttonIconDanger} />
          </button>
          {!isCompact && (
            <span style={{ ...labelStyle, color: colors.buttonBgDanger } as React.CSSProperties}>
              End
            </span>
          )}
        </div>
      </div>
    );
  },
);

CallControls.displayName = 'CallControls';
