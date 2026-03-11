import React, { forwardRef, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import type { CollapseProps } from '@coexist/wisp-core/types/Collapse.types';
import { collapseDurationMap } from '@coexist/wisp-core/types/Collapse.types';

/**
 * Collapse -- Animated expand/collapse container for the Wisp design system.
 *
 * @remarks
 * Measures content height via `scrollHeight` and transitions `max-height`
 * for smooth open/close animation.
 *
 * - Preset or custom duration in milliseconds.
 * - Configurable CSS easing function.
 * - Optional unmount-on-close to remove children from the DOM when collapsed.
 * - Fires `onTransitionEnd` after the expand/collapse animation completes.
 *
 * @module primitives/collapse
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <Button onClick={() => setOpen(!open)}>Toggle</Button>
 * <Collapse open={open}>
 *   <Box p="md">Collapsible content</Box>
 * </Collapse>
 * ```
 */
export const Collapse = forwardRef<HTMLDivElement, CollapseProps>(function Collapse(
  {
    children,
    open = false,
    duration = 'normal',
    durationMs,
    easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
    unmountOnClose = false,
    onTransitionEnd: userOnTransitionEnd,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number>(0);
  const [shouldRender, setShouldRender] = useState(open);

  const ms = durationMs ?? collapseDurationMap[duration];

  // Measure content height when open changes
  useEffect(() => {
    if (open) {
      setShouldRender(true);
    }
  }, [open]);

  useEffect(() => {
    if (contentRef.current) {
      setMeasuredHeight(contentRef.current.scrollHeight);
    }
  });

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      // Only respond to our own max-height transition
      if (e.propertyName !== 'max-height') return;

      if (!open && unmountOnClose) {
        setShouldRender(false);
      }
      userOnTransitionEnd?.();
    },
    [open, unmountOnClose, userOnTransitionEnd],
  );

  const wrapperStyle = useMemo<React.CSSProperties>(() => {
    const s: React.CSSProperties = {
      overflow: 'hidden',
      maxHeight: open ? measuredHeight : 0,
      transition: ms > 0 ? `max-height ${ms}ms ${easing}` : undefined,
      ...userStyle,
    };
    return s;
  }, [open, measuredHeight, ms, easing, userStyle]);

  if (unmountOnClose && !shouldRender) {
    return null;
  }

  return (
    <div
      ref={ref}
      style={wrapperStyle}
      onTransitionEnd={handleTransitionEnd}
      aria-hidden={!open}
      {...rest}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
});

Collapse.displayName = 'Collapse';
