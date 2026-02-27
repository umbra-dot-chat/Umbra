/**
 * CommunityLayoutSidebar — Wrapper that renders the Wisp CommunitySidebar
 * with matching Sidebar visual styles (width, background, border).
 *
 * We replicate the Sidebar shell manually (instead of using <Sidebar>)
 * because Sidebar wraps children in a ScrollView, which breaks the
 * CommunitySidebar's internal flex layout (header + tabs + flex:1 channel list).
 *
 * Channel/space selection state is shared via CommunityContext so the
 * community page ([communityId].tsx) can read which channel is active.
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { View, Image, Pressable, Text as RNText } from 'react-native';
import type { LayoutRectangle, GestureResponderEvent } from 'react-native';
import { useRouter } from 'expo-router';
import {
  useTheme,
  CommunitySidebar,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  type CommunityInfo, type CommunitySpace as WispCommunitySpace,
  type ChannelCategory, type ChannelItem, type ChannelType,
  type ManagedRole, type RolePermissionCategory,
} from '@coexist/wisp-react-native';

import { SettingsIcon, FileTextIcon, ShieldIcon, BellIcon, LogOutIcon, PlusIcon, VolumeIcon, TrashIcon, QrCodeIcon, ShareIcon } from '@/components/ui';
import { QRCardDialog } from '@/components/ui/QRCardDialog';

// Default community icon — the colored Umbra ghost app icon
// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultCommunityIcon = require('@/assets/images/icon.png');

import { VoiceChannelUsers } from '@/components/community/voice/VoiceChannelUsers';
import { useVoiceChannel } from '@/contexts/VoiceChannelContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUmbra } from '@/contexts/UmbraContext';
import { useCommunity } from '@/hooks/useCommunity';
import { useCommunitySync } from '@/hooks/useCommunitySync';
import { useCommunityInvites } from '@/hooks/useCommunityInvites';
import { useCommunityContext } from '@/contexts/CommunityContext';
import { useSeatClaim } from '@/hooks/useSeatClaim';
import { CommunitySettingsDialog } from '@/components/community/settings/CommunitySettingsDialog';
import type { CommunitySettingsSection } from '@/components/community/settings/CommunitySettingsDialog';
import type { CommunityRole as CommunityRolePanelType } from '@/components/community/settings/CommunityRolePanel';
import type { CommunityRole as ServiceCommunityRole } from '@umbra/service';
import type { CommunityCategory as ServiceCommunityCategory } from '@umbra/service';
import { ChannelContextMenu } from '@/components/community/channels/ChannelContextMenu';
import { SpaceContextMenu } from '@/components/community/members/SpaceContextMenu';
import { CategoryContextMenu } from '@/components/community/channels/CategoryContextMenu';
import { InputDialog } from '@/components/ui/InputDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const umbraDeadImage = require('@/assets/emoji/umbra-dead.png');
import { ChannelCreateDialog } from '@/components/community/channels/ChannelCreateDialog';
import type { CreateChannelType } from '@/components/community/channels/ChannelCreateDialog';
import { MoveToCategoryDialog } from '@/components/community/channels/MoveToCategoryDialog';

// (Mock data removed — all communities now use real backend data)

// ---------------------------------------------------------------------------
// Channel type mapping
// ---------------------------------------------------------------------------

function mapChannelType(type: string): ChannelType {
  switch (type) {
    case 'voice': return 'voice';
    case 'announcement': return 'announcement';
    case 'forum': return 'text';
    case 'files': return 'files';
    case 'bulletin': return 'text';
    case 'welcome': return 'text';
    default: return 'text';
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CommunityLayoutSidebarProps {
  communityId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommunityLayoutSidebar({ communityId }: CommunityLayoutSidebarProps) {
  const router = useRouter();
  const { identity } = useAuth();
  const { service } = useUmbra();
  const myDid = identity?.did ?? '';

  const {
    activeSpaceId,
    activeChannelId,
    setActiveSpaceId,
    setActiveChannelId,
  } = useCommunityContext();

  const { joinVoiceChannel, voiceParticipants, speakingDids } = useVoiceChannel();

  // Track the communityId so we can detect switches
  const prevCommunityIdRef = useRef(communityId);

  const {
    community,
    spaces,
    categories: realCategories,
    channels,
    members,
    roles: realRoles,
    emoji,
    stickers,
    stickerPacks,
    memberRolesMap,
    isLoading: communityLoading,
    refresh: refreshCommunity,
  } = useCommunity(communityId);

  // Community sync — dispatch + relay broadcast
  const { syncEvent } = useCommunitySync(communityId);

  const {
    invites,
    isLoading: invitesLoading,
    createInvite,
    deleteInvite,
    creating: inviteCreating,
  } = useCommunityInvites(communityId);

  // Seat claim detection
  const {
    matchingSeats,
    claimSeat: handleClaimSeat,
    dismissSeat: handleDismissSeat,
  } = useSeatClaim(communityId, myDid || null);

  // Collapsed categories (local UI state)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Community header dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [headerLayout, setHeaderLayout] = useState<LayoutRectangle | null>(null);
  const headerAnchorRef = useRef<View>(null);

  // Settings dialog (consolidates roles, invites, and all server settings)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState<CommunitySettingsSection | undefined>(undefined);
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(undefined);

  // Channel context menu state
  const [channelMenuOpen, setChannelMenuOpen] = useState(false);
  const [channelMenuTarget, setChannelMenuTarget] = useState<{ id: string; name: string } | null>(null);
  const [channelMenuLayout, setChannelMenuLayout] = useState<LayoutRectangle | null>(null);

  // Space context menu state
  const [spaceMenuOpen, setSpaceMenuOpen] = useState(false);
  const [spaceMenuTarget, setSpaceMenuTarget] = useState<{ id: string; name: string } | null>(null);
  const [spaceMenuLayout, setSpaceMenuLayout] = useState<LayoutRectangle | null>(null);

  // Category context menu state
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [categoryMenuTarget, setCategoryMenuTarget] = useState<{ id: string; name: string } | null>(null);
  const [categoryMenuLayout, setCategoryMenuLayout] = useState<LayoutRectangle | null>(null);

  // Dialog state for space/channel CRUD (replaces browser prompt/confirm)
  const [spaceCreateDialogOpen, setSpaceCreateDialogOpen] = useState(false);
  const [spaceEditDialogOpen, setSpaceEditDialogOpen] = useState(false);
  const [spaceEditTarget, setSpaceEditTarget] = useState<{ id: string; name: string } | null>(null);
  const [spaceDeleteDialogOpen, setSpaceDeleteDialogOpen] = useState(false);
  const [spaceDeleteTarget, setSpaceDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [channelCreateDialogOpen, setChannelCreateDialogOpen] = useState(false);
  const [channelEditDialogOpen, setChannelEditDialogOpen] = useState(false);
  const [channelEditTarget, setChannelEditTarget] = useState<{ id: string; name: string } | null>(null);
  const [channelDeleteDialogOpen, setChannelDeleteDialogOpen] = useState(false);
  const [channelDeleteTarget, setChannelDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [dialogSubmitting, setDialogSubmitting] = useState(false);

  // Category dialog state
  const [categoryCreateDialogOpen, setCategoryCreateDialogOpen] = useState(false);
  const [categoryEditDialogOpen, setCategoryEditDialogOpen] = useState(false);
  const [categoryEditTarget, setCategoryEditTarget] = useState<{ id: string; name: string } | null>(null);
  const [categoryDeleteDialogOpen, setCategoryDeleteDialogOpen] = useState(false);
  const [categoryDeleteTarget, setCategoryDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  // Track which category we're creating a channel in
  const [channelCreateCategoryId, setChannelCreateCategoryId] = useState<string | undefined>(undefined);

  // "Move to Category" dialog state
  const [moveCategoryDialogOpen, setMoveCategoryDialogOpen] = useState(false);
  const [moveCategoryChannelTarget, setMoveCategoryChannelTarget] = useState<{ id: string; name: string } | null>(null);

  // Leave/Delete community dialog state
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // QR invite dialog state
  const [qrInviteOpen, setQrInviteOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // Resolve data
  // ---------------------------------------------------------------------------

  const isOwner = useMemo(() => {
    if (!community || !myDid) return false;
    return community.ownerDid === myDid;
  }, [community, myDid]);

  const communityInfo = useMemo<CommunityInfo>(() => {
    return {
      name: community?.name ?? 'Loading...',
      subtitle: `${members.length} member${members.length !== 1 ? 's' : ''}`,
      icon: (
        <Image
          source={community?.iconUrl ? { uri: community.iconUrl } : defaultCommunityIcon}
          style={{ width: 24, height: 24, borderRadius: 6 }}
          resizeMode="cover"
        />
      ),
    };
  }, [community?.name, community?.iconUrl, members.length]);

  const wispSpaces = useMemo<WispCommunitySpace[]>(() => {
    return spaces.map((s) => ({ id: s.id, name: s.name }));
  }, [spaces]);

  // Auto-select first space.
  // When switching communities, the activeSpaceId holds an ID from the old
  // community. We detect this by checking if the current activeSpaceId exists
  // in the new community's space list. If not, reset and pick the first space.
  useEffect(() => {
    if (wispSpaces.length === 0) return;

    const communityChanged = communityId !== prevCommunityIdRef.current;
    if (communityChanged) {
      prevCommunityIdRef.current = communityId;
    }

    const spaceExists = activeSpaceId && wispSpaces.some((s) => s.id === activeSpaceId);

    if (!spaceExists) {
      setActiveSpaceId(wispSpaces[0]?.id ?? null);
      // Also reset channel since it belongs to the old space
      if (communityChanged || !spaceExists) {
        setActiveChannelId(null);
      }
    }
  }, [wispSpaces, activeSpaceId, communityId, setActiveSpaceId, setActiveChannelId]);

  // Auto-select first channel
  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) {
      const textChannels = channels.filter((c) => c.channelType === 'text');
      const generalChannel = textChannels.find((c) => c.name === 'general');
      const firstChannel = generalChannel ?? textChannels[0] ?? channels[0];
      if (firstChannel) {
        setActiveChannelId(firstChannel.id);
        setActiveSpaceId(firstChannel.spaceId);
      }
    }
  }, [channels, activeChannelId, setActiveChannelId, setActiveSpaceId]);

  const categories = useMemo<ChannelCategory[]>(() => {
    const spaceCategories = realCategories
      .filter((c) => c.spaceId === activeSpaceId)
      .sort((a, b) => a.position - b.position);

    const cats: ChannelCategory[] = spaceCategories.map((cat) => ({
      id: cat.id,
      label: cat.name.toUpperCase(),
      channels: channels
        .filter((ch) => ch.spaceId === activeSpaceId && ch.categoryId === cat.id)
        .sort((a, b) => a.position - b.position)
        .map((ch) => ({
          id: ch.id,
          name: ch.name,
          type: mapChannelType(ch.channelType) as ChannelType,
          active: ch.id === activeChannelId,
        })),
      collapsed: collapsedCategories.has(cat.id),
    }));

    // Also show uncategorized channels (those without a category_id, or
    // whose category_id doesn't match any real category in this space)
    const spaceCategoryIds = new Set(spaceCategories.map((c) => c.id));
    const uncategorized = channels
      .filter((ch) => ch.spaceId === activeSpaceId && (!ch.categoryId || !spaceCategoryIds.has(ch.categoryId)))
      .sort((a, b) => a.position - b.position);

    if (uncategorized.length > 0) {
      cats.push({
        id: '__uncategorized__',
        label: 'UNCATEGORIZED',
        channels: uncategorized.map((ch) => ({
          id: ch.id,
          name: ch.name,
          type: mapChannelType(ch.channelType) as ChannelType,
          active: ch.id === activeChannelId,
        })),
        collapsed: collapsedCategories.has('__uncategorized__'),
      });
    }

    return cats;
  }, [activeSpaceId, realCategories, channels, activeChannelId, collapsedCategories]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleChannelClick = useCallback((channel: ChannelItem) => {
    setActiveChannelId(channel.id);

    // If it's a voice channel, join it
    if (channel.type === 'voice') {
      joinVoiceChannel(communityId, channel.id);
    }
  }, [setActiveChannelId, communityId, joinVoiceChannel]);

  // Render connected voice users under voice channels
  const renderChannelExtra = useCallback(
    (channel: ChannelItem) => {
      if (channel.type !== 'voice') return null;
      const participantDids = voiceParticipants.get(channel.id);
      if (!participantDids || participantDids.size === 0) return null;
      return (
        <VoiceChannelUsers
          participantDids={participantDids}
          members={members}
          myDid={myDid}
          myDisplayName={identity?.displayName}
          speakingDids={speakingDids}
        />
      );
    },
    [voiceParticipants, members, myDid, identity?.displayName, speakingDids],
  );

  // Show green speaker icon on voice channels with active participants
  const renderChannelIcon = useCallback(
    (channel: ChannelItem, defaultIcon: React.ReactNode) => {
      if (channel.type !== 'voice') return defaultIcon;
      const participantDids = voiceParticipants.get(channel.id);
      if (!participantDids || participantDids.size === 0) return defaultIcon;
      return <VolumeIcon size={18} color="#43b581" />;
    },
    [voiceParticipants],
  );

  const handleCategoryToggle = useCallback((categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const handleSpaceChange = useCallback((spaceId: string) => {
    setActiveSpaceId(spaceId);
    const spaceChannels = channels.filter((c) => c.spaceId === spaceId);
    const firstText = spaceChannels.find((c) => c.channelType === 'text');
    const firstChannel = firstText ?? spaceChannels[0];
    if (firstChannel) {
      setActiveChannelId(firstChannel.id);
    }
  }, [channels, setActiveSpaceId, setActiveChannelId]);

  // Community header click → measure header position, then open dropdown
  const handleCommunityClick = useCallback(() => {
    if (headerAnchorRef.current) {
      headerAnchorRef.current.measureInWindow((x, y, width, height) => {
        setHeaderLayout({ x, y, width, height });
        setDropdownOpen(true);
      });
    } else {
      setDropdownOpen(true);
    }
  }, []);

  // Leave server handler — opens confirmation dialog
  const handleLeaveServer = useCallback(() => {
    setLeaveDialogOpen(true);
  }, []);

  // Actual leave handler — called from confirmation dialog
  const handleLeaveConfirm = useCallback(async () => {
    if (!service || !myDid) return;
    try {
      await service.leaveCommunity(communityId, myDid);
      router.push('/');
    } catch (err) {
      console.warn('[CommunityLayoutSidebar] Failed to leave community:', err);
      throw err;
    }
  }, [service, myDid, communityId, router]);

  // Delete community handler — opens confirmation dialog
  const handleDeleteCommunity = useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  // Actual delete handler — called from confirmation dialog
  const handleDeleteConfirm = useCallback(async () => {
    if (!service || !myDid) return;
    try {
      await service.deleteCommunity(communityId, myDid);
      router.push('/');
    } catch (err) {
      console.warn('[CommunityLayoutSidebar] Failed to delete community:', err);
      throw err;
    }
  }, [service, myDid, communityId, router]);

  // Invite panel handlers
  const handleCreateInvite = useCallback(
    async (options: { expiresIn?: number; maxUses?: number }) => {
      const expiresAt = options.expiresIn
        ? Date.now() + options.expiresIn * 1000
        : undefined;
      await createInvite(options.maxUses || undefined, expiresAt);
    },
    [createInvite],
  );

  const handleDeleteInvite = useCallback(
    async (inviteId: string) => {
      await deleteInvite(inviteId);
    },
    [deleteInvite],
  );


  // ---------------------------------------------------------------------------
  // Transform invites for the CommunityInvitePanel wrapper
  // The service returns CommunityInvite (camelCase), but the wrapper expects
  // CommunityInvite (snake_case). Map between them.
  // ---------------------------------------------------------------------------

  const invitePanelInvites = useMemo(() => {
    return invites.map((inv) => ({
      id: inv.id,
      community_id: inv.communityId,
      code: inv.code,
      vanity: inv.vanity,
      creator_did: inv.creatorDid,
      max_uses: inv.maxUses,
      use_count: inv.useCount,
      expires_at: inv.expiresAt,
      created_at: inv.createdAt,
    }));
  }, [invites]);

  // Build invite URL for QR dialog from most recent non-vanity invite
  const qrInviteUrl = useMemo(() => {
    const nonVanity = invites.filter((i) => !i.vanity);
    if (nonVanity.length === 0) return null;
    const sorted = [...nonVanity].sort((a, b) => b.createdAt - a.createdAt);
    return `https://umbra.chat/invite/${sorted[0].code}`;
  }, [invites]);

  // ---------------------------------------------------------------------------
  // Transform roles for the CommunityRolePanel wrapper
  // The service returns CommunityRole (camelCase), but the wrapper expects
  // CommunityRole (snake_case fields). Map between them.
  // ---------------------------------------------------------------------------

  const rolePanelRoles = useMemo<CommunityRolePanelType[]>(() => {
    return (realRoles as ServiceCommunityRole[]).map((role) => ({
      id: role.id,
      community_id: role.communityId,
      name: role.name,
      color: role.color,
      position: role.position,
      hoisted: role.hoisted,
      mentionable: role.mentionable,
      is_preset: role.isPreset ?? false,
      permissions_bitfield: role.permissionsBitfield ?? '0',
      created_at: role.createdAt,
      updated_at: role.updatedAt,
    }));
  }, [realRoles]);

  // ---------------------------------------------------------------------------
  // Compute members data for role dialog Members tab
  // ---------------------------------------------------------------------------

  const allMembersForRolePanel = useMemo(() => {
    return members.map((m) => ({
      id: m.memberDid,
      name: m.nickname || (m.memberDid === myDid && identity?.displayName ? identity.displayName : m.memberDid.slice(0, 16) + '...'),
    }));
  }, [members, myDid, identity]);

  const roleMembersForRolePanel = useMemo(() => {
    if (!selectedRoleId) return [];
    return members
      .filter((m) => {
        const assignedRoles = memberRolesMap[m.memberDid] ?? [];
        return assignedRoles.some((r: any) => r.id === selectedRoleId);
      })
      .map((m) => ({
        id: m.memberDid,
        name: m.nickname || (m.memberDid === myDid && identity?.displayName ? identity.displayName : m.memberDid.slice(0, 16) + '...'),
      }));
  }, [selectedRoleId, members, memberRolesMap, myDid, identity]);

  // Compute member counts per role from the memberRolesMap
  const roleMemberCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const memberDid of Object.keys(memberRolesMap)) {
      const assignedRoles = memberRolesMap[memberDid] ?? [];
      for (const role of assignedRoles) {
        const roleId = (role as any).id;
        if (roleId) {
          counts[roleId] = (counts[roleId] ?? 0) + 1;
        }
      }
    }
    return counts;
  }, [memberRolesMap]);

  const handleMemberAdd = useCallback(
    async (roleId: string, memberId: string) => {
      if (!service) return;
      try {
        await service.assignRole(communityId, memberId, roleId, myDid);
      } catch (err) {
        console.warn('[CommunityLayoutSidebar] Failed to assign role:', err);
      }
    },
    [service, communityId, myDid],
  );

  const handleMemberRemove = useCallback(
    async (roleId: string, memberId: string) => {
      if (!service) return;
      try {
        await service.unassignRole(communityId, memberId, roleId, myDid);
      } catch (err) {
        console.warn('[CommunityLayoutSidebar] Failed to unassign role:', err);
      }
    },
    [service, communityId, myDid],
  );

  // ---------------------------------------------------------------------------
  // Real role CRUD handlers (wired to WASM backend)
  // ---------------------------------------------------------------------------

  const handleRoleCreate = useCallback(async () => {
    if (!service) return;
    try {
      const role = await service.createCustomRole(
        communityId,
        'New Role',
        myDid,
        '#95a5a6', // default grey color
        10,        // default position
        false,     // not hoisted
        false,     // not mentionable
        '0',       // no permissions
      );
      setSelectedRoleId(role.id);
      syncEvent({ type: 'communityRoleCreated', communityId, roleId: role.id });
    } catch (err) {
      console.warn('[CommunityLayoutSidebar] Failed to create role:', err);
    }
  }, [service, communityId, myDid]);

  const handleRoleUpdate = useCallback(
    async (roleId: string, updates: Partial<CommunityRolePanelType>) => {
      if (!service) return;
      try {
        await service.updateRole(roleId, myDid, {
          name: updates.name,
          color: updates.color ?? undefined,
          hoisted: updates.hoisted,
          mentionable: updates.mentionable,
          position: updates.position,
        });
        syncEvent({ type: 'communityRoleUpdated', roleId });
      } catch (err) {
        console.warn('[CommunityLayoutSidebar] Failed to update role:', err);
      }
    },
    [service, myDid],
  );

  const handleRoleDelete = useCallback(
    async (roleId: string) => {
      if (!service) return;
      // Prevent deletion of preset roles (Owner, Member)
      const role = rolePanelRoles.find((r) => r.id === roleId);
      if (role?.is_preset) {
        console.warn('[CommunityLayoutSidebar] Cannot delete preset role:', role.name);
        return;
      }
      try {
        await service.deleteRole(roleId, myDid);
        syncEvent({ type: 'communityRoleDeleted', roleId });
        if (selectedRoleId === roleId) {
          setSelectedRoleId(undefined);
        }
      } catch (err) {
        console.warn('[CommunityLayoutSidebar] Failed to delete role:', err);
      }
    },
    [service, myDid, selectedRoleId, rolePanelRoles],
  );

  const handlePermissionToggle = useCallback(
    async (roleId: string, bitIndex: number, value: boolean | null) => {
      if (!service) return;
      try {
        // Find the current role to get its permissions bitfield
        const role = rolePanelRoles.find((r) => r.id === roleId);
        if (!role) return;

        let bigPerms = BigInt(role.permissions_bitfield);
        const bit = BigInt(1) << BigInt(bitIndex);

        if (value === true) {
          // Set the bit (allow)
          bigPerms = bigPerms | bit;
        } else {
          // Clear the bit (inherit / deny)
          bigPerms = bigPerms & ~bit;
        }

        await service.updateRolePermissions(roleId, bigPerms.toString(), myDid);
        syncEvent({ type: 'communityRolePermissionsUpdated', roleId });
      } catch (err) {
        console.warn('[CommunityLayoutSidebar] Failed to toggle permission:', err);
      }
    },
    [service, myDid, rolePanelRoles],
  );

  const handleRoleReorder = useCallback(
    async (roleId: string, newPosition: number) => {
      if (!service) return;
      try {
        await service.updateRole(roleId, myDid, { position: newPosition });
        // Dispatch event to refresh roles (ensure UI updates)
        syncEvent({ type: 'communityRoleUpdated', roleId });
      } catch (err) {
        console.warn('[CommunityLayoutSidebar] Failed to reorder role:', err);
      }
    },
    [service, myDid],
  );

  // ---------------------------------------------------------------------------
  // Space CRUD handlers (open dialogs instead of browser prompt/confirm)
  // ---------------------------------------------------------------------------

  const handleSpaceCreate = useCallback(() => {
    setSpaceCreateDialogOpen(true);
  }, []);

  const handleSpaceCreateSubmit = useCallback(
    async (name: string) => {
      if (!service) return;
      setDialogSubmitting(true);
      try {
        const space = await service.createSpace(communityId, name, myDid, spaces.length);
        setActiveSpaceId(space.id);
        setSpaceCreateDialogOpen(false);
        syncEvent({ type: 'spaceCreated', communityId, spaceId: space.id });
      } catch (err) {
        console.warn('[CommunityLayoutSidebar] Failed to create space:', err);
        throw err;
      } finally {
        setDialogSubmitting(false);
      }
    },
    [service, communityId, myDid, spaces.length, setActiveSpaceId],
  );

  const handleSpaceLongPress = useCallback(
    (spaceId: string, event: GestureResponderEvent) => {

      const { pageX, pageY } = event.nativeEvent;
      const space = spaces.find((s) => s.id === spaceId);
      setSpaceMenuTarget(space ? { id: space.id, name: space.name } : null);
      setSpaceMenuLayout({ x: pageX, y: pageY, width: 0, height: 0 });
      setSpaceMenuOpen(true);
    },
    [spaces],
  );

  /** Right-click on empty sidebar area → open the active space's context menu. */
  const handleSidebarLongPress = useCallback(
    (event: GestureResponderEvent) => {
      if (!activeSpaceId) return;
      handleSpaceLongPress(activeSpaceId, event);
    },
    [activeSpaceId, handleSpaceLongPress],
  );

  const handleSpaceEdit = useCallback(
    (spaceId: string) => {

      const currentSpace = spaces.find((s) => s.id === spaceId);
      if (!currentSpace) return;
      setSpaceEditTarget({ id: spaceId, name: currentSpace.name });
      setSpaceEditDialogOpen(true);
    },
    [spaces],
  );

  const handleSpaceEditSubmit = useCallback(
    async (newName: string) => {
      if (!service || !spaceEditTarget) return;
      if (newName === spaceEditTarget.name) {
        setSpaceEditDialogOpen(false);
        return;
      }
      setDialogSubmitting(true);
      try {
        await service.updateSpace(spaceEditTarget.id, newName, myDid);
        setSpaceEditDialogOpen(false);
        syncEvent({ type: 'spaceUpdated', communityId, spaceId: spaceEditTarget.id });
      } catch (err) {
        console.warn('[CommunityLayoutSidebar] Failed to update space:', err);
        throw err;
      } finally {
        setDialogSubmitting(false);
      }
    },
    [service, spaceEditTarget, myDid, communityId],
  );

  const handleSpaceDelete = useCallback(
    (spaceId: string) => {

      const currentSpace = spaces.find((s) => s.id === spaceId);
      setSpaceDeleteTarget(currentSpace ? { id: spaceId, name: currentSpace.name } : { id: spaceId, name: 'this space' });
      setSpaceDeleteDialogOpen(true);
    },
    [spaces],
  );

  const handleSpaceDeleteConfirm = useCallback(async () => {
    if (!service || !spaceDeleteTarget) return;
    setDialogSubmitting(true);
    try {
      await service.deleteSpace(spaceDeleteTarget.id, myDid);
      syncEvent({ type: 'spaceDeleted', communityId, spaceId: spaceDeleteTarget.id });
      if (activeSpaceId === spaceDeleteTarget.id) {
        const remaining = spaces.filter((s) => s.id !== spaceDeleteTarget.id);
        setActiveSpaceId(remaining[0]?.id ?? null);
      }
      setSpaceDeleteDialogOpen(false);
    } catch (err) {
      console.warn('[CommunityLayoutSidebar] Failed to delete space:', err);
      throw err;
    } finally {
      setDialogSubmitting(false);
    }
  }, [service, spaceDeleteTarget, myDid, activeSpaceId, spaces, setActiveSpaceId, communityId]);

  // ---------------------------------------------------------------------------
  // Channel CRUD handlers (open dialogs instead of browser prompt/confirm)
  // ---------------------------------------------------------------------------

  const handleChannelCreate = useCallback(
    (categoryId: string) => {
      if (!activeSpaceId) return;
      setChannelCreateCategoryId(categoryId === '__uncategorized__' ? undefined : categoryId);
      setChannelCreateDialogOpen(true);
    },
    [activeSpaceId],
  );

  const handleChannelCreateSubmit = useCallback(
    async (name: string, type: CreateChannelType) => {
      if (!service || !activeSpaceId) return;
      setDialogSubmitting(true);
      try {
        const channel = await service.createChannel(
          communityId,
          activeSpaceId,
          name,
          type,
          myDid,
          undefined,
          undefined,
          channelCreateCategoryId,
        );
        setActiveChannelId(channel.id);
        setChannelCreateDialogOpen(false);
        syncEvent({ type: 'channelCreated', communityId, channelId: channel.id });
      } catch (err) {
        console.warn('[CommunityLayoutSidebar] Failed to create channel:', err);
        throw err;
      } finally {
        setDialogSubmitting(false);
      }
    },
    [service, communityId, activeSpaceId, myDid, setActiveChannelId, channelCreateCategoryId],
  );

  const handleChannelLongPress = useCallback(
    (channel: ChannelItem, event: GestureResponderEvent) => {

      const { pageX, pageY } = event.nativeEvent;
      setChannelMenuTarget({ id: channel.id, name: channel.name });
      setChannelMenuLayout({ x: pageX, y: pageY, width: 0, height: 0 });
      setChannelMenuOpen(true);
    },
    [],
  );

  const handleChannelEdit = useCallback(
    (channelId: string) => {
      const channel = channels.find((c) => c.id === channelId);
      if (!channel) return;
      setChannelEditTarget({ id: channelId, name: channel.name });
      setChannelEditDialogOpen(true);
    },
    [channels],
  );

  const handleChannelEditSubmit = useCallback(
    async (newName: string) => {
      if (!service || !channelEditTarget) return;
      if (newName === channelEditTarget.name) {
        setChannelEditDialogOpen(false);
        return;
      }
      setDialogSubmitting(true);
      try {
        await service.updateChannel(channelEditTarget.id, myDid, newName);
        setChannelEditDialogOpen(false);
        syncEvent({ type: 'channelUpdated', communityId, channelId: channelEditTarget.id });
      } catch (err) {
        console.warn('[CommunityLayoutSidebar] Failed to update channel:', err);
        throw err;
      } finally {
        setDialogSubmitting(false);
      }
    },
    [service, channelEditTarget, myDid, communityId],
  );

  const handleChannelDelete = useCallback(
    (channelId: string) => {

      const channel = channels.find((c) => c.id === channelId);
      setChannelDeleteTarget(channel ? { id: channelId, name: channel.name } : { id: channelId, name: 'this channel' });
      setChannelDeleteDialogOpen(true);
    },
    [channels],
  );

  const handleChannelDeleteConfirm = useCallback(async () => {
    if (!service || !channelDeleteTarget) return;
    setDialogSubmitting(true);
    try {
      await service.deleteChannel(channelDeleteTarget.id, myDid);
      syncEvent({ type: 'channelDeleted', communityId, channelId: channelDeleteTarget.id });
      if (activeChannelId === channelDeleteTarget.id) {
        const remaining = channels.filter((c) => c.id !== channelDeleteTarget.id);
        const nextChannel = remaining.find((c) => c.channelType === 'text') ?? remaining[0];
        setActiveChannelId(nextChannel?.id ?? null);
      }
      setChannelDeleteDialogOpen(false);
    } catch (err) {
      console.warn('[CommunityLayoutSidebar] Failed to delete channel:', err);
      throw err;
    } finally {
      setDialogSubmitting(false);
    }
  }, [service, channelDeleteTarget, myDid, activeChannelId, channels, setActiveChannelId, communityId],
  );

  // ---------------------------------------------------------------------------
  // Category CRUD handlers
  // ---------------------------------------------------------------------------

  const handleCategoryCreate = useCallback(() => {
    if (!activeSpaceId) return;
    setCategoryCreateDialogOpen(true);
  }, [activeSpaceId]);

  const handleCategoryCreateSubmit = useCallback(
    async (name: string) => {
      if (!service || !activeSpaceId) return;
      setDialogSubmitting(true);
      try {
        const category = await service.createCategory(communityId, activeSpaceId, name, myDid);
        setCategoryCreateDialogOpen(false);
        syncEvent({ type: 'categoryCreated', communityId, categoryId: category.id });
      } catch (err) {
        console.warn('[CommunityLayoutSidebar] Failed to create category:', err);
        throw err;
      } finally {
        setDialogSubmitting(false);
      }
    },
    [service, communityId, activeSpaceId, myDid],
  );

  const handleCategoryLongPress = useCallback(
    (categoryId: string, event: GestureResponderEvent) => {

      // Don't show context menu for the virtual uncategorized bucket
      if (categoryId === '__uncategorized__') return;
      const { pageX, pageY } = event.nativeEvent;
      const cat = realCategories.find((c) => c.id === categoryId);
      setCategoryMenuTarget(cat ? { id: cat.id, name: cat.name } : null);
      setCategoryMenuLayout({ x: pageX, y: pageY, width: 0, height: 0 });
      setCategoryMenuOpen(true);
    },
    [realCategories],
  );

  const handleCategoryEdit = useCallback(
    (categoryId: string) => {
      const cat = realCategories.find((c) => c.id === categoryId);
      if (!cat) return;
      setCategoryEditTarget({ id: categoryId, name: cat.name });
      setCategoryEditDialogOpen(true);
    },
    [realCategories],
  );

  const handleCategoryEditSubmit = useCallback(
    async (newName: string) => {
      if (!service || !categoryEditTarget) return;
      if (newName === categoryEditTarget.name) {
        setCategoryEditDialogOpen(false);
        return;
      }
      setDialogSubmitting(true);
      try {
        await service.updateCategory(categoryEditTarget.id, newName, myDid);
        setCategoryEditDialogOpen(false);
        syncEvent({ type: 'categoryUpdated', categoryId: categoryEditTarget.id });
      } catch (err) {
        console.warn('[CommunityLayoutSidebar] Failed to update category:', err);
        throw err;
      } finally {
        setDialogSubmitting(false);
      }
    },
    [service, categoryEditTarget, myDid],
  );

  const handleCategoryDelete = useCallback(
    (categoryId: string) => {
      const cat = realCategories.find((c) => c.id === categoryId);
      setCategoryDeleteTarget(cat ? { id: categoryId, name: cat.name } : { id: categoryId, name: 'this category' });
      setCategoryDeleteDialogOpen(true);
    },
    [realCategories],
  );

  const handleCategoryDeleteConfirm = useCallback(async () => {
    if (!service || !categoryDeleteTarget) return;
    setDialogSubmitting(true);
    try {
      await service.deleteCategory(categoryDeleteTarget.id, myDid);
      syncEvent({ type: 'categoryDeleted', categoryId: categoryDeleteTarget.id });
      setCategoryDeleteDialogOpen(false);
    } catch (err) {
      console.warn('[CommunityLayoutSidebar] Failed to delete category:', err);
      throw err;
    } finally {
      setDialogSubmitting(false);
    }
  }, [service, categoryDeleteTarget, myDid]);

  // Update handleChannelCreate to track the category context
  const handleChannelCreateInCategory = useCallback(
    (categoryId: string) => {
      if (!activeSpaceId) return;
      setChannelCreateCategoryId(categoryId === '__uncategorized__' ? undefined : categoryId);
      setChannelCreateDialogOpen(true);
    },
    [activeSpaceId],
  );

  // Move channel to a different category
  const handleMoveChannelToCategory = useCallback(
    async (channelId: string, categoryId: string | null) => {
      if (!service) return;
      try {
        await service.moveChannelToCategory(channelId, categoryId, myDid);
        // Dispatch event to refresh channels (WASM doesn't emit reorder events)
        syncEvent({ type: 'channelUpdated', communityId, channelId });
      } catch (err) {
        console.warn('[CommunityLayoutSidebar] Failed to move channel:', err);
      }
    },
    [service, myDid, communityId],
  );

  // Open the "Move to Category" dialog from the channel context menu
  const handleOpenMoveToCategory = useCallback(
    (channelId: string) => {
      const channel = channels.find((c) => c.id === channelId);
      if (!channel) return;
      setMoveCategoryChannelTarget({ id: channel.id, name: channel.name });
      setMoveCategoryDialogOpen(true);
    },
    [channels],
  );

  // Handle selection in the "Move to Category" dialog
  const handleMoveToCategorySelect = useCallback(
    async (channelId: string, categoryId: string | null) => {
      await handleMoveChannelToCategory(channelId, categoryId);
      setMoveCategoryDialogOpen(false);
    },
    [handleMoveChannelToCategory],
  );

  // Move category up in the list (swap with previous)
  const handleCategoryMoveUp = useCallback(
    async (categoryId: string) => {
      if (!service || !activeSpaceId) return;
      const spaceCategories = realCategories
        .filter((c) => c.spaceId === activeSpaceId)
        .sort((a, b) => a.position - b.position);
      const idx = spaceCategories.findIndex((c) => c.id === categoryId);
      if (idx <= 0) return;
      const reordered = [...spaceCategories];
      [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]];
      try {
        await service.reorderCategories(activeSpaceId, reordered.map((c) => c.id));
        // Dispatch event to refresh categories (WASM doesn't emit reorder events)
        syncEvent({ type: 'categoryUpdated', categoryId });
      } catch (err) {
        console.warn('[CommunityLayoutSidebar] Failed to move category up:', err);
      }
    },
    [service, activeSpaceId, realCategories],
  );

  // Move category down in the list (swap with next)
  const handleCategoryMoveDown = useCallback(
    async (categoryId: string) => {
      if (!service || !activeSpaceId) return;
      const spaceCategories = realCategories
        .filter((c) => c.spaceId === activeSpaceId)
        .sort((a, b) => a.position - b.position);
      const idx = spaceCategories.findIndex((c) => c.id === categoryId);
      if (idx < 0 || idx >= spaceCategories.length - 1) return;
      const reordered = [...spaceCategories];
      [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];
      try {
        await service.reorderCategories(activeSpaceId, reordered.map((c) => c.id));
        // Dispatch event to refresh categories (WASM doesn't emit reorder events)
        syncEvent({ type: 'categoryUpdated', categoryId });
      } catch (err) {
        console.warn('[CommunityLayoutSidebar] Failed to move category down:', err);
      }
    },
    [service, activeSpaceId, realCategories],
  );

  // ---------------------------------------------------------------------------
  // Computed values for context menus and move dialog
  // ---------------------------------------------------------------------------

  const categoryMenuIsFirst = useMemo(() => {
    if (!categoryMenuTarget || !activeSpaceId) return false;
    const spaceCategories = realCategories
      .filter((c) => c.spaceId === activeSpaceId)
      .sort((a, b) => a.position - b.position);
    return spaceCategories.length > 0 && spaceCategories[0]?.id === categoryMenuTarget.id;
  }, [categoryMenuTarget, activeSpaceId, realCategories]);

  const categoryMenuIsLast = useMemo(() => {
    if (!categoryMenuTarget || !activeSpaceId) return false;
    const spaceCategories = realCategories
      .filter((c) => c.spaceId === activeSpaceId)
      .sort((a, b) => a.position - b.position);
    return spaceCategories.length > 0 && spaceCategories[spaceCategories.length - 1]?.id === categoryMenuTarget.id;
  }, [categoryMenuTarget, activeSpaceId, realCategories]);

  const spaceCategoriesForMove = useMemo(() => {
    if (!activeSpaceId) return [];
    return realCategories
      .filter((c) => c.spaceId === activeSpaceId)
      .sort((a, b) => a.position - b.position)
      .map((c) => ({ id: c.id, name: c.name }));
  }, [activeSpaceId, realCategories]);

  const moveCategoryChannelCurrentCategoryId = useMemo(() => {
    if (!moveCategoryChannelTarget) return undefined;
    const channel = channels.find((c) => c.id === moveCategoryChannelTarget.id);
    return channel?.categoryId ?? null;
  }, [moveCategoryChannelTarget, channels]);

  // ---------------------------------------------------------------------------
  // Drag-and-drop handlers
  // ---------------------------------------------------------------------------

  const handleChannelReorder = useCallback(
    async (channelId: string, targetCategoryId: string | null, newIndex: number) => {
      if (!service || !activeSpaceId) return;
      try {
        const channel = channels.find((c) => c.id === channelId);
        if (!channel) return;

        // Map the virtual '__uncategorized__' category ID to null
        const realTargetCatId = targetCategoryId === '__uncategorized__' ? null : targetCategoryId;
        // Current category: normalize undefined to null for comparison
        const currentCatId = channel.categoryId ?? null;

        // 1. Move channel to a different category if needed
        if (currentCatId !== realTargetCatId) {
          await service.moveChannelToCategory(channelId, realTargetCatId, myDid);
        }

        // 2. Build the new order for channels within the target category.
        //    Filter channels in the same space + same target category, excluding
        //    the moved channel, then splice the moved channel at the new index.
        const categoryChannels = channels
          .filter((c) =>
            c.spaceId === activeSpaceId &&
            c.id !== channelId &&
            (realTargetCatId ? c.categoryId === realTargetCatId : !c.categoryId),
          )
          .sort((a, b) => a.position - b.position);

        categoryChannels.splice(newIndex, 0, channel);

        // 3. Reorder: send all channel IDs in this category
        await service.reorderChannels(activeSpaceId, categoryChannels.map((c) => c.id));

        // 4. Manually dispatch channelUpdated event to trigger useCommunity refresh.
        //    The WASM reorder functions update the DB but don't emit events.
        syncEvent({ type: 'channelUpdated', communityId, channelId });
      } catch (err) {
        console.warn('[CommunityLayoutSidebar] Failed to reorder channel:', err);
      }
    },
    [service, channels, activeSpaceId, myDid, communityId],
  );

  const handleCategoryReorder = useCallback(
    async (categoryId: string, newIndex: number) => {
      if (!service || !activeSpaceId) return;
      try {
        const spaceCategories = realCategories
          .filter((c) => c.spaceId === activeSpaceId)
          .sort((a, b) => a.position - b.position);
        const current = spaceCategories.findIndex((c) => c.id === categoryId);
        if (current === -1 || current === newIndex) return;
        const reordered = [...spaceCategories];
        const [moved] = reordered.splice(current, 1);
        reordered.splice(newIndex, 0, moved);
        await service.reorderCategories(activeSpaceId, reordered.map((c) => c.id));

        // Manually dispatch categoryUpdated event to trigger useCommunity refresh.
        // The WASM reorder function updates the DB but doesn't emit events.
        syncEvent({ type: 'categoryUpdated', categoryId });
      } catch (err) {
        console.warn('[CommunityLayoutSidebar] Failed to reorder category:', err);
      }
    },
    [service, realCategories, activeSpaceId],
  );

  // ---------------------------------------------------------------------------
  // Render — replicate Sidebar visual styles on a plain View so
  // CommunitySidebar's internal flex layout (header → tabs → flex:1 channels)
  // works correctly (Sidebar wraps children in ScrollView which breaks flex).
  // ---------------------------------------------------------------------------

  const { theme } = useTheme();
  const iconColor = theme.colors.text.onRaisedSecondary;

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.background.surface,
        borderRightWidth: 1,
        borderColor: theme.colors.border.subtle,
      }}
    >
      {/* Invisible anchor at the top to measure the header position for the dropdown */}
      <View
        ref={headerAnchorRef}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 56 }}
        pointerEvents="none"
      />

      {/* Header action buttons — overlaid on top-right of community header */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 10,
          height: 56,
          flexDirection: 'row',
          alignItems: 'center',
          paddingRight: 8,
          gap: 2,
        }}
      >
        <Pressable
          onPress={() => { setSettingsInitialSection('invites'); setSettingsDialogOpen(true); }}
          accessibilityRole="button"
          accessibilityLabel="Invite link"
          style={({ pressed }) => ({
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <ShareIcon size={16} color={theme.colors.text.secondary} />
        </Pressable>
      </View>

      {/* Seat claim banner */}
      {matchingSeats.length > 0 && (
        <View
          style={{
            padding: 10,
            backgroundColor: theme.colors.accent.primary + '15',
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.accent.primary + '30',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <RNText style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text.primary }}>
                  Claim your seat
                </RNText>
              </View>
              <RNText style={{ fontSize: 12, color: theme.colors.text.muted, marginBottom: 8 }}>
                We found your {matchingSeats[0].platform} account "{matchingSeats[0].platformUsername}" in this community. Claim to get your original roles.
              </RNText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={() => handleClaimSeat(matchingSeats[0].id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: theme.colors.accent.primary,
                    borderRadius: 6,
                  }}
                >
                  <RNText style={{ fontSize: 12, fontWeight: '600', color: theme.colors.text.inverse }}>
                    Claim Seat
                  </RNText>
                </Pressable>
                <Pressable
                  onPress={() => handleDismissSeat(matchingSeats[0].id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                  }}
                >
                  <RNText style={{ fontSize: 12, color: theme.colors.text.muted }}>
                    Dismiss
                  </RNText>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Community banner — shown above channel list when available */}
      {community?.bannerUrl && (
        <Image
          source={{ uri: community.bannerUrl }}
          style={{
            width: '100%',
            height: 120,
            backgroundColor: theme.colors.background.surface,
          }}
          resizeMode="cover"
        />
      )}

      <View style={{ flex: 1, minHeight: 0 }}>
        <CommunitySidebar
          community={communityInfo}
          spaces={wispSpaces}
          activeSpaceId={activeSpaceId ?? wispSpaces[0]?.id ?? ''}
          onSpaceChange={handleSpaceChange}
          onSpaceLongPress={handleSpaceLongPress}
          onSpaceCreate={handleSpaceCreate}
          categories={categories}
          onChannelClick={handleChannelClick}
          onChannelLongPress={handleChannelLongPress}
          onCategoryToggle={handleCategoryToggle}
          onChannelCreate={handleChannelCreate}
          onCategoryLongPress={handleCategoryLongPress}
          onCommunityClick={handleCommunityClick}
          renderChannelExtra={renderChannelExtra}
          renderChannelIcon={renderChannelIcon}
          draggable
          onChannelReorder={handleChannelReorder}
          onCategoryReorder={handleCategoryReorder}
          onSidebarLongPress={handleSidebarLongPress}
          loading={communityLoading}
          skeleton={communityLoading && !community}
        />
      </View>

      {/* Voice channel controls moved to VoiceCallPanel inline */}

      {/* Community header dropdown — positioned via anchorLayout */}
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen} anchorLayout={headerLayout}>
        <DropdownMenuContent>
          <DropdownMenuItem icon={<SettingsIcon size={16} color={iconColor} />} onSelect={() => { setSettingsInitialSection(undefined); setSettingsDialogOpen(true); }}>
            Server Settings
          </DropdownMenuItem>
          <DropdownMenuItem icon={<FileTextIcon size={16} color={iconColor} />} onSelect={() => {}}>
            Audit Log
          </DropdownMenuItem>
          <DropdownMenuItem
            icon={<ShieldIcon size={16} color={iconColor} />}
            onSelect={() => { setSettingsInitialSection('roles'); setSettingsDialogOpen(true); }}
          >
            Manage Roles
          </DropdownMenuItem>
          <DropdownMenuItem
            icon={<ShareIcon size={16} color={iconColor} />}
            onSelect={() => { setSettingsInitialSection('invites'); setSettingsDialogOpen(true); }}
          >
            Invite Link
          </DropdownMenuItem>
          {qrInviteUrl && (
            <DropdownMenuItem
              icon={<QrCodeIcon size={16} color={iconColor} />}
              onSelect={() => setQrInviteOpen(true)}
            >
              QR Invite
            </DropdownMenuItem>
          )}
          <DropdownMenuItem icon={<PlusIcon size={16} color={iconColor} />} onSelect={handleCategoryCreate}>
            Create Category
          </DropdownMenuItem>
          <DropdownMenuItem icon={<BellIcon size={16} color={iconColor} />} onSelect={() => {}}>
            Notification Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {isOwner ? (
            <DropdownMenuItem icon={<TrashIcon size={16} />} danger onSelect={handleDeleteCommunity}>
              Delete Community
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem icon={<LogOutIcon size={16} />} danger onSelect={handleLeaveServer}>
              Leave Server
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Community Settings Dialog */}
      <CommunitySettingsDialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        communityId={communityId}
        community={community}
        members={members}
        roles={realRoles}
        loading={communityLoading}
        onRefresh={refreshCommunity}
        initialSection={settingsInitialSection}
        // Role management
        selectedRoleId={selectedRoleId}
        onRoleSelect={setSelectedRoleId}
        onRoleCreate={handleRoleCreate}
        onRoleUpdate={handleRoleUpdate}
        onRoleDelete={handleRoleDelete}
        onPermissionToggle={handlePermissionToggle}
        onRoleReorder={handleRoleReorder}
        roleMemberCounts={roleMemberCounts}
        roleMembers={roleMembersForRolePanel}
        allMembersForRoles={allMembersForRolePanel}
        onMemberAdd={handleMemberAdd}
        onMemberRemove={handleMemberRemove}
        // Invite management
        invites={invitePanelInvites}
        onCreateInvite={handleCreateInvite}
        onDeleteInvite={handleDeleteInvite}
        inviteCreating={inviteCreating}
        invitesLoading={invitesLoading}
        // Emoji
        emoji={emoji}
        // Stickers
        stickers={stickers}
        stickerPacks={stickerPacks}
        // Seats re-scan (TODO: requires storing source guild ID + relay bot token endpoint)
        // onRescanSeats={handleRescanSeats}
        // rescanningSeats={rescanningSeats}
        // Leave/Delete community (opens confirmation dialog)
        onLeaveCommunity={() => { setSettingsDialogOpen(false); setLeaveDialogOpen(true); }}
        onDeleteCommunity={() => { setSettingsDialogOpen(false); setDeleteDialogOpen(true); }}
      />



      {/* Channel context menu (long-press on channel) */}
      <ChannelContextMenu
        open={channelMenuOpen}
        onOpenChange={setChannelMenuOpen}
        anchorLayout={channelMenuLayout}
        channel={channelMenuTarget}
        onEdit={handleChannelEdit}
        onDelete={handleChannelDelete}
        onMoveToCategory={handleOpenMoveToCategory}
      />

      {/* Space context menu (long-press on space tab) */}
      <SpaceContextMenu
        open={spaceMenuOpen}
        onOpenChange={setSpaceMenuOpen}
        anchorLayout={spaceMenuLayout}
        space={spaceMenuTarget}
        onEdit={handleSpaceEdit}
        onDelete={handleSpaceDelete}
        onCreateChannel={() => handleChannelCreate('__uncategorized__')}
        onCreateCategory={handleCategoryCreate}
      />

      {/* Category context menu (long-press on category) */}
      <CategoryContextMenu
        open={categoryMenuOpen}
        onOpenChange={setCategoryMenuOpen}
        anchorLayout={categoryMenuLayout}
        category={categoryMenuTarget}
        onCreateChannel={handleChannelCreateInCategory}
        onCreateCategory={handleCategoryCreate}
        onEdit={handleCategoryEdit}
        onDelete={handleCategoryDelete}
        onMoveUp={handleCategoryMoveUp}
        onMoveDown={handleCategoryMoveDown}
        isFirst={categoryMenuIsFirst}
        isLast={categoryMenuIsLast}
      />

      {/* Space create dialog */}
      <InputDialog
        open={spaceCreateDialogOpen}
        onClose={() => setSpaceCreateDialogOpen(false)}
        title="Create Space"
        label="Space Name"
        placeholder="e.g. Development, Social, Gaming"
        submitLabel="Create"
        onSubmit={handleSpaceCreateSubmit}
        submitting={dialogSubmitting}
      />

      {/* Space edit dialog */}
      <InputDialog
        open={spaceEditDialogOpen}
        onClose={() => setSpaceEditDialogOpen(false)}
        title="Rename Space"
        label="Space Name"
        placeholder="Enter new name"
        defaultValue={spaceEditTarget?.name ?? ''}
        submitLabel="Save"
        onSubmit={handleSpaceEditSubmit}
        submitting={dialogSubmitting}
      />

      {/* Space delete confirmation */}
      <ConfirmDialog
        open={spaceDeleteDialogOpen}
        onClose={() => setSpaceDeleteDialogOpen(false)}
        title="Delete Space"
        message={`Are you sure you want to delete "${spaceDeleteTarget?.name ?? ''}"? All channels in this space will also be deleted. This action cannot be undone.`}
        confirmLabel="Delete Space"
        onConfirm={handleSpaceDeleteConfirm}
        submitting={dialogSubmitting}
      />

      {/* Channel create dialog */}
      <ChannelCreateDialog
        open={channelCreateDialogOpen}
        onClose={() => setChannelCreateDialogOpen(false)}
        onSubmit={handleChannelCreateSubmit}
        submitting={dialogSubmitting}
      />

      {/* Channel edit dialog */}
      <InputDialog
        open={channelEditDialogOpen}
        onClose={() => setChannelEditDialogOpen(false)}
        title="Rename Channel"
        label="Channel Name"
        placeholder="Enter new name"
        defaultValue={channelEditTarget?.name ?? ''}
        submitLabel="Save"
        onSubmit={handleChannelEditSubmit}
        submitting={dialogSubmitting}
      />

      {/* Channel delete confirmation */}
      <ConfirmDialog
        open={channelDeleteDialogOpen}
        onClose={() => setChannelDeleteDialogOpen(false)}
        title="Delete Channel"
        message={`Are you sure you want to delete "#${channelDeleteTarget?.name ?? ''}"? All messages in this channel will be lost. This action cannot be undone.`}
        confirmLabel="Delete Channel"
        onConfirm={handleChannelDeleteConfirm}
        submitting={dialogSubmitting}
      />

      {/* Category create dialog */}
      <InputDialog
        open={categoryCreateDialogOpen}
        onClose={() => setCategoryCreateDialogOpen(false)}
        title="Create Category"
        label="Category Name"
        placeholder="e.g. General, Development, Resources"
        submitLabel="Create"
        onSubmit={handleCategoryCreateSubmit}
        submitting={dialogSubmitting}
      />

      {/* Category edit dialog */}
      <InputDialog
        open={categoryEditDialogOpen}
        onClose={() => setCategoryEditDialogOpen(false)}
        title="Rename Category"
        label="Category Name"
        placeholder="Enter new name"
        defaultValue={categoryEditTarget?.name ?? ''}
        submitLabel="Save"
        onSubmit={handleCategoryEditSubmit}
        submitting={dialogSubmitting}
      />

      {/* Category delete confirmation */}
      <ConfirmDialog
        open={categoryDeleteDialogOpen}
        onClose={() => setCategoryDeleteDialogOpen(false)}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryDeleteTarget?.name ?? ''}"? Channels in this category will become uncategorized. This action cannot be undone.`}
        confirmLabel="Delete Category"
        onConfirm={handleCategoryDeleteConfirm}
        submitting={dialogSubmitting}
      />

      {/* Move to Category dialog */}
      <MoveToCategoryDialog
        open={moveCategoryDialogOpen}
        onClose={() => setMoveCategoryDialogOpen(false)}
        channel={moveCategoryChannelTarget}
        categories={spaceCategoriesForMove}
        currentCategoryId={moveCategoryChannelCurrentCategoryId}
        onSelect={handleMoveToCategorySelect}
      />

      {/* Leave Community Confirmation */}
      <ConfirmDialog
        open={leaveDialogOpen}
        onClose={() => setLeaveDialogOpen(false)}
        title="Leave Community"
        message={`Are you sure you want to leave "${community?.name || 'this community'}"? You will lose access to all channels and messages.`}
        confirmLabel="Leave"
        onConfirm={handleLeaveConfirm}
      />

      {/* Delete Community Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete Community"
        message={`Are you sure you want to permanently delete "${community?.name || 'this community'}"? This will delete all channels, messages, roles, and members. This action cannot be undone.`}
        confirmLabel="Delete Community"
        onConfirm={handleDeleteConfirm}
        image={umbraDeadImage}
      />

      {/* QR Invite Dialog */}
      {qrInviteUrl && (
        <QRCardDialog
          open={qrInviteOpen}
          onClose={() => setQrInviteOpen(false)}
          mode="community-invite"
          value={qrInviteUrl}
          label={community?.name}
          title="Community Invite"
        />
      )}
    </View>
  );
}
