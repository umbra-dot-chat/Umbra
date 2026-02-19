/**
 * Community Page — Channel content + member list (center + right columns).
 *
 * The community sidebar (left column) is rendered at the layout level
 * by CommunityLayoutSidebar, which swaps in when a community is active.
 *
 * This page renders only the center + right columns:
 *
 * ┌──────────────────────────────────┬──────────┐
 * │ ChannelHeader                    │ Member   │
 * │ #general — Welcome channel       │ List     │
 * ├──────────────────────────────────┤          │
 * │                                  │ ▾ Admin  │
 * │ Messages...                      │   Alice  │
 * │                                  │ ▾ Member │
 * │                                  │   Bob    │
 * ├──────────────────────────────────┤          │
 * │ [Type a message...]              │          │
 * └──────────────────────────────────┴──────────┘
 */

import React, { useMemo, useCallback, useState, useRef } from 'react';
import { View, Animated, Pressable } from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  useTheme, Text, EmojiPicker,
  MemberList, MessageInput, MessageList, E2EEKeyExchangeUI,
  type MemberListSection, type MemberListMember, type MessageListEntry,
} from '@coexist/wisp-react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useCommunity } from '@/hooks/useCommunity';
import { useCommunityMessages } from '@/hooks/useCommunityMessages';
import { useCommunityContext } from '@/contexts/CommunityContext';
import { useVoiceChannel } from '@/contexts/VoiceChannelContext';
import { CommunityChannelHeader } from '@/components/community/CommunityChannelHeader';
import { VoiceCallPanel } from '@/components/community/VoiceCallPanel';
import { MemberContextMenu } from '@/components/community/MemberContextMenu';
import type { MemberContextMenuRole } from '@/components/community/MemberContextMenu';
import { useRightPanel } from '@/hooks/useRightPanel';
import { useUmbra } from '@/contexts/UmbraContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { PANEL_WIDTH } from '@/types/panels';
import { VolumeIcon } from '@/components/icons';
import { FileChannelContent } from '@/components/community/FileChannelContent';

// ---------------------------------------------------------------------------
// Channel type mapping
// ---------------------------------------------------------------------------

function mapChannelType(type: string): string {
  switch (type) {
    case 'voice': return 'voice';
    case 'announcement': return 'announcement';
    case 'files': return 'files';
    case 'bulletin': return 'text';
    case 'welcome': return 'text';
    default: return 'text';
  }
}

// ---------------------------------------------------------------------------
// Mock channel data — matches CommunityLayoutSidebar mock channel IDs
// ---------------------------------------------------------------------------

type MockE2EEStatus = 'pending' | 'active' | 'rotating' | 'error';

interface MockChannel {
  id: string;
  name: string;
  channelType: string;
  topic?: string;
  e2eeEnabled: boolean;
  /** Per-channel E2EE mock state — only meaningful when e2eeEnabled is true */
  e2eeStatus?: MockE2EEStatus;
  e2eeKeyVersion?: number;
  e2eeErrorMessage?: string;
}

// ---------------------------------------------------------------------------
// Mock member data — populates the right-hand Members panel
// ---------------------------------------------------------------------------

interface MockMember {
  memberDid: string;
  nickname: string;
  roleId?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  statusText?: string;
}

