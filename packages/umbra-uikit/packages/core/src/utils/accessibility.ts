/**
 * @module utils/accessibility
 * @description Accessibility prop generators for common UI patterns.
 *
 * These pure functions return the correct ARIA / `accessibilityRole` props
 * so that Wisp components are screen-reader friendly out of the box. They
 * work on both web (ARIA attributes) and React Native (accessibility* props).
 *
 * @example
 * ```tsx
 * import { getButtonA11yProps, getInputA11yProps } from '@wisp/utils/accessibility';
 *
 * <button {...getButtonA11yProps('Submit form', false)}>Submit</button>
 * <input {...getInputA11yProps('Email', undefined, true)} />
 * ```
 */

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

/**
 * Generates accessibility props for a button-like element.
 *
 * Returns `role`, `aria-label`, and `aria-disabled` as appropriate.
 * When the element is a native `<button>`, most of these are redundant,
 * but they are essential for `<div>` or `<Pressable>` based buttons.
 *
 * @param label - The accessible label for the button (used as `aria-label`).
 * @param disabled - Whether the button is disabled. Defaults to `false`.
 * @returns A props object to spread onto the button element.
 *
 * @example
 * ```tsx
 * const a11y = getButtonA11yProps('Close dialog', false);
 * // { role: 'button', 'aria-label': 'Close dialog', tabIndex: 0 }
 *
 * <Pressable {...a11y} onPress={handleClose}>
 *   <CloseIcon />
 * </Pressable>
 * ```
 *
 * @example
 * ```tsx
 * // Disabled button
 * const a11y = getButtonA11yProps('Submit', true);
 * // { role: 'button', 'aria-label': 'Submit', 'aria-disabled': true, tabIndex: -1 }
 * ```
 */
export function getButtonA11yProps(
  label: string,
  disabled?: boolean,
): Record<string, unknown> {
  const props: Record<string, unknown> = {
    role: 'button',
    'aria-label': label,
  };

  if (disabled) {
    props['aria-disabled'] = true;
    props['tabIndex'] = -1;
  } else {
    props['tabIndex'] = 0;
  }

  return props;
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

/**
 * Generates accessibility props for a text input element.
 *
 * Links the input to its label via `aria-label`, marks it as required
 * when applicable, and associates an error message via `aria-describedby`
 * if an error string is provided (the caller is responsible for rendering
 * the element whose `id` matches the `aria-describedby` value).
 *
 * @param label - The accessible label for the input.
 * @param error - An optional error message. When truthy, `aria-invalid` is
 *   set and `aria-describedby` points to `{label}-error`.
 * @param required - Whether the field is required. Defaults to `false`.
 * @returns A props object to spread onto the input element.
 *
 * @example
 * ```tsx
 * const a11y = getInputA11yProps('Email address', undefined, true);
 * // { 'aria-label': 'Email address', 'aria-required': true }
 *
 * <input type="email" {...a11y} />
 * ```
 *
 * @example
 * ```tsx
 * // With validation error
 * const a11y = getInputA11yProps('Password', 'Must be at least 8 characters', true);
 * // {
 * //   'aria-label': 'Password',
 * //   'aria-required': true,
 * //   'aria-invalid': true,
 * //   'aria-describedby': 'Password-error',
 * // }
 *
 * <input {...a11y} />
 * <span id="Password-error">Must be at least 8 characters</span>
 * ```
 */
export function getInputA11yProps(
  label: string,
  error?: string,
  required?: boolean,
): Record<string, unknown> {
  const props: Record<string, unknown> = {
    'aria-label': label,
  };

  if (required) {
    props['aria-required'] = true;
  }

  if (error) {
    props['aria-invalid'] = true;
    props['aria-describedby'] = `${label}-error`;
  }

  return props;
}

// ---------------------------------------------------------------------------
// Checkbox
// ---------------------------------------------------------------------------

/**
 * Generates accessibility props for a checkbox element.
 *
 * Sets the `role` to `'checkbox'` and `aria-checked` to the current state.
 * This is primarily useful for custom checkbox implementations built on
 * non-semantic elements like `<div>` or React Native `<Pressable>`.
 *
 * @param label - The accessible label for the checkbox.
 * @param checked - The current checked state.
 * @returns A props object to spread onto the checkbox element.
 *
 * @example
 * ```tsx
 * const a11y = getCheckboxA11yProps('Accept terms', true);
 * // {
 * //   role: 'checkbox',
 * //   'aria-label': 'Accept terms',
 * //   'aria-checked': true,
 * //   tabIndex: 0,
 * // }
 *
 * <div {...a11y} onClick={toggle}>
 *   {checked ? <CheckIcon /> : null}
 * </div>
 * ```
 *
 * @example
 * ```tsx
 * // Unchecked state
 * const a11y = getCheckboxA11yProps('Enable notifications', false);
 * // { role: 'checkbox', 'aria-label': 'Enable notifications', 'aria-checked': false, tabIndex: 0 }
 * ```
 */
export function getCheckboxA11yProps(
  label: string,
  checked: boolean,
): Record<string, unknown> {
  return {
    role: 'checkbox',
    'aria-label': label,
    'aria-checked': checked,
    tabIndex: 0,
  };
}

// ---------------------------------------------------------------------------
// Live region
// ---------------------------------------------------------------------------

/**
 * Generates ARIA live region props for dynamic content announcements.
 *
 * Live regions cause screen readers to announce changes to the element's
 * text content. Use `assertive` for urgent messages (errors, alerts) and
 * `polite` for informational updates (status messages, toasts).
 *
 * @param assertive - When `true`, uses `aria-live="assertive"` which
 *   interrupts the current announcement. Defaults to `false` (`"polite"`).
 * @returns A props object to spread onto the live region container.
 *
 * @example
 * ```tsx
 * const liveProps = getLiveRegionProps();
 * // { 'aria-live': 'polite', 'aria-atomic': true }
 *
 * <div {...liveProps}>
 *   {statusMessage}
 * </div>
 * ```
 *
 * @example
 * ```tsx
 * // Assertive for error messages
 * const errorLive = getLiveRegionProps(true);
 * // { 'aria-live': 'assertive', 'aria-atomic': true }
 *
 * <div {...errorLive}>
 *   {errorMessage}
 * </div>
 * ```
 */
export function getLiveRegionProps(
  assertive?: boolean,
): Record<string, unknown> {
  return {
    'aria-live': assertive ? 'assertive' : 'polite',
    'aria-atomic': true,
  };
}
