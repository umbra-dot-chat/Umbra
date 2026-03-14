/**
 * @module components/chat-bubble
 * @description React Native ChatBubble for the Wisp design system.
 *
 * Reuses color resolution from `@coexist/wisp-core`. Renders via `<View>` + `<Text>`.
 */

import React, { forwardRef, useMemo, useCallback, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Platform } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type {
  ChatBubbleAlignment,
  ChatBubbleVariant,
  ChatBubbleStatus,
  ChatBubbleReaction,
  ChatBubbleReplyTo,
} from '@coexist/wisp-core/types/ChatBubble.types';
import { resolveChatBubbleColors } from '@coexist/wisp-core/styles/ChatBubble.styles';
import Svg, { Path } from 'react-native-svg';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ChatBubbleProps extends ViewProps {
  children: React.ReactNode;
  align?: ChatBubbleAlignment;
  variant?: ChatBubbleVariant;
  timestamp?: string;
  status?: ChatBubbleStatus;
  reactions?: ChatBubbleReaction[];
  onReactionClick?: (emoji: string) => void;
  /** Quoted reply metadata rendered as a preview strip above the message. */
  replyTo?: ChatBubbleReplyTo;
  /** Marks the message as forwarded. */
  forwarded?: boolean | { from: string };
  /** When true, appends "(edited)" to the timestamp. */
  edited?: boolean;
  /** When true, applies a brief highlight background. */
  highlighted?: boolean;
  /** Slot for media content (images, video) above text. */
  media?: React.ReactNode;
  /** Custom sender name color for group chats. */
  senderColor?: string;
  /** @internal Injected by MessageGroup to suppress footer. */
  _inGroup?: boolean;
}

// ---------------------------------------------------------------------------
// Inline SVG status icons
// ---------------------------------------------------------------------------

function ClockIcon({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" />
      <Path d="M12 6v6l4 2" />
    </Svg>
  );
}

function CheckIcon({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6 9 17l-5-5" />
    </Svg>
  );
}

function CheckCheckIcon({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6 7 17l-5-5" />
      <Path d="m22 10-9.5 9.5L10 17" />
    </Svg>
  );
}

function ErrorIcon({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" />
      <Path d="m15 9-6 6" />
      <Path d="m9 9 6 6" />
    </Svg>
  );
}

export interface StatusIconProps {
  status: ChatBubbleStatus;
  /** Color used for sent/delivered/sending states (typically muted). */
  color: string;
  /** Accent color used for the read state double-check (e.g. blue). */
  readColor: string;
  /** Color used for the failed state (defaults to red/danger). */
  failedColor?: string;
  /** Icon size in pixels. @default 12 */
  size?: number;
}

