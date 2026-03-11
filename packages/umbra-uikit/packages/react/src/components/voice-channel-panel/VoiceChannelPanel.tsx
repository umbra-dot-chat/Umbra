/**
 * @module VoiceChannelPanel
 * @description Bottom bar panel showing voice channel connection status,
 * participant avatars, and quick controls (mute/deafen/disconnect).
 */
import React, { forwardRef, useMemo, useCallback } from 'react';
import type { VoiceChannelPanelProps } from '@coexist/wisp-core/types/VoiceChannelPanel.types';
import type { CallParticipant } from '@coexist/wisp-core/types/CallControls.types';
import {
  resolveVoiceChannelPanelColors,
  buildVoiceChannelPanelContainerStyle,
  buildVoiceChannelHeaderStyle,
  buildChannelNameStyle,
  buildStatusTextStyle,
  buildStatusDotStyle,
  buildParticipantListStyle,
  buildParticipantItemStyle,
  buildParticipantNameStyle,
  buildVoiceChannelButtonStyle,
  buildVoiceChannelControlsStyle,
  buildDisconnectButtonStyle,
} from '@coexist/wisp-core/styles/VoiceChannelPanel.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function SpeakerIcon({ size = 16, color }: { size?: number; color?: string }) {
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
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function MicIcon({ size = 16, color }: { size?: number; color?: string }) {
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
      <rect x="9" y="1" width="6" height="12" rx="3" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function MicOffIcon({ size = 16, color }: { size?: number; color?: string }) {
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

function HeadphonesIcon({ size = 16, color }: { size?: number; color?: string }) {
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
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

function HeadphonesOffIcon({ size = 16, color }: { size?: number; color?: string }) {
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
      <path d="M3 18v-6a9 9 0 0 1 14.77-6.9" />
      <path d="M21 12v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
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
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <line x1="23" y1="1" x2="1" y2="23" />
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
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#333',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Participant mute indicator
// ---------------------------------------------------------------------------

function ParticipantMuteIcon({ size = 12, color }: { size?: number; color?: string }) {
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
    </svg>
  );
}

// ---------------------------------------------------------------------------
// VoiceChannelPanel
// ---------------------------------------------------------------------------

/**
 * VoiceChannelPanel -- Bottom bar showing voice channel connection status,
 * participant avatars, and quick controls (mute/deafen/disconnect).
 *
 * @remarks
 * Displays the current voice channel name, a connected status indicator,
 * a list of participants with avatars and mute state, and control buttons
 * for toggling mute, deafen, and disconnecting from the channel.
 *
 * @example
 * ```tsx
 * <VoiceChannelPanel
 *   channelName="General"
 *   communityName="My Server"
 *   participants={participants}
 *   localParticipant={localUser}
 *   isConnected={true}
 *   isMuted={false}
 *   isDeafened={false}
 *   onToggleMute={() => toggleMute()}
 *   onToggleDeafen={() => toggleDeafen()}
 *   onLeave={() => disconnect()}
 * />
 * ```
 */
export const VoiceChannelPanel = forwardRef<HTMLDivElement, VoiceChannelPanelProps>(
  function VoiceChannelPanel(
    {
      channelName,
      communityName,
      participants,
      localParticipant,
      isConnected,
      onJoin,
      onLeave,
      onToggleMute,
      onToggleDeafen,
      isMuted = false,
      isDeafened = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    // ----- Colors -----
    const colors = useMemo(
      () => resolveVoiceChannelPanelColors(theme),
      [theme],
    );

    // ----- Styles -----
    const containerStyle = useMemo(
      () => buildVoiceChannelPanelContainerStyle(colors, theme),
      [colors, theme],
    );

    const headerStyle = useMemo(
      () => buildVoiceChannelHeaderStyle(theme),
      [theme],
    );

    const channelNameStyle = useMemo(
      () => buildChannelNameStyle(colors, theme),
      [colors, theme],
    );

    const statusTextStyle = useMemo(
      () => buildStatusTextStyle(colors, theme),
      [colors, theme],
    );

    const statusDotStyle = useMemo(
      () => buildStatusDotStyle(colors, theme),
      [colors, theme],
    );

    const participantListStyle = useMemo(
      () => buildParticipantListStyle(theme),
      [theme],
    );

    const participantItemStyle = useMemo(
      () => buildParticipantItemStyle(theme),
      [theme],
    );

    const participantNameStyle = useMemo(
      () => buildParticipantNameStyle(colors, theme),
      [colors, theme],
    );

    const buttonStyle = useMemo(
      () => buildVoiceChannelButtonStyle(colors, theme),
      [colors, theme],
    );

    const controlsStyle = useMemo(
      () => buildVoiceChannelControlsStyle(theme),
      [theme],
    );

    const disconnectStyle = useMemo(
      () => buildDisconnectButtonStyle(colors, theme),
      [colors, theme],
    );

    // ----- Active button style (muted/deafened) -----
    const activeButtonStyle = useMemo<React.CSSProperties>(
      () => ({
        ...buttonStyle,
        backgroundColor: colors.buttonHoverBg,
        color: colors.buttonActiveIcon,
      }),
      [buttonStyle, colors.buttonHoverBg, colors.buttonActiveIcon],
    );

    // ----- Handlers -----
    const handleToggleMute = useCallback(() => {
      onToggleMute?.();
    }, [onToggleMute]);

    const handleToggleDeafen = useCallback(() => {
      onToggleDeafen?.();
    }, [onToggleDeafen]);

    const handleLeave = useCallback(() => {
      onLeave?.();
    }, [onLeave]);

    const handleJoin = useCallback(() => {
      onJoin?.();
    }, [onJoin]);

    // ----- Render participant row -----
    const renderParticipant = useCallback(
      (participant: CallParticipant) => (
        <div key={participant.id} style={participantItemStyle}>
          {/* Avatar */}
          {participant.avatar || <DefaultAvatar name={participant.name} />}

          {/* Name */}
          <span style={participantNameStyle}>{participant.name}</span>

          {/* Mute indicator */}
          {participant.isMuted && (
            <ParticipantMuteIcon
              size={12}
              color={colors.buttonIcon}
            />
          )}
        </div>
      ),
      [participantItemStyle, participantNameStyle, colors.buttonIcon],
    );

    return (
      <div
        ref={ref}
        role="region"
        aria-label={`Voice channel: ${channelName}`}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        {/* Header: channel name + status */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <SpeakerIcon size={16} color={colors.channelName} />
            <span style={channelNameStyle}>{channelName}</span>
          </div>

          {isConnected ? (
            <span style={statusTextStyle}>
              <span style={statusDotStyle} />
              Voice Connected
            </span>
          ) : (
            <button
              type="button"
              style={buttonStyle}
              onClick={handleJoin}
              aria-label="Join voice channel"
            >
              <SpeakerIcon size={14} />
            </button>
          )}
        </div>

        {/* Community name */}
        {communityName && isConnected && (
          <span
            style={{
              ...participantNameStyle,
              paddingLeft: theme.spacing.sm,
              paddingBottom: theme.spacing['2xs'],
            }}
          >
            {communityName}
          </span>
        )}

        {/* Participant list */}
        {isConnected && participants.length > 0 && (
          <div style={participantListStyle}>
            {participants.map((p) => renderParticipant(p))}
          </div>
        )}

        {/* Bottom controls */}
        {isConnected && (
          <div style={controlsStyle}>
            {/* Left: control info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} />

            {/* Right: mute / deafen / disconnect */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Mute toggle */}
              <button
                type="button"
                style={isMuted ? activeButtonStyle : buttonStyle}
                onClick={handleToggleMute}
                aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                aria-pressed={isMuted}
              >
                {isMuted ? (
                  <MicOffIcon size={16} />
                ) : (
                  <MicIcon size={16} />
                )}
              </button>

              {/* Deafen toggle */}
              <button
                type="button"
                style={isDeafened ? activeButtonStyle : buttonStyle}
                onClick={handleToggleDeafen}
                aria-label={isDeafened ? 'Undeafen' : 'Deafen'}
                aria-pressed={isDeafened}
              >
                {isDeafened ? (
                  <HeadphonesOffIcon size={16} />
                ) : (
                  <HeadphonesIcon size={16} />
                )}
              </button>

              {/* Disconnect */}
              <button
                type="button"
                style={disconnectStyle}
                onClick={handleLeave}
                aria-label="Disconnect from voice channel"
              >
                <PhoneOffIcon size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);

VoiceChannelPanel.displayName = 'VoiceChannelPanel';
