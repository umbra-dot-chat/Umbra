/**
 * @module CommunitySettingsDialog
 * @description Full-screen overlay for community/server settings.
 *
 * Three-column layout: sidebar nav | section content | detail panel.
 * The Roles and Invites sections embed their Wisp panels directly,
 * which manage their own internal multi-column layouts.
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Pressable, ScrollView, Text as RNText, ActivityIndicator } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { Overlay, Button, Text, useTheme } from '@coexist/wisp-react-native';
import type { RoleMember, InviteCreateOptions } from '@coexist/wisp-react-native';
import { defaultSpacing, defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';

import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Community, CommunityMember, CommunityRole, CommunitySeat } from '@umbra/service';

import { CommunityOverviewPanel } from '@/components/community/CommunityOverviewPanel';
import { CommunitySeatsPanel } from '@/components/community/CommunitySeatsPanel';
import { CommunityRolePanel } from '@/components/community/CommunityRolePanel';
import type { CommunityRole as CommunityRolePanelType } from '@/components/community/CommunityRolePanel';
import { CommunityInvitePanel } from '@/components/community/CommunityInvitePanel';
import type { CommunityInvite as CommunityInvitePanelType } from '@/components/community/CommunityInvitePanel';

// ---------------------------------------------------------------------------
// Icons (inline to avoid circular imports)
// ---------------------------------------------------------------------------

function InfoIcon({ size, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size || 18} height={size || 18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Line x1="12" y1="16" x2="12" y2="12" />
      <Line x1="12" y1="8" x2="12.01" y2="8" />
    </Svg>
  );
}

function ShieldIcon({ size, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size || 18} height={size || 18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  );
}

function UsersIcon({ size, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size || 18} height={size || 18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <Circle cx="9" cy="7" r="4" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

function GhostIcon({ size, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size || 18} height={size || 18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-3 2 3 3-3 3 3 2-3 3 3V10a8 8 0 0 0-8-8z" />
    </Svg>
  );
}

function LinkIcon({ size, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size || 18} height={size || 18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Svg>
  );
}

function BanIcon({ size, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size || 18} height={size || 18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </Svg>
  );
}

function FileTextIcon({ size, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size || 18} height={size || 18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Polyline points="14 2 14 8 20 8" />
      <Line x1="16" y1="13" x2="8" y2="13" />
      <Line x1="16" y1="17" x2="8" y2="17" />
      <Polyline points="10 9 9 9 8 9" />
    </Svg>
  );
}

function XIcon({ size, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size || 18} height={size || 18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1="18" y1="6" x2="6" y2="18" />
      <Line x1="6" y1="6" x2="18" y2="18" />
    </Svg>
  );
}

function AlertTriangleIcon({ size, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size || 18} height={size || 18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <Line x1="12" y1="9" x2="12" y2="13" />
      <Line x1="12" y1="17" x2="12.01" y2="17" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CommunitySettingsSection =
  | 'overview'
  | 'roles'
  | 'members'
  | 'seats'
  | 'invites'
  | 'moderation'
  | 'audit-log'
  | 'danger';

export interface CommunitySettingsDialogProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Called when the dialog should close. */
  onClose: () => void;
  /** Community ID. */
  communityId: string;
  /** Community data from useCommunity hook. */
  community: Community | null;
  /** Community members. */
  members: CommunityMember[];
  /** Community roles. */
  roles: CommunityRole[];
  /** Whether data is still loading. */
  loading: boolean;
  /** Refresh callback. */
  onRefresh: () => Promise<void>;
  /** Initial section to show. */
  initialSection?: CommunitySettingsSection;

  // -- Role management (passed through to CommunityRolePanel) --
  /** Currently selected role ID. */
  selectedRoleId?: string;
  /** Called when a role is selected. */
  onRoleSelect?: (roleId: string) => void;
  /** Called to create a new role. */
  onRoleCreate?: () => void;
  /** Called to update a role. */
  onRoleUpdate?: (roleId: string, updates: Partial<CommunityRolePanelType>) => void;
  /** Called to delete a role. */
  onRoleDelete?: (roleId: string) => void;
  /** Called to toggle a permission bit on a role. */
  onPermissionToggle?: (roleId: string, bitIndex: number, value: boolean | null) => void;
  /** Called to reorder a role. */
  onRoleReorder?: (roleId: string, newPosition: number) => void;
  /** Map of role ID → member count. */
  roleMemberCounts?: Record<string, number>;
  /** Members who have the currently selected role. */
  roleMembers?: RoleMember[];
  /** All community members (for the role member add picker). */
  allMembersForRoles?: RoleMember[];
  /** Called to add a member to a role. */
  onMemberAdd?: (roleId: string, memberId: string) => void;
  /** Called to remove a member from a role. */
  onMemberRemove?: (roleId: string, memberId: string) => void;

  // -- Invite management (passed through to CommunityInvitePanel) --
  /** Invite records (snake_case format for the panel). */
  invites?: CommunityInvitePanelType[];
  /** Called to create an invite. */
  onCreateInvite?: (options: InviteCreateOptions) => void;
  /** Called to delete an invite. */
  onDeleteInvite?: (inviteId: string) => void;
  /** Whether invite creation is in progress. */
  inviteCreating?: boolean;
  /** Whether invites are loading. */
  invitesLoading?: boolean;

  // -- Seats re-scan --
  /** Called to sync/rescan members from the platform. */
  onRescanSeats?: () => Promise<void>;
  /** Whether a rescan is in progress. */
  rescanningSeats?: boolean;

  // -- Leave/Delete community --
  /** Called when user wants to leave the community. */
  onLeaveCommunity?: () => void;
  /** Called when owner wants to delete the community. */
  onDeleteCommunity?: () => void;
}

