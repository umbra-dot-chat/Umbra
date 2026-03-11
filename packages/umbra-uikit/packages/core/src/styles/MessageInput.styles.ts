/**
 * @module styles/MessageInput
 * @description Pure style-builder functions for the MessageInput component.
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { MessageInputSizeConfig, MessageInputVariant } from '../types/MessageInput.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface MessageInputColors {
  bg: string;
  border: string;
  borderFocus: string;
  text: string;
  placeholder: string;
  icon: string;
  iconHover: string;
  sendBg: string;
  sendIcon: string;
  sendBgDisabled: string;
}

export function resolveMessageInputColors(theme: WispTheme): MessageInputColors {
  const { colors: themeColors } = theme;
  return {
    bg: 'transparent',
    border: themeColors.border.strong,
    borderFocus: themeColors.accent.primary,
    text: themeColors.text.primary,
    placeholder: themeColors.text.muted,
    icon: themeColors.text.muted,
    iconHover: themeColors.text.secondary,
    sendBg: themeColors.accent.primary,
    sendIcon: themeColors.text.inverse,
    sendBgDisabled: themeColors.accent.primary,
  };
}

// ---------------------------------------------------------------------------
// Style builders
// ---------------------------------------------------------------------------

export function buildMessageInputContainerStyle(
  sizeConfig: MessageInputSizeConfig,
  colors: MessageInputColors,
  theme: WispTheme,
  variant: MessageInputVariant = 'default',
): CSSStyleObject {
  const { radii } = theme;
  const isPill = variant === 'pill';
  const resolvedRadius = isPill ? radii.full : radii[sizeConfig.borderRadius];
  const hPad = isPill ? sizeConfig.padding * 0.75 : sizeConfig.padding;
  return {
    display: 'flex',
    alignItems: 'flex-end',
    gap: sizeConfig.gap,
    padding: `${sizeConfig.padding / 2}px ${hPad}px`,
    borderRadius: resolvedRadius,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bg,
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}`,
    width: '100%',
  };
}

export function buildMessageInputTextareaStyle(
  sizeConfig: MessageInputSizeConfig,
  colors: MessageInputColors,
): CSSStyleObject {
  return {
    flex: 1,
    minHeight: sizeConfig.minHeight - sizeConfig.padding,
    maxHeight: sizeConfig.maxHeight,
    fontSize: sizeConfig.fontSize,
    fontFamily: 'inherit',
    color: colors.text,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    resize: 'none',
    padding: `${sizeConfig.padding / 2}px 0`,
    lineHeight: 1.4,
    overflow: 'auto',
  };
}

export function buildMessageInputIconButtonStyle(
  sizeConfig: MessageInputSizeConfig,
  colors: MessageInputColors,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeConfig.iconButtonSize,
    height: sizeConfig.iconButtonSize,
    borderRadius: sizeConfig.iconButtonSize / 2,
    border: 'none',
    backgroundColor: 'transparent',
    color: colors.icon,
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    transition: `color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

export function buildMessageInputSendButtonStyle(
  sizeConfig: MessageInputSizeConfig,
  colors: MessageInputColors,
  hasContent: boolean,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeConfig.iconButtonSize,
    height: sizeConfig.iconButtonSize,
    borderRadius: sizeConfig.iconButtonSize / 2,
    border: 'none',
    backgroundColor: hasContent ? colors.sendBg : colors.sendBgDisabled,
    color: colors.sendIcon,
    cursor: hasContent ? 'pointer' : 'default',
    padding: 0,
    flexShrink: 0,
    transition: `all ${durations.fast}ms ${easings.easeOut.css}`,
    opacity: 1,
  };
}

export function buildMessageInputSkeletonStyle(
  sizeConfig: MessageInputSizeConfig,
  theme: WispTheme,
  variant: MessageInputVariant = 'default',
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  const isPill = variant === 'pill';
  return {
    display: 'block',
    width: '100%',
    height: sizeConfig.minHeight + sizeConfig.padding,
    borderRadius: isPill ? radii.full : radii[sizeConfig.borderRadius],
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}

// ---------------------------------------------------------------------------
// Wrapper (holds context bar + container)
// ---------------------------------------------------------------------------

/**
 * Builds the outer wrapper style that holds the optional context bar
 * (reply/edit preview) and the main input container.
 */
