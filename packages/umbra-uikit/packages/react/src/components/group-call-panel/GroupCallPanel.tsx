/**
 * GroupCallPanel — Unified voice + video call UI for the web.
 *
 * Adaptive layout that handles:
 *  • Voice-only calls → centered avatar cards with speaking indicators
 *  • Video calls → responsive CSS grid with auto column scaling
 *  • Spotlight mode → one large tile + horizontal strip
 *  • Auto mode → picks the best layout based on camera/screen-share state
 *
 * Inspired by Discord, Google Meet, Telegram, and WhatsApp call UIs.
 */

import React, { forwardRef, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import type {
  GroupCallPanelProps,
  GroupCallParticipant,
  GroupCallLayout,
} from '@coexist/wisp-core/types/GroupCallPanel.types';
import {
  resolveGroupCallPanelColors,
  resolveVoiceCardSize,
} from '@coexist/wisp-core/styles/GroupCallPanel.styles';
import type { VoiceCardSize } from '@coexist/wisp-core/styles/GroupCallPanel.styles';
import { resolveGridColumns } from '@coexist/wisp-core/styles/VideoGrid.styles';
import { useTheme } from '../../providers';

// ═══════════════════════════════════════════════════════════════════════════
// SVG Icons (inline, no deps)
// ═══════════════════════════════════════════════════════════════════════════

function MicIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1={12} y1={19} x2={12} y2={23} />
      <line x1={8} y1={23} x2={16} y2={23} />
    </svg>
  );
}

function MicOffIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1={1} y1={1} x2={23} y2={23} />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .67-.08 1.32-.22 1.94" />
      <line x1={12} y1={19} x2={12} y2={23} />
      <line x1={8} y1={23} x2={16} y2={23} />
    </svg>
  );
}

function CameraIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x={1} y={5} width={15} height={14} rx={2} ry={2} />
    </svg>
  );
}

function CameraOffIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1={1} y1={1} x2={23} y2={23} />
      <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" />
    </svg>
  );
}

function MonitorIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x={2} y={3} width={20} height={14} rx={2} ry={2} />
      <line x1={8} y1={21} x2={16} y2={21} />
      <line x1={12} y1={17} x2={12} y2={21} />
    </svg>
  );
}

function HeadphonesOffIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.01 9.01 0 0 0-7.54 4.09" />
      <path d="M3 12v3a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2H3" />
      <path d="M21 12v3a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h3" />
      <line x1={1} y1={1} x2={23} y2={23} />
    </svg>
  );
}

function PhoneOffIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <line x1={23} y1={1} x2={1} y2={23} />
    </svg>
  );
}

