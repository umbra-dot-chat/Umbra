/**
 * @module Text
 */
import type React from 'react';
import type { TextSize, SemanticColor, FontWeightKey, FontFamilyKey } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Re-export shared tokens so Text consumers get them from one place
// ---------------------------------------------------------------------------

export {
  textSizes,
  semanticColors as textColors,
  fontWeightKeys as textWeights,
  fontFamilyKeys as textFamilies,
} from '../tokens/shared';

export type { TextSize } from '../tokens/shared';
export type { FontFamilyKey as TextFamily } from '../tokens/shared';

/**
 * Semantic color alias for the Text primitive.
 *
 * @remarks
 * Maps directly to {@link SemanticColor} from shared tokens. When passed to
 * the `color` prop it resolves to a theme-aware hex value at render time.
 */
export type TextColor = SemanticColor;

/**
 * Font weight alias for the Text primitive.
 *
 * @remarks
 * Maps directly to {@link FontWeightKey} from shared tokens
 * (e.g. `'regular'`, `'medium'`, `'semibold'`, `'bold'`).
 */
export type TextWeight = FontWeightKey;

// ---------------------------------------------------------------------------
// Text alignment
// ---------------------------------------------------------------------------

/**
 * Supported CSS `text-align` values for the Text primitive.
 */
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

// ---------------------------------------------------------------------------
// Polymorphic element types
// ---------------------------------------------------------------------------

/**
 * HTML elements that the {@link Text} component can render as via the `as` prop.
 *
 * @remarks
 * Covers common inline, block, heading, and semantic elements used in
 * typography contexts.
 */
export type TextElement =
  | 'span'
  | 'p'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'label'
  | 'div'
  | 'strong'
  | 'em'
  | 'small'
  | 'code'
  | 'blockquote'
  | 'li';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Text} component.
 *
 * @remarks
 * Extends native HTML element attributes (excluding `color`, which is
 * re-declared with a semantic union). All props are optional; sensible
 * defaults produce a medium, regular-weight, primary-color `<span>`.
 */
export interface TextProps extends Omit<React.HTMLAttributes<HTMLElement>, 'color'> {
  /** Text content (string, JSX, or any React node). */
  children?: React.ReactNode;

  /**
   * Font size step from the Wisp type scale.
   * @default 'md'
   */
  size?: TextSize;

  /**
   * Font weight.
   * @default 'regular'
   */
  weight?: FontWeightKey;

  /**
   * Semantic color variant that maps to theme-aware colors, or a raw CSS
   * color string to override entirely.
   * @default 'primary'
   */
  color?: SemanticColor | (string & {});

  /** CSS `text-align` value. */
  align?: TextAlign;

  /**
   * Font family stack.
   * @default 'sans'
   */
  family?: FontFamilyKey;

  /** Icon or element rendered before the text content. Sized automatically via the icon-gap token. */
  iconLeft?: React.ReactNode;

  /** Icon or element rendered after the text content. Sized automatically via the icon-gap token. */
  iconRight?: React.ReactNode;

  /**
   * When `true`, clips overflowing text to a single line with an ellipsis.
   * @default false
   */
  truncate?: boolean;

  /**
   * Maximum number of visible lines before clamping with an ellipsis
   * (uses `-webkit-line-clamp`).
   */
  maxLines?: number;

  /**
   * When `true`, renders a skeleton shimmer placeholder instead of text content.
   * @default false
   */
  skeleton?: boolean;

  /**
   * HTML element to render as (polymorphic).
   * @default 'span'
   */
  as?: TextElement;
}
