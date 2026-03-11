/**
 * @module components/channel-header
 * @description React Native ChannelHeader for the Wisp design system.
 *
 * Reuses color resolution from `@coexist/wisp-core`. Renders via `<View>` + `<Text>`.
 * Header bar for active community channels with name, topic, and actions.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type {
  ChannelHeaderType,
  ChannelHeaderAction,
} from '@coexist/wisp-core/types/ChannelHeader.types';
import { resolveChannelHeaderColors } from '@coexist/wisp-core/styles/ChannelHeader.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import Svg, { Line, Path, Circle, Polyline, Rect } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Props (RN-specific override — ViewProps instead of HTMLAttributes)
// ---------------------------------------------------------------------------

export interface ChannelHeaderProps extends ViewProps {
  /** Channel display name. */
  name: string;
  /** Channel type (determines the leading icon). @default 'text' */
  type?: ChannelHeaderType;
  /** Channel topic / description text. */
  topic?: string;
  /** Action buttons displayed on the right side of the header. */
  actions?: ChannelHeaderAction[];
  /** Whether the channel is E2EE enabled (shows a lock icon). @default false */
  encrypted?: boolean;
  /** Whether slow mode is active (shows a clock icon). @default false */
  slowMode?: boolean;
  /** Custom icon override (replaces the type-based icon). */
  icon?: React.ReactNode;
  /** Called when the channel name / topic area is pressed (e.g. to edit). */
  onTopicClick?: () => void;
  /** Show loading skeleton. @default false */
  skeleton?: boolean;
}

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------

function HashIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={4} y1={9} x2={20} y2={9} />
      <Line x1={4} y1={15} x2={20} y2={15} />
      <Line x1={10} y1={3} x2={8} y2={21} />
      <Line x1={16} y1={3} x2={14} y2={21} />
    </Svg>
  );
}

function SpeakerIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11 5L6 9H2v6h4l5 4V5z" />
      <Path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <Path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </Svg>
  );
}

function MegaphoneIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 11l18-5v12L3 13v-2z" />
      <Path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </Svg>
  );
}

function FolderOpenIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 14l1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />
    </Svg>
  );
}

function ClipboardListIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect width={8} height={4} x={8} y={2} rx={1} ry={1} />
      <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <Line x1={12} y1={11} x2={16} y2={11} />
      <Line x1={12} y1={16} x2={16} y2={16} />
    </Svg>
  );
}

function HeartIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </Svg>
  );
}

function MessageSquareIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

function MessagesIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" />
      <Path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
    </Svg>
  );
}

function LockIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect width={18} height={11} x={3} y={11} rx={2} ry={2} />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  );
}

function ClockIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={10} />
      <Polyline points="12,6 12,12 16,14" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Channel type icon map
// ---------------------------------------------------------------------------

function ChannelTypeIcon({
  type,
  size,
  color,
}: {
  type: ChannelHeaderType;
  size?: number;
  color?: string;
}) {
  switch (type) {
    case 'voice':
      return <SpeakerIcon size={size} color={color} />;
    case 'announcement':
      return <MegaphoneIcon size={size} color={color} />;
    case 'files':
      return <FolderOpenIcon size={size} color={color} />;
    case 'bulletin':
      return <ClipboardListIcon size={size} color={color} />;
    case 'welcome':
      return <HeartIcon size={size} color={color} />;
    case 'thread':
      return <MessageSquareIcon size={size} color={color} />;
    case 'forum':
      return <MessagesIcon size={size} color={color} />;
    case 'text':
    default:
      return <HashIcon size={size} color={color} />;
  }
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ChannelHeaderSkeleton({
  skeletonColor,
}: {
  skeletonColor: string;
}) {
  const nameStyle: ViewStyle = {
    height: 16,
    width: 120,
    borderRadius: defaultRadii.sm,
    backgroundColor: skeletonColor,
  };

  const topicStyle: ViewStyle = {
    height: 12,
    width: 200,
    borderRadius: defaultRadii.sm,
    backgroundColor: skeletonColor,
    flex: 1,
    maxWidth: 200,
  };

  const actionStyle: ViewStyle = {
    height: 24,
    width: 24,
    borderRadius: defaultRadii.md,
    backgroundColor: skeletonColor,
  };

  return (
    <>
      <View style={nameStyle} />
      <View style={topicStyle} />
      <View style={{ flexDirection: 'row', gap: defaultSpacing['2xs'], marginLeft: 'auto' }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={actionStyle} />
        ))}
      </View>
    </>
  );
}

// ---------------------------------------------------------------------------
// ChannelHeader
// ---------------------------------------------------------------------------

