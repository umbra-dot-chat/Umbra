import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable } from 'react-native';
import type { View } from 'react-native';
import { TEST_IDS } from '@/constants/test-ids';
import {
  Avatar, Box, MessageInput, Text, useTheme,
  CombinedPicker, MentionAutocomplete, GradientBorder, GradientText,
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
import { getSystemCommands, GHOST_COMMANDS, SWARM_COMMANDS, isGhostBot } from '@/services/SlashCommandRegistry';
import { useAppTheme } from '@/contexts/ThemeContext';
import { opacity } from '@coexist/wisp-core/tokens';
import { dbg } from '@/utils/debug';

const SRC = 'ChatInput';

// ---------------------------------------------------------------------------
// Ghost text helper — computes the inline completion suggestion
// ---------------------------------------------------------------------------

function getGhostText(
  message: string,
  commands: SlashCommandDef[],
): string {
  if (!message.startsWith('/') || message.length < 2) return '';
  const typed = message.slice(1).toLowerCase(); // e.g. "ghost q"
  if (!typed) return '';

  // Find best-matching command whose command text starts with the typed text
  const match = commands.find((cmd) =>
    cmd.command.toLowerCase().startsWith(typed) && cmd.command.toLowerCase() !== typed,
  );
  if (!match) return '';

  // Return only the untyped portion
  const rest = match.command.slice(typed.length);
  // Append args hint if present
  const argsSuffix = match.args ? ` ${match.args}` : '';
  return rest + argsSuffix;
}

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
  /** Display name of the friend (for bot detection fallback) */
  friendDisplayName?: string | null;
  /** Callback to clear chat messages */
  onClearChat?: () => void;
}

