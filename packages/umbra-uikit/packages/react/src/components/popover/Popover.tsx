/**
 * Popover -- Click-triggered floating content panel.
 *
 * @remarks
 * Compound component that manages open/close state and positioning context
 * for its children: {@link PopoverTrigger} and {@link PopoverContent}.
 *
 * - Supports controlled and uncontrolled open state.
 * - Configurable placement, alignment, and offset relative to the trigger.
 * - Renders content in a React portal for correct stacking.
 * - Closes on outside click or Escape key.
 *
 * @module primitives/popover
 * @example
 * ```tsx
 * <Popover placement="bottom" align="start">
 *   <PopoverTrigger>
 *     <button>Open</button>
 *   </PopoverTrigger>
 *   <PopoverContent>Hello from the popover!</PopoverContent>
 * </Popover>
 * ```
 */
import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../providers';
import type {
  PopoverProps,
  PopoverTriggerProps,
  PopoverContentProps,
  PopoverContextValue,
  PopoverPlacement,
  PopoverAlign,
} from '@coexist/wisp-core/types/Popover.types';
import type { CSSStyleObject } from '@coexist/wisp-core/types';
import { buildContentStyle, buildOverlayStyle } from '@coexist/wisp-core/styles/Popover.styles';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const PopoverContext = createContext<PopoverContextValue | null>(null);

/**
 * Retrieves the nearest {@link PopoverContextValue} from the component tree.
 *
 * @returns The current popover context value.
 * @throws If called outside of a `<Popover>` provider.
 */
