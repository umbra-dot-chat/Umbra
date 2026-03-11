/**
 * @module Carousel
 * @description A responsive image / content carousel with auto-play, looping,
 * navigation arrows, dot indicators, and touch-swipe support.
 *
 * @remarks
 * Key features:
 * - Controlled and uncontrolled usage via {@link CarouselProps.index} /
 *   {@link CarouselProps.defaultIndex}.
 * - Auto-play with configurable interval, pauses on hover.
 * - Wrap-around (loop) navigation.
 * - Touch / pointer drag support for swipe gestures.
 * - Fully theme-aware via {@link useThemeColors}.
 * - Skeleton loading state.
 *
 * @example
 * ```tsx
 * <Carousel autoPlay autoPlayInterval={3000}>
 *   <img src="/slide-1.jpg" alt="Slide 1" />
 *   <img src="/slide-2.jpg" alt="Slide 2" />
 *   <img src="/slide-3.jpg" alt="Slide 3" />
 * </Carousel>
 * ```
 */

import React, {
  forwardRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  Children,
} from 'react';
import type { CarouselProps } from '@coexist/wisp-core/types/Carousel.types';
import {
  buildCarouselContainerStyle,
  buildCarouselTrackStyle,
  buildCarouselSlideStyle,
  buildCarouselArrowStyle,
  buildCarouselDotsContainerStyle,
  buildCarouselDotStyle,
  buildCarouselSkeletonStyle,
} from '@coexist/wisp-core/styles/Carousel.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Internal chevron SVG icons
// ---------------------------------------------------------------------------

