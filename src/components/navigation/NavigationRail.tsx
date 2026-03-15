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
 *
 * The active indicator is a single animated pill on the left edge that
 * continuously slides between items using a spring animation.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, Platform, Pressable, ScrollView, View } from 'react-native';
import { Box } from '@coexist/wisp-react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text, Skeleton, useTheme, NotificationBadge } from '@coexist/wisp-react-native';
import { UmbraIcon, FolderIcon, PlusIcon, SettingsIcon, BellIcon, ShoppingBagIcon, BookOpenIcon } from '@/components/ui';
import type { Community } from '@umbra/service';
import { TEST_IDS } from '@/constants/test-ids';
import { dbg } from '@/utils/debug';

// Default community icon — the colored Umbra ghost app icon
// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultCommunityIcon = require('@/assets/images/icon.png');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Inject CSS keyframes for the indicator gradient animation (web only, once)
const INDICATOR_KEYFRAMES_ID = 'umbra-indicator-gradient-keyframes';
let indicatorKeyframesInjected = false;
function injectIndicatorKeyframes(): void {
  if (indicatorKeyframesInjected || typeof document === 'undefined') return;
  indicatorKeyframesInjected = true;
  const sheet = document.createElement('style');
  sheet.id = INDICATOR_KEYFRAMES_ID;
  sheet.textContent = `@keyframes umbra-indicator-gradient{0%{background-position:50% 0%}50%{background-position:50% 100%}100%{background-position:50% 0%}}`;
  document.head.appendChild(sheet);
}