function usePopoverContext(): PopoverContextValue {
  const ctx = useContext(PopoverContext);
  if (!ctx) {
    throw new Error(
      '[Wisp] Popover compound components must be used within <Popover>.',
    );
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Position calculation
// ---------------------------------------------------------------------------

/**
 * Computes the absolute top/left coordinates for the popover content based
 * on the trigger's bounding rect, the desired placement side, alignment, and
 * pixel offset.
 *
 * @param triggerRect - The DOMRect of the trigger element.
 * @param placement - Which side of the trigger to place the content on.
 * @param align - Alignment along the perpendicular axis.
 * @param offset - Distance in pixels between the trigger and content.
 * @returns An object with `top` and `left` pixel values.
 */
function calculatePosition(
  triggerRect: DOMRect,
  placement: PopoverPlacement,
  align: PopoverAlign,
  offset: number,
): { top: number; left: number } {
  let top = 0;
  let left = 0;

  // Primary axis: placement determines which side of the trigger
  switch (placement) {
    case 'top':
      top = triggerRect.top - offset;
      break;
    case 'bottom':
      top = triggerRect.bottom + offset;
      break;
    case 'left':
      left = triggerRect.left - offset;
      break;
    case 'right':
      left = triggerRect.right + offset;
      break;
  }

  // Secondary axis: alignment along the perpendicular edge
  if (placement === 'top' || placement === 'bottom') {
    switch (align) {
      case 'start':
        left = triggerRect.left;
        break;
      case 'center':
        left = triggerRect.left + triggerRect.width / 2;
        break;
      case 'end':
        left = triggerRect.right;
        break;
    }
  } else {
    // left or right placement
    switch (align) {
      case 'start':
        top = triggerRect.top;
        break;
      case 'center':
        top = triggerRect.top + triggerRect.height / 2;
        break;
      case 'end':
        top = triggerRect.bottom;
        break;
    }
  }

  return { top, left };
}

/**
 * Builds the CSS `transform` string for the content element so it is
 * anchored correctly relative to the computed top/left point.
 *
 * @param placement - Which side of the trigger the content appears on.
 * @param align - Alignment along the perpendicular axis.
 * @returns A CSS transform string (e.g. `"translateX(-50%)"`) or `"none"`.
 */
function getContentTransform(
  placement: PopoverPlacement,
  align: PopoverAlign,
): string {
  const parts: string[] = [];

  if (placement === 'top' || placement === 'bottom') {
    // Horizontal alignment transform
    switch (align) {
      case 'start':
        break; // no horizontal shift needed
      case 'center':
        parts.push('translateX(-50%)');
        break;
      case 'end':
        parts.push('translateX(-100%)');
        break;
    }
    // Vertical: top means content is above, so shift up by 100%
    if (placement === 'top') {
      parts.push('translateY(-100%)');
    }
  } else {
    // left / right placement
    if (placement === 'left') {
      parts.push('translateX(-100%)');
    }
    switch (align) {
      case 'start':
        break;
      case 'center':
        parts.push('translateY(-50%)');
        break;
      case 'end':
        parts.push('translateY(-100%)');
        break;
    }
  }

  return parts.length > 0 ? parts.join(' ') : 'none';
}

// ---------------------------------------------------------------------------
// Popover (root provider)
// ---------------------------------------------------------------------------

/**
 * Popover -- Root provider for the compound popover component.
 *
 * @remarks
 * Manages controlled/uncontrolled open state and provides placement context
 * consumed by {@link PopoverTrigger} and {@link PopoverContent}.
 *
 * @example
 * ```tsx
 * <Popover placement="bottom" align="center" offset={8}>
 *   <PopoverTrigger><button>Toggle</button></PopoverTrigger>
 *   <PopoverContent>Panel body</PopoverContent>
 * </Popover>
 * ```
 */
export function Popover({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  placement = 'bottom',
  align = 'center',
  offset = 8,
}: PopoverProps): React.JSX.Element {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const triggerRef = useRef<HTMLElement | null>(null);

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  const contextValue = useMemo<PopoverContextValue>(
    () => ({ open, setOpen, triggerRef, placement, align, offset }),
    [open, setOpen, placement, align, offset],
  );

  return (
    <PopoverContext.Provider value={contextValue}>
      {children}
    </PopoverContext.Provider>
  );
}
Popover.displayName = 'Popover';

// ---------------------------------------------------------------------------
// PopoverTrigger
// ---------------------------------------------------------------------------

/**
 * PopoverTrigger -- Wraps a single child element and attaches a click
 * handler and ref so the popover can position itself relative to this element.
 *
 * @remarks
 * Clones the child element, adding `onClick`, `ref`, `aria-haspopup`, and
 * `aria-expanded` props automatically.
 */
export const PopoverTrigger = forwardRef<HTMLElement, PopoverTriggerProps>(
  function PopoverTrigger({ children }, ref) {
    const { open, setOpen, triggerRef } = usePopoverContext();

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        setOpen(!open);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (children.props as any)?.onClick?.(e);
      },
      [open, setOpen, children.props],
    );

    const setRefs = useCallback(
      (node: HTMLElement | null) => {
        (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        }
        // Forward child ref
        const childRef = (children as unknown as { ref?: React.Ref<HTMLElement> }).ref;
        if (typeof childRef === 'function') {
          childRef(node);
        } else if (childRef && typeof childRef === 'object') {
          (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      },
      [triggerRef, ref, children],
    );

    return React.cloneElement(children, {
      ref: setRefs,
      onClick: handleClick,
      'aria-haspopup': 'dialog',
      'aria-expanded': open,
    } as Record<string, unknown>);
  },
);
PopoverTrigger.displayName = 'PopoverTrigger';

// ---------------------------------------------------------------------------
// PopoverContent
// ---------------------------------------------------------------------------

/**
 * PopoverContent -- The floating panel rendered in a portal when the popover
 * is open.
 *
 * @remarks
 * Positions itself relative to the trigger using `position: fixed` and
 * `getBoundingClientRect` measurements. Automatically closes on outside
 * click or Escape key press, and focuses the panel when it opens.
 */
export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  function PopoverContent(
    { children, className, style: userStyle, variant = 'solid', ...rest },
    ref,
  ) {
    const { open, setOpen, triggerRef, placement, align, offset } =
      usePopoverContext();
    const { theme } = useTheme();
  const themeColors = theme.colors;
    const contentRef = useRef<HTMLDivElement>(null);
    const resolvedRef = (ref as React.RefObject<HTMLDivElement>) || contentRef;

    const [position, setPosition] = useState<{ top: number; left: number }>({
      top: 0,
      left: 0,
    });

    // Measure trigger and compute position whenever the popover opens
    useEffect(() => {
      if (!open || !triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition(calculatePosition(rect, placement, align, offset));
    }, [open, triggerRef, placement, align, offset]);

    // Close on click outside
    useEffect(() => {
      if (!open) return;
      const handleMouseDown = (e: MouseEvent) => {
        const container = resolvedRef.current ?? contentRef.current;
        if (
          container &&
          !container.contains(e.target as Node) &&
          triggerRef.current &&
          !triggerRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handleMouseDown);
      return () => document.removeEventListener('mousedown', handleMouseDown);
    }, [open, setOpen, triggerRef, resolvedRef]);

    // Close on Escape key
    useEffect(() => {
      if (!open) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setOpen(false);
          triggerRef.current?.focus();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, setOpen, triggerRef]);

    // Focus the content panel when it opens
    useEffect(() => {
      if (!open) return;
      const timer = setTimeout(() => {
        const container = resolvedRef.current ?? contentRef.current;
        if (container) container.focus();
      }, 0);
      return () => clearTimeout(timer);
    }, [open, resolvedRef]);

    // Build styles
    const contentStyle = useMemo(
      () => buildContentStyle(theme, variant, userStyle as CSSStyleObject),
      [theme, variant, userStyle],
    );

    const transform = useMemo(
      () => getContentTransform(placement, align),
      [placement, align],
    );

    if (!open) return null;

    const portalContent = (
      <div
        ref={resolvedRef as React.Ref<HTMLDivElement>}
        role="dialog"
        tabIndex={-1}
        className={className}
        style={{
          ...contentStyle,
          position: 'fixed',
          top: position.top,
          left: position.left,
          transform: transform !== 'none' ? transform : undefined,
        }}
        {...rest}
      >
        {children}
      </div>
    );

    if (typeof document === 'undefined') return portalContent;
    return createPortal(portalContent, document.body);
  },
);
PopoverContent.displayName = 'PopoverContent';
