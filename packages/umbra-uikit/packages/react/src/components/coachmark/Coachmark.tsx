/**
 * Coachmark — A standalone positioned callout attached to a target element.
 *
 * @remarks
 * Renders a floating panel with title, description, action, and dismiss
 * buttons, positioned relative to a target element via ref. Supports
 * configurable placement, alignment, arrow, and colour variants.
 * Uses a portal for rendering and handles click-outside + Escape to close.
 *
 * @module components/coachmark
 * @example
 * ```tsx
 * const targetRef = useRef<HTMLButtonElement>(null);
 * <button ref={targetRef}>Target</button>
 * <Coachmark
 *   target={targetRef}
 *   title="Click here to get started"
 *   description="This button opens the main menu."
 *   actionLabel="Got it"
 *   onAction={() => {}}
 * />
 * ```
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { CoachmarkProps, CoachmarkPlacement, CoachmarkAlign } from '@coexist/wisp-core/types/Coachmark.types';
import {
  resolveCoachmarkColors,
  buildCoachmarkPanelStyle,
  buildCoachmarkArrowStyle,
  buildCoachmarkTitleStyle,
  buildCoachmarkDescriptionStyle,
  buildCoachmarkFooterStyle,
  buildCoachmarkDismissButtonStyle,
  buildCoachmarkActionButtonStyle,
} from '@coexist/wisp-core/styles/Coachmark.styles';
import { useTheme } from '../../providers';
import { Button } from '../../primitives/button';
import { Text } from '../../primitives/text';

// ---------------------------------------------------------------------------
// Keyframe injection (singleton)
// ---------------------------------------------------------------------------

let coachmarkAnimInjected = false;

function injectCoachmarkKeyframes() {
  if (coachmarkAnimInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes wisp-coachmark-in {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
  coachmarkAnimInjected = true;
}

// ---------------------------------------------------------------------------
// Positioning helpers (ported from Popover)
// ---------------------------------------------------------------------------

function calculatePosition(
  triggerRect: DOMRect,
  placement: CoachmarkPlacement,
  align: CoachmarkAlign,
  offset: number,
): { top: number; left: number } {
  let top = 0;
  let left = 0;

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

  // Secondary axis alignment
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

function getContentTransform(
  placement: CoachmarkPlacement,
  align: CoachmarkAlign,
): string {
  const parts: string[] = [];

  if (placement === 'top' || placement === 'bottom') {
    switch (align) {
      case 'start':
        break;
      case 'center':
        parts.push('translateX(-50%)');
        break;
      case 'end':
        parts.push('translateX(-100%)');
        break;
    }
    if (placement === 'top') {
      parts.push('translateY(-100%)');
    }
  } else {
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
// Coachmark
// ---------------------------------------------------------------------------

export function Coachmark({
  target,
  title,
  description,
  actionLabel,
  onAction,
  dismissLabel = 'Dismiss',
  onDismiss,
  placement = 'bottom',
  align = 'center',
  offset = 12,
  showArrow = true,
  open = true,
  onOpenChange,
  variant = 'default',
  className,
  style: userStyle,
}: CoachmarkProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Inject entrance animation
  useEffect(() => {
    injectCoachmarkKeyframes();
  }, []);

  const colors = useMemo(
    () => resolveCoachmarkColors(variant, theme),
    [variant, theme],
  );

  const panelStyle = useMemo(
    () => buildCoachmarkPanelStyle(colors, theme),
    [colors, theme],
  );
  const arrowStyle = useMemo(
    () => buildCoachmarkArrowStyle(placement, colors),
    [placement, colors],
  );
  const titleStyle = useMemo(
    () => buildCoachmarkTitleStyle(colors.text, theme),
    [colors.text, theme],
  );
  const descriptionStyle = useMemo(
    () => buildCoachmarkDescriptionStyle(colors.descriptionText, theme),
    [colors.descriptionText, theme],
  );
  const footerStyle = useMemo(
    () => buildCoachmarkFooterStyle(theme),
    [theme],
  );
  const dismissBtnStyle = useMemo(
    () => buildCoachmarkDismissButtonStyle(theme),
    [theme],
  );
  const actionBtnStyle = useMemo(
    () => buildCoachmarkActionButtonStyle(colors, theme),
    [colors, theme],
  );

  const transform = useMemo(
    () => getContentTransform(placement, align),
    [placement, align],
  );

  // Measure target position
  useEffect(() => {
    if (!open || !target.current) return;

    function update() {
      if (!target.current) return;
      const rect = target.current.getBoundingClientRect();
      const pos = calculatePosition(rect, placement, align, offset);
      setPosition(pos);
    }

    update();

    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, target, placement, align, offset]);

  // Click-outside handler
  const handleClose = useCallback(() => {
    onOpenChange?.(false);
    onDismiss?.();
  }, [onOpenChange, onDismiss]);

  useEffect(() => {
    if (!open) return;

    function onClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        target.current &&
        !target.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose();
      }
    }

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, handleClose, target]);

  if (!open) return null;

  const hasFooter = (actionLabel && onAction) || onDismiss;

  const portalContent = (
    <div
      ref={panelRef}
      role="dialog"
      className={className}
      style={{
        ...panelStyle,
        position: 'fixed',
        top: position.top,
        left: position.left,
        transform: transform !== 'none' ? transform : undefined,
        zIndex: 9998,
        ...userStyle,
      }}
    >
      {showArrow && <div style={arrowStyle} />}
      <Text as="p" size="sm" weight="semibold" style={titleStyle}>{title}</Text>
      {description && <Text as="p" size="sm" style={descriptionStyle}>{description}</Text>}
      {hasFooter && (
        <div style={footerStyle}>
          {onDismiss && (
            <Button variant="tertiary" size="sm" style={dismissBtnStyle} onClick={onDismiss}>
              {dismissLabel}
            </Button>
          )}
          {actionLabel && onAction && (
            <Button variant="primary" size="sm" style={actionBtnStyle} onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (typeof document === 'undefined') return portalContent;
  return createPortal(portalContent, document.body);
}

Coachmark.displayName = 'Coachmark';
