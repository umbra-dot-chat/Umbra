/**
 * CallControlsOverlay — Shared call controls bar used in both the full call
 * panel and the sidebar mini-panel.
 *
 * All buttons come from the Wisp CallControls component. CSS overrides:
 * - Swap the speaker icon for a headphones icon (Discord-style deafen).
 * - Reorder buttons: mute, deafen, camera, screenshare, end.
 * - Apply danger-color backgrounds to toggled-off buttons.
 * - Sidebar: theme-aware icon/bg colors matching NavigationRail.
 * - Call panel: forced dark styling for the always-black call bg.
 */

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Box, CallControls, useTheme } from '@coexist/wisp-react-native';
import { dbg } from '@/utils/debug';

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
  /** Render variant. 'call' = full call panel, 'sidebar' = mini sidebar panel. */
  variant?: 'call' | 'sidebar';
}

// ─── SVG Data URIs for headphones icon ──────────────────────────────────────

function headphonesSvg(color: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
  )}")`;
}

function headphonesOffSvg(color: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/><path d="M21 18v-6a9 9 0 0 0-9-9 8.98 8.98 0 0 0-6.36 2.64"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
  )}")`;
}

// ─── CSS ────────────────────────────────────────────────────────────────────

/**
 * Inject CSS for a specific container ID. Handles:
 * - Flattening CallControls wrapper (display: contents)
 * - Button reordering (mute → deafen → camera → screenshare → end)
 * - Headphones icon swap via background-image data URIs
 * - Red/danger backgrounds on toggled-off buttons
 * - Sidebar: theme-aware colors matching NavigationRail style
 * - Call panel: forced dark styling for always-black background
 */
function injectControlsCSS(
  id: string,
  dangerColor: string,
  isSidebar: boolean,
  opts: { sunkenColor: string; iconColor: string },
) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  const cssId = `${id}-css`;
  const existing = document.getElementById(cssId);
  if (existing) existing.remove();

  // Both variants use the same theme-aware colors (NavigationRail style)
  const defaultIconColor = opts.iconColor;
  const defaultBg = opts.sunkenColor;

  const s = document.createElement('style');
  s.id = cssId;
  s.textContent = `
    /* Flatten CallControls wrapper so buttons flow into parent flex row */
    #${id} [role="toolbar"] {
      display: contents !important;
    }

    /* ── Button ordering: mute(0) deafen(1) camera(2) screenshare(3) end(10) ── */
    #${id} div:has(> [aria-label*="microphone"]) { order: 0 !important; }
    #${id} div:has(> [aria-label*="speaker" i])  { order: 1 !important; }
    #${id} div:has(> [aria-label*="camera"])     { order: 2 !important; }
    #${id} div:has(> [aria-label*="screen" i])   { order: 3 !important; }
    #${id} div:has(> [aria-label="End call"])    { order: 10 !important; }

    /* ── Default buttons: variant-specific bg and icon color ── */
    #${id} [role="button"]:not([aria-label="End call"]) {
      background-color: ${defaultBg} !important;
    }
    #${id} [role="button"] svg {
      stroke: ${defaultIconColor} !important;
    }

    /* ── Toggled-off buttons: danger bg + white icons ── */
    #${id} [role="button"][aria-label="Unmute microphone"],
    #${id} [role="button"][aria-label="Turn on camera"],
    #${id} [role="button"][aria-label="Turn on speaker"] {
      background-color: ${dangerColor} !important;
    }
    #${id} [role="button"][aria-label="Unmute microphone"] svg,
    #${id} [role="button"][aria-label="Turn on camera"] svg,
    #${id} [role="button"][aria-label="Turn on speaker"] svg {
      stroke: #FFFFFF !important;
    }

    /* ── End call button: always white icon ── */
    #${id} [role="button"][aria-label="End call"] svg {
      stroke: #FFFFFF !important;
    }

    /* ── Headphones icon swap: hide speaker SVG, show headphones via bg image ── */
    #${id} [aria-label="Turn off speaker"] svg,
    #${id} [aria-label="Turn on speaker"] svg {
      visibility: hidden !important;
    }
    #${id} [aria-label="Turn off speaker"] {
      background-image: ${headphonesSvg(defaultIconColor)} !important;
      background-repeat: no-repeat !important;
      background-position: center !important;
      background-size: 20px 20px !important;
    }
    #${id} [aria-label="Turn on speaker"] {
      background-image: ${headphonesOffSvg('#FFFFFF')} !important;
      background-repeat: no-repeat !important;
      background-position: center !important;
      background-size: 20px 20px !important;
    }
  `;
  document.head.appendChild(s);
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
  variant = 'call',
}: CallControlsOverlayProps) {
  if (__DEV__) dbg.trackRender('CallControlsOverlay');
  const { theme } = useTheme();
  const dangerColor = theme.colors.status.danger;
  const sunkenColor = theme.colors.background.sunken;
  const iconColor = theme.colors.text.secondary;

  const id = variant === 'sidebar' ? 'sidebar-call-controls' : 'call-controls-overlay';

  const isSidebar = variant === 'sidebar';
  useEffect(() => {
    injectControlsCSS(id, dangerColor, isSidebar, { sunkenColor, iconColor });
  }, [id, dangerColor, isSidebar, sunkenColor, iconColor]);

  const barStyle: ViewStyle = variant === 'sidebar'
    ? { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }
    : { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 8 };

  return (
    <Box nativeID={id} style={barStyle}>
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
    </Box>
  );
}