export function StatusIcon({ status, color, readColor, failedColor, size = 12 }: StatusIconProps) {
  switch (status) {
    case 'sending':
      return <ClockIcon size={size} color={color} />;
    case 'sent':
      return <CheckIcon size={size} color={color} />;
    case 'delivered':
      return <CheckCheckIcon size={size} color={color} />;
    case 'read':
      return <CheckCheckIcon size={size} color={readColor} />;
    case 'failed':
      return <ErrorIcon size={size} color={failedColor ?? color} />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// MessageStatusLabel — iMessage-style "Read" text label
// ---------------------------------------------------------------------------

export interface MessageStatusLabelProps {
  /** The label text, e.g. "Read" or "Read 2:31p". */
  label: string;
  /** Text color override. Defaults to accent.primary from theme. */
  color?: string;
}

/**
 * A small text label that renders beneath the timestamp to indicate read
 * status, inspired by iMessage's "Read 2:31 PM" indicator.
 *
 * Intended to be used alongside `StatusIcon` in message footers.
 */
export function MessageStatusLabel({ label, color }: MessageStatusLabelProps) {
  const { theme } = useTheme();
  const labelColor = color ?? theme.colors.accent.primary;
  return (
    <Text
      style={{
        fontSize: defaultTypography.sizes.xs.fontSize,
        lineHeight: 14,
        color: labelColor,
        fontWeight: defaultTypography.weights.medium,
      }}
    >
      {label}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Animated Reaction Chip — spring pop on press
// ---------------------------------------------------------------------------

function AnimatedReactionChip({
  reaction,
  onPress,
  themeColors,
}: {
  reaction: ChatBubbleReaction;
  onPress: (emoji: string) => void;
  themeColors: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    scale.setValue(1.15);
    Animated.spring(scale, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
    onPress(reaction.emoji);
  }, [reaction.emoji, onPress, scale]);

  const chipStyle = useMemo(() => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: defaultSpacing.xs,
    paddingHorizontal: defaultSpacing.sm,
    paddingVertical: defaultSpacing.xs,
    borderRadius: defaultRadii.lg,
    borderWidth: 1,
    borderColor: reaction.reacted
      ? themeColors.brand.primary
      : themeColors.border.subtle,
    backgroundColor: reaction.reacted
      ? `${themeColors.brand.primary}20`
      : themeColors.background.sunken,
  }), [reaction.reacted, themeColors]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        accessibilityLabel={`${reaction.emoji} ${reaction.count}`}
        style={chipStyle}
      >
        <Text style={{ fontSize: defaultTypography.sizes.xs.fontSize }}>{reaction.emoji}</Text>
        <Text style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: themeColors.text.secondary }}>
          {reaction.count}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ChatBubble = forwardRef<View, ChatBubbleProps>(function ChatBubble(
  {
    children,
    align = 'incoming',
    variant = 'default',
    timestamp,
    status,
    reactions,
    onReactionClick,
    replyTo,
    forwarded,
    edited = false,
    highlighted = false,
    media,
    senderColor,
    _inGroup = false,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const isOutgoing = align === 'outgoing';

  const colors = useMemo(
    () => resolveChatBubbleColors(align, variant, theme),
    [align, variant, themeColors],
  );

  const bubbleStyle = useMemo<ViewStyle>(() => ({
    paddingHorizontal: defaultSpacing.md,
    paddingVertical: defaultSpacing.sm,
    borderTopLeftRadius: defaultRadii.lg,
    borderTopRightRadius: defaultRadii.lg,
    borderBottomLeftRadius: isOutgoing ? 12 : 2,
    borderBottomRightRadius: isOutgoing ? 2 : 12,
    overflow: 'hidden' as const,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: isOutgoing ? 'flex-end' : 'flex-start',
  }), [isOutgoing, colors]);

  const textStyle = useMemo<TextStyle>(() => ({
    color: colors.text,
    fontSize: defaultTypography.sizes.sm.fontSize,
    lineHeight: 20,
  }), [colors]);

  const footerStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: defaultSpacing.xs,
    marginTop: defaultSpacing.xs,
    justifyContent: isOutgoing ? 'flex-end' : 'flex-start',
    ...(Platform.OS === 'web' ? {
      opacity: 0.5,
      transition: 'opacity 0.15s ease',
    } as any : {}),
  }), [isOutgoing]);

  const timestampStyle = useMemo<TextStyle>(() => ({
    fontSize: defaultTypography.sizes.xs.fontSize,
    lineHeight: 14,
    color: colors.timestamp,
  }), [colors]);

  const reactionsContainerStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: defaultSpacing.xs,
    marginTop: defaultSpacing.xs,
    alignSelf: isOutgoing ? 'flex-end' : 'flex-start',
  }), [isOutgoing]);

  const replyToContainerStyle = useMemo<ViewStyle>(() => ({
    borderLeftWidth: 2,
    borderLeftColor: senderColor || colors.timestamp,
    paddingHorizontal: defaultSpacing.sm,
    paddingVertical: defaultSpacing.xs,
    marginBottom: defaultSpacing.xs,
    opacity: 0.85,
  }), [senderColor, colors]);

  const replyToSenderStyle = useMemo<TextStyle>(() => ({
    fontSize: defaultTypography.sizes.xs.fontSize,
    lineHeight: 16,
    fontWeight: '600',
    color: senderColor || colors.timestamp,
  }), [senderColor, colors]);

  const replyToTextStyle = useMemo<TextStyle>(() => ({
    fontSize: defaultTypography.sizes.xs.fontSize,
    lineHeight: 16,
    color: colors.timestamp,
    numberOfLines: 1,
  } as TextStyle), [colors]);

  const forwardedStyle = useMemo<TextStyle>(() => ({
    fontSize: defaultTypography.sizes.xs.fontSize,
    lineHeight: 16,
    fontStyle: 'italic',
    color: colors.timestamp,
    marginBottom: defaultSpacing.xs,
  }), [colors]);

  // Media is "first" when there's nothing above it (no forwarded label, no reply preview)
  const mediaIsFirst = !forwarded && !replyTo;

  const mediaSlotStyle = useMemo<ViewStyle>(() => ({
    marginBottom: defaultSpacing.xs,
    overflow: 'hidden',
    borderRadius: defaultRadii.md,
  }), []);

  const handleReactionClick = useCallback(
    (emoji: string) => { onReactionClick?.(emoji); },
    [onReactionClick],
  );

  const showFooter = !_inGroup && (timestamp || status || edited);
  const hasReactions = reactions && reactions.length > 0;

  const forwardedLabel = forwarded
    ? typeof forwarded === 'object' && forwarded.from
      ? `Forwarded from ${forwarded.from}`
      : 'Forwarded'
    : null;

  const wrapperStyle: ViewStyle = highlighted
    ? { backgroundColor: `${themeColors.accent.primary}15` }
    : {};

  // Web: hover makes footer timestamps fully visible
  const [hovered, setHovered] = useState(false);

  return (
    <View
      ref={ref}
      style={[wrapperStyle, userStyle]}
      onPointerEnter={Platform.OS === 'web' ? (() => setHovered(true)) as any : undefined}
      onPointerLeave={Platform.OS === 'web' ? (() => setHovered(false)) as any : undefined}
      {...rest}
    >
      {/* Bubble */}
      <View style={bubbleStyle}>
        {/* Forwarded label */}
        {forwardedLabel && (
          <Text style={forwardedStyle}>{forwardedLabel}</Text>
        )}

        {/* Reply-to preview */}
        {replyTo && (
          <Pressable style={replyToContainerStyle} onPress={replyTo.onClick}>
            <Text style={replyToSenderStyle}>{replyTo.sender}</Text>
            <Text style={replyToTextStyle} numberOfLines={1}>{replyTo.text}</Text>
          </Pressable>
        )}

        {/* Media slot */}
        {media && <View style={mediaSlotStyle}>{media}</View>}

        {/* Text content */}
        <Text style={textStyle}>{children}</Text>
      </View>

      {/* Reactions below bubble */}
      {hasReactions && (
        <View style={reactionsContainerStyle}>
          {reactions!.map((reaction) => (
            <AnimatedReactionChip
              key={reaction.emoji}
              reaction={reaction}
              onPress={handleReactionClick}
              themeColors={themeColors}
            />
          ))}
        </View>
      )}

      {/* Footer below bubble */}
      {showFooter && (
        <View style={[footerStyle, hovered && Platform.OS === 'web' ? { opacity: 1 } as any : undefined]}>
          {timestamp && (
            <Text style={timestampStyle}>
              {timestamp}{edited ? ' (edited)' : ''}
            </Text>
          )}
          {!timestamp && edited && (
            <Text style={timestampStyle}>(edited)</Text>
          )}
          {status && (
            <StatusIcon
              status={status}
              color={colors.timestamp}
              readColor={themeColors.accent.primary}
              failedColor={themeColors.status.danger}
            />
          )}
        </View>
      )}
    </View>
  );
});

ChatBubble.displayName = 'ChatBubble';