const MOCK_MEMBERS: MockMember[] = [
  { memberDid: 'did:key:alice', nickname: 'Alice', roleId: 'role-admin', status: 'online', statusText: 'Deploying v2.0' },
  { memberDid: 'did:key:infamous', nickname: 'InfamousVague', roleId: 'role-admin', status: 'online', statusText: 'Building the future' },
  { memberDid: 'did:key:bob', nickname: 'Bob', roleId: 'role-mod', status: 'online', statusText: 'Reviewing PRs' },
  { memberDid: 'did:key:carol', nickname: 'Carol', roleId: 'role-mod', status: 'idle', statusText: 'AFK for lunch' },
  { memberDid: 'did:key:dave', nickname: 'Dave', roleId: 'role-mod', status: 'offline' },
  { memberDid: 'did:key:eve', nickname: 'Eve', status: 'online', statusText: 'Pair programming' },
  { memberDid: 'did:key:frank', nickname: 'Frank', status: 'online', statusText: 'Listening to lofi' },
  { memberDid: 'did:key:grace', nickname: 'Grace', status: 'idle', statusText: 'In a meeting' },
  { memberDid: 'did:key:heidi', nickname: 'Heidi', status: 'online' },
  { memberDid: 'did:key:ivan', nickname: 'Ivan', status: 'offline' },
  { memberDid: 'did:key:jay', nickname: 'Jay', status: 'online', statusText: 'Shipping features' },
  { memberDid: 'did:key:karen', nickname: 'Karen', status: 'dnd', statusText: 'Do not disturb' },
  { memberDid: 'did:key:leo', nickname: 'Leo', status: 'offline' },
  { memberDid: 'did:key:mia', nickname: 'Mia', status: 'online', statusText: 'Designing screens' },
  { memberDid: 'did:key:nate', nickname: 'Nate', status: 'offline' },
  { memberDid: 'did:key:olivia', nickname: 'Olivia', status: 'online' },
  { memberDid: 'did:key:peter', nickname: 'Peter', status: 'idle', statusText: 'Getting coffee' },
  { memberDid: 'did:key:quinn', nickname: 'Quinn', status: 'offline' },
  { memberDid: 'did:key:rachel', nickname: 'Rachel', status: 'online', statusText: 'Writing tests' },
  { memberDid: 'did:key:sam', nickname: 'Sam', status: 'offline' },
];

const MOCK_ROLE_MAP: Record<string, { name: string; color: string; position: number }> = {
  'role-admin': { name: 'Admin', color: '#e74c3c', position: 2 },
  'role-mod': { name: 'Moderator', color: '#2ecc71', position: 1 },
};

const MOCK_CHANNELS: MockChannel[] = [
  { id: 'welcome', name: 'welcome', channelType: 'text', topic: 'Say hello and introduce yourself to the community', e2eeEnabled: false },
  { id: 'rules', name: 'rules', channelType: 'announcement', topic: 'Please read the rules before posting anywhere', e2eeEnabled: false },
  { id: 'announcements', name: 'announcements', channelType: 'announcement', topic: 'Important updates and news from the Umbra team', e2eeEnabled: false },
  { id: 'general', name: 'general', channelType: 'text', topic: 'Hang out and chat about anything Umbra related', e2eeEnabled: false },
  { id: 'random', name: 'random', channelType: 'text', topic: 'Off-topic banter, memes, and everything in between', e2eeEnabled: false },
  { id: 'memes', name: 'memes', channelType: 'text', topic: 'Only the finest memes allowed here', e2eeEnabled: false },
  { id: 'lounge', name: 'Lounge', channelType: 'voice', topic: 'Chill and hang out with voice chat', e2eeEnabled: false },
  { id: 'gaming', name: 'Gaming', channelType: 'voice', topic: 'Squad up for some games', e2eeEnabled: false },
  // Encrypted — active, high key version (stable long-running channel)
  { id: 'frontend', name: 'frontend', channelType: 'text', topic: 'React Native, TypeScript, and UI discussions', e2eeEnabled: true, e2eeStatus: 'active', e2eeKeyVersion: 7 },
  // Encrypted — rotating keys (a member was just removed)
  { id: 'backend', name: 'backend', channelType: 'text', topic: 'APIs, databases, and server architecture', e2eeEnabled: true, e2eeStatus: 'rotating', e2eeKeyVersion: 4 },
  { id: 'design', name: 'design', channelType: 'text', topic: 'UI/UX design reviews and feedback', e2eeEnabled: false },
  { id: 'docs', name: 'documentation', channelType: 'text', topic: 'Docs, guides, and how-tos for contributors', e2eeEnabled: false },
  // Encrypted — error state (peer offline)
  { id: 'releases', name: 'releases', channelType: 'announcement', topic: 'Release notes, changelogs, and version updates', e2eeEnabled: true, e2eeStatus: 'error', e2eeKeyVersion: 2, e2eeErrorMessage: 'Key exchange failed — admin node unreachable' },
  { id: 'shared-files', name: 'shared-files', channelType: 'files', topic: 'Upload and share files with the community', e2eeEnabled: false },
  { id: 'off-topic', name: 'off-topic', channelType: 'text', topic: 'Whatever is on your mind, no judgment', e2eeEnabled: false },
  // Encrypted — pending (newly created encrypted channel)
  { id: 'gaming-chat', name: 'gaming', channelType: 'text', topic: 'Looking for group, game recs, and gaming chat', e2eeEnabled: true, e2eeStatus: 'pending', e2eeKeyVersion: 1 },
];

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyCommunity() {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Text size="display-sm" weight="bold" style={{ color: theme.colors.text.primary, marginBottom: 8 }}>
        Select a channel
      </Text>
      <Text size="sm" style={{ color: theme.colors.text.muted, textAlign: 'center', maxWidth: 400 }}>
        Choose a channel from the sidebar to start chatting with your community.
      </Text>
    </View>
  );
}

