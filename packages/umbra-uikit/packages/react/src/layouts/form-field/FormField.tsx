import React, { forwardRef, useMemo } from 'react';
import type { FormFieldProps } from '@coexist/wisp-core/types/FormField.types';
import { formFieldSizeMap } from '@coexist/wisp-core/types/FormField.types';
import {
  buildWrapperStyle,
  buildLabelStyle,
  buildRequiredStyle,
  buildContentStyle,
  buildHintStyle,
} from '@coexist/wisp-core/styles/FormField.styles';
import { useTheme } from '../../providers';

/**
 * FormField -- Wraps a form control with label, description, and error message.
 *
 * @remarks
 * Provides consistent vertical (or horizontal) layout for form inputs with
 * supporting text, required indicators, and validation feedback. Sizes are
 * controlled via the {@link FormFieldProps.size | size} prop which maps to
 * {@link formFieldSizeMap} for label and hint font sizes.
 *
 * Key features:
 * - Label with optional required indicator (`*`)
 * - Description text below the control (replaced by error when present)
 * - Vertical and horizontal orientation via {@link FormFieldProps.orientation | orientation}
 * - Configurable label column width for horizontal layout
 * - Disabled state with muted label colors
 *
 * @module primitives/form-field
 * @example
 * ```tsx
 * <FormField label="Email" required error="Invalid email address">
 *   <Input placeholder="you@example.com" />
 * </FormField>
 * ```
 *
 * @example Horizontal layout
 * ```tsx
 * <FormField label="Username" orientation="horizontal" labelWidth={160}>
 *   <Input />
 * </FormField>
 * ```
 */
export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(function FormField(
  {
    children,
    label,
    description,
    error,
    required = false,
    disabled = false,
    size = 'md',
    orientation = 'vertical',
    labelWidth,
    onSurface = false,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = formFieldSizeMap[size];

  const wrapperStyle = useMemo(
    () => ({ ...buildWrapperStyle(orientation, sizeConfig, true), ...userStyle }),
    [orientation, sizeConfig, userStyle],
  );

  const labelStyle = useMemo(
    () => buildLabelStyle(sizeConfig, disabled, orientation, labelWidth, theme, onSurface),
    [sizeConfig, disabled, orientation, labelWidth, theme, onSurface],
  );

  const requiredStyle = useMemo(
    () => buildRequiredStyle(theme),
    [theme],
  );

  const contentStyle = useMemo(
    () => buildContentStyle(orientation, theme),
    [orientation, theme],
  );

  const hintText = error || description;
  const hintStyle = useMemo(
    () => (hintText ? buildHintStyle(sizeConfig, !!error, theme, onSurface) : undefined),
    [sizeConfig, error, hintText, theme, onSurface],
  );

  // In vertical orientation: label → control → hint
  // In horizontal orientation: label | [control, hint]
  const isHorizontal = orientation === 'horizontal';

  return (
    <div ref={ref} style={wrapperStyle} {...rest}>
      {label && (
        <label style={labelStyle}>
          {label}
          {required && <span style={requiredStyle} aria-hidden="true">*</span>}
        </label>
      )}

      {isHorizontal ? (
        <div style={contentStyle}>
          {children}
          {hintText && <p style={hintStyle}>{hintText}</p>}
        </div>
      ) : (
        <>
          {children}
          {hintText && <p style={hintStyle}>{hintText}</p>}
        </>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';
