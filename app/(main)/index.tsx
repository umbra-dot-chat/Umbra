import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useActiveConversation } from '@/contexts/ActiveConversationContext';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatArea } from '@/components/chat/ChatArea';
import { ChatInput } from '@/components/chat/ChatInput';
import { RightPanel } from '@/components/ui/RightPanel';
import { SlotRenderer } from '@/components/plugins/SlotRenderer';
import { MessageIcon } from '@/components/ui';
import { HelpIndicator } from '@/components/ui/HelpIndicator';
import { HelpText, HelpHighlight, HelpListItem } from '@/components/ui/HelpContent';
import { ActiveCallBar } from '@/components/call/ActiveCallBar';
import { ActiveCallPanel } from '@/components/call/ActiveCallPanel';
import { useCall } from '@/hooks/useCall';
import { pickFile } from '@/utils/filePicker';
import { InputDialog } from '@/components/ui/InputDialog';
import { ForwardDialog } from '@/components/chat/ForwardDialog';
import { useSettingsDialog } from '@/contexts/SettingsDialogContext';
import { ResizeHandle } from '@/components/ui/ResizeHandle';
import { useAllCustomEmoji } from '@/hooks/useAllCustomEmoji';
import { useNetwork } from '@/hooks/useNetwork';

// ─────────────────────────────────────────────────────────────────────────────
// Empty conversation state
// ─────────────────────────────────────────────────────────────────────────────

// Ghost logo assets — theme-aware
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ghostBlack = require('@/assets/images/ghost-black.png');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ghostWhite = require('@/assets/images/ghost-white.png');

