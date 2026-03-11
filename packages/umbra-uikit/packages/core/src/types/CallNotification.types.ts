/**
 * @module CallNotification
 * @description Type definitions for the CallNotification component.
 */

import type React from 'react';

/**
 * Call notification display variants.
 */
export const callNotificationVariants = ['incoming', 'outgoing', 'missed'] as const;
export type CallNotificationVariant = (typeof callNotificationVariants)[number];

/**
 * Call type for the notification.
 */
export const callNotificationTypes = ['voice', 'video'] as const;
export type CallNotificationType = (typeof callNotificationTypes)[number];

/**
 * Size presets for the notification.
 */
export const callNotificationSizes = ['sm', 'md', 'lg'] as const;
export type CallNotificationSize = (typeof callNotificationSizes)[number];

/**
 * Size configuration for each notification size.
 */
export interface CallNotificationSizeConfig {
  avatarSize: number;
  titleSize: number;
  subtitleSize: number;
  buttonSize: number;
  padding: number;
  gap: number;
}

export const callNotificationSizeMap: Record<CallNotificationSize, CallNotificationSizeConfig> = {
  sm: { avatarSize: 32, titleSize: 13, subtitleSize: 11, buttonSize: 32, padding: 12, gap: 8 },
  md: { avatarSize: 40, titleSize: 14, subtitleSize: 12, buttonSize: 40, padding: 16, gap: 12 },
  lg: { avatarSize: 56, titleSize: 18, subtitleSize: 14, buttonSize: 48, padding: 24, gap: 16 },
};

/**
 * Props for the CallNotification component.
 */
export interface CallNotificationProps {
  /** Display variant. */
  variant: CallNotificationVariant;
  /** Name of the caller/callee. */
  callerName: string;
  /** Optional avatar URL. */
  callerAvatar?: string;
  /** Type of call. */
  callType: CallNotificationType;
  /** Call duration string (for missed/outgoing). */
  duration?: string;
  /** Accept call handler (incoming only). */
  onAccept?: () => void;
  /** Decline/dismiss handler. */
  onDecline?: () => void;
  /** Size preset. @default 'md' */
  size?: CallNotificationSize;
  /** Style overrides. */
  style?: object;
}