/**
 * VoiceChannelLobby — shown when a voice channel is selected but the user
 * is not currently connected to it.
 *
 * Displays the channel name, who's currently in the channel (via
 * voiceParticipants), and a button to join.
 */
function VoiceChannelLobby({
  channelName,
  communityId,
  channelId,
  members,
}: {
  channelName: string;
  communityId: string;
  channelId: string;
  members: Array<{ memberDid: string; displayName?: string; nickname?: string }>;
}) {
  const { theme } = useTheme();
  const { joinVoiceChannel, voiceParticipants, isConnecting } = useVoiceChannel();
  const colors = theme.colors;

  // Who's already in this channel?
  const channelDids = voiceParticipants.get(channelId);
  const connectedMembers = useMemo(() => {
    if (!channelDids || channelDids.size === 0) return [];
    return Array.from(channelDids).map((did) => {
      const m = members.find((mm) => mm.memberDid === did);
      return {
        did,
        name: m?.nickname || m?.displayName || `${did.slice(0, 8)}…`,
      };
    });
  }, [channelDids, members]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 40 }}>
      {/* Channel name */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <VolumeIcon size={20} color={colors.text.primary} />
        <Text size="lg" weight="semibold" style={{ color: colors.text.primary }}>
          {channelName}
        </Text>
      </View>

      {/* Connected users */}
      {connectedMembers.length > 0 ? (
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text size="sm" style={{ color: colors.text.muted }}>
            {connectedMembers.length} {connectedMembers.length === 1 ? 'person' : 'people'} connected
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
            {connectedMembers.map((m) => (
              <View
                key={m.did}
                style={{
                  backgroundColor: colors.background.raised,
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text size="xs" style={{ color: colors.text.secondary }}>{m.name}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <Text size="sm" style={{ color: colors.text.muted }}>
          No one is in this channel yet
        </Text>
      )}

      {/* Join button */}
      <Pressable
        onPress={() => joinVoiceChannel(communityId, channelId)}
        disabled={isConnecting}
        style={({ pressed }) => ({
          backgroundColor: pressed ? colors.status.success : colors.status.success,
          opacity: pressed ? 0.85 : isConnecting ? 0.6 : 1,
          borderRadius: 8,
          paddingHorizontal: 24,
          paddingVertical: 10,
        })}
        accessibilityRole="button"
        accessibilityLabel="Join voice channel"
      >
        <Text size="sm" weight="semibold" style={{ color: '#fff' }}>
          {isConnecting ? 'Connecting…' : 'Join Voice Channel'}
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Community Page
// ---------------------------------------------------------------------------

export default function CommunityPage() {
  const { communityId } = useLocalSearchParams<{ communityId: string }>();
  const { theme } = useTheme();
  const { identity } = useAuth();
  const { service } = useUmbra();
  const myDid = identity?.did ?? '';
  const isMock = communityId?.startsWith('mock-') ?? false;

  // Read active channel from shared context (set by CommunityLayoutSidebar)
  const { activeChannelId } = useCommunityContext();

  // Voice channel state
  const { activeChannelId: voiceActiveChannelId, voiceParticipants } = useVoiceChannel();

  // Community data (channels, members, roles for this page's needs)
  const {
    community,
    channels: realChannels,
    members,
    roles,
    memberRolesMap,
    refresh: refreshCommunity,
  } = useCommunity(communityId ?? null);

  // Permission context for file channels
  const myRoles = memberRolesMap[myDid] ?? [];
  const isOwner = community?.ownerDid === myDid;

  // Use mock channels as fallback when no real channels are available
  const channels = isMock && realChannels.length === 0 ? MOCK_CHANNELS : realChannels;

  // Messages for the active channel
  const {
    messages,
    isLoading: msgsLoading,
    sendMessage,
  } = useCommunityMessages(isMock ? null : activeChannelId);

  // Right panel
  const { visiblePanel, panelWidth, togglePanel } = useRightPanel();

  // Message display mode (bubble vs inline)
  const { displayMode } = useMessaging();

  // Emoji picker + message text state
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [messageText, setMessageText] = useState('');

  // Member context menu state
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuMember, setContextMenuMember] = useState<{ id: string; name: string } | null>(null);
  const [contextMenuLayout, setContextMenuLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [contextMenuMemberRoleIds, setContextMenuMemberRoleIds] = useState<Set<string>>(new Set());

  // Get the active channel info
  const activeChannel = channels.find((c: any) => c.id === activeChannelId);

  // ---------------------------------------------------------------------------
  // Transform members for Wisp MemberList
  // ---------------------------------------------------------------------------

  // Use mock members as fallback for mock communities
  const effectiveMembers = isMock && members.length === 0 ? MOCK_MEMBERS : members;

  const memberSections = useMemo<MemberListSection[]>(() => {
    // Mock community: group by role, then online/offline within each
    if (isMock) {
      const sections = new Map<string, { label: string; position: number; labelColor?: string; members: MemberListMember[] }>();

      // Create role sections with colors
      for (const [roleId, role] of Object.entries(MOCK_ROLE_MAP)) {
        sections.set(roleId, {
          label: role.name,
          position: role.position,
          labelColor: role.color,
          members: [],
        });
      }
      sections.set('online', { label: 'Online', position: -1, members: [] });
      sections.set('offline', { label: 'Offline', position: -2, members: [] });

      for (const member of MOCK_MEMBERS) {
        const roleInfo = member.roleId ? MOCK_ROLE_MAP[member.roleId] : undefined;
        const m: MemberListMember = {
          id: member.memberDid,
          name: member.nickname,
          status: member.status,
          statusText: member.statusText,
          roleColor: roleInfo?.color,
        };

        if (member.roleId && sections.has(member.roleId)) {
          sections.get(member.roleId)!.members.push(m);
        } else if (member.status === 'offline') {
          sections.get('offline')!.members.push(m);
        } else {
          sections.get('online')!.members.push(m);
        }
      }

      return Array.from(sections.entries())
        .filter(([, s]) => s.members.length > 0)
        .sort(([, a], [, b]) => b.position - a.position)
        .map(([id, section]) => ({
          id,
          label: section.label,
          labelColor: section.labelColor,
          members: section.members,
          memberCount: section.members.length,
        }));
    }

    // Real community: bucket members by their highest hoisted role
    // Sort roles descending by position (Owner 1000 → Admin 100 → Mod 50 → Member 0)
    const sortedRoles = [...roles].sort((a: any, b: any) => b.position - a.position);
    const hoistedRoles = sortedRoles.filter((r: any) => r.hoisted);

    // Create buckets: one per hoisted role + catch-all "Members"
    const buckets = new Map<
      string,
      { label: string; position: number; labelColor?: string; members: MemberListMember[] }
    >();

    for (const role of hoistedRoles) {
      buckets.set(role.id, {
        label: role.name,
        position: role.position,
        labelColor: role.color,
        members: [],
      });
    }
    buckets.set('__members__', { label: 'Members', position: -1, members: [] });

    // Resolve member name: nickname → current user displayName → truncated DID
    const resolveName = (member: any): string => {
      if (member.nickname) return member.nickname;
      if (member.memberDid === myDid && identity?.displayName) return identity.displayName;
      return member.memberDid.slice(0, 16) + '...';
    };

    for (const member of effectiveMembers) {
      const memberDid = (member as any).memberDid;
      const assignedRoles = memberRolesMap[memberDid] ?? [];

      // Find the highest hoisted role this member is assigned to
      const highestHoisted = assignedRoles
        .filter((r: any) => r.hoisted)
        .sort((a: any, b: any) => b.position - a.position)[0];

      // Top role for name color
      const topRole = assignedRoles.length > 0
        ? [...assignedRoles].sort((a: any, b: any) => b.position - a.position)[0]
        : undefined;

      const memberEntry: MemberListMember = {
        id: memberDid,
        name: resolveName(member),
        status: 'online',
        roleText: topRole?.name,
        roleColor: topRole?.color ?? undefined,
      };

      if (highestHoisted && buckets.has(highestHoisted.id)) {
        buckets.get(highestHoisted.id)!.members.push(memberEntry);
      } else {
        buckets.get('__members__')!.members.push(memberEntry);
      }
    }

    return Array.from(buckets.entries())
      .filter(([, bucket]) => bucket.members.length > 0)
      .sort(([, a], [, b]) => b.position - a.position)
      .map(([id, section]) => ({
        id,
        label: section.label,
        labelColor: section.labelColor,
        members: section.members,
        memberCount: section.members.length,
      }));
  }, [isMock, effectiveMembers, roles, memberRolesMap, myDid, identity]);

  // ---------------------------------------------------------------------------
  // Transform messages for Wisp MessageList
  // ---------------------------------------------------------------------------

  // Build a quick DID → display name lookup for message senders
  const memberNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of effectiveMembers) {
      const did = (member as any).memberDid;
      const name = (member as any).nickname || undefined;
      if (name) map.set(did, name);
    }
    // Current user: use identity displayName
    if (myDid && identity?.displayName) {
      map.set(myDid, identity.displayName);
    }
    return map;
  }, [effectiveMembers, myDid, identity]);

  const messageEntries = useMemo<MessageListEntry[]>(() => {
    const sorted = [...messages].reverse();
    const entries: MessageListEntry[] = [];
    let lastDate = '';

    for (const msg of sorted) {
      const msgDate = new Date(msg.createdAt < 1000000000000 ? msg.createdAt * 1000 : msg.createdAt);
      const dateStr = msgDate.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });

      if (dateStr !== lastDate) {
        entries.push({ type: 'separator', label: dateStr });
        lastDate = dateStr;
      }

      const senderName = memberNameMap.get(msg.senderDid) ?? msg.senderDid.slice(0, 16) + '...';

      entries.push({
        type: 'message',
        id: msg.id,
        sender: senderName,
        content: msg.content,
        timestamp: new Date(msg.createdAt < 1000000000000 ? msg.createdAt * 1000 : msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: msg.senderDid === myDid,
        edited: msg.edited,
        ...(msg.threadReplyCount > 0 ? { threadInfo: { replyCount: msg.threadReplyCount } } : {}),
      });
    }

    return entries;
  }, [messages, myDid, memberNameMap]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSendMessage = useCallback(async (text: string) => {
    if (text.trim()) {
      await sendMessage(text.trim());
    }
  }, [sendMessage]);

  // -- Context menu: roles list (non-default roles) -------------------------

  const contextMenuRoles = useMemo<MemberContextMenuRole[]>(() => {
    if (isMock) {
      return Object.entries(MOCK_ROLE_MAP).map(([id, role]) => ({
        id,
        name: role.name,
        color: role.color,
      }));
    }
    return roles
      .filter((r: any) => !r.isPreset && r.name !== 'Member')
      .sort((a: any, b: any) => b.position - a.position)
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        color: r.color ?? '#95a5a6',
      }));
  }, [isMock, roles]);

  // -- Context menu: long-press handler -------------------------------------

  const handleMemberLongPress = useCallback(
    async (member: MemberListMember, event: GestureResponderEvent) => {
      const { pageX, pageY } = event.nativeEvent;
      setContextMenuMember({ id: member.id, name: member.name });
      setContextMenuLayout({ x: pageX, y: pageY, width: 0, height: 0 });

      // For mock communities, derive roles from mock data
      if (isMock) {
        const mockMember = MOCK_MEMBERS.find((m) => m.memberDid === member.id);
        const roleIds = new Set<string>();
        if (mockMember?.roleId) roleIds.add(mockMember.roleId);
        setContextMenuMemberRoleIds(roleIds);
        setContextMenuOpen(true);
        return;
      }

      // For real communities, fetch member roles from service
      if (service && communityId) {
        try {
          const memberRoles = await service.getMemberRoles(communityId, member.id);
          setContextMenuMemberRoleIds(new Set(memberRoles.map((r: any) => r.id)));
        } catch (err) {
          console.warn('[CommunityPage] Failed to get member roles:', err);
          setContextMenuMemberRoleIds(new Set());
        }
      }
      setContextMenuOpen(true);
    },
    [isMock, service, communityId],
  );

  // -- Context menu: role toggle handler ------------------------------------

  const handleRoleToggle = useCallback(
    async (memberId: string, roleId: string, assign: boolean) => {
      // Optimistic update
      setContextMenuMemberRoleIds((prev) => {
        const next = new Set(prev);
        if (assign) next.add(roleId);
        else next.delete(roleId);
        return next;
      });

      if (isMock) return; // Mock — no backend call

      if (service && communityId && myDid) {
        try {
          if (assign) {
            await service.assignRole(communityId, memberId, roleId, myDid);
          } else {
            await service.unassignRole(communityId, memberId, roleId, myDid);
          }
          // Refresh community data after role change
          await refreshCommunity();
        } catch (err) {
          console.warn('[CommunityPage] Failed to toggle role:', err);
          // Revert optimistic update
          setContextMenuMemberRoleIds((prev) => {
            const next = new Set(prev);
            if (assign) next.delete(roleId);
            else next.add(roleId);
            return next;
          });
        }
      }
    },
    [isMock, service, communityId, myDid, refreshCommunity],
  );

  // -- Context menu: kick handler ---------------------------------------------

  const handleKick = useCallback(
    async (memberId: string) => {
      if (isMock || !service || !communityId) return;
      try {
        await service.kickCommunityMember(communityId, memberId, myDid);
        setContextMenuOpen(false);
        await refreshCommunity();
      } catch (err) {
        console.warn('[CommunityPage] Failed to kick member:', err);
      }
    },
    [isMock, service, communityId, myDid, refreshCommunity],
  );

  // -- Context menu: ban handler ----------------------------------------------

  const handleBan = useCallback(
    async (memberId: string) => {
      if (isMock || !service || !communityId) return;
      try {
        await service.banCommunityMember(communityId, memberId, myDid);
        setContextMenuOpen(false);
        await refreshCommunity();
      } catch (err) {
        console.warn('[CommunityPage] Failed to ban member:', err);
      }
    },
    [isMock, service, communityId, myDid, refreshCommunity],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: theme.colors.background.canvas }}>
      {/* Center column: Channel content */}
      <View style={{ flex: 1, flexDirection: 'column', minWidth: 0 }}>
        {activeChannel && activeChannel.channelType === 'voice' && voiceActiveChannelId === activeChannelId ? (
          /* Voice channel — show call panel when connected */
          <VoiceCallPanel
            channelName={activeChannel.name}
            members={effectiveMembers as any}
            myDid={myDid}
            myDisplayName={identity?.displayName}
          />
        ) : activeChannel && activeChannel.channelType === 'voice' ? (
          /* Voice channel selected but not connected — show lobby */
          <VoiceChannelLobby
            channelName={activeChannel.name}
            communityId={communityId!}
            channelId={activeChannelId!}
            members={effectiveMembers as any}
          />
        ) : activeChannel && activeChannel.channelType === 'files' ? (
          /* File channel — show file manager */
          <>
            <CommunityChannelHeader
              name={activeChannel.name}
              type={mapChannelType(activeChannel.channelType) as any}
              topic={activeChannel.topic ?? 'Shared files'}
              encrypted={activeChannel.e2eeEnabled}
              rightPanel={visiblePanel}
              togglePanel={togglePanel}
            />
            <FileChannelContent
              channelId={activeChannelId!}
              communityId={communityId!}
              myRoles={myRoles}
              isOwner={isOwner}
            />
          </>
        ) : activeChannel ? (
          <>
            {/* Channel Header */}
            <CommunityChannelHeader
              name={activeChannel.name}
              type={mapChannelType(activeChannel.channelType) as any}
              topic={activeChannel.topic}
              encrypted={activeChannel.e2eeEnabled}
              rightPanel={visiblePanel}
              togglePanel={togglePanel}
            />

            {/* Messages — E2EE banner scrolls at the top of the message list */}
            <View style={{ flex: 1 }}>
              <MessageList
                entries={messageEntries}
                displayMode={displayMode}
                skeleton={msgsLoading && messageEntries.length === 0}
                stickyHeader={
                  activeChannel.e2eeEnabled ? (
                    <E2EEKeyExchangeUI
                      status={(activeChannel as MockChannel).e2eeStatus ?? 'active'}
                      keyVersion={(activeChannel as MockChannel).e2eeKeyVersion}
                      errorMessage={(activeChannel as MockChannel).e2eeErrorMessage}
                      onRetry={() => {}}
                      onRotateKey={() => {}}
                      rotating={(activeChannel as MockChannel).e2eeStatus === 'rotating'}
                    />
                  ) : undefined
                }
              />
            </View>

            {/* Message Input */}
            <View style={{ position: 'relative', padding: 12 }}>
              {emojiOpen && (
                <View style={{ position: 'absolute', bottom: 64, right: 12, zIndex: 20 }}>
                  <EmojiPicker
                    size="md"
                    onSelect={(emoji: string) => {
                      setMessageText((prev) => prev + emoji);
                      setEmojiOpen(false);
                    }}
                  />
                </View>
              )}
              <MessageInput
                value={messageText}
                onValueChange={setMessageText}
                placeholder={`Message #${activeChannel.name}`}
                onSubmit={(msg: string) => {
                  handleSendMessage(msg);
                  setMessageText('');
                }}
                variant="pill"
                showAttachment
                showEmoji
                onEmojiClick={() => setEmojiOpen((prev) => !prev)}
              />
            </View>
          </>
        ) : (
          <EmptyCommunity />
        )}
      </View>

      {/* Right column: Members panel (animated) */}
      <Animated.View style={{ width: panelWidth, overflow: 'hidden' }}>
        <View style={{ width: PANEL_WIDTH, height: '100%', borderLeftWidth: 1, borderLeftColor: theme.colors.border.subtle }}>
          {visiblePanel === 'members' && (
            <MemberList
              sections={memberSections}
              title={`Members — ${effectiveMembers.length}`}
              onClose={() => togglePanel('members')}
              onMemberLongPress={handleMemberLongPress}
            />
          )}
        </View>
      </Animated.View>

      {/* Member context menu (role picker dropdown) */}
      <MemberContextMenu
        open={contextMenuOpen}
        onOpenChange={setContextMenuOpen}
        anchorLayout={contextMenuLayout}
        member={contextMenuMember}
        roles={contextMenuRoles}
        memberRoleIds={contextMenuMemberRoleIds}
        onRoleToggle={handleRoleToggle}
        onKick={!isMock ? handleKick : undefined}
        onBan={!isMock ? handleBan : undefined}
      />
    </View>
  );
}
