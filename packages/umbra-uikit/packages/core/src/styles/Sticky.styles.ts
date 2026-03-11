import type { CSSStyleObject } from '../types';
import type { StickyEdge } from '../types/Sticky.types';
import type { ZIndexKey } from '../tokens/z-index';
import { zIndex as zIndexScale } from '../tokens/z-index';

// ---------------------------------------------------------------------------
// buildStickyStyle
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the {@link Sticky} component.
 *
 * @param opts - Configuration object.
 * @param opts.edge - The sticky edge (`top` or `bottom`).
 * @param opts.offset - Pixel offset from the sticky edge.
 * @param opts.zIndex - Optional z-index token key from the theme scale.
 * @param opts.zIndexValue - Optional custom z-index number (takes precedence over `zIndex`).
 * @returns A `CSSStyleObject` object with `position: sticky` and resolved offsets.
 */
export function buildStickyStyle(opts: {
  edge: StickyEdge;
  offset: number;
  zIndex?: ZIndexKey;
  zIndexValue?: number;
}): CSSStyleObject {
  const style: CSSStyleObject = {
    position: 'sticky',
  };

  // Edge offset
  if (opts.edge === 'top') {
    style.top = opts.offset;
  } else {
    style.bottom = opts.offset;
  }

  // Z-index: custom value wins, then layer token
  if (opts.zIndexValue !== undefined) {
    style.zIndex = opts.zIndexValue;
  } else {
    style.zIndex = zIndexScale[opts.zIndex ?? 'sticky'];
  }

  return style;
}
