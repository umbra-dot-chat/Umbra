/**
 * @module CommunitySeatsPanel
 * @description Ghost member seats panel for the CommunitySettingsDialog.
 *
 * Displays imported member seats from platforms like Discord, showing
 * claimed vs unclaimed status with rich detail (avatars, roles, timestamps).
 * Paginated at 50 per page with search.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Image } from 'react-native';
import { Input, Text, useTheme } from '@coexist/wisp-react-native';
import { defaultSpacing, defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';

import type { CommunitySeat, CommunityRole } from '@umbra/service';

const PAGE_SIZE = 50;

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function GhostIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-3 2 3 3-3 3 3 2-3 3 3V10a8 8 0 0 0-8-8z" />
    </Svg>
  );
}

function CheckCircleIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M9 12l2 2 4-4" />
    </Svg>
  );
}

function TrashIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Svg>
  );
}

function ChevronLeftIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 18l-6-6 6-6" />
    </Svg>
  );
}

function ChevronRightIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 18l6-6-6-6" />
    </Svg>
  );
}

function PlatformBadge({ platform, size = 14 }: { platform: string; size?: number }) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const platformColors: Record<string, string> = {
    discord: '#5865F2',
    github: '#333',
    steam: '#1b2838',
    bluesky: '#0085FF',
    xbox: '#107C10',
  };

  const bgColor = platformColors[platform] || tc.background.sunken;
  const label = platform.charAt(0).toUpperCase() + platform.slice(1);

  return (
    <View
      style={{
        backgroundColor: bgColor,
        borderRadius: size / 2,
        paddingHorizontal: 6,
        paddingVertical: 2,
      }}
    >
      <Text size="xs" style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(ts: number): string {
  // Handle both seconds and milliseconds timestamps
  const ms = ts < 1000000000000 ? ts * 1000 : ts;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommunitySeatsPanelProps {
  /** Community ID. */
  communityId: string;
  /** All seats for this community. */
  seats: CommunitySeat[];
  /** All roles for this community (to display role names/colors). */
  roles: CommunityRole[];
  /** Whether seats are loading. */
  loading: boolean;
  /** Delete a seat (admin action). */
  onDeleteSeat: (seatId: string) => Promise<void>;
  /** Refresh seat data. */
  onRefresh: () => void;
  /** Re-scan/sync members from the platform (e.g. Discord). */
  onRescan?: () => Promise<void>;
  /** Whether a rescan is in progress. */
  rescanning?: boolean;
  /** Fetch users from Discord (opens OAuth + fetches members + creates seats). */
  onFetchUsers?: () => void;
  /** Whether a fetch-users flow is in progress. */
  fetchingUsers?: boolean;
}

// ---------------------------------------------------------------------------
// Icons (action bar)
// ---------------------------------------------------------------------------

function RefreshIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M23 4v6h-6M1 20v-6h6" />
      <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </Svg>
  );
}

function DownloadIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <Polyline points="7 10 12 15 17 10" />
      <Line x1="12" y1="15" x2="12" y2="3" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CommunitySeatsPanel({
  communityId,
  seats,
  roles,
  loading,
  onDeleteSeat,
  onRefresh,
  onRescan,
  rescanning,
  onFetchUsers,
  fetchingUsers,
}: CommunitySeatsPanelProps) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Build role lookup map
  const roleMap = useMemo(() => {
    const map: Record<string, CommunityRole> = {};
    for (const role of roles) {
      map[role.id] = role;
    }
    return map;
  }, [roles]);

  // Filter seats by search query (username, nickname, platform, or role name)
  const filteredSeats = useMemo(() => {
    if (!searchQuery.trim()) return seats;
    const q = searchQuery.toLowerCase();
    return seats.filter((s) => {
      if (s.platformUsername.toLowerCase().includes(q)) return true;
      if (s.nickname && s.nickname.toLowerCase().includes(q)) return true;
      if (s.platform.toLowerCase().includes(q)) return true;
      // Search by role name
      for (const roleId of s.roleIds) {
        const role = roleMap[roleId];
        if (role && role.name.toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [seats, searchQuery, roleMap]);

  // Sort: unclaimed first, then claimed
  const sortedSeats = useMemo(() => {
    return [...filteredSeats].sort((a, b) => {
      const aClaimed = a.claimedByDid ? 1 : 0;
      const bClaimed = b.claimedByDid ? 1 : 0;
      if (aClaimed !== bClaimed) return aClaimed - bClaimed;
      // Within same group, sort by username
      return a.platformUsername.localeCompare(b.platformUsername);
    });
  }, [filteredSeats]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedSeats.length / PAGE_SIZE));
  const pagedSeats = useMemo(
    () => sortedSeats.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [sortedSeats, currentPage]
  );

  // Reset to page 0 when search changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery]);

  // Clamp page when data shrinks
  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [totalPages, currentPage]);

  const totalCount = seats.length;
  const unclaimedCount = seats.filter((s) => !s.claimedByDid).length;

  const handleDelete = useCallback(async (seatId: string) => {
    setDeletingId(seatId);
    try {
      await onDeleteSeat(seatId);
    } finally {
      setDeletingId(null);
    }
  }, [onDeleteSeat]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: defaultSpacing.xl }}>
        <ActivityIndicator color={tc.accent.primary} />
        <Text size="sm" style={{ color: tc.text.muted, marginTop: defaultSpacing.md }}>
          Loading seats...
        </Text>
      </View>
    );
  }

  if (totalCount === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: defaultSpacing.xl, gap: defaultSpacing.md }}>
        <GhostIcon size={48} color={tc.text.muted} />
        <Text size="lg" weight="semibold" style={{ color: tc.text.primary }}>
          No Seats
        </Text>
        <Text size="sm" style={{ color: tc.text.muted, textAlign: 'center', maxWidth: 300 }}>
          Import members from a platform like Discord to create claimable ghost seats.
        </Text>
        {onFetchUsers && (
          <Pressable
            onPress={onFetchUsers}
            disabled={fetchingUsers}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: pressed ? tc.accent.primary + '30' : tc.accent.primary + '15',
              marginTop: defaultSpacing.sm,
              opacity: fetchingUsers ? 0.6 : 1,
            })}
          >
            {fetchingUsers ? (
              <ActivityIndicator size="small" color={tc.accent.primary} />
            ) : (
              <DownloadIcon size={14} color={tc.accent.primary} />
            )}
            <Text size="sm" weight="medium" style={{ color: tc.accent.primary }}>
              {fetchingUsers ? 'Fetching...' : 'Fetch Users from Discord'}
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, gap: defaultSpacing.md, padding: defaultSpacing.md }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text size="lg" weight="semibold" style={{ color: tc.text.primary, marginBottom: 4 }}>
            Member Seats
          </Text>
          <Text size="sm" style={{ color: tc.text.muted }}>
            {totalCount.toLocaleString()} total &middot; {unclaimedCount.toLocaleString()} unclaimed &middot; {(totalCount - unclaimedCount).toLocaleString()} claimed
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {onFetchUsers && (
            <Pressable
              onPress={onFetchUsers}
              disabled={fetchingUsers}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: pressed ? tc.accent.primary + '20' : tc.background.surface,
                borderWidth: 1,
                borderColor: tc.border.subtle,
                opacity: fetchingUsers ? 0.6 : 1,
              })}
            >
              {fetchingUsers ? (
                <ActivityIndicator size="small" color={tc.accent.primary} />
              ) : (
                <DownloadIcon size={14} color={tc.accent.primary} />
              )}
              <Text size="xs" weight="medium" style={{ color: tc.accent.primary }}>
                {fetchingUsers ? 'Fetching...' : 'Fetch Users'}
              </Text>
            </Pressable>
          )}
          {onRescan && (
            <Pressable
              onPress={onRescan}
              disabled={rescanning}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: pressed ? tc.accent.primary + '20' : tc.background.surface,
                borderWidth: 1,
                borderColor: tc.border.subtle,
                opacity: rescanning ? 0.6 : 1,
              })}
            >
              {rescanning ? (
                <ActivityIndicator size="small" color={tc.accent.primary} />
              ) : (
                <RefreshIcon size={14} color={tc.accent.primary} />
              )}
              <Text size="xs" weight="medium" style={{ color: tc.accent.primary }}>
                {rescanning ? 'Scanning...' : 'Re-scan Members'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Search */}
      <Input
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by username, role, or platform..."
      />

      {/* Filtered count when searching */}
      {searchQuery.trim() && (
        <Text size="xs" style={{ color: tc.text.muted }}>
          {sortedSeats.length.toLocaleString()} result{sortedSeats.length !== 1 ? 's' : ''} found
        </Text>
      )}

      {/* Paginated seat list */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: defaultSpacing.xs }}>
          {pagedSeats.map((seat) => (
            <SeatRow
              key={seat.id}
              seat={seat}
              roleMap={roleMap}
              onDelete={() => handleDelete(seat.id)}
              deleting={deletingId === seat.id}
            />
          ))}
        </View>
      </ScrollView>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: defaultSpacing.md,
            paddingVertical: defaultSpacing.sm,
            borderTopWidth: 1,
            borderTopColor: tc.border.subtle,
          }}
        >
          <Pressable
            onPress={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            style={({ pressed }) => ({
              padding: 8,
              borderRadius: 6,
              backgroundColor: pressed ? tc.background.sunken : 'transparent',
              opacity: currentPage === 0 ? 0.3 : 1,
            })}
          >
            <ChevronLeftIcon size={18} color={tc.text.primary} />
          </Pressable>

          <Text size="sm" style={{ color: tc.text.muted }}>
            Page {currentPage + 1} of {totalPages.toLocaleString()}
          </Text>

          <Pressable
            onPress={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            style={({ pressed }) => ({
              padding: 8,
              borderRadius: 6,
              backgroundColor: pressed ? tc.background.sunken : 'transparent',
              opacity: currentPage >= totalPages - 1 ? 0.3 : 1,
            })}
          >
            <ChevronRightIcon size={18} color={tc.text.primary} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// SeatRow — enriched row with avatar, roles, timestamps
// ---------------------------------------------------------------------------

const SeatRow = React.memo(function SeatRow({
  seat,
  roleMap,
  onDelete,
  deleting,
}: {
  seat: CommunitySeat;
  roleMap: Record<string, CommunityRole>;
  onDelete: () => void;
  deleting: boolean;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const isClaimed = !!seat.claimedByDid;
  const [imgError, setImgError] = useState(false);

  // Get first letter for avatar fallback
  const initial = (seat.nickname || seat.platformUsername || '?').charAt(0).toUpperCase();

  // Resolve roles
  const resolvedRoles = useMemo(() => {
    return seat.roleIds
      .map((id) => roleMap[id])
      .filter((r): r is CommunityRole => r != null)
      .sort((a, b) => b.position - a.position);
  }, [seat.roleIds, roleMap]);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: defaultSpacing.md,
        padding: defaultSpacing.sm,
        paddingHorizontal: defaultSpacing.md,
        backgroundColor: tc.background.surface,
        borderRadius: defaultRadii.md,
        borderWidth: 1,
        borderColor: tc.border.subtle,
      }}
    >
      {/* Avatar */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: tc.background.sunken,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {seat.avatarUrl && !imgError ? (
          <Image
            source={{ uri: seat.avatarUrl }}
            style={{ width: 40, height: 40 }}
            onError={() => setImgError(true)}
          />
        ) : (
          <Text size="sm" weight="bold" style={{ color: tc.text.muted }}>
            {initial}
          </Text>
        )}
      </View>

      {/* Info */}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        {/* Row 1: Name + platform badge + claimed badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.xs, flexWrap: 'wrap' }}>
          <Text size="sm" weight="semibold" style={{ color: tc.text.primary }} numberOfLines={1}>
            {seat.nickname || seat.platformUsername}
          </Text>
          <PlatformBadge platform={seat.platform} />
          {isClaimed && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                backgroundColor: tc.status.success + '20',
                borderRadius: 4,
                paddingHorizontal: 5,
                paddingVertical: 1,
              }}
            >
              <CheckCircleIcon size={10} color={tc.status.success} />
              <Text size="xs" style={{ color: tc.status.success, fontSize: 10, fontWeight: '600' }}>
                Claimed
              </Text>
            </View>
          )}
        </View>

        {/* Row 2: Username + platform ID */}
        <Text size="xs" style={{ color: tc.text.muted }} numberOfLines={1}>
          {seat.nickname ? seat.platformUsername : ''}{seat.nickname ? ' \u00B7 ' : ''}ID: {seat.platformUserId}
        </Text>

        {/* Row 3: Timestamps */}
        <View style={{ flexDirection: 'row', gap: defaultSpacing.sm, marginTop: 1 }}>
          <Text size="xs" style={{ color: tc.text.muted, fontSize: 10 }}>
            Imported {formatTimestamp(seat.createdAt)}
          </Text>
          {isClaimed && seat.claimedAt && (
            <Text size="xs" style={{ color: tc.status.success, fontSize: 10 }}>
              Claimed {formatTimestamp(seat.claimedAt)}
            </Text>
          )}
        </View>

        {/* Row 4: Roles */}
        {resolvedRoles.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {resolvedRoles.map((role) => (
              <View
                key={role.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: role.color ? role.color + '18' : tc.background.sunken,
                  borderRadius: 4,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                {/* Color dot */}
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: role.color || tc.text.muted,
                  }}
                />
                <Text size="xs" style={{ color: role.color || tc.text.muted, fontSize: 10 }}>
                  {role.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Delete button */}
      <Pressable
        onPress={onDelete}
        disabled={deleting}
        style={({ pressed }) => ({
          padding: 6,
          borderRadius: 6,
          backgroundColor: pressed ? tc.status.danger + '20' : 'transparent',
          opacity: deleting ? 0.4 : 1,
          marginTop: 2,
        })}
      >
        {deleting ? (
          <ActivityIndicator size="small" color={tc.status.danger} />
        ) : (
          <TrashIcon size={16} color={tc.text.muted} />
        )}
      </Pressable>
    </View>
  );
});
