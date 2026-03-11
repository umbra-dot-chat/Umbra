/**
 * @module styles/GroupCallPanel
 * @description Pure style-builder functions for the unified GroupCallPanel.
 *
 * Provides theme-aware color resolution and layout helpers for both
 * voice-only and video call layouts.
 */

import type { WispTheme } from '../theme/types';
import { withAlpha } from '../tokens/color-utils';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface GroupCallPanelColors {
  /** Full-bleed background for the call panel. */
  background: string;
  /** Background for the sunken content area (grid / voice area). */
  contentBackground: string;
  /** Background for the top bar. */
  headerBackground: string;
  /** Background for the bottom control bar. */
  controlBarBackground: string;
  /** Primary text color (names, header). */
  textPrimary: string;
  /** Secondary text color (participant count, subtitle). */
  textSecondary: string;
  /** Muted text color (timestamps, hints). */
  textMuted: string;
  /** Border color between sections. */
  border: string;
  /** Background for individual tiles (video/avatar cards). */
  tileBackground: string;
  /** Border color for tiles at rest. */
  tileBorder: string;
  /** Highlight color for the speaking participant. */
  speakingColor: string;
  /** Background for mute/deafen badges. */
  dangerBadge: string;
  /** Control button default background. */
  controlButtonBg: string;
  /** Control button active/toggled background. */
  controlButtonActiveBg: string;
  /** Control button icon color. */
  controlButtonIcon: string;
  /** Control button active icon color. */
  controlButtonActiveIcon: string;
  /** End/leave call button background. */
  endCallBg: string;
  /** End/leave call button icon color. */
  endCallIcon: string;
  /** Voice card background (for voice-only mode). */
  voiceCardBackground: string;
  /** Connecting status color. */
  connectingColor: string;
}

/**
 * Resolves the full color palette for GroupCallPanel from the theme.
 */
export function resolveGroupCallPanelColors(
  theme: WispTheme,
): GroupCallPanelColors {
  const { colors } = theme;
  return {
    background: colors.background.canvas,
    contentBackground: colors.background.sunken,
    headerBackground: colors.background.canvas,
    controlBarBackground: colors.background.sunken,
    textPrimary: colors.text.primary,
    textSecondary: colors.text.secondary,
    textMuted: colors.text.muted,
    border: colors.border.subtle,
    tileBackground: colors.background.raised,
    tileBorder: colors.border.subtle,
    speakingColor: colors.status.success,
    dangerBadge: colors.status.danger,
    controlButtonBg: withAlpha(colors.text.primary, 0.1),
    controlButtonActiveBg: colors.status.danger,
    controlButtonIcon: colors.text.primary,
    controlButtonActiveIcon: '#FFFFFF',
    endCallBg: colors.status.danger,
    endCallIcon: '#FFFFFF',
    voiceCardBackground: colors.background.raised,
    connectingColor: colors.status.warning,
  };
}

// ---------------------------------------------------------------------------
// Backward-compatible helpers (still exported for existing consumers)
// ---------------------------------------------------------------------------

export function resolveGroupCallBackground(isDark: boolean): string {
  return isDark ? '#0f0f0f' : '#111111';
}

export function resolveGroupCallBorder(isDark: boolean): string {
  return isDark ? '#2a2a2a' : '#333333';
}

export function resolveControlBarBackground(isDark: boolean): string {
  return isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.5)';
}

// ---------------------------------------------------------------------------
// Voice card grid helpers
// ---------------------------------------------------------------------------

/**
 * Resolves the number of columns for the voice-only avatar card grid.
 * Follows the universal pattern: 1→2→3→4 columns as count grows.
 */
export function resolveVoiceGridColumns(count: number): number {
  if (count <= 1) return 1;
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  return 4;
}

/**
 * Resolves the avatar card width based on available space and column count.
 * Cards are between 100–140px wide depending on grid density.
 */
export function resolveVoiceCardWidth(cols: number): number {
  switch (cols) {
    case 1: return 140;
    case 2: return 130;
    case 3: return 120;
    default: return 110;
  }
}

// ---------------------------------------------------------------------------
// Adaptive voice card sizing
// ---------------------------------------------------------------------------

/**
 * Preset sizes for voice cards that scale with participant count.
 *
 * | Preset | Card W | Card H (4:3) | Avatar | Font | Participants |
 * |--------|--------|--------------|--------|------|--------------|
 * | lg     | 200    | 150          | 64     | 14   | 1–2          |
 * | md     | 160    | 120          | 52     | 13   | 3–4          |
 * | sm     | 130    | 97           | 44     | 12   | 5–8          |
 * | xs     | 110    | 82           | 36     | 11   | 9+           |
 */
export interface VoiceCardSize {
  /** Card width in px. */
  cardWidth: number;
  /** Card height in px (4:3 ratio). */
  cardHeight: number;
  /** Avatar circle diameter. */
  avatarSize: number;
  /** Name label font size. */
  fontSize: number;
  /** Status pill icon size. */
  statusIconSize: number;
  /** Card border radius. */
  borderRadius: number;
  /** Grid gap between cards. */
  gap: number;
}

const voiceCardPresets: Record<string, VoiceCardSize> = {
  lg: { cardWidth: 200, cardHeight: 150, avatarSize: 64, fontSize: 14, statusIconSize: 12, borderRadius: 14, gap: 14 },
  md: { cardWidth: 160, cardHeight: 120, avatarSize: 52, fontSize: 13, statusIconSize: 11, borderRadius: 12, gap: 12 },
  sm: { cardWidth: 130, cardHeight: 97,  avatarSize: 44, fontSize: 12, statusIconSize: 10, borderRadius: 10, gap: 10 },
  xs: { cardWidth: 110, cardHeight: 82,  avatarSize: 36, fontSize: 11, statusIconSize: 9,  borderRadius: 8,  gap: 8  },
};

/**
 * Resolves the voice card size preset based on participant count.
 *
 * Fewer participants → larger cards (more breathing room).
 * More participants → smaller cards to fit everyone on screen.
 */
export function resolveVoiceCardSize(count: number): VoiceCardSize {
  if (count <= 2) return voiceCardPresets.lg;
  if (count <= 4) return voiceCardPresets.md;
  if (count <= 8) return voiceCardPresets.sm;
  return voiceCardPresets.xs;
}
