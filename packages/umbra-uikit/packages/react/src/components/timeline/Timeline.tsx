/**
 * @module Timeline
 */
import React, { forwardRef, useMemo } from 'react';
import type { TimelineProps, TimelineStatus } from '@coexist/wisp-core/types/Timeline.types';
import { timelineSizeMap } from '@coexist/wisp-core/types/Timeline.types';
import {
  buildTimelineContainerStyle,
  buildTimelineItemStyle,
  buildTimelineDotContainerStyle,
  buildTimelineDotStyle,
  buildTimelineLineStyle,
  buildTimelineContentStyle,
  buildTimelineTitleStyle,
  buildTimelineDescriptionStyle,
  buildTimelineTimestampStyle,
  buildTimelineSkeletonStyle,
  buildTimelineSkeletonItemStyle,
  buildTimelineSkeletonDotStyle,
  buildTimelineSkeletonLineStyle,
  buildTimelineSkeletonLineShortStyle,
} from '@coexist/wisp-core/styles/Timeline.styles';
import { useTheme } from '../../providers';

/**
 * Timeline — Chronological event display for the Wisp design system.
 *
 * @remarks
 * Displays a sequence of events with status indicators, connector lines,
 * optional icons, descriptions, and timestamps. Supports vertical and
 * horizontal orientations, skeleton loading, and custom colors.
 *
 * @example
 * ```tsx
 * <Timeline
 *   items={[
 *     { id: '1', title: 'Order placed', status: 'completed' },
 *     { id: '2', title: 'Processing', status: 'active' },
 *     { id: '3', title: 'Shipped', status: 'pending' },
 *   ]}
 * />
 * ```
 */
export const Timeline = forwardRef<HTMLDivElement, TimelineProps>(function Timeline(
  {
    items,
    size = 'md',
    orientation = 'vertical',
    skeleton = false,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = timelineSizeMap[size];

  const containerStyle = useMemo(
    () => buildTimelineContainerStyle(orientation),
    [orientation],
  );

  if (skeleton) {
    const skeletonContainerStyle = buildTimelineSkeletonStyle(theme);
    return (
      <div
        aria-hidden
        data-testid="timeline-skeleton"
        className={className}
        style={{ ...skeletonContainerStyle, ...userStyle }}
      >
        {[0, 1, 2].map((i) => (
          <div key={i} style={buildTimelineSkeletonItemStyle(sizeConfig, theme)}>
            <div style={buildTimelineSkeletonDotStyle(sizeConfig, theme)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: sizeConfig.contentGap, flex: 1 }}>
              <div style={buildTimelineSkeletonLineStyle(sizeConfig, theme)} />
              <div style={buildTimelineSkeletonLineShortStyle(sizeConfig, theme)} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="list"
      aria-label="Timeline"
      className={className}
      style={{ ...containerStyle, ...userStyle }}
      {...rest}
    >
      {items.map((item, i) => {
        const status: TimelineStatus = item.status ?? 'completed';
        const isLast = i === items.length - 1;
        const ItemIcon = item.icon;

        const itemStyle = buildTimelineItemStyle(sizeConfig, orientation);
        const dotContainerStyle = buildTimelineDotContainerStyle(sizeConfig, orientation);
        const dotStyle = buildTimelineDotStyle(sizeConfig, theme, status, item.color);
        const lineStyle = buildTimelineLineStyle(sizeConfig, theme, isLast, orientation);
        const contentStyle = buildTimelineContentStyle(sizeConfig, theme, orientation, isLast);
        const titleStyle = buildTimelineTitleStyle(sizeConfig, theme, status);
        const descStyle = item.description ? buildTimelineDescriptionStyle(sizeConfig, theme) : undefined;
        const timestampStyle = item.timestamp ? buildTimelineTimestampStyle(sizeConfig, theme) : undefined;

        const iconColor = status === 'pending' ? themeColors.text.muted : '#FFFFFF';
        const iconSize = Math.round(sizeConfig.dotSize * 0.6);

        if (orientation === 'horizontal') {
          return (
            <div key={item.id} role="listitem" style={itemStyle}>
              {/* Dot row with connector */}
              <div style={dotContainerStyle}>
                <div style={dotStyle}>
                  {ItemIcon && sizeConfig.dotSize >= 16 && (
                    <ItemIcon size={iconSize} color={iconColor} strokeWidth={2} />
                  )}
                </div>
                {/* Connector line */}
                {!isLast && <div style={lineStyle} />}
              </div>

              {/* Content */}
              <div style={contentStyle}>
                <div style={titleStyle}>{item.title}</div>
                {item.description && <div style={descStyle}>{item.description}</div>}
                {item.timestamp && <div style={timestampStyle}>{item.timestamp}</div>}
              </div>
            </div>
          );
        }

        // Vertical orientation
        return (
          <div key={item.id} role="listitem" style={itemStyle}>
            {/* Dot column with connector */}
            <div style={dotContainerStyle}>
              <div style={dotStyle}>
                {ItemIcon && sizeConfig.dotSize >= 16 && (
                  <ItemIcon size={iconSize} color={iconColor} strokeWidth={2} />
                )}
              </div>
              {/* Connector line */}
              {!isLast && <div style={lineStyle} />}
            </div>

            {/* Content */}
            <div style={contentStyle}>
              <div style={titleStyle}>{item.title}</div>
              {item.description && <div style={descStyle}>{item.description}</div>}
              {item.timestamp && <div style={timestampStyle}>{item.timestamp}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
});

Timeline.displayName = 'Timeline';
