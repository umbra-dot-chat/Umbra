/**
 * @module components/coachmark
 * @description Style builders for the Wisp Coachmark component.
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { CoachmarkVariant, CoachmarkPlacement } from '../types/Coachmark.types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Colour resolution
// ---------------------------------------------------------------------------

/** Resolved colours for a Coachmark variant. */
export interface CoachmarkColors {
  bg: string;
  text: string;
  border: string;
  descriptionText: string;
  accent: string;
}

/**
 * Resolves colours for a given variant and theme.
 */
export function resolveCoachmarkColors(
  variant: CoachmarkVariant,
  theme: WispTheme,
): CoachmarkColors {
  const { colors: themeColors } = theme;
  switch (variant) {
    case 'info':
      return {
        bg: themeColors.background.canvas,
        text: themeColors.text.primary,
        border: themeColors.status.infoBorder,
        descriptionText: themeColors.text.secondary,
        accent: themeColors.status.info,
      };
    case 'success':
      return {
        bg: themeColors.background.canvas,
        text: themeColors.text.primary,
        border: themeColors.status.successBorder,
        descriptionText: themeColors.text.secondary,
        accent: themeColors.status.success,
      };
    case 'warning':
      return {
        bg: themeColors.background.canvas,
        text: themeColors.text.primary,
        border: themeColors.status.warningBorder,
        descriptionText: themeColors.text.secondary,
        accent: themeColors.status.warning,
      };
    case 'default':
    default:
      return {
        bg: themeColors.background.canvas,
        text: themeColors.text.primary,
        border: themeColors.border.subtle,
        descriptionText: themeColors.text.secondary,
        accent: themeColors.text.secondary,
      };
  }
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

/**
 * Builds the coachmark panel style.
 */
export function buildCoachmarkPanelStyle(
  colors: CoachmarkColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.lg,
    fontFamily: fontFamilyStacks.sans,
    maxWidth: 320,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
    animation: 'wisp-coachmark-in 200ms ease-out',
  };
}

// ---------------------------------------------------------------------------
// Arrow
// ---------------------------------------------------------------------------

const ARROW_SIZE = 8;

/**
 * Builds the arrow style for a given placement.
 */
export function buildCoachmarkArrowStyle(
  placement: CoachmarkPlacement,
  colors: CoachmarkColors,
): CSSStyleObject {
  const base: CSSStyleObject = {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
  };

  switch (placement) {
    case 'top':
      return {
        ...base,
        bottom: -ARROW_SIZE,
        left: '50%',
        transform: 'translateX(-50%)',
        borderWidth: `${ARROW_SIZE}px ${ARROW_SIZE}px 0 ${ARROW_SIZE}px`,
        borderColor: `${colors.border} transparent transparent transparent`,
      };
    case 'bottom':
      return {
        ...base,
        top: -ARROW_SIZE,
        left: '50%',
        transform: 'translateX(-50%)',
        borderWidth: `0 ${ARROW_SIZE}px ${ARROW_SIZE}px ${ARROW_SIZE}px`,
        borderColor: `transparent transparent ${colors.border} transparent`,
      };
    case 'left':
      return {
        ...base,
        right: -ARROW_SIZE,
        top: '50%',
        transform: 'translateY(-50%)',
        borderWidth: `${ARROW_SIZE}px 0 ${ARROW_SIZE}px ${ARROW_SIZE}px`,
        borderColor: `transparent transparent transparent ${colors.border}`,
      };
    case 'right':
      return {
        ...base,
        left: -ARROW_SIZE,
        top: '50%',
        transform: 'translateY(-50%)',
        borderWidth: `${ARROW_SIZE}px ${ARROW_SIZE}px ${ARROW_SIZE}px 0`,
        borderColor: `transparent ${colors.border} transparent transparent`,
      };
  }
}

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------

/**
 * Builds the title style.
 */
export function buildCoachmarkTitleStyle(
  textColor: string,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.semibold,
    lineHeight: 1.43,
    color: textColor,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Description
// ---------------------------------------------------------------------------

/**
 * Builds the description style.
 */
export function buildCoachmarkDescriptionStyle(
  descriptionColor: string,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.regular,
    lineHeight: 1.46,
    color: descriptionColor,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

/**
 * Builds the footer area style (action + dismiss buttons).
 */
export function buildCoachmarkFooterStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  };
}

// ---------------------------------------------------------------------------
// Dismiss button
// ---------------------------------------------------------------------------

/**
 * Builds the dismiss button style.
 */
export function buildCoachmarkDismissButtonStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing, typography } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${spacing.sm}px ${spacing.md}px`,
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: 1,
    borderRadius: radii.md,
    border: 'none',
    backgroundColor: 'transparent',
    color: themeColors.text.muted,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Action button
// ---------------------------------------------------------------------------

/**
 * Builds the action button style.
 */
export function buildCoachmarkActionButtonStyle(
  colors: CoachmarkColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, spacing, typography } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${spacing.sm}px ${spacing.lg}px`,
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: 1,
    borderRadius: radii.md,
    border: `1px solid ${colors.border}`,
    backgroundColor: 'transparent',
    color: colors.text,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}
