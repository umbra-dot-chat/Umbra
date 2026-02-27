import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, Pressable, View } from 'react-native';
import {
  Avatar, MessageInput, useTheme,
  CombinedPicker, MentionAutocomplete,
} from '@coexist/wisp-react-native';
import type { EmojiItem } from '@coexist/wisp-core/types/EmojiPicker.types';
import type { GifItem } from '@coexist/wisp-core/types/GifPicker.types';
import { useFriends } from '@/hooks/useFriends';
import { useNetwork } from '@/hooks/useNetwork';
import { useMention } from '@/hooks/useMention';
import { AnimatedPresence } from '@/components/ui/AnimatedPresence';

export interface ChatInputProps {
  message: string;
  onMessageChange: (msg: string) => void;
  emojiOpen: boolean;
  onToggleEmoji: () => void;
  replyingTo: { sender: string; text: string } | null;
  onClearReply: () => void;
  onSubmit: (msg: string) => void;
  /** Editing context — when set, the input is in edit mode */
  editing?: { messageId: string; text: string } | null;
  /** Cancel edit mode */
  onCancelEdit?: () => void;
  /** Called when the attachment button is clicked */
  onAttachmentClick?: () => void;
  /** Custom community emoji for the picker */
  customEmojis?: EmojiItem[];
  /** Relay URL for GIF picker proxy */
  relayUrl?: string;
  /** Called when a GIF is selected */
  onGifSelect?: (gif: GifItem) => void;
}

export function ChatInput({
  message, onMessageChange, emojiOpen, onToggleEmoji,
  replyingTo, onClearReply, onSubmit,
  editing, onCancelEdit, onAttachmentClick,
  customEmojis, relayUrl, onGifSelect,
}: ChatInputProps) {
  const { theme } = useTheme();
  const { friends } = useFriends();
  const { onlineDids } = useNetwork();

  // Build mention users from the real friends list, enriched with relay presence
  const mentionUsers = useMemo(
    () => friends.map((f) => ({
      id: f.did,
      name: f.displayName,
      username: f.displayName.toLowerCase().replace(/\s/g, ''),
      online: onlineDids.has(f.did),
      avatar: <Avatar name={f.displayName} size="sm" status={onlineDids.has(f.did) ? 'online' : undefined} />,
    })),
    [friends, onlineDids],
  );

  // Names list for mention highlighting in the input
  const mentionNames = useMemo(
    () => friends.map((f) => f.displayName),
    [friends],
  );

  const {
    mentionOpen, mentionQuery, filteredUsers,
    activeIndex, setActiveIndex,
    handleTextChange, handleSelectionChange,
    handleKeyPress, insertMention, closeMention,
  } = useMention({ users: mentionUsers });

  const handleValueChange = useCallback(
    (text: string) => {
      onMessageChange(text);
      handleTextChange(text);
    },
    [onMessageChange, handleTextChange],
  );

  const handleMentionSelect = useCallback(
    (user: { id: string; name: string }) => {
      const newText = insertMention(user, message);
      onMessageChange(newText);
    },
    [insertMention, message, onMessageChange],
  );

  // Refs for DOM keydown handler (web only) — prevents arrow/enter/escape
  // from moving the cursor or submitting while the mention dropdown is open.
  // We store ALL values/callbacks in refs so the useEffect has zero deps that
  // change, which means the listener is attached exactly once and never torn
  // down / re-attached mid-interaction.
  const inputWrapperRef = useRef<View>(null);
  const mentionOpenRef = useRef(mentionOpen);
  const messageRef = useRef(message);
  const filteredUsersRef = useRef(filteredUsers);
  const activeIndexRef = useRef(activeIndex);
  const insertMentionRef = useRef(insertMention);
  const onMessageChangeRef = useRef(onMessageChange);
  const closeMentionRef = useRef(closeMention);
  const setActiveIndexRef = useRef(setActiveIndex);

  mentionOpenRef.current = mentionOpen;
  messageRef.current = message;
  filteredUsersRef.current = filteredUsers;
  activeIndexRef.current = activeIndex;
  insertMentionRef.current = insertMention;
  onMessageChangeRef.current = onMessageChange;
  closeMentionRef.current = closeMention;
  setActiveIndexRef.current = setActiveIndex;

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const wrapper = inputWrapperRef.current as unknown as HTMLElement;
    if (!wrapper) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!mentionOpenRef.current) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        const len = filteredUsersRef.current.length;
        if (len > 0) {
          setActiveIndexRef.current((activeIndexRef.current + 1) % len);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        const len = filteredUsersRef.current.length;
        if (len > 0) {
          setActiveIndexRef.current((activeIndexRef.current - 1 + len) % len);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        const selected = filteredUsersRef.current[activeIndexRef.current];
        if (selected) {
          const result = insertMentionRef.current(selected, messageRef.current);
          onMessageChangeRef.current(result);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeMentionRef.current();
      }
    };

    wrapper.addEventListener('keydown', handleKeyDown, true);
    return () => wrapper.removeEventListener('keydown', handleKeyDown, true);
  }, []); // empty deps — listener attached once, reads current values via refs

  return (
    <>
      {/* Transparent backdrop — closes picker when tapping outside */}
      {emojiOpen && (
        <Pressable
          onPress={onToggleEmoji}
          style={Platform.OS === 'web'
            ? { position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0, zIndex: 19 }
            : { position: 'absolute', top: -5000, left: -5000, right: -5000, bottom: -5000, zIndex: 19 }
          }
          accessibilityLabel="Close picker"
        />
      )}
      <AnimatedPresence
        visible={emojiOpen}
        preset="slideUp"
        slideDistance={16}
        style={{ position: 'absolute', bottom: 64, right: 12, zIndex: 20 }}
      >
        <CombinedPicker
          size="md"
          onEmojiSelect={(emoji) => {
            onMessageChange(message + emoji);
            onToggleEmoji();
          }}
          customEmojis={customEmojis}
          relayUrl={relayUrl}
          onGifSelect={(gif) => {
            onGifSelect?.(gif);
            onToggleEmoji();
          }}
        />
      </AnimatedPresence>
      <View ref={inputWrapperRef} style={{ padding: 12 }}>
        {/* Mention autocomplete dropdown */}
        {mentionOpen && (
          <View style={{ position: 'absolute', bottom: 64, left: 12, right: 12, zIndex: 15 }}>
            <MentionAutocomplete
              users={filteredUsers}
              query={mentionQuery}
              activeIndex={activeIndex}
              onActiveIndexChange={setActiveIndex}
              onSelect={handleMentionSelect}
              open={mentionOpen}
            />
          </View>
        )}
        <MessageInput
          value={message}
          onValueChange={handleValueChange}
          onSelectionChange={handleSelectionChange}
          onSubmit={(msg) => {
            closeMention();
            onMessageChange('');
            onClearReply();
            if (editing && onCancelEdit) onCancelEdit();
            onSubmit(msg);
          }}
          placeholder={editing ? 'Edit message...' : 'Type a message...'}
          variant="pill"
          showAttachment={!editing}
          onAttachmentClick={onAttachmentClick}
          showEmoji
          onEmojiClick={onToggleEmoji}
          highlightMentions
          mentionNames={mentionNames}
          editing={editing ? {
            text: editing.text,
            onCancel: onCancelEdit || (() => {}),
          } : undefined}
          replyingTo={!editing && replyingTo ? {
            sender: replyingTo.sender,
            text: replyingTo.text,
            onClear: onClearReply,
          } : undefined}
        />
      </View>
    </>
  );
}
