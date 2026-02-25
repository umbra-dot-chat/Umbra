/**
 * NavigationRail — Thin vertical icon bar on the far left of the app.
 *
 * Shows:
 * - Home button (navigate to DMs/conversations)
 * - Divider
 * - Community icons (rounded squares, one per community)
 * - Create community button (+ icon)
 *
 * When `loading` is true, shows skeleton placeholders instead of community icons.
 *
 * Similar to Discord's "guild sidebar" / server rail.
 */

import React from 'react';
import { Animated, Image, Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text, Skeleton, useTheme, NotificationBadge } from '@coexist/wisp-react-native';
import { UmbraIcon, FolderIcon, PlusIcon, SettingsIcon, BellIcon } from '@/components/icons';
import type { Community } from '@umbra/service';
import { useAnimatedToggle } from '@/hooks/useAnimatedToggle';

// Default community icon — the colored Umbra ghost app icon
// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultCommunityIcon = require('@/assets/images/icon.png');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RAIL_WIDTH = 64;
const ICON_SIZE = 40;
const ICON_RADIUS = 12;
const ACTIVE_INDICATOR_WIDTH = 4;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface NavigationRailProps {
  /** Whether the home/DM view is active */
  isHomeActive: boolean;
  /** Navigate to home (conversations) */
  onHomePress: () => void;
  /** Whether the Files page is active */
  isFilesActive?: boolean;
  /** Navigate to the Files page */
  onFilesPress?: () => void;
  /** Upload progress ring value (0-100) */
  uploadRingProgress?: number;
  /** User's communities */
  communities: Community[];
  /** Currently active community ID */
  activeCommunityId?: string | null;
  /** Navigate to a community */
  onCommunityPress: (communityId: string) => void;
  /** Open community creation dialog */
  onCreateCommunity: () => void;
  /** Open settings dialog */
  onOpenSettings?: () => void;
  /** Current user's avatar (base64 data URI) */
  userAvatar?: string;
  /** Current user's display name (for initial fallback) */
  userDisplayName?: string;
  /** Called when the user avatar bubble is pressed */
  onAvatarPress?: () => void;
  /** Whether community data is still loading */
  loading?: boolean;
  /** Aggregated notification count for the home badge (shown when not on home) */
  homeNotificationCount?: number;
  /** Notification bell badge count (total unread notifications) */
  notificationCount?: number;
  /** Called when the notification bell is pressed */
  onNotificationsPress?: () => void;
  /** Safe area top inset passed from parent layout. @default 0 */
  safeAreaTop?: number;
  /** Safe area bottom inset passed from parent layout. @default 0 */
  safeAreaBottom?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NavigationRail({
  isHomeActive,
  onHomePress,
  isFilesActive,
  onFilesPress,
  uploadRingProgress,
  communities,
  activeCommunityId,
  onCommunityPress,
  onCreateCommunity,
  onOpenSettings,
  userAvatar,
  userDisplayName,
  onAvatarPress,
  loading,
  homeNotificationCount,
  notificationCount,
  onNotificationsPress,
  safeAreaTop = 0,
  safeAreaBottom = 0,
}: NavigationRailProps) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        width: RAIL_WIDTH,
        backgroundColor: theme.colors.background.surface,
        borderRightWidth: 1,
        borderRightColor: theme.colors.border.subtle,
        paddingTop: safeAreaTop + 20,
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      {/* Home button */}
      <RailItem
        active={isHomeActive}
        onPress={onHomePress}
        accentColor={theme.colors.accent.primary}
        theme={theme}
        badgeCount={!isHomeActive && homeNotificationCount ? homeNotificationCount : undefined}
      >
        <UmbraIcon
          size={22}
          color={isHomeActive ? theme.colors.text.inverse : theme.colors.text.secondary}
        />
      </RailItem>

      {/* Files button — between Home and Communities */}
      {onFilesPress && (
        <RailItem
          active={!!isFilesActive}
          onPress={onFilesPress}
          accentColor={theme.colors.accent.primary}
          theme={theme}
          ringProgress={uploadRingProgress}
        >
          <FolderIcon
            size={22}
            color={isFilesActive ? theme.colors.text.inverse : theme.colors.text.secondary}
          />
        </RailItem>
      )}

      {/* Divider */}
      <View
        style={{
          width: 28,
          height: 2,
          borderRadius: 1,
          backgroundColor: theme.colors.border.subtle,
          marginVertical: 8,
        }}
      />

      {/* Community list */}
      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={{ alignItems: 'center', paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          /* Skeleton placeholders while loading */
          <>
            {[1, 2, 3].map((i) => (
              <View key={i} style={{ marginBottom: 4, width: '100%', alignItems: 'center' }}>
                <Skeleton
                  variant="rectangular"
                  width={ICON_SIZE}
                  height={ICON_SIZE}
                  radius={ICON_SIZE / 2}
                />
              </View>
            ))}
          </>
        ) : (
          <>
            {communities.map((community) => {
              const isActive = community.id === activeCommunityId;
              return (
                <RailItem
                  key={community.id}
                  active={isActive}
                  onPress={() => onCommunityPress(community.id)}
                  accentColor={community.accentColor}
                  theme={theme}
                  iconUrl={community.iconUrl}
                >
                  <Image
                    source={defaultCommunityIcon}
                    style={{ width: ICON_SIZE, height: ICON_SIZE }}
                    resizeMode="cover"
                  />
                </RailItem>
              );
            })}
          </>
        )}

        {/* Create community button — always visible */}
        <RailItem
          active={false}
          onPress={onCreateCommunity}
          theme={theme}
        >
          <PlusIcon
            size={20}
            color={theme.colors.text.secondary}
          />
        </RailItem>
      </ScrollView>

      {/* Settings button — anchored to the bottom */}
      {onOpenSettings && (
        <View style={{ paddingBottom: Math.round(safeAreaBottom / 3) + 12, paddingTop: 8, alignItems: 'center', width: '100%' }}>
          <View
            style={{
              width: 28,
              height: 2,
              borderRadius: 1,
              backgroundColor: theme.colors.border.subtle,
              marginBottom: 8,
            }}
          />

          {/* Account avatar bubble — above settings gear, matches RailItem size */}
          {onAvatarPress && (
            <View style={{ marginBottom: 4, width: '100%', alignItems: 'center' }}>
              <Pressable
                onPress={onAvatarPress}
                style={({ pressed }) => ({
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                  borderRadius: ICON_SIZE / 2,
                  backgroundColor: pressed
                    ? theme.colors.border.strong
                    : theme.colors.accent.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                })}
              >
                {userAvatar ? (
                  <Image
                    source={{ uri: userAvatar }}
                    style={{ width: ICON_SIZE, height: ICON_SIZE }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text size="sm" weight="bold" style={{ color: theme.colors.text.inverse }}>
                    {(userDisplayName ?? '?').charAt(0).toUpperCase()}
                  </Text>
                )}
              </Pressable>
            </View>
          )}

          {/* Notification bell — between avatar and settings */}
          {onNotificationsPress && (
            <RailItem
              active={false}
              onPress={onNotificationsPress}
              theme={theme}
              badgeCount={notificationCount || undefined}
            >
              <BellIcon
                size={20}
                color={theme.colors.text.secondary}
              />
            </RailItem>
          )}

          <RailItem
            active={false}
            onPress={onOpenSettings}
            theme={theme}
          >
            <SettingsIcon
              size={20}
              color={theme.colors.text.secondary}
            />
          </RailItem>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Rail Item — individual icon button with active indicator
// ---------------------------------------------------------------------------

interface RailItemProps {
  active: boolean;
  onPress: () => void;
  accentColor?: string;
  theme: any;
  children: React.ReactNode;
  /** Optional ring progress (0-100) rendered around the icon */
  ringProgress?: number;
  /** Optional icon image URL (e.g. Discord guild icon) */
  iconUrl?: string;
  /** Optional notification badge count rendered on the icon */
  badgeCount?: number;
}

function RailItem({ active, onPress, accentColor, theme, children, ringProgress, iconUrl, badgeCount }: RailItemProps) {
  const showRing = ringProgress != null && ringProgress > 0 && ringProgress < 100;
  const { animatedValue: indicatorAnim, shouldRender: showIndicator } = useAnimatedToggle(active, { duration: 150 });

  return (
    <View style={{ width: '100%', alignItems: 'center', marginBottom: 4, position: 'relative' }}>
      {/* Active indicator pill on the left edge */}
      {showIndicator && (
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            marginTop: -16,
            width: ACTIVE_INDICATOR_WIDTH,
            height: 32,
            borderTopRightRadius: ACTIVE_INDICATOR_WIDTH,
            borderBottomRightRadius: ACTIVE_INDICATOR_WIDTH,
            backgroundColor: theme.colors.text.primary,
            opacity: indicatorAnim,
            transform: [{
              scaleY: indicatorAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
            }],
          }}
        />
      )}

      {/* Upload progress ring overlay */}
      {showRing && (
        <View
          style={{
            position: 'absolute',
            width: ICON_SIZE + 6,
            height: ICON_SIZE + 6,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <Svg width={ICON_SIZE + 6} height={ICON_SIZE + 6}>
            <Circle
              cx={(ICON_SIZE + 6) / 2}
              cy={(ICON_SIZE + 6) / 2}
              r={(ICON_SIZE + 2) / 2}
              stroke={theme.colors.border.subtle}
              strokeWidth={2}
              fill="none"
            />
            <Circle
              cx={(ICON_SIZE + 6) / 2}
              cy={(ICON_SIZE + 6) / 2}
              r={(ICON_SIZE + 2) / 2}
              stroke={theme.colors.accent.primary}
              strokeWidth={2}
              fill="none"
              strokeDasharray={`${Math.PI * (ICON_SIZE + 2)}`}
              strokeDashoffset={`${Math.PI * (ICON_SIZE + 2) * (1 - (ringProgress ?? 0) / 100)}`}
              strokeLinecap="round"
              rotation={-90}
              origin={`${(ICON_SIZE + 6) / 2}, ${(ICON_SIZE + 6) / 2}`}
            />
          </Svg>
        </View>
      )}

      <NotificationBadge
        count={badgeCount}
        color="danger"
        size="sm"
        invisible={!badgeCount}
      >
        <Pressable
          onPress={onPress}
          style={({ pressed }) => ({
            width: ICON_SIZE,
            height: ICON_SIZE,
            borderRadius: active ? ICON_RADIUS : ICON_SIZE / 2,
            backgroundColor: active
              ? (accentColor ?? theme.colors.accent.primary)
              : pressed
                ? theme.colors.border.strong
                : theme.colors.background.sunken,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          })}
        >
          {iconUrl ? (
            <Image
              source={{ uri: iconUrl }}
              style={{ width: ICON_SIZE, height: ICON_SIZE }}
              resizeMode="cover"
            />
          ) : (
            children
          )}
        </Pressable>
      </NotificationBadge>
    </View>
  );
}
