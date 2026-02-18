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
import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text, Skeleton, useTheme } from '@coexist/wisp-react-native';
import { HomeIcon, FolderIcon, PlusIcon, SettingsIcon } from '@/components/icons';
import type { Community } from '@umbra/service';

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
  /** Whether community data is still loading */
  loading?: boolean;
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
  loading,
}: NavigationRailProps) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        width: RAIL_WIDTH,
        backgroundColor: theme.colors.background.surface,
        borderRightWidth: 1,
        borderRightColor: theme.colors.border.subtle,
        paddingTop: 20,
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
      >
        <HomeIcon
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
                >
                  <Text
                    size="sm"
                    weight="bold"
                    style={{
                      color: isActive
                        ? theme.colors.text.inverse
                        : theme.colors.text.secondary,
                    }}
                  >
                    {community.name.charAt(0).toUpperCase()}
                  </Text>
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
        <View style={{ paddingBottom: 16, paddingTop: 8, alignItems: 'center', width: '100%' }}>
          <View
            style={{
              width: 28,
              height: 2,
              borderRadius: 1,
              backgroundColor: theme.colors.border.subtle,
              marginBottom: 8,
            }}
          />
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
}

function RailItem({ active, onPress, accentColor, theme, children, ringProgress }: RailItemProps) {
  const showRing = ringProgress != null && ringProgress > 0 && ringProgress < 100;

  return (
    <View style={{ width: '100%', alignItems: 'center', marginBottom: 4, position: 'relative' }}>
      {/* Active indicator pill on the left edge */}
      {active && (
        <View
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
        {children}
      </Pressable>
    </View>
  );
}
