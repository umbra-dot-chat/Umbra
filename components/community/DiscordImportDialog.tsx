/**
 * @module DiscordImportDialog
 * @description Main dialog for importing a Discord server structure into Umbra.
 *
 * Handles the complete flow: OAuth authentication, server selection,
 * structure preview, and import confirmation.
 */

import React, { useCallback, useEffect } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Image } from 'react-native';
import { Dialog, Button, Text, Toggle, useTheme } from '@coexist/wisp-react-native';
import { useSound } from '@/contexts/SoundContext';
import { defaultSpacing, defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';

import { useDiscordCommunityImport, type ImportPhase, type BotStatus } from '../../hooks/useDiscordCommunityImport';
import type {
  DiscordGuildInfo,
  DiscordImportedMember,
  MappedCommunityStructure,
  CommunityImportResult,
  CommunityImportProgress,
} from '@umbra/service';
import { getGuildIconUrl, getGuildBannerUrl } from '@umbra/service';

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function DiscordIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </Svg>
  );
}

function TextChannelIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Line x1="5" y1="9" x2="19" y2="9" />
      <Line x1="5" y1="15" x2="19" y2="15" />
      <Line x1="10" y1="4" x2="8" y2="20" />
      <Line x1="16" y1="4" x2="14" y2="20" />
    </Svg>
  );
}

function VoiceChannelIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <Line x1="12" y1="19" x2="12" y2="23" />
      <Line x1="8" y1="23" x2="16" y2="23" />
    </Svg>
  );
}

function FolderIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

function CheckCircleIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Polyline points="9,12 12,15 16,10" />
    </Svg>
  );
}

function AlertCircleIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Line x1="12" y1="8" x2="12" y2="12" />
      <Line x1="12" y1="16" x2="12.01" y2="16" />
    </Svg>
  );
}

function ChevronRightIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="9,18 15,12 9,6" />
    </Svg>
  );
}

function BotIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="11" width="18" height="10" rx="2" />
      <Circle cx="12" cy="5" r="2" />
      <Path d="M12 7v4" />
      <Line x1="8" y1="16" x2="8" y2="16" />
      <Line x1="16" y1="16" x2="16" y2="16" />
    </Svg>
  );
}

function ShieldIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  );
}

function EyeIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

function SmileIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <Line x1="9" y1="9" x2="9.01" y2="9" />
      <Line x1="15" y1="9" x2="15.01" y2="9" />
    </Svg>
  );
}

function ImageIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <Circle cx="8.5" cy="8.5" r="1.5" />
      <Polyline points="21,15 16,10 5,21" />
    </Svg>
  );
}

function HistoryIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 3v5h5" />
      <Path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <Path d="M12 7v5l4 2" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiscordImportDialogProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Called when the dialog should close. */
  onClose: () => void;
  /** Called when import is complete with the community ID. */
  onImportComplete?: (communityId: string) => void;
  /** Function to create the community from the mapped structure. */
  onCreateCommunity: (structure: MappedCommunityStructure) => Promise<CommunityImportResult>;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Initial screen prompting the user to connect Discord.
 */
function AuthScreen({
  onStartAuth,
  isLoading,
  error,
}: {
  onStartAuth: () => void;
  isLoading: boolean;
  error: string | null;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;

  return (
    <View style={{ alignItems: 'center', gap: defaultSpacing.lg, paddingVertical: defaultSpacing.lg }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: '#5865F2',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <DiscordIcon size={36} color="#fff" />
      </View>

      <View style={{ alignItems: 'center', gap: defaultSpacing.sm }}>
        <Text size="lg" weight="semibold" style={{ color: tc.text.primary }}>
          Import from Discord
        </Text>
        <Text size="sm" style={{ color: tc.text.muted, textAlign: 'center' }}>
          Connect your Discord account to import your server's channels and roles.
        </Text>
      </View>

      {error && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: defaultSpacing.sm,
            padding: defaultSpacing.md,
            backgroundColor: tc.status.danger + '15',
            borderRadius: defaultRadii.md,
          }}
        >
          <AlertCircleIcon size={16} color={tc.status.danger} />
          <Text size="sm" style={{ color: tc.status.danger, flex: 1 }}>
            {error}
          </Text>
        </View>
      )}

      <Button
        onPress={onStartAuth}
        disabled={isLoading}
        style={{ minWidth: 200, backgroundColor: '#5865F2' }}
      >
        {isLoading ? 'Connecting...' : 'Connect Discord'}
      </Button>

      <Text size="xs" style={{ color: tc.text.muted, textAlign: 'center' }}>
        Only servers where you have "Manage Server" permission will be shown.
      </Text>
    </View>
  );
}

/**
 * Server selection screen.
 */
