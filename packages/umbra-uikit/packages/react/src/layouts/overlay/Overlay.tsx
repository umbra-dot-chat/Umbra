import React, { forwardRef, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { OverlayProps } from '@coexist/wisp-core/types/Overlay.types';
import { buildOverlayStyle } from '@coexist/wisp-core/styles/Overlay.styles';

/**
 * Overlay -- Full-screen overlay primitive for the Wisp design system.
 *
 * @remarks
 * Renders a fixed backdrop covering the viewport with z-index management,
 * optional body-scroll locking, backdrop click, and escape key handling.
 *
 * - Three backdrop styles: `dim`, `blur`, `transparent`.
 * - Automatically locks body scroll when open (compensating for scrollbar width).
 * - Supports closing via Escape key when `closeOnEscape` is enabled.
 * - Renders via `createPortal` to `document.body` or a custom container.
 *
 * @module primitives/overlay
 * @example
 * ```tsx
 * <Overlay open={isOpen} onBackdropClick={() => setIsOpen(false)}>
 *   <Box p="xl" radius="lg">Modal content</Box>
 * </Overlay>
 * ```
 */
export const Overlay = forwardRef<HTMLDivElement, OverlayProps>(function Overlay(
  {
    children,
    open = false,
    backdrop = 'dim',
    zIndex,
    zIndexValue,
    lockScroll = true,
    center = true,
    onBackdropClick,
    closeOnEscape = true,
    portalContainer,
    style: userStyle,
    onClick,
    ...rest
  },
  ref,
) {
  // Lock body scroll when open
  useEffect(() => {
    if (!open || !lockScroll) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [open, lockScroll]);

  // Escape key handler
  useEffect(() => {
    if (!open || !closeOnEscape || !onBackdropClick) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBackdropClick();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, closeOnEscape, onBackdropClick]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only fire if clicking the backdrop itself, not children
      if (e.target === e.currentTarget) {
        onBackdropClick?.();
      }
      onClick?.(e);
    },
    [onBackdropClick, onClick],
  );

  const computedStyle = useMemo(
    () => buildOverlayStyle({ backdrop, zIndex, zIndexValue, center }),
    [backdrop, zIndex, zIndexValue, center],
  );

  const mergedStyle = userStyle ? { ...computedStyle, ...userStyle } : computedStyle;

  if (!open) return null;

  const content = (
    <div
      ref={ref}
      role="presentation"
      style={mergedStyle}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </div>
  );

  if (portalContainer) {
    return createPortal(content, portalContainer);
  }

  return createPortal(content, document.body);
});

Overlay.displayName = 'Overlay';
