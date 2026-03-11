/**
 * @module EmojiReactionsOverlay
 * @description Style utilities for the EmojiReactionsOverlay component.
 */

/**
 * Resolve the background color for the quick-reaction bar.
 */
export function resolveQuickBarBackground(isDark: boolean): string {
  return isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
}

/**
 * Resolve the border color for the quick-reaction bar.
 */
export function resolveQuickBarBorder(isDark: boolean): string {
  return isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.12)';
}

/**
 * Resolve the background color for an individual reaction bubble.
 */
export function resolveReactionBubbleBackground(isDark: boolean): string {
  return isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.06)';
}
