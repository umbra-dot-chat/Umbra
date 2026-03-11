/**
 * @module styles/VoiceChannelPanel
 * @description Pure style-builder functions for the VoiceChannelPanel component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { withAlpha } from '../tokens/color-utils';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface VoiceChannelPanelColors {
  bg: string;
  border: string;
  channelName: string;
  statusText: string;
  statusDot: string;
  participantName: string;
  buttonBg: string;
  buttonIcon: string;
  buttonHoverBg: string;
  buttonActiveIcon: string;
  disconnectBg: string;
  disconnectIcon: string;
  /** Background for the join button. */
  joinButtonBg: string;
  /** Text/icon color for the join button. */
  joinButtonText: string;
  /** Text color for "Voice Connected" status. */
  connectedText: string;
  /** Text color for community name subtitle. */
  communityName: string;
  /** Background for control buttons (mute/deafen). */
  controlButtonBg: string;
  /** Background for active control buttons. */
  controlButtonActiveBg: string;
  /** Background for the disconnect button. */
  disconnectButtonBg: string;
  /** Icon color for control buttons. */
  controlButtonIcon: string;
  /** Icon color for active control buttons. */
  controlButtonActiveIcon: string;
  /** Icon color for disconnect button. */
  disconnectButtonIcon: string;
  /** Text color for participant overflow count. */
  overflowCount: string;
  /** Icon color for the signal/connection icon. */
  signalIcon: string;
}

export function resolveVoiceChannelPanelColors(
  theme: WispTheme,
): VoiceChannelPanelColors {
  const { colors } = theme;
  return {
    bg: colors.background.raised,
    border: colors.border.subtle,
    channelName: colors.text.onRaised,
    statusText: colors.status.success,
    statusDot: colors.status.success,
    participantName: colors.text.onRaisedSecondary,
    buttonBg: withAlpha(colors.text.onRaised, 0.1),
    buttonIcon: colors.text.onRaisedSecondary,
    buttonHoverBg: withAlpha(colors.text.onRaised, 0.15),
    buttonActiveIcon: colors.text.onRaised,
    disconnectBg: colors.status.danger,
    disconnectIcon: '#FFFFFF',
    joinButtonBg: colors.status.success,
    joinButtonText: '#FFFFFF',
    connectedText: colors.status.success,
    communityName: colors.text.onRaisedSecondary,
    controlButtonBg: withAlpha(colors.text.onRaised, 0.1),
    controlButtonActiveBg: colors.text.onRaised,
    disconnectButtonBg: colors.status.danger,
    controlButtonIcon: colors.text.onRaisedSecondary,
    controlButtonActiveIcon: colors.text.inverse,
    disconnectButtonIcon: '#FFFFFF',
    overflowCount: colors.text.onRaisedSecondary,
    signalIcon: colors.status.success,
  };
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildVoiceChannelPanelContainerStyle(
  colors: VoiceChannelPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.lg,
    padding: `${spacing.sm}px`,
    boxSizing: 'border-box',
    width: '100%',
  };
}

// ---------------------------------------------------------------------------
// Header (channel name + status)
// ---------------------------------------------------------------------------

export function buildVoiceChannelHeaderStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.xs}px ${spacing.sm}px`,
    boxSizing: 'border-box',
  };
}

export function buildChannelNameStyle(
  colors: VoiceChannelPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    color: colors.channelName,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    margin: 0,
  };
}

export function buildStatusTextStyle(
  colors: VoiceChannelPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colors.statusText,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Status dot
// ---------------------------------------------------------------------------

export function buildStatusDotStyle(
  colors: VoiceChannelPanelColors,
  _theme: WispTheme,
): CSSStyleObject {
  return {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: colors.statusDot,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Participant list
// ---------------------------------------------------------------------------

export function buildParticipantListStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['2xs'],
    padding: `${spacing.xs}px 0`,
    boxSizing: 'border-box',
  };
}

export function buildParticipantItemStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.xs}px ${spacing.sm}px`,
    borderRadius: radii.sm,
    boxSizing: 'border-box',
  };
}

export function buildParticipantNameStyle(
  colors: VoiceChannelPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.medium,
    color: colors.participantName,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Control buttons
// ---------------------------------------------------------------------------

export function buildVoiceChannelButtonStyle(
  colors: VoiceChannelPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: radii.md,
    border: 'none',
    backgroundColor: colors.buttonBg,
    color: colors.buttonIcon,
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    transition: 'background-color 150ms ease-out, color 150ms ease-out',
  };
}

// ---------------------------------------------------------------------------
// Bottom controls row
// ---------------------------------------------------------------------------

export function buildVoiceChannelControlsStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: `${spacing.xs}px ${spacing.sm}px`,
    borderTop: 'none',
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Disconnect button
// ---------------------------------------------------------------------------

export function buildDisconnectButtonStyle(
  colors: VoiceChannelPanelColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: radii.md,
    border: 'none',
    backgroundColor: colors.disconnectBg,
    color: colors.disconnectIcon,
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    transition: 'background-color 150ms ease-out',
  };
}
