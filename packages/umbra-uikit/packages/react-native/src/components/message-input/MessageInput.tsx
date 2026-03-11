/**
 * @module components/message-input
 * @description React Native MessageInput for the Wisp design system.
 *
 * Rich chat input with send, attachment, emoji, voice buttons,
 * reply/edit context bars, attachment previews, and character counter.
 * Uses TextInput + onContentSizeChange for auto-expand.
 */

import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View, TextInput, Text, Pressable, ScrollView, Animated } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type {
  MessageInputSize,
  MessageInputVariant,
  MessageInputReplyContext,
  MessageInputEditContext,
  MessageInputAttachment,
} from '@coexist/wisp-core/types/MessageInput.types';
import { messageInputSizeMap } from '@coexist/wisp-core/types/MessageInput.types';
import { resolveMessageInputColors } from '@coexist/wisp-core/styles/MessageInput.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function PaperclipIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </Svg>
  );
}

function SmileIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={10} />
      <Path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <Line x1={9} y1={9} x2={9.01} y2={9} />
      <Line x1={15} y1={9} x2={15.01} y2={9} />
    </Svg>
  );
}

function MicIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <Line x1={12} y1={19} x2={12} y2={22} />
    </Svg>
  );
}

function SendIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m22 2-7 20-4-9-9-4Z" />
      <Path d="M22 2 11 13" />
    </Svg>
  );
}

function FileIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <Polyline points="14 2 14 8 20 8" />
    </Svg>
  );
}

function XIcon({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6 6 18" />
      <Path d="m6 6 12 12" />
    </Svg>
  );
}

function CheckSentIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6 9 17l-5-5" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MessageInputProps extends ViewProps {
  /** Current input value (controlled). */
  value?: string;
  /** Default input value (uncontrolled). */
  defaultValue?: string;
  /** Placeholder text. @default 'Type a message...' */
  placeholder?: string;
  /** Size preset. @default 'md' */
  size?: MessageInputSize;
  /**
   * Visual variant.
   * - `'default'` — standard rounded rectangle.
   * - `'pill'` — fully rounded pill shape with tighter icon insets.
   * @default 'default'
   */
  variant?: MessageInputVariant;
  /** Called when the value changes. */
  onValueChange?: (value: string) => void;
  /** Called when the user submits the message. */
  onSubmit?: (value: string) => void;
  /** Show attachment button. @default true */
  showAttachment?: boolean;
  /** Called when attachment button is pressed. */
  onAttachmentClick?: () => void;
  /** Show emoji trigger button. @default true */
  showEmoji?: boolean;
  /** Called when emoji button is pressed (use for external picker). */
  onEmojiClick?: () => void;
  /** Called when an emoji is selected from the built-in picker. */
  onEmojiSelect?: (emoji: string) => void;
  /** Whether the input is disabled. @default false */
  disabled?: boolean;
  /** Whether the message is being sent. @default false */
  sending?: boolean;
  /** Auto-expand text input as user types. @default true */
  autoExpand?: boolean;
  /** Show loading skeleton. @default false */
  skeleton?: boolean;
  /** Reply context — shows reply preview bar above input. */
  replyingTo?: MessageInputReplyContext;
  /** Edit context — shows edit preview bar above input. */
  editing?: MessageInputEditContext;
  /** Show voice record button. @default false */
  showVoice?: boolean;
  /** Called when voice button is pressed. */
  onVoiceClick?: () => void;
  /** Show formatting toolbar toggle button. @default false */
  showFormat?: boolean;
  /** Called when format button is pressed. */
  onFormatClick?: () => void;
  /** Whether formatting toolbar is currently active/open. @default false */
  formatActive?: boolean;
  /** Maximum character count with counter display. */
  maxLength?: number;
  /** Queued attachments shown as preview cards above input. */
  attachments?: MessageInputAttachment[];
  /** Called when an attachment preview is removed. */
  onAttachmentRemove?: (id: string) => void;
  /** Called when the cursor selection changes — useful for @mention trigger detection. */
  onSelectionChange?: (event: { nativeEvent: { selection: { start: number; end: number } } }) => void;
  /** Called when a key is pressed — useful for keyboard navigation in mention dropdowns. */
  onKeyPress?: (event: { nativeEvent: { key: string } }) => void;
  /** Highlight @mentions in the input with accent color. @default false */
  highlightMentions?: boolean;
  /** List of valid mention names to highlight. When empty/undefined all @word patterns are highlighted. */
  mentionNames?: string[];
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

