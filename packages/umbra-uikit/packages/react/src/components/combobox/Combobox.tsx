import React, { forwardRef, useMemo, useCallback, useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import type { ComboboxProps } from '@coexist/wisp-core/types/Combobox.types';
import { inputSizeMap } from '@coexist/wisp-core/types/Input.types';
import {
  resolveComboboxColors,
  buildWrapperStyle,
  buildTriggerStyle,
  buildComboboxInputStyle,
  buildLabelStyle,
  buildHintStyle,
  buildDropdownStyle,
  buildOptionStyle,
  buildEmptyStyle,
  getComboboxSkeletonStyle,
} from '@coexist/wisp-core/styles/Combobox.styles';
import { useTheme } from '../../providers';

/**
 * Combobox -- An autocomplete-enabled dropdown selector with type-ahead filtering.
 *
 * @remarks
 * Key features:
 * - Controlled and uncontrolled usage via {@link ComboboxProps.value} / {@link ComboboxProps.defaultValue}.
 * - Type-ahead filtering narrows the option list as the user types.
 * - Full keyboard navigation (Arrow keys, Enter, Escape).
 * - Accessible via `role="combobox"` with `aria-autocomplete="list"` and a portal-rendered listbox.
 * - Supports leading icons, descriptions, disabled options, skeleton loading, and error states.
 * - Dropdown is rendered via `createPortal` to avoid overflow clipping and repositions on scroll/resize.
 *
 * @module primitives/combobox
 * @example
 * ```tsx
 * <Combobox
 *   size="md"
 *   label="Assignee"
 *   placeholder="Search people..."
 *   options={[
 *     { value: 'alice', label: 'Alice' },
 *     { value: 'bob', label: 'Bob' },
 *   ]}
 *   onChange={(value) => console.log(value)}
 * />
 * ```
 */
export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(
  {
    value: controlledValue,
    defaultValue,
    onChange,
    options,
    placeholder = '',
    size = 'md',
    label,
    hint,
    error,
    disabled = false,
    fullWidth = false,
    skeleton = false,
    emptyMessage = 'No results found',
    leadingIcon,
    className,
    style: userStyle,
    variant = 'solid',
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const generatedId = useId();
  const inputId = generatedId;
  const listboxId = generatedId + '-listbox';

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const mergeRefs = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      }
    },
    [ref],
  );

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const selectedValue = isControlled ? controlledValue : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number }>({
    top: 0, left: 0, width: 0,
  });

  const selectedOption = useMemo(() => {
    return options.find((o) => o.value === selectedValue);
  }, [options, selectedValue]);

  const selectedLabel = selectedOption ? selectedOption.label : '';

  const displayText = isOpen ? inputText : selectedLabel;

  const filteredOptions = useMemo(() => {
    if (!isOpen || inputText === '') return options;
    const lower = inputText.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(lower));
  }, [options, inputText, isOpen]);

  const updatePosition = useCallback(() => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, []);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    setInputText('');
    setHighlightedIndex(-1);
    updatePosition();
  }, [disabled, updatePosition]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setInputText('');
    setHighlightedIndex(-1);
  }, []);

  const selectOption = useCallback(
    (optionValue: string) => {
      if (!isControlled) {
        setInternalValue(optionValue);
      }
      onChange?.(optionValue);
      closeDropdown();
      inputRef.current?.focus();
    },
    [isControlled, onChange, closeDropdown],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newText = e.target.value;
      setInputText(newText);
      setHighlightedIndex(-1);
      if (!isOpen) {
        openDropdown();
      }
    },
    [isOpen, openDropdown],
  );

  const handleInputFocus = useCallback(() => {
    if (!disabled && !isOpen) {
      openDropdown();
    }
  }, [disabled, isOpen, openDropdown]);

  const handleTriggerClick = useCallback(() => {
    if (disabled) return;
    if (!isOpen) {
      openDropdown();
      inputRef.current?.focus();
    }
  }, [disabled, isOpen, openDropdown]);

  const handleInputBlur = useCallback(
    (e: React.FocusEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (
        relatedTarget &&
        (wrapperRef.current?.contains(relatedTarget) ||
          dropdownRef.current?.contains(relatedTarget))
      ) {
        return;
      }
      closeDropdown();
    },
    [closeDropdown],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          if (!isOpen) {
            openDropdown();
            return;
          }
          setHighlightedIndex((prev) => {
            let next = prev + 1;
            while (next < filteredOptions.length && filteredOptions[next]?.disabled) {
              next++;
            }
            return next < filteredOptions.length ? next : prev;
          });
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          if (!isOpen) {
            openDropdown();
            return;
          }
          setHighlightedIndex((prev) => {
            let next = prev - 1;
            while (next >= 0 && filteredOptions[next]?.disabled) {
              next--;
            }
            return next >= 0 ? next : prev;
          });
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
            const opt = filteredOptions[highlightedIndex];
            if (opt && !opt.disabled) {
              selectOption(opt.value);
            }
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          closeDropdown();
          break;
        }
        default:
          break;
      }
    },
    [disabled, isOpen, filteredOptions, highlightedIndex, openDropdown, closeDropdown, selectOption],
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (wrapperRef.current?.contains(target) || dropdownRef.current?.contains(target)) {
        return;
      }
      closeDropdown();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeDropdown]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  const sizeConfig = useMemo(() => inputSizeMap[size], [size]);
  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : undefined;

  const colors = useMemo(
    () => resolveComboboxColors(isOpen, hasError, disabled, theme),
    [isOpen, hasError, disabled, theme],
  );

  if (skeleton) {
    const skeletonStyle = getComboboxSkeletonStyle(sizeConfig, theme, fullWidth);
    return (
      <div
        aria-hidden
        className={className}
        style={{ ...skeletonStyle, ...userStyle }}
      />
    );
  }

  const wrapperStyle = buildWrapperStyle(sizeConfig, fullWidth);
  const triggerStyle = buildTriggerStyle(sizeConfig, colors, disabled, theme);
  const comboboxInputStyle = buildComboboxInputStyle(sizeConfig, colors);
  const labelStyleObj = buildLabelStyle(sizeConfig, colors, theme);

  const bottomText = errorMessage || hint;
  const isStatusText = Boolean(errorMessage);
  const hintStyleObj = bottomText ? buildHintStyle(sizeConfig, colors, isStatusText, theme) : undefined;

  const chevronColor = colors.icon;
  const chevronSize = sizeConfig.iconSize;

  const activeDescendant =
    isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length
      ? listboxId + '-option-' + highlightedIndex
      : undefined;

  return (
    <div
      ref={wrapperRef}
      style={{ ...wrapperStyle, ...userStyle }}
      className={className}
    >
      {label && (
        <label htmlFor={inputId} style={labelStyleObj}>
          {label}
        </label>
      )}

      <div
        style={triggerStyle}
        onClick={handleTriggerClick}
        data-testid="combobox-trigger"
      >
        {/* Leading icon — selected option's icon wins, then fallback to prop */}
        {(selectedOption?.icon || leadingIcon) && !isOpen && (
          <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: colors.icon }}>
            {selectedOption?.icon || leadingIcon}
          </span>
        )}
        <input
          ref={mergeRefs}
          id={inputId}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={isOpen ? listboxId : undefined}
          aria-activedescendant={activeDescendant}
          aria-invalid={hasError || undefined}
          aria-describedby={bottomText ? inputId + '-hint' : undefined}
          disabled={disabled}
          placeholder={placeholder}
          value={displayText}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          style={comboboxInputStyle}
          autoComplete="off"
        />

        <svg
          width={chevronSize}
          height={chevronSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke={chevronColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            transition: 'transform 150ms ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {bottomText && (
        <span id={inputId + '-hint'} style={hintStyleObj}>
          {bottomText}
        </span>
      )}

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            id={listboxId}
            aria-label={label || 'Options'}
            style={{
              ...buildDropdownStyle(theme, variant),
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
          >
            {filteredOptions.length === 0 ? (
              <div style={buildEmptyStyle(theme)} role="option" aria-disabled="true" aria-selected={false}>
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isHighlighted = index === highlightedIndex;
                const isSelected = opt.value === selectedValue;
                const isDisabled = Boolean(opt.disabled);

                return (
                  <div
                    key={opt.value}
                    id={listboxId + '-option-' + index}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabled || undefined}
                    style={buildOptionStyle(theme, isHighlighted, isSelected, isDisabled)}
                    onClick={() => {
                      if (!isDisabled) {
                        selectOption(opt.value);
                      }
                    }}
                    onMouseEnter={() => {
                      if (!isDisabled) {
                        setHighlightedIndex(index);
                      }
                    }}
                    onMouseLeave={() => {
                      setHighlightedIndex(-1);
                    }}
                  >
                    {opt.icon && (
                      <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        {opt.icon}
                      </span>
                    )}
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opt.label}
                    </span>
                    {opt.description && (
                      <span style={{ flexShrink: 0, color: themeColors.text.muted, fontSize: sizeConfig.fontSize - 1 }}>
                        {opt.description}
                      </span>
                    )}
                    {isSelected && (
                      <svg
                        width={16}
                        height={16}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={themeColors.text.primary}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                );
              })
            )}
          </div>,
          document.body,
        )}
    </div>
  );
});

Combobox.displayName = 'Combobox';
