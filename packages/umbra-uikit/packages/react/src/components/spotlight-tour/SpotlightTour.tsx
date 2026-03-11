/**
 * SpotlightTour — Full guided tour with backdrop cutout and step popovers.
 *
 * @remarks
 * Renders a dark overlay with an SVG mask "hole" around the active target
 * element. A step popover is positioned relative to the target with
 * previous/next navigation and step count. Supports keyboard navigation
 * (ArrowLeft/Right, Escape).
 *
 * @module components/spotlight-tour
 * @example
 * ```tsx
 * <SpotlightTour
 *   steps={[
 *     { target: ref1, title: 'Step 1', description: 'Welcome!' },
 *     { target: ref2, title: 'Step 2', description: 'Try this.' },
 *   ]}
 *   open={true}
 *   onFinish={() => {}}
 *   onClose={() => {}}
 * />
 * ```
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { SpotlightTourProps } from '@coexist/wisp-core/types/SpotlightTour.types';
import {
  buildSpotlightPopoverStyle,
  buildSpotlightTitleStyle,
  buildSpotlightDescriptionStyle,
  buildSpotlightFooterStyle,
  buildSpotlightStepCountStyle,
  buildSpotlightNavButtonStyle,
} from '@coexist/wisp-core/styles/SpotlightTour.styles';
import { useTheme } from '../../providers';
import { Button } from '../../primitives/button';
import { Text } from '../../primitives/text';
import { defaultSpacing } from '@coexist/wisp-core/theme/create-theme';

// ---------------------------------------------------------------------------
// Keyframe injection (singleton)
// ---------------------------------------------------------------------------

let spotlightAnimInjected = false;

function injectSpotlightKeyframes() {
  if (spotlightAnimInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes wisp-spotlight-in {
      from { opacity: 0; transform: scale(0.96); }
      to   { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
  spotlightAnimInjected = true;
}

// ---------------------------------------------------------------------------
// Positioning helpers
// ---------------------------------------------------------------------------

type Placement = 'top' | 'bottom' | 'left' | 'right';
type Align = 'start' | 'center' | 'end';

function calculatePosition(
  triggerRect: DOMRect,
  placement: Placement,
  align: Align,
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

function getContentTransform(placement: Placement, align: Align): string {
  const parts: string[] = [];

  if (placement === 'top' || placement === 'bottom') {
    switch (align) {
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
// SpotlightTour
// ---------------------------------------------------------------------------

const CUTOUT_PADDING = 8;
const CUTOUT_RADIUS = 8;
const POPOVER_OFFSET = 16;

export function SpotlightTour({
  steps,
  open,
  currentStep: controlledStep,
  onStepChange,
  onFinish,
  onClose,
  showStepCount = true,
  nextLabel = 'Next',
  prevLabel = 'Back',
  finishLabel = 'Finish',
  closeOnOverlayClick = false,
  closeOnEscape = true,
  variant = 'default',
}: SpotlightTourProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const panelRef = useRef<HTMLDivElement>(null);

  const [internalStep, setInternalStep] = useState(0);
  const step = controlledStep ?? internalStep;
  const totalSteps = steps.length;

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  const currentStepData = steps[step];

  // Inject animation keyframes
  useEffect(() => {
    injectSpotlightKeyframes();
  }, []);

  // Measure target
  useEffect(() => {
    if (!open || !currentStepData?.target?.current) {
      setTargetRect(null);
      return;
    }

    function update() {
      if (!currentStepData?.target?.current) return;
      const rect = currentStepData.target.current.getBoundingClientRect();
      setTargetRect(rect);

      const placement = currentStepData.placement || 'bottom';
      const align = currentStepData.align || 'center';
      const pos = calculatePosition(rect, placement, align, POPOVER_OFFSET);
      setPopoverPos(pos);
    }

    update();

    // Scroll target into view
    currentStepData.target.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

    // Small delay to re-measure after scroll
    const scrollTimer = setTimeout(update, 350);

    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      clearTimeout(scrollTimer);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, step, currentStepData]);

  // Navigation
  const goTo = useCallback(
    (idx: number) => {
      if (controlledStep === undefined) setInternalStep(idx);
      onStepChange?.(idx);
    },
    [controlledStep, onStepChange],
  );

  const next = useCallback(() => {
    if (step < totalSteps - 1) {
      goTo(step + 1);
    } else {
      onFinish?.();
    }
  }, [step, totalSteps, goTo, onFinish]);

  const prev = useCallback(() => {
    if (step > 0) goTo(step - 1);
  }, [step, goTo]);

  const close = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // Keyboard
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          next();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prev();
          break;
        case 'Escape':
          if (closeOnEscape) {
            e.preventDefault();
            close();
          }
          break;
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, next, prev, close, closeOnEscape]);

  // Styles
  const popoverStyle = useMemo(
    () => buildSpotlightPopoverStyle(theme, variant),
    [theme, variant],
  );
  const titleStyle = useMemo(
    () => buildSpotlightTitleStyle(theme),
    [theme],
  );
  const descriptionStyle = useMemo(
    () => buildSpotlightDescriptionStyle(theme),
    [theme],
  );
  const footerStyle = useMemo(() => buildSpotlightFooterStyle(theme), [theme]);
  const stepCountStyle = useMemo(
    () => buildSpotlightStepCountStyle(theme),
    [theme],
  );
  const prevBtnStyle = useMemo(
    () => buildSpotlightNavButtonStyle(theme, false),
    [theme],
  );
  const nextBtnStyle = useMemo(
    () => buildSpotlightNavButtonStyle(theme, true),
    [theme],
  );

  const placement = currentStepData?.placement || 'bottom';
  const align = currentStepData?.align || 'center';
  const transform = useMemo(
    () => getContentTransform(placement, align),
    [placement, align],
  );

  if (!open || !currentStepData) return null;

  // SVG mask cutout dimensions
  const cx = targetRect ? targetRect.left - CUTOUT_PADDING : 0;
  const cy = targetRect ? targetRect.top - CUTOUT_PADDING : 0;
  const cw = targetRect ? targetRect.width + CUTOUT_PADDING * 2 : 0;
  const ch = targetRect ? targetRect.height + CUTOUT_PADDING * 2 : 0;

  const isLastStep = step === totalSteps - 1;
  const isFirstStep = step === 0;

  // clip-path polygon that covers the full viewport but excludes the target rect.
  // Uses an outer rect (0,0 → 100%,100%) with an inner cutout wound in reverse.
  const blurClipPath = targetRect
    ? `polygon(
        0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
        ${cx}px ${cy}px,
        ${cx}px ${cy + ch}px,
        ${cx + cw}px ${cy + ch}px,
        ${cx + cw}px ${cy}px,
        ${cx}px ${cy}px
      )`
    : undefined;

  const portalContent = (
    <>
      {/* Backdrop blur layer — excludes target via clip-path */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 9997,
          pointerEvents: 'none',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          ...(blurClipPath ? { clipPath: blurClipPath } : {}),
        } as React.CSSProperties}
      />

      {/* SVG mask overlay — dark tint with cutout */}
      <svg
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 9997,
          pointerEvents: closeOnOverlayClick ? 'auto' : 'none',
        } as React.CSSProperties}
        onClick={closeOnOverlayClick ? close : undefined}
      >
        <defs>
          <mask id="wisp-spotlight-mask">
            <rect fill="white" width="100%" height="100%" />
            {targetRect && (
              <rect
                fill="black"
                x={cx}
                y={cy}
                width={cw}
                height={ch}
                rx={CUTOUT_RADIUS}
                ry={CUTOUT_RADIUS}
              />
            )}
          </mask>
        </defs>
        <rect
          fill="rgba(0,0,0,0.5)"
          width="100%"
          height="100%"
          mask="url(#wisp-spotlight-mask)"
        />
      </svg>

      {/* Step popover */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label={`Tour step ${step + 1} of ${totalSteps}`}
        style={{
          ...popoverStyle,
          position: 'fixed',
          top: popoverPos.top,
          left: popoverPos.left,
          transform: transform !== 'none' ? transform : undefined,
        } as React.CSSProperties}
      >
        <Text as="p" size="sm" weight="semibold" style={titleStyle as React.CSSProperties}>{currentStepData.title}</Text>
        {currentStepData.description && (
          <Text as="p" size="sm" style={descriptionStyle as React.CSSProperties}>{currentStepData.description}</Text>
        )}

        <div style={footerStyle as React.CSSProperties}>
          {showStepCount ? (
            <Text size="xs" style={stepCountStyle as React.CSSProperties}>
              {step + 1} of {totalSteps}
            </Text>
          ) : (
            <span />
          )}
          <div style={{ display: 'flex', gap: defaultSpacing.sm }}>
            {!isFirstStep && (
              <Button variant="tertiary" size="sm" style={prevBtnStyle as React.CSSProperties} onClick={prev}>
                {prevLabel}
              </Button>
            )}
            <Button variant="primary" size="sm" style={nextBtnStyle as React.CSSProperties} onClick={next}>
              {isLastStep ? finishLabel : nextLabel}
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  if (typeof document === 'undefined') return portalContent;
  return createPortal(portalContent, document.body);
}

SpotlightTour.displayName = 'SpotlightTour';
