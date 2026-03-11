import React, { forwardRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { FloatingProps } from '@coexist/wisp-core/types/Floating.types';
import { useFloating } from './useFloating';
import { zIndex as zIndexScale } from '@coexist/wisp-core/tokens/z-index';

/**
 * Floating -- Declarative floating positioning component for the Wisp design system.
 *
 * @remarks
 * Wraps a trigger element and renders floating content positioned relative
 * to it. Handles placement, alignment, offset, viewport collision (flip/shift),
 * and z-index layering.
 *
 * - Placement on any of four sides: `top`, `bottom`, `left`, `right`.
 * - Cross-axis alignment: `start`, `center`, `end`.
 * - Collision strategies: `flip`, `shift`, `none`.
 * - Renders in a portal by default.
 * - For full control, use the {@link useFloating} hook directly.
 *
 * @module primitives/floating
 * @example
 * ```tsx
 * <Floating
 *   open={isOpen}
 *   placement="bottom"
 *   align="start"
 *   content={<DropdownMenu items={items} />}
 * >
 *   <Button onClick={() => setIsOpen(!isOpen)}>Menu</Button>
 * </Floating>
 * ```
 */
export function Floating({
  children,
  content,
  open,
  placement = 'bottom',
  align = 'center',
  offset = 8,
  strategy = 'flip',
  zIndex = 'popover',
  zIndexValue,
  portal = true,
  floatingStyle: userFloatingStyle,
  floatingClassName,
}: FloatingProps): React.JSX.Element {
  const { anchorRef, floatingRef, position } = useFloating({
    placement,
    align,
    offset,
    strategy,
    open,
  });

  // Merge refs for the trigger child
  const setAnchorRef = useCallback(
    (node: HTMLElement | null) => {
      (anchorRef as React.MutableRefObject<HTMLElement | null>).current = node;
      // Forward child ref
      const childRef = (children as unknown as { ref?: React.Ref<HTMLElement> }).ref;
      if (typeof childRef === 'function') {
        childRef(node);
      } else if (childRef && typeof childRef === 'object') {
        (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    [anchorRef, children],
  );

  const resolvedZIndex = zIndexValue ?? zIndexScale[zIndex];

  const floatingContainerStyle = useMemo<React.CSSProperties>(
    () => ({
      position: 'fixed',
      top: position.top,
      left: position.left,
      zIndex: resolvedZIndex,
      ...userFloatingStyle,
    }),
    [position.top, position.left, resolvedZIndex, userFloatingStyle],
  );

  const trigger = React.cloneElement(children, {
    ref: setAnchorRef,
  } as Record<string, unknown>);

  const floatingContent = open ? (
    <div
      ref={floatingRef as React.RefObject<HTMLDivElement>}
      className={floatingClassName}
      style={floatingContainerStyle}
    >
      {content}
    </div>
  ) : null;

  return (
    <>
      {trigger}
      {floatingContent && portal && typeof document !== 'undefined'
        ? createPortal(floatingContent, document.body)
        : floatingContent}
    </>
  );
}

Floating.displayName = 'Floating';
