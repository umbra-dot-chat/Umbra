import React, { forwardRef, useMemo, useState, useEffect, useCallback } from 'react';
import { ImageOff } from 'lucide-react';
import type { ImageProps } from '@coexist/wisp-core/types/Image.types';
import {
  buildWrapperStyle,
  buildImageStyle,
  buildFallbackStyle,
  buildSkeletonStyle,
} from '@coexist/wisp-core/styles/Image.styles';
import { useTheme } from '../../providers';

/**
 * Image — Displays an image with built-in loading, error, and skeleton states.
 *
 * @remarks
 * Key features:
 * - Native lazy loading via `loading="lazy"` (default enabled).
 * - Smooth opacity transition when the image finishes loading.
 * - Configurable `objectFit` and `aspectRatio` for flexible layouts.
 * - Six border-radius presets (`none` through `full`).
 * - Optional skeleton pulse animation while loading.
 * - Customisable fallback UI on error (defaults to an `ImageOff` icon).
 * - Forwards a ref to the outer wrapper `<div>`.
 *
 * @module primitives/image
 * @example
 * ```tsx
 * <Image src="/photo.jpg" alt="Landscape" aspectRatio="16/9" radius="md" />
 * <Image src="/missing.jpg" alt="Broken" fallback={<span>No image</span>} />
 * <Image skeleton aspectRatio="1/1" radius="lg" />
 * ```
 */
export const Image = forwardRef<HTMLDivElement, ImageProps>(function Image(
  {
    src,
    alt,
    fallback,
    objectFit = 'cover',
    aspectRatio,
    radius = 'none',
    skeleton = false,
    lazy = true,
    className,
    style: userStyle,
    onLoad: userOnLoad,
    onError: userOnError,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  // Reset state when src changes
  useEffect(() => {
    setStatus('loading');
  }, [src]);

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setStatus('loaded');
      userOnLoad?.(e);
    },
    [userOnLoad],
  );

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setStatus('error');
      userOnError?.(e);
    },
    [userOnError],
  );

  const wrapperStyle = useMemo(
    () => buildWrapperStyle(radius, aspectRatio, theme),
    [radius, aspectRatio, theme],
  );

  const imgStyle = useMemo(
    () => buildImageStyle(objectFit, status === 'loaded'),
    [objectFit, status],
  );

  const fallbackStyle = useMemo(
    () => buildFallbackStyle(theme),
    [theme],
  );

  const skeletonStyle = useMemo(
    () => buildSkeletonStyle(theme),
    [theme],
  );

  const defaultFallback = (
    <div style={fallbackStyle}>
      <ImageOff size={24} />
    </div>
  );

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...wrapperStyle, ...userStyle }}
      role="img"
      aria-label={alt}
    >
      {/* Render the <img> unless we have an error with no src */}
      {src && status !== 'error' && (
        <img
          src={src}
          alt={alt || ''}
          style={imgStyle}
          loading={lazy ? 'lazy' : undefined}
          onLoad={handleLoad}
          onError={handleError}
          {...rest}
        />
      )}

      {/* Skeleton overlay while loading */}
      {skeleton && status === 'loading' && (
        <div aria-hidden style={skeletonStyle} />
      )}

      {/* Fallback on error */}
      {status === 'error' && (fallback ?? defaultFallback)}
    </div>
  );
});

Image.displayName = 'Image';
