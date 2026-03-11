/**
 * GroupCallPanel — Unified voice + video call UI.
 *
 * Adaptive layout that handles:
 *  • Voice-only calls → centered avatar cards with speaking indicators
 *  • Video calls → responsive grid with auto column scaling
 *  • Spotlight mode → one large tile + horizontal strip
 *  • Auto mode → picks the best layout based on camera/screen-share state
 *
 * Inspired by Discord, Google Meet, Telegram, and WhatsApp call UIs.
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { Text } from '../../primitives';
import { useTheme } from '../../providers';
import { CallTimer } from '../../primitives/call-timer/CallTimer';
import Svg, { Path, Line, Circle, Rect, Polyline } from 'react-native-svg';
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

// ═══════════════════════════════════════════════════════════════════════════
// SVG Icons
// ═══════════════════════════════════════════════════════════════════════════

function MicIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <Line x1={12} y1={19} x2={12} y2={23} />
      <Line x1={8} y1={23} x2={16} y2={23} />
    </Svg>
  );
}

function MicOffIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={1} y1={1} x2={23} y2={23} />
      <Path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <Path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .67-.08 1.32-.22 1.94" />
      <Line x1={12} y1={19} x2={12} y2={23} />
      <Line x1={8} y1={23} x2={16} y2={23} />
    </Svg>
  );
}

function CameraIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M23 7l-7 5 7 5V7z" />
      <Rect x={1} y={5} width={15} height={14} rx={2} ry={2} />
    </Svg>
  );
}

function CameraOffIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={1} y1={1} x2={23} y2={23} />
      <Path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" />
    </Svg>
  );
}

function MonitorIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={2} y={3} width={20} height={14} rx={2} ry={2} />
      <Line x1={8} y1={21} x2={16} y2={21} />
      <Line x1={12} y1={17} x2={12} y2={21} />
    </Svg>
  );
}

function HeadphonesOffIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 12a9 9 0 0 0-9-9 9.01 9.01 0 0 0-7.54 4.09" />
      <Path d="M3 12v3a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2H3" />
      <Path d="M21 12v3a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h3" />
      <Line x1={1} y1={1} x2={23} y2={23} />
    </Svg>
  );
}

function PhoneOffIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10.1 13.9a14 14 0 0 0 3.732 2.668 1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 18 18 0 0 1-12.728-5.272" />
      <Path d="M22 2 2 22" />
      <Path d="M4.76 13.582A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 .244.473" />
    </Svg>
  );
}

function FlipCameraIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
      <Path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
      <Polyline points="15 3 13 5 15 7" />
      <Polyline points="9 21 11 19 9 17" />
    </Svg>
  );
}

function UsersIcon({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <Circle cx={9} cy={7} r={4} />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

function AudioWaveIcon({ size = 14, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 10v4" />
      <Path d="M6 6v12" />
      <Path d="M10 3v18" />
      <Path d="M14 8v8" />
      <Path d="M18 5v14" />
      <Path d="M22 10v4" />
    </Svg>
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
  // Screen share active → spotlight
  if (screenShareDid) return 'spotlight';
  // Audio-only call type → voice
  if (callType === 'audio') return 'voice';
  // All cameras off → voice
  const anyVideoOn = participants.some((p) => !p.isCameraOff && p.stream);
  if (!anyVideoOn) return 'voice';
  // Default → grid
  return 'grid';
}

// ═══════════════════════════════════════════════════════════════════════════
// GroupCallPanel
// ═══════════════════════════════════════════════════════════════════════════

export const GroupCallPanel = forwardRef<View, GroupCallPanelProps>(
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
      hideHeader = false,
      hideNames = false,
      showTimer = true,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const colors = useMemo(() => resolveGroupCallPanelColors(theme), [theme]);

    // Focused participant for spotlight mode (click-to-focus)
    const [focusedDid, setFocusedDid] = useState<string | null>(null);

    // Resolve effective layout
    const effectiveLayout = useMemo<GroupCallLayout>(() => {
      if (layout === 'auto') {
        return resolveAutoLayout(participants, screenShareDid, callType);
      }
      return layout;
    }, [layout, participants, screenShareDid, callType]);

    // Visible participants (capped)
    const visibleParticipants = useMemo(
      () => participants.slice(0, maxVisible),
      [participants, maxVisible],
    );
    const overflowCount = participants.length - maxVisible;

    // ─── Handle participant tap ─────────────────────────────────────────
    const handleParticipantTap = useCallback(
      (did: string) => {
        if (onParticipantClick) {
          onParticipantClick(did);
        }
        // Click-to-focus for spotlight
        setFocusedDid((prev) => (prev === did ? null : did));
      },
      [onParticipantClick],
    );

    // ═════════════════════════════════════════════════════════════════════
    // Styles
    // ═════════════════════════════════════════════════════════════════════

    const rootStyle = useMemo<ViewStyle>(() => ({
      flex: 1,
      backgroundColor: colors.background,
    }), [colors.background]);

    // ─── Header ─────────────────────────────────────────────────────────

    const headerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.headerBackground,
    }), [colors]);

    const headerLeftStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'column',
      gap: 2,
      flex: 1,
    }), []);

    const headerTitleRowStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    }), []);

    const headerNameStyle = useMemo<TextStyle>(() => ({
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
    }), [colors.textPrimary]);

    const headerCountStyle = useMemo<TextStyle>(() => ({
      fontSize: 13,
      color: colors.textMuted,
    }), [colors.textMuted]);

    const headerSubtitleStyle = useMemo<TextStyle>(() => ({
      fontSize: 12,
      color: colors.textSecondary,
    }), [colors.textSecondary]);

    // ─── Voice avatar card sizing (adaptive presets) ───────────────────

    const cardSize: VoiceCardSize = useMemo(
      () => resolveVoiceCardSize(visibleParticipants.length),
      [visibleParticipants.length],
    );

    // ─── Control bar ────────────────────────────────────────────────────

    const controlBarStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 20,
    }), []);

    const controlBtnBase: ViewStyle = {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    };

    const controlBtnDefault = useMemo<ViewStyle>(() => ({
      ...controlBtnBase,
      backgroundColor: colors.controlButtonBg,
    }), [colors.controlButtonBg]);

    const controlBtnActive = useMemo<ViewStyle>(() => ({
      ...controlBtnBase,
      backgroundColor: colors.controlButtonActiveBg,
    }), [colors.controlButtonActiveBg]);

    const endCallBtnStyle = useMemo<ViewStyle>(() => ({
      ...controlBtnBase,
      backgroundColor: colors.endCallBg,
    }), [colors.endCallBg]);

    // ═════════════════════════════════════════════════════════════════════
    // Sub-renders
    // ═════════════════════════════════════════════════════════════════════

    // ─── Voice card (4:3 landscape, adaptive size) ────────────────────
    const renderVoiceCard = useCallback(
      (p: GroupCallParticipant) => {
        const isSpeaking = p.isSpeaking ?? false;
        const initial = (p.displayName || '?').charAt(0).toUpperCase();
        const avatarFontSize = Math.round(cardSize.avatarSize * 0.42);

        return (
          <Pressable
            key={p.did}
            onPress={() => handleParticipantTap(p.did)}
            accessibilityLabel={p.displayName}
            style={{
              width: cardSize.cardWidth,
              height: cardSize.cardHeight,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: cardSize.borderRadius,
              backgroundColor: colors.voiceCardBackground,
              borderWidth: isSpeaking ? 2 : 1,
              borderColor: isSpeaking ? colors.speakingColor : colors.tileBorder,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Status pill (top-right corner) */}
            {(p.isMuted || p.isDeafened) && (
              <View
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  flexDirection: 'row',
                  gap: 3,
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  borderRadius: 8,
                  paddingHorizontal: 5,
                  paddingVertical: 3,
                  alignItems: 'center',
                }}
              >
                {p.isMuted && <MicOffIcon size={cardSize.statusIconSize} color="#fff" />}
                {p.isDeafened && <HeadphonesOffIcon size={cardSize.statusIconSize} color="#fff" />}
              </View>
            )}

            {/* Avatar circle */}
            <View
              style={{
                width: cardSize.avatarSize,
                height: cardSize.avatarSize,
                borderRadius: cardSize.avatarSize / 2,
                backgroundColor: colors.tileBackground,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {typeof p.avatar === 'string' ? (
                <Text style={{ fontSize: avatarFontSize, fontWeight: '600', color: colors.textSecondary }}>
                  {initial}
                </Text>
              ) : p.avatar ? (
                (p.avatar as React.ReactElement)
              ) : (
                <Text style={{ fontSize: avatarFontSize, fontWeight: '600', color: colors.textSecondary }}>
                  {initial}
                </Text>
              )}
            </View>

            {/* Name row (bottom) — icon prepended before name when speaking */}
            {!hideNames && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 6,
                  left: 6,
                  right: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                {isSpeaking && <AudioWaveIcon size={cardSize.fontSize - 1} color={colors.speakingColor} />}
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: cardSize.fontSize,
                    fontWeight: '500',
                    color: isSpeaking ? colors.speakingColor : colors.textPrimary,
                    flexShrink: 1,
                  }}
                >
                  {p.displayName}
                </Text>
              </View>
            )}
          </Pressable>
        );
      },
      [cardSize, colors, handleParticipantTap, hideNames],
    );

    // ─── Video tile ─────────────────────────────────────────────────────
    const renderVideoTile = useCallback(
      (p: GroupCallParticipant, tileStyle?: ViewStyle) => {
        const isSpeaking = p.isSpeaking ?? false;
        const showFallback = p.isCameraOff || !p.stream;
        const initial = (p.displayName || '?').charAt(0).toUpperCase();

        return (
          <Pressable
            key={p.did}
            onPress={() => handleParticipantTap(p.did)}
            accessibilityLabel={p.displayName}
            style={[
              {
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                backgroundColor: colors.tileBackground,
                borderRadius: 12,
                borderWidth: isSpeaking ? 2 : 0,
                borderColor: isSpeaking ? colors.speakingColor : 'transparent',
              },
              tileStyle,
            ]}
          >
            {/* Video stream */}
            {!showFallback && p.stream && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                {p.stream as unknown as React.ReactElement}
              </View>
            )}

            {/* Camera-off fallback: avatar */}
            {showFallback && (
              <View style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.controlButtonBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: isSpeaking ? 2 : 0,
                    borderColor: isSpeaking ? colors.speakingColor : 'transparent',
                  }}
                >
                  {typeof p.avatar === 'string' || !p.avatar ? (
                    <Text style={{ fontSize: 20, fontWeight: '600', color: colors.textSecondary }}>
                      {initial}
                    </Text>
                  ) : (
                    (p.avatar as React.ReactElement)
                  )}
                </View>
              </View>
            )}

            {/* Status indicators (top-right) */}
            <View style={{ position: 'absolute', top: 6, right: 6, flexDirection: 'row', gap: 4 }}>
              {p.isMuted && (
                <View style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                  <MicOffIcon size={11} color="#fff" />
                </View>
              )}
              {p.isDeafened && (
                <View style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                  <HeadphonesOffIcon size={11} color="#fff" />
                </View>
              )}
              {p.isScreenSharing && (
                <View style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                  <MonitorIcon size={11} color="#fff" />
                </View>
              )}
            </View>

            {/* Name label (bottom-left) */}
            {!hideNames && (
              <View style={{ position: 'absolute', bottom: 6, left: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {isSpeaking && <AudioWaveIcon size={11} color={colors.speakingColor} />}
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: '#fff',
                    textShadowColor: 'rgba(0,0,0,0.6)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  }}
                >
                  {p.displayName}
                </Text>
              </View>
            )}
          </Pressable>
        );
      },
      [colors, handleParticipantTap, hideNames],
    );

    // ═════════════════════════════════════════════════════════════════════
    // Main content area
    // ═════════════════════════════════════════════════════════════════════

    const renderContent = () => {
      // ─── Connecting state ───────────────────────────────────────────
      if (isConnecting) {
        return (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <ActivityIndicator size="large" color={colors.textPrimary} />
            <Text style={{ fontSize: 15, color: colors.textSecondary }}>Connecting...</Text>
          </View>
        );
      }

      // ─── Voice layout ──────────────────────────────────────────────
      if (effectiveLayout === 'voice') {
        return (
          <ScrollView
            contentContainerStyle={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignContent: 'center',
              padding: 20,
              gap: cardSize.gap,
              flexGrow: 1,
            }}
            style={{ flex: 1 }}
          >
            {visibleParticipants.map(renderVoiceCard)}
            {overflowCount > 0 && (
              <View
                style={{
                  width: cardSize.cardWidth,
                  height: cardSize.cardHeight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: cardSize.borderRadius,
                  backgroundColor: colors.voiceCardBackground,
                  borderWidth: 1,
                  borderColor: colors.tileBorder,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textSecondary }}>
                  +{overflowCount}
                </Text>
              </View>
            )}
          </ScrollView>
        );
      }

      // ─── Spotlight layout ──────────────────────────────────────────
      if (effectiveLayout === 'spotlight') {
        const spotlightParticipant =
          visibleParticipants.find((p) => p.did === (focusedDid ?? screenShareDid ?? activeSpeakerDid)) ??
          visibleParticipants[0];
        const stripParticipants = spotlightParticipant
          ? visibleParticipants.filter((p) => p.did !== spotlightParticipant.did)
          : [];

        return (
          <View style={{ flex: 1, padding: 4, gap: 4 }}>
            {/* Main spotlight area */}
            {spotlightParticipant && (
              <View style={{ flex: 1, minHeight: 0 }}>
                {renderVideoTile(spotlightParticipant, { flex: 1 })}
              </View>
            )}

            {/* Bottom strip */}
            {stripParticipants.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 4, alignItems: 'center', paddingHorizontal: 2 }}
                style={{ flexGrow: 0, flexShrink: 0, height: 108 }}
              >
                {stripParticipants.map((p) =>
                  renderVideoTile(p, { width: 150, height: 100 }),
                )}
              </ScrollView>
            )}
          </View>
        );
      }

      // ─── Grid layout (default) ────────────────────────────────────
      const displayCount = overflowCount > 0
        ? visibleParticipants.length + 1
        : visibleParticipants.length;
      const cols = resolveGridColumns(displayCount);
      const rows = Math.ceil(displayCount / cols);

      return (
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignContent: 'center',
            padding: 4,
            backgroundColor: colors.contentBackground,
          }}
        >
          {visibleParticipants.map((p) => (
            <View
              key={p.did}
              style={{
                width: `${100 / cols}%` as unknown as number,
                height: `${100 / rows}%` as unknown as number,
                padding: 2,
              }}
            >
              {renderVideoTile(p, { flex: 1 })}
            </View>
          ))}

          {overflowCount > 0 && (
            <View
              style={{
                width: `${100 / cols}%` as unknown as number,
                height: `${100 / rows}%` as unknown as number,
                padding: 2,
              }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.tileBackground,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textSecondary }}>
                  +{overflowCount}
                </Text>
              </View>
            </View>
          )}
        </View>
      );
    };

    // ═════════════════════════════════════════════════════════════════════
    // Render
    // ═════════════════════════════════════════════════════════════════════

    return (
      <View ref={ref} style={[rootStyle, userStyle as ViewStyle]}>
        {/* ─── Header ──────────────────────────────────────────────── */}
        {!hideHeader && (
          <View style={headerStyle}>
            <View style={headerLeftStyle}>
              <View style={headerTitleRowStyle}>
                <UsersIcon size={16} color={colors.speakingColor} />
                <Text style={headerNameStyle}>{groupName}</Text>
                <View
                  style={{
                    backgroundColor: colors.controlButtonBg,
                    borderRadius: 10,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={headerCountStyle}>{participants.length}</Text>
                </View>
              </View>
              {subtitle && (
                <Text style={headerSubtitleStyle} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>

            {/* Timer */}
            {showTimer && connectedAt != null && !isConnecting && (
              <CallTimer startedAt={connectedAt} size="sm" color={colors.textMuted} />
            )}
          </View>
        )}

        {/* ─── Content ─────────────────────────────────────────────── */}
        {renderContent()}

        {/* ─── Control bar ─────────────────────────────────────────── */}
        <View style={controlBarStyle}>
          {/* Mute toggle */}
          <Pressable
            onPress={onToggleMute}
            accessibilityRole="button"
            accessibilityLabel={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            style={isMuted ? controlBtnActive : controlBtnDefault}
          >
            {isMuted ? (
              <MicOffIcon size={18} color={colors.controlButtonActiveIcon} />
            ) : (
              <MicIcon size={18} color={colors.controlButtonIcon} />
            )}
          </Pressable>

          {/* Deafen toggle (voice calls / when provided) */}
          {onToggleDeafen && (
            <Pressable
              onPress={onToggleDeafen}
              accessibilityRole="button"
              accessibilityLabel={isDeafened ? 'Undeafen' : 'Deafen'}
              style={isDeafened ? controlBtnActive : controlBtnDefault}
            >
              <HeadphonesOffIcon size={18} color={isDeafened ? colors.controlButtonActiveIcon : colors.controlButtonIcon} />
            </Pressable>
          )}

          {/* Camera toggle (video calls) */}
          {callType === 'video' && (
            <Pressable
              onPress={onToggleCamera}
              accessibilityRole="button"
              accessibilityLabel={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
              style={isCameraOff ? controlBtnActive : controlBtnDefault}
            >
              {isCameraOff ? (
                <CameraOffIcon size={18} color={colors.controlButtonActiveIcon} />
              ) : (
                <CameraIcon size={18} color={colors.controlButtonIcon} />
              )}
            </Pressable>
          )}

          {/* Screen share toggle */}
          {onToggleScreenShare && (
            <Pressable
              onPress={onToggleScreenShare}
              accessibilityRole="button"
              accessibilityLabel={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
              style={isScreenSharing ? controlBtnActive : controlBtnDefault}
            >
              <MonitorIcon size={18} color={isScreenSharing ? colors.controlButtonActiveIcon : colors.controlButtonIcon} />
            </Pressable>
          )}

          {/* Switch camera (mobile) */}
          {onSwitchCamera && (
            <Pressable
              onPress={onSwitchCamera}
              accessibilityRole="button"
              accessibilityLabel="Switch camera"
              style={controlBtnDefault}
            >
              <FlipCameraIcon size={18} color={colors.controlButtonIcon} />
            </Pressable>
          )}

          {/* End / Leave call */}
          <Pressable
            onPress={onEndCall}
            accessibilityRole="button"
            accessibilityLabel="End call"
            style={endCallBtnStyle}
          >
            <PhoneOffIcon size={18} color={colors.endCallIcon} />
          </Pressable>
        </View>
      </View>
    );
  },
);

GroupCallPanel.displayName = 'GroupCallPanel';
