import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { HStack, useTheme } from '@coexist/wisp-react-native';

import { useUmbra } from '@/contexts/UmbraContext';
import { ActiveConversationProvider, useActiveConversation } from '@/contexts/ActiveConversationContext';
import { useConversations } from '@/hooks/useConversations';
import { useFriends } from '@/hooks/useFriends';
import { useGroups } from '@/hooks/useGroups';
import { useFriendNotifications } from '@/hooks/useFriendNotifications';
import { ChatSidebar } from '@/components/sidebar/ChatSidebar';
import { SettingsDialog } from '@/components/modals/SettingsDialog';
import { GuideDialog } from '@/components/modals/GuideDialog';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { NewDmDialog } from '@/components/modals/NewDmDialog';
import { ProfilePopover } from '@/components/modals/ProfilePopover';
import { ProfilePopoverProvider, useProfilePopoverContext } from '@/contexts/ProfilePopoverContext';
import { CallProvider, useCallContext } from '@/contexts/CallContext';
import { CallPipWidget } from '@coexist/wisp-react-native';
import { IncomingCallOverlay } from '@/components/call/IncomingCallOverlay';
import { CommandPalette } from '@/components/modals/CommandPalette';
import { PluginMarketplace } from '@/components/modals/PluginMarketplace';
import { InstallBanner } from '@/components/ui/InstallBanner';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { SettingsDialogProvider, useSettingsDialog } from '@/contexts/SettingsDialogContext';
import { CommunityProvider } from '@/contexts/CommunityContext';
import { VoiceChannelProvider } from '@/contexts/VoiceChannelContext';
import { useCommunities } from '@/hooks/useCommunities';
import { NavigationRail } from '@/components/navigation/NavigationRail';
import { CommunityLayoutSidebar } from '@/components/sidebar/CommunityLayoutSidebar';
import { CommunityCreateDialog } from '@coexist/wisp-react-native';
import type { Community, Friend, MessageEvent } from '@umbra/service';
import { useAuth } from '@/contexts/AuthContext';

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

  // Service + data hooks
  const { service, isReady } = useUmbra();
  const { identity } = useAuth();
  const { conversations, refresh: refreshConversations, isLoading: conversationsLoading } = useConversations();
  const { friends } = useFriends();
  const { groups, pendingInvites, acceptInvite, declineInvite } = useGroups();
  const { communities: realCommunities, createCommunity, isLoading: communitiesLoading } = useCommunities();

  // Merge mock community with real ones (TODO: remove mock once real communities exist)
  const communities = useMemo(() => [MOCK_COMMUNITY, ...realCommunities], [realCommunities]);

  // Whether the core service is still initializing (WASM + identity)
  const coreLoading = !isReady || !identity;

  // Friend notifications (toast on incoming requests, acceptances)
  useFriendNotifications();

  // Call state for PiP widget
  const { activeCall, toggleMute, endCall } = useCallContext();

  // Build a DID → friend map for efficient lookups
  const friendMap = useMemo(() => {
    const map: Record<string, { displayName: string; online?: boolean }> = {};
    for (const f of friends) {
      map[f.did] = { displayName: f.displayName, online: f.online };
    }
    return map;
  }, [friends]);

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
  }, [conversations, friendMap, groupMap, lastMessages]);

  // Sidebar state
  const [search, setSearch] = useState('');
  const { activeId, setActiveId, requestSearchPanel } = useActiveConversation();
  const { isOpen: settingsOpen, openSettings, closeSettings, initialSection: settingsInitialSection } = useSettingsDialog();
  const [guideOpen, setGuideOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [newDmOpen, setNewDmOpen] = useState(false);
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
  const [createCommunityOpen, setCreateCommunityOpen] = useState(false);
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
        const content = event.message.content;
        if (content.type === 'text') {
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
        setCreateCommunityOpen(false);
        router.push(`/community/${result.communityId}`);
      } else {
        setCommunityError('Failed to create community. Please try again.');
      }
    } catch (err) {
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

  // Navigate to community page
  const handleCommunityPress = useCallback((communityId: string) => {
    router.push(`/community/${communityId}`);
  }, [router]);

  // Navigate to home (conversations)
  const handleHomePress = useCallback(() => {
    if (pathname !== '/' && pathname !== '/friends') {
      router.push('/');
    }
  }, [pathname, router]);

  // Home is active when NOT on a community page and NOT on files page
  const isHomeActive = !pathname.startsWith('/community/') && pathname !== '/files';

  // Whether the files page is active
  const isFilesActive = pathname === '/files';

  // Navigate to files page
  const handleFilesPress = useCallback(() => {
    router.push('/files');
  }, [router]);

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

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.canvas }}>
      <InstallBanner />
      <HStack gap={0} style={{ flex: 1 }}>
        <NavigationRail
          isHomeActive={isHomeActive}
          onHomePress={handleHomePress}
          isFilesActive={isFilesActive}
          onFilesPress={handleFilesPress}
          communities={communities}
          activeCommunityId={activeCommunityId}
          onCommunityPress={handleCommunityPress}
          onCreateCommunity={() => setCreateCommunityOpen(true)}
          onOpenSettings={() => openSettings()}
          loading={coreLoading || communitiesLoading}
        />
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
            onNewDm={() => setNewDmOpen(true)}
            onCreateGroup={() => setCreateGroupOpen(true)}
            onGuidePress={() => setGuideOpen(true)}
            onMarketplacePress={() => setMarketplaceOpen(true)}
            isFriendsActive={isFriendsActive}
            pendingInvites={pendingInvites}
            onAcceptInvite={handleAcceptInvite}
            onDeclineInvite={handleDeclineInvite}
            loading={coreLoading || conversationsLoading}
          />
        )}

        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </HStack>

      <ProfilePopover
        selectedMember={selectedMember}
        anchor={popoverAnchor}
        onClose={closeProfile}
      />

      <SettingsDialog
        open={settingsOpen}
        onClose={() => closeSettings()}
        initialSection={settingsInitialSection}
        onOpenMarketplace={() => {
          closeSettings();
          setMarketplaceOpen(true);
        }}
      />

      <GuideDialog
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
      />

      <CreateGroupDialog
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onCreated={handleGroupCreated}
      />

      <NewDmDialog
        open={newDmOpen}
        onClose={() => setNewDmOpen(false)}
        onSelectFriend={handleDmFriendSelected}
      />

      <CommunityCreateDialog
        open={createCommunityOpen}
        onClose={handleCloseCommunityDialog}
        onSubmit={handleCommunityCreated}
        submitting={communitySubmitting}
        error={communityError}
      />

      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        onOpenSettings={() => {
          setCmdOpen(false);
          openSettings();
        }}
        onOpenMarketplace={() => {
          setCmdOpen(false);
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
        onClose={() => setMarketplaceOpen(false)}
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

      <IncomingCallOverlay />
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
              <ProfilePopoverProvider>
                <MainLayoutInner />
              </ProfilePopoverProvider>
            </VoiceChannelProvider>
          </CallProvider>
        </CommunityProvider>
      </ActiveConversationProvider>
    </SettingsDialogProvider>
  );
}
