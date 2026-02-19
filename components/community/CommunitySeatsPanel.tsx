/**
 * @module CommunitySeatsPanel
 * @description Ghost member seats panel for the CommunitySettingsDialog.
 *
 * Displays imported member seats from platforms like Discord, showing
 * claimed vs unclaimed status. Admins can delete seats.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Input, Button, Text, Tag, useTheme } from '@coexist/wisp-react-native';
import { defaultSpacing, defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';

import type { CommunitySeat, CommunityRole } from '@umbra/service';

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
// Component
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Build role lookup map
  const roleMap = useMemo(() => {
    const map: Record<string, CommunityRole> = {};
    for (const role of roles) {
      map[role.id] = role;
    }
    return map;
  }, [roles]);

  // Filter seats by search query
  const filteredSeats = useMemo(() => {
    if (!searchQuery.trim()) return seats;
    const q = searchQuery.toLowerCase();
    return seats.filter(
      (s) =>
        s.platformUsername.toLowerCase().includes(q) ||
        (s.nickname && s.nickname.toLowerCase().includes(q)) ||
        s.platform.toLowerCase().includes(q)
    );
  }, [seats, searchQuery]);

  // Separate claimed vs unclaimed
  const unclaimedSeats = useMemo(() => filteredSeats.filter((s) => !s.claimedByDid), [filteredSeats]);
  const claimedSeats = useMemo(() => filteredSeats.filter((s) => s.claimedByDid), [filteredSeats]);

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
            {totalCount} total &middot; {unclaimedCount} unclaimed &middot; {totalCount - unclaimedCount} claimed
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
        placeholder="Search by username or platform..."
      />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Unclaimed seats */}
        {unclaimedSeats.length > 0 && (
          <View style={{ gap: defaultSpacing.sm, marginBottom: defaultSpacing.lg }}>
            <Text size="xs" weight="semibold" style={{ color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Unclaimed ({unclaimedSeats.length})
            </Text>
            {unclaimedSeats.map((seat) => (
              <SeatRow
                key={seat.id}
                seat={seat}
                roleMap={roleMap}
                onDelete={() => handleDelete(seat.id)}
                deleting={deletingId === seat.id}
              />
            ))}
          </View>
        )}

        {/* Claimed seats */}
        {claimedSeats.length > 0 && (
          <View style={{ gap: defaultSpacing.sm }}>
            <Text size="xs" weight="semibold" style={{ color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Claimed ({claimedSeats.length})
            </Text>
            {claimedSeats.map((seat) => (
              <SeatRow
                key={seat.id}
                seat={seat}
                roleMap={roleMap}
                onDelete={() => handleDelete(seat.id)}
                deleting={deletingId === seat.id}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SeatRow sub-component
// ---------------------------------------------------------------------------

function SeatRow({
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

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: defaultSpacing.md,
        padding: defaultSpacing.sm,
        paddingHorizontal: defaultSpacing.md,
        backgroundColor: tc.background.surface,
        borderRadius: defaultRadii.md,
        borderWidth: 1,
        borderColor: tc.border.subtle,
        opacity: isClaimed ? 1 : 0.75,
      }}
    >
      {/* Avatar placeholder */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: isClaimed ? tc.accent.primary + '20' : tc.background.sunken,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isClaimed ? (
          <CheckCircleIcon size={18} color={tc.status.success} />
        ) : (
          <GhostIcon size={18} color={tc.text.muted} />
        )}
      </View>

      {/* Info */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.xs }}>
          <Text size="sm" weight="medium" style={{ color: tc.text.primary }} numberOfLines={1}>
            {seat.nickname || seat.platformUsername}
          </Text>
          <PlatformBadge platform={seat.platform} />
        </View>
        <Text size="xs" style={{ color: tc.text.muted }} numberOfLines={1}>
          {seat.platformUsername}
          {isClaimed && seat.claimedByDid && ` \u2014 claimed`}
        </Text>

        {/* Role tags */}
        {seat.roleIds.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {seat.roleIds.slice(0, 5).map((roleId) => {
              const role = roleMap[roleId];
              if (!role) return null;
              return (
                <View
                  key={roleId}
                  style={{
                    backgroundColor: role.color ? role.color + '20' : tc.background.sunken,
                    borderRadius: 4,
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                  }}
                >
                  <Text size="xs" style={{ color: role.color || tc.text.muted, fontSize: 10 }}>
                    {role.name}
                  </Text>
                </View>
              );
            })}
            {seat.roleIds.length > 5 && (
              <Text size="xs" style={{ color: tc.text.muted, fontSize: 10 }}>
                +{seat.roleIds.length - 5} more
              </Text>
            )}
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
}
