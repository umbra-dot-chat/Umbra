/**
 * CallControlsOverlay — Always-visible call controls bar.
 *
 * Renders as a static row below the video grid (not an auto-hiding overlay).
 * Uses forced dark styling (white icons, gray backgrounds) for the
 * always-black call screen.
 */

import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';
import type { ViewStyle } from 'react-native';
import { CallControls } from '@coexist/wisp-react-native';

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

// ─── CSS ────────────────────────────────────────────────────────────────────

const CSS_ID = 'call-controls-overlay-css';

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
  // Inject CSS overrides on mount (web only)
  useEffect(() => {
    injectCallControlsCSS();
  }, []);

  const barStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  };

  return (
    <View
      nativeID="call-controls-overlay"
      style={barStyle}
      accessibilityRole="toolbar"
      accessibilityLabel="Call controls"
    >
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
  );
}
