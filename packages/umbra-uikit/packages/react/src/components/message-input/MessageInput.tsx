/**
 * @module MessageInput
 * @description Rich chat input with auto-expanding textarea, send button,
 * attachment trigger, emoji trigger, reply/edit context bars, voice button,
 * attachment previews, and character counter.
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTheme } from '../../providers';
import type { MessageInputProps } from '@coexist/wisp-core/types/MessageInput.types';
import { messageInputSizeMap } from '@coexist/wisp-core/types/MessageInput.types';
import {
  resolveMessageInputColors,
  buildMessageInputContainerStyle,
  buildMessageInputTextareaStyle,
  buildMessageInputIconButtonStyle,
  buildMessageInputSendButtonStyle,
  buildMessageInputSkeletonStyle,
  buildMessageInputWrapperStyle,
  buildMessageInputContextBarStyle,
  buildMessageInputAttachmentsStyle,
  buildMessageInputCounterStyle,
} from '@coexist/wisp-core/styles/MessageInput.styles';
import { Popover, PopoverTrigger, PopoverContent } from '../popover';
import { EmojiPicker } from '../emoji-picker';

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------

function PaperclipIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function SmileIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}

function SendIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

function MicIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function XIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function FileIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MessageInput = forwardRef<HTMLDivElement, MessageInputProps>(function MessageInput(
  {
    value: controlledValue,
    defaultValue = '',
    placeholder = 'Type a message...',
    size = 'md',
    onValueChange,
    onSubmit,
    showAttachment = true,
    onAttachmentClick,
    showEmoji = true,
    onEmojiClick,
    onEmojiSelect,
    disabled = false,
    sending = false,
    autoExpand = true,
    skeleton = false,
    replyingTo,
    editing,
    variant = 'default',
    showVoice = false,
    onVoiceClick,
    maxLength,
    attachments,
    onAttachmentRemove,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const sizeConfig = messageInputSizeMap[size];
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [internalValue, setInternalValue] = useState(defaultValue);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const colors = useMemo(
    () => resolveMessageInputColors(theme),
    [theme],
  );

  if (skeleton) {
    const skeletonStyle = buildMessageInputSkeletonStyle(sizeConfig, theme, variant);
    return <div aria-hidden className={className} style={{ ...skeletonStyle, ...userStyle }} />;
  }

  const wrapperStyle = useMemo(
    () => buildMessageInputWrapperStyle(sizeConfig, theme),
    [sizeConfig, theme],
  );

  const containerStyle = useMemo(
    () => buildMessageInputContainerStyle(sizeConfig, colors, theme, variant),
    [sizeConfig, colors, theme, variant],
  );

  const textareaStyle = useMemo(
    () => buildMessageInputTextareaStyle(sizeConfig, colors),
    [sizeConfig, colors],
  );

  const iconBtnStyle = useMemo(
    () => buildMessageInputIconButtonStyle(sizeConfig, colors),
    [sizeConfig, colors],
  );

  const hasContent = value.trim().length > 0;

  const sendBtnStyle = useMemo(
    () => buildMessageInputSendButtonStyle(sizeConfig, colors, hasContent && !sending),
    [sizeConfig, colors, hasContent, sending],
  );

  // Context bar styles (reply/edit)
  const contextBarStyles = useMemo(() => {
    if (replyingTo) return buildMessageInputContextBarStyle(sizeConfig, colors, 'reply', theme);
    if (editing) return buildMessageInputContextBarStyle(sizeConfig, colors, 'edit', theme);
    return undefined;
  }, [replyingTo, editing, sizeConfig, colors, theme]);

  // Attachments row styles
  const attachmentsStyles = useMemo(
    () => (attachments && attachments.length > 0 ? buildMessageInputAttachmentsStyle(sizeConfig, theme) : undefined),
    [attachments, sizeConfig, theme],
  );

  // Character counter
  const overLimit = maxLength !== undefined && value.length > maxLength;
  const counterStyle = useMemo(
    () => (maxLength !== undefined ? buildMessageInputCounterStyle(theme, overLimit) : undefined),
    [maxLength, theme, overLimit],
  );

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta || !autoExpand) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, sizeConfig.maxHeight)}px`;
  }, [value, autoExpand, sizeConfig.maxHeight]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const v = e.target.value;
      if (controlledValue === undefined) setInternalValue(v);
      onValueChange?.(v);
    },
    [controlledValue, onValueChange],
  );

  const handleSubmit = useCallback(() => {
    if (!hasContent || sending || disabled) return;
    onSubmit?.(value);
    if (controlledValue === undefined) setInternalValue('');
  }, [hasContent, sending, disabled, value, onSubmit, controlledValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  // Insert emoji at cursor position in the textarea
  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      const ta = textareaRef.current;
      const cursorPos = ta?.selectionStart ?? value.length;
      const before = value.slice(0, cursorPos);
      const after = value.slice(cursorPos);
      const next = before + emoji + after;

      if (controlledValue === undefined) setInternalValue(next);
      onValueChange?.(next);
      onEmojiSelect?.(emoji);
      setEmojiOpen(false);

      // Restore focus and cursor position after emoji insertion
      requestAnimationFrame(() => {
        if (ta) {
          ta.focus();
          const newPos = cursorPos + emoji.length;
          ta.setSelectionRange(newPos, newPos);
        }
      });
    },
    [value, controlledValue, onValueChange, onEmojiSelect],
  );

  // Whether the built-in emoji picker popover should be used
  const useBuiltInPicker = showEmoji && !onEmojiClick;

  // Determine if we have context above the main input row
  const hasContextBar = Boolean(replyingTo || editing);
  const hasAttachments = attachments && attachments.length > 0;
  const hasAboveContent = hasContextBar || hasAttachments;

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...wrapperStyle, ...userStyle }}
      {...rest}
    >
      {/* Reply / Edit context bar */}
      {hasContextBar && contextBarStyles && (
        <div style={contextBarStyles.container}>
          <div style={contextBarStyles.label}>
            <span style={{ ...contextBarStyles.text, fontWeight: 600, color: replyingTo ? theme.colors.accent.primary : theme.colors.status.warning }}>
              {replyingTo ? `Replying to ${replyingTo.sender}` : 'Editing message'}
            </span>
            <span style={contextBarStyles.text}>
              {replyingTo ? replyingTo.text : editing?.text}
            </span>
          </div>
          <button
            type="button"
            style={contextBarStyles.closeBtn}
            onClick={replyingTo ? replyingTo.onClear : editing?.onCancel}
            aria-label={replyingTo ? 'Cancel reply' : 'Cancel edit'}
          >
            <XIcon size={12} />
          </button>
        </div>
      )}

      {/* Attachment previews */}
      {hasAttachments && attachmentsStyles && (
        <div style={attachmentsStyles.container}>
          {attachments!.map((att) => (
            <div key={att.id} style={attachmentsStyles.card}>
              {att.thumbnail ? (
                <img src={att.thumbnail} alt="" style={attachmentsStyles.thumbnail as React.CSSProperties} />
              ) : (
                <FileIcon size={16} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={attachmentsStyles.name}>{att.name}</div>
                {att.size !== undefined && (
                  <div style={attachmentsStyles.size}>{formatFileSize(att.size)}</div>
                )}
              </div>
              {onAttachmentRemove && (
                <button
                  type="button"
                  style={attachmentsStyles.removeBtn}
                  onClick={() => onAttachmentRemove(att.id)}
                  aria-label={`Remove ${att.name}`}
                >
                  <XIcon size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main input row */}
      <div style={containerStyle}>
        {showAttachment && (
          <button
            type="button"
            style={iconBtnStyle}
            onClick={onAttachmentClick}
            aria-label="Attach file"
            disabled={disabled}
          >
            <PaperclipIcon size={sizeConfig.iconSize} />
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || sending}
          rows={1}
          style={textareaStyle}
          aria-label="Message"
          maxLength={maxLength}
        />

        {/* Character counter */}
        {maxLength !== undefined && counterStyle && (
          <span style={counterStyle}>
            {value.length}/{maxLength}
          </span>
        )}

        {showEmoji && useBuiltInPicker && (
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen} placement="top" align="end">
            <PopoverTrigger>
              <button
                type="button"
                style={iconBtnStyle}
                aria-label="Add emoji"
                disabled={disabled}
              >
                <SmileIcon size={sizeConfig.iconSize} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              style={{
                padding: 0,
                border: 'none',
                background: 'transparent',
                boxShadow: 'none',
                borderRadius: 0,
                overflow: 'visible',
              }}
            >
              <EmojiPicker
                size="sm"
                onSelect={(emoji) => handleEmojiSelect(emoji)}
              />
            </PopoverContent>
          </Popover>
        )}

        {showEmoji && !useBuiltInPicker && (
          <button
            type="button"
            style={iconBtnStyle}
            onClick={onEmojiClick}
            aria-label="Add emoji"
            disabled={disabled}
          >
            <SmileIcon size={sizeConfig.iconSize} />
          </button>
        )}

        {/* Voice button */}
        {showVoice && (
          <button
            type="button"
            style={iconBtnStyle}
            onClick={onVoiceClick}
            aria-label="Voice message"
            disabled={disabled}
          >
            <MicIcon size={sizeConfig.iconSize} />
          </button>
        )}

        <button
          type="button"
          style={sendBtnStyle}
          onClick={handleSubmit}
          aria-label="Send message"
          disabled={!hasContent || sending || disabled}
        >
          <SendIcon size={sizeConfig.iconSize * 0.8} />
        </button>
      </div>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';
