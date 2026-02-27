import { BookOpenIcon, CheckIcon, PlusIcon, ShoppingBagIcon, UsersIcon, XIcon } from '@/components/ui';
import {
  Avatar, AvatarGroup, Button,
  ConversationListItem,
  SearchInput,
  Sidebar, SidebarSection,
  Skeleton,
  Text,
  useTheme,
} from '@coexist/wisp-react-native';
import type { PendingGroupInvite } from '@umbra/service';
import React, { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NewChatMenu } from './NewChatMenu';
import { SlotRenderer } from '@/components/plugins/SlotRenderer';

export interface ChatSidebarProps {
  search: string;
  onSearchChange: (s: string) => void;
  conversations: { id: string; name: string; last: string; time: string; unread: number; online?: boolean; pinned?: boolean; status?: string; group?: string[]; isGroup?: boolean }[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onFriendsPress: () => void;
  onNewDm?: () => void;
  onCreateGroup?: () => void;
  onGuidePress?: () => void;
  onMarketplacePress?: () => void;
  isFriendsActive?: boolean;
  /** Pending group invites to display above conversations */
  pendingInvites?: PendingGroupInvite[];
  /** Accept a group invite */
  onAcceptInvite?: (inviteId: string) => void;
  /** Decline a group invite */
  onDeclineInvite?: (inviteId: string) => void;
  /** Whether conversations are still loading */
  loading?: boolean;
  /** Number of pending friend requests for badge display */
  pendingFriendRequests?: number;
}

export function ChatSidebar(props: ChatSidebarProps) {
  return <ChatSidebarInner {...props} />;
}

function ChatSidebarInner({
  search, onSearchChange, conversations,
  activeId, onSelectConversation,
  onFriendsPress, onNewDm, onCreateGroup, onGuidePress, onMarketplacePress, isFriendsActive,
  pendingInvites, onAcceptInvite, onDeclineInvite, loading, pendingFriendRequests,
}: ChatSidebarProps) {
  const { theme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleToggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  return (
      <Sidebar width="wide" style={{ paddingHorizontal: 8, paddingTop: 20, width: '100%' }}>
        {/* Search bar */}
        <SidebarSection>
          <View style={{ paddingHorizontal: 6 }}>
            <SearchInput
              value={search}
              onValueChange={onSearchChange}
              placeholder="Search..."
              size="md"
              fullWidth
              onSurface
              onClear={() => onSearchChange('')}
            />
          </View>
        </SidebarSection>

        {/* Navigation buttons */}
        <SidebarSection style={{ marginTop: 12 }}>
          <View style={{ marginHorizontal: 6 }}>
              <Button
                variant={isFriendsActive ? 'secondary' : 'tertiary'}
                onSurface
                size="md"
                fullWidth
                iconLeft={<UsersIcon size={18} color={isFriendsActive ? theme.colors.text.onRaised : theme.colors.text.onRaisedSecondary} />}
                onPress={onFriendsPress}
                accessibilityLabel="Friends"
                style={{ justifyContent: 'flex-start' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text size="sm">Friends</Text>
                  {!!pendingFriendRequests && pendingFriendRequests > 0 && (
                    <View style={{
                      backgroundColor: theme.colors.status.danger,
                      borderRadius: 99,
                      paddingHorizontal: 4,
                      minWidth: 16,
                      height: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Text style={{ fontSize: 9, lineHeight: 12, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }}>
                        {pendingFriendRequests > 99 ? '99+' : pendingFriendRequests}
                      </Text>
                    </View>
                  )}
                </View>
              </Button>
          </View>
          {onGuidePress && (
            <View style={{ marginHorizontal: 6, marginTop: 2 }}>
              <Button
                variant="tertiary"
                onSurface
                size="md"
                fullWidth
                iconLeft={<BookOpenIcon size={18} color={theme.colors.text.onRaisedSecondary} />}
                onPress={onGuidePress}
                accessibilityLabel="User Guide"
                style={{ justifyContent: 'flex-start' }}
              >
                Guide
              </Button>
            </View>
          )}
          {onMarketplacePress && (
            <View style={{ marginHorizontal: 6, marginTop: 2 }}>
              <Button
                variant="tertiary"
                onSurface
                size="md"
                fullWidth
                iconLeft={<ShoppingBagIcon size={18} color={theme.colors.text.onRaisedSecondary} />}
                onPress={onMarketplacePress}
                accessibilityLabel="Marketplace"
                style={{ justifyContent: 'flex-start' }}
              >
                Marketplace
              </Button>
            </View>
          )}
        </SidebarSection>

        {/* Group Invites Section — only shown when there are pending invites */}
        {pendingInvites && pendingInvites.length > 0 && (
          <SidebarSection title={`Group Invites (${pendingInvites.length})`}>
            <View style={{ marginHorizontal: 6, gap: 6, marginBottom: 4 }}>
              {pendingInvites.map((invite) => (
                <View
                  key={invite.id}
                  style={{
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.colors.border.strong,
                    backgroundColor: theme.colors.background.sunken,
                    padding: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <UsersIcon size={14} color={theme.colors.text.onRaisedSecondary} />
                    <View style={{ flex: 1 }}>
                      <Text size="xs" weight="semibold" style={{ color: theme.colors.text.onRaised }} numberOfLines={1}>
                        {invite.groupName}
                      </Text>
                      <Text size="xs" style={{ color: theme.colors.text.onRaisedSecondary }} numberOfLines={1}>
                        from {invite.inviterName}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Button
                      variant="success"
                      size="xs"
                      fullWidth
                      iconLeft={<CheckIcon size={12} color={theme.colors.text.inverse} />}
                      onPress={() => onAcceptInvite?.(invite.id)}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="secondary"
                      size="xs"
                      fullWidth
                      iconLeft={<XIcon size={12} color={theme.colors.text.onRaisedSecondary} />}
                      onPress={() => onDeclineInvite?.(invite.id)}
                    >
                      Decline
                    </Button>
                  </View>
                </View>
              ))}
            </View>
          </SidebarSection>
        )}

        <SlotRenderer slot="sidebar-section" />
        <SidebarSection style={{ marginTop: 12 }}>
          {/* Custom header row: "Conversations" title + inline + button */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 8, zIndex: 200 }}>
            <Text size="xs" weight="semibold" style={{ color: theme.colors.text.onRaisedSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Conversations
            </Text>
            {(onNewDm || onCreateGroup) && (
              <View style={{ position: 'relative', zIndex: 200 }}>
                <Button
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
              </View>
            )}
          </View>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {loading ? (
              /* Skeleton conversation list items */
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <View
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
                    <View style={{ flex: 1, gap: 6 }}>
                      <Skeleton variant="rectangular" height={12} radius={4} width="60%" />
                      <Skeleton variant="rectangular" height={10} radius={4} width="85%" />
                    </View>
                  </View>
                ))}
              </>
            ) : (
              conversations.map((c) => (
                <ConversationListItem
                  key={c.id}
                  name={c.name}
                  lastMessage={c.last}
                  timestamp={c.time}
                  unreadCount={c.unread}
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
                      <Avatar name={c.name} size="md" onSurface status={c.online ? 'online' : undefined} />
                    )
                  }
                />
              ))
            )}
          </ScrollView>
        </SidebarSection>
      </Sidebar>
  );
}
