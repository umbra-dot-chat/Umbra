/**
 * NewDmDialog — Friend picker dialog for starting a new DM conversation.
 *
 * Shows a searchable list of all friends with an "Already chatting" indicator
 * for friends who already have a DM conversation. Selecting a friend either
 * navigates to the existing conversation or creates a new one.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, Pressable, Text as RNText } from 'react-native';
import {
  Dialog,
  Button,
  HStack,
  VStack,
  Avatar,
  SearchInput,
  useTheme,
} from '@coexist/wisp-react-native';
import { MessageIcon, CheckIcon } from '@/components/icons';
import { useFriends } from '@/hooks/useFriends';
import { useConversations } from '@/hooks/useConversations';
import type { Friend } from '@umbra/service';

export interface NewDmDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called when a friend is selected. If conversationId is provided, navigate to it.
   *  Otherwise, create a new DM conversation for that friend. */
  onSelectFriend: (friend: Friend, existingConversationId?: string) => void;
}

export function NewDmDialog({ open, onClose, onSelectFriend }: NewDmDialogProps) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const { friends } = useFriends();
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
      title="Start a Conversation"
      description="Choose a friend to message."
      icon={<MessageIcon size={22} color={tc.accent.primary} />}
      size="md"
    >
      <VStack style={{ gap: 12, minWidth: 360, maxHeight: 420 }}>
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search friends..."
          size="sm"
          fullWidth
          onClear={() => setSearch('')}
        />

        <View
          style={{
            maxHeight: 300,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: tc.border.subtle,
            overflow: 'hidden',
          }}
        >
          {filteredFriends.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <RNText style={{ fontSize: 13, color: tc.text.muted }}>
                {friends.length === 0
                  ? 'No friends yet. Add friends first!'
                  : 'No friends match your search.'}
              </RNText>
            </View>
          ) : (
            <ScrollView>
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
                      <Avatar name={friend.displayName} size="sm" />
                      <VStack style={{ flex: 1 }}>
                        <RNText
                          style={{
                            fontSize: 14,
                            fontWeight: '500',
                            color: tc.text.primary,
                          }}
                        >
                          {friend.displayName}
                        </RNText>
                        <RNText
                          style={{
                            fontSize: 11,
                            color: tc.text.muted,
                            fontFamily: 'monospace',
                          }}
                          numberOfLines={1}
                        >
                          {friend.did.slice(0, 24)}...
                        </RNText>
                      </VStack>
                    </HStack>

                    {existingConvoId && (
                      <View
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
                        <RNText
                          style={{
                            fontSize: 10,
                            fontWeight: '600',
                            color: tc.accent.primary,
                          }}
                        >
                          Already chatting
                        </RNText>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </VStack>
    </Dialog>
  );
}