interface NavItem {
  id: CommunitySettingsSection;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: InfoIcon },
  { id: 'roles', label: 'Roles', icon: ShieldIcon },
  { id: 'members', label: 'Members', icon: UsersIcon },
  { id: 'seats', label: 'Seats', icon: GhostIcon },
  { id: 'invites', label: 'Invites', icon: LinkIcon },
  { id: 'moderation', label: 'Moderation', icon: BanIcon },
  { id: 'audit-log', label: 'Audit Log', icon: FileTextIcon },
  { id: 'danger', label: 'Danger', icon: AlertTriangleIcon },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CommunitySettingsDialog({
  open,
  onClose,
  communityId,
  community,
  members,
  roles,
  loading,
  onRefresh,
  initialSection,
  // Role management
  selectedRoleId,
  onRoleSelect,
  onRoleCreate,
  onRoleUpdate,
  onRoleDelete,
  onPermissionToggle,
  onRoleReorder,
  roleMemberCounts,
  roleMembers,
  allMembersForRoles,
  onMemberAdd,
  onMemberRemove,
  // Invite management
  invites,
  onCreateInvite,
  onDeleteInvite,
  inviteCreating,
  invitesLoading,
  // Seats re-scan
  onRescanSeats,
  rescanningSeats,
  // Leave/Delete community
  onLeaveCommunity,
  onDeleteCommunity,
}: CommunitySettingsDialogProps) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const { service } = useUmbra();
  const { identity } = useAuth();

  const [activeSection, setActiveSection] = useState<CommunitySettingsSection>(initialSection || 'overview');

  // Determine if current user is the community owner
  const isOwner = useMemo(() => {
    if (!community || !identity?.did) return false;
    return community.ownerDid === identity.did;
  }, [community, identity?.did]);

  // Seats state (loaded lazily when seats tab is selected)
  const [seats, setSeats] = useState<CommunitySeat[]>([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [seatsLoaded, setSeatsLoaded] = useState(false);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setActiveSection(initialSection || 'overview');
      setSeatsLoaded(false);
      setSeats([]);
    }
  }, [open, initialSection]);

  // Load seats when the seats tab is activated
  useEffect(() => {
    if (activeSection === 'seats' && !seatsLoaded && service && communityId) {
      setSeatsLoading(true);
      service.getSeats(communityId)
        .then((result) => {
          setSeats(result);
          setSeatsLoaded(true);
        })
        .catch(() => {
          setSeats([]);
          setSeatsLoaded(true);
        })
        .finally(() => setSeatsLoading(false));
    }
  }, [activeSection, seatsLoaded, service, communityId]);

  const handleDeleteSeat = useCallback(async (seatId: string) => {
    if (!service || !identity?.did) return;
    await service.deleteSeat(seatId, identity.did);
    setSeats((prev) => prev.filter((s) => s.id !== seatId));
  }, [service, identity]);

  const handleRefreshSeats = useCallback(() => {
    setSeatsLoaded(false);
  }, []);

  const handleRescanSeats = useCallback(async () => {
    if (!onRescanSeats) return;
    await onRescanSeats();
    // After rescan, reload seats
    setSeatsLoaded(false);
  }, [onRescanSeats]);

  // ── Fetch Users from Discord (self-contained OAuth + member fetch + seat creation) ──
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const fetchPopupRef = useRef<Window | null>(null);
  const fetchAuthRef = useRef(false);

  const handleFetchUsers = useCallback(() => {
    if (fetchingUsers || !service) return;
    setFetchingUsers(true);

    const RELAY = process.env.EXPO_PUBLIC_RELAY_URL || 'https://relay.umbra.chat';

    // Open popup immediately (user gesture context)
    const w = 500, h = 700;
    const left = window.screenX + (window.innerWidth - w) / 2;
    const top = window.screenY + (window.innerHeight - h) / 2;
    fetchPopupRef.current = window.open(
      'about:blank', 'discord_fetch_users',
      `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,status=no`
    );

    if (!fetchPopupRef.current) {
      setFetchingUsers(false);
      return;
    }

    // Listen for OAuth callback
    fetchAuthRef.current = false;
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type !== 'UMBRA_COMMUNITY_IMPORT' || !event.data.success || !event.data.token) return;
      fetchAuthRef.current = true;
      window.removeEventListener('message', handleMessage);

      const token = event.data.token;

      try {
        // Step 1: Fetch guilds
        const guildsRes = await fetch(`${RELAY}/community/import/discord/guilds?token=${encodeURIComponent(token)}`);
        if (!guildsRes.ok) throw new Error('Failed to fetch guilds');
        const guildsData = await guildsRes.json();
        const guilds: Array<{ id: string; name: string }> = guildsData.guilds || [];

        if (guilds.length === 0) {
          console.warn('[fetch-users] No guilds found');
          setFetchingUsers(false);
          return;
        }

        // Step 2: Find the guild that matches this community.
        // First try to match by community name (imported communities keep the guild name).
        // Fall back to first guild where the bot is present.
        let targetGuild: { id: string; name: string } | null = null;
        let fallbackGuild: { id: string; name: string } | null = null;
        const communityName = community?.name?.toLowerCase().trim();

        for (const guild of guilds) {
          try {
            const botRes = await fetch(`${RELAY}/community/import/discord/bot-status?guild_id=${encodeURIComponent(guild.id)}`);
            if (botRes.ok) {
              const botData = await botRes.json();
              if (botData.bot_enabled && botData.in_guild) {
                // Check if this guild's name matches the community name
                if (communityName && guild.name.toLowerCase().trim() === communityName) {
                  targetGuild = guild;
                  break; // Exact match — use this one
                }
                // Otherwise remember it as a fallback
                if (!fallbackGuild) fallbackGuild = guild;
              }
            }
          } catch { /* skip */ }
        }

        // Use name-matched guild, otherwise fall back to first guild with bot
        if (!targetGuild) targetGuild = fallbackGuild;

        if (!targetGuild) {
          console.warn('[fetch-users] No guild found with bot. Guilds:', guilds.map(g => g.name));
          setFetchingUsers(false);
          return;
        }

        console.log(`[fetch-users] Fetching members from "${targetGuild.name}" (${targetGuild.id})`);

        // Step 3: Fetch members
        const membersRes = await fetch(
          `${RELAY}/community/import/discord/guild/${targetGuild.id}/members?token=${encodeURIComponent(token)}`
        );
        if (!membersRes.ok) throw new Error(`Failed to fetch members (${membersRes.status})`);

        const membersData = await membersRes.json();
        if (!membersData.hasMembersIntent || !membersData.members?.length) {
          console.warn('[fetch-users] No members or missing GUILD_MEMBERS intent');
          setFetchingUsers(false);
          return;
        }

        // Filter out bots
        const humanMembers = membersData.members.filter((m: any) => !m.bot);
        console.log(`[fetch-users] Got ${humanMembers.length} human members`);

        // Step 4: Create seats in chunks to avoid blocking the UI
        const seatData = humanMembers.map((m: any) => ({
          platform: 'discord',
          platform_user_id: m.userId,
          platform_username: m.username,
          nickname: m.nickname ?? undefined,
          avatar_url: m.avatar
            ? `https://cdn.discordapp.com/avatars/${m.userId}/${m.avatar}.png`
            : undefined,
          role_ids: [], // No role mapping for quick fetch
        }));

        const CHUNK_SIZE = 100;
        let totalCreated = 0;
        for (let i = 0; i < seatData.length; i += CHUNK_SIZE) {
          const chunk = seatData.slice(i, i + CHUNK_SIZE);
          const created = await service.createSeatsBatch(communityId, chunk);
          totalCreated += created;
          console.log(`[fetch-users] Chunk ${Math.floor(i / CHUNK_SIZE) + 1}: created ${created} seats (${totalCreated} / ${seatData.length})`);
          // Yield to event loop
          if (i + CHUNK_SIZE < seatData.length) {
            await new Promise((r) => setTimeout(r, 0));
          }
        }
        console.log(`[fetch-users] Created ${totalCreated} seats total`);

        // Reload seats
        setSeatsLoaded(false);
      } catch (err) {
        console.error('[fetch-users] Error:', err);
      } finally {
        setFetchingUsers(false);
      }
    };

    window.addEventListener('message', handleMessage);

    // Start OAuth flow
    fetch(`${RELAY}/community/import/discord/start`, { method: 'POST' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to start OAuth');
        const data = await res.json();
        if (fetchPopupRef.current && !fetchPopupRef.current.closed) {
          fetchPopupRef.current.location.href = data.redirect_url;
        }
      })
      .catch(() => {
        fetchPopupRef.current?.close();
        setFetchingUsers(false);
        window.removeEventListener('message', handleMessage);
      });

    // Poll for popup close
    const pollTimer = setInterval(() => {
      if (fetchPopupRef.current?.closed) {
        clearInterval(pollTimer);
        if (!fetchAuthRef.current) {
          setFetchingUsers(false);
          window.removeEventListener('message', handleMessage);
        }
      }
    }, 500);
  }, [fetchingUsers, service, communityId]);

  const handleSaveOverview = useCallback(async (updates: { name?: string; description?: string }) => {
    if (!service || !identity?.did) return;
    await service.updateCommunity(communityId, identity.did, updates.name, updates.description);
    await onRefresh();
  }, [service, identity, communityId, onRefresh]);

  // -- Role panel data transformation (same as CommunityLayoutSidebar) --
  const rolePanelRoles: CommunityRolePanelType[] = useMemo(() => {
    return roles.map((r) => ({
      id: r.id,
      community_id: communityId,
      name: r.name,
      color: r.color,
      icon: r.icon,
      badge: r.badge,
      position: r.position,
      hoisted: r.hoisted,
      mentionable: r.mentionable,
      is_preset: r.isPreset ?? false,
      permissions_bitfield: r.permissionsBitfield ?? '0',
      created_at: r.createdAt,
      updated_at: r.updatedAt,
    }));
  }, [roles, communityId]);

  // -- Styles ----------------------------------------------------------------

  const modalStyle = useMemo<ViewStyle>(
    () => ({
      width: 1100,
      maxWidth: '95%',
      height: 640,
      maxHeight: '90%',
      flexDirection: 'row',
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: isDark ? tc.background.raised : tc.background.canvas,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? tc.border.subtle : 'transparent',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.6 : 0.25,
      shadowRadius: 32,
      elevation: 12,
    }),
    [tc, isDark],
  );

  const sidebarStyle = useMemo<ViewStyle>(
    () => ({
      width: 180,
      flexGrow: 0,
      flexShrink: 0,
      backgroundColor: isDark ? tc.background.surface : tc.background.sunken,
      borderRightWidth: 1,
      borderRightColor: tc.border.subtle,
      paddingVertical: 16,
      paddingHorizontal: 10,
    }),
    [tc, isDark],
  );

  const sidebarTitleStyle = useMemo<TextStyle>(
    () => ({
      fontSize: 13,
      fontWeight: '700',
      color: tc.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 8,
      marginBottom: 8,
    }),
    [tc],
  );

  // -- Whether the active section needs its own scroll (panels manage their own) --
  const sectionManagesOwnScroll = activeSection === 'roles' || activeSection === 'invites';

  // -- Render section content ------------------------------------------------

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <CommunityOverviewPanel
            name={community?.name || ''}
            description={community?.description || ''}
            onSave={handleSaveOverview}
          />
        );

      case 'roles':
        return (
          <CommunityRolePanel
            communityId={communityId}
            roles={rolePanelRoles}
            memberCounts={roleMemberCounts}
            selectedRoleId={selectedRoleId}
            onRoleSelect={onRoleSelect}
            onRoleCreate={onRoleCreate}
            onRoleUpdate={onRoleUpdate}
            onRoleDelete={onRoleDelete}
            onPermissionToggle={onPermissionToggle}
            onRoleReorder={onRoleReorder}
            roleMembers={roleMembers}
            allMembers={allMembersForRoles}
            onMemberAdd={onMemberAdd}
            onMemberRemove={onMemberRemove}
            title=""
            style={{ borderWidth: 0, borderRadius: 0 }}
          />
        );

      case 'members':
        return (
          <View style={{ flex: 1, padding: defaultSpacing.md }}>
            <Text size="lg" weight="semibold" style={{ color: tc.text.primary, marginBottom: defaultSpacing.md }}>
              Members ({members.length})
            </Text>
            <ScrollView style={{ flex: 1 }}>
              {members.map((member) => (
                <View
                  key={member.memberDid}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: defaultSpacing.md,
                    padding: defaultSpacing.sm,
                    paddingHorizontal: defaultSpacing.md,
                    borderRadius: defaultRadii.md,
                    marginBottom: 2,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: tc.accent.primary + '20',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text size="sm" weight="bold" style={{ color: tc.accent.primary }}>
                      {(member.nickname || member.memberDid).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" weight="medium" style={{ color: tc.text.primary }} numberOfLines={1}>
                      {member.nickname || member.memberDid.slice(0, 16)}
                    </Text>
                    <Text size="xs" style={{ color: tc.text.muted }} numberOfLines={1}>
                      {member.memberDid.slice(0, 24)}...
                    </Text>
                  </View>
                  <Text size="xs" style={{ color: tc.text.muted }}>
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        );

      case 'seats':
        return (
          <CommunitySeatsPanel
            communityId={communityId}
            seats={seats}
            roles={roles}
            loading={seatsLoading}
            onDeleteSeat={handleDeleteSeat}
            onRefresh={handleRefreshSeats}
            onRescan={onRescanSeats ? handleRescanSeats : undefined}
            rescanning={rescanningSeats}
            onFetchUsers={handleFetchUsers}
            fetchingUsers={fetchingUsers}
          />
        );

      case 'invites':
        return (
          <CommunityInvitePanel
            communityId={communityId}
            invites={invites || []}
            onCreateInvite={onCreateInvite}
            onDeleteInvite={onDeleteInvite}
            creating={inviteCreating}
            loading={invitesLoading}
            title="Invites"
          />
        );

      case 'moderation':
        return (
          <View style={{ flex: 1, padding: defaultSpacing.md }}>
            <Text size="lg" weight="semibold" style={{ color: tc.text.primary, marginBottom: defaultSpacing.md }}>
              Moderation
            </Text>
            <Text size="sm" style={{ color: tc.text.muted }}>
              View banned members and manage moderation actions.
            </Text>
          </View>
        );

      case 'audit-log':
        return (
          <View style={{ flex: 1, padding: defaultSpacing.md }}>
            <Text size="lg" weight="semibold" style={{ color: tc.text.primary, marginBottom: defaultSpacing.md }}>
              Audit Log
            </Text>
            <Text size="sm" style={{ color: tc.text.muted }}>
              Review actions taken by members and administrators.
            </Text>
          </View>
        );

      case 'danger':
        return (
          <View style={{ flex: 1, padding: defaultSpacing.md }}>
            <Text size="lg" weight="semibold" style={{ color: tc.status.danger, marginBottom: defaultSpacing.sm }}>
              Danger Zone
            </Text>
            <Text size="sm" style={{ color: tc.text.muted, marginBottom: defaultSpacing.lg }}>
              Irreversible and destructive actions.
            </Text>

            <View
              style={{
                padding: defaultSpacing.md,
                borderRadius: defaultRadii.md,
                borderWidth: 1,
                borderColor: tc.status.danger,
                gap: defaultSpacing.md,
              }}
            >
              {isOwner ? (
                <>
                  <View>
                    <Text size="sm" weight="semibold" style={{ color: tc.text.primary, marginBottom: defaultSpacing.xs }}>
                      Delete Community
                    </Text>
                    <Text size="sm" style={{ color: tc.text.muted }}>
                      Permanently delete this community and all of its data including channels, messages, roles, and members. This action cannot be undone.
                    </Text>
                  </View>
                  <Button variant="destructive" onPress={onDeleteCommunity}>
                    Delete Community
                  </Button>
                </>
              ) : (
                <>
                  <View>
                    <Text size="sm" weight="semibold" style={{ color: tc.text.primary, marginBottom: defaultSpacing.xs }}>
                      Leave Community
                    </Text>
                    <Text size="sm" style={{ color: tc.text.muted }}>
                      Leave this community and lose access to all channels and messages. You can rejoin later if you have an invite.
                    </Text>
                  </View>
                  <Button variant="destructive" onPress={onLeaveCommunity}>
                    Leave Community
                  </Button>
                </>
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Overlay
      open={open}
      backdrop="dim"
      center
      onBackdropPress={onClose}
      animationType="fade"
    >
      <View style={modalStyle}>
        {/* ── Left Sidebar ── */}
        <ScrollView style={sidebarStyle} showsVerticalScrollIndicator={false}>
          <RNText style={sidebarTitleStyle}>Server Settings</RNText>

          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            const isDanger = item.id === 'danger';
            const Icon = item.icon;

            return (
              <React.Fragment key={item.id}>
                {/* Separator before danger section */}
                {isDanger && (
                  <View
                    style={{
                      height: 1,
                      backgroundColor: tc.border.subtle,
                      marginVertical: 8,
                      marginHorizontal: 4,
                    }}
                  />
                )}
                <Pressable
                  onPress={() => setActiveSection(item.id)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    backgroundColor: isActive
                      ? isDanger
                        ? tc.status.danger
                        : tc.accent.primary
                      : pressed
                        ? isDanger
                          ? tc.status.danger + '20'
                          : tc.accent.highlight
                        : 'transparent',
                    marginBottom: 2,
                  })}
                >
                  <Icon
                    size={18}
                    color={isActive ? tc.text.inverse : isDanger ? tc.status.danger : tc.text.secondary}
                  />
                  <RNText
                    style={{
                      fontSize: 14,
                      fontWeight: isActive ? '600' : '400',
                      color: isActive ? tc.text.inverse : isDanger ? tc.status.danger : tc.text.secondary,
                    }}
                  >
                    {item.label}
                  </RNText>
                </Pressable>
              </React.Fragment>
            );
          })}
        </ScrollView>

        {/* ── Right Content ── */}
        <View style={{ flex: 1, position: 'relative' }}>
          {/* Close button */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 10,
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? tc.background.sunken : 'transparent',
            })}
          >
            <XIcon size={18} color={tc.text.muted} />
          </Pressable>

          {/* Section content */}
          {loading && !community ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={tc.accent.primary} />
            </View>
          ) : sectionManagesOwnScroll ? (
            // Roles and Invites panels manage their own scrolling
            <View style={{ flex: 1 }}>
              {renderSection()}
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
              {renderSection()}
            </ScrollView>
          )}
        </View>
      </View>
    </Overlay>
  );
}
