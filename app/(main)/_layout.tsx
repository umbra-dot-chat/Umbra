import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, PanResponder, Platform, View, useWindowDimensions } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { HStack, useTheme, CallPipWidget, CommunityCreateDialog } from '@coexist/wisp-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUmbra } from '@/contexts/UmbraContext';
import { ActiveConversationProvider, useActiveConversation } from '@/contexts/ActiveConversationContext';
import { useConversations } from '@/hooks/useConversations';
import { useFriends } from '@/hooks/useFriends';
import { useGroups } from '@/hooks/useGroups';
import { useMessageNotifications } from '@/hooks/useMessageNotifications';
import { NotificationProvider, useNotifications } from '@/contexts/NotificationContext';
import { useNotificationListener } from '@/hooks/useNotificationListener';
import { NotificationDrawerContainer } from '@/components/notifications/NotificationDrawerContainer';
import { ChatSidebar } from '@/components/sidebar/ChatSidebar';
import { SettingsDialog } from '@/components/modals/SettingsDialog';
import { GuideDialog } from '@/components/modals/GuideDialog';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { NewDmDialog } from '@/components/modals/NewDmDialog';
import { ProfilePopover } from '@/components/modals/ProfilePopover';
import { ProfilePopoverProvider, useProfilePopoverContext } from '@/contexts/ProfilePopoverContext';
import { CallProvider, useCallContext } from '@/contexts/CallContext';
import { IncomingCallOverlay } from '@/components/call/IncomingCallOverlay';
import { CommandPalette } from '@/components/modals/CommandPalette';
import { PluginMarketplace } from '@/components/modals/PluginMarketplace';
import { InstallBanner } from '@/components/ui/InstallBanner';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { SettingsDialogProvider, useSettingsDialog } from '@/contexts/SettingsDialogContext';
import { CommunityProvider, useCommunityContext } from '@/contexts/CommunityContext';
import { VoiceChannelProvider } from '@/contexts/VoiceChannelContext';
import { useCommunities } from '@/hooks/useCommunities';
import { NavigationRail } from '@/components/navigation/NavigationRail';
import { AccountSwitcher } from '@/components/navigation/AccountSwitcher';
import { CommunityLayoutSidebar } from '@/components/sidebar/CommunityLayoutSidebar';
import type { Community, Friend, MessageEvent, MappedCommunityStructure, CommunityImportResult } from '@umbra/service';
import { createCommunityFromDiscordImport } from '@umbra/service';
import { useAuth } from '@/contexts/AuthContext';
import { useUploadProgress } from '@/hooks/useUploadProgress';
import { CommunityCreateOptionsDialog } from '@/components/community/CommunityCreateOptionsDialog';
import { JoinCommunityModal } from '@/components/community/JoinCommunityModal';
import { DiscordImportDialog } from '@/components/community/DiscordImportDialog';
import { useSound } from '@/contexts/SoundContext';
import { ResizeHandle } from '@/components/ui/ResizeHandle';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useNetwork } from '@/hooks/useNetwork';