/**
 * ChannelHeader -- Header bar for an active channel (React Native).
 *
 * @remarks
 * Renders a horizontal bar with the channel type icon, name, optional
 * encrypted/slow-mode indicators, a topic description, and action buttons.
 *
 * @example
 * ```tsx
 * <ChannelHeader
 *   name="general"
 *   type="text"
 *   topic="General discussion for the team"
 * />
 * ```
 */
export const ChannelHeader = forwardRef<View, ChannelHeaderProps>(
  function ChannelHeader(
    {
      name,
      type = 'text',
      topic,
      actions,
      encrypted = false,
      slowMode = false,
      icon: customIcon,
      onTopicClick,
      skeleton = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    // ----- Colors -----
    const colors = useMemo(
      () => resolveChannelHeaderColors(theme),
      [theme],
    );

    // ----- Styles -----
    const containerStyle: ViewStyle = useMemo(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      height: 56,
      minHeight: 56,
      paddingLeft: defaultSpacing.lg,
      paddingRight: defaultSpacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bg,
      width: '100%',
      gap: defaultSpacing.sm,
    }), [colors.border, colors.bg]);

    const nameContainerStyle: ViewStyle = useMemo(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.xs,
      flexShrink: 0,
    }), []);

    const nameTextStyle: TextStyle = useMemo(() => ({
      fontSize: defaultTypography.sizes.base.fontSize,
      lineHeight: defaultTypography.sizes.base.lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.nameText,
    }), [colors.nameText]);

    const topicTextStyle: TextStyle = useMemo(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      fontWeight: String(defaultTypography.weights.regular) as TextStyle['fontWeight'],
      color: colors.topicText,
      flex: 1,
      paddingLeft: defaultSpacing.sm,
    }), [colors.topicText]);

    const dividerViewStyle: ViewStyle = useMemo(() => ({
      width: 1,
      height: 24,
      backgroundColor: colors.divider,
      marginHorizontal: defaultSpacing.xs,
    }), [colors.divider]);

    const actionsContainerStyle: ViewStyle = useMemo(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing['2xs'],
      marginLeft: 'auto',
    }), []);

    const actionButtonStyle: ViewStyle = useMemo(() => ({
      width: 32,
      height: 32,
      borderRadius: defaultRadii.md,
      alignItems: 'center',
      justifyContent: 'center',
    }), []);

    return (
      <View
        ref={ref}
        accessibilityRole="header"
        accessibilityLabel={`${name} channel header`}
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        {skeleton ? (
          <ChannelHeaderSkeleton skeletonColor={colors.skeleton} />
        ) : (
          <>
            {/* Name area: icon + name + indicators */}
            <View style={nameContainerStyle}>
              {/* Channel type icon */}
              <View style={{ alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {customIcon ?? (
                  <ChannelTypeIcon type={type} size={20} color={colors.iconColor} />
                )}
              </View>

              {/* Channel name */}
              <Text style={nameTextStyle} numberOfLines={1}>{name}</Text>

              {/* Encrypted indicator */}
              {encrypted && (
                <View accessibilityLabel="End-to-end encrypted" style={{ flexShrink: 0 }}>
                  <LockIcon size={14} color={colors.iconColor} />
                </View>
              )}

              {/* Slow mode indicator */}
              {slowMode && (
                <View accessibilityLabel="Slow mode enabled" style={{ flexShrink: 0 }}>
                  <ClockIcon size={14} color={colors.iconColor} />
                </View>
              )}
            </View>

            {/* Topic */}
            {topic && (
              <>
                <View style={dividerViewStyle} />
                <Pressable
                  onPress={onTopicClick}
                  disabled={!onTopicClick}
                  style={{ flex: 1, minWidth: 0 }}
                  accessibilityRole="text"
                  accessibilityLabel={topic}
                >
                  <Text style={topicTextStyle} numberOfLines={1}>
                    {topic}
                  </Text>
                </Pressable>
              </>
            )}

            {/* Actions */}
            {actions && actions.length > 0 && (
              <View style={actionsContainerStyle}>
                {actions.map((action: ChannelHeaderAction) => (
                  <Pressable
                    key={action.key}
                    accessibilityRole="button"
                    accessibilityLabel={action.label}
                    accessibilityState={{ disabled: action.disabled }}
                    disabled={action.disabled}
                    onPress={action.onClick}
                    style={[
                      actionButtonStyle,
                      {
                        backgroundColor: action.active ? colors.actionHoverBg : 'transparent',
                        opacity: action.disabled ? 0.5 : 1,
                      },
                    ]}
                  >
                    {action.icon}
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    );
  },
);

ChannelHeader.displayName = 'ChannelHeader';
