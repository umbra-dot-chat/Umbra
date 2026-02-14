import { BookOpenIcon, CheckIcon, PlusIcon, SettingsIcon, ShoppingBagIcon, UsersIcon, XIcon } from '@/components/icons';
import {
  Avatar, AvatarGroup, Button,
  SearchInput,
  Sidebar, SidebarSection,
  WispProvider,
  useTheme,
} from '@coexist/wisp-react-native';
import { ConversationListItem } from '@coexist/wisp-react-native/src/components/conversation-list-item';
import type { PendingGroupInvite } from '@umbra/service';
import React, { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '@coexist/wisp-react-native';
import { NewChatMenu } from './NewChatMenu';
import { SlotRenderer } from '@/components/plugins/SlotRenderer';

export interface ChatSidebarProps {
  search: string;
  onSearchChange: (s: string) => void;
  conversations: { id: string; name: string; last: string; time: string; unread: number; online?: boolean; pinned?: boolean; status?: string; group?: string[]; isGroup?: boolean }[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  onOpenSettings: () => void;
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
}

export function ChatSidebar(props: ChatSidebarProps) {
  return (
    <WispProvider mode="dark">
      <ChatSidebarInner {...props} />
    </WispProvider>
  );
}

function ChatSidebarInner({
  search, onSearchChange, conversations,
  activeId, onSelectConversation, onOpenSettings,
  onFriendsPress, onNewDm, onCreateGroup, onGuidePress, onMarketplacePress, isFriendsActive,
  pendingInvites, onAcceptInvite, onDeclineInvite,
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
      <Sidebar width="wide" style={{ paddingHorizontal: 8, paddingTop: 20 }}>
        <SidebarSection>
          <View style={{ paddingHorizontal: 6, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ flex: 1 }}>
              <SearchInput
                value={search}
                onValueChange={onSearchChange}
                placeholder="Search..."
                size="md"
                fullWidth
                onClear={() => onSearchChange('')}
              />
            </View>
            <Button
              variant="tertiary"
              size="md"
              onPress={onOpenSettings}
              accessibilityLabel="Settings"
              iconLeft={<SettingsIcon size={16} color={theme.colors.text.secondary} />}
            />
          </View>
          <View style={{ marginHorizontal: 6 }}>
            <Button
              variant={isFriendsActive ? 'secondary' : 'tertiary'}
              size="md"
              fullWidth
              iconLeft={<UsersIcon size={18} color={isFriendsActive ? theme.colors.text.primary : theme.colors.text.secondary} />}
              onPress={onFriendsPress}
              accessibilityLabel="Friends"
              style={{ justifyContent: 'flex-start' }}
            >
              Friends
            </Button>
          </View>
          {onGuidePress && (
            <View style={{ marginHorizontal: 6, marginTop: 2 }}>
              <Button
                variant="tertiary"
                size="md"
                fullWidth
                iconLeft={<BookOpenIcon size={18} color={theme.colors.text.secondary} />}
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
                size="md"
                fullWidth
                iconLeft={<ShoppingBagIcon size={18} color={theme.colors.text.secondary} />}
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
                    <UsersIcon size={14} color={theme.colors.text.secondary} />
                    <View style={{ flex: 1 }}>
                      <Text size="xs" weight="semibold" numberOfLines={1}>
                        {invite.groupName}
                      </Text>
                      <Text size="xs" style={{ color: theme.colors.text.muted }} numberOfLines={1}>
                        from {invite.inviterName}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Button
                      variant="success"
                      size="xs"
                      fullWidth
                      iconLeft={<CheckIcon size={12} color={theme.colors.text.primary} />}
                      onPress={() => onAcceptInvite?.(invite.id)}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="secondary"
                      size="xs"
                      fullWidth
                      iconLeft={<XIcon size={12} color={theme.colors.text.secondary} />}
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
        <SidebarSection>
          {/* Custom header row: "Conversations" title + inline + button */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 8, zIndex: 200 }}>
            <Text size="xs" weight="semibold" style={{ color: theme.colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Conversations
            </Text>
            {(onNewDm || onCreateGroup) && (
              <View style={{ position: 'relative', zIndex: 200 }}>
                <Button
                  variant="tertiary"
                  size="xs"
                  onPress={handleToggleMenu}
                  accessibilityLabel="New conversation"
                  iconLeft={<PlusIcon size={13} color={theme.colors.text.secondary} />}
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
            {conversations.map((c) => (
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
                    <AvatarGroup max={2} size="sm" spacing={10}>
                      {c.group.map((name) => (
                        <Avatar key={name} name={name} size="sm" />
                      ))}
                    </AvatarGroup>
                  ) : (
                    <Avatar name={c.name} size="md" />
                  )
                }
              />
            ))}
          </ScrollView>
        </SidebarSection>
      </Sidebar>
  );
}