const RAIL_WIDTH = 64;
const ICON_SIZE = 40;
const ICON_RADIUS = 12;
const ACTIVE_INDICATOR_WIDTH = 4;
const INDICATOR_HEIGHT = 32;
const PANEL_DOT_SIZE = 8;

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
  /** Open the plugin marketplace */
  onMarketplacePress?: () => void;
  /** Open the guide dialog */
  onGuidePress?: () => void;
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
  /** Whether the settings page is currently active */
  isSettingsActive?: boolean;
  /** Whether the marketplace page is currently active */
  isMarketplaceActive?: boolean;
  /** Whether the notifications sidebar panel is currently open */
  isNotificationsPanelOpen?: boolean;
  /** Whether the account sidebar panel is currently open */
  isAccountPanelOpen?: boolean;
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
  onMarketplacePress,
  onGuidePress,
  onOpenSettings,
  userAvatar,
  userDisplayName,
  onAvatarPress,
  loading,
  homeNotificationCount,
  notificationCount,
  isSettingsActive,
  isMarketplaceActive,
  onNotificationsPress,
  isNotificationsPanelOpen,
  isAccountPanelOpen,
  safeAreaTop = 0,
  safeAreaBottom = 0,
}: NavigationRailProps) {
  if (__DEV__) dbg.trackRender('NavigationRail');
  const { theme } = useTheme();

  // Inject CSS keyframes once on web
  useEffect(() => {
    if (Platform.OS === 'web') injectIndicatorKeyframes();
  }, []);

  // Track community IDs to detect newly added ones for bounce animation
  const knownCommunityIdsRef = useRef<Set<string>>(new Set(communities.map((c) => c.id)));
  const newCommunityIds = useRef<Set<string>>(new Set<string>()).current;

  // Detect new community IDs
  for (const c of communities) {
    if (!knownCommunityIdsRef.current.has(c.id)) {
      newCommunityIds.add(c.id);
      knownCommunityIdsRef.current.add(c.id);
    }
  }

  // ── Sliding indicator ──────────────────────────────────────────────────

  const railRef = useRef<View>(null);
  const itemRefs = useRef(new Map<string, View>()).current;

  const activeKey = isHomeActive
    ? 'home'
    : isFilesActive
      ? 'files'
      : isSettingsActive
        ? 'settings'
        : activeCommunityId ?? null;

  const indicatorY = useRef(new Animated.Value(0)).current;
  const indicatorOpacity = useRef(new Animated.Value(0)).current;
  const indicatorScaleY = useRef(new Animated.Value(0.5)).current;
  const hasAppearedRef = useRef(false);

  const registerItemRef = useCallback((key: string, node: View | null) => {
    if (node) itemRefs.set(key, node);
    else itemRefs.delete(key);
  }, []);

  /** Measure an item's Y position relative to the rail (centers the indicator). */
  const measureItem = useCallback((key: string, callback: (y: number) => void) => {
    const itemNode = itemRefs.get(key);
    const railNode = railRef.current;
    if (!itemNode || !railNode) return;

    if (Platform.OS === 'web') {
      requestAnimationFrame(() => {
        const railEl = railNode as unknown as HTMLElement;
        const itemEl = itemNode as unknown as HTMLElement;
        if (!railEl.getBoundingClientRect || !itemEl.getBoundingClientRect) return;
        const railRect = railEl.getBoundingClientRect();
        const itemRect = itemEl.getBoundingClientRect();
        callback(itemRect.top - railRect.top + (itemRect.height - INDICATOR_HEIGHT) / 2);
      });
    } else {
      (itemNode as any).measureLayout(
        railNode,
        (_x: number, y: number, _w: number, h: number) => {
          callback(y + (h - INDICATOR_HEIGHT) / 2);
        },
        () => {},
      );
    }
  }, []);

  // Animate indicator when active key changes
  useEffect(() => {
    if (!activeKey) {
      // Fade out
      Animated.timing(indicatorOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        hasAppearedRef.current = false;
        indicatorScaleY.setValue(0.5);
      });
      return;
    }

    // Small delay to ensure layout is ready after mount / re-render
    const timer = setTimeout(() => {
      measureItem(activeKey, (targetY) => {
        if (!hasAppearedRef.current) {
          // First appear — snap to position, then fade + scale in
          indicatorY.setValue(targetY);
          Animated.parallel([
            Animated.timing(indicatorOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.spring(indicatorScaleY, {
              toValue: 1,
              tension: 300,
              friction: 20,
              useNativeDriver: true,
            }),
          ]).start();
          hasAppearedRef.current = true;
        } else {
          // Subsequent changes — slide to new position
          Animated.spring(indicatorY, {
            toValue: targetY,
            tension: 300,
            friction: 25,
            useNativeDriver: true,
          }).start();
        }
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [activeKey]);

  // Re-measure on scroll so indicator tracks community items
  const handleScroll = useCallback(
    (e: any) => {
      if (activeCommunityId) {
        measureItem(activeCommunityId, (targetY) => {
          indicatorY.setValue(targetY);
        });
      }
    },
    [activeCommunityId, measureItem],
  );

  // Gradient fill style (shared by main indicator and panel dot)
  const indicatorFillStyle =
    Platform.OS === 'web'
      ? ({
          width: '100%',
          height: '100%',
          backgroundImage:
            'linear-gradient(180deg, #8B5CF6, #EC4899, #3B82F6, #8B5CF6)',
          backgroundSize: '100% 300%',
          animationName: 'umbra-indicator-gradient',
          animationDuration: '12000ms',
          animationTimingFunction: 'ease',
          animationIterationCount: 'infinite',
        } as any)
      : {
          width: '100%',
          height: '100%',
          backgroundColor: theme.colors.text.primary,
        };

  // ── Panel dot indicator (slides between avatar & bell) ──────────────────
  const bottomSectionRef = useRef<View>(null);
  const panelItemRefs = useRef(new Map<string, View>()).current;
  const registerPanelRef = useCallback((key: string, node: View | null) => {
    if (node) panelItemRefs.set(key, node);
    else panelItemRefs.delete(key);
  }, []);

  const panelDotY = useRef(new Animated.Value(0)).current;
  const panelDotOpacity = useRef(new Animated.Value(0)).current;
  const panelDotScale = useRef(new Animated.Value(0.5)).current;
  const panelDotAppearedRef = useRef(false);

  const activePanelKey = isAccountPanelOpen
    ? 'account'
    : isNotificationsPanelOpen
      ? 'notifications'
      : null;

  const measurePanelItem = useCallback((key: string, callback: (y: number) => void) => {
    const itemNode = panelItemRefs.get(key);
    const containerNode = bottomSectionRef.current;
    if (!itemNode || !containerNode) return;

    if (Platform.OS === 'web') {
      requestAnimationFrame(() => {
        const containerEl = containerNode as unknown as HTMLElement;
        const itemEl = itemNode as unknown as HTMLElement;
        if (!containerEl.getBoundingClientRect || !itemEl.getBoundingClientRect) return;
        const containerRect = containerEl.getBoundingClientRect();
        const itemRect = itemEl.getBoundingClientRect();
        callback(itemRect.top - containerRect.top + (itemRect.height - PANEL_DOT_SIZE) / 2);
      });
    } else {
      (itemNode as any).measureLayout(
        containerNode,
        (_x: number, y: number, _w: number, h: number) => {
          callback(y + (h - PANEL_DOT_SIZE) / 2);
        },
        () => {},
      );
    }
  }, []);

  useEffect(() => {
    if (!activePanelKey) {
      // Fade out
      Animated.timing(panelDotOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        panelDotAppearedRef.current = false;
        panelDotScale.setValue(0.5);
      });
      return;
    }

    const timer = setTimeout(() => {
      measurePanelItem(activePanelKey, (targetY) => {
        if (!panelDotAppearedRef.current) {
          // First appear — snap to position, then fade + scale in
          panelDotY.setValue(targetY);
          Animated.parallel([
            Animated.timing(panelDotOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.spring(panelDotScale, {
              toValue: 1,
              tension: 300,
              friction: 20,
              useNativeDriver: true,
            }),
          ]).start();
          panelDotAppearedRef.current = true;
        } else {
          // Subsequent changes — slide to new position
          Animated.spring(panelDotY, {
            toValue: targetY,
            tension: 300,
            friction: 25,
            useNativeDriver: true,
          }).start();
        }
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [activePanelKey]);

  return (
    <View
      ref={railRef}
      testID={TEST_IDS.NAV.RAIL}
      style={{
        width: RAIL_WIDTH,
        backgroundColor: theme.colors.background.surface,
        borderRightWidth: 1,
        borderRightColor: theme.colors.border.subtle,
        paddingTop: safeAreaTop + 20,
        alignItems: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* ── Sliding indicator (single element) ── */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: ACTIVE_INDICATOR_WIDTH,
          height: INDICATOR_HEIGHT,
          borderTopRightRadius: ACTIVE_INDICATOR_WIDTH,
          borderBottomRightRadius: ACTIVE_INDICATOR_WIDTH,
          opacity: indicatorOpacity,
          transform: [
            { translateY: indicatorY },
            { scaleY: indicatorScaleY },
          ],
          zIndex: 10,
          overflow: 'hidden',
        }}
      >
        <Box style={indicatorFillStyle} />
      </Animated.View>

      {/* Home button */}
      <RailItem
        itemKey="home"
        registerRef={registerItemRef}
        active={isHomeActive}
        onPress={onHomePress}
        accentColor={theme.colors.accent.primary}
        theme={theme}
        badgeCount={!isHomeActive && homeNotificationCount ? homeNotificationCount : undefined}
        testID={TEST_IDS.NAV.HOME}
      >
        <UmbraIcon
          size={22}
          color={isHomeActive ? theme.colors.text.onAccent : theme.colors.text.secondary}
        />
      </RailItem>

      {/* Files button — between Home and Communities */}
      {onFilesPress && (
        <RailItem
          itemKey="files"
          registerRef={registerItemRef}
          active={!!isFilesActive}
          onPress={onFilesPress}
          accentColor={theme.colors.accent.primary}
          theme={theme}
          ringProgress={uploadRingProgress}
          testID={TEST_IDS.NAV.FILES}
        >
          <FolderIcon
            size={22}
            color={isFilesActive ? theme.colors.text.onAccent : theme.colors.text.secondary}
          />
        </RailItem>
      )}

      {/* Marketplace button */}
      {onMarketplacePress && (
        <RailItem
          itemKey="_marketplace"
          registerRef={registerItemRef}
          active={!!isMarketplaceActive}
          onPress={onMarketplacePress}
          theme={theme}
        >
          <ShoppingBagIcon
            size={22}
            color={isMarketplaceActive ? theme.colors.text.onAccent : theme.colors.text.secondary}
          />
        </RailItem>
      )}

      {/* Divider */}
      <Box
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
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {loading ? (
          /* Skeleton placeholders while loading */
          <>
            {[1, 2, 3].map((i) => (
              <Box key={i} style={{ marginBottom: 4, width: '100%', alignItems: 'center' }}>
                <Skeleton
                  variant="rectangular"
                  width={ICON_SIZE}
                  height={ICON_SIZE}
                  radius={ICON_SIZE / 2}
                />
              </Box>
            ))}
          </>
        ) : (
          <>
            {communities.map((community) => {
              const isActive = community.id === activeCommunityId;
              return (
                <RailItem
                  key={community.id}
                  itemKey={community.id}
                  registerRef={registerItemRef}
                  active={isActive}
                  onPress={() => onCommunityPress(community.id)}
                  accentColor={community.accentColor}
                  theme={theme}
                  iconUrl={community.iconUrl}
                  testID={TEST_IDS.NAV.COMMUNITY_ITEM}
                  animateMount={newCommunityIds.has(community.id)}
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
          itemKey="_create"
          registerRef={registerItemRef}
          active={false}
          onPress={onCreateCommunity}
          theme={theme}
          testID={TEST_IDS.NAV.CREATE_COMMUNITY}
        >
          <PlusIcon
            size={20}
            color={theme.colors.text.secondary}
          />
        </RailItem>
      </ScrollView>

      {/* Settings button — anchored to the bottom */}
      {onOpenSettings && (
        <View ref={bottomSectionRef} style={{ paddingBottom: Math.round(safeAreaBottom / 3) + 12, paddingTop: 8, alignItems: 'center', width: '100%' }}>
          {/* Panel dot indicator — single animated dot on the right edge */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: PANEL_DOT_SIZE,
              height: PANEL_DOT_SIZE,
              borderRadius: PANEL_DOT_SIZE / 2,
              opacity: panelDotOpacity,
              transform: [
                { translateY: panelDotY },
                { scaleY: panelDotScale },
                { scaleX: panelDotScale },
              ],
              zIndex: 10,
              overflow: 'hidden',
            }}
          >
            <Box style={indicatorFillStyle} />
          </Animated.View>

          <Box
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
            <View
              ref={(node) => registerPanelRef('account', node)}
              style={{ marginBottom: 4, width: '100%', alignItems: 'center' } as any}
            >
              <Pressable
                testID={TEST_IDS.NAV.AVATAR}
                onPress={onAvatarPress}
                accessibilityActions={[{ name: 'activate', label: 'Open account' }]}
                onAccessibilityAction={(e: any) => { if (e.nativeEvent.actionName === 'activate') onAvatarPress?.(); }}
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
                  <Text size="sm" weight="bold" style={{ color: theme.colors.text.onAccent }}>
                    {(userDisplayName ?? '?').charAt(0).toUpperCase()}
                  </Text>
                )}
              </Pressable>
            </View>
          )}

          {/* Notification bell — between avatar and settings */}
          {onNotificationsPress && (
            <View
              ref={(node) => registerPanelRef('notifications', node)}
              style={{ width: '100%', alignItems: 'center' } as any}
            >
              <RailItem
                itemKey="_notifications"
                registerRef={registerItemRef}
                active={false}
                onPress={onNotificationsPress}
                theme={theme}
                badgeCount={notificationCount || undefined}
                testID={TEST_IDS.NAV.NOTIFICATIONS}
              >
                <BellIcon
                  size={20}
                  color={isNotificationsPanelOpen ? theme.colors.text.primary : theme.colors.text.secondary}
                />
              </RailItem>
            </View>
          )}

          {/* Guide button — above settings */}
          {onGuidePress && (
            <RailItem
              itemKey="_guide"
              registerRef={registerItemRef}
              active={false}
              onPress={onGuidePress}
              theme={theme}
              testID={TEST_IDS.SIDEBAR.GUIDE_BUTTON}
            >
              <BookOpenIcon
                size={20}
                color={theme.colors.text.secondary}
              />
            </RailItem>
          )}

          <RailItem
            itemKey="settings"
            registerRef={registerItemRef}
            active={!!isSettingsActive}
            onPress={onOpenSettings}
            accentColor={theme.colors.accent.primary}
            theme={theme}
            testID={TEST_IDS.NAV.SETTINGS}
          >
            <SettingsIcon
              size={20}
              color={isSettingsActive ? theme.colors.text.onAccent : theme.colors.text.secondary}
            />
          </RailItem>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Rail Item — individual icon button (indicator is now at the parent level)
// ---------------------------------------------------------------------------

interface RailItemProps {
  /** Unique key for ref registration (used by sliding indicator). */
  itemKey: string;
  /** Callback to register this item's ref with the parent. */
  registerRef: (key: string, node: View | null) => void;
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
  /** Optional testID for E2E testing */
  testID?: string;
  /** Animate mount with spring bounce */
  animateMount?: boolean;
}

function RailItem({ itemKey, registerRef, active, onPress, accentColor, theme, children, ringProgress, iconUrl, badgeCount, testID, animateMount }: RailItemProps) {
  const showRing = ringProgress != null && ringProgress > 0 && ringProgress < 100;

  // Mount spring animation
  const mountScale = useRef(new Animated.Value(animateMount ? 0.5 : 1)).current;
  useEffect(() => {
    if (animateMount) {
      Animated.spring(mountScale, {
        toValue: 1,
        tension: 200,
        friction: 12,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  const iconElement = (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityActions={[{ name: 'activate', label: 'Activate' }]}
      onAccessibilityAction={(e: any) => { if (e.nativeEvent.actionName === 'activate') onPress(); }}
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
  );

  return (
    <Animated.View
      ref={(node) => registerRef(itemKey, node as View | null)}
      style={[
        { width: '100%', alignItems: 'center', marginBottom: 4, position: 'relative' as const },
        animateMount ? { transform: [{ scale: mountScale }] } : undefined,
      ]}
    >
      {/* Upload progress ring overlay */}
      {showRing && (
        <Box
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
        </Box>
      )}

      <NotificationBadge
        count={badgeCount}
        color="danger"
        size="sm"
        invisible={!badgeCount}
      >
        {iconElement}
      </NotificationBadge>
    </Animated.View>
  );
}

