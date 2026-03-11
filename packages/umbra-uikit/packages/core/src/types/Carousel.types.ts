/**
 * @module Carousel.types
 * @description Type definitions for the Wisp Carousel component.
 */

import type React from 'react';
import type { HTMLAttributes } from 'react';

/**
 * Props accepted by the {@link Carousel} component.
 *
 * @remarks
 * Supports both controlled (`index` + `onChange`) and uncontrolled
 * (`defaultIndex`) usage patterns. When `autoPlay` is enabled the
 * carousel cycles through slides at the configured interval and
 * pauses on hover.
 */
export interface CarouselProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Slide content. Each direct child is treated as a single slide. */
  children: React.ReactNode;

  /**
   * When `true` the carousel automatically advances to the next slide.
   * @default false
   */
  autoPlay?: boolean;

  /**
   * Milliseconds between auto-play transitions.
   * @default 5000
   */
  autoPlayInterval?: number;

  /**
   * When `true` navigation wraps from the last slide back to the first
   * (and vice-versa).
   * @default true
   */
  loop?: boolean;

  /**
   * When `true` left/right navigation arrows are rendered.
   * @default true
   */
  showArrows?: boolean;

  /**
   * When `true` dot indicators are rendered below the slides.
   * @default true
   */
  showDots?: boolean;

  /**
   * Callback fired when the active slide changes. Receives the 0-based
   * slide index.
   */
  onChange?: (index: number) => void;

  /**
   * Initial slide index for uncontrolled mode.
   * @default 0
   */
  defaultIndex?: number;

  /**
   * Controlled slide index. When provided the component is fully controlled.
   */
  index?: number;

  /**
   * CSS `aspect-ratio` value applied to the container (e.g. `'16/9'`).
   * When omitted the carousel sizes to its content.
   */
  aspectRatio?: string;

  /**
   * When `true` a pulsing skeleton placeholder is rendered instead of
   * the carousel.
   * @default false
   */
  skeleton?: boolean;
}
