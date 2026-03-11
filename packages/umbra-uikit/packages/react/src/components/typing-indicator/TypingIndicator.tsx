/**
 * @module TypingIndicator
 */
import React, { forwardRef, useMemo, useEffect } from 'react';
import type { TypingIndicatorProps } from '@coexist/wisp-core/types/TypingIndicator.types';
import {
  ensureTypingIndicatorKeyframes,
  buildDotsContainerStyle,
  buildDotStyle,
  buildTypingBubbleStyle,
  buildTypingGroupStyle,
  buildTypingRowStyle,
  buildTypingSenderNameStyle,
} from '@coexist/wisp-core/styles/TypingIndicator.styles';
import { useTheme } from '../../providers';
import { Text } from '../../primitives';

// ---------------------------------------------------------------------------
// Dot count
// ---------------------------------------------------------------------------

const DOT_INDICES = [0, 1, 2];

// ---------------------------------------------------------------------------
// TypingIndicator
// ---------------------------------------------------------------------------

/**
 * TypingIndicator — Animated "someone is typing…" indicator.
 *
 * @remarks
 * Key features:
 * - Four animation styles: `bounce`, `pulse`, `scale`, `wave`.
 * - Optional `bubble` mode wraps the dots in a ChatBubble-shaped container.
 * - Optional `avatar` + `sender` props display a header above the bubble.
 * - Accessible via `role="status"` and `aria-label`.
 *
 * @example
 * ```tsx
 * // Bare dots
 * <TypingIndicator />
 *
 * // Inside a chat bubble
 * <TypingIndicator bubble animation="pulse" />
 *
 * // With avatar
 * <TypingIndicator
 *   bubble
 *   avatar={<Avatar name="Alice" size="sm" />}
 *   sender="Alice"
 * />
 * ```
 */
export const TypingIndicator = forwardRef<HTMLDivElement, TypingIndicatorProps>(
  function TypingIndicator(
    {
      animation = 'bounce',
      bubble = false,
      align = 'incoming',
      avatar,
      sender,
      color,
      dotSize = 8,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
  const themeColors = theme.colors;

    // Inject keyframes on mount (SSR-safe)
    useEffect(() => {
      ensureTypingIndicatorKeyframes();
    }, []);

    const dotColor = color ?? themeColors.text.muted;

    const dotsContainerStyle = useMemo(
      () => buildDotsContainerStyle(theme),
      [theme],
    );

    // The core dots element
    const dots = (
      <div style={dotsContainerStyle} aria-hidden>
        {DOT_INDICES.map((i) => (
          <span
            key={i}
            style={buildDotStyle(i, animation, dotSize, dotColor, theme)}
          />
        ))}
      </div>
    );

    // ---- Non-bubble mode: just render the dots ----
    if (!bubble) {
      return (
        <div
          ref={ref}
          className={className}
          style={{ display: 'inline-flex', alignItems: 'center', ...userStyle }}
          role="status"
          aria-label="Typing"
          {...rest}
        >
          {dots}
        </div>
      );
    }

    // ---- Bubble mode: wrap in ChatBubble-shaped container ----
    const bubbleStyle = useMemo(
      () => buildTypingBubbleStyle(align, theme),
      [align, theme],
    );

    const groupStyle = useMemo(
      () => buildTypingGroupStyle(align, theme),
      [align, theme],
    );

    const rowStyle = useMemo(
      () => buildTypingRowStyle(align, theme),
      [align, theme],
    );

    const senderNameStyle = useMemo(
      () => buildTypingSenderNameStyle(theme),
      [theme],
    );

    return (
      <div
        ref={ref}
        className={className}
        style={{ ...groupStyle, ...userStyle }}
        role="status"
        aria-label={sender ? `${sender} is typing` : 'Typing'}
        {...rest}
      >
        {/* Sender name above the row */}
        {sender && <Text style={senderNameStyle}>{sender}</Text>}

        {/* Avatar + Bubble side-by-side */}
        <div style={rowStyle}>
          {avatar}
          <div style={bubbleStyle}>
            {dots}
          </div>
        </div>
      </div>
    );
  },
);

TypingIndicator.displayName = 'TypingIndicator';
