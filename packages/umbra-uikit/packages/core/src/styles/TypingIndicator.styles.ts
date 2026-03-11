import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { ChatBubbleAlignment } from '../types/ChatBubble.types';
import type { TypingIndicatorAnimation } from '../types/TypingIndicator.types';

// ---------------------------------------------------------------------------
// Keyframe injection — inject once per document
// ---------------------------------------------------------------------------

/** Tracks whether the typing indicator keyframes have been injected. */
let typingKeyframesInjected = false;

/**
 * Injects all `@keyframes` rules for typing indicator animations.
 *
 * @remarks
 * Idempotent and SSR-safe.
 */
export function ensureTypingIndicatorKeyframes(): void {
  if (typingKeyframesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `
@keyframes wisp-typing-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}
@keyframes wisp-typing-pulse {
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; }
}
@keyframes wisp-typing-scale {
  0%, 60%, 100% { transform: scale(1); }
  30% { transform: scale(1.5); }
}
@keyframes wisp-typing-wave {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
`.trim();
  document.head.appendChild(style);
  typingKeyframesInjected = true;
}

// ---------------------------------------------------------------------------
// Animation name map
// ---------------------------------------------------------------------------

const animationNameMap: Record<TypingIndicatorAnimation, string> = {
  bounce: 'wisp-typing-bounce',
  pulse: 'wisp-typing-pulse',
  scale: 'wisp-typing-scale',
  wave: 'wisp-typing-wave',
};

const animationDurationMap: Record<TypingIndicatorAnimation, number> = {
  bounce: 1200,
  pulse: 1400,
  scale: 1200,
  wave: 1600,
};

// ---------------------------------------------------------------------------
// Dots container
// ---------------------------------------------------------------------------

/**
 * Builds the style for the dots container (inline row of dots).
 */
export function buildDotsContainerStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
  };
}

// ---------------------------------------------------------------------------
// Individual dot
// ---------------------------------------------------------------------------

/**
 * Builds the style for a single animated dot.
 *
 * @param index - Zero-based dot index (0, 1, 2), used for stagger delay.
 * @param animation - Animation variant.
 * @param dotSize - Dot diameter in pixels.
 * @param color - Dot color.
 */
export function buildDotStyle(
  index: number,
  animation: TypingIndicatorAnimation,
  dotSize: number,
  color: string,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  const name = animationNameMap[animation];
  const duration = animationDurationMap[animation];
  const delay = index * 150;

  return {
    width: dotSize,
    height: dotSize,
    borderRadius: radii.full,
    backgroundColor: color,
    animation: `${name} ${duration}ms ${delay}ms infinite ease-in-out`,
    // For pulse animation, start with low opacity
    ...(animation === 'pulse' ? { opacity: 0.3 } : {}),
  };
}

// ---------------------------------------------------------------------------
// Bubble wrapper (matches ChatBubble shape)
// ---------------------------------------------------------------------------

/**
 * Builds the style for the bubble container that wraps the dots.
 *
 * @param align - Message direction.
 * @param themeColors - Current theme color tokens.
 */
export function buildTypingBubbleStyle(
  align: ChatBubbleAlignment,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing, radii } = theme;
  const isOutgoing = align === 'outgoing';

  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing.md}px ${spacing.lg}px`,
    borderRadius: isOutgoing ? `${radii.lg}px ${radii.lg}px 2px ${radii.lg}px` : `${radii.lg}px ${radii.lg}px ${radii.lg}px 2px`,
    backgroundColor: isOutgoing ? themeColors.accent.primary : themeColors.background.raised,
    border: `1px solid ${isOutgoing ? themeColors.border.subtle : themeColors.accent.dividerRaised}`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Outer wrapper
// ---------------------------------------------------------------------------

/**
 * Builds the style for the outer wrapper when in bubble mode.
 *
 * @param align - Message direction.
 */
export function buildTypingGroupStyle(
  align: ChatBubbleAlignment,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: align === 'outgoing' ? 'flex-end' : 'flex-start',
    gap: spacing.xs,
  };
}

// ---------------------------------------------------------------------------
// Row: avatar + bubble side-by-side
// ---------------------------------------------------------------------------

/**
 * Builds the style for the horizontal row that places avatar beside the bubble.
 *
 * @param align - Message direction.
 */
export function buildTypingRowStyle(
  align: ChatBubbleAlignment,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: align === 'outgoing' ? 'row-reverse' : 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  };
}

// ---------------------------------------------------------------------------
// Sender name text
// ---------------------------------------------------------------------------

/**
 * Builds the style for the sender name text displayed above the row.
 *
 * @param themeColors - Current theme color tokens.
 */
export function buildTypingSenderNameStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    fontFamily: fontFamilyStacks.sans,
    color: themeColors.text.secondary,
  };
}