export function ChatInput({
  message, onMessageChange, emojiOpen, onToggleEmoji,
  replyingTo, onClearReply, onSubmit,
  editing, onCancelEdit, onAttachmentClick,
  customEmojis, relayUrl, onGifSelect,
  friendDid, friendDisplayName, onClearChat,
}: ChatInputProps) {
  if (__DEV__) dbg.trackRender('ChatInput');
  const { t } = useTranslation('chat');
  const { theme } = useTheme();
  const { motionPreferences } = useAppTheme();
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
        if (__DEV__) dbg.info('messages', 'Help requested', undefined, SRC);
      },
    }));

    // Ghost commands (when chatting with a Ghost bot)
    if (isGhostBot(friendDid, friendDisplayName)) {
      commands.push(...GHOST_COMMANDS);
      commands.push(...SWARM_COMMANDS);
    }

    // Plugin slash commands
    commands.push(...pluginSlashCommands);

    return commands;
  }, [friendDid, friendDisplayName, pluginSlashCommands, onClearChat]);

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

  // ── Ghost text autocomplete (web only) ──────────────────────────────────

  const ghostText = useMemo(
    () => Platform.OS === 'web' ? getGhostText(message, allSlashCommands) : '',
    [message, allSlashCommands],
  );

  // ── Command highlight detection ──────────────────────────────────────────
  // Determine if the current message is a valid/exact slash command match
  const commandHighlight = useMemo(() => {
    if (!message.startsWith('/') || message.length < 2) return null;
    const afterSlash = message.slice(1);

    // Find exact match: the typed text equals the command or starts with "command "
    const exactMatch = allSlashCommands.find((cmd) => {
      const cmdText = cmd.command.toLowerCase();
      const typed = afterSlash.toLowerCase();
      return typed === cmdText || typed.startsWith(cmdText + ' ');
    });

    if (exactMatch) {
      const commandText = '/' + exactMatch.command;
      const argsText = message.slice(commandText.length);
      return { commandText, argsText, command: exactMatch };
    }

    // Partial match: a command starts with what the user has typed so far
    const typed = afterSlash.toLowerCase();
    const partialMatch = allSlashCommands.find((cmd) =>
      cmd.command.toLowerCase().startsWith(typed)
    );

    if (partialMatch) {
      // Highlight the entire typed text as the command (it's a valid prefix)
      return { commandText: message, argsText: '', command: partialMatch };
    }

    return null;
  }, [message, allSlashCommands]);

  // Ref for ghost text measurement (hidden span to measure typed text width)
  const ghostMeasureRef = useRef<HTMLSpanElement | null>(null);
  const [ghostLeftOffset, setGhostLeftOffset] = useState(0);

  // Runtime-measured textarea offsets (relative to ghost overlay container)
  const [textareaLeftOffset, setTextareaLeftOffset] = useState(52); // sensible default (9px hPad + 34px icon + 8px gap + 1px border)
  const [textareaRightPad, setTextareaRightPad] = useState(94); // emoji(34) + send(34) + gaps + pad
  // Refs for overlay elements — used by useLayoutEffect to correct vertical positioning
  const cmdOverlayRef = useRef<View>(null);
  const ghostOverlayRef = useRef<View>(null);
  const ghostContainerRef = useRef<View>(null);

  // Typography values from theme — ensures overlays match MessageInput exactly
  const fontFamily = theme.typography.fontFamily;
  const fontSize = theme.typography.sizes.sm.fontSize; // 14
  const lineHeight = fontSize * 1.4; // 19.6 — matches MessageInput's internal computation

  // Measure textarea horizontal/right offsets at runtime for precise overlay alignment.
  // Re-measures on focus change, reply/edit bar toggle, and container resize.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const measure = () => {
      const container = ghostContainerRef.current as unknown as HTMLElement;
      if (!container) return;
      const textarea = container.querySelector('textarea');
      if (!textarea) return;
      const containerRect = container.getBoundingClientRect();
      const textareaRect = textarea.getBoundingClientRect();
      const textareaStyles = window.getComputedStyle(textarea);
      const padLeft = parseFloat(textareaStyles.paddingLeft) || 0;
      const padRight = parseFloat(textareaStyles.paddingRight) || 0;
      setTextareaLeftOffset((textareaRect.left - containerRect.left) + padLeft);
      setTextareaRightPad((containerRect.right - textareaRect.right) + padRight);
    };
    const raf = requestAnimationFrame(measure);
    // Re-measure on container resize (handles window resize, sidebar toggle, etc.)
    let ro: ResizeObserver | undefined;
    const container = ghostContainerRef.current as unknown as HTMLElement;
    if (container && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => requestAnimationFrame(measure));
      ro.observe(container);
    }
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, [!!replyingTo, !!editing]);

  // Correct vertical alignment of overlays AFTER each render via direct DOM manipulation.
  // useLayoutEffect fires before browser paint, so there's no visual flash.
  useLayoutEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      const container = ghostContainerRef.current as unknown as HTMLElement;
      if (!container || !container.isConnected) return;
      const textarea = container.querySelector('textarea');
      if (!textarea) return;
      const containerRect = container.getBoundingClientRect();
      const textareaRect = textarea.getBoundingClientRect();
      // Guard: skip if elements have no dimensions (detached/hidden)
      if (containerRect.width === 0 || textareaRect.width === 0) return;
      const padTop = parseFloat(window.getComputedStyle(textarea).paddingTop) || 0;
      const topPx = `${(textareaRect.top - containerRect.top) + padTop}px`;
      // Apply to command highlight overlay
      const cmdEl = cmdOverlayRef.current as unknown as HTMLElement;
      if (cmdEl) cmdEl.style.paddingTop = topPx;
      // Apply to ghost text overlay
      const ghostEl = ghostOverlayRef.current as unknown as HTMLElement;
      if (ghostEl) ghostEl.style.paddingTop = topPx;
    } catch {
      // Guard against DOM measurement errors on detached elements
    }
  }, [commandHighlight, ghostText, replyingTo, editing]);

  // Measure typed text width to position ghost text overlay
  useEffect(() => {
    if (Platform.OS !== 'web' || !ghostText) return;
    // Use requestAnimationFrame for DOM measurement
    const raf = requestAnimationFrame(() => {
      const span = ghostMeasureRef.current;
      if (span) {
        setGhostLeftOffset(span.offsetWidth);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [message, ghostText]);

  // ── Transparent textarea text for command highlighting (web only) ───────
  // Also stores a ref to the textarea so we can eagerly reset on submit.
  const transparentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const container = ghostContainerRef.current as unknown as HTMLElement;
    if (!container) return;
    const textarea = container.querySelector('textarea');
    if (!textarea) return;

    transparentTextareaRef.current = textarea;

    if (commandHighlight) {
      textarea.style.color = 'transparent';
      textarea.style.caretColor = theme.colors.text.primary;
    } else {
      textarea.style.color = '';
      textarea.style.caretColor = '';
    }

    // Cleanup: always reset textarea color when effect re-runs or unmounts
    return () => {
      textarea.style.color = '';
      textarea.style.caretColor = '';
    };
  }, [commandHighlight, theme.colors.text.primary]);

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
      try {
        const { newText, shouldSend } = selectCommand(cmd, message);
        if (__DEV__) dbg.debug('messages', `slash command: /${cmd.command}`, { shouldSend, len: newText.length }, SRC);
        if (shouldSend) {
          // Eagerly reset textarea color before React re-renders (prevents stuck transparent text)
          if (Platform.OS === 'web' && transparentTextareaRef.current) {
            transparentTextareaRef.current.style.color = '';
            transparentTextareaRef.current.style.caretColor = '';
          }
          // Clear and submit
          onMessageChange('');
          onClearReply();
          onSubmit(newText);
        } else {
          onMessageChange(newText);
        }
      } catch (err) {
        // Defensive: if command execution fails, at least clear the input and reset state
        if (__DEV__) dbg.error('messages', 'handleSlashSelect error', { error: String(err) }, SRC);
        if (Platform.OS === 'web' && transparentTextareaRef.current) {
          transparentTextareaRef.current.style.color = '';
          transparentTextareaRef.current.style.caretColor = '';
        }
        onMessageChange('');
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
  const ghostTextRef = useRef(ghostText);
  const allSlashCommandsRef = useRef(allSlashCommands);

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
  ghostTextRef.current = ghostText;
  allSlashCommandsRef.current = allSlashCommands;

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const wrapper = inputWrapperRef.current as unknown as HTMLElement;
    if (!wrapper) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      try {
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
          const idx = slashActiveIndexRef.current;
          const cmds = filteredCommandsRef.current;
          const selected = idx >= 0 && idx < cmds.length ? cmds[idx] : cmds[0];
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
          const idx = slashActiveIndexRef.current;
          const cmds = filteredCommandsRef.current;
          const selected = idx >= 0 && idx < cmds.length ? cmds[idx] : cmds[0];
          if (selected) {
            const fullCommand = `/${selected.command} `;
            onMessageChangeRef.current(fullCommand);
            closeSlashRef.current();
          }
        }
        return;
      }

      // Ghost text Tab acceptance (when slash menu is NOT open)
      if (e.key === 'Tab' && ghostTextRef.current) {
        e.preventDefault();
        e.stopPropagation();
        // Accept the ghost text — fill the full command
        const currentMsg = messageRef.current;
        const fullText = currentMsg + ghostTextRef.current + ' ';
        onMessageChangeRef.current(fullText);
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
      } catch (err) {
        // Defensive: prevent keydown errors from crashing the page
        if (__DEV__) dbg.error('render', 'keydown handler error', { error: String(err) }, SRC);
      }
    };

    const handleFocusIn = () => {
      if (__DEV__) dbg.trace('render', 'input FOCUS', undefined, SRC);
      setInputFocused(true);
    };
    const handleFocusOut = () => {
      if (__DEV__) dbg.trace('render', 'input BLUR', undefined, SRC);
      setInputFocused(false);
    };

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
      <Box ref={inputWrapperRef} testID={TEST_IDS.INPUT.CONTAINER} style={{ padding: 12 }}>
        {/* Slash command autocomplete menu — with AnimatedPresence scaleIn */}
        <AnimatedPresence
          visible={slashOpen && filteredCommands.length > 0 && !mentionOpen}
          preset="scaleIn"
          style={{ position: 'absolute', bottom: 64, left: 12, right: 12, zIndex: 16 }}
        >
          <SlashCommandMenu
            commands={filteredCommands}
            query={slashQuery}
            activeIndex={slashActiveIndex}
            onActiveIndexChange={setSlashActiveIndex}
            onSelect={handleSlashSelect}
            open={slashOpen}
          />
        </AnimatedPresence>
        {/* Mention autocomplete dropdown */}
        {mentionOpen && (
          <Box style={{ position: 'absolute', bottom: 64, left: 12, right: 12, zIndex: 15 }}>
            <MentionAutocomplete
              users={filteredUsers}
              query={mentionQuery}
              activeIndex={activeIndex}
              onActiveIndexChange={setActiveIndex}
              onSelect={handleMentionSelect}
              open={mentionOpen}
            />
          </Box>
        )}
        <GradientBorder
          visible={inputFocused}
          animated={inputFocused}
          radius={22}
          width={2}
          speed={3000}
        >
          <Box ref={ghostContainerRef} style={{ position: 'relative' }}>
            <MessageInput
              testID={TEST_IDS.INPUT.TEXT_INPUT}
              value={message}
              onValueChange={handleValueChange}
              onSelectionChange={handleSelectionChange}
              onSubmit={(msg) => {
                if (__DEV__) dbg.info('messages', `send msg len=${msg.length}`, { editing: !!editing }, SRC);
                // Eagerly reset transparent textarea (safety net for command highlight cleanup)
                if (Platform.OS === 'web' && transparentTextareaRef.current) {
                  transparentTextareaRef.current.style.color = '';
                  transparentTextareaRef.current.style.caretColor = '';
                }
                closeMention();
                closeSlash();
                onMessageChange('');
                onClearReply();
                if (editing && onCancelEdit) onCancelEdit();
                onSubmit(msg);
              }}
              placeholder={editing ? t('editMessage') : t('typeMessage')}
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
            {/* Command highlight overlay — web only */}
            {Platform.OS === 'web' && commandHighlight && (
              <Box
                ref={cmdOverlayRef}
                pointerEvents="none"
                accessibilityElementsHidden
                aria-hidden
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  paddingLeft: textareaLeftOffset,
                  paddingRight: textareaRightPad,
                  overflow: 'hidden',
                  flexDirection: 'row',
                }}
              >
                {motionPreferences.enableAnimations ? (
                  <GradientText
                    animated
                    speed={4000}
                    style={{
                      fontSize,
                      fontFamily,
                      lineHeight,
                    }}
                  >
                    {commandHighlight.commandText}
                  </GradientText>
                ) : (
                  <Text
                    style={{
                      fontSize,
                      fontFamily,
                      lineHeight: `${lineHeight}px`,
                      color: theme.colors.brand.primary,
                    } as any}
                  >
                    {commandHighlight.commandText}
                  </Text>
                )}
                {commandHighlight.argsText ? (
                  <Text
                    style={{
                      fontSize,
                      fontFamily,
                      lineHeight: `${lineHeight}px`,
                      color: theme.colors.accent.primary,
                    } as any}
                  >
                    {commandHighlight.argsText}
                  </Text>
                ) : null}
              </Box>
            )}
            {/* Ghost text overlay — web only */}
            {Platform.OS === 'web' && ghostText !== '' && (
              <>
                {/* Hidden measurement span to calculate typed text width */}
                <Text
                  ref={ghostMeasureRef as any}
                  style={{
                    position: 'absolute',
                    top: -9999,
                    left: -9999,
                    fontSize,
                    fontFamily,
                    lineHeight: `${lineHeight}px`,
                    whiteSpace: 'pre',
                    visibility: 'hidden',
                  } as any}
                >
                  {message}
                </Text>
                {/* The ghost text suggestion */}
                <Box
                  ref={ghostOverlayRef}
                  pointerEvents="none"
                  accessibilityElementsHidden
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    paddingLeft: textareaLeftOffset + ghostLeftOffset,
                    paddingRight: textareaRightPad,
                    overflow: 'hidden',
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize,
                      fontFamily,
                      lineHeight: `${lineHeight}px`,
                      color: theme.colors.text.muted,
                      opacity: opacity.faint,
                    } as any}
                  >
                    {ghostText}
                  </Text>
                </Box>
              </>
            )}
          </Box>
        </GradientBorder>
      </Box>
    </>
  );
}
