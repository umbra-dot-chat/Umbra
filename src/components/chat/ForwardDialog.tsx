/**
 * ForwardDialog — Conversation picker for forwarding a message.
 *
 * Shows a searchable list of all conversations (DMs and groups).
 * Selecting a conversation forwards the message to it.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, Pressable, Text as RNText } from 'react-native';
import {
  Dialog,
  HStack,
  VStack,
  Avatar,
  SearchInput,
  useTheme,
} from '@coexist/wisp-react-native';
import { MessageIcon } from '@/components/ui';
import { useConversations } from '@/hooks/useConversations';
import { useFriends } from '@/hooks/useFriends';
import { useGroups } from '@/hooks/useGroups';
import type { Conversation } from '@umbra/service';

export interface ForwardDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called when a conversation is selected for forwarding. */
  onSelectConversation: (conversationId: string) => void;
}

export function ForwardDialog({ open, onClose, onSelectConversation }: ForwardDialogProps) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const { conversations } = useConversations();
  const { friends } = useFriends();
  const { groups } = useGroups();
  const [search, setSearch] = useState('');

  // Build lookup maps for display names
  const friendDidToName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of friends) {
      map[f.did] = f.displayName;
    }
    return map;
  }, [friends]);

  const groupIdToName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const g of groups) {
      map[g.id] = g.name;
    }
    return map;
  }, [groups]);

  // Get display name for a conversation
  const getConvoName = useCallback((c: Conversation) => {
    if (c.type === 'dm' && c.friendDid) {
      return friendDidToName[c.friendDid] || c.friendDid.slice(0, 20) + '...';
    }
    if (c.type === 'group' && c.groupId) {
      return groupIdToName[c.groupId] || 'Group';
    }
    return 'Conversation';
  }, [friendDidToName, groupIdToName]);

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => getConvoName(c).toLowerCase().includes(q));
  }, [conversations, search, getConvoName]);

  const handleSelect = useCallback(
    (conversationId: string) => {
      onSelectConversation(conversationId);
      setSearch('');
      onClose();
    },
    [onSelectConversation, onClose]
  );

  const handleClose = useCallback(() => {
    setSearch('');
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Forward Message"
      description="Choose a conversation to forward to."
      icon={<MessageIcon size={22} color={tc.accent.primary} />}
      size="md"
    >
      <VStack style={{ gap: 12, minWidth: 360, maxHeight: 420 }}>
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search conversations..."
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
          {filteredConversations.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <RNText style={{ fontSize: 13, color: tc.text.muted }}>
                {conversations.length === 0
                  ? 'No conversations yet.'
                  : 'No conversations match your search.'}
              </RNText>
            </View>
          ) : (
            <ScrollView>
              {filteredConversations.map((convo) => {
                const name = getConvoName(convo);
                return (
                  <Pressable
                    key={convo.id}
                    onPress={() => handleSelect(convo.id)}
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
                      <Avatar name={name} size="sm" />
                      <VStack style={{ flex: 1 }}>
                        <RNText
                          style={{
                            fontSize: 14,
                            fontWeight: '500',
                            color: tc.text.primary,
                          }}
                        >
                          {name}
                        </RNText>
                        <RNText
                          style={{
                            fontSize: 11,
                            color: tc.text.muted,
                          }}
                        >
                          {convo.type === 'dm' ? 'Direct Message' : 'Group'}
                        </RNText>
                      </VStack>
                    </HStack>
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
