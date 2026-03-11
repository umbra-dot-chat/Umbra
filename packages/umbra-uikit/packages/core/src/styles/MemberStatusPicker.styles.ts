/**
 * @module MemberStatusPicker
 */
import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export interface MemberStatusPickerColors {
  bg: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  inputBg: string;
  buttonBg: string;
  buttonText: string;
  buttonHoverBg: string;
  dangerText: string;
  overlayBg: string;
}

export function resolveMemberStatusPickerColors(theme: WispTheme): MemberStatusPickerColors {
  const { colors: c } = theme;
  return {
    bg: c.background.surface,
    text: c.text.primary,
    textSecondary: c.text.secondary,
    textMuted: c.text.muted,
    border: c.border.subtle,
    inputBg: c.background.sunken,
    buttonBg: c.accent.primary,
    buttonText: '#FFFFFF',
    buttonHoverBg: c.accent.primaryHover,
    dangerText: c.status.danger,
    overlayBg: c.background.overlay,
  };
}

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

export function buildMemberStatusPickerOverlayStyle(
  colors: MemberStatusPickerColors,
): CSSStyleObject {
  return {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlayBg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };
}

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------

export function buildMemberStatusPickerDialogStyle(
  colors: MemberStatusPickerColors,
  theme: WispTheme,
): CSSStyleObject {
  return {
    backgroundColor: colors.bg,
    borderRadius: theme.radii.lg,
    border: `1px solid ${colors.border}`,
    padding: theme.spacing.lg,
    width: 360,
    maxWidth: '90vw',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.md,
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  };
}

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------

export function buildMemberStatusPickerTitleStyle(
  colors: MemberStatusPickerColors,
  theme: WispTheme,
): CSSStyleObject {
  return {
    fontSize: 16,
    fontWeight: 600,
    fontFamily: fontFamilyStacks.sans,
    color: colors.text,
    margin: 0,
    padding: 0,
    lineHeight: 1.4,
  };
}

// ---------------------------------------------------------------------------
// Emoji row
// ---------------------------------------------------------------------------

export function buildMemberStatusPickerEmojiRowStyle(
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
  };
}

// ---------------------------------------------------------------------------
// Emoji button
// ---------------------------------------------------------------------------

export function buildMemberStatusPickerEmojiButtonStyle(
  colors: MemberStatusPickerColors,
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: theme.radii.md,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.inputBg,
    cursor: 'pointer',
    fontSize: 20,
    padding: 0,
    flexShrink: 0,
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Text input
// ---------------------------------------------------------------------------

export function buildMemberStatusPickerInputStyle(
  colors: MemberStatusPickerColors,
  theme: WispTheme,
): CSSStyleObject {
  return {
    flex: 1,
    height: 40,
    padding: `0 ${theme.spacing.sm}px`,
    borderRadius: theme.radii.md,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.inputBg,
    color: colors.text,
    fontSize: 14,
    fontFamily: fontFamilyStacks.sans,
    outline: 'none',
    boxSizing: 'border-box',
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Expiry row
// ---------------------------------------------------------------------------

export function buildMemberStatusPickerExpiryRowStyle(
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
  };
}

// ---------------------------------------------------------------------------
// Expiry label
// ---------------------------------------------------------------------------

export function buildMemberStatusPickerExpiryLabelStyle(
  colors: MemberStatusPickerColors,
): CSSStyleObject {
  return {
    fontSize: 13,
    fontFamily: fontFamilyStacks.sans,
    color: colors.textSecondary,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

export function buildMemberStatusPickerSelectStyle(
  colors: MemberStatusPickerColors,
  theme: WispTheme,
): CSSStyleObject {
  return {
    flex: 1,
    height: 36,
    padding: `0 ${theme.spacing.sm}px`,
    borderRadius: theme.radii.md,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.inputBg,
    color: colors.text,
    fontSize: 13,
    fontFamily: fontFamilyStacks.sans,
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Actions row
// ---------------------------------------------------------------------------

export function buildMemberStatusPickerActionsStyle(
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  };
}

// ---------------------------------------------------------------------------
// Action button (primary)
// ---------------------------------------------------------------------------

export function buildMemberStatusPickerButtonStyle(
  colors: MemberStatusPickerColors,
  variant: 'primary' | 'secondary' | 'danger',
  theme: WispTheme,
): CSSStyleObject {
  const base: CSSStyleObject = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.md,
    borderRadius: theme.radii.md,
    fontSize: 13,
    fontWeight: 500,
    fontFamily: fontFamilyStacks.sans,
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, opacity ${durations.fast}ms ${easings.easeOut.css}`,
  };

  if (variant === 'primary') {
    return {
      ...base,
      backgroundColor: colors.buttonBg,
      color: colors.buttonText,
    };
  }

  if (variant === 'danger') {
    return {
      ...base,
      backgroundColor: 'transparent',
      color: colors.dangerText,
    };
  }

  return {
    ...base,
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    border: `1px solid ${colors.border}`,
  };
}

// ---------------------------------------------------------------------------
// Emoji grid
// ---------------------------------------------------------------------------

export function buildMemberStatusPickerEmojiGridStyle(
  colors: MemberStatusPickerColors,
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: 4,
    padding: theme.spacing.sm,
    backgroundColor: colors.inputBg,
    borderRadius: theme.radii.md,
    border: `1px solid ${colors.border}`,
    maxHeight: 160,
    overflowY: 'auto',
  };
}

export function buildMemberStatusPickerEmojiItemStyle(): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    fontSize: 18,
    cursor: 'pointer',
    borderRadius: 4,
    border: 'none',
    backgroundColor: 'transparent',
    padding: 0,
  };
}
