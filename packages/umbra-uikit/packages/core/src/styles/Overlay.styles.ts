import type { CSSStyleObject } from '../types';
import type { OverlayBackdrop } from '../types/Overlay.types';
import type { ZIndexKey } from '../tokens/z-index';
import { zIndex as zIndexScale } from '../tokens/z-index';

// ---------------------------------------------------------------------------
// Backdrop styles
// ---------------------------------------------------------------------------

/** Pre-defined CSS properties for each {@link OverlayBackdrop} variant. */
const backdropStyles: Record<OverlayBackdrop, CSSStyleObject> = {
  dim: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  blur: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
  transparent: {
    backgroundColor: 'transparent',
  },
};

// ---------------------------------------------------------------------------
// buildOverlayStyle
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the {@link Overlay} component.
 *
 * @param opts - Configuration object.
 * @param opts.backdrop - Backdrop visual style (`dim`, `blur`, or `transparent`).
 * @param opts.zIndex - Optional z-index token key from the theme scale.
 * @param opts.zIndexValue - Optional custom z-index number (takes precedence over `zIndex`).
 * @param opts.center - Whether to center children via flexbox.
 * @returns A `CSSStyleObject` object for the fixed-position overlay.
 */
export function buildOverlayStyle(opts: {
  backdrop: OverlayBackdrop;
  zIndex?: ZIndexKey;
  zIndexValue?: number;
  center: boolean;
}): CSSStyleObject {
  const style: CSSStyleObject = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...backdropStyles[opts.backdrop],
  };

  // Z-index
  if (opts.zIndexValue !== undefined) {
    style.zIndex = opts.zIndexValue;
  } else {
    style.zIndex = zIndexScale[opts.zIndex ?? 'overlay'];
  }

  // Center children
  if (opts.center) {
    style.display = 'flex';
    style.alignItems = 'center';
    style.justifyContent = 'center';
  }

  return style;
}
