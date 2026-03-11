import React, { forwardRef, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { SelectProps } from '@coexist/wisp-core/types/Select.types';
import { selectSizeMap } from '@coexist/wisp-core/types/Select.types';
import {
  resolveSelectColors,
  buildWrapperStyle,
  buildTriggerStyle,
  buildTriggerTextStyle,
  buildDropdownStyle,
  buildOptionStyle,
  buildLabelStyle,
  buildHintStyle,
  getSelectSkeletonStyle,
} from '@coexist/wisp-core/styles/Select.styles';
import { useTheme } from '../../providers';
import { Text } from '../../primitives/text';

/**
 * Select -- A single-value dropdown selector with keyboard navigation.
 *
 * @remarks
 * Key features:
 * - Controlled and uncontrolled usage via {@link SelectProps.value} / {@link SelectProps.defaultValue}.
 * - Full keyboard navigation (Arrow keys, Enter, Space, Escape).
 * - Accessible via `role="combobox"` / `role="listbox"` ARIA pattern.
 * - Supports leading icons, descriptions, disabled options, skeleton loading, and error states.
 * - Closes on outside click and returns focus to the trigger after selection.
 *
 * @module primitives/select
 * @example
 * ```tsx
 * <Select
 *   size="md"
 *   label="Country"
 *   placeholder="Choose a country"
 *   options={[
 *     { value: 'us', label: 'United States' },
 *     { value: 'gb', label: 'United Kingdom' },
 *   ]}
 *   onChange={(value) => console.log(value)}
 * />
 * ```
 */
export const Select = forwardRef<HTMLDivElement, SelectProps>(function Select(
  {
    value: controlledValue,
    defaultValue,
    onChange,
    options,
    placeholder = 'Select…',
    size = 'md',
    label,
    hint,
    error,
    disabled = false,
    fullWidth = false,
    skeleton = false,
    leadingIcon,
    className,
    style: userStyle,
    variant = 'solid',
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = selectSizeMap[size];
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);
  const selectedValue = isControlled ? controlledValue : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const hasError = error === true || (typeof error === 'string' && error.length > 0);
  const hintText = typeof error === 'string' && error.length > 0 ? error : hint;

  const colors = useMemo(
    () => resolveSelectColors(isOpen, hasError, disabled, theme),
    [isOpen, hasError, disabled, theme],
  );

  const wrapperStyle = useMemo(() => buildWrapperStyle(sizeConfig, fullWidth), [sizeConfig, fullWidth, theme]);
  const triggerStyle = useMemo(() => buildTriggerStyle(sizeConfig, colors, disabled, theme), [sizeConfig, colors, disabled, theme]);
  const dropdownStyle = useMemo(() => buildDropdownStyle(theme, variant), [theme, variant]);
  const labelStyle = useMemo(() => buildLabelStyle(sizeConfig, colors, theme), [sizeConfig, colors, theme]);
  const hintStyle = useMemo(() => buildHintStyle(sizeConfig, colors, theme), [sizeConfig, colors, theme]);

  const selectedOption = options.find((opt) => opt.value === selectedValue);
  const triggerTextStyle = useMemo(
    () => buildTriggerTextStyle(colors, !selectedOption),
    [colors, selectedOption],
  );

  const handleToggle = useCallback(() => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    setHighlightedIndex(-1);
  }, [disabled]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      if (!isControlled) setInternalValue(optionValue);
      onChange?.(optionValue);
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [isControlled, onChange],
  );

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
        return;
      }

      if (!isOpen) return;

      const enabledOptions = options.map((opt, i) => ({ opt, i })).filter(({ opt }) => !opt.disabled);

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const currentPos = enabledOptions.findIndex(({ i }) => i === highlightedIndex);
          const next = currentPos < enabledOptions.length - 1 ? enabledOptions[currentPos + 1].i : enabledOptions[0].i;
          setHighlightedIndex(next);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const currentPos = enabledOptions.findIndex(({ i }) => i === highlightedIndex);
          const prev = currentPos > 0 ? enabledOptions[currentPos - 1].i : enabledOptions[enabledOptions.length - 1].i;
          setHighlightedIndex(prev);
          break;
        }
        case 'Enter':
        case ' ': {
          e.preventDefault();
          if (highlightedIndex >= 0 && !options[highlightedIndex]?.disabled) {
            handleSelect(options[highlightedIndex].value);
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        }
      }
    },
    [disabled, isOpen, options, highlightedIndex, handleSelect],
  );

  if (skeleton) {
    const skeletonStyle = getSelectSkeletonStyle(sizeConfig, theme);
    return (
      <div aria-hidden data-testid="select-skeleton" className={className} style={{ ...skeletonStyle, ...userStyle }} />
    );
  }

  return (
    <div ref={ref} className={className} style={{ ...wrapperStyle, ...userStyle }}>
      {label && <Text style={labelStyle}>{label}</Text>}

      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-disabled={disabled || undefined}
        disabled={disabled}
        style={triggerStyle}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        {/* Leading icon — selected option's icon wins, then fallback to prop */}
        {(selectedOption?.icon || leadingIcon) && (
          <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: colors.icon }}>
            {selectedOption?.icon || leadingIcon}
          </span>
        )}
        <span style={triggerTextStyle}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        {selectedOption?.description && (
          <span style={{ flexShrink: 0, color: colors.placeholder, fontSize: sizeConfig.fontSize - 1 }}>
            {selectedOption.description}
          </span>
        )}
        <ChevronDown
          size={sizeConfig.iconSize}
          color={colors.icon}
          style={{
            flexShrink: 0,
            transition: 'transform 150ms ease',
            transform: isOpen ? 'rotate(180deg)' : undefined,
          }}
        />
      </button>

      {isOpen && (
        <div ref={dropdownRef} role="listbox" style={dropdownStyle}>
          {options.map((option, index) => {
            const isSelected = option.value === selectedValue;
            const isHighlighted = index === highlightedIndex;
            const optStyle = buildOptionStyle(
              theme, isSelected, isHighlighted, Boolean(option.disabled),
              sizeConfig.fontSize, sizeConfig.lineHeight,
            );
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled || undefined}
                style={optStyle}
                onClick={() => { if (!option.disabled) handleSelect(option.value); }}
                onMouseEnter={() => { if (!option.disabled) setHighlightedIndex(index); }}
                onMouseLeave={() => setHighlightedIndex(-1)}
              >
                {option.icon && (
                  <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    {option.icon}
                  </span>
                )}
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {option.label}
                </span>
                {option.description && (
                  <span style={{ flexShrink: 0, color: themeColors.text.muted, fontSize: sizeConfig.fontSize - 1 }}>
                    {option.description}
                  </span>
                )}
                {isSelected && <Check size={14} color={themeColors.accent.primary} style={{ flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      )}

      {hintText && <Text style={hintStyle}>{hintText}</Text>}
    </div>
  );
});

Select.displayName = 'Select';
