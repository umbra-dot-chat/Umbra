import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { KeyboardAvoidingView, Platform, Image, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, GradientText, useTheme, Box } from '@coexist/wisp-react-native';
import { TEST_IDS } from '@/constants/test-ids';
import { useHoverMessage } from '@/hooks/useHoverMessage';
import { useRightPanel } from '@/hooks/useRightPanel';
import { useProfilePopoverContext } from '@/contexts/ProfilePopoverContext';
import { useActiveConversationData } from '@/hooks/useActiveConversationData';
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
import { ActiveCallPanel } from '@/components/call/ActiveCallPanel';
import type { CallEndReason } from '@/types/call';
import { useCall } from '@/hooks/useCall';
import { pickFile, pickFileHandle } from '@/utils/filePicker';
import { triggerWebDownload } from '@/utils/fileDownload';
import { PendingAttachmentBar } from '@/components/chat/PendingAttachmentBar';
import type { PendingAttachment } from '@/components/chat/PendingAttachmentBar';
import { InputDialog } from '@/components/ui/InputDialog';
import { ForwardDialog } from '@/components/chat/ForwardDialog';
import { GroupSettingsDialog } from '@/components/groups/GroupSettingsDialog';
import { useSettingsDialog } from '@/contexts/SettingsDialogContext';
import { ResizeHandle } from '@/components/ui/ResizeHandle';
import { useAllCustomEmoji } from '@/hooks/useAllCustomEmoji';
import { useNetwork } from '@/hooks/useNetwork';
import { useFileTransfer } from '@/hooks/useFileTransfer';
import { useTranslation } from 'react-i18next';
import { dbg } from '@/utils/debug';

const SRC = 'ChatPage';

// ─────────────────────────────────────────────────────────────────────────────
// Empty conversation state
// ─────────────────────────────────────────────────────────────────────────────

// Ghost logo assets — theme-aware
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ghostBlack = require('@/assets/images/ghost-black.png');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ghostWhite = require('@/assets/images/ghost-white.png');

