import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';
import { useHoverMessage } from '@/hooks/useHoverMessage';
import { useRightPanel } from '@/hooks/useRightPanel';
import { useProfilePopoverContext } from '@/contexts/ProfilePopoverContext';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useFriends } from '@/hooks/useFriends';
import { useGroups } from '@/hooks/useGroups';
import { useTyping } from '@/hooks/useTyping';
import { useAuth } from '@/contexts/AuthContext';
import { useUmbra } from '@/contexts/UmbraContext';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatArea } from '@/components/chat/ChatArea';
import { ChatInput } from '@/components/chat/ChatInput';
import { RightPanel } from '@/components/panels/RightPanel';
import { MessageIcon } from '@/components/icons';
import { HelpIndicator } from '@/components/ui/HelpIndicator';
import { HelpText, HelpHighlight, HelpListItem } from '@/components/ui/HelpContent';

// ─────────────────────────────────────────────────────────────────────────────
// Empty conversation state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyConversation() {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Text size="display-sm" weight="bold" style={{ color: theme.colors.text.primary, marginBottom: 8 }}>
        Welcome to Umbra
      </Text>
      <Text size="sm" style={{ color: theme.colors.text.muted, textAlign: 'center', maxWidth: 400, marginBottom: 16 }}>
        Add a friend to start chatting. Your messages are end-to-end encrypted and delivered peer-to-peer.
      </Text>
      <HelpIndicator
        id="chat-empty"
        title="Getting Started"
        icon="i"
        priority={80}
        size={18}
      >
        <HelpText>
          To start a conversation, go to the Friends page and add someone by their DID.
        </HelpText>
        <HelpHighlight icon={<MessageIcon size={22} color="#6366f1" />}>
          Once you're friends, a conversation is created automatically. Messages are end-to-end encrypted — only you and the recipient can read them.
        </HelpHighlight>
        <HelpListItem>Navigate to Friends from the sidebar</HelpListItem>
        <HelpListItem>Paste a DID to send a friend request</HelpListItem>
        <HelpListItem>Once accepted, your conversation appears here</HelpListItem>
      </HelpIndicator>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { identity } = useAuth();
  const { service } = useUmbra();
  const myDid = identity?.did ?? '';

  // Data hooks
  const { conversations, isLoading: convsLoading } = useConversations();
  const { friends } = useFriends();
  const { groups, getMembers } = useGroups();

  // Build a DID → display name map from the friends list
  const friendNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of friends) {
      map[f.did] = f.displayName;
    }
    return map;
  }, [friends]);

  // Active conversation — use the first one by default
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Resolve active conversation: prefer explicitly selected, fall back to first
  const resolvedConversationId = activeConversationId ?? conversations[0]?.id ?? null;
  const activeConversation = conversations.find((c) => c.id === resolvedConversationId);

  // Messages for the active conversation
  const {
    messages, isLoading: msgsLoading, sendMessage,
    editMessage, deleteMessage, pinMessage, unpinMessage,
    addReaction, removeReaction, forwardMessage,
    getThreadReplies, sendThreadReply, pinnedMessages,
  } = useMessages(resolvedConversationId);

  // Group member count for the active conversation
  const [activeMemberCount, setActiveMemberCount] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (activeConversation?.type === 'group' && activeConversation.groupId) {
      getMembers(activeConversation.groupId).then((members) => {
        setActiveMemberCount(members.length);
      }).catch(() => setActiveMemberCount(undefined));
    } else {
      setActiveMemberCount(undefined);
    }
  }, [activeConversation, getMembers]);

  // Compute participant DIDs for the active conversation
  const participantDids = useMemo(() => {
    if (!activeConversation) return [];
    if (activeConversation.type === 'group') {
      // For groups, we'd need group member DIDs — for now use friends as proxy
      return friends.map((f) => f.did);
    }
    // For DMs, the participant is the friend
    return activeConversation.friendDid ? [activeConversation.friendDid] : [];
  }, [activeConversation, friends]);

  // Typing indicator
  const { typingDisplay, sendTyping, sendStopTyping } = useTyping(resolvedConversationId, participantDids);

  // Chat input state
  const [message, setMessage] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ sender: string; text: string } | null>(null);

  // Edit mode state
  const [editingMessage, setEditingMessage] = useState<{ messageId: string; text: string } | null>(null);

  // Panel & search state
  const [searchQuery, setSearchQuery] = useState('');

  // Custom hooks
  const { hoveredMessage, handleHoverIn, handleHoverOut } = useHoverMessage();
  const { rightPanel, visiblePanel, panelWidth, togglePanel } = useRightPanel();
  const { showProfile } = useProfilePopoverContext();

  const [threadParent, setThreadParent] = useState<{ id: string; sender: string; content: string; timestamp: string } | null>(null);
  const [threadReplies, setThreadReplies] = useState<{ id: string; sender: string; content: string; timestamp: string; isOwn?: boolean }[]>([]);

  const openThread = useCallback(async (msg: { id: string; sender: string; content: string; timestamp: string }) => {
    setThreadParent(msg);
    if (rightPanel !== 'thread') {
      togglePanel('thread');
    }
    // Fetch thread replies
    const replies = await getThreadReplies(msg.id);
    setThreadReplies(
      replies.map((r) => ({
        id: r.id,
        sender: friendNames[r.senderDid] || (r.senderDid === myDid ? 'You' : r.senderDid.slice(0, 16)),
        content: r.content.type === 'text' ? r.content.text : '',
        timestamp: new Date(r.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        isOwn: r.senderDid === myDid,
      }))
    );
  }, [rightPanel, togglePanel, getThreadReplies, friendNames, myDid]);

  // Build active conversation header info
  const activeHeaderInfo = useMemo(() => {
    if (!activeConversation) return undefined;

    if (activeConversation.type === 'group' && activeConversation.groupId) {
      const group = groups.find((g) => g.id === activeConversation.groupId);
      const memberNames = group
        ? [group.name] // Use group name as display; members shown via AvatarGroup
        : ['Group'];
      return {
        name: group?.name ?? 'Group',
        group: memberNames,
        memberCount: activeMemberCount,
      };
    }

    return {
      name: activeConversation.friendDid
        ? (friendNames[activeConversation.friendDid] || activeConversation.friendDid.slice(0, 16) + '...')
        : 'Chat',
      online: activeConversation.friendDid
        ? friends.find((f) => f.did === activeConversation.friendDid)?.online
        : undefined,
    };
  }, [activeConversation, groups, friendNames, friends, activeMemberCount]);

  // Handle sending a message (or editing)
  const handleSubmit = useCallback(async (msg: string) => {
    setEmojiOpen(false);
    if (!msg.trim()) return;

    sendStopTyping(); // Clear typing indicator on send

    if (editingMessage) {
      await editMessage(editingMessage.messageId, msg.trim());
      setEditingMessage(null);
    } else if (resolvedConversationId) {
      await sendMessage(msg.trim());
    }
  }, [editingMessage, editMessage, resolvedConversationId, sendMessage, sendStopTyping]);

  // Handle entering edit mode
  const handleEditMessage = useCallback((messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (msg && msg.content.type === 'text') {
      setEditingMessage({ messageId, text: msg.content.text });
      setMessage(msg.content.text);
      setReplyingTo(null);
    }
  }, [messages]);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
    setMessage('');
  }, []);

  // Handle toggle reaction (add if not reacted, remove if already reacted)
  const handleToggleReaction = useCallback(async (messageId: string, emoji: string) => {
    const msg = messages.find((m) => m.id === messageId);
    const existing = msg?.reactions?.find((r) => r.emoji === emoji);
    if (existing?.reacted || existing?.users?.includes(myDid)) {
      await removeReaction(messageId, emoji);
    } else {
      await addReaction(messageId, emoji);
    }
  }, [messages, myDid, addReaction, removeReaction]);

  // Handle copy message
  const handleCopyMessage = useCallback((text: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      try { navigator.clipboard.writeText(text); } catch { /* ignore */ }
    }
  }, []);

  // Handle thread reply
  const handleThreadReply = useCallback(async (text: string) => {
    if (!threadParent) return;
    const reply = await sendThreadReply(threadParent.id, text);
    if (reply) {
      setThreadReplies((prev) => [...prev, {
        id: reply.id,
        sender: 'You',
        content: reply.content.type === 'text' ? reply.content.text : '',
        timestamp: new Date(reply.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        isOwn: true,
      }]);
    }
  }, [threadParent, sendThreadReply]);

  // Subscribe to real-time thread reply events to update the thread panel
  useEffect(() => {
    if (!service) return;

    const unsubscribe = service.onMessageEvent((event: any) => {
      if (event.type === 'threadReplyReceived' && event.parentId && event.message) {
        // Only update if the thread panel is open for this parent message
        setThreadParent((current) => {
          if (current && current.id === event.parentId) {
            const msg = event.message;
            const senderName = msg.senderDid === myDid
              ? 'You'
              : (friendNames[msg.senderDid] || msg.senderDid.slice(0, 16));
            setThreadReplies((prev) => {
              // Avoid duplicates
              if (prev.some((r) => r.id === msg.id)) return prev;
              return [...prev, {
                id: msg.id,
                sender: senderName,
                content: msg.content?.text || '',
                timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
                isOwn: msg.senderDid === myDid,
              }];
            });
          }
          return current;
        });
      }
    });

    return unsubscribe;
  }, [service, myDid, friendNames]);

  // Build pinned messages for the panel
  const pinnedForPanel = useMemo(() =>
    (pinnedMessages || []).map((m) => ({
      id: m.id,
      sender: friendNames[m.senderDid] || (m.senderDid === myDid ? 'You' : m.senderDid.slice(0, 16)),
      content: m.content.type === 'text' ? m.content.text : '',
      timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    })),
  [pinnedMessages, friendNames, myDid]);

  // No conversations yet — show welcome
  if (!convsLoading && conversations.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        <EmptyConversation />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <ChatHeader
          active={activeHeaderInfo}
          rightPanel={rightPanel}
          togglePanel={togglePanel}
          onShowProfile={showProfile}
        />
        <ChatArea
          messages={messages}
          myDid={myDid}
          friendNames={friendNames}
          isLoading={msgsLoading}
          isGroupChat={activeConversation?.type === 'group'}
          typingUser={typingDisplay}
          hoveredMessage={hoveredMessage}
          onHoverIn={handleHoverIn}
          onHoverOut={handleHoverOut}
          onReplyTo={setReplyingTo}
          onOpenThread={openThread}
          onShowProfile={showProfile}
          onToggleReaction={handleToggleReaction}
          onEditMessage={handleEditMessage}
          onDeleteMessage={deleteMessage}
          onPinMessage={pinMessage}
          onForwardMessage={(msgId) => {
            // For now, forward to the same conversation (demo)
            if (resolvedConversationId) forwardMessage(msgId, resolvedConversationId);
          }}
          onCopyMessage={handleCopyMessage}
        />
        <ChatInput
          message={message}
          onMessageChange={(msg) => { setMessage(msg); if (msg.length > 0) sendTyping(); }}
          emojiOpen={emojiOpen}
          onToggleEmoji={() => setEmojiOpen((prev) => !prev)}
          replyingTo={replyingTo}
          onClearReply={() => setReplyingTo(null)}
          onSubmit={handleSubmit}
          editing={editingMessage}
          onCancelEdit={handleCancelEdit}
        />
      </View>

      <RightPanel
        panelWidth={panelWidth}
        visiblePanel={visiblePanel}
        togglePanel={togglePanel}
        onMemberClick={(member, event) => {
          showProfile(member.name, event);
        }}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        threadParent={threadParent}
        threadReplies={threadReplies}
        pinnedMessages={pinnedForPanel}
        onUnpinMessage={unpinMessage}
        onThreadReply={handleThreadReply}
      />

    </View>
  );
}
