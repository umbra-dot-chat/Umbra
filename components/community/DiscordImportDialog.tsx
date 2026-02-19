/**
 * @module DiscordImportDialog
 * @description Main dialog for importing a Discord server structure into Umbra.
 *
 * Handles the complete flow: OAuth authentication, server selection,
 * structure preview, and import confirmation.
 */

import React, { useCallback } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Dialog, Button, Text, useTheme } from '@coexist/wisp-react-native';
import { defaultSpacing, defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';

import { useDiscordCommunityImport, type ImportPhase, type BotStatus } from '../../hooks/useDiscordCommunityImport';
import type {
  DiscordGuildInfo,
  DiscordImportedMember,
  MappedCommunityStructure,
  CommunityImportResult,
} from '@umbra/service';
import { getGuildIconUrl } from '@umbra/service';

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
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: tc.background.sunken,
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

/**
 * A simple toggle switch component for the import dialog.
 */
function ToggleSwitch({
  value,
  onToggle,
  disabled,
}: {
  value: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;

  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        backgroundColor: value ? tc.accent.primary : tc.background.sunken,
        justifyContent: 'center',
        paddingHorizontal: 2,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: '#fff',
          alignSelf: value ? 'flex-end' : 'flex-start',
        }}
      />
    </Pressable>
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
function PreviewScreen({
  structure,
  validationIssues,
  onBack,
  onImport,
  isLoading,
  importedMembers,
  membersAvailable,
  importMembers,
  onToggleMemberImport,
  botStatus,
  onInviteBot,
}: {
  structure: MappedCommunityStructure;
  validationIssues: string[];
  onBack: () => void;
  onImport: () => void;
  isLoading: boolean;
  importedMembers: DiscordImportedMember[] | null;
  membersAvailable: boolean;
  importMembers: boolean;
  onToggleMemberImport: () => void;
  botStatus: BotStatus;
  onInviteBot: () => void;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const hasIssues = validationIssues.length > 0;
  const memberCount = importedMembers?.length ?? 0;

  return (
    <View style={{ gap: defaultSpacing.md }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.md }}>
        <Button variant="tertiary" size="sm" onPress={onBack}>
          Back
        </Button>
        <View style={{ flex: 1 }}>
          <Text size="lg" weight="semibold" style={{ color: tc.text.primary }}>
            {structure.name}
          </Text>
        </View>
      </View>

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
      </View>

      {/* Bot-gate: Enhanced import features */}
      {botStatus === 'in_guild' ? (
        <>
          {/* Bot connected — show feature toggles */}
          {memberCount > 0 && (
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
              <ToggleSwitch value={importMembers} onToggle={onToggleMemberImport} />
            </View>
          )}
          {!membersAvailable && memberCount === 0 && (
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
                Member import requires the Server Members Intent on the bot in the Discord Developer Portal.
              </Text>
            </View>
          )}
        </>
      ) : (
        /* Bot not connected — show connect banner */
        <Pressable
          onPress={botStatus === 'inviting' ? undefined : onInviteBot}
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
            {botStatus === 'inviting' ? (
              <ActivityIndicator size="small" />
            ) : (
              <View
                style={{
                  paddingHorizontal: defaultSpacing.md,
                  paddingVertical: defaultSpacing.xs,
                  backgroundColor: tc.accent.primary,
                  borderRadius: defaultRadii.sm,
                }}
              >
                <Text size="xs" weight="semibold" style={{ color: '#fff' }}>
                  Connect
                </Text>
              </View>
            )}
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
          </View>
        </Pressable>
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
        {importMembers && memberCount > 0
          ? ' Members will be imported as claimable ghost seats.'
          : ' No messages will be imported.'}
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
function CompleteScreen({
  result,
  onClose,
}: {
  result: CommunityImportResult;
  onClose: () => void;
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
              {result.seatsCreated}
            </Text>
            <Text size="xs" style={{ color: tc.text.muted }}>
              Seats
            </Text>
          </View>
        )}
      </View>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <View
          style={{
            width: '100%',
            padding: defaultSpacing.md,
            backgroundColor: tc.status.warning + '15',
            borderRadius: defaultRadii.md,
            gap: defaultSpacing.xs,
          }}
        >
          <Text size="xs" weight="medium" style={{ color: tc.status.warning }}>
            Some items had issues:
          </Text>
          {result.warnings.slice(0, 3).map((warning, i) => (
            <Text key={i} size="xs" style={{ color: tc.text.muted }}>
              • {warning}
            </Text>
          ))}
          {result.warnings.length > 3 && (
            <Text size="xs" style={{ color: tc.text.muted }}>
              ...and {result.warnings.length - 3} more
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
    startAuth,
    refreshGuilds,
    selectGuild,
    backToSelection,
    startImport,
    inviteBot,
    refetchStructure,
    toggleMemberImport,
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
            validationIssues={validationIssues}
            onBack={backToSelection}
            onImport={handleImport}
            isLoading={isLoading}
            importedMembers={importedMembers}
            membersAvailable={membersAvailable}
            importMembers={importMembers}
            onToggleMemberImport={toggleMemberImport}
            botStatus={botStatus}
            onInviteBot={inviteBot}
          />
        ) : null;

      case 'importing':
        return (
          <View style={{ padding: 40, alignItems: 'center', gap: 16 }}>
            <ActivityIndicator size="large" />
            <Text>Creating your community...</Text>
          </View>
        );

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
