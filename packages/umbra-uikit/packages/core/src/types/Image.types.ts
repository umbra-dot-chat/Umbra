import type { ThemeRadii } from '../theme/types';
import type React from 'react';

/** Available object-fit values for the image element. */
export const imageFits = ['cover', 'contain', 'fill', 'none'] as const;

/** Union of allowed image object-fit values. */
export type ImageFit = (typeof imageFits)[number];

/** Available border-radius presets for the image wrapper. */
export const imageRadii = ['none', 'sm', 'md', 'lg', 'xl', 'full'] as const;

/** Union of allowed image radius values. */
export type ImageRadius = (typeof imageRadii)[number];

/**
 * Maps each {@link ImageRadius} to its corresponding pixel value.
 */
export const imageRadiusMap: Record<ImageRadius, keyof ThemeRadii> = {
  none: 'none',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
  full: 'full',
};

/**
 * Props accepted by the {@link Image} component.
 *
 * @remarks
 * Extends the native `HTMLImageElement` attributes (with `placeholder` omitted
 * to avoid conflicts with the component's own fallback mechanism) so any
 * standard `img` prop (e.g. `srcSet`, `sizes`, `crossOrigin`) is also accepted.
 */
export interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'placeholder'> {
  /** Custom React node rendered when the image fails to load. */
  fallback?: React.ReactNode;
  /** How the image should fit within its container. @default 'cover' */
  objectFit?: ImageFit;
  /** CSS aspect-ratio value for the wrapper (e.g. '16/9', '1/1'). */
  aspectRatio?: string;
  /** Border-radius preset for the image wrapper. @default 'none' */
  radius?: ImageRadius;
  /** When `true`, shows a pulsing skeleton placeholder while the image is loading. @default false */
  skeleton?: boolean;
  /** When `true`, uses native `loading="lazy"` for deferred loading. @default true */
  lazy?: boolean;
}
