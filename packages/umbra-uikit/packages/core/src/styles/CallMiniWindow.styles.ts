/**
 * @module styles/CallMiniWindow
 * @description Pure style-builder functions for the CallMiniWindow component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { withAlpha } from '../tokens/color-utils';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface CallMiniWindowColors {
  bg: string;
  border: string;
  overlayBg: string;
  overlayText: string;
  expandButtonBg: string;
  expandButtonIcon: string;
  endCallBg: string;
  endCallIcon: string;
  durationText: string;
  muteIcon: string;
  /** Background for the duration badge. */
  durationBadgeBg: string;
  /** Background for the mute indicator badge. */
  muteBadgeBg: string;
  /** Background for the end-call button in the overlay. */
  endCallButtonBg: string;
  /** Icon color for the end-call button in the overlay. */
  endCallButtonIcon: string;
  /** Text color for participant name. */
  participantName: string;
  /** Text color for audio-mode duration. */
  audioDurationText: string;
  /** Icon color for the mute badge indicator. */
  muteBadgeIcon: string;
}

export function resolveCallMiniWindowColors(
  theme: WispTheme,
): CallMiniWindowColors {
  const { colors } = theme;
  return {
    bg: colors.background.raised,
    border: colors.border.subtle,
    overlayBg: withAlpha('#000000', 0.5),
    overlayText: '#FFFFFF',
    expandButtonBg: withAlpha('#FFFFFF', 0.15),
    expandButtonIcon: '#FFFFFF',
    endCallBg: colors.status.danger,
    endCallIcon: '#FFFFFF',
    durationText: colors.text.onRaised,
    muteIcon: colors.text.onRaisedSecondary,
    durationBadgeBg: withAlpha('#000000', 0.6),
    muteBadgeBg: withAlpha(colors.status.danger, 0.9),
    endCallButtonBg: colors.status.danger,
    endCallButtonIcon: '#FFFFFF',
    participantName: colors.text.onRaised,
    audioDurationText: colors.text.onRaisedSecondary,
    muteBadgeIcon: '#FFFFFF',
  };
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildCallMiniWindowContainerStyle(
  colors: CallMiniWindowColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, shadows } = theme;
  return {
    position: 'fixed',
    bottom: 16,
    right: 16,
    display: 'flex',
    flexDirection: 'column',
    width: 200,
    height: 150,
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.lg,
    boxShadow: shadows.lg,
    overflow: 'hidden',
    zIndex: 9990,
    cursor: 'pointer',
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Video / avatar area
// ---------------------------------------------------------------------------

export function buildCallMiniWindowVideoStyle(
  colors: CallMiniWindowColors,
  _theme: WispTheme,
): CSSStyleObject {
  return {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    overflow: 'hidden',
    minHeight: 0,
  };
}

// ---------------------------------------------------------------------------
// Overlay (controls on hover)
// ---------------------------------------------------------------------------

export function buildCallMiniWindowOverlayStyle(
  colors: CallMiniWindowColors,
  _theme: WispTheme,
): CSSStyleObject {
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.overlayBg,
  };
}

// ---------------------------------------------------------------------------
// Expand button
// ---------------------------------------------------------------------------

export function buildExpandButtonStyle(
  colors: CallMiniWindowColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: radii.full,
    border: 'none',
    backgroundColor: colors.expandButtonBg,
    color: colors.expandButtonIcon,
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    transition: 'background-color 150ms ease-out',
  };
}

// ---------------------------------------------------------------------------
// End call button
// ---------------------------------------------------------------------------

export function buildEndCallButtonStyle(
  colors: CallMiniWindowColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: radii.full,
    border: 'none',
    backgroundColor: colors.endCallBg,
    color: colors.endCallIcon,
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    transition: 'background-color 150ms ease-out',
  };
}

// ---------------------------------------------------------------------------
// Bottom bar (duration + mute indicator)
// ---------------------------------------------------------------------------

export function buildCallMiniWindowBottomBarStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing['2xs']}px ${spacing.sm}px`,
    flexShrink: 0,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Duration text
// ---------------------------------------------------------------------------

export function buildDurationTextStyle(
  colors: CallMiniWindowColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.medium,
    fontFamily: 'monospace',
    color: colors.durationText,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Mute icon
// ---------------------------------------------------------------------------

export function buildMiniWindowMuteIconStyle(
  colors: CallMiniWindowColors,
  _theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 16,
    height: 16,
    color: colors.muteIcon,
    flexShrink: 0,
  };
}