/** Left-pointing chevron for the "previous" arrow. */
const ChevronLeftIcon: React.FC = () => (
  <svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

/** Right-pointing chevron for the "next" arrow. */
const ChevronRightIcon: React.FC = () => (
  <svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

// ---------------------------------------------------------------------------
// Carousel component
// ---------------------------------------------------------------------------

/**
 * Carousel -- A sliding content carousel with auto-play, looping, arrows,
 * dots, and touch/swipe support.
 *
 * @see {@link CarouselProps} for the full prop interface.
 */
export const Carousel = forwardRef<HTMLDivElement, CarouselProps>(
  function Carousel(
    {
      children,
      autoPlay = false,
      autoPlayInterval = 5000,
      loop = true,
      showArrows = true,
      showDots = true,
      onChange,
      defaultIndex = 0,
      index: controlledIndex,
      aspectRatio,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
  const themeColors = theme.colors;
    const slides = useMemo(() => Children.toArray(children), [children]);
    const slideCount = slides.length;

    // ----- Controlled / uncontrolled index ---------------------------------

    const isControlled = controlledIndex !== undefined;
    const [internalIndex, setInternalIndex] = useState(defaultIndex);
    const currentIndex = isControlled ? controlledIndex : internalIndex;

    const goTo = useCallback(
      (next: number) => {
        let resolved = next;
        if (loop) {
          resolved = ((next % slideCount) + slideCount) % slideCount;
        } else {
          resolved = Math.max(0, Math.min(next, slideCount - 1));
        }
        if (!isControlled) setInternalIndex(resolved);
        onChange?.(resolved);
      },
      [isControlled, loop, slideCount, onChange],
    );

    const goNext = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex]);
    const goPrev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex]);

    // ----- Auto-play -------------------------------------------------------

    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
      if (!autoPlay || isPaused || slideCount <= 1) return;

      timerRef.current = setInterval(() => {
        goNext();
      }, autoPlayInterval);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }, [autoPlay, autoPlayInterval, isPaused, slideCount, goNext]);

    const handleMouseEnter = useCallback(() => setIsPaused(true), []);
    const handleMouseLeave = useCallback(() => setIsPaused(false), []);

    // ----- Touch / pointer drag support ------------------------------------

    const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
    const [dragOffset, setDragOffset] = useState(0);
    const [isAnimating, setIsAnimating] = useState(true);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        pointerStartRef.current = { x: e.clientX, y: e.clientY };
        setIsAnimating(false);
        setDragOffset(0);
      },
      [],
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!pointerStartRef.current || !containerRef.current) return;
        const dx = e.clientX - pointerStartRef.current.x;
        const containerWidth = containerRef.current.offsetWidth;
        if (containerWidth > 0) {
          setDragOffset((dx / containerWidth) * 100);
        }
      },
      [],
    );

    const handlePointerUp = useCallback(() => {
      if (!pointerStartRef.current) return;
      setIsAnimating(true);

      const threshold = 15; // percentage of container width
      if (dragOffset < -threshold) {
        goNext();
      } else if (dragOffset > threshold) {
        goPrev();
      }

      setDragOffset(0);
      pointerStartRef.current = null;
    }, [dragOffset, goNext, goPrev]);

    const handlePointerCancel = useCallback(() => {
      pointerStartRef.current = null;
      setDragOffset(0);
      setIsAnimating(true);
    }, []);

    // ----- Arrow hover state -----------------------------------------------

    const [hoveredArrow, setHoveredArrow] = useState<'left' | 'right' | null>(null);

    // ----- Merge refs ------------------------------------------------------

    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        containerRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [ref],
    );

    // ----- Skeleton --------------------------------------------------------

    if (skeleton) {
      const skeletonStyle = buildCarouselSkeletonStyle(theme, aspectRatio);
      return (
        <div
          aria-hidden
          data-testid="carousel-skeleton"
          className={className}
          style={{ ...skeletonStyle, ...userStyle }}
        />
      );
    }

    // ----- Styles ----------------------------------------------------------

    const containerStyle: React.CSSProperties = {
      ...buildCarouselContainerStyle(theme, aspectRatio),
      ...userStyle,
    };

    const trackOffset = currentIndex * 100 - dragOffset;
    const trackStyle = buildCarouselTrackStyle(trackOffset, isAnimating);
    const slideStyle = buildCarouselSlideStyle();
    const dotsContainerStyle = buildCarouselDotsContainerStyle(theme);

    // ----- Arrow visibility ------------------------------------------------

    const canGoPrev = loop || currentIndex > 0;
    const canGoNext = loop || currentIndex < slideCount - 1;

    // ----- Render ----------------------------------------------------------

    return (
      <div
        ref={setRefs}
        className={className}
        style={containerStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        role="region"
        aria-roledescription="carousel"
        aria-label="Carousel"
        {...rest}
      >
        {/* Slide track */}
        <div style={trackStyle}>
          {slides.map((slide, i) => (
            <div
              key={i}
              style={slideStyle}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${i + 1} of ${slideCount}`}
            >
              {slide}
            </div>
          ))}
        </div>

        {/* Previous arrow */}
        {showArrows && canGoPrev && (
          <button
            type="button"
            aria-label="Previous slide"
            style={buildCarouselArrowStyle(theme, 'left', hoveredArrow === 'left')}
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            onMouseEnter={() => setHoveredArrow('left')}
            onMouseLeave={() => setHoveredArrow(null)}
          >
            <ChevronLeftIcon />
          </button>
        )}

        {/* Next arrow */}
        {showArrows && canGoNext && (
          <button
            type="button"
            aria-label="Next slide"
            style={buildCarouselArrowStyle(theme, 'right', hoveredArrow === 'right')}
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            onMouseEnter={() => setHoveredArrow('right')}
            onMouseLeave={() => setHoveredArrow(null)}
          >
            <ChevronRightIcon />
          </button>
        )}

        {/* Dot indicators */}
        {showDots && slideCount > 1 && (
          <div style={dotsContainerStyle} role="tablist" aria-label="Slide indicators">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === currentIndex}
                aria-label={`Go to slide ${i + 1}`}
                style={buildCarouselDotStyle(theme, i === currentIndex)}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i);
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  },
);

Carousel.displayName = 'Carousel';
