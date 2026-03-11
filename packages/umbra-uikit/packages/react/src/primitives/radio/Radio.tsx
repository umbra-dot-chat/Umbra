import React, {
  forwardRef,
  useMemo,
  useCallback,
  useState,
  useRef,
  createContext,
  useContext,
} from 'react';
import type { RadioProps, RadioGroupProps } from '@coexist/wisp-core/types/Radio.types';
import { radioSizeMap } from '@coexist/wisp-core/types/Radio.types';
import type { ComponentSize } from '@coexist/wisp-core/tokens/shared';
import { fontFamilyStacks } from '@coexist/wisp-core/tokens/shared';
import {
  resolveRadioColors,
  buildOuterCircleStyle,
  buildInnerDotStyle,
  getRadioSkeletonStyle,
} from '@coexist/wisp-core/styles/Radio.styles';
import { useTheme } from '../../providers';
import { defaultSpacing, defaultRadii } from '@coexist/wisp-core/theme/create-theme';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/** Internal context value shared between {@link RadioGroup} and {@link Radio}. */
interface RadioGroupContextValue {
  /** Currently selected value. */
  value: string | undefined;
  /** Callback invoked when a radio option is selected. */
  onChange: (value: string) => void;
  /** HTML `name` attribute applied to every nested `<input type="radio">`. */
  name: string | undefined;
  /** Active {@link ComponentSize} propagated to all child radios. */
  size: ComponentSize;
  /** Whether all radios in the group are disabled. */
  disabled: boolean;
  /** Whether the group is in an error state. */
  error: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

/**
 * Retrieves the nearest {@link RadioGroupContextValue} from context.
 *
 * @throws Error if called outside of a {@link RadioGroup}.
 * @returns The current radio-group context value.
 */
function useRadioGroupContext(): RadioGroupContextValue {
  const ctx = useContext(RadioGroupContext);
  if (ctx === null) {
    throw new Error(
      '[Wisp] <Radio> must be used within a <RadioGroup>. ' +
        'Wrap your Radio components with <RadioGroup> to provide context.',
    );
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// RadioGroup
// ---------------------------------------------------------------------------

/**
 * RadioGroup — Container that provides context for {@link Radio} primitives.
 *
 * @remarks
 * Key features:
 * - Controlled and uncontrolled selection via `value` / `defaultValue`.
 * - Propagates `size`, `disabled`, and `error` to every child {@link Radio}.
 * - Renders a semantic `<div role="radiogroup">` with horizontal or vertical orientation.
 * - Supports a skeleton loading state that mirrors the number of children.
 *
 * @module primitives/radio
 * @example
 * ```tsx
 * <RadioGroup value={selected} onChange={setSelected} size="md">
 *   <Radio value="a" label="Option A" />
 *   <Radio value="b" label="Option B" />
 *   <Radio value="c" label="Option C" />
 * </RadioGroup>
 * ```
 */
export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
  {
    value: controlledValue,
    defaultValue,
    onChange,
    name,
    size = 'md',
    disabled = false,
    error = false,
    orientation = 'vertical',
    children,
    className,
    style: userStyle,
    skeleton = false,
    'aria-label': ariaLabel,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  // ---------------------------------------------------------------------------
  // Controlled / uncontrolled state
  // ---------------------------------------------------------------------------
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);
  const currentValue = isControlled ? controlledValue : internalValue;

  const handleChange = useCallback(
    (nextValue: string) => {
      if (!isControlled) setInternalValue(nextValue);
      onChange?.(nextValue);
    },
    [isControlled, onChange],
  );

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------
  if (skeleton) {
    const sizeConfig = radioSizeMap[size];
    const skeletonStyle = getRadioSkeletonStyle(sizeConfig, theme);
    const count = React.Children.count(children) || 3;
    return (
      <div
        aria-hidden
        className={className}
        style={{
          display: 'flex',
          flexDirection: orientation === 'horizontal' ? 'row' : 'column',
          gap: orientation === 'horizontal' ? 16 : 12,
          ...userStyle,
        }}
      >
        {Array.from({ length: count }, (_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: sizeConfig.gap }}>
            <div style={skeletonStyle} />
            <div
              style={{
                width: 60 + Math.random() * 40,
                height: sizeConfig.labelFontSize,
                borderRadius: defaultRadii.sm,
                backgroundColor: themeColors.border.subtle,
                animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------
  const contextValue = useMemo<RadioGroupContextValue>(
    () => ({
      value: currentValue,
      onChange: handleChange,
      name,
      size,
      disabled,
      error,
    }),
    [currentValue, handleChange, name, size, disabled, error],
  );

  // ---------------------------------------------------------------------------
  // Root style
  // ---------------------------------------------------------------------------
  const rootStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
    gap: orientation === 'horizontal' ? 16 : 12,
    fontFamily: fontFamilyStacks.sans,
    ...userStyle,
  };

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <div
        ref={ref}
        role="radiogroup"
        aria-label={ariaLabel}
        aria-invalid={error || undefined}
        className={className}
        style={rootStyle}
        {...rest}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
});

RadioGroup.displayName = 'RadioGroup';

// ---------------------------------------------------------------------------
// Radio
// ---------------------------------------------------------------------------

/**
 * Radio — Individual radio option within a {@link RadioGroup}.
 *
 * @remarks
 * Key features:
 * - Must be rendered inside a {@link RadioGroup} (throws otherwise).
 * - Renders a visually-hidden native `<input type="radio">` for form submission.
 * - Displays a themed outer circle with an animated inner dot for the selected state.
 * - Supports keyboard navigation (arrow keys cycle through siblings) and focus-visible ring.
 * - Optional `label` and `description` text alongside the indicator.
 *
 * @module primitives/radio
 * @example
 * ```tsx
 * <RadioGroup value={selected} onChange={setSelected}>
 *   <Radio value="a" label="Option A" />
 *   <Radio value="b" label="Option B" description="With description" />
 * </RadioGroup>
 * ```
 */
export const Radio = forwardRef<HTMLLabelElement, RadioProps>(function Radio(
  {
    value,
    label,
    description,
    disabled: localDisabled,
    className,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const group = useRadioGroupContext();

  const disabled = localDisabled || group.disabled;
  const selected = group.value === value;
  const sizeConfig = radioSizeMap[group.size];

  // ---------------------------------------------------------------------------
  // Hover state for border color (pointer-based to avoid stuck states)
  // ---------------------------------------------------------------------------
  const [hovered, setHovered] = useState(false);
  const labelRef = useRef<HTMLLabelElement | null>(null);

  const handlePointerEnter = useCallback(() => {
    if (!disabled) setHovered(true);
  }, [disabled]);

  const handlePointerLeave = useCallback(() => {
    setHovered(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Focus-visible ring (keyboard detection)
  // ---------------------------------------------------------------------------
  const [focusVisible, setFocusVisible] = useState(false);
  const isKeyboardRef = useRef(false);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLLabelElement>) => {
    isKeyboardRef.current = true;

    // Arrow key navigation within the radiogroup
    if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) {
      e.preventDefault();
      const radiogroup = (e.currentTarget as HTMLElement).closest('[role="radiogroup"]');
      if (!radiogroup) return;

      const radios = Array.from(
        radiogroup.querySelectorAll<HTMLElement>('label[data-radio-value]'),
      ).filter((el) => el.getAttribute('data-radio-disabled') !== 'true');

      const currentIndex = radios.findIndex(
        (el) => el.getAttribute('data-radio-value') === value,
      );
      if (currentIndex === -1) return;

      let nextIndex: number;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % radios.length;
      } else {
        nextIndex = (currentIndex - 1 + radios.length) % radios.length;
      }

      const nextRadio = radios[nextIndex];
      const nextValue = nextRadio.getAttribute('data-radio-value');
      if (nextValue) {
        group.onChange(nextValue);
        nextRadio.focus();
      }
    }
  }, [value, group]);

  const handleFocus = useCallback(() => {
    if (isKeyboardRef.current) {
      setFocusVisible(true);
    }
  }, []);

  const handleBlur = useCallback(() => {
    setFocusVisible(false);
    isKeyboardRef.current = false;
  }, []);

  // ---------------------------------------------------------------------------
  // Click handler
  // ---------------------------------------------------------------------------
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLLabelElement>) => {
      e.preventDefault();
      if (disabled) return;
      group.onChange(value);
    },
    [disabled, group, value],
  );

  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent<HTMLLabelElement>) => {
      if (e.key === ' ') {
        e.preventDefault();
        if (disabled) return;
        group.onChange(value);
      }
    },
    [disabled, group, value],
  );

  // ---------------------------------------------------------------------------
  // Resolve colors + styles
  // ---------------------------------------------------------------------------
  const colors = useMemo(
    () => resolveRadioColors(selected, disabled, group.error, theme),
    [selected, disabled, group.error, theme],
  );

  const outerStyle = useMemo(
    () => buildOuterCircleStyle(sizeConfig, colors, disabled, theme),
    [sizeConfig, colors, disabled, theme],
  );

  const innerStyle = useMemo(
    () => buildInnerDotStyle(sizeConfig, colors, selected, theme),
    [sizeConfig, colors, selected, theme],
  );

  // Hover and focus-visible overrides
  const interactiveOuterStyle: React.CSSProperties = {
    ...outerStyle,
    ...(hovered && !disabled
      ? { borderColor: colors.outerBorderHover }
      : {}),
    ...(focusVisible
      ? {
          boxShadow: `0 0 0 2px ${themeColors.background.canvas}, 0 0 0 4px ${themeColors.accent.primary}`,
        }
      : {}),
  };

  // Root label style
  const rootStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'flex-start',
    gap: sizeConfig.gap,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    userSelect: 'none',
    fontFamily: fontFamilyStacks.sans,
    outline: 'none',
    ...userStyle,
  };

  // ---------------------------------------------------------------------------
  // Text container
  // ---------------------------------------------------------------------------
  const hasText = Boolean(label || description);

  const textContainer = hasText ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: defaultSpacing['2xs'], minWidth: 0 }}>
      {label && (
        <span
          style={{
            fontSize: sizeConfig.labelFontSize,
            lineHeight: sizeConfig.labelLineHeight,
            color: colors.labelColor,
          }}
        >
          {label}
        </span>
      )}
      {description && (
        <span
          style={{
            fontSize: Math.max(sizeConfig.labelFontSize - 2, 11),
            lineHeight: sizeConfig.labelLineHeight,
            color: colors.descriptionColor,
          }}
        >
          {description}
        </span>
      )}
    </div>
  ) : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <label
      ref={(node) => {
        labelRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLLabelElement | null>).current = node;
      }}
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      data-radio-value={value}
      data-radio-disabled={disabled || undefined}
      className={className}
      style={rootStyle}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...rest}
    >
      {/* Hidden native input for form submission */}
      <input
        type="radio"
        name={group.name}
        value={value}
        checked={selected}
        disabled={disabled}
        aria-hidden
        tabIndex={-1}
        readOnly
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      />

      {/* Visual outer circle with inner dot */}
      <span style={interactiveOuterStyle}>
        <span style={innerStyle} />
      </span>

      {/* Label + description text */}
      {textContainer}
    </label>
  );
});

Radio.displayName = 'Radio';