function ServerSelectionScreen({
  guilds,
  onSelectGuild,
  onRefresh,
  isLoading,
  error,
}: {
  guilds: DiscordGuildInfo[];
  onSelectGuild: (guild: DiscordGuildInfo) => void;
  onRefresh: () => void;
  isLoading: boolean;
  error: string | null;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;

  return (
    <View style={{ gap: defaultSpacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text size="sm" weight="medium" style={{ color: tc.text.muted }}>
          Select a server to import ({guilds.length} available)
        </Text>
        <Button variant="tertiary" size="sm" onPress={onRefresh} disabled={isLoading}>
          Refresh
        </Button>
      </View>

      {error && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: defaultSpacing.sm,
            padding: defaultSpacing.md,
            backgroundColor: tc.status.danger + '15',
            borderRadius: defaultRadii.md,
          }}
        >
          <AlertCircleIcon size={16} color={tc.status.danger} />
          <Text size="sm" style={{ color: tc.status.danger, flex: 1 }}>
            {error}
          </Text>
        </View>
      )}

      {isLoading ? (
        <View style={{ padding: defaultSpacing.xl, alignItems: 'center' }}>
          <ActivityIndicator color={tc.accent.primary} />
        </View>
      ) : guilds.length === 0 ? (
        <View style={{ padding: defaultSpacing.xl, alignItems: 'center' }}>
          <Text size="sm" style={{ color: tc.text.muted, textAlign: 'center' }}>
            No servers found. Make sure you have "Manage Server" permission in at least one server.
          </Text>
        </View>
      ) : (
        <ScrollView style={{ maxHeight: 300 }}>
          <View style={{ gap: defaultSpacing.xs }}>
            {guilds.map((guild) => (
              <Pressable
                key={guild.id}
                onPress={() => onSelectGuild(guild)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: defaultSpacing.md,
                  padding: defaultSpacing.md,
                  borderRadius: defaultRadii.md,
                  backgroundColor: pressed ? tc.background.sunken : 'transparent',
                })}
              >
                {/* Guild icon */}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#5865F2',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {guild.icon ? (
                    <Image
                      source={{ uri: getGuildIconUrl(guild.id, guild.icon, 128) ?? undefined }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                      }}
                    />
                  ) : (
                    <Text size="md" weight="bold" style={{ color: '#fff' }}>
                      {guild.name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" weight="medium" style={{ color: tc.text.primary }} numberOfLines={1}>
                    {guild.name}
                  </Text>
                  <Text size="xs" style={{ color: tc.text.muted }}>
                    {guild.owner ? 'Owner' : 'Manager'}
                  </Text>
                </View>

                <ChevronRightIcon size={16} color={tc.text.muted} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function UsersIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <Circle cx="9" cy="7" r="4" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

/**
 * Structure preview screen.
 */
function PinIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1="12" y1="17" x2="12" y2="22" />
      <Path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </Svg>
  );
}

function BridgeIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Svg>
  );
}

function PreviewScreen({
  structure,
  selectedGuild,
  validationIssues,
  onBack,
  onImport,
  isLoading,
  importedMembers,
  membersAvailable,
  importMembers,
  onToggleMemberImport,
  importPins,
  onTogglePinImport,
  pinCount,
  pinsAvailable,
  membersLoading,
  pinsLoading,
  importAuditLog,
  onToggleAuditLogImport,
  auditLogCount,
  auditLogAvailable,
  auditLogLoading,
  botStatus,
  onInviteBot,
  enableBridge,
  onToggleBridge,
}: {
  structure: MappedCommunityStructure;
  selectedGuild: DiscordGuildInfo | null;
  validationIssues: string[];
  onBack: () => void;
  onImport: () => void;
  isLoading: boolean;
  importedMembers: DiscordImportedMember[] | null;
  membersAvailable: boolean;
  importMembers: boolean;
  onToggleMemberImport: () => void;
  importPins: boolean;
  onTogglePinImport: () => void;
  pinCount: number;
  pinsAvailable: boolean;
  membersLoading: boolean;
  pinsLoading: boolean;
  importAuditLog: boolean;
  onToggleAuditLogImport: () => void;
  auditLogCount: number;
  auditLogAvailable: boolean;
  auditLogLoading: boolean;
  botStatus: BotStatus;
  onInviteBot: () => void;
  enableBridge: boolean;
  onToggleBridge: () => void;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const hasIssues = validationIssues.length > 0;
  const memberCount = importedMembers?.length ?? 0;
  const emojiCount = structure.emojis?.length ?? 0;
  const bannerUrl = selectedGuild ? getGuildBannerUrl(selectedGuild.id, selectedGuild.banner, 960) : null;
  const iconUrl = selectedGuild ? getGuildIconUrl(selectedGuild.id, selectedGuild.icon, 128) : null;

  // Debug logging for audit log
  console.log('[PreviewScreen] Audit log state:', {
    auditLogCount,
    auditLogAvailable,
    auditLogLoading,
    importAuditLog,
    botStatus,
  });

  return (
    <View style={{ gap: defaultSpacing.md }}>
      {/* Banner and header */}
      {bannerUrl ? (
        <View style={{ marginHorizontal: -defaultSpacing.lg, marginTop: -defaultSpacing.lg }}>
          <Image
            source={{ uri: bannerUrl }}
            style={{
              width: '100%',
              height: 120,
              borderTopLeftRadius: defaultRadii.lg,
              borderTopRightRadius: defaultRadii.lg,
            }}
            resizeMode="cover"
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: defaultSpacing.md,
              paddingHorizontal: defaultSpacing.lg,
              paddingTop: defaultSpacing.sm,
              marginTop: -30,
            }}
          >
            <Button variant="tertiary" size="sm" onPress={onBack}>
              Back
            </Button>
            {iconUrl ? (
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  borderWidth: 3,
                  borderColor: tc.background.base,
                  overflow: 'hidden',
                }}
              >
                <Image
                  source={{ uri: iconUrl }}
                  style={{ width: 42, height: 42 }}
                />
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <Text size="lg" weight="semibold" style={{ color: tc.text.primary }}>
                {structure.name}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.md }}>
          <Button variant="tertiary" size="sm" onPress={onBack}>
            Back
          </Button>
          {iconUrl ? (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                overflow: 'hidden',
              }}
            >
              <Image
                source={{ uri: iconUrl }}
                style={{ width: 40, height: 40 }}
              />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text size="lg" weight="semibold" style={{ color: tc.text.primary }}>
              {structure.name}
            </Text>
          </View>
        </View>
      )}

      {/* Validation issues */}
      {hasIssues && (
        <View
          style={{
            padding: defaultSpacing.md,
            backgroundColor: tc.status.warning + '15',
            borderRadius: defaultRadii.md,
            gap: defaultSpacing.sm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.sm }}>
            <AlertCircleIcon size={16} color={tc.status.warning} />
            <Text size="sm" weight="medium" style={{ color: tc.status.warning }}>
              Some items may not import correctly:
            </Text>
          </View>
          {validationIssues.map((issue, i) => (
            <Text key={i} size="xs" style={{ color: tc.text.muted, paddingLeft: 24 }}>
              • {issue}
            </Text>
          ))}
        </View>
      )}

      {/* Summary */}
      <View style={{ flexDirection: 'row', gap: defaultSpacing.sm, flexWrap: 'wrap' }}>
        <View
          style={{
            flex: 1,
            minWidth: 70,
            padding: defaultSpacing.md,
            backgroundColor: tc.background.sunken,
            borderRadius: defaultRadii.md,
            alignItems: 'center',
          }}
        >
          <Text size="xl" weight="bold" style={{ color: tc.accent.primary }}>
            {structure.categories.length}
          </Text>
          <Text size="xs" style={{ color: tc.text.muted }}>
            Categories
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            minWidth: 70,
            padding: defaultSpacing.md,
            backgroundColor: tc.background.sunken,
            borderRadius: defaultRadii.md,
            alignItems: 'center',
          }}
        >
          <Text size="xl" weight="bold" style={{ color: tc.accent.primary }}>
            {structure.channels.length}
          </Text>
          <Text size="xs" style={{ color: tc.text.muted }}>
            Channels
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            minWidth: 70,
            padding: defaultSpacing.md,
            backgroundColor: tc.background.sunken,
            borderRadius: defaultRadii.md,
            alignItems: 'center',
          }}
        >
          <Text size="xl" weight="bold" style={{ color: tc.accent.primary }}>
            {structure.roles.length}
          </Text>
          <Text size="xs" style={{ color: tc.text.muted }}>
            Roles
          </Text>
        </View>
        {memberCount > 0 && (
          <View
            style={{
              flex: 1,
              minWidth: 70,
              padding: defaultSpacing.md,
              backgroundColor: tc.background.sunken,
              borderRadius: defaultRadii.md,
              alignItems: 'center',
            }}
          >
            <Text size="xl" weight="bold" style={{ color: tc.accent.primary }}>
              {memberCount}
            </Text>
            <Text size="xs" style={{ color: tc.text.muted }}>
              Members
            </Text>
          </View>
        )}
        {emojiCount > 0 && (
          <View
            style={{
              flex: 1,
              minWidth: 70,
              padding: defaultSpacing.md,
              backgroundColor: tc.background.sunken,
              borderRadius: defaultRadii.md,
              alignItems: 'center',
            }}
          >
            <Text size="xl" weight="bold" style={{ color: tc.accent.primary }}>
              {emojiCount}
            </Text>
            <Text size="xs" style={{ color: tc.text.muted }}>
              Emojis
            </Text>
          </View>
        )}
      </View>

      {/* Bot-gate: Enhanced import features */}
      {botStatus === 'in_guild' ? (
        <>
          {/* Bot connected — show feature toggles */}
          {membersLoading ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: defaultSpacing.md,
                padding: defaultSpacing.md,
                backgroundColor: tc.background.sunken,
                borderRadius: defaultRadii.md,
              }}
            >
              <ActivityIndicator size="small" color={tc.text.muted} />
              <View style={{ flex: 1 }}>
                <Text size="sm" weight="medium" style={{ color: tc.text.primary }}>
                  Fetching members...
                </Text>
                <Text size="xs" style={{ color: tc.text.muted }}>
                  This may take a moment for large servers
                </Text>
              </View>
            </View>
          ) : memberCount > 0 ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: defaultSpacing.md,
                padding: defaultSpacing.md,
                backgroundColor: tc.background.sunken,
                borderRadius: defaultRadii.md,
              }}
            >
              <UsersIcon size={18} color={tc.text.muted} />
              <View style={{ flex: 1 }}>
                <Text size="sm" weight="medium" style={{ color: tc.text.primary }}>
                  Import member seats
                </Text>
                <Text size="xs" style={{ color: tc.text.muted }}>
                  {memberCount.toLocaleString()} members as claimable ghost seats
                </Text>
              </View>
              <Toggle checked={importMembers} onChange={() => onToggleMemberImport()} size="sm" />
            </View>
          ) : !membersAvailable && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: defaultSpacing.sm,
                paddingHorizontal: defaultSpacing.md,
                paddingVertical: defaultSpacing.sm,
              }}
            >
              <UsersIcon size={14} color={tc.text.muted} />
              <Text size="xs" style={{ color: tc.text.muted, flex: 1 }}>
                Unable to fetch members. Ensure the Server Members Intent is enabled in the Discord Developer Portal and the bot has been re-added to the server after enabling it.
              </Text>
            </View>
          )}

          {/* Pin import toggle */}
          {pinsLoading ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: defaultSpacing.md,
                padding: defaultSpacing.md,
                backgroundColor: tc.background.sunken,
                borderRadius: defaultRadii.md,
              }}
            >
              <ActivityIndicator size="small" color={tc.text.muted} />
              <View style={{ flex: 1 }}>
                <Text size="sm" weight="medium" style={{ color: tc.text.primary }}>
                  Fetching pinned messages...
                </Text>
                <Text size="xs" style={{ color: tc.text.muted }}>
                  Scanning channels for pins
                </Text>
              </View>
            </View>
          ) : pinCount > 0 ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: defaultSpacing.md,
                padding: defaultSpacing.md,
                backgroundColor: tc.background.sunken,
                borderRadius: defaultRadii.md,
              }}
            >
              <PinIcon size={18} color={tc.text.muted} />
              <View style={{ flex: 1 }}>
                <Text size="sm" weight="medium" style={{ color: tc.text.primary }}>
                  Import pinned messages
                </Text>
                <Text size="xs" style={{ color: tc.text.muted }}>
                  {pinCount.toLocaleString()} pinned message{pinCount !== 1 ? 's' : ''} across channels
                </Text>
              </View>
              <Toggle checked={importPins} onChange={() => onTogglePinImport()} size="sm" />
            </View>
          ) : null}

          {/* Audit log toggle */}
          {auditLogLoading ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: defaultSpacing.md,
                padding: defaultSpacing.md,
                backgroundColor: tc.background.sunken,
                borderRadius: defaultRadii.md,
              }}
            >
              <ActivityIndicator size="small" color={tc.text.muted} />
              <View style={{ flex: 1 }}>
                <Text size="sm" weight="medium" style={{ color: tc.text.primary }}>
                  Fetching audit log...
                </Text>
                <Text size="xs" style={{ color: tc.text.muted }}>
                  Loading server moderation history
                </Text>
              </View>
            </View>
          ) : auditLogCount > 0 ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: defaultSpacing.md,
                padding: defaultSpacing.md,
                backgroundColor: tc.background.sunken,
                borderRadius: defaultRadii.md,
              }}
            >
              <HistoryIcon size={18} color={tc.text.muted} />
              <View style={{ flex: 1 }}>
                <Text size="sm" weight="medium" style={{ color: tc.text.primary }}>
                  Import audit log
                </Text>
                <Text size="xs" style={{ color: tc.text.muted }}>
                  {auditLogCount.toLocaleString()} moderation action{auditLogCount !== 1 ? 's' : ''}
                </Text>
              </View>
              <Toggle checked={importAuditLog} onChange={() => onToggleAuditLogImport()} size="sm" />
            </View>
          ) : !auditLogAvailable && !auditLogLoading ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: defaultSpacing.sm,
                paddingHorizontal: defaultSpacing.md,
                paddingVertical: defaultSpacing.sm,
              }}
            >
              <HistoryIcon size={14} color={tc.text.muted} />
              <Text size="xs" style={{ color: tc.text.muted, flex: 1 }}>
                No audit log entries found or unable to fetch audit log.
              </Text>
            </View>
          ) : null}

          {/* Bridge toggle — always shown when bot is connected */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: defaultSpacing.md,
              padding: defaultSpacing.md,
              backgroundColor: tc.background.sunken,
              borderRadius: defaultRadii.md,
            }}
          >
            <BridgeIcon size={18} color={tc.text.muted} />
            <View style={{ flex: 1 }}>
              <Text size="sm" weight="medium" style={{ color: tc.text.primary }}>
                Enable Discord Bridge
              </Text>
              <Text size="xs" style={{ color: tc.text.muted }}>
                Keep messages synced between Discord and Umbra in real-time
              </Text>
            </View>
            <Toggle checked={enableBridge} onChange={() => onToggleBridge()} size="sm" />
          </View>
        </>
      ) : (
        /* Bot not connected — show connect banner */
        <View
          style={{
            padding: defaultSpacing.md,
            backgroundColor: tc.accent.primary + '10',
            borderRadius: defaultRadii.md,
            borderWidth: 1,
            borderColor: tc.accent.primary + '30',
            gap: defaultSpacing.sm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.sm }}>
            <BotIcon size={18} color={tc.accent.primary} />
            <View style={{ flex: 1 }}>
              <Text size="sm" weight="semibold" style={{ color: tc.text.primary }}>
                Connect Bot for Enhanced Import
              </Text>
              <Text size="xs" style={{ color: tc.text.muted }}>
                Unlock additional import features
              </Text>
            </View>
            <Button size="xs" onPress={onInviteBot} isLoading={botStatus === 'inviting'}>
              Connect
            </Button>
          </View>
          <View style={{ gap: 4, paddingLeft: 26 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.xs }}>
              <UsersIcon size={12} color={tc.text.muted} />
              <Text size="xs" style={{ color: tc.text.muted }}>
                Member seats — import members as claimable ghost seats
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.xs }}>
              <ShieldIcon size={12} color={tc.text.muted} />
              <Text size="xs" style={{ color: tc.text.muted }}>
                Full permissions — import role permission settings
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.xs }}>
              <PinIcon size={12} color={tc.text.muted} />
              <Text size="xs" style={{ color: tc.text.muted }}>
                Pinned messages — import pinned messages from channels
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.xs }}>
              <HistoryIcon size={12} color={tc.text.muted} />
              <Text size="xs" style={{ color: tc.text.muted }}>
                Audit log — import moderation history with user seats
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Channel preview */}
      <View style={{ gap: defaultSpacing.sm }}>
        <Text size="sm" weight="medium" style={{ color: tc.text.muted }}>
          Channel Structure
        </Text>
        <ScrollView style={{ maxHeight: 200 }}>
          <View style={{ gap: 2 }}>
            {/* Categories with their channels */}
            {structure.categories.map((category) => (
              <View key={category.discordId}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: defaultSpacing.xs,
                    paddingVertical: 4,
                  }}
                >
                  <FolderIcon size={14} color={tc.text.muted} />
                  <Text size="xs" weight="semibold" style={{ color: tc.text.muted, textTransform: 'uppercase' }}>
                    {category.name}
                  </Text>
                </View>
                {structure.channels
                  .filter((ch) => ch.categoryDiscordId === category.discordId)
                  .map((channel) => (
                    <View
                      key={channel.discordId}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: defaultSpacing.xs,
                        paddingLeft: defaultSpacing.lg,
                        paddingVertical: 2,
                      }}
                    >
                      {channel.type === 'voice' ? (
                        <VoiceChannelIcon size={14} color={tc.text.muted} />
                      ) : (
                        <TextChannelIcon size={14} color={tc.text.muted} />
                      )}
                      <Text size="sm" style={{ color: tc.text.primary }}>
                        {channel.name}
                      </Text>
                    </View>
                  ))}
              </View>
            ))}

            {/* Uncategorized channels */}
            {structure.channels.filter((ch) => !ch.categoryDiscordId).length > 0 && (
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: defaultSpacing.xs,
                    paddingVertical: 4,
                  }}
                >
                  <Text size="xs" weight="semibold" style={{ color: tc.text.muted, textTransform: 'uppercase' }}>
                    Uncategorized
                  </Text>
                </View>
                {structure.channels
                  .filter((ch) => !ch.categoryDiscordId)
                  .map((channel) => (
                    <View
                      key={channel.discordId}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: defaultSpacing.xs,
                        paddingLeft: defaultSpacing.lg,
                        paddingVertical: 2,
                      }}
                    >
                      {channel.type === 'voice' ? (
                        <VoiceChannelIcon size={14} color={tc.text.muted} />
                      ) : (
                        <TextChannelIcon size={14} color={tc.text.muted} />
                      )}
                      <Text size="sm" style={{ color: tc.text.primary }}>
                        {channel.name}
                      </Text>
                    </View>
                  ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Import button */}
      <Button onPress={onImport} disabled={isLoading}>
        {isLoading ? 'Importing...' : 'Import Community'}
      </Button>

      <Text size="xs" style={{ color: tc.text.muted, textAlign: 'center' }}>
        This will create a new Umbra community with the same structure.
        {importMembers && memberCount > 0 ? ' Members will be imported as claimable ghost seats.' : ''}
        {importPins && pinCount > 0 ? ` ${pinCount.toLocaleString()} pinned messages will be imported.` : ''}
      </Text>
    </View>
  );
}

