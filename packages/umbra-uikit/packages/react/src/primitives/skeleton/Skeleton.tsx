import React, { forwardRef, useMemo, useEffect } from 'react';
import type { SkeletonProps } from '@coexist/wisp-core/types/Skeleton.types';
import {
  ensureSkeletonKeyframes,
  buildBlockStyle,
  buildTextContainerStyle,
  buildTextLineStyle,
  buildWaveOverlayStyle,
} from '@coexist/wisp-core/styles/Skeleton.styles';
import { useTheme } from '../../providers';

/**
 * Skeleton — Placeholder loading indicator for content that has not yet loaded.
 *
 * @remarks
 * - Three shape variants: `rectangular` (default), `circular`, and `text`.
 * - Two animation modes plus a static fallback: `pulse` (default), `wave`, and `none`.
 * - The `text` variant renders multiple shimmer lines with the last line shortened
 *   to 60 % width for a natural paragraph look.
 * - Injects CSS `@keyframes` once per document via {@link ensureSkeletonKeyframes}.
 * - Marked `aria-hidden="true"` so screen readers skip the placeholder.
 * - Forwards a ref to the root `<div>` element.
 *
 * @module primitives/skeleton
 * @example
 * ```tsx
 * <Skeleton variant="rectangular" width={200} height={20} />
 * ```
 * @example
 * ```tsx
 * <Skeleton variant="circular" width={48} />
 * ```
 * @example
 * ```tsx
 * <Skeleton variant="text" lines={4} animation="wave" />
 * ```
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  {
    variant = 'rectangular',
    width,
    height,
    lines = 3,
    lineHeight = 16,
    lineSpacing = 8,
    radius,
    animation = 'pulse',
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  useEffect(() => {
    ensureSkeletonKeyframes();
  }, []);

  if (variant === 'circular') {
    const size = width ?? height ?? 48;
    const blockStyle = useMemo(
      () => buildBlockStyle(theme, {
        width: size,
        height: size,
        borderRadius: '50%',
        animation,
      }),
      [theme, size, animation],
    );

    return (
      <div
        ref={ref}
        aria-hidden="true"
        style={{ ...blockStyle, ...userStyle }}
        {...rest}
      >
        {animation === 'wave' && <div style={buildWaveOverlayStyle(theme)} />}
      </div>
    );
  }

  if (variant === 'text') {
    const resolvedWidth = width ?? '100%';
    const resolvedRadius = radius ?? 4;

    const containerStyle = useMemo(
      () => buildTextContainerStyle(resolvedWidth),
      [resolvedWidth],
    );

    const lineElements = useMemo(() => {
      const elements: React.ReactElement[] = [];
      for (let i = 0; i < lines; i++) {
        const isLast = i === lines - 1;
        const widthPercent = isLast && lines > 1 ? '60%' : '100%';
        const mb = isLast ? 0 : lineSpacing;
        const lineStyle = buildTextLineStyle(theme, {
          lineHeight,
          borderRadius: resolvedRadius,
          animation,
          widthPercent,
          marginBottom: mb,
        });
        elements.push(
          <div key={i} style={{ ...lineStyle, position: animation === 'wave' ? ('relative' as const) : undefined }}>
            {animation === 'wave' && <div style={buildWaveOverlayStyle(theme)} />}
          </div>,
        );
      }
      return elements;
    }, [lines, lineSpacing, lineHeight, resolvedRadius, animation, theme]);

    return (
      <div
        ref={ref}
        aria-hidden="true"
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        {lineElements}
      </div>
    );
  }

  const resolvedWidth = width ?? '100%';
  const resolvedHeight = height ?? 48;
  const resolvedRadius = radius ?? 8;

  const blockStyle = useMemo(
    () => buildBlockStyle(theme, {
      width: resolvedWidth,
      height: resolvedHeight,
      borderRadius: resolvedRadius,
      animation,
    }),
    [theme, resolvedWidth, resolvedHeight, resolvedRadius, animation],
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ ...blockStyle, ...userStyle }}
      {...rest}
    >
      {animation === 'wave' && <div style={buildWaveOverlayStyle(theme)} />}
    </div>
  );
});

Skeleton.displayName = 'Skeleton';
