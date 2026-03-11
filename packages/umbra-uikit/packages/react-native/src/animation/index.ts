export { Presence } from './Presence';
export type { PresenceProps, PresenceAnimation } from './Presence';
export { useAnimatedValue } from './use-animated-value';
export type { AnimatedValueConfig, AnimatedValueResult } from './use-animated-value';
export { usePressAnimation } from './use-press-animation';
export type { PressAnimationConfig, PressAnimationResult } from './use-press-animation';
export { useSpring } from './use-spring';
export type { SpringResult } from './use-spring';
export { useTransition } from './use-transition';
export type { TransitionPhase, TransitionConfig, TransitionResult } from './use-transition';
export { useTextScramble } from './use-text-scramble';
export type { TextScrambleOptions, TextScrambleResult } from './use-text-scramble';

// Re-export shared presets and constants from core
export * from '@coexist/wisp-core/animation/presets';
export * from '@coexist/wisp-core/animation/constants';
