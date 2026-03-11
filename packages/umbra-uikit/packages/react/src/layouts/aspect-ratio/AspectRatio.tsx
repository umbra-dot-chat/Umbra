/**
 * AspectRatio — Constrains its children to a given width-to-height ratio.
 *
 * @remarks
 * Uses the CSS `padding-bottom` percentage technique to maintain a
 * responsive aspect ratio regardless of the container width. The child
 * content is absolutely positioned to fill the resulting box.
 *
 * Key features:
 * - Accepts any numeric ratio (e.g. `16 / 9`, `4 / 3`, `1`).
 * - Works with images, videos, maps, iframes, or arbitrary content.
 * - Forwards a ref to the outer wrapper `<div>`.
 *
 * @module primitives/aspect-ratio
 * @example
 * ```tsx
 * <AspectRatio ratio={16 / 9}>
 *   <img src="/hero.jpg" alt="Hero" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
 * </AspectRatio>
 * ```
 */

import React, { forwardRef, useMemo } from 'react';
import type { AspectRatioProps } from '@coexist/wisp-core/types/AspectRatio.types';
import type { CSSStyleObject } from '@coexist/wisp-core/types';
import { buildContainerStyle, buildInnerStyle } from '@coexist/wisp-core/styles/AspectRatio.styles';

/**
 * AspectRatio component that constrains its children to a given
 * width-to-height ratio using the padding-bottom technique.
 *
 * @remarks
 * Forwards a ref to the outer wrapper `<div>`. The inner `<div>` is
 * absolutely positioned to fill the padded area so children can use
 * `width: 100%` and `height: 100%` naturally.
 *
 * @example
 * ```tsx
 * <AspectRatio ratio={4 / 3}>
 *   <video src="/clip.mp4" />
 * </AspectRatio>
 * ```
 */
export const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(function AspectRatio(
  {
    ratio = 1,
    children,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const containerStyle = useMemo(
    () => buildContainerStyle(ratio, userStyle as CSSStyleObject),
    [ratio, userStyle],
  );

  const innerStyle = useMemo(() => buildInnerStyle(), []);

  return (
    <div
      ref={ref}
      className={className}
      style={containerStyle}
      {...rest}
    >
      <div style={innerStyle}>
        {children}
      </div>
    </div>
  );
});

AspectRatio.displayName = 'AspectRatio';
