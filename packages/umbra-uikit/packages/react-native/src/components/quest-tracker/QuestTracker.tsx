/**
 * @module components/quest-tracker
 * @description React Native QuestTracker for the Wisp design system.
 *
 * Compact quest objective list with completion indicators and progress.
 */

import React, { forwardRef, useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type { QuestObjective, QuestTrackerSize } from '@coexist/wisp-core/types/QuestTracker.types';
import { questTrackerSizeMap } from '@coexist/wisp-core/types/QuestTracker.types';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface QuestTrackerProps {
  title: string;
  objectives: QuestObjective[];
  progress?: number;
  size?: QuestTrackerSize;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  showProgress?: boolean;
  onObjectiveClick?: (id: string) => void;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const QuestTracker = forwardRef<View, QuestTrackerProps>(
  function QuestTracker(
    {
      title,
      objectives,
      progress: controlledProgress,
      size = 'md',
      collapsible = false,
      defaultExpanded = true,
      showProgress = true,
      onObjectiveClick,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const sizeConfig = questTrackerSizeMap[size];
    const [expanded, setExpanded] = useState(defaultExpanded);

    // Auto-calculate progress if not provided
    const progress = useMemo(() => {
      if (controlledProgress !== undefined) return controlledProgress;
      const completed = objectives.filter((o) => o.status === 'complete').length;
      return objectives.length > 0 ? (completed / objectives.length) * 100 : 0;
    }, [controlledProgress, objectives]);

    const containerStyle = useMemo<ViewStyle>(() => ({
      borderRadius: defaultRadii.lg,
      borderWidth: 1,
      borderColor: themeColors.border.subtle,
      backgroundColor: themeColors.background.surface,
      overflow: 'hidden',
      width: '100%',
    }), [themeColors]);

    const headerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: defaultSpacing.lg,
      paddingVertical: defaultSpacing.lg,
    }), []);

    const titleStyle = useMemo<TextStyle>(() => ({
      fontSize: sizeConfig.titleFontSize,
      fontWeight: defaultTypography.weights.semibold,
      color: themeColors.text.primary,
    }), [sizeConfig, themeColors]);

    const progressBarBg = useMemo<ViewStyle>(() => ({
      height: 4,
      borderRadius: defaultRadii.sm,
      backgroundColor: themeColors.border.subtle,
      marginHorizontal: defaultSpacing.lg,
      marginBottom: defaultSpacing.md,
      overflow: 'hidden',
    }), [themeColors]);

    const progressBarFill = useMemo<ViewStyle>(() => ({
      height: 4,
      borderRadius: defaultRadii.sm,
      backgroundColor: themeColors.accent.primary,
      width: `${Math.min(100, Math.max(0, progress))}%`,
    }), [progress, themeColors]);

    const objectiveStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizeConfig.gap,
      paddingHorizontal: defaultSpacing.lg,
      paddingVertical: sizeConfig.gap,
    }), [sizeConfig]);

    const labelStyle = useMemo<TextStyle>(() => ({
      fontSize: sizeConfig.labelFontSize,
      color: themeColors.text.primary,
      flex: 1,
    }), [sizeConfig, themeColors]);

    const countStyle = useMemo<TextStyle>(() => ({
      fontSize: sizeConfig.labelFontSize - 1,
      color: themeColors.text.muted,
    }), [sizeConfig, themeColors]);

    const indicatorSize = sizeConfig.indicatorSize;

    return (
      <View ref={ref} style={[containerStyle, userStyle]}>
        <Pressable
          onPress={collapsible ? () => setExpanded(!expanded) : undefined}
          style={headerStyle}
        >
          <Text style={titleStyle}>{title}</Text>
          {collapsible && (
            <Text style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: themeColors.text.muted }}>
              {expanded ? '\u{25B2}' : '\u{25BC}'}
            </Text>
          )}
        </Pressable>

        {showProgress && (
          <View style={progressBarBg}>
            <View style={progressBarFill} />
          </View>
        )}

        {expanded && objectives.map((obj) => {
          const isComplete = obj.status === 'complete';
          const isInProgress = obj.status === 'in-progress';

          const indicatorStyle: ViewStyle = {
            width: indicatorSize,
            height: indicatorSize,
            borderRadius: indicatorSize / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isComplete
              ? themeColors.status.success
              : isInProgress
                ? themeColors.accent.primary + '20'
                : themeColors.border.subtle,
          };

          const checkStyle: TextStyle = {
            fontSize: indicatorSize * 0.6,
            color: isComplete ? '#FFFFFF' : themeColors.text.muted,
          };

          return (
            <Pressable
              key={obj.id}
              onPress={onObjectiveClick ? () => onObjectiveClick(obj.id) : undefined}
              style={objectiveStyle}
            >
              <View style={indicatorStyle}>
                <Text style={checkStyle}>{isComplete ? '\u{2713}' : isInProgress ? '\u{25CF}' : ''}</Text>
              </View>
              <Text style={[labelStyle, isComplete ? { textDecorationLine: 'line-through', opacity: 0.6 } : {}]}>
                {obj.label}
              </Text>
              {obj.target !== undefined && (
                <Text style={countStyle}>{obj.current ?? 0}/{obj.target}</Text>
              )}
            </Pressable>
          );
        })}

        <View style={{ height: 8 }} />
      </View>
    );
  },
);

QuestTracker.displayName = 'QuestTracker';
