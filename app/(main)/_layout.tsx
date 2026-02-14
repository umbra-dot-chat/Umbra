import React, { useState, useMemo, useCallback } from 'react';
import { View } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { HStack, useTheme } from '@coexist/wisp-react-native';

import { useUmbra } from '@/contexts/UmbraContext';
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
import { CommandPalette } from '@/components/modals/CommandPalette';
import { PluginMarketplace } from '@/components/modals/PluginMarketplace';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import type { Friend } from '@umbra/service';

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
  const { service } = useUmbra();
  const { conversations, refresh: refreshConversations } = useConversations();
  const { friends } = useFriends();
  const { groups, pendingInvites, acceptInvite, declineInvite } = useGroups();

  // Friend notifications (toast on incoming requests, acceptances)
  useFriendNotifications();

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
          last: 'Group',
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
        last: '',
        time: formatRelativeTime(c.lastMessageAt),
        unread: c.unreadCount,
        online: friend?.online,
      };
    });
  }, [conversations, friendMap, groupMap]);

  // Sidebar state
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState('1');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [newDmOpen, setNewDmOpen] = useState(false);
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();

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

  // Derived
  const filtered = sidebarConversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const isFriendsActive = pathname === '/friends';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.canvas }}>
      <HStack gap={0} style={{ flex: 1 }}>
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
          onOpenSettings={() => setSettingsOpen(true)}
          onFriendsPress={() => router.push('/friends')}
          onNewDm={() => setNewDmOpen(true)}
          onCreateGroup={() => setCreateGroupOpen(true)}
          onGuidePress={() => setGuideOpen(true)}
          onMarketplacePress={() => setMarketplaceOpen(true)}
          isFriendsActive={isFriendsActive}
          pendingInvites={pendingInvites}
          onAcceptInvite={handleAcceptInvite}
          onDeclineInvite={handleDeclineInvite}
        />

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
        onClose={() => setSettingsOpen(false)}
        onOpenMarketplace={() => {
          setSettingsOpen(false);
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

      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        onOpenSettings={() => {
          setCmdOpen(false);
          setSettingsOpen(true);
        }}
        onOpenMarketplace={() => {
          setCmdOpen(false);
          setMarketplaceOpen(true);
        }}
      />

      <PluginMarketplace
        open={marketplaceOpen}
        onClose={() => setMarketplaceOpen(false)}
      />
    </View>
  );
}

export default function MainLayout() {
  return (
    <ProfilePopoverProvider>
      <MainLayoutInner />
    </ProfilePopoverProvider>
  );
}
