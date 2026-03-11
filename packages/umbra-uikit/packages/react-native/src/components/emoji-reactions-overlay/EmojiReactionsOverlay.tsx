/**
 * @module components/emoji-reactions-overlay
 * @description Animated emoji reactions overlay for the Wisp design system.
 */

import React, { forwardRef, useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { View, Pressable, Text as RNText, Animated } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type {
  EmojiReaction,
  EmojiReactionsOverlayProps,
} from '@coexist/wisp-core/types/EmojiReactionsOverlay.types';
import { QUICK_EMOJIS } from '@coexist/wisp-core/types/EmojiReactionsOverlay.types';
import {
  resolveQuickBarBackground,
  resolveQuickBarBorder,
  resolveReactionBubbleBackground,
} from '@coexist/wisp-core/styles/EmojiReactionsOverlay.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REACTION_DURATION = 3000;
const ANIMATION_DURATION = 2500;
const FLOAT_DISTANCE = -200;

// ---------------------------------------------------------------------------
// Animated Bubble
// ---------------------------------------------------------------------------

interface AnimatedReactionBubbleProps {
  reaction: EmojiReaction;
  bubbleBg: string;
  nameColor: string;
  onExpire: (id: string) => void;
}

function AnimatedReactionBubble({
  reaction,
  bubbleBg,
  nameColor,
  onExpire,
}: AnimatedReactionBubbleProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: ANIMATION_DURATION - 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(translateY, {
        toValue: FLOAT_DISTANCE,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      onExpire(reaction.id);
    }, REACTION_DURATION);

    return () => clearTimeout(timer);
  }, []);

  const bubbleStyle = useMemo<ViewStyle>(() => ({
    alignItems: 'center',
    backgroundColor: bubbleBg,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
  }), [bubbleBg]);

  const emojiStyle = useMemo<TextStyle>(() => ({
    fontSize: 36,
    textAlign: 'center',
  }), []);

  const nameStyle = useMemo<TextStyle>(() => ({
    fontSize: 11,
    color: nameColor,
    marginTop: 2,
    textAlign: 'center',
  }), [nameColor]);

  return (
    <Animated.View
      style={[
        bubbleStyle,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <RNText style={emojiStyle}>{reaction.emoji}</RNText>
      <RNText style={nameStyle} numberOfLines={1}>{reaction.fromName}</RNText>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const EmojiReactionsOverlay = forwardRef<View, EmojiReactionsOverlayProps>(
  function EmojiReactionsOverlay(
    {
      reactions,
      onReact,
      quickEmojis = QUICK_EMOJIS,
      showQuickBar = true,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const isDark = theme.mode === 'dark';
    const tc = theme.colors;

    const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

    // Track which reactions are currently visible and auto-expire them.
    useEffect(() => {
      const newIds = new Set(visibleIds);
      let changed = false;
      for (const r of reactions) {
        if (!newIds.has(r.id)) {
          newIds.add(r.id);
          changed = true;
        }
      }
      if (changed) {
        setVisibleIds(newIds);
      }
    }, [reactions]);

    const handleExpire = useCallback((id: string) => {
      setVisibleIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, []);

    // Style resolution
    const quickBarBg = useMemo(() => resolveQuickBarBackground(isDark), [isDark]);
    const quickBarBorder = useMemo(() => resolveQuickBarBorder(isDark), [isDark]);
    const bubbleBg = useMemo(() => resolveReactionBubbleBackground(isDark), [isDark]);
    const nameColor = tc.text.secondary;

    const overlayStyle = useMemo<ViewStyle>(() => ({
      ...({ position: 'absolute' } as ViewStyle),
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'flex-end',
      alignItems: 'center',
    }), []);

    const quickBarStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginBottom: 24,
      backgroundColor: quickBarBg,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: quickBarBorder,
    }), [quickBarBg, quickBarBorder]);

    const quickEmojiButtonStyle = useMemo<ViewStyle>(() => ({
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    }), []);

    const quickEmojiTextStyle = useMemo<TextStyle>(() => ({
      fontSize: 24,
    }), []);

    // Filter visible reactions to only those currently in the reactions array
    const visibleReactions = useMemo(
      () => reactions.filter((r) => visibleIds.has(r.id)),
      [reactions, visibleIds],
    );

    return (
      <View ref={ref} style={overlayStyle} pointerEvents="box-none">
        {/* Animated reaction bubbles */}
        {visibleReactions.map((reaction) => (
          <AnimatedReactionBubble
            key={reaction.id}
            reaction={reaction}
            bubbleBg={bubbleBg}
            nameColor={nameColor}
            onExpire={handleExpire}
          />
        ))}

        {/* Quick-reaction bar */}
        {showQuickBar && (
          <View style={quickBarStyle} pointerEvents="box-none">
            {quickEmojis.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => onReact(emoji)}
                accessibilityLabel={`React with ${emoji}`}
                accessibilityRole="button"
                style={quickEmojiButtonStyle}
              >
                <RNText style={quickEmojiTextStyle}>{emoji}</RNText>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  },
);

EmojiReactionsOverlay.displayName = 'EmojiReactionsOverlay';
