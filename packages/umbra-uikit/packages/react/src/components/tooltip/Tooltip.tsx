import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { TooltipProps } from "@coexist/wisp-core/types/Tooltip.types";
import {
  buildArrowStyle,
  buildPortalPositionStyle,
  buildTooltipStyle,
  calculatePosition,
  resolveTooltipColors,
} from "@coexist/wisp-core/styles/Tooltip.styles";
import { useTheme } from "../../providers";

/**
 * Tooltip -- Hover/focus-triggered popover displaying contextual text content.
 *
 * @remarks
 * - Renders a portal-based tooltip bubble with a CSS-border arrow pointing at the trigger.
 * - Supports four placement directions via {@link TooltipProps.placement}: `top`, `bottom`, `left`, `right`.
 * - Configurable show delay through {@link TooltipProps.delay} (default 300 ms).
 * - Fully accessible: links the tooltip to its trigger with `aria-describedby` and dismisses on Escape.
 * - High-contrast inverted color scheme: dark background on light mode, light background on dark mode.
 * - Portaled to `document.body` to escape parent overflow/stacking contexts.
 *
 * @module primitives/tooltip
 * @example
 * ```tsx
 * <Tooltip content="Save your changes" placement="top">
 *   <button>Save</button>
 * </Tooltip>
 * ```
 */
export const Tooltip = forwardRef<HTMLElement, TooltipProps>(function Tooltip(
  {
    content,
    children,
    placement = "top",
    delay = 300,
    maxWidth = 220,
    variant = "solid",
    disabled = false,
    className,
    style: userStyle,
  },
  _ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const tooltipId = useId();

  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const triggerRef = useRef<HTMLElement | null>(null);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve colors
  const colors = useMemo(
    () => resolveTooltipColors(theme),
    [theme],
  );

  // Update position based on trigger element rect
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition(calculatePosition(rect, placement));
  }, [placement]);

  // Show tooltip after delay
  const show = useCallback(() => {
    if (disabled) return;
    delayTimerRef.current = setTimeout(() => {
      updatePosition();
      setIsVisible(true);
    }, delay);
  }, [disabled, delay, updatePosition]);

  // Hide tooltip immediately
  const hide = useCallback(() => {
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    setIsVisible(false);
  }, []);

  // Handle keyboard dismissal
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        hide();
      }
    },
    [hide],
  );

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
      }
    };
  }, []);

  // Build styles
  const tooltipStyle = useMemo(
    () => buildTooltipStyle(colors, maxWidth, isVisible, placement, variant, theme),
    [colors, maxWidth, isVisible, placement, variant, theme],
  );

  const arrowStyle = useMemo(
    () => buildArrowStyle(colors, placement),
    [colors, placement],
  );

  const portalPositionStyle = useMemo(
    () => buildPortalPositionStyle(position, placement),
    [position, placement],
  );

  // Clone the child element to attach event handlers and aria attributes
  const triggerElement = useMemo(() => {
    return React.cloneElement(children, {
      ref: (node: HTMLElement | null) => {
        triggerRef.current = node;
        const childRef = (children as any).ref;
        if (typeof childRef === "function") {
          childRef(node);
        } else if (childRef && typeof childRef === "object") {
          (childRef as React.MutableRefObject<HTMLElement | null>).current =
            node;
        }
      },
      onMouseEnter: (e: React.MouseEvent) => {
        show();
        (children.props as any)?.onMouseEnter?.(e);
      },
      onMouseLeave: (e: React.MouseEvent) => {
        hide();
        (children.props as any)?.onMouseLeave?.(e);
      },
      onFocus: (e: React.FocusEvent) => {
        show();
        (children.props as any)?.onFocus?.(e);
      },
      onBlur: (e: React.FocusEvent) => {
        hide();
        (children.props as any)?.onBlur?.(e);
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        handleKeyDown(e);
        (children.props as any)?.onKeyDown?.(e);
      },
      "aria-describedby": disabled ? undefined : tooltipId,
    });
  }, [children, show, hide, handleKeyDown, disabled, tooltipId]);

  // Tooltip portal content
  const tooltipPortal =
    !disabled && typeof document !== "undefined"
      ? createPortal(
          <div
            style={portalPositionStyle}
            role="tooltip"
            id={tooltipId}
            className={className}
          >
            <div style={{ ...tooltipStyle, ...userStyle }}>
              {content}
              <div style={arrowStyle} />
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {triggerElement}
      {tooltipPortal}
    </>
  );
});

Tooltip.displayName = "Tooltip";