function UsersIcon({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx={9} cy={7} r={4} />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function AudioWaveIcon({ size = 14, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10v4" />
      <path d="M6 6v12" />
      <path d="M10 3v18" />
      <path d="M14 8v8" />
      <path d="M18 5v14" />
      <path d="M22 10v4" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Inline CallTimer (no dependency on primitives)
// ═══════════════════════════════════════════════════════════════════════════

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}

function CallTimer({ startedAt, color }: { startedAt: number; color: string }) {
  const [elapsed, setElapsed] = useState(() => Date.now() - startedAt);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setElapsed(Date.now() - startedAt);
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startedAt]);

  return (
    <span style={{ fontSize: 13, color, fontVariantNumeric: 'tabular-nums' }}>
      {formatDuration(elapsed)}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Layout resolution
// ═══════════════════════════════════════════════════════════════════════════

function resolveAutoLayout(
  participants: GroupCallParticipant[],
  screenShareDid: string | null | undefined,
  callType: 'audio' | 'video',
): GroupCallLayout {
  if (screenShareDid) return 'spotlight';
  if (callType === 'audio') return 'voice';
  const anyVideoOn = participants.some((p) => !p.isCameraOff && p.stream);
  if (!anyVideoOn) return 'voice';
  return 'grid';
}

// ═══════════════════════════════════════════════════════════════════════════
// GroupCallPanel
// ═══════════════════════════════════════════════════════════════════════════

export const GroupCallPanel = forwardRef<HTMLDivElement, GroupCallPanelProps>(
  function GroupCallPanel(
    {
      participants,
      localDid,
      localStream,
      screenShareStream,
      screenShareDid,
      groupName,
      callType = 'video',
      activeSpeakerDid,
      connectedAt,
      isConnecting = false,
      subtitle,
      isMuted,
      isCameraOff,
      isScreenSharing,
      isDeafened = false,
      layout = 'auto',
      viewMode = 'equal',
      maxVisible = 25,
      onToggleMute,
      onToggleCamera,
      onEndCall,
      onSwitchCamera,
      onToggleScreenShare,
      onToggleDeafen,
      onParticipantClick,
      onLayoutChange,
      style: userStyle,
      className,
      hideHeader = false,
      hideNames = false,
      showTimer = true,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const colors = useMemo(() => resolveGroupCallPanelColors(theme), [theme]);

    const [focusedDid, setFocusedDid] = useState<string | null>(null);

    const effectiveLayout = useMemo<GroupCallLayout>(() => {
      if (layout === 'auto') {
        return resolveAutoLayout(participants, screenShareDid, callType);
      }
      return layout;
    }, [layout, participants, screenShareDid, callType]);

    const visibleParticipants = useMemo(
      () => participants.slice(0, maxVisible),
      [participants, maxVisible],
    );
    const overflowCount = participants.length - maxVisible;

    const handleParticipantClick = useCallback(
      (did: string) => {
        onParticipantClick?.(did);
        setFocusedDid((prev) => (prev === did ? null : did));
      },
      [onParticipantClick],
    );

    // ─── Voice card (4:3 landscape, adaptive size) ────────────────────
    const cardSize: VoiceCardSize = useMemo(
      () => resolveVoiceCardSize(visibleParticipants.length),
      [visibleParticipants.length],
    );

    const renderVoiceCard = useCallback(
      (p: GroupCallParticipant) => {
        const isSpeaking = p.isSpeaking ?? false;
        const initial = (p.displayName || '?').charAt(0).toUpperCase();
        const avatarFontSize = Math.round(cardSize.avatarSize * 0.42);

        return (
          <button
            key={p.did}
            onClick={() => handleParticipantClick(p.did)}
            aria-label={p.displayName}
            style={{
              width: cardSize.cardWidth,
              height: cardSize.cardHeight,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: cardSize.borderRadius,
              backgroundColor: colors.voiceCardBackground,
              border: isSpeaking ? `2px solid ${colors.speakingColor}` : `1px solid ${colors.tileBorder}`,
              cursor: 'pointer',
              outline: 'none',
              position: 'relative',
              overflow: 'hidden',
              padding: 0,
            }}
          >
            {/* Status pill (top-right corner) */}
            {(p.isMuted || p.isDeafened) && (
              <div
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  display: 'flex',
                  gap: 3,
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  borderRadius: 8,
                  padding: '3px 5px',
                  alignItems: 'center',
                }}
              >
                {p.isMuted && <MicOffIcon size={cardSize.statusIconSize} color="#fff" />}
                {p.isDeafened && <HeadphonesOffIcon size={cardSize.statusIconSize} color="#fff" />}
              </div>
            )}

            {/* Avatar circle */}
            <div
              style={{
                width: cardSize.avatarSize,
                height: cardSize.avatarSize,
                borderRadius: '50%',
                backgroundColor: colors.tileBackground,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: avatarFontSize,
                fontWeight: 600,
                color: colors.textSecondary,
              }}
            >
              {initial}
            </div>

            {/* Name row (bottom) — icon prepended before name when speaking */}
            {!hideNames && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 6,
                  left: 6,
                  right: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                {isSpeaking && <AudioWaveIcon size={cardSize.fontSize - 1} color={colors.speakingColor} />}
                <span
                  style={{
                    fontSize: cardSize.fontSize,
                    fontWeight: 500,
                    color: isSpeaking ? colors.speakingColor : colors.textPrimary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.displayName}
                </span>
              </div>
            )}
          </button>
        );
      },
      [cardSize, colors, handleParticipantClick, hideNames],
    );

    // ─── Video tile ─────────────────────────────────────────────────
    const renderVideoTile = useCallback(
      (p: GroupCallParticipant, tileStyle?: React.CSSProperties) => {
        const isSpeaking = p.isSpeaking ?? false;
        const showFallback = p.isCameraOff || !p.stream;
        const initial = (p.displayName || '?').charAt(0).toUpperCase();

        return (
          <div
            key={p.did}
            onClick={() => handleParticipantClick(p.did)}
            role="button"
            aria-label={p.displayName}
            tabIndex={0}
            style={{
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              backgroundColor: colors.tileBackground,
              borderRadius: 12,
              border: isSpeaking ? `2px solid ${colors.speakingColor}` : 'none',
              cursor: 'pointer',
              boxSizing: 'border-box',
              transition: 'border-color 150ms ease',
              ...tileStyle,
            }}
          >
            {/* Camera-off fallback */}
            {showFallback && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: colors.controlButtonBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isSpeaking ? `2px solid ${colors.speakingColor}` : 'none',
                    fontSize: 20,
                    fontWeight: 600,
                    color: colors.textSecondary,
                  }}
                >
                  {initial}
                </div>
              </div>
            )}

            {/* Status indicators (top-right) */}
            <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4 }}>
              {p.isMuted && (
                <div style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MicOffIcon size={11} color="#fff" />
                </div>
              )}
              {p.isDeafened && (
                <div style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HeadphonesOffIcon size={11} color="#fff" />
                </div>
              )}
              {p.isScreenSharing && (
                <div style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MonitorIcon size={11} color="#fff" />
                </div>
              )}
            </div>

            {/* Name label (bottom-left) */}
            {!hideNames && (
              <div style={{ position: 'absolute', bottom: 6, left: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                {isSpeaking && <AudioWaveIcon size={11} color={colors.speakingColor} />}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#fff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.displayName}
                </span>
              </div>
            )}
          </div>
        );
      },
      [colors, handleParticipantClick, hideNames],
    );

    // ═════════════════════════════════════════════════════════════════
    // Main content area
    // ═════════════════════════════════════════════════════════════════

    const renderContent = () => {
      // Connecting state
      if (isConnecting) {
        return (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${colors.textPrimary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 15, color: colors.textSecondary }}>Connecting...</span>
          </div>
        );
      }

      // Voice layout
      if (effectiveLayout === 'voice') {
        return (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignContent: 'center',
              padding: 20,
              gap: cardSize.gap,
              overflowY: 'auto',
            }}
          >
            {visibleParticipants.map(renderVoiceCard)}
            {overflowCount > 0 && (
              <div
                style={{
                  width: cardSize.cardWidth,
                  height: cardSize.cardHeight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: cardSize.borderRadius,
                  backgroundColor: colors.voiceCardBackground,
                  border: `1px solid ${colors.tileBorder}`,
                  fontSize: 18,
                  fontWeight: 600,
                  color: colors.textSecondary,
                }}
              >
                +{overflowCount}
              </div>
            )}
          </div>
        );
      }

      // Spotlight layout
      if (effectiveLayout === 'spotlight') {
        const spotlightP =
          visibleParticipants.find((p) => p.did === (focusedDid ?? screenShareDid ?? activeSpeakerDid)) ??
          visibleParticipants[0];
        const stripPs = spotlightP
          ? visibleParticipants.filter((p) => p.did !== spotlightP.did)
          : [];

        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 4, gap: 4 }}>
            {spotlightP && (
              <div style={{ flex: 1, minHeight: 0 }}>
                {renderVideoTile(spotlightP, { width: '100%', height: '100%' })}
              </div>
            )}
            {stripPs.length > 0 && (
              <div style={{ display: 'flex', gap: 4, overflowX: 'auto', height: 108, flexShrink: 0 }}>
                {stripPs.map((p) => renderVideoTile(p, { width: 150, height: 100, flexShrink: 0 }))}
              </div>
            )}
          </div>
        );
      }

      // Grid layout
      const displayCount = overflowCount > 0 ? visibleParticipants.length + 1 : visibleParticipants.length;
      const cols = resolveGridColumns(displayCount);

      return (
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 4,
            padding: 4,
            backgroundColor: colors.contentBackground,
            borderRadius: 12,
          }}
        >
          {visibleParticipants.map((p) =>
            renderVideoTile(p, { width: '100%', aspectRatio: '16/9' }),
          )}
          {overflowCount > 0 && (
            <div
              style={{
                backgroundColor: colors.tileBackground,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 600,
                color: colors.textSecondary,
              }}
            >
              +{overflowCount}
            </div>
          )}
        </div>
      );
    };

    // ═════════════════════════════════════════════════════════════════
    // Control button helper
    // ═════════════════════════════════════════════════════════════════

    const controlBtn = (active: boolean): React.CSSProperties => ({
      width: 36,
      height: 36,
      borderRadius: 18,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      cursor: 'pointer',
      backgroundColor: active ? colors.controlButtonActiveBg : colors.controlButtonBg,
      transition: 'background-color 150ms ease',
    });

    // ═════════════════════════════════════════════════════════════════
    // Render
    // ═════════════════════════════════════════════════════════════════

    return (
      <div
        ref={ref}
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          backgroundColor: colors.background,
          overflow: 'hidden',
          ...userStyle,
        }}
      >
        {/* Header */}
        {!hideHeader && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.headerBackground,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UsersIcon size={16} color={colors.speakingColor} />
                <span style={{ fontSize: 17, fontWeight: 600, color: colors.textPrimary }}>
                  {groupName}
                </span>
                <span
                  style={{
                    backgroundColor: colors.controlButtonBg,
                    borderRadius: 10,
                    padding: '2px 8px',
                    fontSize: 13,
                    color: colors.textMuted,
                  }}
                >
                  {participants.length}
                </span>
              </div>
              {subtitle && (
                <span style={{ fontSize: 12, color: colors.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {subtitle}
                </span>
              )}
            </div>

            {showTimer && connectedAt != null && !isConnecting && (
              <CallTimer startedAt={connectedAt} color={colors.textMuted} />
            )}
          </div>
        )}

        {/* Content */}
        {renderContent()}

        {/* Control bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
            padding: '14px 20px',
          }}
        >
          {/* Mute */}
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            style={controlBtn(isMuted)}
          >
            {isMuted ? (
              <MicOffIcon size={18} color={colors.controlButtonActiveIcon} />
            ) : (
              <MicIcon size={18} color={colors.controlButtonIcon} />
            )}
          </button>

          {/* Deafen */}
          {onToggleDeafen && (
            <button
              type="button"
              onClick={onToggleDeafen}
              aria-label={isDeafened ? 'Undeafen' : 'Deafen'}
              style={controlBtn(isDeafened)}
            >
              <HeadphonesOffIcon size={18} color={isDeafened ? colors.controlButtonActiveIcon : colors.controlButtonIcon} />
            </button>
          )}

          {/* Camera */}
          {callType === 'video' && (
            <button
              type="button"
              onClick={onToggleCamera}
              aria-label={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
              style={controlBtn(isCameraOff)}
            >
              {isCameraOff ? (
                <CameraOffIcon size={18} color={colors.controlButtonActiveIcon} />
              ) : (
                <CameraIcon size={18} color={colors.controlButtonIcon} />
              )}
            </button>
          )}

          {/* Screen share */}
          {onToggleScreenShare && (
            <button
              type="button"
              onClick={onToggleScreenShare}
              aria-label={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
              style={controlBtn(isScreenSharing)}
            >
              <MonitorIcon size={18} color={isScreenSharing ? colors.controlButtonActiveIcon : colors.controlButtonIcon} />
            </button>
          )}

          {/* End call */}
          <button
            type="button"
            onClick={onEndCall}
            aria-label="End call"
            style={{
              ...controlBtn(false),
              backgroundColor: colors.endCallBg,
            }}
          >
            <PhoneOffIcon size={18} color={colors.endCallIcon} />
          </button>
        </div>
      </div>
    );
  },
);

GroupCallPanel.displayName = 'GroupCallPanel';
