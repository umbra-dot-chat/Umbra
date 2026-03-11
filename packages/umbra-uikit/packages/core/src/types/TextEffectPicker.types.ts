/**
 * @module types/TextEffectPicker
 * @description Type definitions for the TextEffectPicker component.
 *
 * Provides a popup picker for iMessage-style text effects that can be
 * triggered via long-press on the send button.
 */

/**
 * Available text effects.
 */
export const textEffects = [
  'slam',
  'gentle',
  'loud',
  'invisible_ink',
  'confetti',
  'balloons',
  'shake',
  'fade_in',
] as const;

export type TextEffectType = (typeof textEffects)[number];

/**
 * Metadata for each text effect: display name, description, emoji preview.
 */
export interface TextEffectInfo {
  /** Machine key. */
  key: TextEffectType;
  /** Human-readable label. */
  label: string;
  /** Short description. */
  description: string;
  /** Emoji used as a visual preview icon. */
  icon: string;
}

/**
 * Pre-defined effect info for all 8 effects.
 */
export const textEffectInfoMap: Record<TextEffectType, TextEffectInfo> = {
  slam: {
    key: 'slam',
    label: 'Slam',
    description: 'Drops in with impact',
    icon: '💥',
  },
  gentle: {
    key: 'gentle',
    label: 'Gentle',
    description: 'Floats in softly',
    icon: '🪶',
  },
  loud: {
    key: 'loud',
    label: 'Loud',
    description: 'Shakes with emphasis',
    icon: '📢',
  },
  invisible_ink: {
    key: 'invisible_ink',
    label: 'Invisible Ink',
    description: 'Hidden until tapped',
    icon: '👁️‍🗨️',
  },
  confetti: {
    key: 'confetti',
    label: 'Confetti',
    description: 'Celebrates with confetti',
    icon: '🎉',
  },
  balloons: {
    key: 'balloons',
    label: 'Balloons',
    description: 'Floating balloons',
    icon: '🎈',
  },
  shake: {
    key: 'shake',
    label: 'Shake',
    description: 'Vibrates on screen',
    icon: '📳',
  },
  fade_in: {
    key: 'fade_in',
    label: 'Fade In',
    description: 'Letter by letter reveal',
    icon: '✨',
  },
};

/**
 * Props for the TextEffectPicker component.
 */
export interface TextEffectPickerProps {
  /** Called when an effect is selected. */
  onSelect: (effect: TextEffectType) => void;
  /** Called when the picker is dismissed without selection. */
  onDismiss?: () => void;
  /** Whether the picker is visible. */
  visible?: boolean;
  /** Currently selected effect (for highlighting). */
  selectedEffect?: TextEffectType;
}
