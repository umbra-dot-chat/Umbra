import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import type { ToastProps } from '@coexist/wisp-core/types/Toast.types';
import {
  resolveToastColors,
  buildToastStyle,
  buildIconStyle,
  buildContentStyle,
  buildTitleStyle,
  buildDescriptionStyle,
  buildActionStyle,
  buildDismissStyle,
} from '@coexist/wisp-core/styles/Toast.styles';
import { useTheme } from '../../providers';

/**
 * Toast — Notification banner primitive for the Wisp design system.
 *
 * @remarks
 * Renders an alert-role notification with a title, optional description,
 * optional leading icon, optional trailing action slot, and a dismissible
 * close button. Key features:
 *
 * - Five semantic variants: `default`, `success`, `warning`, `danger`, `info`.
 * - Optional leading icon via {@link ToastProps.icon}.
 * - Optional action slot (e.g. a Button) via {@link ToastProps.action}.
 * - Dismiss button with hover effect via {@link ToastProps.onDismiss}.
 * - Controlled visibility through {@link ToastProps.dismissible}.
 *
 * @module primitives/toast
 *
 * @example
 * ```tsx
 * <Toast variant="success" title="Saved" description="Your changes were saved." />
 * <Toast variant="danger" title="Error" onDismiss={() => close()} />
 * <Toast
 *   variant="info"
 *   title="Update available"
 *   action={<Button size="sm">Update</Button>}
 * />
 * ```
 */
export const Toast = forwardRef<HTMLDivElement, ToastProps>(function Toast(
  {
    variant = 'default',
    surface = 'solid',
    title,
    description,
    icon,
    action,
    onDismiss,
    dismissible = true,
    className,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const [dismissHovered, setDismissHovered] = useState(false);

  const colors = useMemo(
    () => resolveToastColors(variant, theme),
    [variant, theme],
  );

  const toastStyle = useMemo(() => buildToastStyle(colors, surface, theme), [colors, surface, theme]);
  const iconStyle = useMemo(() => buildIconStyle(colors), [colors]);
  const contentStyle = useMemo(() => buildContentStyle(theme), [theme]);
  const titleStyle = useMemo(() => buildTitleStyle(colors, theme), [colors, theme]);
  const descriptionStyle = useMemo(() => buildDescriptionStyle(colors, theme), [colors, theme]);
  const actionWrapperStyle = useMemo(() => buildActionStyle(), []);
  const dismissStyle = useMemo(() => buildDismissStyle(colors, theme), [colors, theme]);

  const handleDismissEnter = useCallback(() => setDismissHovered(true), []);
  const handleDismissLeave = useCallback(() => setDismissHovered(false), []);

  return (
    <div
      ref={ref}
      role="alert"
      className={className}
      style={{ ...toastStyle, ...userStyle }}
      {...rest}
    >
      {icon && <span style={iconStyle}>{icon}</span>}

      <div style={contentStyle}>
        <p style={titleStyle}>{title}</p>
        {description && <p style={descriptionStyle}>{description}</p>}
      </div>

      {action && <div style={actionWrapperStyle}>{action}</div>}

      {dismissible && onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          onMouseEnter={handleDismissEnter}
          onMouseLeave={handleDismissLeave}
          style={{
            ...dismissStyle,
            color: dismissHovered ? colors.dismissHover : colors.dismiss,
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
});

Toast.displayName = 'Toast';
