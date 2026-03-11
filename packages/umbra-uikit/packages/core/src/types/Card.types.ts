import type { ThemeRadii } from '../theme/types';
import type React from 'react';

/** Available card visual variant options. */
export const cardVariants = ['elevated', 'outlined', 'filled', 'glass'] as const;

/** Union of allowed card variant values. */
export type CardVariant = (typeof cardVariants)[number];

/** Available card padding presets. */
export const cardPaddings = ['none', 'sm', 'md', 'lg'] as const;

/** Union of allowed card padding values. */
export type CardPadding = (typeof cardPaddings)[number];

/** Maps each {@link CardPadding} to its pixel value. */
export const cardPaddingMap: Record<CardPadding, number> = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 24,
};

/** Available card border-radius presets. */
export const cardRadii = ['none', 'sm', 'md', 'lg'] as const;

/** Union of allowed card radius values. */
export type CardRadius = (typeof cardRadii)[number];

/** Maps each {@link CardRadius} to its pixel value. */
export const cardRadiusMap: Record<CardRadius, keyof ThemeRadii> = {
  none: 'none',
  sm: 'md',
  md: 'lg',
  lg: 'xl',
};

/**
 * Props accepted by the {@link Card} component.
 *
 * @remarks
 * The Card is polymorphic -- use the `as` prop to change the rendered element.
 * Any additional HTML attributes are spread onto the root element.
 */
export interface CardProps {
  /** Content rendered inside the card. */
  children?: React.ReactNode;
  /** Visual style variant. @default 'elevated' */
  variant?: CardVariant;
  /** Inner padding preset. @default 'md' */
  padding?: CardPadding;
  /** Border-radius preset. @default 'md' */
  radius?: CardRadius;
  /** Enables hover, press, and cursor-pointer interaction styles. @default false */
  interactive?: boolean;
  /** Applies a highlighted border to indicate selection. @default false */
  selected?: boolean;
  /** Reduces opacity and prevents click events. @default false */
  disabled?: boolean;
  /** When `true`, renders a pulsing skeleton placeholder instead of content. @default false */
  skeleton?: boolean;
  /** Polymorphic element type for the root node. @default 'div' */
  as?: React.ElementType;
  /** Click handler invoked when the card is clicked (respects `disabled`). */
  onClick?: (e: React.MouseEvent) => void;
  /** Additional CSS class name applied to the root element. */
  className?: string;
  /** Inline style overrides merged onto the root element. */
  style?: React.CSSProperties;
}
