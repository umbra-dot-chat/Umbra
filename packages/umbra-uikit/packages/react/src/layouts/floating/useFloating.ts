import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import type {
  FloatingPlacement,
  FloatingAlign,
  FloatingStrategy,
  FloatingPosition,
  UseFloatingOptions,
} from '@coexist/wisp-core/types/Floating.types';

// ---------------------------------------------------------------------------
// Position calculation
// ---------------------------------------------------------------------------

/**
 * Calculates the absolute viewport position for floating content relative to a trigger element.
 *
 * @param triggerRect - Bounding client rect of the anchor/trigger element.
 * @param contentRect - Width and height of the floating content.
 * @param placement - Primary placement side.
 * @param align - Cross-axis alignment.
 * @param offset - Distance from the trigger in pixels.
 * @returns An object with `top` and `left` pixel coordinates.
 */
function calculatePosition(
  triggerRect: DOMRect,
  contentRect: { width: number; height: number },
  placement: FloatingPlacement,
  align: FloatingAlign,
  offset: number,
): { top: number; left: number } {
  let top = 0;
  let left = 0;

  // Primary axis
  switch (placement) {
    case 'top':
      top = triggerRect.top - offset - contentRect.height;
      break;
    case 'bottom':
      top = triggerRect.bottom + offset;
      break;
    case 'left':
      left = triggerRect.left - offset - contentRect.width;
      break;
    case 'right':
      left = triggerRect.right + offset;
      break;
  }

  // Cross-axis alignment
  if (placement === 'top' || placement === 'bottom') {
    switch (align) {
      case 'start':
        left = triggerRect.left;
        break;
      case 'center':
        left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
        break;
      case 'end':
        left = triggerRect.right - contentRect.width;
        break;
    }
  } else {
    switch (align) {
      case 'start':
        top = triggerRect.top;
        break;
      case 'center':
        top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
        break;
      case 'end':
        top = triggerRect.bottom - contentRect.height;
        break;
    }
  }

  return { top, left };
}

// ---------------------------------------------------------------------------
// Flip logic — switch to opposite side when clipped
// ---------------------------------------------------------------------------

/** Maps each placement to its opposite side for flip collision handling. */
const oppositePlacement: Record<FloatingPlacement, FloatingPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/**
 * Determines whether the floating content should flip to the opposite side.
 *
 * @param position - Current computed position.
 * @param contentRect - Width and height of the floating content.
 * @param placement - Current placement side.
 * @returns `true` if the content overflows the viewport on the given side.
 */
function shouldFlip(
  position: { top: number; left: number },
  contentRect: { width: number; height: number },
  placement: FloatingPlacement,
): boolean {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  switch (placement) {
    case 'top':
      return position.top < 0;
    case 'bottom':
      return position.top + contentRect.height > vh;
    case 'left':
      return position.left < 0;
    case 'right':
      return position.left + contentRect.width > vw;
  }
}

// ---------------------------------------------------------------------------
// Shift logic — clamp to viewport edges
// ---------------------------------------------------------------------------

/**
 * Clamps a floating position to keep content within viewport bounds.
 *
 * @param position - Current computed position.
 * @param contentRect - Width and height of the floating content.
 * @param padding - Minimum distance from viewport edges in pixels.
 * @returns A new position clamped to the viewport.
 */
function shiftPosition(
  position: { top: number; left: number },
  contentRect: { width: number; height: number },
  padding: number = 8,
): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  return {
    top: Math.min(Math.max(position.top, padding), vh - contentRect.height - padding),
    left: Math.min(Math.max(position.left, padding), vw - contentRect.width - padding),
  };
}

// ---------------------------------------------------------------------------
// useFloating hook
// ---------------------------------------------------------------------------

/**
 * useFloating -- Positioning hook for the Wisp design system.
 *
 * @remarks
 * Returns refs for anchor and floating elements, plus a computed
 * {@link FloatingPosition} object. Handles placement, alignment, offset,
 * and viewport collision detection (flip/shift).
 *
 * Re-measures on scroll and resize events while `open` is `true`.
 *
 * @param options - Configuration options (see {@link UseFloatingOptions}).
 * @returns An object containing `anchorRef`, `floatingRef`, `position`, and `updatePosition`.
 *
 * @example
 * ```tsx
 * const { anchorRef, floatingRef, position } = useFloating({
 *   placement: 'bottom',
 *   align: 'start',
 *   offset: 8,
 *   open: isOpen,
 * });
 *
 * return (
 *   <>
 *     <button ref={anchorRef}>Trigger</button>
 *     {isOpen && (
 *       <div ref={floatingRef} style={{ position: 'fixed', top: position.top, left: position.left }}>
 *         Content
 *       </div>
 *     )}
 *   </>
 * );
 * ```
 */
export function useFloating(options: UseFloatingOptions = {}) {
  const {
    placement = 'bottom',
    align = 'center',
    offset = 8,
    strategy = 'flip',
    open = false,
  } = options;

  const anchorRef = useRef<HTMLElement>(null);
  const floatingRef = useRef<HTMLElement>(null);

  const [position, setPosition] = useState<FloatingPosition>({
    top: 0,
    left: 0,
    transform: undefined,
    resolvedPlacement: placement,
  });

  const updatePosition = useCallback(() => {
    if (!anchorRef.current || !floatingRef.current) return;

    const triggerRect = anchorRef.current.getBoundingClientRect();
    const contentEl = floatingRef.current;
    const contentRect = { width: contentEl.offsetWidth, height: contentEl.offsetHeight };

    let activePlacement = placement;
    let pos = calculatePosition(triggerRect, contentRect, activePlacement, align, offset);

    // Apply collision strategy
    if (strategy === 'flip' && shouldFlip(pos, contentRect, activePlacement)) {
      activePlacement = oppositePlacement[activePlacement];
      pos = calculatePosition(triggerRect, contentRect, activePlacement, align, offset);
    }

    if (strategy === 'flip' || strategy === 'shift') {
      pos = shiftPosition(pos, contentRect);
    }

    setPosition({
      top: pos.top,
      left: pos.left,
      transform: undefined,
      resolvedPlacement: activePlacement,
    });
  }, [placement, align, offset, strategy]);

  // Update position when open changes or on scroll/resize
  useEffect(() => {
    if (!open) return;

    // Initial measurement (use rAF to ensure content is rendered)
    const frame = requestAnimationFrame(updatePosition);

    // Re-measure on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  return {
    anchorRef,
    floatingRef,
    position,
    updatePosition,
  };
}
