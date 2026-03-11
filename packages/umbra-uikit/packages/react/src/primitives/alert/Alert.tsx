import React, { forwardRef, useMemo } from 'react';
import type { AlertProps } from '@coexist/wisp-core/types/Alert.types';
import type { CSSStyleObject } from '@coexist/wisp-core/types';
import {
  buildAlertStyle,
  buildIconWrapperStyle,
  buildContentStyle,
  buildTitleStyle,
  buildDescriptionStyle,
  buildActionStyle,
} from '@coexist/wisp-core/styles/Alert.styles';
import { useTheme } from '../../providers';

/**
 * Alert — Contextual feedback banner for user-facing messages.
 *
 * @remarks
 * - Supports five semantic variants: `default`, `info`, `success`, `warning`, and `danger`.
 * - Accepts an optional leading {@link AlertProps.icon | icon} and trailing {@link AlertProps.action | action} slot.
 * - Falls back to `children` when no explicit `description` prop is provided.
 * - Renders with `role="alert"` for accessibility.
 * - Forwards a ref to the root `<div>` element.
 *
 * @module primitives/alert
 * @example
 * ```tsx
 * <Alert variant="success" title="Saved" description="Your changes have been saved." />
 * ```
 * @example
 * ```tsx
 * <Alert variant="danger" icon={<ErrorIcon />} action={<Button>Retry</Button>}>
 *   Something went wrong.
 * </Alert>
 * ```
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    variant = 'default',
    title,
    description,
    icon,
    action,
    children,
    className,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const alertStyle = useMemo(
    () => buildAlertStyle(variant, theme, userStyle as CSSStyleObject),
    [variant, theme, userStyle],
  );

  const iconStyle = useMemo(
    () => buildIconWrapperStyle(variant, theme),
    [variant, theme],
  );

  const contentStyle = useMemo(() => buildContentStyle(theme), [theme]);

  const titleStyle = useMemo(
    () => buildTitleStyle(theme, variant),
    [theme, variant],
  );

  const descriptionStyle = useMemo(
    () => buildDescriptionStyle(theme, variant),
    [theme, variant],
  );

  const actionWrapperStyle = useMemo(() => buildActionStyle(), [theme]);

  const body = description ?? children;

  return (
    <div
      ref={ref}
      role="alert"
      className={className}
      style={alertStyle}
      {...rest}
    >
      {icon && <span style={iconStyle}>{icon}</span>}

      <div style={contentStyle}>
        {title && <p style={titleStyle}>{title}</p>}
        {body && <p style={descriptionStyle}>{body}</p>}
      </div>

      {action && <div style={actionWrapperStyle}>{action}</div>}
    </div>
  );
});

Alert.displayName = 'Alert';
