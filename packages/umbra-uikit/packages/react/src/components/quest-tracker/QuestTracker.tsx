/**
 * QuestTracker — Compact quest objective list with completion indicators.
 *
 * @module components/quest-tracker
 * @example
 * ```tsx
 * <QuestTracker
 *   title="Daily Quest"
 *   objectives={[
 *     { id: '1', label: 'Log in', status: 'complete' },
 *     { id: '2', label: 'Complete 3 tasks', status: 'in-progress', current: 1, target: 3 },
 *     { id: '3', label: 'Invite a friend', status: 'incomplete' },
 *   ]}
 * />
 * ```
 */

import React, { useMemo, useState } from 'react';
import type { QuestTrackerProps, QuestObjectiveStatus } from '@coexist/wisp-core/types/QuestTracker.types';
import { questTrackerSizeMap } from '@coexist/wisp-core/types/QuestTracker.types';
import {
  buildQuestTrackerContainerStyle,
  buildQuestTrackerHeaderStyle,
  buildQuestTrackerTitleStyle,
  buildQuestTrackerChevronStyle,
  buildQuestTrackerListStyle,
  buildQuestTrackerObjectiveStyle,
  buildQuestTrackerIndicatorStyle,
  buildQuestTrackerLabelStyle,
  buildQuestTrackerCounterStyle,
  buildQuestTrackerProgressTrackStyle,
  buildQuestTrackerProgressBarStyle,
} from '@coexist/wisp-core/styles/QuestTracker.styles';
import { useTheme } from '../../providers';
import { Text } from '../../primitives/text';
import { Icon } from '../../primitives/icon';
import { Progress } from '../../primitives/progress';
import { Check, ChevronDown } from 'lucide-react';

export function QuestTracker({
  title,
  objectives,
  progress: controlledProgress,
  size = 'md',
  collapsible = false,
  defaultExpanded = true,
  showProgress = true,
  onObjectiveClick,
  className,
  style: userStyle,
}: QuestTrackerProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = questTrackerSizeMap[size];
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Auto-calculate progress from objectives if not provided
  const progress = useMemo(() => {
    if (controlledProgress !== undefined) return controlledProgress;
    const total = objectives.length;
    if (total === 0) return 0;
    const complete = objectives.filter((o) => o.status === 'complete').length;
    return Math.round((complete / total) * 100);
  }, [controlledProgress, objectives]);

  const containerStyle = useMemo(
    () => buildQuestTrackerContainerStyle(theme, sizeConfig),
    [theme, sizeConfig],
  );
  const headerStyle = useMemo(
    () => buildQuestTrackerHeaderStyle(sizeConfig, collapsible),
    [sizeConfig, collapsible],
  );
  const titleStyle = useMemo(
    () => buildQuestTrackerTitleStyle(theme, sizeConfig),
    [theme, sizeConfig],
  );
  const chevronStyle = useMemo(
    () => buildQuestTrackerChevronStyle(theme, expanded),
    [theme, expanded],
  );
  const listStyle = useMemo(
    () => buildQuestTrackerListStyle(sizeConfig),
    [sizeConfig],
  );
  const progressTrackStyle = useMemo(
    () => buildQuestTrackerProgressTrackStyle(theme),
    [theme],
  );
  const progressBarStyle = useMemo(
    () => buildQuestTrackerProgressBarStyle(theme, progress),
    [theme, progress],
  );

  return (
    <div
      className={className}
      style={{ ...containerStyle, ...userStyle } as React.CSSProperties}
    >
      {/* Progress bar at top */}
      {showProgress && (
        <Progress value={progress} size="xs" style={{ borderRadius: 0 }} />
      )}

      {/* Header */}
      <div
        style={headerStyle as React.CSSProperties}
        onClick={collapsible ? () => setExpanded((e) => !e) : undefined}
        onKeyDown={
          collapsible
            ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded((prev) => !prev); } }
            : undefined
        }
        tabIndex={collapsible ? 0 : undefined}
        role={collapsible ? 'button' : undefined}
        aria-expanded={collapsible ? expanded : undefined}
      >
        <Text as="p" size="sm" weight="semibold" style={titleStyle as React.CSSProperties}>{title}</Text>
        {collapsible && (
          <div style={chevronStyle as React.CSSProperties}>
            <Icon icon={ChevronDown} size="sm" />
          </div>
        )}
      </div>

      {/* Objectives */}
      {expanded && (
        <div style={listStyle as React.CSSProperties}>
          {objectives.map((obj) => {
            const status: QuestObjectiveStatus = obj.status || 'incomplete';
            const objStyle = buildQuestTrackerObjectiveStyle(!!onObjectiveClick, theme);
            const indicatorStyle = buildQuestTrackerIndicatorStyle(theme, sizeConfig, status);
            const labelStyle = buildQuestTrackerLabelStyle(theme, sizeConfig, status);
            const counterStyle = buildQuestTrackerCounterStyle(theme, sizeConfig);
            const hasCounter = obj.current !== undefined && obj.target !== undefined;

            return (
              <div
                key={obj.id}
                style={objStyle as React.CSSProperties}
                onClick={onObjectiveClick ? () => onObjectiveClick(obj.id) : undefined}
              >
                {/* Indicator */}
                <div style={indicatorStyle as React.CSSProperties}>
                  {status === 'complete' && (
                    <Icon icon={Check} size="xs" style={{ strokeWidth: 3 }} />
                  )}
                </div>

                {/* Label */}
                <Text size="sm" style={labelStyle as React.CSSProperties}>{obj.label}</Text>

                {/* Counter */}
                {hasCounter && (
                  <Text size="xs" weight="medium" style={counterStyle as React.CSSProperties}>
                    {obj.current}/{obj.target}
                  </Text>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

QuestTracker.displayName = 'QuestTracker';
