import { CheckIcon, PlusIcon, UsersIcon, XIcon } from '@/components/ui';
import {
  Avatar, AvatarGroup, Box, Button,
  ConversationListItem,
  GradientText,
  SidebarSection,
  Skeleton,
  Text,
  useTheme,
} from '@coexist/wisp-react-native';
import type { PendingGroupInvite } from '@umbra/service';
import type { ActiveCall } from '@/types/call';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { NewChatMenu } from './NewChatMenu';
import { SidebarShell, useSidebarShellLayout } from './SidebarShell';
import { SlotRenderer } from '@/components/plugins/SlotRenderer';
import { TEST_IDS } from '@/constants/test-ids';
import { dbg } from '@/utils/debug';

export interface ChatSidebarProps {
  conversations: { id: string; name: string; last: string; time: string; unread: number; online?: boolean; pinned?: boolean; status?: string; group?: string[]; isGroup?: boolean; avatar?: string }[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewDm?: () => void;
  onCreateGroup?: () => void;
  /** Pending group invites to display above conversations */
  pendingInvites?: PendingGroupInvite[];
  /** Accept a group invite */
  onAcceptInvite?: (inviteId: string) => void;
  /** Decline a group invite */
  onDeclineInvite?: (inviteId: string) => void;
  /** Whether conversations are still loading */
  loading?: boolean;
  /** Called when the Friends / Add User button is pressed (passed through to SidebarShell) */
  onFriendsPress?: () => void;
  /** Number of pending friend requests for badge display (passed through to SidebarShell) */
  pendingFriendRequests?: number;
  /** Active call to show in the sidebar footer panel */
  activeCall?: ActiveCall | null;
  /** Navigate back to the active call conversation */
  onReturnToCall?: () => void;
  /** Toggle microphone mute */
  onToggleMute?: () => void;
  /** Toggle deafen (mute mic + mute incoming audio) */
  onToggleDeafen?: () => void;
  /** Toggle camera on/off */
  onToggleCamera?: () => void;
  /** End the active call */
  onEndCall?: () => void;
  /** Whether the local user is screen sharing */
  isScreenSharing?: boolean;
  /** Toggle screen sharing on/off */
  onToggleScreenShare?: () => void;
  /** Whether the notifications panel should be shown instead of the conversation list */
  showNotificationsPanel?: boolean;
  /** Called when the notifications panel is closed */
  onCloseNotificationsPanel?: () => void;
  /** Whether the account panel should be shown */
  showAccountPanel?: boolean;
  /** Called when the account panel is closed */
  onCloseAccountPanel?: () => void;
  /** Account panel props */
  accountPanelProps?: {
    accounts: import('@/contexts/AuthContext').StoredAccount[];
    activeAccountDid: string | null;
    onSwitchAccount: (did: string) => void;
    onActiveAccountPress: () => void;
    onAddAccount: () => void;
    onRemoveAccount?: (did: string) => void;
  };
}

export function ChatSidebar(props: ChatSidebarProps) {
  if (__DEV__) dbg.trackRender('ChatSidebar');
  return <ChatSidebarInner {...props} />;
}

function ChatSidebarInner({
  conversations,
  activeId, onSelectConversation,
  onNewDm, onCreateGroup,
  pendingInvites, onAcceptInvite, onDeclineInvite, loading,
  onFriendsPress, pendingFriendRequests,
  activeCall, onReturnToCall, onToggleMute, onToggleDeafen, onToggleCamera, onEndCall,
  isScreenSharing, onToggleScreenShare,
  showNotificationsPanel, onCloseNotificationsPanel,
  showAccountPanel, onCloseAccountPanel, accountPanelProps,
}: ChatSidebarProps) {
  const { t } = useTranslation('sidebar');
  const shellProps = {
    showNotificationsPanel,
    onCloseNotificationsPanel,
    showAccountPanel,
    onCloseAccountPanel,
    accountPanelProps,
    onFriendsPress,
    pendingFriendRequests,
    activeCall,
    activeConversationId: activeId,
    onReturnToCall,
    onToggleMute,
    onToggleDeafen,
    onToggleCamera,
    onEndCall,
    isScreenSharing,
    onToggleScreenShare,
  };

  return (
    <SidebarShell searchPlaceholder={t('searchConversations')} {...shellProps}>
      <ChatSidebarContent
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={onSelectConversation}
        onNewDm={onNewDm}
        onCreateGroup={onCreateGroup}
        pendingInvites={pendingInvites}
        onAcceptInvite={onAcceptInvite}
        onDeclineInvite={onDeclineInvite}
        loading={loading}
      />
    </SidebarShell>
  );
}

// ─── Chat-specific sidebar content ──────────────────────────────────────────

interface ChatSidebarContentProps {
  conversations: ChatSidebarProps['conversations'];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewDm?: () => void;
  onCreateGroup?: () => void;
  pendingInvites?: PendingGroupInvite[];
  onAcceptInvite?: (inviteId: string) => void;
  onDeclineInvite?: (inviteId: string) => void;
  loading?: boolean;
}

/** Format a timestamp as a relative time string (e.g., "2h ago") */
function formatRelativeTime(timestamp: number, tc: (key: string, opts?: Record<string, unknown>) => string): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return tc('justNow');
  if (diffMins < 60) return tc('minutesAgo', { count: diffMins });
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return tc('hoursAgo', { count: diffHours });
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return tc('daysAgo', { count: diffDays });
  return new Date(timestamp).toLocaleDateString();
}