function EmptyConversation() {
  const { t: tc } = useTranslation('common');
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';
  const ghostSource = isDark ? ghostWhite : ghostBlack;
  const { width } = useWindowDimensions();
  const isCompact = width < 500;
  const ghostSize = isCompact ? 160 : 275;
  return (
    <Box testID={TEST_IDS.MAIN.EMPTY_STATE} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: isCompact ? 24 : 40 }}>
      <Image
        source={ghostSource}
        style={{ width: ghostSize, height: ghostSize, marginBottom: 16 }}
        resizeMode="contain"
      />
      <Text testID={TEST_IDS.MAIN.WELCOME_TEXT} size={isCompact ? 'lg' : 'display-sm'} weight="bold" style={{ color: theme.colors.text.primary, marginBottom: 8 }}>
        {tc('welcomeToUmbra')}
      </Text>
      <GradientText
        colors={['#8B5CF6', '#EC4899', '#3B82F6', '#8B5CF6']}
        animated
        speed={10000}
        style={{ fontSize: isCompact ? 13 : 14, textAlign: 'center', maxWidth: 400, marginBottom: 16 } as any}
      >
        {tc('welcomeDescription')}
      </GradientText>
      <HelpIndicator
        id="chat-empty"
        title={tc('gettingStarted')}
        icon="i"
        priority={80}
        size={18}
      >
        <HelpText>
          {tc('helpStartConversation')}
        </HelpText>
        <HelpHighlight icon={<MessageIcon size={22} color={theme.colors.accent.primary} />}>
          {tc('helpFriendConversation')}
        </HelpHighlight>
        <HelpListItem>{tc('helpNavFriends')}</HelpListItem>
        <HelpListItem>{tc('helpPasteDid')}</HelpListItem>
        <HelpListItem>{tc('helpAcceptedConvo')}</HelpListItem>
      </HelpIndicator>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  if (__DEV__) dbg.trackRender('ChatPage');
  const { identity } = useAuth();
  const { service } = useUmbra();
  const myDid = identity?.did ?? '';
  const insets = Platform.OS !== 'web' ? useSafeAreaInsets() : { top: 0, bottom: 0 };

  // Active conversation — shared with sidebar via context
  const { activeId: activeConversationId, setActiveId, clearActiveId, searchPanelRequested, clearSearchPanelRequest } = useActiveConversation();

  // Memoized selector: only re-renders when the ACTIVE conversation changes,
  // not when the full conversation list updates. This breaks the render cascade
  // where every incoming message caused ConversationsProvider → ChatPage → ChatArea.
  const { activeConversation, resolvedConversationId, isLoading: convsLoading, hasConversations } = useActiveConversationData(activeConversationId);

  // Data hooks
  const { friends } = useFriends();
  const { groups, getMembers } = useGroups();
  const { onlineDids } = useNetwork();
  const { activeTransfers } = useFileTransfer();

  // Build a map of active P2P uploads keyed by fileId for the chat area
  const activeUploadsMap = useMemo(() => {
    const map = new Map<string, { progress: number }>();
    for (const t of activeTransfers) {
      if (t.direction === 'upload' && t.totalBytes > 0) {
        map.set(t.fileId, { progress: t.bytesTransferred / t.totalBytes });
      }
    }
    return map;
  }, [activeTransfers]);

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

  // Messages for the active conversation
  const {
    messages, isLoading: msgsLoading, sendMessage, sendFileMessage,
    editMessage, deleteMessage, pinMessage, unpinMessage,
    addReaction, removeReaction, forwardMessage,
    getThreadReplies, sendThreadReply, pinnedMessages,
    firstUnreadMessageId, markAsRead,
  } = useMessages(resolvedConversationId, activeConversation?.groupId);

  // Mark messages as read when viewing a conversation.
  //
  // Uses a ref for markAsRead to avoid restarting the interval when the
  // callback identity changes (its deps include service, conversationId,
  // getRelayWs, myDid — any change created a new callback → effect re-ran
  // → cleared interval → called markAsRead immediately → new interval,
  // causing hundreds of WASM calls that froze the app).
  const markAsReadRef = useRef(markAsRead);
  markAsReadRef.current = markAsRead;

  useEffect(() => {
    if (!resolvedConversationId) return;

    // Mark once after a short delay (let messages load first)
    const timeout = setTimeout(() => markAsReadRef.current(), 500);

    // Then poll every 5 seconds for new unreads while viewing
    const interval = setInterval(() => { markAsReadRef.current(); }, 5000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [resolvedConversationId]);

  // Group member info for the active conversation (count + names for AvatarGroup)
  const [activeMemberCount, setActiveMemberCount] = useState<number | undefined>(undefined);
  const [activeMemberNames, setActiveMemberNames] = useState<string[]>([]);
  useEffect(() => {
    if (activeConversation?.type === 'group' && activeConversation.groupId) {
      getMembers(activeConversation.groupId).then((members) => {
        setActiveMemberCount(members.length);
        setActiveMemberNames(members.map(m => m.displayName || m.memberDid.slice(0, 8)));
      }).catch(() => {
        setActiveMemberCount(undefined);
        setActiveMemberNames([]);
      });
    } else {
      setActiveMemberCount(undefined);
      setActiveMemberNames([]);
    }
  }, [activeConversation, getMembers, groups]);

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

  // Pending file attachment — queued until user sends the message
  const [pendingAttachment, setPendingAttachment] = useState<(PendingAttachment & { storageChunksJson?: string }) | null>(null);

  // Edit mode state
  const [editingMessage, setEditingMessage] = useState<{ messageId: string; text: string } | null>(null);

  // Group settings dialog state
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);

  // Forward dialog state
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [forwardMessageId, setForwardMessageId] = useState<string | null>(null);

  // Panel & search state
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(null);

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
    activeCall, startCall, startGroupCall, acceptCall, toggleMute, toggleDeafen, toggleCamera, endCall,
    videoQuality, audioQuality, setVideoQuality, setAudioQuality,
    switchCamera, callStats, ghostMetadata,
    isScreenSharing, startScreenShare, stopScreenShare, screenShareStream,
    remoteScreenShareStream,
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
      // Use actual member names for AvatarGroup, fall back to group name
      const memberNames = activeMemberNames.length > 0
        ? activeMemberNames
        : [group?.name ?? 'Group'];
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
      avatar: activeConversation.friendDid
        ? friendAvatars[activeConversation.friendDid]
        : undefined,
    };
  }, [activeConversation, groups, friendNames, friendAvatars, onlineDids, activeMemberCount, activeMemberNames]);

  // Handle sending a message (or editing)
  const handleSubmit = useCallback(async (msg: string) => {
    setEmojiOpen(false);
    const hasText = msg.trim().length > 0;
    const hasFile = pendingAttachment?.status === 'ready' && pendingAttachment.storageChunksJson;

    // Nothing to send
    if (!hasText && !hasFile) return;

    sendStopTyping(); // Clear typing indicator on send

    if (editingMessage) {
      await editMessage(editingMessage.messageId, msg.trim());
      setEditingMessage(null);
    } else if (resolvedConversationId) {
      // Send the queued file attachment first (if any)
      if (hasFile && pendingAttachment) {
        await sendFileMessage({
          fileId: pendingAttachment.fileId,
          filename: pendingAttachment.filename,
          size: pendingAttachment.size,
          mimeType: pendingAttachment.mimeType,
          storageChunksJson: pendingAttachment.storageChunksJson!,
        });
        setPendingAttachment(null);
      }
      // Then send the text message (if any)
      if (hasText) {
        await sendMessage(msg.trim());
      }
    }
  }, [editingMessage, editMessage, resolvedConversationId, sendMessage, sendFileMessage, sendStopTyping, pendingAttachment]);

  // Handle send triggered from the attachment bar (supports file-only sends)
  const handleSendFromBar = useCallback(() => {
    const msg = message;
    setMessage('');
    setReplyingTo(null);
    handleSubmit(msg);
  }, [message, handleSubmit]);

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

  // Handle file attachment — queues the file; actual send happens in handleSubmit
  const handleAttachment = useCallback(async () => {
    if (!service || !resolvedConversationId) return;
    try {
      // Phase 1: Get file metadata instantly (no data read yet)
      const handle = await pickFileHandle();

      // Fallback for mobile / unsupported — use legacy one-shot picker
      if (!handle) {
        const picked = await pickFile();
        if (!picked) return;
        const fileId = crypto.randomUUID();
        setPendingAttachment({
          fileId, filename: picked.filename, size: picked.size,
          mimeType: picked.mimeType, status: 'processing', progress: 0,
        });
        await new Promise<void>((resolve) => requestAnimationFrame(() => { requestAnimationFrame(() => resolve()); }));
        const manifest = await service.chunkFile(fileId, picked.filename, picked.dataBase64);
        setPendingAttachment((prev) => {
          if (!prev || prev.fileId !== fileId) return prev;
          return { ...prev, status: 'ready', progress: 1, storageChunksJson: JSON.stringify(manifest) };
        });
        return;
      }

      const fileId = crypto.randomUUID();

      // Show attachment bar immediately with 0% progress
      setPendingAttachment({
        fileId,
        filename: handle.filename,
        size: handle.size,
        mimeType: handle.mimeType,
        status: 'processing',
        progress: 0,
      });

      // Phase 2: Read raw bytes from disk (fast on SSD)
      const buffer = await handle.file.arrayBuffer();
      setPendingAttachment((prev) => {
        if (!prev || prev.fileId !== fileId) return prev;
        return { ...prev, progress: 0.5 };
      });

      // Yield to let React render the progress update
      await new Promise<void>((resolve) => requestAnimationFrame(() => { requestAnimationFrame(() => resolve()); }));

      // Phase 3: Pass raw bytes directly to WASM — no base64 conversion needed
      const manifest = await service.chunkFileBytes(fileId, handle.filename, new Uint8Array(buffer));

      // Done — update to "ready" state
      setPendingAttachment((prev) => {
        if (!prev || prev.fileId !== fileId) return prev;
        return {
          ...prev,
          status: 'ready',
          progress: 1,
          storageChunksJson: JSON.stringify(manifest),
        };
      });
    } catch (err) {
      dbg.error('messages', 'File attachment failed', { error: (err as Error)?.message ?? String(err) }, SRC);
      setPendingAttachment(null);
    }
  }, [service, resolvedConversationId]);

  // Handle file download from a file attachment card
  const handleFileDownload = useCallback(async (fileId: string, filename: string, mimeType: string) => {
    if (!service) return;
    try {
      const reassembled = await service.reassembleFile(fileId);
      if (reassembled && reassembled.dataB64) {
        triggerWebDownload(reassembled.dataB64, reassembled.filename || filename, mimeType);
      } else {
        dbg.warn('service', 'reassembleFile returned no data', { fileId }, SRC);
      }
    } catch (err) {
      dbg.error('service', 'File download failed', { error: (err as Error)?.message ?? String(err) }, SRC);
    }
  }, [service]);

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
      if (__DEV__) dbg.info('service', 'Shared folder created', { name: name.trim() }, SRC);
      setSharedFolderDialogOpen(false);
    } catch (err) {
      dbg.error('service', 'Failed to create shared folder', { error: (err as Error)?.message ?? String(err) }, SRC);
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

  // Subscribe to real-time thread reply events ONLY when the thread panel
  // is open. This avoids adding a permanent onMessageEvent listener that
  // fires on every message even when threads aren't being viewed.
  const threadParentRef = useRef(threadParent);
  threadParentRef.current = threadParent;
  const friendNamesRef = useRef(friendNames);
  friendNamesRef.current = friendNames;

  useEffect(() => {
    if (!service || !threadParent) return;

    const unsubscribe = service.onMessageEvent((event: any) => {
      if (event.type === 'threadReplyReceived' && event.parentId && event.message) {
        const current = threadParentRef.current;
        if (current && current.id === event.parentId) {
          const msg = event.message;
          const names = friendNamesRef.current;
          const senderName = !msg.senderDid
            ? 'Unknown'
            : msg.senderDid === myDid
              ? 'You'
              : (names[msg.senderDid] || msg.senderDid.slice(0, 16));
          setThreadReplies((prev) => {
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
      }
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, threadParent?.id, myDid]);

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
    if (!resolvedConversationId) return;
    setActiveId(resolvedConversationId);
    if (activeConversation?.type === 'group' && activeConversation.groupId) {
      const groupId = activeConversation.groupId;
      getMembers(groupId).then((members) => {
        const memberDids = members.map(m => m.memberDid);
        const memberNames: Record<string, string> = {};
        for (const m of members) memberNames[m.memberDid] = m.displayName || friendNames[m.memberDid] || m.memberDid.slice(0, 16);
        startGroupCall(resolvedConversationId, groupId, memberDids, memberNames, 'voice');
      }).catch(() => {});
    } else if (friendDid && friendDisplayName) {
      startCall(resolvedConversationId, friendDid, friendDisplayName, 'voice');
    }
  }, [resolvedConversationId, friendDid, friendDisplayName, startCall, startGroupCall, setActiveId, activeConversation, getMembers, friendNames]);

  const handleVideoCall = useCallback(() => {
    if (!resolvedConversationId) return;
    setActiveId(resolvedConversationId);
    if (activeConversation?.type === 'group' && activeConversation.groupId) {
      const groupId = activeConversation.groupId;
      getMembers(groupId).then((members) => {
        const memberDids = members.map(m => m.memberDid);
        const memberNames: Record<string, string> = {};
        for (const m of members) memberNames[m.memberDid] = m.displayName || friendNames[m.memberDid] || m.memberDid.slice(0, 16);
        startGroupCall(resolvedConversationId, groupId, memberDids, memberNames, 'video');
      }).catch(() => {});
    } else if (friendDid && friendDisplayName) {
      startCall(resolvedConversationId, friendDid, friendDisplayName, 'video');
    }
  }, [resolvedConversationId, friendDid, friendDisplayName, startCall, startGroupCall, setActiveId, activeConversation, getMembers, friendNames]);

  // No conversations yet — show welcome
  if (!convsLoading && !hasConversations) {
    return (
      <Box testID={TEST_IDS.MAIN.CONTAINER} style={{ flex: 1 }}>
        <EmptyConversation />
      </Box>
    );
  }

  return (
    <Box testID={TEST_IDS.MAIN.CONTAINER} style={{ flex: 1, flexDirection: 'row' }}>
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
          onGroupSettings={activeConversation?.groupId ? () => setGroupSettingsOpen(true) : undefined}
        />
        <SlotRenderer slot="chat-header" props={{ conversationId: resolvedConversationId }} />
        {activeCall && activeCall.status !== 'incoming' && activeCall.conversationId === resolvedConversationId && (
          <ActiveCallPanel
            activeCall={activeCall}
            localDid={myDid}
            videoQuality={videoQuality}
            audioQuality={audioQuality}
            callStats={callStats}
            ghostMetadata={ghostMetadata}
            isScreenSharing={isScreenSharing || !!remoteScreenShareStream}
            screenShareStream={screenShareStream ?? remoteScreenShareStream}
            onToggleMute={toggleMute}
            onToggleDeafen={toggleDeafen}
            onToggleCamera={toggleCamera}
            onToggleScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
            onEndCall={() => endCall()}
            onSwitchCamera={() => switchCamera()}
            onVideoQualityChange={setVideoQuality}
            onAudioQualityChange={setAudioQuality}
            onSettings={() => openSettings('audio-video')}
          />
        )}
        <ChatArea
          groupId={activeConversation?.groupId}
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
          onFileDownload={handleFileDownload}
          activeUploads={activeUploadsMap}
          scrollToMessageId={scrollToMessageId}
          onScrollToComplete={() => setScrollToMessageId(null)}
          activeCall={activeCall?.conversationId === resolvedConversationId ? activeCall : null}
          isGroupCall={activeConversation?.type === 'group'}
          onAcceptCall={() => acceptCall()}
          onEndCall={(reason) => endCall(reason as CallEndReason)}
          onCallBack={(callType) => callType === 'video' ? handleVideoCall() : handleVoiceCall()}
        />
        <SlotRenderer slot="chat-toolbar" props={{ conversationId: resolvedConversationId }} />
        {pendingAttachment && (
          <PendingAttachmentBar
            attachment={pendingAttachment}
            onRemove={() => setPendingAttachment(null)}
            onSend={handleSendFromBar}
          />
        )}
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
          friendDid={friendDid}
          friendDisplayName={friendDisplayName}
        />
        {/* Safe area spacing below the input */}
        {insets.bottom > 0 && (
          <Box style={{ height: insets.bottom }} />
        )}
      </KeyboardAvoidingView>

      {rightPanel && <ResizeHandle onResize={resizePanel} />}
      <RightPanel
        panelWidth={panelWidth}
        visiblePanel={visiblePanel}
        togglePanel={togglePanel}
        onMemberClick={(member, event) => {
          showProfile(member.name, event, member.status === 'online' ? 'online' : 'offline', member.avatar);
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
          setScrollToMessageId(messageId);
        }}
        onCreateFolder={isDm && resolvedConversationId ? handleCreateSharedFolder : undefined}
        onUploadFile={isDm && resolvedConversationId ? handleAttachment : undefined}
        panelContentWidth={panelContentWidth}
      />
      <SlotRenderer slot="right-panel" props={{ conversationId: resolvedConversationId }} />
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

      <GroupSettingsDialog
        open={groupSettingsOpen}
        onClose={() => setGroupSettingsOpen(false)}
        groupId={activeConversation?.groupId}
      />
    </Box>
  );
}
