/**
 * @module ProgressSteps
 */
import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { ProgressStepsSizeConfig, ProgressStepsOrientation } from '../types/ProgressSteps.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildStepsContainerStyle(
  orientation: ProgressStepsOrientation,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
    alignItems: orientation === 'horizontal' ? 'flex-start' : 'stretch',
    fontFamily: fontFamilyStacks.sans,
    width: orientation === 'horizontal' ? '100%' : undefined,
  };
}

// ---------------------------------------------------------------------------
// Step wrapper
// ---------------------------------------------------------------------------

export function buildStepWrapperStyle(
  orientation: ProgressStepsOrientation,
  isLast: boolean,
): CSSStyleObject {
  if (orientation === 'horizontal') {
    return {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      flex: 1,
      position: 'relative',
    };
  }
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    paddingBottom: isLast ? 0 : 24,
  };
}

// ---------------------------------------------------------------------------
// Dot / circle
// ---------------------------------------------------------------------------

export type StepStatus = 'completed' | 'active' | 'upcoming';

export function buildStepDotStyle(
  sizeConfig: ProgressStepsSizeConfig,
  status: StepStatus,
  theme: WispTheme,
  clickable: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii, typography } = theme;
  let bg: string;
  let borderColor: string;
  let textColor: string;

  switch (status) {
    case 'completed':
      bg = themeColors.accent.primary;
      borderColor = 'transparent';
      textColor = themeColors.text.inverse;
      break;
    case 'active':
      bg = 'transparent';
      borderColor = themeColors.accent.primary;
      textColor = themeColors.accent.primary;
      break;
    case 'upcoming':
    default:
      bg = 'transparent';
      borderColor = themeColors.border.strong;
      textColor = themeColors.text.muted;
      break;
  }

  return {
    width: sizeConfig.dotSize,
    height: sizeConfig.dotSize,
    borderRadius: radii.full,
    backgroundColor: bg,
    border: `2px solid ${borderColor}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: textColor,
    fontSize: sizeConfig.labelFontSize,
    fontWeight: typography.weights.semibold,
    cursor: clickable ? 'pointer' : 'default',
    boxSizing: 'border-box',
    transition: `background-color ${durations.normal}ms ${easings.easeOut.css}, border-color ${durations.normal}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Connector line
// ---------------------------------------------------------------------------

export function buildConnectorStyle(
  sizeConfig: ProgressStepsSizeConfig,
  orientation: ProgressStepsOrientation,
  isCompleted: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  const color = isCompleted ? themeColors.accent.primary : themeColors.border.strong;

  if (orientation === 'horizontal') {
    const gap = 2;
    const offset = sizeConfig.dotSize / 2 + gap;
    return {
      position: 'absolute',
      top: sizeConfig.dotSize / 2 - sizeConfig.lineThickness / 2,
      left: `calc(50% + ${offset}px)`,
      width: `calc(100% - ${offset * 2}px)`,
      height: sizeConfig.lineThickness,
      backgroundColor: color,
      transition: `background-color ${durations.normal}ms ${easings.easeOut.css}`,
    };
  }
  return {
    position: 'absolute',
    left: sizeConfig.dotSize / 2 - sizeConfig.lineThickness / 2,
    top: sizeConfig.dotSize + 4,
    bottom: 4,
    width: sizeConfig.lineThickness,
    backgroundColor: color,
    transition: `background-color ${durations.normal}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

export function buildStepLabelStyle(
  sizeConfig: ProgressStepsSizeConfig,
  status: StepStatus,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    fontSize: sizeConfig.labelFontSize,
    fontWeight: status === 'active' ? 600 : 500,
    lineHeight: 1.4,
    color: status === 'upcoming' ? themeColors.text.muted : themeColors.text.primary,
    margin: 0,
    transition: `color ${durations.normal}ms ${easings.easeOut.css}`,
  };
}

export function buildStepDescriptionStyle(
  sizeConfig: ProgressStepsSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing, typography } = theme;
  return {
    fontSize: sizeConfig.descriptionFontSize,
    fontWeight: typography.weights.regular,
    lineHeight: 1.4,
    color: themeColors.text.muted,
    margin: 0,
    marginTop: spacing['2xs'],
  };
}
