/**
 * @module components/member-list
 * @description React Native MemberList for the Wisp design system.
 *
 * Reuses color resolution from `@coexist/wisp-core`. Renders via `<View>` + `<Text>`.
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import type { GestureResponderEvent, ViewProps, ViewStyle, TextStyle } from 'react-native';

/**
 * Creates a web-compatible onContextMenu handler that maps right-click
 * to the same handler used for mobile long-press.
 * Returns undefined on non-web platforms.
 */
function webContextMenu(handler: ((e: GestureResponderEvent) => void) | undefined) {
  if (Platform.OS !== 'web' || !handler) return undefined;
  return (e: any) => {
    e.preventDefault();
    const syntheticEvent = {
      nativeEvent: {
        pageX: e.clientX ?? e.pageX ?? 0,
        pageY: e.clientY ?? e.pageY ?? 0,
        locationX: 0,
        locationY: 0,
        target: e.target,
        identifier: 0,
        timestamp: Date.now(),
      },
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation(),
    } as unknown as GestureResponderEvent;
    handler(syntheticEvent);
  };
}
import type {
  MemberListMember,
  MemberListSection,
} from '@coexist/wisp-core/types/MemberList.types';
import {
  resolveMemberListColors,
} from '@coexist/wisp-core/styles/MemberList.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import Svg, { Line, Path } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Props (RN-specific — extends ViewProps instead of HTMLAttributes)
// ---------------------------------------------------------------------------

export interface MemberListProps extends ViewProps {
  /** Grouped sections of members. */
  sections: MemberListSection[];
  /** Called when a member item is pressed. */
  onMemberClick?: (member: MemberListMember, event: GestureResponderEvent) => void;
  /** Called when a member item is long-pressed (e.g. context menu). */
  onMemberLongPress?: (member: MemberListMember, event: GestureResponderEvent) => void;
  /** Panel title. @default 'Members' */
  title?: string;
  /** Called when the close button is pressed. If omitted, no close button. */
  onClose?: () => void;
  /** Whether the panel is in a loading state. @default false */
  loading?: boolean;
  /** Show loading skeleton. @default false */
  skeleton?: boolean;
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function CloseIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Line x1={18} y1={6} x2={6} y2={18} />
      <Line x1={6} y1={6} x2={18} y2={18} />
    </Svg>
  );
}

function ChevronIcon({ size = 12, color, collapsed }: { size?: number; color?: string; collapsed: boolean }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: [{ rotate: collapsed ? '-90deg' : '0deg' }],
      }}
    >
      <Path d="M6 9l6 6 6-6" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Default Avatar
// ---------------------------------------------------------------------------

function DefaultAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
        {initials}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function MemberListSkeleton({
  colors,
  userStyle,
}: {
  colors: ReturnType<typeof resolveMemberListColors>;
  userStyle?: ViewStyle;
}) {
  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.bg,
  };

  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: defaultSpacing.sm,
    paddingHorizontal: defaultSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 56,
  };

  const barBase: ViewStyle = {
    backgroundColor: colors.border,
    borderRadius: 4,
    opacity: 0.5,
  };

  return (
    <View
      accessibilityElementsHidden
      style={[containerStyle, userStyle]}
    >
      {/* Skeleton header */}
      <View style={headerStyle}>
        <View style={[barBase, { width: 80, height: 14 }]} />
        <View style={[barBase, { width: 28, height: 28, borderRadius: 14 }]} />
      </View>

      {/* Skeleton body */}
      <View style={{ flex: 1, paddingVertical: defaultSpacing.xs }}>
        {/* Skeleton section label */}
        <View style={{ paddingVertical: defaultSpacing.xs, paddingHorizontal: defaultSpacing.md }}>
          <View style={[barBase, { width: 100, height: 10 }]} />
        </View>
        {Array.from({ length: 5 }, (_, i) => (
          <View
            key={`skeleton-member-${i}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: defaultSpacing.sm,
              paddingVertical: defaultSpacing.xs,
              paddingHorizontal: defaultSpacing.md,
            }}
          >
            <View style={[barBase, { width: 32, height: 32, borderRadius: 16 }]} />
            <View style={{ flex: 1, gap: 4 }}>
              <View style={[barBase, { width: `${60 + (i % 3) * 15}%` as unknown as number, height: 12 }]} />
              <View style={[barBase, { width: `${40 + (i % 2) * 20}%` as unknown as number, height: 10 }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Status dot color resolver
// ---------------------------------------------------------------------------

function resolveStatusDotColor(
  status: 'online' | 'idle' | 'dnd' | 'offline' | undefined,
  colors: ReturnType<typeof resolveMemberListColors>,
): string {
  switch (status) {
    case 'online':
      return colors.statusOnline;
    case 'idle':
      return colors.statusIdle;
    case 'dnd':
      return colors.statusDnd;
    case 'offline':
    default:
      return colors.statusOffline;
  }
}

// ---------------------------------------------------------------------------
// MemberList
// ---------------------------------------------------------------------------

/**
 * MemberList -- Side panel showing grouped user lists with online/offline status.
 *
 * @remarks
 * Displays collapsible sections of members with avatars, status dots,
 * role text, and press interaction. Supports loading and skeleton states.
 *
 * @example
 * ```tsx
 * <MemberList
 *   sections={[
 *     { id: 'online', label: 'Online', members: [...] },
 *     { id: 'offline', label: 'Offline', members: [...], collapsed: true },
 *   ]}
 *   onMemberClick={(member) => openProfile(member.id)}
 *   onClose={() => setOpen(false)}
 * />
 * ```
 */
export const MemberList = forwardRef<View, MemberListProps>(
  function MemberList(
    {
      sections,
      onMemberClick,
      onMemberLongPress,
      title = 'Members',
      onClose,
      loading = false,
      skeleton = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveMemberListColors(theme),
      [theme],
    );

    // Track collapsed state per section, initialized from section.collapsed
    const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>(() => {
      const initial: Record<string, boolean> = {};
      for (const section of sections) {
        initial[section.id] = section.collapsed ?? false;
      }
      return initial;
    });

    const toggleSection = useCallback((sectionId: string) => {
      setCollapsedMap((prev) => ({
        ...prev,
        [sectionId]: !prev[sectionId],
      }));
    }, []);

    const handleMemberClick = useCallback(
      (member: MemberListMember, event: GestureResponderEvent) => {
        onMemberClick?.(member, event);
      },
      [onMemberClick],
    );

    const handleMemberLongPress = useCallback(
      (member: MemberListMember, event: GestureResponderEvent) => {
        onMemberLongPress?.(member, event);
      },
      [onMemberLongPress],
    );

    // -- Skeleton early return ------------------------------------------------

    if (skeleton) {
      return (
        <MemberListSkeleton
          colors={colors}
          userStyle={userStyle as ViewStyle}
        />
      );
    }

    // -- Styles ---------------------------------------------------------------

    const containerStyle: ViewStyle = {
      flex: 1,
      backgroundColor: colors.bg,
    };

    const headerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexShrink: 0,
      minHeight: 56,
    };

    const titleTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.headerText,
    };

    const closeButtonStyle: ViewStyle = {
      width: 28,
      height: 28,
      borderRadius: defaultRadii.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    };

    const sectionHeaderStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.xs,
      paddingVertical: defaultSpacing.xs,
      paddingHorizontal: defaultSpacing.md,
    };

    const sectionLabelStyle: TextStyle = {
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.sectionLabel,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    };

    const memberItemStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.sm,
      paddingVertical: defaultSpacing.xs,
      paddingHorizontal: defaultSpacing.md,
      borderRadius: defaultRadii.sm,
      marginHorizontal: defaultSpacing.xs,
    };

    const memberNameStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: colors.memberText,
    };

    const memberRoleTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      fontWeight: String(defaultTypography.weights.regular) as TextStyle['fontWeight'],
      color: colors.memberTextSecondary,
    };

    const loadingViewStyle: ViewStyle = {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: defaultSpacing.xl,
    };

    const loadingTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      color: colors.loadingText,
    };

    return (
      <View
        ref={ref}
        accessibilityRole="summary"
        accessibilityLabel={title}
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        {/* Header */}
        <View style={headerStyle}>
          <Text style={titleTextStyle}>{title}</Text>
          {onClose && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close member list"
              onPress={onClose}
              style={closeButtonStyle}
            >
              <CloseIcon size={16} color={colors.headerTextMuted} />
            </Pressable>
          )}
        </View>

        {/* Body */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: defaultSpacing.xs, flexDirection: 'column' }}>
          {/* Loading */}
          {loading && (
            <View style={loadingViewStyle}>
              <Text style={loadingTextStyle}>Loading members...</Text>
            </View>
          )}

          {/* Sections */}
          {!loading &&
            sections.map((section) => {
              const isCollapsed = collapsedMap[section.id] ?? false;

              return (
                <View
                  key={section.id}
                  accessibilityRole="summary"
                  accessibilityLabel={section.label}
                >
                  {/* Section header */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${section.label}, ${section.members.length} members`}
                    accessibilityState={{ expanded: !isCollapsed }}
                    onPress={() => toggleSection(section.id)}
                    style={sectionHeaderStyle}
                  >
                    <ChevronIcon
                      size={12}
                      color={section.labelColor ?? colors.sectionLabel}
                      collapsed={isCollapsed}
                    />
                    <Text style={[sectionLabelStyle, section.labelColor ? { color: section.labelColor } : undefined]}>
                      {section.label} ({section.members.length})
                    </Text>
                  </Pressable>

                  {/* Member items */}
                  {!isCollapsed &&
                    section.members.map((member) => {
                      const dotColor = resolveStatusDotColor(member.status, colors);
                      // Web context menu for member right-click
                      const memberCtxHandler = onMemberLongPress
                        ? webContextMenu((e) => onMemberLongPress(member, e))
                        : undefined;
                      const memberWebProps = memberCtxHandler
                        ? { onContextMenu: memberCtxHandler } as any
                        : {};

                      return (
                        <Pressable
                          key={member.id}
                          accessibilityRole="button"
                          accessibilityLabel={`${member.name}${member.status ? `, ${member.status}` : ''}`}
                          onPress={(e) => handleMemberClick(member, e)}
                          onLongPress={(e) => handleMemberLongPress(member, e)}
                          style={memberItemStyle}
                          {...memberWebProps}
                        >
                          {/* Avatar + status dot */}
                          <View style={{ position: 'relative', flexShrink: 0 }}>
                            {member.avatar || <DefaultAvatar name={member.name} />}
                            {member.status && (
                              <View
                                style={{
                                  position: 'absolute',
                                  bottom: -1,
                                  right: -1,
                                  width: 10,
                                  height: 10,
                                  borderRadius: 5,
                                  backgroundColor: dotColor,
                                  borderWidth: 2,
                                  borderColor: colors.bg,
                                }}
                              />
                            )}
                          </View>

                          {/* Text */}
                          <View style={{ flex: 1, flexDirection: 'column', minWidth: 0 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              {member.roleIcon && (
                                <View style={{ width: 14, height: 14, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
                                  {member.roleIcon}
                                </View>
                              )}
                              <Text
                                style={[
                                  memberNameStyle,
                                  member.roleColor ? { color: member.roleColor } : undefined,
                                ]}
                                numberOfLines={1}
                              >
                                {member.name}
                              </Text>
                            </View>
                            {(member.roleText || member.statusText) && (
                              <Text style={memberRoleTextStyle} numberOfLines={1}>
                                {member.roleText || member.statusText}
                              </Text>
                            )}
                          </View>
                        </Pressable>
                      );
                    })}
                </View>
              );
            })}
        </ScrollView>
      </View>
    );
  },
);

MemberList.displayName = 'MemberList';
