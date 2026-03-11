/**
 * @module components/quest-tracker
 * @description Style builders for the Wisp QuestTracker component.
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { QuestTrackerSizeConfig } from '../types/QuestTracker.types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildQuestTrackerContainerStyle(
  theme: WispTheme,
  sizeConfig: QuestTrackerSizeConfig,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: themeColors.background.canvas,
    border: `1px solid ${themeColors.border.subtle}`,
    borderRadius: radii.lg,
    fontFamily: fontFamilyStacks.sans,
    overflow: 'hidden',
  };
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export function buildQuestTrackerHeaderStyle(
  sizeConfig: QuestTrackerSizeConfig,
  collapsible: boolean,
): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: sizeConfig.padding,
    cursor: collapsible ? 'pointer' : 'default',
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------

export function buildQuestTrackerTitleStyle(
  theme: WispTheme,
  sizeConfig: QuestTrackerSizeConfig,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: sizeConfig.titleFontSize,
    fontWeight: typography.weights.semibold,
    lineHeight: 1.4,
    color: themeColors.text.primary,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Chevron
// ---------------------------------------------------------------------------

export function buildQuestTrackerChevronStyle(
  theme: WispTheme,
  expanded: boolean,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: themeColors.text.muted,
    transition: `transform ${durations.normal}ms ${easings.easeOut.css}`,
    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
  };
}

// ---------------------------------------------------------------------------
// Objective list
// ---------------------------------------------------------------------------

export function buildQuestTrackerListStyle(
  sizeConfig: QuestTrackerSizeConfig,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: sizeConfig.gap,
    padding: `0 ${sizeConfig.padding.split(' ')[1]} ${sizeConfig.padding.split(' ')[0]}`,
  };
}

// ---------------------------------------------------------------------------
// Objective row
// ---------------------------------------------------------------------------

export function buildQuestTrackerObjectiveStyle(
  clickable: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    cursor: clickable ? 'pointer' : 'default',
  };
}

// ---------------------------------------------------------------------------
// Indicator
// ---------------------------------------------------------------------------

export function buildQuestTrackerIndicatorStyle(
  theme: WispTheme,
  sizeConfig: QuestTrackerSizeConfig,
  status: 'incomplete' | 'complete' | 'in-progress',
): CSSStyleObject {
  const { colors: themeColors } = theme;
  const base: CSSStyleObject = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: sizeConfig.indicatorSize,
    height: sizeConfig.indicatorSize,
    borderRadius: sizeConfig.indicatorSize / 2,
  };

  switch (status) {
    case 'complete':
      return {
        ...base,
        backgroundColor: themeColors.status.success,
        color: themeColors.text.inverse,
      };
    case 'in-progress':
      return {
        ...base,
        border: `2px solid ${themeColors.status.info}`,
        backgroundColor: 'transparent',
        color: themeColors.status.info,
      };
    case 'incomplete':
    default:
      return {
        ...base,
        border: `2px solid ${themeColors.border.subtle}`,
        backgroundColor: 'transparent',
        color: 'transparent',
      };
  }
}

// ---------------------------------------------------------------------------
// Objective label
// ---------------------------------------------------------------------------

export function buildQuestTrackerLabelStyle(
  theme: WispTheme,
  sizeConfig: QuestTrackerSizeConfig,
  status: 'incomplete' | 'complete' | 'in-progress',
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: sizeConfig.labelFontSize,
    fontWeight: typography.weights.regular,
    lineHeight: 1.43,
    color: status === 'complete' ? themeColors.text.muted : themeColors.text.primary,
    textDecoration: status === 'complete' ? 'line-through' : 'none',
    margin: 0,
    flex: 1,
    minWidth: 0,
  };
}

// ---------------------------------------------------------------------------
// Counter text
// ---------------------------------------------------------------------------

export function buildQuestTrackerCounterStyle(
  theme: WispTheme,
  sizeConfig: QuestTrackerSizeConfig,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: sizeConfig.labelFontSize - 1,
    fontWeight: typography.weights.medium,
    color: themeColors.text.muted,
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

export function buildQuestTrackerProgressTrackStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    width: '100%',
    height: 4,
    backgroundColor: themeColors.border.subtle,
    borderRadius: 0,
  };
}

export function buildQuestTrackerProgressBarStyle(
  theme: WispTheme,
  progress: number,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    width: `${Math.min(Math.max(progress, 0), 100)}%`,
    height: '100%',
    backgroundColor: themeColors.status.success,
    transition: `width ${durations.slow}ms ${easings.easeOut.css}`,
  };
}