/** Parse membersJson to get member count */
function getMemberCount(membersJson: string): number {
  try {
    const parsed = JSON.parse(membersJson);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function ChatSidebarContent({
  conversations,
  activeId,
  onSelectConversation,
  onNewDm,
  onCreateGroup,
  pendingInvites,
  onAcceptInvite,
  onDeclineInvite,
  loading,
}: ChatSidebarContentProps) {
  const { theme } = useTheme();
  const { t } = useTranslation('sidebar');
  const { t: tc } = useTranslation('common');
  const { hasBottomPanel, contentFlex } = useSidebarShellLayout();
  const [menuOpen, setMenuOpen] = useState(false);
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);

  const handleAccept = useCallback(async (inviteId: string) => {
    setProcessingInviteId(inviteId);
    try {
      await onAcceptInvite?.(inviteId);
    } finally {
      setProcessingInviteId(null);
    }
  }, [onAcceptInvite]);

  const handleDecline = useCallback(async (inviteId: string) => {
    setProcessingInviteId(inviteId);
    try {
      await onDeclineInvite?.(inviteId);
    } finally {
      setProcessingInviteId(null);
    }
  }, [onDeclineInvite]);

  // Track unread counts to trigger shimmer on new messages
  const prevUnreadsRef = useRef<Record<string, number>>({});
  const [shimmerCounters, setShimmerCounters] = useState<Record<string, number>>({});

  // Detect unread count increases and bump shimmer counter
  const currentUnreads: Record<string, number> = {};
  for (const c of conversations) {
    currentUnreads[c.id] = c.unread;
    const prev = prevUnreadsRef.current[c.id] ?? 0;
    if (c.unread > prev && prev >= 0) {
      // Will trigger shimmer for this conversation
      const id = c.id;
      if (!shimmerCounters[id] || shimmerCounters[id] < c.unread) {
        // Use queueMicrotask to avoid setState during render
        queueMicrotask(() => {
          setShimmerCounters((sc) => ({ ...sc, [id]: (sc[id] ?? 0) + 1 }));
        });
      }
    }
  }
  prevUnreadsRef.current = currentUnreads;

  const handleToggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  return (
    <>
      {/* Group Invites Section -- only shown when there are pending invites */}
      {pendingInvites && pendingInvites.length > 0 && (
        <SidebarSection title={t('groupInvites', { count: pendingInvites.length })}>
          <Box style={{ marginHorizontal: 6, gap: 6, marginBottom: 4 }}>
            {pendingInvites.map((invite) => (
              <Box
                key={invite.id}
                style={{
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.colors.border.strong,
                  backgroundColor: theme.colors.background.sunken,
                  padding: 10,
                }}
              >
                <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <UsersIcon size={14} color={theme.colors.text.onRaisedSecondary} />
                  <Box style={{ flex: 1 }}>
                    <Text size="xs" weight="semibold" style={{ color: theme.colors.text.onRaised }} numberOfLines={1}>
                      {invite.groupName}
                    </Text>
                    <Text size="xs" style={{ color: theme.colors.text.onRaisedSecondary }} numberOfLines={1}>
                      {t('from', { name: invite.inviterName })}
                    </Text>
                  </Box>
                  <Text size="xs" style={{ color: theme.colors.text.muted }}>
                    {formatRelativeTime(invite.createdAt, tc)}
                  </Text>
                </Box>
                {invite.description ? (
                  <Text size="xs" style={{ color: theme.colors.text.onRaisedSecondary, marginBottom: 4, marginLeft: 22 }} numberOfLines={2}>
                    {invite.description}
                  </Text>
                ) : null}
                {(() => {
                  const memberCount = getMemberCount(invite.membersJson);
                  return memberCount > 0 ? (
                    <Text size="xs" style={{ color: theme.colors.text.muted, marginBottom: 6, marginLeft: 22 }}>
                      {memberCount} {memberCount === 1 ? tc('member') : tc('members')}
                    </Text>
                  ) : null;
                })()}
                <Box style={{ flexDirection: 'row', gap: 6 }}>
                  <Button
                    variant="success"
                    size="xs"
                    fullWidth
                    disabled={processingInviteId !== null}
                    iconLeft={<CheckIcon size={12} color={theme.colors.text.onAccent} />}
                    onPress={() => handleAccept(invite.id)}
                  >
                    {processingInviteId === invite.id ? t('joining') : t('accept')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="xs"
                    fullWidth
                    disabled={processingInviteId !== null}
                    iconLeft={<XIcon size={12} color={theme.colors.text.onRaisedSecondary} />}
                    onPress={() => handleDecline(invite.id)}
                  >
                    {processingInviteId === invite.id ? t('declining') : t('decline')}
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        </SidebarSection>
      )}

      <SlotRenderer slot="sidebar-section" />
      <Box style={{ marginTop: 12, flex: contentFlex, overflow: 'hidden' as any }}>
        {/* Custom header row: "Conversations" title + inline + button */}
        <Box style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 8, zIndex: 200 }}>
          <Text size="xs" weight="semibold" style={{ color: theme.colors.text.onRaisedSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('conversations')}
          </Text>
          {(onNewDm || onCreateGroup) && (
            <Box style={{ position: 'relative', zIndex: 200 }}>
              <Button
                testID={TEST_IDS.SIDEBAR.NEW_CHAT_BUTTON}
                variant="tertiary"
                onSurface
                size="xs"
                onPress={handleToggleMenu}
                accessibilityLabel="New conversation"
                iconLeft={<PlusIcon size={13} color={theme.colors.text.onRaisedSecondary} />}
                shape="pill"
              />

              <NewChatMenu
                visible={menuOpen}
                onClose={handleCloseMenu}
                onNewDm={onNewDm ?? (() => {})}
                onNewGroup={onCreateGroup ?? (() => {})}
              />
            </Box>
          )}
        </Box>
        <ScrollView testID={TEST_IDS.SIDEBAR.CONVERSATION_LIST} style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {loading ? (
            /* Skeleton conversation list items */
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <Box
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                  }}
                >
                  <Skeleton variant="circular" width={36} height={36} />
                  <Box style={{ flex: 1, gap: 6 }}>
                    <Skeleton variant="rectangular" height={12} radius={4} width="60%" />
                    <Skeleton variant="rectangular" height={10} radius={4} width="85%" />
                  </Box>
                </Box>
              ))}
            </>
          ) : conversations.length === 0 ? (
            <Box testID={TEST_IDS.SIDEBAR.EMPTY_STATE} style={{ alignItems: 'center', paddingVertical: 24 }}>
              <GradientText animated speed={4000} style={{ fontSize: 13 }}>{t('noConversations')}</GradientText>
            </Box>
          ) : (
            conversations.map((c) => (
              <ConversationListItem
                key={c.id}
                testID={TEST_IDS.SIDEBAR.CONVERSATION_ITEM}
                name={c.name}
                lastMessage={c.last}
                timestamp={c.time}
                unreadCount={c.unread}
                shimmer={shimmerCounters[c.id] ?? 0}
                online={c.online}
                pinned={c.pinned}
                status={c.status as any}
                active={c.id === activeId}
                onPress={() => onSelectConversation(c.id)}
                avatar={
                  c.group ? (
                    <AvatarGroup max={2} size="sm" spacing={10} onSurface>
                      {c.group.map((name) => (
                        <Avatar key={name} name={name} size="sm" />
                      ))}
                    </AvatarGroup>
                  ) : (
                    <Avatar name={c.name} src={c.avatar} size="md" onSurface />
                  )
                }
              />
            ))
          )}
        </ScrollView>
      </Box>
    </>
  );
}