function EmptyConversation() {
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';
  const ghostSource = isDark ? ghostWhite : ghostBlack;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Image
        source={ghostSource}
        style={{ width: 275, height: 275, marginBottom: 16 }}
        resizeMode="contain"
      />
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
  const insets = Platform.OS !== 'web' ? useSafeAreaInsets() : { top: 0, bottom: 0 };

  // Data hooks
  const { conversations, isLoading: convsLoading } = useConversations();
  const { friends } = useFriends();
  const { groups, getMembers } = useGroups();
  const { onlineDids } = useNetwork();

  // Build DID → display name and DID → avatar maps from the friends list
  const friendNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of friends) {
      map[f.did] = f.displayName;
    }
    return map;
  }, [friends]);

  const friendAvatars = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of friends) {
      if (f.avatar) map[f.did] = f.avatar;
    }
    return map;
  }, [friends]);

  // Active conversation — shared with sidebar via context
  const { activeId: activeConversationId, clearActiveId, searchPanelRequested, clearSearchPanelRequest } = useActiveConversation();

  // Resolve active conversation: prefer explicitly selected, fall back to first
  const resolvedConversationId = activeConversationId ?? conversations[0]?.id ?? null;
  const activeConversation = conversations.find((c) => c.id === resolvedConversationId);

  // Messages for the active conversation
  const {
    messages, isLoading: msgsLoading, sendMessage,
    editMessage, deleteMessage, pinMessage, unpinMessage,
    addReaction, removeReaction, forwardMessage,
    getThreadReplies, sendThreadReply, pinnedMessages,
    firstUnreadMessageId, markAsRead,
  } = useMessages(resolvedConversationId, activeConversation?.groupId);

  // Mark messages as read when viewing a conversation
  useEffect(() => {
    if (!msgsLoading && resolvedConversationId && messages.length > 0) {
      markAsRead();
    }
  }, [msgsLoading, resolvedConversationId, messages.length, markAsRead]);

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

  // Forward dialog state
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [forwardMessageId, setForwardMessageId] = useState<string | null>(null);

  // Panel & search state
  const [searchQuery, setSearchQuery] = useState('');

  // Custom hooks
  const { hoveredMessage, handleHoverIn, handleHoverOut } = useHoverMessage();
  const { rightPanel, visiblePanel, panelWidth, togglePanel, resizePanel, panelContentWidth } = useRightPanel();
  const { customEmojiItems, stickerPickerPacks, allCommunityEmoji } = useAllCustomEmoji();

  // Open search panel when requested from CommandPalette
  useEffect(() => {
    if (searchPanelRequested) {
      clearSearchPanelRequest();
      // Only open if search panel is not already visible
      if (rightPanel !== 'search') {
        togglePanel('search');
      }
    }
  }, [searchPanelRequested, clearSearchPanelRequest, rightPanel, togglePanel]);
  const { showProfile } = useProfilePopoverContext();
  const {
    activeCall, startCall, toggleMute, toggleCamera, endCall,
    videoQuality, audioQuality, setVideoQuality, setAudioQuality,
    switchCamera, callStats,
  } = useCall();

  const { openSettings } = useSettingsDialog();

  const [threadParent, setThreadParent] = useState<{ id: string; sender: string; content: string; timestamp: string } | null>(null);
  const [threadReplies, setThreadReplies] = useState<{ id: string; sender: string; content: string; timestamp: string; isOwn?: boolean }[]>([]);
  const [sharedFolderDialogOpen, setSharedFolderDialogOpen] = useState(false);
  const [sharedFolderDialogSubmitting, setSharedFolderDialogSubmitting] = useState(false);

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
        sender: r.senderDid ? (friendNames[r.senderDid] || (r.senderDid === myDid ? 'You' : r.senderDid.slice(0, 16))) : 'Unknown',
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
        ? onlineDids.has(activeConversation.friendDid)
        : undefined,
    };
  }, [activeConversation, groups, friendNames, onlineDids, activeMemberCount]);

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

  // Handle file attachment
  const handleAttachment = useCallback(async () => {
    if (!service || !resolvedConversationId) return;
    try {
      const picked = await pickFile();
      if (!picked) return; // User cancelled

      // 1. Chunk the file
      const fileId = crypto.randomUUID();
      const manifest = await service.chunkFile(
        fileId,
        picked.filename,
        picked.dataBase64,
      );

      // 2. Send a message with file metadata encoded as JSON
      // The WASM messaging layer only supports text content for now,
      // so we encode file info as a JSON marker that the UI parses.
      const fileContent = JSON.stringify({
        __file: true,
        fileId,
        filename: picked.filename,
        size: picked.size,
        mimeType: picked.mimeType,
        storageChunksJson: JSON.stringify(manifest),
      });
      await sendMessage(fileContent);
    } catch (err) {
      console.error('[ChatPage] File attachment failed:', err);
    }
  }, [service, resolvedConversationId, sendMessage]);

  // Handle creating a shared folder from a DM conversation
  const handleCreateSharedFolder = useCallback(() => {
    if (!service || !resolvedConversationId) return;
    setSharedFolderDialogOpen(true);
  }, [service, resolvedConversationId]);

  const handleSharedFolderDialogSubmit = useCallback(async (name: string) => {
    if (!service || !resolvedConversationId || !name?.trim()) return;
    setSharedFolderDialogSubmitting(true);
    try {
      await service.createDmFolder(resolvedConversationId, null, name.trim(), myDid);
      console.log('[ChatPage] Shared folder created:', name.trim());
      setSharedFolderDialogOpen(false);
    } catch (err) {
      console.error('[ChatPage] Failed to create shared folder:', err);
    } finally {
      setSharedFolderDialogSubmitting(false);
    }
  }, [service, resolvedConversationId, myDid]);

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
            const senderName = !msg.senderDid
              ? 'Unknown'
              : msg.senderDid === myDid
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
      sender: m.senderDid ? (friendNames[m.senderDid] || (m.senderDid === myDid ? 'You' : m.senderDid.slice(0, 16))) : 'Unknown',
      content: m.content.type === 'text' ? m.content.text : '',
      timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    })),
  [pinnedMessages, friendNames, myDid]);

  // Call handlers
  const isDm = activeConversation?.type !== 'group';
  const friendDid = activeConversation?.friendDid ?? null;
  const friendDisplayName = friendDid ? (friendNames[friendDid] || friendDid.slice(0, 16)) : null;

  const handleVoiceCall = useCallback(() => {
    if (resolvedConversationId && friendDid && friendDisplayName) {
      startCall(resolvedConversationId, friendDid, friendDisplayName, 'voice');
    }
  }, [resolvedConversationId, friendDid, friendDisplayName, startCall]);

  const handleVideoCall = useCallback(() => {
    if (resolvedConversationId && friendDid && friendDisplayName) {
      startCall(resolvedConversationId, friendDid, friendDisplayName, 'video');
    }
  }, [resolvedConversationId, friendDid, friendDisplayName, startCall]);

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
      <KeyboardAvoidingView
        style={{ flex: 1, flexDirection: 'column' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ChatHeader
          active={activeHeaderInfo}
          rightPanel={rightPanel}
          togglePanel={togglePanel}
          onShowProfile={showProfile}
          showCallButtons={!!resolvedConversationId && (isDm ? !!friendDid : true)}
          onVoiceCall={handleVoiceCall}
          onVideoCall={handleVideoCall}
          showFilesButton={isDm && !!resolvedConversationId}
          onBack={clearActiveId}
        />
        <SlotRenderer slot="chat-header" props={{ conversationId: resolvedConversationId }} />
        {activeCall && activeCall.status !== 'incoming' && activeCall.conversationId === resolvedConversationId ? (
          <ActiveCallPanel
            activeCall={activeCall}
            videoQuality={videoQuality}
            audioQuality={audioQuality}
            callStats={callStats}
            onToggleMute={toggleMute}
            onToggleCamera={toggleCamera}
            onEndCall={() => endCall()}
            onSwitchCamera={() => switchCamera()}
            onVideoQualityChange={setVideoQuality}
            onAudioQualityChange={setAudioQuality}
            onSettings={() => openSettings('audio-video')}
          />
        ) : (
          <ActiveCallBar />
        )}
        <ChatArea
          messages={messages}
          myDid={myDid}
          myDisplayName={identity?.displayName}
          myAvatar={identity?.avatar}
          friendNames={friendNames}
          friendAvatars={friendAvatars}
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
            setForwardMessageId(msgId);
            setForwardDialogOpen(true);
          }}
          onCopyMessage={handleCopyMessage}
          customEmoji={allCommunityEmoji}
          firstUnreadMessageId={firstUnreadMessageId}
        />
        <SlotRenderer slot="chat-toolbar" props={{ conversationId: resolvedConversationId }} />
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
          onAttachmentClick={handleAttachment}
          customEmojis={customEmojiItems.length > 0 ? customEmojiItems : undefined}
          relayUrl={process.env.EXPO_PUBLIC_RELAY_URL || 'https://relay.umbra.chat'}
          onGifSelect={(gif) => {
            if (resolvedConversationId) {
              sendMessage(`gif::${gif.url}`);
            }
          }}
        />
        {/* Safe area spacing below the input */}
        {insets.bottom > 0 && (
          <View style={{ height: insets.bottom }} />
        )}
      </KeyboardAvoidingView>

      {rightPanel && <ResizeHandle onResize={resizePanel} />}
      <RightPanel
        panelWidth={panelWidth}
        visiblePanel={visiblePanel}
        togglePanel={togglePanel}
        onMemberClick={(member, event) => {
          showProfile(member.name, event, member.status === 'online' ? 'online' : 'offline');
        }}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        threadParent={threadParent}
        threadReplies={threadReplies}
        pinnedMessages={pinnedForPanel}
        onUnpinMessage={unpinMessage}
        onThreadReply={handleThreadReply}
        conversationId={resolvedConversationId}
        onSearchResultClick={(messageId) => {
          // TODO: Scroll to the matched message in the chat view
          console.log('[ChatPage] Search result clicked, message:', messageId);
        }}
        onCreateFolder={isDm && resolvedConversationId ? handleCreateSharedFolder : undefined}
        onUploadFile={isDm && resolvedConversationId ? handleAttachment : undefined}
        panelContentWidth={panelContentWidth}
      />
      {/* Plugin right-panel slot removed — plugins use popup overlays instead */}
      <InputDialog
        open={sharedFolderDialogOpen}
        onClose={() => setSharedFolderDialogOpen(false)}
        title="Create Shared Folder"
        label="Folder Name"
        placeholder="e.g. Project Files, Photos..."
        submitLabel="Create"
        submitting={sharedFolderDialogSubmitting}
        onSubmit={handleSharedFolderDialogSubmit}
      />

      <ForwardDialog
        open={forwardDialogOpen}
        onClose={() => { setForwardDialogOpen(false); setForwardMessageId(null); }}
        onSelectConversation={(convoId) => {
          if (forwardMessageId) forwardMessage(forwardMessageId, convoId);
          setForwardDialogOpen(false);
          setForwardMessageId(null);
        }}
      />
    </View>
  );
}
