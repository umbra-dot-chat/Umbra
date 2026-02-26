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
import { Platform, View, Image, Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { GestureResponderEvent } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  useTheme, Text, Avatar,
  MessageInput,
  CombinedPicker, MemberList, MessageList, PinnedMessages,
} from '@coexist/wisp-react-native';
import type { MemberListSection, MemberListMember, MessageListEntry } from '@coexist/wisp-react-native';
import type { EmojiItem } from '@coexist/wisp-core/types/EmojiPicker.types';
import type { StickerPickerPack } from '@coexist/wisp-core/types/StickerPicker.types';

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
import { parseMessageContent, buildEmojiMap } from '@/utils/parseMessageContent';
import { getBuiltInCommunityEmoji } from '@/constants/builtInEmoji';
import { useMessaging } from '@/contexts/MessagingContext';
import { PANEL_WIDTH } from '@/types/panels';
import { VolumeIcon, ArrowLeftIcon } from '@/components/icons';
import { FileChannelContent } from '@/components/community/FileChannelContent';
import { AnimatedPresence } from '@/components/ui/AnimatedPresence';
import { pickFile } from '@/utils/filePicker';

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

// (Mock data removed — all communities now use real backend data)

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
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
            {connectedMembers.map((m) => (
              <View
                key={m.did}
                style={{
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: colors.background.raised,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Avatar name={m.name} size="sm" status="online" />
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
  const insets = useSafeAreaInsets();
  const myDid = identity?.did ?? '';

  // Read active channel from shared context (set by CommunityLayoutSidebar)
  const { activeChannelId, setActiveChannelId } = useCommunityContext();
  const isMobile = useIsMobile();

  // Voice channel state
  const { activeChannelId: voiceActiveChannelId, voiceParticipants } = useVoiceChannel();

  // Community data (channels, members, roles for this page's needs)
  const {
    community,
    channels: realChannels,
    members,
    roles,
    seats,
    emoji: communityEmoji,
    stickers: communityStickers,
    stickerPacks: communityStickerPacks,
    memberRolesMap,
    refresh: refreshCommunity,
  } = useCommunity(communityId ?? null);

  // Permission context for file channels
  const myRoles = memberRolesMap[myDid] ?? [];
  const isOwner = community?.ownerDid === myDid;

  // Built-in emoji (always available)
  const builtInEmoji = useMemo(() => getBuiltInCommunityEmoji(), []);

  // Transform community emoji to EmojiPicker items (built-in + community)
  const customEmojiItems = useMemo<EmojiItem[]>(() => {
    const builtInItems = builtInEmoji.map((e) => ({
      emoji: `:${e.name}:`,
      name: e.name,
      category: 'custom' as const,
      keywords: [e.name, 'ghost', 'umbra', 'logo'],
      imageUrl: e.imageUrl,
      animated: e.animated,
      groupId: '__builtin__',
      groupName: 'Umbra',
    }));
    const communityItems = (communityEmoji ?? []).map((e) => ({
      emoji: `:${e.name}:`,
      name: e.name,
      category: 'custom' as const,
      keywords: [e.name],
      imageUrl: e.imageUrl,
      animated: e.animated,
      groupId: e.communityId,
      groupName: community?.name ?? e.communityId,
    }));
    return [...builtInItems, ...communityItems];
  }, [communityEmoji, builtInEmoji, community?.name]);

  // Build emoji map for inline rendering in messages (built-in + community)
  const emojiMap = useMemo(
    () => buildEmojiMap([...builtInEmoji, ...(communityEmoji ?? [])]),
    [builtInEmoji, communityEmoji],
  );

  // Transform community stickers into StickerPicker packs
  const stickerPickerPacks = useMemo<StickerPickerPack[]>(() => {
    if (!communityStickers || communityStickers.length === 0) return [];

    // Group stickers by pack
    const packMap = new Map<string, { id: string; name: string; stickers: Array<{ id: string; name: string; imageUrl: string; animated?: boolean }> }>();

    // Add packs from communityStickerPacks first
    for (const pack of (communityStickerPacks ?? [])) {
      packMap.set(pack.id, { id: pack.id, name: pack.name, stickers: [] });
    }

    // Default "Uncategorized" pack for stickers without a pack
    const uncategorizedId = '__uncategorized__';

    for (const sticker of communityStickers) {
      const packId = sticker.packId ?? uncategorizedId;
      if (!packMap.has(packId)) {
        packMap.set(packId, { id: packId, name: packId === uncategorizedId ? 'Stickers' : packId, stickers: [] });
      }
      packMap.get(packId)!.stickers.push({
        id: sticker.id,
        name: sticker.name,
        imageUrl: sticker.imageUrl,
        animated: sticker.animated,
      });
    }

    // Filter out empty packs and return
    return Array.from(packMap.values()).filter((p) => p.stickers.length > 0);
  }, [communityStickers, communityStickerPacks]);

  const channels = realChannels;

  // Messages for the active channel
  const {
    messages,
    isLoading: msgsLoading,
    sendMessage,
    pinnedMessages,
    unpinMessage,
  } = useCommunityMessages(activeChannelId, communityId);

  // Right panel
  const { visiblePanel, panelWidth, togglePanel } = useRightPanel();

  // Message display mode (bubble vs inline)
  const { displayMode } = useMessaging();

  // Emoji picker + sticker picker + message text state
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

  const memberSections = useMemo<MemberListSection[]>(() => {
    // Bucket members by their highest hoisted role
    const sortedRoles = [...roles].sort((a: any, b: any) => b.position - a.position);
    const hoistedRoles = sortedRoles.filter((r: any) => r.hoisted);

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

    const resolveName = (member: any): string => {
      if (member.nickname) return member.nickname;
      if (member.memberDid === myDid && identity?.displayName) return identity.displayName;
      return member.memberDid.slice(0, 16) + '...';
    };

    for (const member of members) {
      const memberDid = (member as any).memberDid;
      const assignedRoles = memberRolesMap[memberDid] ?? [];

      const highestHoisted = assignedRoles
        .filter((r: any) => r.hoisted)
        .sort((a: any, b: any) => b.position - a.position)[0];

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
  }, [members, roles, memberRolesMap, myDid, identity]);

  // ---------------------------------------------------------------------------
  // Transform messages for Wisp MessageList
  // ---------------------------------------------------------------------------

  // Build a quick DID → display name lookup for message senders
  const memberNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of members) {
      const did = (member as any).memberDid;
      const name = (member as any).nickname || undefined;
      if (name) map.set(did, name);
    }
    // Current user: use identity displayName
    if (myDid && identity?.displayName) {
      map.set(myDid, identity.displayName);
    }
    return map;
  }, [members, myDid, identity]);

  // Build a platformUserId → CommunitySeat lookup for ghost seat rendering
  const seatByPlatformUserId = useMemo(() => {
    const map = new Map<string, typeof seats[0]>();
    for (const seat of seats) {
      if (seat.platformUserId) {
        map.set(seat.platformUserId, seat);
      }
    }
    return map;
  }, [seats]);

  // Build pinned messages for the right panel
  // Uses ghost seat lookup for imported/bridge messages
  const pinnedForPanel = useMemo(() =>
    (pinnedMessages || []).map((m) => {
      // Look up ghost seat if message has a platformUserId
      const seat = m.platformUserId ? seatByPlatformUserId.get(m.platformUserId) : undefined;

      // Priority: seat username > senderDisplayName > member nickname > truncated DID
      const sender = (seat ? seat.platformUsername : undefined)
        || m.senderDisplayName
        || (m.senderDid ? (memberNameMap.get(m.senderDid) || (m.senderDid === myDid ? 'You' : m.senderDid.slice(0, 16))) : 'Unknown');

      return {
        id: m.id,
        sender,
        content: m.content ?? '',
        timestamp: m.createdAt
          ? new Date(m.createdAt < 1000000000000 ? m.createdAt * 1000 : m.createdAt)
              .toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          : '',
        pinnedBy: m.pinnedBy
          ? (memberNameMap.get(m.pinnedBy) || m.pinnedBy.slice(0, 16))
          : undefined,
        // Include avatar URL for potential future use in pinned message display
        avatarUrl: seat?.avatarUrl || m.senderAvatarUrl,
        isGhostSeat: seat && !seat.claimedByDid,
      };
    }),
  [pinnedMessages, memberNameMap, myDid, seatByPlatformUserId]);

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

      // Ghost seat lookup: if message has a platformUserId, look up the seat
      const seat = msg.platformUserId ? seatByPlatformUserId.get(msg.platformUserId) : undefined;
      const isGhostSeat = seat && !seat.claimedByDid;

      // Prefer seat username (from import), then bridge display name, then member nickname, then truncated DID
      const senderName = (seat ? seat.platformUsername : undefined)
        || msg.senderDisplayName
        || (msg.senderDid ? (memberNameMap.get(msg.senderDid) ?? msg.senderDid.slice(0, 16) + '...') : 'Unknown');

      // Avatar: prefer seat avatar, then bridge avatar URL
      const avatarUrl = seat?.avatarUrl || msg.senderAvatarUrl;
      const avatarElement = avatarUrl
        ? React.createElement(Image, {
            source: { uri: avatarUrl },
            style: { width: 32, height: 32, borderRadius: 16, opacity: isGhostSeat ? 0.7 : 1 },
          })
        : undefined;

      // Ghost seat badge: show a subtle "via Discord" indicator for unclaimed seats
      const ghostBadge = isGhostSeat
        ? React.createElement(
            View,
            {
              style: {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                marginTop: 2,
                paddingHorizontal: 6,
                paddingVertical: 2,
                backgroundColor: theme.colors.background.raised,
                borderRadius: 4,
                alignSelf: 'flex-start',
              },
            },
            React.createElement(
              Text,
              { size: 'xs', style: { color: theme.colors.text.muted, fontSize: 10 } },
              '\uD83D\uDC7B via Discord \u2022 unclaimed seat',
            ),
          )
        : undefined;

      const parsedContent = emojiMap.size > 0 && typeof msg.content === 'string'
        ? parseMessageContent(msg.content, emojiMap, undefined, {
            textColor: theme.colors.text.primary,
            linkColor: theme.colors.text.link ?? '#5865F2',
            codeBgColor: theme.colors.background.sunken,
            codeTextColor: theme.colors.text.primary,
            spoilerBgColor: theme.colors.text.muted,
            quoteBorderColor: theme.colors.border.subtle,
          })
        : msg.content;

      entries.push({
        type: 'message',
        id: msg.id,
        sender: senderName,
        content: parsedContent,
        timestamp: new Date(msg.createdAt < 1000000000000 ? msg.createdAt * 1000 : msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: msg.senderDid === myDid,
        edited: msg.edited,
        // Ghost seats get a muted sender color to visually distinguish them
        ...(isGhostSeat ? { senderColor: theme.colors.text.muted } : {}),
        ...(avatarElement ? { avatar: avatarElement } : {}),
        ...(ghostBadge ? { media: ghostBadge } : {}),
        ...(msg.threadReplyCount > 0 ? { threadInfo: { replyCount: msg.threadReplyCount } } : {}),
      });
    }

    return entries;
  }, [messages, myDid, memberNameMap, seatByPlatformUserId, theme, emojiMap]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSendMessage = useCallback(async (text: string) => {
    if (text.trim()) {
      await sendMessage(text.trim());
    }
  }, [sendMessage]);

  // File attachment handler
  const handleAttachment = useCallback(async () => {
    if (!service || !activeChannelId) return;
    try {
      const picked = await pickFile();
      if (!picked) return;

      const fileId = crypto.randomUUID();
      const manifest = await service.chunkFile(fileId, picked.filename, picked.dataBase64);

      const fileContent = JSON.stringify({
        __file: true,
        fileId,
        filename: picked.filename,
        size: picked.size,
        mimeType: picked.mimeType,
        storageChunksJson: JSON.stringify(manifest),
      });
      await sendMessage(fileContent);
    } catch (err) {
      console.error('[CommunityPage] File attachment failed:', err);
    }
  }, [service, activeChannelId, sendMessage]);

  // Mobile back: clear active channel to return to the community sidebar
  const handleBackPress = useCallback(() => {
    setActiveChannelId(null);
  }, [setActiveChannelId]);

  // -- Context menu: roles list (non-default roles) -------------------------

  const contextMenuRoles = useMemo<MemberContextMenuRole[]>(() => {
    return roles
      .filter((r: any) => !r.isPreset && r.name !== 'Member')
      .sort((a: any, b: any) => b.position - a.position)
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        color: r.color ?? '#95a5a6',
      }));
  }, [roles]);

  // -- Context menu: long-press handler -------------------------------------

  const handleMemberLongPress = useCallback(
    async (member: MemberListMember, event: GestureResponderEvent) => {
      const { pageX, pageY } = event.nativeEvent;
      setContextMenuMember({ id: member.id, name: member.name });
      setContextMenuLayout({ x: pageX, y: pageY, width: 0, height: 0 });

      // Fetch member roles from service
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
    [service, communityId],
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
    [service, communityId, myDid, refreshCommunity],
  );

  // -- Context menu: kick handler ---------------------------------------------

  const handleKick = useCallback(
    async (memberId: string) => {
      if (!service || !communityId) return;
      try {
        await service.kickCommunityMember(communityId, memberId, myDid);
        setContextMenuOpen(false);
        await refreshCommunity();
      } catch (err) {
        console.warn('[CommunityPage] Failed to kick member:', err);
      }
    },
    [service, communityId, myDid, refreshCommunity],
  );

  // -- Context menu: ban handler ----------------------------------------------

  const handleBan = useCallback(
    async (memberId: string) => {
      if (!service || !communityId) return;
      try {
        await service.banCommunityMember(communityId, memberId, myDid);
        setContextMenuOpen(false);
        await refreshCommunity();
      } catch (err) {
        console.warn('[CommunityPage] Failed to ban member:', err);
      }
    },
    [service, communityId, myDid, refreshCommunity],
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
          <>
            {isMobile && (
              <View style={{ flexDirection: 'row', alignItems: 'center', height: 48, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border.subtle }}>
                <Pressable onPress={handleBackPress} style={{ width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowLeftIcon size={20} color={theme.colors.text.secondary} />
                </Pressable>
              </View>
            )}
            <VoiceCallPanel
              channelName={activeChannel.name}
              members={members as any}
              myDid={myDid}
              myDisplayName={identity?.displayName}
            />
          </>
        ) : activeChannel && activeChannel.channelType === 'voice' ? (
          /* Voice channel selected but not connected — show lobby */
          <>
            {isMobile && (
              <View style={{ flexDirection: 'row', alignItems: 'center', height: 48, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border.subtle }}>
                <Pressable onPress={handleBackPress} style={{ width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowLeftIcon size={20} color={theme.colors.text.secondary} />
                </Pressable>
              </View>
            )}
            <VoiceChannelLobby
              channelName={activeChannel.name}
              communityId={communityId!}
              channelId={activeChannelId!}
              members={members as any}
            />
          </>
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
              onBackPress={handleBackPress}
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
              onBackPress={handleBackPress}
            />

            {/* Messages — E2EE banner scrolls at the top of the message list */}
            <View style={{ flex: 1 }}>
              <MessageList
                entries={messageEntries}
                displayMode={displayMode}
                skeleton={msgsLoading && messageEntries.length === 0}
                stickyHeader={undefined}
              />
            </View>

            {/* Message Input */}
            <View style={{ position: 'relative', padding: 12 }}>
              {/* Transparent backdrop — closes picker when tapping outside */}
              {emojiOpen && (
                <Pressable
                  onPress={() => setEmojiOpen(false)}
                  style={Platform.OS === 'web'
                    ? { position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0, zIndex: 19 }
                    : { position: 'absolute', top: -5000, left: -5000, right: -5000, bottom: -5000, zIndex: 19 }
                  }
                  accessibilityLabel="Close picker"
                />
              )}
              <AnimatedPresence
                visible={emojiOpen}
                preset="slideUp"
                slideDistance={16}
                style={{ position: 'absolute', bottom: 64, right: 12, zIndex: 20 }}
              >
                <CombinedPicker
                  size="md"
                  customEmojis={customEmojiItems.length > 0 ? customEmojiItems : undefined}
                  relayUrl={process.env.EXPO_PUBLIC_RELAY_URL || 'https://relay.umbra.chat'}
                  onEmojiSelect={(emoji: string, item?: EmojiItem) => {
                    const text = item?.imageUrl ? `:${item.name}:` : emoji;
                    setMessageText((prev) => prev + text);
                    setEmojiOpen(false);
                  }}
                  onGifSelect={(gif) => {
                    handleSendMessage(`gif::${gif.url}`);
                    setEmojiOpen(false);
                  }}
                />
              </AnimatedPresence>
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
                onAttachmentClick={handleAttachment}
                showEmoji
                onEmojiClick={() => {
                  setEmojiOpen((prev) => !prev);
                }}
              />
              {/* Safe area spacing below the input */}
              {insets.bottom > 0 && (
                <View style={{ height: insets.bottom }} />
              )}
            </View>
          </>
        ) : (
          <EmptyCommunity />
        )}
      </View>

      {/* Right column: Members / Pins panel */}
      {isMobile ? (
        /* Mobile: Full-screen overlay when a panel is open */
        visiblePanel && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 50,
              backgroundColor: theme.colors.background.canvas,
            }}
          >
            {visiblePanel === 'members' && (
              <MemberList
                sections={memberSections}
                title={`Members — ${members.length}`}
                onClose={() => togglePanel('members')}
                onMemberLongPress={handleMemberLongPress}
              />
            )}
            {visiblePanel === 'pins' && (
              <PinnedMessages
                messages={pinnedForPanel}
                onClose={() => togglePanel('pins')}
                onMessageClick={() => {}}
                onUnpin={(msg) => unpinMessage(msg.id)}
              />
            )}
          </View>
        )
      ) : (
        /* Desktop: Animated side panel */
        <Animated.View style={{ width: panelWidth, overflow: 'hidden' }}>
          <View style={{ width: PANEL_WIDTH, height: '100%', borderLeftWidth: 1, borderLeftColor: theme.colors.border.subtle }}>
            {visiblePanel === 'members' && (
              <MemberList
                sections={memberSections}
                title={`Members — ${members.length}`}
                onClose={() => togglePanel('members')}
                onMemberLongPress={handleMemberLongPress}
              />
            )}
            {visiblePanel === 'pins' && (
              <PinnedMessages
                messages={pinnedForPanel}
                onClose={() => togglePanel('pins')}
                onMessageClick={() => {}}
                onUnpin={(msg) => unpinMessage(msg.id)}
              />
            )}
          </View>
        </Animated.View>
      )}

      {/* Member context menu (role picker dropdown) */}
      <MemberContextMenu
        open={contextMenuOpen}
        onOpenChange={setContextMenuOpen}
        anchorLayout={contextMenuLayout}
        member={contextMenuMember}
        roles={contextMenuRoles}
        memberRoleIds={contextMenuMemberRoleIds}
        onRoleToggle={handleRoleToggle}
        onKick={handleKick}
        onBan={handleBan}
      />
    </View>
  );
}
