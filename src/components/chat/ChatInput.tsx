import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { TEST_IDS } from '@/constants/test-ids';
import {
  Avatar, MessageInput, useTheme,
  CombinedPicker, MentionAutocomplete, GradientBorder,
} from '@coexist/wisp-react-native';
import type { EmojiItem } from '@coexist/wisp-core/types/EmojiPicker.types';
import type { GifItem } from '@coexist/wisp-core/types/GifPicker.types';
import { useFriends } from '@/hooks/useFriends';
import { useNetwork } from '@/hooks/useNetwork';
import { useMention } from '@/hooks/useMention';
import { useSlashCommand } from '@/hooks/useSlashCommand';
import type { SlashCommandDef } from '@/hooks/useSlashCommand';
import { usePlugins } from '@/contexts/PluginContext';
import { SlashCommandMenu } from './SlashCommandMenu';
import { AnimatedPresence } from '@/components/ui/AnimatedPresence';
import { getSystemCommands, GHOST_COMMANDS, isGhostBot } from '@/services/SlashCommandRegistry';

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
  /** DID of the friend in this conversation (for bot detection) */
  friendDid?: string | null;
  /** Callback to clear chat messages */
  onClearChat?: () => void;
}

export function ChatInput({
  message, onMessageChange, emojiOpen, onToggleEmoji,
  replyingTo, onClearReply, onSubmit,
  editing, onCancelEdit, onAttachmentClick,
  customEmojis, relayUrl, onGifSelect,
  friendDid, onClearChat,
}: ChatInputProps) {
  const { theme } = useTheme();
  const { friends } = useFriends();
  const { onlineDids } = useNetwork();
  const { pluginSlashCommands } = usePlugins();

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

  const [inputFocused, setInputFocused] = useState(false);

  const {
    mentionOpen, mentionQuery, filteredUsers,
    activeIndex, setActiveIndex,
    handleTextChange, handleSelectionChange,
    handleKeyPress, insertMention, closeMention,
  } = useMention({ users: mentionUsers });

  // ── Slash commands ──────────────────────────────────────────────────────

  // Build the combined slash command list
  const allSlashCommands = useMemo(() => {
    const commands: SlashCommandDef[] = [];

    // System commands (always available)
    commands.push(...getSystemCommands({
      onClear: onClearChat,
      onHelp: () => {
        // Show help — for now just log, can wire to a modal later
        console.log('[System] Help requested');
      },
    }));

    // Ghost commands (when chatting with a Ghost bot)
    if (isGhostBot(friendDid)) {
      commands.push(...GHOST_COMMANDS);
    }

    // Plugin slash commands
    commands.push(...pluginSlashCommands);

    return commands;
  }, [friendDid, pluginSlashCommands, onClearChat]);

  const {
    slashOpen,
    slashQuery,
    filteredCommands,
    activeIndex: slashActiveIndex,
    setActiveIndex: setSlashActiveIndex,
    handleTextChange: handleSlashTextChange,
    selectCommand,
    closeSlash,
  } = useSlashCommand({ commands: allSlashCommands });

  // ── Value change handler ────────────────────────────────────────────────

  const handleValueChange = useCallback(
    (text: string) => {
      onMessageChange(text);
      handleTextChange(text);
      handleSlashTextChange(text);
    },
    [onMessageChange, handleTextChange, handleSlashTextChange],
  );

  const handleMentionSelect = useCallback(
    (user: { id: string; name: string }) => {
      const newText = insertMention(user, message);
      onMessageChange(newText);
    },
    [insertMention, message, onMessageChange],
  );

  const handleSlashSelect = useCallback(
    (cmd: SlashCommandDef) => {
      const { newText, shouldSend } = selectCommand(cmd, message);
      if (shouldSend) {
        // Clear and submit
        onMessageChange('');
        onClearReply();
        onSubmit(newText);
      } else {
        onMessageChange(newText);
      }
    },
    [selectCommand, message, onMessageChange, onClearReply, onSubmit],
  );

  // ── Refs for DOM keydown handler (web only) ─────────────────────────────
  const inputWrapperRef = useRef<View>(null);
  const mentionOpenRef = useRef(mentionOpen);
  const slashOpenRef = useRef(slashOpen);
  const messageRef = useRef(message);
  const filteredUsersRef = useRef(filteredUsers);
  const filteredCommandsRef = useRef(filteredCommands);
  const activeIndexRef = useRef(activeIndex);
  const slashActiveIndexRef = useRef(slashActiveIndex);
  const insertMentionRef = useRef(insertMention);
  const onMessageChangeRef = useRef(onMessageChange);
  const closeMentionRef = useRef(closeMention);
  const closeSlashRef = useRef(closeSlash);
  const setActiveIndexRef = useRef(setActiveIndex);
  const setSlashActiveIndexRef = useRef(setSlashActiveIndex);
  const handleSlashSelectRef = useRef(handleSlashSelect);
  const onSubmitRef = useRef(onSubmit);

  mentionOpenRef.current = mentionOpen;
  slashOpenRef.current = slashOpen;
  messageRef.current = message;
  filteredUsersRef.current = filteredUsers;
  filteredCommandsRef.current = filteredCommands;
  activeIndexRef.current = activeIndex;
  slashActiveIndexRef.current = slashActiveIndex;
  insertMentionRef.current = insertMention;
  onMessageChangeRef.current = onMessageChange;
  closeMentionRef.current = closeMention;
  closeSlashRef.current = closeSlash;
  setActiveIndexRef.current = setActiveIndex;
  setSlashActiveIndexRef.current = setSlashActiveIndex;
  handleSlashSelectRef.current = handleSlashSelect;
  onSubmitRef.current = onSubmit;

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const wrapper = inputWrapperRef.current as unknown as HTMLElement;
    if (!wrapper) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Slash command menu takes priority when open
      if (slashOpenRef.current && filteredCommandsRef.current.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          e.stopPropagation();
          const len = filteredCommandsRef.current.length;
          setSlashActiveIndexRef.current((prev: number) => (prev + 1) % len);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          e.stopPropagation();
          const len = filteredCommandsRef.current.length;
          setSlashActiveIndexRef.current((prev: number) => (prev - 1 + len) % len);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          const selected = filteredCommandsRef.current[slashActiveIndexRef.current];
          if (selected) {
            handleSlashSelectRef.current(selected);
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          closeSlashRef.current();
        } else if (e.key === 'Tab') {
          e.preventDefault();
          e.stopPropagation();
          // Tab = select the highlighted command and fill it in without sending
          const selected = filteredCommandsRef.current[slashActiveIndexRef.current];
          if (selected) {
            const fullCommand = `/${selected.command} `;
            onMessageChangeRef.current(fullCommand);
            closeSlashRef.current();
          }
        }
        return;
      }

      // Mention menu
      if (mentionOpenRef.current) {
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
      }
    };

    const handleFocusIn = () => setInputFocused(true);
    const handleFocusOut = () => setInputFocused(false);

    wrapper.addEventListener('keydown', handleKeyDown, true);
    wrapper.addEventListener('focusin', handleFocusIn);
    wrapper.addEventListener('focusout', handleFocusOut);
    return () => {
      wrapper.removeEventListener('keydown', handleKeyDown, true);
      wrapper.removeEventListener('focusin', handleFocusIn);
      wrapper.removeEventListener('focusout', handleFocusOut);
    };
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
          // GIFs disabled for now — omit relayUrl to hide the emoji/GIF tab bar
          // relayUrl={relayUrl}
          // onGifSelect={(gif) => {
          //   onGifSelect?.(gif);
          //   onToggleEmoji();
          // }}
        />
      </AnimatedPresence>
      <View ref={inputWrapperRef} testID={TEST_IDS.INPUT.CONTAINER} style={{ padding: 12 }}>
        {/* Slash command autocomplete menu */}
        {slashOpen && filteredCommands.length > 0 && !mentionOpen && (
          <View style={{ position: 'absolute', bottom: 64, left: 12, right: 12, zIndex: 16 }}>
            <SlashCommandMenu
              commands={filteredCommands}
              query={slashQuery}
              activeIndex={slashActiveIndex}
              onActiveIndexChange={setSlashActiveIndex}
              onSelect={handleSlashSelect}
              open={slashOpen}
            />
          </View>
        )}
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
        <GradientBorder
          visible={inputFocused}
          animated={inputFocused}
          radius={22}
          width={2}
          speed={3000}
        >
          <MessageInput
            testID={TEST_IDS.INPUT.TEXT_INPUT}
            value={message}
            onValueChange={handleValueChange}
            onSelectionChange={handleSelectionChange}
            onSubmit={(msg) => {
              closeMention();
              closeSlash();
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
        </GradientBorder>
      </View>
    </>
  );
}
