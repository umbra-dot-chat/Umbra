/**
 * CallControlsOverlay — Floating call controls that auto-hide after idle.
 *
 * On desktop/web: fades out after 3 seconds of no mouse movement, reappears
 * on hover. On mobile: always visible (no auto-hide).
 * Buttons render without a container/pill for a minimal look.
 * Uses forced dark styling (white icons, gray backgrounds) for the
 * always-black call screen.
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, Animated, Platform } from 'react-native';
import type { ViewStyle } from 'react-native';
import { CallControls, useTheme } from '@coexist/wisp-react-native';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useAppTheme } from '@/contexts/ThemeContext';

// ─── Props ──────────────────────────────────────────────────────────────────

export interface CallControlsOverlayProps {
  isMuted: boolean;
  isDeafened: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const AUTO_HIDE_DELAY = 3000;
const FADE_DURATION = 200;
const CSS_ID = 'call-controls-overlay-css';

// ─── Web CSS overrides ──────────────────────────────────────────────────────

/**
 * Inject CSS to force dark-on-black button styling for the call controls.
 * The Wisp CallControls resolves colors from the active theme, which breaks
 * on the always-black call background in light mode. These overrides force
 * a lighter gray button background and white icons.
 */
function injectCallControlsCSS() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById(CSS_ID)) return;

  const style = document.createElement('style');
  style.id = CSS_ID;
  style.textContent = `
    /* Default call control buttons — lighter gray bg, white icons.
       Exclude the end-call button so it keeps its red background. */
    #call-controls-overlay [role="button"]:not([aria-label="End call"]) {
      background-color: rgba(255, 255, 255, 0.2) !important;
    }
    #call-controls-overlay [role="button"] svg {
      stroke: #FFFFFF !important;
    }
    /* Active/toggled buttons (e.g. muted mic) — red to signal "off" state */
    #call-controls-overlay [role="button"][aria-selected="true"]:not([aria-label="End call"]) {
      background-color: #EF4444 !important;
    }
  `;
  document.head.appendChild(style);
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CallControlsOverlay({
  isMuted,
  isDeafened,
  isCameraOff,
  isScreenSharing,
  onToggleMute,
  onToggleDeafen,
  onToggleCamera,
  onToggleScreenShare,
  onEndCall,
}: CallControlsOverlayProps) {
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const { motionPreferences } = useAppTheme();
  const reduceMotion = motionPreferences.reduceMotion;

  const opacity = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pointerEvents, setPointerEvents] = useState<'auto' | 'none'>('auto');

  // Inject CSS overrides on mount (web only)
  useEffect(() => {
    injectCallControlsCSS();
  }, []);

  const fadeOut = useCallback(() => {
    if (isMobile) return;
    const duration = reduceMotion ? 0 : FADE_DURATION;
    Animated.timing(opacity, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    }).start(() => {
      setPointerEvents('none');
    });
  }, [isMobile, opacity, reduceMotion]);

  const fadeIn = useCallback(() => {
    if (isMobile) return;
    setPointerEvents('auto');
    const duration = reduceMotion ? 0 : FADE_DURATION;
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  }, [isMobile, opacity, reduceMotion]);

  const resetTimer = useCallback(() => {
    if (isMobile) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    fadeIn();
    timerRef.current = setTimeout(fadeOut, AUTO_HIDE_DELAY);
  }, [isMobile, fadeIn, fadeOut]);

  // Start the auto-hide timer on mount (desktop only)
  useEffect(() => {
    if (isMobile) return;
    timerRef.current = setTimeout(fadeOut, AUTO_HIDE_DELAY);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isMobile, fadeOut]);

  // Attach mousemove listener on web to detect activity
  useEffect(() => {
    if (Platform.OS !== 'web' || isMobile) return;
    const handler = () => resetTimer();
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [isMobile, resetTimer]);

  // ── Styles ──────────────────────────────────────────────────────────────

  const wrapperStyle: ViewStyle = {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  };

  const controlsContainerStyle: ViewStyle = {
    paddingHorizontal: 8,
    paddingVertical: 4,
  };

  // On mobile, render without animation wrapper
  if (isMobile) {
    return (
      <View nativeID="call-controls-overlay" style={wrapperStyle} accessibilityRole="toolbar" accessibilityLabel="Call controls">
        <View style={controlsContainerStyle}>
          <CallControls
            isMuted={isMuted}
            isVideoOff={isCameraOff}
            isScreenSharing={isScreenSharing}
            isSpeakerOn={!isDeafened}
            onToggleMute={onToggleMute}
            onToggleVideo={onToggleCamera}
            onToggleScreenShare={onToggleScreenShare}
            onToggleSpeaker={onToggleDeafen}
            onEndCall={onEndCall}
            callType="video"
            layout="compact"
          />
        </View>
      </View>
    );
  }

  return (
    <Animated.View
      style={[wrapperStyle, { opacity }]}
      pointerEvents={pointerEvents}
      accessibilityRole="toolbar"
      accessibilityLabel="Call controls"
    >
      <View nativeID="call-controls-overlay" style={controlsContainerStyle}>
        <CallControls
          isMuted={isMuted}
          isVideoOff={isCameraOff}
          isScreenSharing={isScreenSharing}
          isSpeakerOn
          onToggleMute={onToggleMute}
          onToggleVideo={onToggleCamera}
          onToggleScreenShare={onToggleScreenShare}
          onToggleSpeaker={() => {}}
          onEndCall={onEndCall}
          callType="video"
          layout="compact"
        />
      </View>
    </Animated.View>
  );
}
