/**
 * NewDmDialog — Friend picker dialog for starting a new DM conversation.
 *
 * Shows a searchable list of all friends with an "Already chatting" indicator
 * for friends who already have a DM conversation. Selecting a friend either
 * navigates to the existing conversation or creates a new one.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Pressable } from 'react-native';
import {
  Dialog,
  Box,
  Text,
  HStack,
  VStack,
  Avatar,
  ScrollArea,
  SearchInput,
  useTheme,
} from '@coexist/wisp-react-native';
import { MessageIcon, CheckIcon } from '@/components/ui';
import { useFriends } from '@/hooks/useFriends';
import { useNetwork } from '@/hooks/useNetwork';
import { useConversations } from '@/hooks/useConversations';
import type { Friend } from '@umbra/service';
import { useTranslation } from 'react-i18next';
import { dbg } from '@/utils/debug';

export interface NewDmDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called when a friend is selected. If conversationId is provided, navigate to it.
   *  Otherwise, create a new DM conversation for that friend. */
  onSelectFriend: (friend: Friend, existingConversationId?: string) => void;
}

export function NewDmDialog({ open, onClose, onSelectFriend }: NewDmDialogProps) {
  if (__DEV__) dbg.trackRender('NewDmDialog');
  const { theme } = useTheme();
  const tc = theme.colors;
  const { t } = useTranslation('common');
  const { friends } = useFriends();
  const { onlineDids } = useNetwork();
  const { conversations } = useConversations();
  const [search, setSearch] = useState('');

  // Build a DID → conversationId map for existing DMs
  const existingDmMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of conversations) {
      if (c.type === 'dm' && c.friendDid) {
        map[c.friendDid] = c.id;
      }
    }
    return map;
  }, [conversations]);

  // Filter friends by search
  const filteredFriends = useMemo(() => {
    if (!search.trim()) return friends;
    const q = search.toLowerCase();
    return friends.filter(
      (f) =>
        f.displayName.toLowerCase().includes(q) ||
        f.did.toLowerCase().includes(q)
    );
  }, [friends, search]);

  const handleSelect = useCallback(
    (friend: Friend) => {
      const existingId = existingDmMap[friend.did];
      onSelectFriend(friend, existingId);
      setSearch('');
      onClose();
    },
    [existingDmMap, onSelectFriend, onClose]
  );

  const handleClose = useCallback(() => {
    setSearch('');
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={t('startConversation')}
      description={t('chooseFriendToMessage')}
      icon={<MessageIcon size={22} color={tc.accent.primary} />}
      size="md"
    >
      <VStack style={{ gap: 12, minWidth: 360, maxHeight: 420 }}>
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder={t('searchFriends')}
          size="sm"
          fullWidth
          onClear={() => setSearch('')}
          gradientBorder
        />

        <Box
          style={{
            maxHeight: 300,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: tc.border.subtle,
            overflow: 'hidden',
          }}
        >
          {filteredFriends.length === 0 ? (
            <Box style={{ padding: 24, alignItems: 'center' }}>
              <Text size="sm" style={{ color: tc.text.muted }}>
                {friends.length === 0
                  ? t('noFriendsYet')
                  : t('noFriendsMatch')}
              </Text>
            </Box>
          ) : (
            <ScrollArea>
              {filteredFriends.map((friend) => {
                const existingConvoId = existingDmMap[friend.did];
                return (
                  <Pressable
                    key={friend.did}
                    onPress={() => handleSelect(friend)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: tc.border.subtle,
                      backgroundColor: pressed
                        ? tc.accent.primary + '10'
                        : 'transparent',
                    })}
                  >
                    <HStack style={{ alignItems: 'center', gap: 10, flex: 1 }}>
                      <Avatar name={friend.displayName} size="sm" status={onlineDids.has(friend.did) ? 'online' : undefined} />
                      <VStack style={{ flex: 1 }}>
                        <Text
                          size="sm"
                          weight="medium"
                          style={{ color: tc.text.primary }}
                        >
                          {friend.displayName}
                        </Text>
                        <Text
                          size="xs"
                          style={{
                            color: tc.text.muted,
                            fontFamily: 'monospace',
                          }}
                          numberOfLines={1}
                        >
                          {friend.did.slice(0, 24)}...
                        </Text>
                      </VStack>
                    </HStack>

                    {existingConvoId && (
                      <Box
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 12,
                          backgroundColor: tc.accent.primary + '18',
                        }}
                      >
                        <CheckIcon size={10} color={tc.accent.primary} />
                        <Text
                          size="xs"
                          weight="semibold"
                          style={{ color: tc.accent.primary }}
                        >
                          {t('alreadyChatting')}
                        </Text>
                      </Box>
                    )}
                  </Pressable>
                );
              })}
            </ScrollArea>
          )}
        </Box>
      </VStack>
    </Dialog>
  );
}
