/**
 * Style builders for the {@link FormField} component.
 *
 * @module primitives/form-field
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { FormFieldOrientation, FormFieldSizeConfig } from '../types/FormField.types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Wrapper style
// ---------------------------------------------------------------------------

/**
 * Build the outer wrapper style for a {@link FormField}.
 *
 * @param orientation - Whether the label sits above (`'vertical'`) or beside (`'horizontal'`) the control.
 * @param sizeConfig - Resolved size configuration from {@link formFieldSizeMap}.
 * @param fullWidth - When `true`, the wrapper stretches to 100 % width.
 * @returns A `CSSStyleObject` object for the wrapper `div`.
 */
export function buildWrapperStyle(
  orientation: FormFieldOrientation,
  sizeConfig: FormFieldSizeConfig,
  fullWidth: boolean,
): CSSStyleObject {
  const isHorizontal = orientation === 'horizontal';

  return {
    display: fullWidth ? 'flex' : 'inline-flex',
    flexDirection: isHorizontal ? 'row' : 'column',
    alignItems: isHorizontal ? 'flex-start' : undefined,
    gap: sizeConfig.gap,
    width: fullWidth ? '100%' : undefined,
  };
}

// ---------------------------------------------------------------------------
// Label style
// ---------------------------------------------------------------------------

/**
 * Build the label element style for a {@link FormField}.
 *
 * @param sizeConfig - Resolved size configuration from {@link formFieldSizeMap}.
 * @param disabled - Whether the field is visually disabled (applies muted color).
 * @param orientation - Label placement direction.
 * @param labelWidth - Explicit label column width for horizontal orientation.
 * @param themeColors - Active theme color tokens.
 * @returns A `CSSStyleObject` object for the `<label>` element.
 */
export function buildLabelStyle(
  sizeConfig: FormFieldSizeConfig,
  disabled: boolean,
  orientation: FormFieldOrientation,
  labelWidth: string | number | undefined,
  theme: WispTheme,
  onSurface: boolean = false,
): CSSStyleObject {
  const { colors: themeColors, spacing, typography } = theme;
  const isHorizontal = orientation === 'horizontal';

  const color = disabled
    ? themeColors.text.muted
    : onSurface
      ? themeColors.text.onRaised
      : themeColors.text.primary;

  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.labelFontSize,
    lineHeight: 1.4,
    fontWeight: typography.weights.semibold,
    color,
    cursor: 'default',
    userSelect: 'none',
    flexShrink: 0,
    ...(isHorizontal
      ? {
          width: labelWidth ?? 120,
          paddingTop: spacing.sm, // Align with input text baseline
        }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Required indicator style
// ---------------------------------------------------------------------------

/**
 * Build the style for the required indicator asterisk (`*`).
 *
 * @param themeColors - Active theme color tokens (uses `status.danger` for the indicator).
 * @returns A `CSSStyleObject` object for the required `<span>`.
 */
export function buildRequiredStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, spacing, typography } = theme;
  return {
    color: themeColors.status.danger,
    marginLeft: spacing['2xs'],
    fontWeight: typography.weights.regular,
  };
}

// ---------------------------------------------------------------------------
// Content wrapper (for horizontal layout)
// ---------------------------------------------------------------------------

/**
 * Build the content wrapper style used in horizontal orientation to stack
 * the control and hint text vertically beside the label.
 *
 * @param orientation - Current layout orientation.
 * @returns A `CSSStyleObject` object. Returns an empty object for vertical orientation.
 */
export function buildContentStyle(orientation: FormFieldOrientation, theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  if (orientation === 'horizontal') {
    return {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    };
  }
  return {};
}

// ---------------------------------------------------------------------------
// Hint / error style
// ---------------------------------------------------------------------------

/**
 * Build the hint / error message style displayed below the form control.
 *
 * @param sizeConfig - Resolved size configuration from {@link formFieldSizeMap}.
 * @param error - When `true`, the text is colored with `status.danger`; otherwise `text.muted`.
 * @param themeColors - Active theme color tokens.
 * @returns A `CSSStyleObject` object for the hint `<p>` element.
 */
export function buildHintStyle(
  sizeConfig: FormFieldSizeConfig,
  error: boolean,
  theme: WispTheme,
  onSurface: boolean = false,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.hintFontSize,
    lineHeight: 1.4,
    fontWeight: typography.weights.regular,
    color: error
      ? themeColors.status.danger
      : onSurface
        ? themeColors.text.onRaisedSecondary
        : themeColors.text.muted,
    margin: 0,
  };
}