export const MessageInput = forwardRef<View, MessageInputProps>(function MessageInput(
  {
    value: controlledValue,
    defaultValue = '',
    placeholder = 'Type a message...',
    size = 'md',
    variant = 'default',
    onValueChange,
    onSubmit,
    showAttachment = true,
    onAttachmentClick,
    showEmoji = true,
    onEmojiClick,
    onEmojiSelect: _onEmojiSelect,
    disabled = false,
    sending = false,
    autoExpand = true,
    skeleton = false,
    replyingTo,
    editing,
    showVoice = false,
    onVoiceClick,
    showFormat = false,
    onFormatClick,
    formatActive = false,
    maxLength,
    attachments,
    onAttachmentRemove,
    onSelectionChange,
    onKeyPress,
    highlightMentions = false,
    mentionNames,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = messageInputSizeMap[size];

  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const singleLineHeight = sizeConfig.minHeight - sizeConfig.padding;
  const lineHeight = sizeConfig.fontSize * 1.4;
  const maxLines = 5;
  const maxExpandHeight = Math.ceil(lineHeight * maxLines) + sizeConfig.padding;

  // On web, auto-expand is disabled to avoid RN Web textarea sizing issues.
  // The input is always single-line on web; native platforms expand normally.
  const webPlatform = Platform.OS === 'web';
  const effectiveAutoExpand = autoExpand && !webPlatform;
  const [inputHeight, setInputHeight] = useState(singleLineHeight);

  const colors = useMemo(
    () => resolveMessageInputColors(theme),
    [themeColors],
  );

  const isPill = variant === 'pill';
  const radiiScale = theme.radii ?? defaultRadii;
  const isMultiline = effectiveAutoExpand && inputHeight > singleLineHeight + 4; // 4px tolerance
  const resolvedRadius = (isPill && !isMultiline) ? radiiScale.full : (radiiScale[sizeConfig.borderRadius] ?? defaultRadii[sizeConfig.borderRadius]);
  const hPad = (isPill && !isMultiline) ? sizeConfig.padding * 0.75 : sizeConfig.padding;

  if (skeleton) {
    const skeletonStyle: ViewStyle = {
      width: '100%',
      height: sizeConfig.minHeight + sizeConfig.padding,
      borderRadius: resolvedRadius,
      backgroundColor: themeColors.border.subtle,
    };
    return <View style={[skeletonStyle, userStyle as ViewStyle]} />;
  }

  const wrapperStyle = useMemo<ViewStyle>(() => ({
    width: '100%',
  }), []);

  const containerStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: isMultiline ? 'flex-start' : 'flex-end',
    gap: sizeConfig.gap,
    paddingHorizontal: hPad,
    paddingVertical: sizeConfig.padding / 2,
    borderRadius: resolvedRadius,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    width: '100%',
  }), [sizeConfig, colors, isPill, hPad, resolvedRadius, isMultiline]);

  const resolvedInputHeight = effectiveAutoExpand ? Math.min(inputHeight, maxExpandHeight) : singleLineHeight;
  const inputStyle = useMemo<TextStyle>(() => ({
    flex: 1,
    minHeight: singleLineHeight,
    maxHeight: webPlatform ? singleLineHeight : maxExpandHeight,
    fontSize: sizeConfig.fontSize,
    color: colors.text,
    padding: 0,
    paddingVertical: sizeConfig.padding / 2,
    lineHeight,
    outlineStyle: 'none' as any,
    height: resolvedInputHeight,
  }), [sizeConfig, colors, resolvedInputHeight, singleLineHeight, maxExpandHeight, lineHeight, webPlatform]);

  const iconBtnStyle = useMemo<ViewStyle>(() => ({
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeConfig.iconButtonSize,
    height: sizeConfig.iconButtonSize,
    borderRadius: sizeConfig.iconButtonSize / 2,
  }), [sizeConfig]);

  const iconTextStyle = useMemo<TextStyle>(() => ({
    fontSize: sizeConfig.iconSize,
    color: colors.icon,
  }), [sizeConfig, colors]);

  const hasContent = value.trim().length > 0;

  const sendBtnStyle = useMemo<ViewStyle>(() => ({
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeConfig.iconButtonSize,
    height: sizeConfig.iconButtonSize,
    borderRadius: sizeConfig.iconButtonSize / 2,
    backgroundColor: hasContent && !sending ? colors.sendBg : colors.sendBgDisabled,
    opacity: 1,
  }), [sizeConfig, colors, hasContent, sending]);

  const sendIconStyle = useMemo<TextStyle>(() => ({
    fontSize: sizeConfig.iconSize * 0.8,
    color: colors.sendIcon,
  }), [sizeConfig, colors]);

  const contextBarAccent = replyingTo ? themeColors.accent.primary : themeColors.status.warning;
  const contextBarStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: defaultSpacing.sm,
    paddingHorizontal: sizeConfig.padding,
    paddingVertical: defaultSpacing.xs,
    ...(Platform.OS !== 'web' ? { borderLeftWidth: 2, borderLeftColor: contextBarAccent } : {}),
  }), [contextBarAccent, sizeConfig]);

  const contextLabelStyle = useMemo<TextStyle>(() => ({
    fontSize: defaultTypography.sizes.xs.fontSize,
    fontWeight: '600',
    color: replyingTo ? themeColors.accent.primary : themeColors.status.warning,
  }), [replyingTo, themeColors]);

  const contextTextStyle = useMemo<TextStyle>(() => ({
    fontSize: defaultTypography.sizes.xs.fontSize,
    color: themeColors.text.secondary,
  }), [themeColors]);

  const attachmentCardStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: defaultSpacing.xs,
    paddingHorizontal: defaultSpacing.sm,
    paddingVertical: defaultSpacing.xs,
    borderRadius: defaultRadii.md,
    borderWidth: 1,
    borderColor: themeColors.border.subtle,
    backgroundColor: themeColors.background.surface,
    maxWidth: 180,
  }), [themeColors]);

  // ---- Mention highlight overlay (web only) ----
  const mentionOverlayStyle = useMemo<TextStyle>(() => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    fontSize: sizeConfig.fontSize,
    lineHeight: sizeConfig.fontSize * 1.4,
    paddingVertical: sizeConfig.padding / 2,
    padding: 0,
    color: 'transparent',
    pointerEvents: 'none' as any,
    whiteSpace: 'pre-wrap' as any,
    wordBreak: 'break-word' as any,
    overflowWrap: 'break-word' as any,
    fontFamily: 'System',
  }), [sizeConfig]);

  const mentionParts = useMemo(() => {
    if (!highlightMentions || !value) return null;

    // Build a regex that matches @Name patterns
    // If mentionNames is provided, match those specifically; otherwise match @Word+
    if (mentionNames && mentionNames.length > 0) {
      // Escape special regex chars and sort by length (longest first) to avoid partial matches
      const escaped = mentionNames
        .sort((a, b) => b.length - a.length)
        .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const pattern = new RegExp(`(@(?:${escaped.join('|')}))`, 'g');
      const parts: { text: string; isMention: boolean }[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(value)) !== null) {
        if (match.index > lastIndex) {
          parts.push({ text: value.slice(lastIndex, match.index), isMention: false });
        }
        parts.push({ text: match[1], isMention: true });
        lastIndex = pattern.lastIndex;
      }
      if (lastIndex < value.length) {
        parts.push({ text: value.slice(lastIndex), isMention: false });
      }
      return parts.length > 0 ? parts : null;
    }

    // Fallback: match any @Word (letters/spaces until end or non-alpha)
    return null;
  }, [highlightMentions, value, mentionNames]);

  const showMentionOverlay = Platform.OS === 'web' && highlightMentions && mentionParts && mentionParts.length > 0;

  const overLimit = maxLength !== undefined && value.length > maxLength;

  const counterStyle = useMemo<TextStyle>(() => ({
    fontSize: defaultTypography.sizes['2xs'].fontSize,
    color: overLimit ? themeColors.status.danger : themeColors.text.muted,
    alignSelf: 'flex-end',
    paddingBottom: 2,
  }), [overLimit, themeColors]);

  const handleChangeText = useCallback(
    (text: string) => {
      if (controlledValue === undefined) setInternalValue(text);
      onValueChange?.(text);
    },
    [controlledValue, onValueChange],
  );

  // --- Send button spring + icon morph ---
  const sendScale = useRef(new Animated.Value(1)).current;
  const [showCheck, setShowCheck] = useState(false);

  const handleSubmit = useCallback(() => {
    if (!hasContent || sending || disabled) return;
    onSubmit?.(value);
    if (controlledValue === undefined) setInternalValue('');

    // Spring pop animation
    sendScale.setValue(1.2);
    Animated.spring(sendScale, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();

    // Brief check icon morph
    setShowCheck(true);
    setTimeout(() => setShowCheck(false), 600);
  }, [hasContent, sending, disabled, value, onSubmit, controlledValue, sendScale]);

  const textInputRef = useRef<TextInput>(null);

  const handleContentSizeChange = useCallback(
    (e: { nativeEvent: { contentSize: { height: number } } }) => {
      if (!effectiveAutoExpand) return;
      setInputHeight(e.nativeEvent.contentSize.height);
    },
    [effectiveAutoExpand],
  );

  // Web: force the underlying <textarea> to rows=1 so the browser's
  // default rows=2 doesn't inflate the input to two visible lines.
  // A MutationObserver keeps it pinned since RN Web resets it on re-render.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = textInputRef.current as unknown as HTMLElement | null;
    if (!node) return;
    const el = (node as any).tagName === 'TEXTAREA'
      ? (node as any)
      : (node as any).querySelector?.('textarea');
    if (!el) return;
    el.rows = 1;
    const observer = new MutationObserver(() => {
      if (el.rows !== 1) el.rows = 1;
    });
    observer.observe(el, { attributes: true, attributeFilter: ['rows'] });
    return () => observer.disconnect();
  }, []);

  // --- Web: Enter to submit, Shift+Enter for newline ---
  const textInputWrapperRef = useRef<View>(null);
  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const wrapper = textInputWrapperRef.current as unknown as HTMLElement;
    if (!wrapper) return;

    const onKeyDown = (e: any) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmitRef.current();
      }
    };

    (wrapper as any).addEventListener('keydown', onKeyDown, true);
    return () => (wrapper as any).removeEventListener('keydown', onKeyDown, true);
  }, []);

  const hasContextBar = Boolean(replyingTo || editing);
  const hasAttachments = attachments && attachments.length > 0;

  return (
    <View ref={ref} style={[wrapperStyle, userStyle as ViewStyle]} {...rest}>
      {/* Reply / Edit context bar */}
      {hasContextBar && (
        <View style={[contextBarStyle, { position: 'relative', overflow: 'hidden' }]}>
          {/* Gradient accent bar (web) */}
          {Platform.OS === 'web' && (
            <View style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 2,
              background: 'linear-gradient(180deg, #8B5CF6, #EC4899, #3B82F6)',
            } as any} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={contextLabelStyle}>
              {replyingTo ? `Replying to ${replyingTo.sender}` : 'Editing message'}
            </Text>
            <Text style={contextTextStyle} numberOfLines={1}>
              {replyingTo ? replyingTo.text : editing?.text}
            </Text>
          </View>
          <Pressable
            onPress={replyingTo ? replyingTo.onClear : editing?.onCancel}
            accessibilityLabel={replyingTo ? 'Cancel reply' : 'Cancel edit'}
          >
            <XIcon size={14} color={themeColors.text.muted} />
          </Pressable>
        </View>
      )}

      {/* Attachment previews */}
      {hasAttachments && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ paddingHorizontal: sizeConfig.padding, paddingVertical: defaultSpacing.sm }}
          contentContainerStyle={{ gap: defaultSpacing.sm }}
        >
          {attachments!.map((att) => (
            <View key={att.id} style={attachmentCardStyle}>
              <FileIcon size={14} color={themeColors.text.muted} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: themeColors.text.primary }} numberOfLines={1}>
                  {att.name}
                </Text>
                {att.size !== undefined && (
                  <Text style={{ fontSize: defaultTypography.sizes['2xs'].fontSize, color: themeColors.text.muted }}>
                    {formatFileSize(att.size)}
                  </Text>
                )}
              </View>
              {onAttachmentRemove && (
                <Pressable onPress={() => onAttachmentRemove(att.id)} accessibilityLabel={`Remove ${att.name}`}>
                  <XIcon size={10} color={themeColors.text.muted} />
                </Pressable>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Main input row */}
      <View ref={textInputWrapperRef} style={containerStyle}>
        {showAttachment && (
          <Pressable
            onPress={onAttachmentClick}
            disabled={disabled}
            accessibilityLabel="Attach file"
            style={iconBtnStyle}
          >
            <PaperclipIcon size={sizeConfig.iconSize} color={colors.icon} />
          </Pressable>
        )}

        <View style={{ flex: 1, position: 'relative' }}>
          {/* Mention highlight overlay — renders colored @mentions behind the input */}
          {showMentionOverlay && (
            <Text style={mentionOverlayStyle} aria-hidden>
              {mentionParts!.map((part, i) =>
                part.isMention ? (
                  <Text key={i} style={{ color: themeColors.status.info, fontWeight: '600' }}>
                    {part.text}
                  </Text>
                ) : (
                  <Text key={i} style={{ color: colors.text }}>
                    {part.text}
                  </Text>
                ),
              )}
            </Text>
          )}
          <TextInput
            ref={textInputRef}
            value={value}
            onChangeText={handleChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.placeholder}
            editable={!disabled && !sending}
            multiline
            onContentSizeChange={handleContentSizeChange}
            onSelectionChange={onSelectionChange}
            onKeyPress={onKeyPress}
            style={[
              inputStyle,
              showMentionOverlay ? { color: 'transparent', caretColor: colors.text } as any : undefined,
            ]}
            accessibilityLabel="Message"
            maxLength={maxLength}
          />
        </View>

        {/* Character counter */}
        {maxLength !== undefined && (
          <Text style={counterStyle}>
            {value.length}/{maxLength}
          </Text>
        )}

        {showFormat && (
          <Pressable
            onPress={onFormatClick}
            disabled={disabled}
            accessibilityLabel="Formatting"
            style={[iconBtnStyle, formatActive ? { backgroundColor: colors.border, borderRadius: sizeConfig.iconButtonSize / 2 } : undefined]}
          >
            <Text style={{ fontSize: sizeConfig.iconSize - 2, fontWeight: '700', color: formatActive ? colors.text : colors.icon }}>Aa</Text>
          </Pressable>
        )}

        {showEmoji && (
          <Pressable
            onPress={onEmojiClick}
            disabled={disabled}
            accessibilityLabel="Add emoji"
            style={iconBtnStyle}
          >
            <SmileIcon size={sizeConfig.iconSize} color={colors.icon} />
          </Pressable>
        )}

        {/* Voice button */}
        {showVoice && (
          <Pressable
            onPress={onVoiceClick}
            disabled={disabled}
            accessibilityLabel="Voice message"
            style={iconBtnStyle}
          >
            <MicIcon size={sizeConfig.iconSize} color={colors.icon} />
          </Pressable>
        )}

        <Animated.View style={{ transform: [{ scale: sendScale }] }}>
          <Pressable
            onPress={handleSubmit}
            disabled={!hasContent || sending || disabled}
            accessibilityLabel="Send message"
            style={sendBtnStyle}
          >
            {showCheck
              ? <CheckSentIcon size={Math.round(sizeConfig.iconSize * 0.8)} color={colors.sendIcon} />
              : <SendIcon size={Math.round(sizeConfig.iconSize * 0.8)} color={colors.sendIcon} />
            }
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
});

MessageInput.displayName = 'MessageInput';