// TODO: Remove mock community once real communities exist
const MOCK_COMMUNITY: Community = {
  id: 'mock-community-1',
  name: 'Umbra HQ',
  description: 'The official Umbra community',
  accentColor: '#5865F2',
  ownerDid: 'did:key:mock',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

/** Format a relative time string from a Unix timestamp. */
function formatRelativeTime(ts?: number): string {
  if (!ts) return '';
  // Handle timestamps in seconds (Unix) vs milliseconds
  // If timestamp is less than year 2000 in ms, it's probably in seconds
  const tsMs = ts < 1000000000000 ? ts * 1000 : ts;
  const now = Date.now();
  const diff = now - tsMs;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d`;
  return new Date(tsMs).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function MainLayoutInner() {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { selectedMember, popoverAnchor, closeProfile } = useProfilePopoverContext();
  const { playSound } = useSound();
  const isMobile = useIsMobile();
  const { width: screenWidth } = useWindowDimensions();
  const { activeChannelId: communityActiveChannelId } = useCommunityContext();
  const insets = Platform.OS !== 'web' ? useSafeAreaInsets() : { top: 0, bottom: 0, left: 0, right: 0 };

  // Mobile sidebar ↔ content swipe gesture
  // swipeProgress: 0 = sidebar visible, 1 = content visible
  const swipeProgress = useRef(new Animated.Value(0)).current;
  const swipeProgressValue = useRef(0); // JS-side mirror for gesture math
  const prevMobileShowContentRef = useRef<boolean | null>(null);
  const isSwipingRef = useRef(false);

  // Edge swipe detection: how far from the left edge a swipe can start (px)
  const EDGE_SWIPE_WIDTH = 25;
  // Velocity threshold (px/ms) — a fast flick overrides position threshold
  const VELOCITY_THRESHOLD = 0.4;
  // Position threshold — snap if past this fraction
  const POSITION_THRESHOLD = 0.4;

  // Track swipeProgress JS value via listener
  useEffect(() => {
    const id = swipeProgress.addListener(({ value }) => {
      swipeProgressValue.current = value;
    });
    return () => swipeProgress.removeListener(id);
  }, [swipeProgress]);

  // Derive translateX from swipeProgress (clamped to prevent over-scrolling)
  const sidebarTranslateX = swipeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -screenWidth],
    extrapolate: 'clamp',
  });
  const contentTranslateX = swipeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [screenWidth, 0],
    extrapolate: 'clamp',
  });

  // Animate to a target (0 or 1) with spring-like timing
  const animateToTarget = useCallback((target: number) => {
    Animated.timing(swipeProgress, {
      toValue: target,
      duration: 250,
      easing: Easing.bezier(0, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [swipeProgress]);

  // Refs for values that change but need to be read inside PanResponder
  const isMobileRef = useRef(isMobile);
  isMobileRef.current = isMobile;
  const screenWidthRef = useRef(screenWidth);
  screenWidthRef.current = screenWidth;
  const touchStartXRef = useRef(0);

  // PanResponder for swipe gestures on the mobile layout
  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: (evt) => {
        // Record the initial touch X for edge detection
        touchStartXRef.current = evt.nativeEvent.pageX;
        return false; // don't claim yet — wait for movement
      },
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        if (!isMobileRef.current) return false;
        const { dx, dy } = gestureState;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Must be a horizontal swipe (not vertical scroll)
        if (absDx < 8 || absDy > absDx) return false;

        const currentProgress = swipeProgressValue.current;

        if (currentProgress > 0.5) {
          // Content is showing — only allow right swipe from left edge to reveal sidebar
          return dx > 0 && touchStartXRef.current < EDGE_SWIPE_WIDTH;
        } else {
          // Sidebar is showing — allow left swipe anywhere to show content
          return dx < 0;
        }
      },
      onPanResponderGrant: () => {
        isSwipingRef.current = true;
        // Flatten any running animation so offset is correct
        swipeProgress.setOffset(swipeProgressValue.current);
        swipeProgress.setValue(0);
      },
      onPanResponderMove: (_evt, gestureState) => {
        // Convert dx to progress delta: negative dx = moving toward content (progress increases)
        const progressDelta = -gestureState.dx / screenWidthRef.current;
        swipeProgress.setValue(progressDelta);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        isSwipingRef.current = false;
        // Flatten offset into value
        swipeProgress.flattenOffset();
        const currentProgress = swipeProgressValue.current;
        const velocity = -gestureState.vx; // positive = toward content

        let target: number;
        if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
          // Fast flick — follow direction
          target = velocity > 0 ? 1 : 0;
        } else {
          // Slow drag — snap based on position
          target = currentProgress > POSITION_THRESHOLD ? 1 : 0;
        }

        // Clamp
        target = Math.max(0, Math.min(1, target));
        animateToTarget(target);
      },
      onPanResponderTerminate: () => {
        isSwipingRef.current = false;
        swipeProgress.flattenOffset();
        // Snap to nearest
        const target = swipeProgressValue.current > 0.5 ? 1 : 0;
        animateToTarget(target);
      },
    }),
    [swipeProgress, animateToTarget],
  );

  // Service + data hooks
  const { service, isReady } = useUmbra();
  const { identity, accounts, switchAccount, isSwitching, logout, addAccount, removeAccount, recoveryPhrase, pin, rememberMe } = useAuth();
  const { conversations, refresh: refreshConversations, isLoading: conversationsLoading } = useConversations();
  const { friends, incomingRequests } = useFriends();
  const { groups, pendingInvites, acceptInvite, declineInvite } = useGroups();
  const { onlineDids } = useNetwork();
  const { communities: realCommunities, createCommunity, isLoading: communitiesLoading } = useCommunities();

  // Merge mock community with real ones (TODO: remove mock once real communities exist)
  const communities = useMemo(() => [MOCK_COMMUNITY, ...realCommunities], [realCommunities]);

  // Whether the core service is still initializing (WASM + identity)
  const coreLoading = !isReady || !identity;

  // Notification listener — creates persistent notification records from events
  useNotificationListener();

  // Notification drawer state
  const { totalUnread, openDrawer: openNotificationDrawer } = useNotifications();

  // Upload progress for nav rail ring indicator
  const { uploadRingProgress } = useUploadProgress();

  // Call state for PiP widget
  const { activeCall, toggleMute, endCall } = useCallContext();

  // Build a DID → friend map for efficient lookups, enriched with relay presence
  const friendMap = useMemo(() => {
    const map: Record<string, { displayName: string; online?: boolean }> = {};
    for (const f of friends) {
      map[f.did] = { displayName: f.displayName, online: onlineDids.has(f.did) };
    }
    return map;
  }, [friends, onlineDids]);

  // Build a groupId → Group lookup
  const groupMap = useMemo(() => {
    const map: Record<string, typeof groups[0]> = {};
    for (const g of groups) {
      map[g.id] = g;
    }
    return map;
  }, [groups]);

  // Last message previews for sidebar
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({});
  const lastMessagesLoadedRef = useRef<Set<string>>(new Set());

  // Transform Conversation[] to sidebar-compatible shape
  const sidebarConversations = useMemo(() => {
    return conversations.map((c) => {
      // Group conversation
      if (c.type === 'group' && c.groupId) {
        const group = groupMap[c.groupId];
        const groupName = group?.name ?? 'Group';
        // Generate avatar names from group name initials for stacked display
        const avatarNames = [groupName, groupName.split(' ').pop() ?? groupName];
        return {
          id: c.id,
          name: groupName,
          last: lastMessages[c.id] || 'Group',
          time: formatRelativeTime(c.lastMessageAt),
          unread: c.unreadCount,
          group: avatarNames,
          isGroup: true,
        };
      }

      // DM conversation
      const friend = c.friendDid ? friendMap[c.friendDid] : undefined;
      return {
        id: c.id,
        name: friend?.displayName || c.friendDid?.slice(0, 16) + '...' || 'Chat',
        last: lastMessages[c.id] || '',
        time: formatRelativeTime(c.lastMessageAt),
        unread: c.unreadCount,
        online: friend?.online,
      };
    });
  }, [conversations, friendMap, groupMap, lastMessages, onlineDids]);

  // Resizable sidebar
  const SIDEBAR_MIN = 220;
  const SIDEBAR_DEFAULT = 320;
  const SIDEBAR_MAX = 500;
  const sidebarWidthRef = useRef(SIDEBAR_DEFAULT);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);

  const handleSidebarResize = useCallback((dx: number) => {
    const newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, sidebarWidthRef.current + dx));
    sidebarWidthRef.current = newWidth;
    setSidebarWidth(newWidth);
  }, []);

  // Sidebar state
  const [search, setSearch] = useState('');
  const { activeId, setActiveId, requestSearchPanel } = useActiveConversation();

  // Message notifications for non-active conversations
  useMessageNotifications(activeId);
  const { isOpen: settingsOpen, openSettings, closeSettings, initialSection: settingsInitialSection } = useSettingsDialog();
  const [guideOpen, setGuideOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [newDmOpen, setNewDmOpen] = useState(false);
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
  const [createCommunityOptionsOpen, setCreateCommunityOptionsOpen] = useState(false);
  const [createCommunityOpen, setCreateCommunityOpen] = useState(false);
  const [discordImportOpen, setDiscordImportOpen] = useState(false);
  const [joinCommunityOpen, setJoinCommunityOpen] = useState(false);
  const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
  const [communitySubmitting, setCommunitySubmitting] = useState(false);
  const [communityError, setCommunityError] = useState<string | undefined>();
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();

  // Load last messages for all conversations
  useEffect(() => {
    if (!service || conversations.length === 0) return;

    const loadLastMessages = async () => {
      const updates: Record<string, string> = {};
      for (const c of conversations) {
        if (lastMessagesLoadedRef.current.has(c.id)) continue;
        try {
          const msgs = await service.getMessages(c.id, { limit: 1 });
          if (msgs.length > 0) {
            const content = msgs[0].content;
            if (content.type === 'text') {
              updates[c.id] = content.text;
            }
          }
          lastMessagesLoadedRef.current.add(c.id);
        } catch {
          // Ignore errors for individual conversations
        }
      }
      if (Object.keys(updates).length > 0) {
        setLastMessages((prev) => ({ ...prev, ...updates }));
      }
    };
    loadLastMessages();
  }, [service, conversations]);

  // Listen for new messages to update last message in real-time
  useEffect(() => {
    if (!service) return;

    const unsubscribe = service.onMessageEvent((event: MessageEvent) => {
      if (
        (event.type === 'messageReceived' || event.type === 'messageSent')
      ) {
        const content = event.message?.content;
        if (content?.type === 'text') {
          setLastMessages((prev) => ({
            ...prev,
            [event.message.conversationId]: content.text,
          }));
        }
      }
    });

    return unsubscribe;
  }, [service]);

  // Handle group created — auto-select the new conversation
  const handleGroupCreated = useCallback((groupId: string, conversationId: string) => {
    setActiveId(conversationId);
    if (pathname !== '/') {
      router.push('/');
    }
  }, [pathname, router]);

  // Handle group invite accept — auto-select the new group conversation
  const handleAcceptInvite = useCallback(async (inviteId: string) => {
    const result = await acceptInvite(inviteId);
    if (result) {
      setActiveId(result.conversationId);
      if (pathname !== '/') {
        router.push('/');
      }
    }
  }, [acceptInvite, pathname, router]);

  // Handle group invite decline
  const handleDeclineInvite = useCallback(async (inviteId: string) => {
    await declineInvite(inviteId);
  }, [declineInvite]);

  // Handle DM friend selected — navigate to existing conversation or create one
  const handleDmFriendSelected = useCallback(async (friend: Friend, existingConversationId?: string) => {
    if (existingConversationId) {
      setActiveId(existingConversationId);
    } else if (service) {
      // Create a new DM conversation with deterministic ID
      try {
        const conversationId = await service.createDmConversation(friend.did);
        await refreshConversations();
        setActiveId(conversationId);
      } catch (err) {
        console.warn('[MainLayout] Failed to create DM conversation:', err);
      }
    }
    if (pathname !== '/') {
      router.push('/');
    }
  }, [service, refreshConversations, pathname, router]);

  // Handle community creation
  const handleCommunityCreated = useCallback(async (data: { name: string; description: string }) => {
    setCommunitySubmitting(true);
    setCommunityError(undefined);
    try {
      const result = await createCommunity(data.name, data.description || undefined);
      if (result) {
        playSound('success');
        setCreateCommunityOpen(false);
        router.push(`/community/${result.communityId}`);
      } else {
        playSound('error');
        setCommunityError('Failed to create community. Please try again.');
      }
    } catch (err) {
      playSound('error');
      setCommunityError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setCommunitySubmitting(false);
    }
  }, [createCommunity, router]);

  // Clear error when dialog closes
  const handleCloseCommunityDialog = useCallback(() => {
    setCreateCommunityOpen(false);
    setCommunityError(undefined);
    setCommunitySubmitting(false);
  }, []);

  // Handle community options dialog selections
  const handleSelectScratch = useCallback(() => {
    setCreateCommunityOptionsOpen(false);
    setCreateCommunityOpen(true);
  }, []);

  const handleSelectDiscord = useCallback(() => {
    setCreateCommunityOptionsOpen(false);
    setDiscordImportOpen(true);
  }, []);

  const handleSelectJoin = useCallback(() => {
    setCreateCommunityOptionsOpen(false);
    setJoinCommunityOpen(true);
  }, []);

  // Handle Discord import completion
  const handleDiscordImportComplete = useCallback((communityId: string) => {
    setDiscordImportOpen(false);
    router.push(`/community/${communityId}`);
  }, [router]);

  // Handle Discord import community creation
  const handleDiscordCreateCommunity = useCallback(async (structure: MappedCommunityStructure): Promise<CommunityImportResult> => {
    if (!identity?.did) {
      return {
        success: false,
        categoriesCreated: 0,
        channelsCreated: 0,
        rolesCreated: 0,
        seatsCreated: 0,
        pinsImported: 0,
        auditLogImported: 0,
        emojiImported: 0,
        stickersImported: 0,
        errors: ['No identity found'],
        warnings: [],
      };
    }

    const result = await createCommunityFromDiscordImport(
      structure,
      identity.did,
      identity.displayName,
    );

    // Refresh communities list after import
    if (result.success) {
      // Small delay to ensure DB is updated
      setTimeout(async () => {
        // The useCommunities hook will auto-refresh
      }, 100);
    }

    return result;
  }, [identity?.did, identity?.displayName]);

  // Navigate to community page
  const handleCommunityPress = useCallback((communityId: string) => {
    playSound('tab_switch');
    router.push(`/community/${communityId}`);
  }, [router, playSound]);

  // Navigate to home (conversations)
  const handleHomePress = useCallback(() => {
    if (pathname !== '/' && pathname !== '/friends') {
      playSound('tab_switch');
      router.push('/');
    }
  }, [pathname, router, playSound]);

  // Home is active when NOT on a community page and NOT on files page
  const isHomeActive = !pathname.startsWith('/community/') && pathname !== '/files';

  // Whether the files page is active
  const isFilesActive = pathname === '/files';

  // Navigate to files page
  const handleFilesPress = useCallback(() => {
    playSound('tab_switch');
    router.push('/files');
  }, [router, playSound]);

  // Determine active community from pathname
  const activeCommunityId = useMemo(() => {
    const match = pathname.match(/^\/community\/(.+)$/);
    return match ? match[1] : null;
  }, [pathname]);

  // Derived — search across conversation name, last message preview, and friend names
  const filtered = useMemo(() => {
    if (!search.trim()) return sidebarConversations;
    const lowerSearch = search.toLowerCase();
    // Pre-compute matching friend names for the search term
    const matchingFriendDids = new Set(
      friends
        .filter((f) => f.displayName.toLowerCase().includes(lowerSearch))
        .map((f) => f.did)
    );
    return sidebarConversations.filter((c) => {
      // Match by conversation name
      if (c.name.toLowerCase().includes(lowerSearch)) return true;
      // Match by last message preview
      if (c.last && c.last.toLowerCase().includes(lowerSearch)) return true;
      // Match by friend name in conversation (for DMs, check if friend matches)
      const conv = conversations.find((conv) => conv.id === c.id);
      if (conv?.friendDid && matchingFriendDids.has(conv.friendDid)) return true;
      return false;
    });
  }, [sidebarConversations, search, friends, conversations]);

  const isFriendsActive = pathname === '/friends';

  // Mobile: whether to show content instead of sidebar
  const mobileShowContent = isMobile && !!(
    activeId ||                                           // DM chat is open
    isFilesActive ||                                      // Files page
    isFriendsActive ||                                    // Friends page
    (activeCommunityId && communityActiveChannelId)        // Community channel selected
  );

  // Drive sidebar ↔ content animation on mobile when state changes programmatically.
  // We track a "navigation key" that changes whenever the user selects a new destination,
  // so even if mobileShowContent stays true (switching chats), we re-animate to content.
  const mobileNavKey = `${activeId}|${activeCommunityId}|${communityActiveChannelId}|${isFilesActive}|${isFriendsActive}`;
  const prevNavKeyRef = useRef(mobileNavKey);

  useEffect(() => {
    if (!isMobile) return;

    const target = mobileShowContent ? 1 : 0;

    // On first render, snap to position without animation
    if (prevMobileShowContentRef.current === null) {
      prevMobileShowContentRef.current = mobileShowContent;
      prevNavKeyRef.current = mobileNavKey;
      swipeProgress.setValue(target);
      return;
    }

    // Don't override an active swipe gesture
    if (isSwipingRef.current) return;

    const navChanged = prevNavKeyRef.current !== mobileNavKey;
    const stateChanged = prevMobileShowContentRef.current !== mobileShowContent;
    prevMobileShowContentRef.current = mobileShowContent;
    prevNavKeyRef.current = mobileNavKey;

    // Animate if state changed, or if nav key changed and we're not already at target
    if (stateChanged || (navChanged && Math.abs(swipeProgressValue.current - target) > 0.01)) {
      animateToTarget(target);
    }
  }, [isMobile, mobileShowContent, mobileNavKey, animateToTarget]);

  // Calculate total unread message count across all conversations
  const totalUnreadMessages = useMemo(() => {
    return conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  }, [conversations]);

  // Aggregate notification count for home badge (friend requests + unread messages)
  const homeNotificationCount = incomingRequests.length + totalUnreadMessages;

  // Detect Tauri desktop for overlay title bar handling
  const isTauriDesktop = Platform.OS === 'web' && typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;
  // On macOS Tauri with overlay title bar, traffic lights need ~28px clearance
  const tauriTitleBarHeight = isTauriDesktop ? 28 : 0;
  const effectiveTopInset = Math.max(insets.top, tauriTitleBarHeight);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.canvas }}>
      <InstallBanner />
      {/* Tauri overlay title bar: full-width drag region pinned to top */}
      {isTauriDesktop && (
        <div
          onMouseDown={async (e) => {
            // Only drag on primary button (left click), not on traffic light area
            if (e.button !== 0) return;
            try {
              const _winPkg = '@tauri-apps/' + 'api/window';
              const { getCurrentWindow } = await import(/* @vite-ignore */ _winPkg);
              await getCurrentWindow().startDragging();
            } catch {}
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: tauriTitleBarHeight,
            zIndex: 10000,
            cursor: 'default',
          }}
        />
      )}
      {isMobile ? (
        /* ─── Mobile: both views always mounted, slide via translateX + swipe gesture ─── */
        <View {...panResponder.panHandlers} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* Sidebar layer */}
          <Animated.View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            transform: [{ translateX: sidebarTranslateX }],
          }}>
            <View style={{ flex: 1 }}>
              {effectiveTopInset > 0 && (
                <View style={{
                  height: effectiveTopInset,
                  backgroundColor: theme.colors.background.surface,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border.subtle,
                }} />
              )}
              <HStack gap={0} style={{ flex: 1 }}>
                <NavigationRail
                  isHomeActive={isHomeActive}
                  onHomePress={handleHomePress}
                  isFilesActive={isFilesActive}
                  onFilesPress={handleFilesPress}
                  uploadRingProgress={uploadRingProgress}
                  communities={communities}
                  activeCommunityId={activeCommunityId}
                  onCommunityPress={handleCommunityPress}
                  onCreateCommunity={() => { playSound('dialog_open'); setCreateCommunityOptionsOpen(true); }}
                  onOpenSettings={() => { playSound('dialog_open'); openSettings(); }}
                  userAvatar={identity?.avatar}
                  userDisplayName={identity?.displayName}
                  onAvatarPress={() => { playSound('dialog_open'); setAccountSwitcherOpen(true); }}
                  loading={coreLoading || communitiesLoading}
                  homeNotificationCount={homeNotificationCount}
                  notificationCount={totalUnread}
                  onNotificationsPress={() => { playSound('dialog_open'); openNotificationDrawer(); }}
                  safeAreaTop={0}
                  safeAreaBottom={insets.bottom}
                />
                <View style={{ flex: 1 }}>
                  {activeCommunityId ? (
                    <CommunityLayoutSidebar communityId={activeCommunityId} />
                  ) : (
                    <ChatSidebar
                      search={search}
                      onSearchChange={setSearch}
                      conversations={filtered}
                      activeId={activeId}
                      onSelectConversation={(id) => {
                        setActiveId(id);
                        if (pathname !== '/') {
                          router.push('/');
                        }
                      }}
                      onFriendsPress={() => router.push('/friends')}
                      onNewDm={() => { playSound('dialog_open'); setNewDmOpen(true); }}
                      onCreateGroup={() => { playSound('dialog_open'); setCreateGroupOpen(true); }}
                      onGuidePress={() => { playSound('dialog_open'); setGuideOpen(true); }}
                      onMarketplacePress={() => { playSound('dialog_open'); setMarketplaceOpen(true); }}
                      isFriendsActive={isFriendsActive}
                      pendingInvites={pendingInvites}
                      onAcceptInvite={handleAcceptInvite}
                      onDeclineInvite={handleDeclineInvite}
                      loading={coreLoading || conversationsLoading}
                      pendingFriendRequests={incomingRequests.length}
                    />
                  )}
                </View>
              </HStack>
            </View>
          </Animated.View>

          {/* Content layer */}
          <Animated.View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            transform: [{ translateX: contentTranslateX }],
          }}>
            <View style={{ flex: 1 }}>
              {effectiveTopInset > 0 && (
                <View style={{
                  height: effectiveTopInset,
                  backgroundColor: theme.colors.background.canvas,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border.subtle,
                }} />
              )}
              <Slot />
            </View>
          </Animated.View>
        </View>
      ) : (
        /* ─── Desktop: side-by-side layout ─── */
        <HStack gap={0} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'column', width: 64 + sidebarWidth, flexShrink: 0 }}>
            {/* Safe area header — spans rail + sidebar, same surface color */}
            {effectiveTopInset > 0 && (
              <View style={{
                height: effectiveTopInset,
                backgroundColor: theme.colors.background.surface,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border.subtle,
              }} />
            )}
            <HStack gap={0} style={{ flex: 1 }}>
              <NavigationRail
                isHomeActive={isHomeActive}
                onHomePress={handleHomePress}
                isFilesActive={isFilesActive}
                onFilesPress={handleFilesPress}
                uploadRingProgress={uploadRingProgress}
                communities={communities}
                activeCommunityId={activeCommunityId}
                onCommunityPress={handleCommunityPress}
                onCreateCommunity={() => { playSound('dialog_open'); setCreateCommunityOptionsOpen(true); }}
                onOpenSettings={() => { playSound('dialog_open'); openSettings(); }}
                userAvatar={identity?.avatar}
                userDisplayName={identity?.displayName}
                onAvatarPress={() => { playSound('dialog_open'); setAccountSwitcherOpen(true); }}
                loading={coreLoading || communitiesLoading}
                homeNotificationCount={homeNotificationCount}
                notificationCount={totalUnread}
                onNotificationsPress={() => { playSound('dialog_open'); openNotificationDrawer(); }}
                safeAreaTop={0}
                safeAreaBottom={insets.bottom}
              />
              <View style={{ flex: 1 }}>
                {activeCommunityId ? (
                  <CommunityLayoutSidebar communityId={activeCommunityId} />
                ) : (
                  <ChatSidebar
                    search={search}
                    onSearchChange={setSearch}
                    conversations={filtered}
                    activeId={activeId}
                    onSelectConversation={(id) => {
                      setActiveId(id);
                      if (pathname !== '/') {
                        router.push('/');
                      }
                    }}
                    onFriendsPress={() => router.push('/friends')}
                    onNewDm={() => { playSound('dialog_open'); setNewDmOpen(true); }}
                    onCreateGroup={() => { playSound('dialog_open'); setCreateGroupOpen(true); }}
                    onGuidePress={() => { playSound('dialog_open'); setGuideOpen(true); }}
                    onMarketplacePress={() => { playSound('dialog_open'); setMarketplaceOpen(true); }}
                    isFriendsActive={isFriendsActive}
                    pendingInvites={pendingInvites}
                    onAcceptInvite={handleAcceptInvite}
                    onDeclineInvite={handleDeclineInvite}
                    loading={coreLoading || conversationsLoading}
                    pendingFriendRequests={incomingRequests.length}
                  />
                )}
              </View>
            </HStack>
          </View>
          <ResizeHandle onResize={handleSidebarResize} />
          <View style={{ flex: 1 }}>
            {effectiveTopInset > 0 && (
              <View style={{
                height: effectiveTopInset,
                backgroundColor: theme.colors.background.canvas,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border.subtle,
              }} />
            )}
            <Slot />
          </View>
        </HStack>
      )}

      <ProfilePopover
        selectedMember={selectedMember}
        anchor={popoverAnchor}
        onClose={closeProfile}
      />

      <SettingsDialog
        open={settingsOpen}
        onClose={() => { playSound('dialog_close'); closeSettings(); }}
        initialSection={settingsInitialSection}
        onOpenMarketplace={() => {
          closeSettings();
          playSound('dialog_open');
          setMarketplaceOpen(true);
        }}
      />

      <GuideDialog
        open={guideOpen}
        onClose={() => { playSound('dialog_close'); setGuideOpen(false); }}
      />

      <CreateGroupDialog
        open={createGroupOpen}
        onClose={() => { playSound('dialog_close'); setCreateGroupOpen(false); }}
        onCreated={handleGroupCreated}
      />

      <NewDmDialog
        open={newDmOpen}
        onClose={() => { playSound('dialog_close'); setNewDmOpen(false); }}
        onSelectFriend={handleDmFriendSelected}
      />

      <CommunityCreateOptionsDialog
        open={createCommunityOptionsOpen}
        onClose={() => { playSound('dialog_close'); setCreateCommunityOptionsOpen(false); }}
        onSelectScratch={handleSelectScratch}
        onSelectDiscord={handleSelectDiscord}
        onSelectJoin={handleSelectJoin}
      />

      <CommunityCreateDialog
        open={createCommunityOpen}
        onClose={handleCloseCommunityDialog}
        onSubmit={handleCommunityCreated}
        submitting={communitySubmitting}
        error={communityError}
      />

      <JoinCommunityModal
        open={joinCommunityOpen}
        onClose={() => { playSound('dialog_close'); setJoinCommunityOpen(false); }}
      />

      <DiscordImportDialog
        open={discordImportOpen}
        onClose={() => { playSound('dialog_close'); setDiscordImportOpen(false); }}
        onImportComplete={handleDiscordImportComplete}
        onCreateCommunity={handleDiscordCreateCommunity}
      />

      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        onOpenSettings={() => {
          setCmdOpen(false);
          playSound('dialog_open');
          openSettings();
        }}
        onOpenMarketplace={() => {
          setCmdOpen(false);
          playSound('dialog_open');
          setMarketplaceOpen(true);
        }}
        onSearchMessages={() => {
          setCmdOpen(false);
          // Navigate to chat if not already there, then open search panel
          if (pathname !== '/') {
            router.push('/');
          }
          requestSearchPanel();
        }}
      />

      <PluginMarketplace
        open={marketplaceOpen}
        onClose={() => { playSound('dialog_close'); setMarketplaceOpen(false); }}
      />

      {/* PiP widget: show when active call and user is on a different conversation */}
      {activeCall && activeCall.status === 'connected' && activeCall.conversationId !== activeId && (
        <CallPipWidget
          stream={activeCall.remoteStream}
          callerName={activeCall.remoteDisplayName}
          connectedAt={activeCall.connectedAt}
          isMuted={activeCall.isMuted}
          isCameraOff={activeCall.isCameraOff}
          onPress={() => {
            setActiveId(activeCall.conversationId);
            if (pathname !== '/') {
              router.push('/');
            }
          }}
          onEndCall={() => endCall()}
          onToggleMute={toggleMute}
        />
      )}

      <AccountSwitcher
        open={accountSwitcherOpen}
        onClose={() => { playSound('dialog_close'); setAccountSwitcherOpen(false); }}
        accounts={accounts}
        activeAccountDid={identity?.did ?? null}
        onSwitchAccount={(did) => switchAccount(did)}
        onActiveAccountPress={() => { openSettings('profile'); }}
        onRemoveAccount={(did) => removeAccount(did)}
        onAddAccount={async () => {
          // Ensure the current account is registered in the multi-account list
          // before logging out. This handles the case where the account was
          // created before multi-account support was added.
          if (identity && recoveryPhrase) {
            const alreadyRegistered = accounts.some((a) => a.did === identity.did);
            if (!alreadyRegistered) {
              addAccount({
                did: identity.did,
                displayName: identity.displayName ?? '',
                avatar: identity.avatar,
                recoveryPhrase,
                pin: pin ?? undefined,
                rememberMe,
                addedAt: identity.createdAt ?? Date.now(),
              });
            }
          }
          // Graceful shutdown: flush DB → shutdown service → reset WASM
          try {
            const { flushAndCloseSqlBridge } = await import('@umbra/wasm');
            await flushAndCloseSqlBridge();
          } catch { /* ignore if not web */ }
          try {
            const { UmbraService } = await import('@umbra/service');
            if (UmbraService.isInitialized) await UmbraService.shutdown();
          } catch { /* ignore */ }
          try {
            const { resetWasm } = await import('@umbra/wasm');
            resetWasm();
          } catch { /* ignore */ }
          // Clear active session (accounts list preserved in STORAGE_KEY_ACCOUNTS).
          // AuthGate will redirect to /(auth) once identity is null.
          logout();
        }}
      />

      <IncomingCallOverlay />
      <NotificationDrawerContainer />
    </View>
  );
}

export default function MainLayout() {
  return (
    <SettingsDialogProvider>
      <ActiveConversationProvider>
        <CommunityProvider>
          <CallProvider>
            <VoiceChannelProvider>
              <NotificationProvider>
                <ProfilePopoverProvider>
                  <MainLayoutInner />
                </ProfilePopoverProvider>
              </NotificationProvider>
            </VoiceChannelProvider>
          </CallProvider>
        </CommunityProvider>
      </ActiveConversationProvider>
    </SettingsDialogProvider>
  );
}
