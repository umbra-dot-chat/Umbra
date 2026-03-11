/**
 * @module types/TextEffectWrapper
 * @description Type definitions for the TextEffectWrapper component.
 *
 * Wraps message content with iMessage-style animations that play once
 * on first render.
 */

import type { TextEffectType } from './TextEffectPicker.types';

/**
 * Props for the TextEffectWrapper component.
 */
export interface TextEffectWrapperProps {
  /** The text effect to apply. If undefined, no animation is applied. */
  effect?: TextEffectType;
  /** Unique message ID used to track whether the animation has already played. */
  messageId: string;
  /** Children to render inside the animation wrapper. */
  children: React.ReactNode;
  /** Callback fired when a screen-wide effect (confetti/balloons) should trigger. */
  onScreenEffect?: (effect: 'confetti' | 'balloons', messageId: string) => void;
}