/**
 * Bot invite screen — shown when the structure is empty because the bot isn't in the guild.
 */
function BotInviteScreen({
  guild,
  botStatus,
  onInviteBot,
  onBack,
  onSkip,
  isLoading,
  error,
}: {
  guild: DiscordGuildInfo;
  botStatus: BotStatus;
  onInviteBot: () => void;
  onBack: () => void;
  onSkip: () => void;
  isLoading: boolean;
  error: string | null;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const isInviting = botStatus === 'inviting';

  return (
    <View style={{ gap: defaultSpacing.md }}>
      {/* Header with back button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.md }}>
        <Button variant="tertiary" size="sm" onPress={onBack} disabled={isInviting}>
          Back
        </Button>
        <View style={{ flex: 1 }}>
          <Text size="lg" weight="semibold" style={{ color: tc.text.primary }} numberOfLines={1}>
            {guild.name}
          </Text>
        </View>
      </View>

      {/* Bot icon + explanation */}
      <View style={{ alignItems: 'center', gap: defaultSpacing.md, paddingVertical: defaultSpacing.md }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#5865F2' + '20',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BotIcon size={28} color="#5865F2" />
        </View>

        <View style={{ alignItems: 'center', gap: defaultSpacing.xs }}>
          <Text size="md" weight="semibold" style={{ color: tc.text.primary, textAlign: 'center' }}>
            Connect Umbra Bot
          </Text>
          <Text size="sm" style={{ color: tc.text.muted, textAlign: 'center', maxWidth: 320 }}>
            To read your server's channels and roles, Umbra's bot needs temporary access to your server.
          </Text>
        </View>
      </View>

      {/* Permission badge */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: defaultSpacing.sm,
          padding: defaultSpacing.md,
          backgroundColor: tc.status.success + '10',
          borderRadius: defaultRadii.md,
          borderWidth: 1,
          borderColor: tc.status.success + '30',
        }}
      >
        <ShieldIcon size={18} color={tc.status.success} />
        <View style={{ flex: 1 }}>
          <Text size="sm" weight="medium" style={{ color: tc.text.primary }}>
            Minimal permissions
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.xs, marginTop: 2 }}>
            <EyeIcon size={12} color={tc.text.muted} />
            <Text size="xs" style={{ color: tc.text.muted }}>
              View Channels — read-only access to channel list and roles
            </Text>
          </View>
        </View>
      </View>

      {/* Error */}
      {error && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: defaultSpacing.sm,
            padding: defaultSpacing.md,
            backgroundColor: tc.status.danger + '15',
            borderRadius: defaultRadii.md,
          }}
        >
          <AlertCircleIcon size={16} color={tc.status.danger} />
          <Text size="sm" style={{ color: tc.status.danger, flex: 1 }}>
            {error}
          </Text>
        </View>
      )}

      {/* Invite button or waiting state */}
      {isInviting || isLoading ? (
        <View style={{ alignItems: 'center', gap: defaultSpacing.md, paddingVertical: defaultSpacing.md }}>
          <ActivityIndicator color="#5865F2" />
          <Text size="sm" style={{ color: tc.text.muted }}>
            {isLoading ? 'Loading server structure...' : 'Waiting for bot to join...'}
          </Text>
          <Text size="xs" style={{ color: tc.text.muted, textAlign: 'center' }}>
            Complete the authorization in the popup window, then we'll automatically load your server's structure.
          </Text>
        </View>
      ) : (
        <View style={{ gap: defaultSpacing.sm }}>
          <Button
            onPress={onInviteBot}
            style={{ backgroundColor: '#5865F2' }}
          >
            Add Umbra Bot to {guild.name}
          </Button>
          <Button variant="tertiary" size="sm" onPress={onSkip}>
            Skip — continue without bot
          </Button>
        </View>
      )}
    </View>
  );
}

