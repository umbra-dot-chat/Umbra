/**
 * Dialog -- Modal overlay panel for focused user interactions.
 *
 * @remarks
 * - Renders in a React portal over a dimmed backdrop.
 * - Traps keyboard focus within the panel while open.
 * - Supports Escape-to-close and overlay-click-to-close.
 * - Fade/scale entrance animation injected once on first mount.
 * - Configurable size, optional title, description, and footer slots.
 *
 * @module primitives/dialog
 * @example
 * ```tsx
 * <Dialog open={isOpen} onClose={() => setIsOpen(false)} title="Confirm">
 *   <p>Are you sure?</p>
 * </Dialog>
 * ```
 */
import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { DialogProps } from '@coexist/wisp-core/types/Dialog.types';
import {
  buildOverlayStyle,
  buildPanelStyle,
  buildHeaderStyle,
  buildTitleStyle,
  buildDescriptionStyle,
  buildCloseButtonStyle,
  buildCloseButtonHoverStyle,
  buildBodyStyle,
  buildFooterStyle,
} from '@coexist/wisp-core/styles/Dialog.styles';
import { useTheme, WispProvider } from '../../providers';
import { Text } from '../../primitives';
import { createTheme } from '@coexist/wisp-core/theme/create-theme';

/** Guards against injecting the CSS keyframes more than once per page. */
let animationInjected = false;

/**
 * Lazily injects CSS `@keyframes` for the dialog entrance animations
 * (overlay fade-in and panel scale-in) into the document head.
 */
function injectDialogAnimation() {
  if (animationInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = [
    '@keyframes wisp-dialog-overlay-in { from { opacity: 0; } to { opacity: 1; } }',
    '@keyframes wisp-dialog-panel-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }',
  ].join('\n');
  document.head.appendChild(style);
  animationInjected = true;
}

/** CSS selector matching all natively-focusable elements for the focus trap. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Dialog -- Modal overlay with title, body, and optional footer.
 *
 * @remarks
 * Manages its own focus trap, Escape/overlay-click dismiss, and entrance
 * animation. Rendered in a portal attached to `document.body`.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = 'md',
  variant = 'solid',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  forceMode,
  className,
  style: userStyle,
}: DialogProps): React.JSX.Element | null {
  const { theme: ambientTheme } = useTheme();
  const ambientColors = ambientTheme.colors;
  const panelRef = useRef<HTMLDivElement>(null);
  const [closeHovered, setCloseHovered] = useState(false);

  // When forceMode is set, resolve a full forced theme for the panel shell
  // (background, borders, title, close button). Child components pick up
  // the forced mode via the nested WispProvider.
  const forcedTheme = useMemo(
    () => forceMode ? createTheme({ mode: forceMode }) : null,
    [forceMode],
  );
  const panelTheme = forcedTheme ?? ambientTheme;
  const themeColors = panelTheme.colors;

  useEffect(() => {
    injectDialogAnimation();
  }, []);

  // Focus trap
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const timer = setTimeout(() => {
      const firstFocusable = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (firstFocusable) firstFocusable.focus();
      else panel.focus();
    }, 0);

    return () => {
      clearTimeout(timer);
      previouslyFocused?.focus();
    };
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, closeOnEscape, onClose]);

  // Focus trap cycling
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const panel = panelRef.current;
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [open]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose();
      }
    },
    [closeOnOverlayClick, onClose],
  );

  // Overlay always uses ambient theme so the scrim matches the app theme.
  const overlayStyle = useMemo(() => ({
    ...buildOverlayStyle(ambientTheme),
    animation: 'wisp-dialog-overlay-in 200ms ease',
  }), [ambientTheme]);

  const panelStyle = useMemo(() => ({
    ...buildPanelStyle(size, panelTheme, variant, !!forceMode),
    animation: 'wisp-dialog-panel-in 200ms ease',
    ...userStyle,
  }), [size, panelTheme, variant, forceMode, userStyle]);

  const headerStyle = useMemo(() => buildHeaderStyle(panelTheme), [panelTheme]);
  const titleStyleVal = useMemo(() => buildTitleStyle(panelTheme), [panelTheme]);
  const descriptionStyleVal = useMemo(() => buildDescriptionStyle(panelTheme), [panelTheme]);
  const closeButtonStyle = useMemo(() => buildCloseButtonStyle(panelTheme), [panelTheme]);
  const closeButtonHoverStyleVal = useMemo(() => buildCloseButtonHoverStyle(panelTheme), [panelTheme]);
  const bodyStyle = useMemo(() => buildBodyStyle(panelTheme), [panelTheme]);
  const footerStyle = useMemo(() => buildFooterStyle(panelTheme), [panelTheme]);

  if (!open) return null;

  // Inner panel content — header, body, and footer.
  const panelContent = (
    <>
      <div style={headerStyle}>
        {icon && (
          <div style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
            {icon}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <Text as="h2" id="wisp-dialog-title" style={titleStyleVal}>{title}</Text>
          {description && (
            <Text as="p" id="wisp-dialog-description" style={descriptionStyleVal}>{description}</Text>
          )}
        </div>
        {showCloseButton && (
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            onMouseEnter={() => setCloseHovered(true)}
            onMouseLeave={() => setCloseHovered(false)}
            style={closeHovered ? { ...closeButtonStyle, ...closeButtonHoverStyleVal } : closeButtonStyle}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {children && <div style={bodyStyle}>{children}</div>}

      {footer && <div style={footerStyle}>{footer}</div>}
    </>
  );

  const dialogContent = (
    <div
      style={overlayStyle}
      onClick={handleOverlayClick}
      aria-hidden={!open}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wisp-dialog-title"
        aria-describedby={description ? 'wisp-dialog-description' : undefined}
        className={className}
        style={panelStyle}
        tabIndex={-1}
      >
        {forceMode ? (
          <WispProvider mode={forceMode} injectCssVars={false}>
            {panelContent}
          </WispProvider>
        ) : (
          panelContent
        )}
      </div>
    </div>
  );

  if (typeof document === 'undefined') return dialogContent;
  return createPortal(dialogContent, document.body);
}

Dialog.displayName = 'Dialog';