export function buildMessageInputWrapperStyle(
  sizeConfig: MessageInputSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: 0,
  };
}

// ---------------------------------------------------------------------------
// Context bar (reply / edit preview)
// ---------------------------------------------------------------------------

/**
 * Builds the style for the reply/edit context bar above the input.
 *
 * @param type - Whether this is a 'reply' or 'edit' context.
 */
export function buildMessageInputContextBarStyle(
  sizeConfig: MessageInputSizeConfig,
  colors: MessageInputColors,
  type: 'reply' | 'edit',
  theme: WispTheme,
): {
  container: CSSStyleObject;
  label: CSSStyleObject;
  text: CSSStyleObject;
  closeBtn: CSSStyleObject;
} {
  const { colors: themeColors, radii, spacing, typography } = theme;
  const accentColor = type === 'edit' ? themeColors.status.warning : themeColors.accent.primary;

  return {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      padding: `${spacing.xs}px ${sizeConfig.padding}px`,
      borderLeft: `2px solid ${accentColor}`,
      borderTopLeftRadius: radii.sm,
      borderTopRightRadius: radii.sm,
      backgroundColor: `${accentColor}08`,
    },
    label: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      minWidth: 0,
    },
    text: {
      fontSize: typography.sizes.xs.fontSize,
      lineHeight: `${typography.sizes.xs.lineHeight}px`,
      color: themeColors.text.secondary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    closeBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 20,
      height: 20,
      borderRadius: 10,
      border: 'none',
      backgroundColor: 'transparent',
      color: themeColors.text.muted,
      cursor: 'pointer',
      padding: 0,
      flexShrink: 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Attachment previews row
// ---------------------------------------------------------------------------

/**
 * Builds the style for the queued attachments preview row.
 */
export function buildMessageInputAttachmentsStyle(
  sizeConfig: MessageInputSizeConfig,
  theme: WispTheme,
): {
  container: CSSStyleObject;
  card: CSSStyleObject;
  thumbnail: CSSStyleObject;
  name: CSSStyleObject;
  size: CSSStyleObject;
  removeBtn: CSSStyleObject;
} {
  const { colors: themeColors, radii, spacing, typography } = theme;
  return {
    container: {
      display: 'flex',
      gap: spacing.sm,
      padding: `${spacing.sm}px ${sizeConfig.padding}px`,
      overflowX: 'auto',
    },
    card: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.xs,
      padding: `${spacing.xs}px ${spacing.sm}px`,
      borderRadius: radii.md,
      border: `1px solid ${themeColors.border.subtle}`,
      backgroundColor: themeColors.background.surface,
      minWidth: 0,
      maxWidth: 180,
      flexShrink: 0,
    },
    thumbnail: {
      width: 32,
      height: 32,
      borderRadius: radii.sm,
      objectFit: 'cover' as 'cover',
      flexShrink: 0,
    },
    name: {
      fontSize: typography.sizes.xs.fontSize,
      lineHeight: `${typography.sizes.xs.lineHeight}px`,
      color: themeColors.text.primary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      flex: 1,
      minWidth: 0,
    },
    size: {
      fontSize: typography.sizes['2xs'].fontSize,
      lineHeight: `${typography.sizes['2xs'].lineHeight}px`,
      color: themeColors.text.muted,
      whiteSpace: 'nowrap',
    },
    removeBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 16,
      height: 16,
      borderRadius: 8,
      border: 'none',
      backgroundColor: 'transparent',
      color: themeColors.text.muted,
      cursor: 'pointer',
      padding: 0,
      flexShrink: 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Character counter
// ---------------------------------------------------------------------------

/**
 * Builds the style for the character count indicator.
 *
 * @param overLimit - Whether the current text exceeds the max length.
 */
export function buildMessageInputCounterStyle(
  theme: WispTheme,
  overLimit: boolean,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes['2xs'].fontSize,
    lineHeight: `${typography.sizes['2xs'].lineHeight}px`,
    color: overLimit ? themeColors.status.danger : themeColors.text.muted,
    whiteSpace: 'nowrap',
    alignSelf: 'flex-end',
    flexShrink: 0,
    paddingBottom: 2,
  };
}