/**
 * Import complete screen.
 */
// ---------------------------------------------------------------------------
// ImportingScreen — shows live progress during community import
// ---------------------------------------------------------------------------

const PHASE_LABELS: Record<string, string> = {
  creating_community: 'Creating community…',
  creating_categories: 'Creating categories…',
  creating_channels: 'Creating channels…',
  creating_roles: 'Creating roles…',
  creating_seats: 'Importing members…',
  importing_pins: 'Importing pinned messages…',
  importing_audit_log: 'Importing audit log…',
  complete: 'Finishing up…',
};

function ImportingScreen({ progress }: { progress: CommunityImportProgress | null }) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const label = progress ? (PHASE_LABELS[progress.phase] || 'Working…') : 'Starting import…';
  const pct = progress?.percent ?? 0;
  const detail = progress?.currentItem ?? null;

  return (
    <View style={{ padding: 40, alignItems: 'center', gap: 20 }}>
      <ActivityIndicator size="large" color={tc.accent.primary} />

      <Text size="lg" weight="semibold" style={{ color: tc.text.primary }}>
        {label}
      </Text>

      {/* Progress bar */}
      <View
        style={{
          width: '100%',
          maxWidth: 320,
          height: 6,
          borderRadius: 3,
          backgroundColor: tc.background.sunken,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${Math.max(pct, 2)}%`,
            height: '100%',
            borderRadius: 3,
            backgroundColor: tc.accent.primary,
          }}
        />
      </View>

      {/* Detail text (e.g. "1,250 / 9,900 members") */}
      <Text size="sm" style={{ color: tc.text.muted }}>
        {detail || `${pct}%`}
      </Text>

      {/* Item counts when available */}
      {progress?.totalItems != null && progress.completedItems != null && (
        <Text size="xs" style={{ color: tc.text.muted }}>
          {progress.completedItems.toLocaleString()} / {progress.totalItems.toLocaleString()}
        </Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// CompleteScreen
// ---------------------------------------------------------------------------

function CompleteScreen({
  result,
  onClose,
}: {
  result: CommunityImportResult;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const { playSound } = useSound();

  // Play success sound on mount
  useEffect(() => {
    playSound(result.warnings.length > 0 ? 'notification' : 'success');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{ alignItems: 'center', gap: defaultSpacing.lg, paddingVertical: defaultSpacing.lg }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: tc.status.success + '20',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CheckCircleIcon size={36} color={tc.status.success} />
      </View>

      <View style={{ alignItems: 'center', gap: defaultSpacing.sm }}>
        <Text size="lg" weight="semibold" style={{ color: tc.text.primary }}>
          Import Complete!
        </Text>
        <Text size="sm" style={{ color: tc.text.muted, textAlign: 'center' }}>
          Your community has been created successfully.
        </Text>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: defaultSpacing.md, flexWrap: 'wrap', justifyContent: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          <Text size="xl" weight="bold" style={{ color: tc.accent.primary }}>
            {result.categoriesCreated}
          </Text>
          <Text size="xs" style={{ color: tc.text.muted }}>
            Categories
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text size="xl" weight="bold" style={{ color: tc.accent.primary }}>
            {result.channelsCreated}
          </Text>
          <Text size="xs" style={{ color: tc.text.muted }}>
            Channels
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text size="xl" weight="bold" style={{ color: tc.accent.primary }}>
            {result.rolesCreated}
          </Text>
          <Text size="xs" style={{ color: tc.text.muted }}>
            Roles
          </Text>
        </View>
        {result.seatsCreated > 0 && (
          <View style={{ alignItems: 'center' }}>
            <Text size="xl" weight="bold" style={{ color: tc.accent.primary }}>
              {result.seatsCreated.toLocaleString()}
            </Text>
            <Text size="xs" style={{ color: tc.text.muted }}>
              Seats
            </Text>
          </View>
        )}
        {result.pinsImported > 0 && (
          <View style={{ alignItems: 'center' }}>
            <Text size="xl" weight="bold" style={{ color: tc.accent.primary }}>
              {result.pinsImported.toLocaleString()}
            </Text>
            <Text size="xs" style={{ color: tc.text.muted }}>
              Pins
            </Text>
          </View>
        )}
        {result.auditLogImported > 0 && (
          <View style={{ alignItems: 'center' }}>
            <Text size="xl" weight="bold" style={{ color: tc.accent.primary }}>
              {result.auditLogImported.toLocaleString()}
            </Text>
            <Text size="xs" style={{ color: tc.text.muted }}>
              Audit Log
            </Text>
          </View>
        )}
      </View>

      {/* Warnings — compact, truncated to avoid overwhelming the screen */}
      {result.warnings.length > 0 && (
        <View
          style={{
            width: '100%',
            padding: defaultSpacing.sm,
            backgroundColor: tc.status.warning + '10',
            borderRadius: defaultRadii.md,
            gap: 2,
          }}
        >
          <Text size="xs" weight="medium" style={{ color: tc.status.warning }}>
            {result.warnings.length} warning{result.warnings.length > 1 ? 's' : ''} during import
          </Text>
          {result.warnings.slice(0, 2).map((warning, i) => {
            // Truncate long error messages (e.g. stack traces) to first line
            const short = warning.split('\n')[0].slice(0, 120);
            return (
              <Text key={i} size="xs" style={{ color: tc.text.muted }} numberOfLines={1}>
                • {short}{warning.length > 120 ? '…' : ''}
              </Text>
            );
          })}
          {result.warnings.length > 2 && (
            <Text size="xs" style={{ color: tc.text.muted }}>
              +{result.warnings.length - 2} more
            </Text>
          )}
        </View>
      )}

      <Button onPress={onClose} style={{ minWidth: 150 }}>
        Done
      </Button>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DiscordImportDialog({
  open,
  onClose,
  onImportComplete,
  onCreateCommunity,
}: DiscordImportDialogProps) {
  const {
    phase,
    guilds,
    selectedGuild,
    mappedStructure,
    validationIssues,
    result,
    error,
    isLoading,
    botStatus,
    importedMembers,
    membersAvailable,
    importMembers,
    importPins,
    pinnedMessages,
    pinsAvailable,
    pinCount,
    membersLoading,
    pinsLoading,
    importAuditLog,
    auditLogEntries,
    auditLogAvailable,
    auditLogLoading,
    auditLogCount,
    progress,
    startAuth,
    refreshGuilds,
    selectGuild,
    backToSelection,
    startImport,
    inviteBot,
    refetchStructure,
    toggleMemberImport,
    togglePinImport,
    toggleAuditLogImport,
    toggleBridge,
    enableBridge,
    reset,
  } = useDiscordCommunityImport();

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleImport = useCallback(async () => {
    await startImport(onCreateCommunity);
  }, [startImport, onCreateCommunity]);

  const handleComplete = useCallback(() => {
    if (result?.communityId) {
      onImportComplete?.(result.communityId);
    }
    handleClose();
  }, [result, onImportComplete, handleClose]);

  // Determine dialog title based on phase
  const getTitle = () => {
    switch (phase) {
      case 'idle':
      case 'authenticating':
        return 'Import from Discord';
      case 'selecting_server':
        return 'Select Server';
      case 'loading_structure':
        return 'Loading Structure...';
      case 'needs_bot':
        return 'Connect Bot';
      case 'previewing':
        return 'Preview Import';
      case 'importing':
        return 'Importing...';
      case 'complete':
        return 'Import Complete';
      case 'error':
        return 'Import Error';
      default:
        return 'Import from Discord';
    }
  };

  // Render content based on phase
  const renderContent = () => {
    switch (phase) {
      case 'idle':
      case 'authenticating':
        return <AuthScreen onStartAuth={startAuth} isLoading={isLoading} error={error} />;

      case 'selecting_server':
        return (
          <ServerSelectionScreen
            guilds={guilds}
            onSelectGuild={selectGuild}
            onRefresh={refreshGuilds}
            isLoading={isLoading}
            error={error}
          />
        );

      case 'loading_structure':
        return (
          <View style={{ padding: 40, alignItems: 'center', gap: 16 }}>
            <ActivityIndicator size="large" />
            <Text>Loading server structure...</Text>
          </View>
        );

      case 'needs_bot':
        return selectedGuild ? (
          <BotInviteScreen
            guild={selectedGuild}
            botStatus={botStatus}
            onInviteBot={inviteBot}
            onBack={backToSelection}
            onSkip={() => {
              // Skip bot invite — go to preview with whatever structure we have (likely 0s)
              refetchStructure();
            }}
            isLoading={isLoading}
            error={error}
          />
        ) : null;

      case 'previewing':
        return mappedStructure ? (
          <PreviewScreen
            structure={mappedStructure}
            selectedGuild={selectedGuild}
            validationIssues={validationIssues}
            onBack={backToSelection}
            onImport={handleImport}
            isLoading={isLoading}
            importedMembers={importedMembers}
            membersAvailable={membersAvailable}
            importMembers={importMembers}
            onToggleMemberImport={toggleMemberImport}
            importPins={importPins}
            onTogglePinImport={togglePinImport}
            pinCount={pinCount}
            pinsAvailable={pinsAvailable}
            membersLoading={membersLoading}
            pinsLoading={pinsLoading}
            importAuditLog={importAuditLog}
            onToggleAuditLogImport={toggleAuditLogImport}
            auditLogCount={auditLogCount}
            auditLogAvailable={auditLogAvailable}
            auditLogLoading={auditLogLoading}
            botStatus={botStatus}
            onInviteBot={inviteBot}
            enableBridge={enableBridge}
            onToggleBridge={toggleBridge}
          />
        ) : null;

      case 'importing':
        return <ImportingScreen progress={progress} />;

      case 'complete':
        return result ? <CompleteScreen result={result} onClose={handleComplete} /> : null;

      case 'error':
        return (
          <AuthScreen
            onStartAuth={startAuth}
            isLoading={isLoading}
            error={error || 'An error occurred'}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={getTitle()}
      size="md"
    >
      {renderContent()}
    </Dialog>
  );
}
