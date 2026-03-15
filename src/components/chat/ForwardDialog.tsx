/**
 * ForwardDialog — Conversation picker for forwarding a message.
 *
 * Shows a searchable list of all conversations (DMs and groups).
 * Selecting a conversation forwards the message to it.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { ScrollView, Pressable } from 'react-native';
import { dbg } from '@/utils/debug';
import {
  Box,
  Dialog,
  HStack,
  VStack,
  Avatar,
  SearchInput,
  Text,
  useTheme,
} from '@coexist/wisp-react-native';
import { MessageIcon } from '@/components/ui';
import { useTranslation } from 'react-i18next';
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
  if (__DEV__) dbg.trackRender('ForwardDialog');
  const { theme } = useTheme();
  const tc = theme.colors;
  const { t } = useTranslation('chat');
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
      title={t('forwardMessage')}
      description={t('common:chooseConversationForward')}
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
          {filteredConversations.length === 0 ? (
            <Box style={{ padding: 24, alignItems: 'center' }}>
              <Text size="sm" style={{ color: tc.text.muted }}>
                {conversations.length === 0
                  ? 'No conversations yet.'
                  : 'No conversations match your search.'}
              </Text>
            </Box>
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
                        <Text
                          size="sm"
                          weight="medium"
                          style={{ color: tc.text.primary }}
                        >
                          {name}
                        </Text>
                        <Text
                          size="xs"
                          style={{ color: tc.text.muted }}
                        >
                          {convo.type === 'dm' ? 'Direct Message' : 'Group'}
                        </Text>
                      </VStack>
                    </HStack>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </Box>
      </VStack>
    </Dialog>
  );
}
