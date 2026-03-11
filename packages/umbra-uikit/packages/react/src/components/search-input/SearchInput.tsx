/**
 * @module SearchInput
 */
import React, { forwardRef, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import type { SearchInputProps } from '@coexist/wisp-core/types/SearchInput.types';
import {
  searchInputSizeMap,
  buildSearchInputContainerStyle,
  buildSearchInputFieldStyle,
  buildSearchInputClearButtonStyle,
} from '@coexist/wisp-core/styles/SearchInput.styles';
import { useTheme } from '../../providers';
import { Spinner } from '../../primitives';

// Inline SVG icons to avoid lucide dependency in the component
function SearchIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function XIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

/**
 * SearchInput — A specialized search field for the Wisp design system.
 *
 * @remarks
 * Pre-configured with a search icon, clear button, optional loading spinner,
 * and debounced search callback. Supports controlled and uncontrolled modes.
 *
 * @module components/search-input
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    {
      size = 'md',
      onSearch,
      onClear,
      loading = false,
      debounceMs = 0,
      fullWidth = false,
      disabled = false,
      value: controlledValue,
      defaultValue,
      onChange,
      onKeyDown,
      style: userStyle,
      className,
      placeholder = 'Search…',
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
  const themeColors = theme.colors;
    const [focused, setFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(
      (defaultValue as string) ?? '',
    );
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? String(controlledValue) : internalValue;

    const sizeConfig = searchInputSizeMap[size];

    const containerStyle = useMemo(
      () => buildSearchInputContainerStyle(sizeConfig, focused, disabled, theme, fullWidth),
      [sizeConfig, focused, disabled, theme, fullWidth],
    );

    const fieldStyle = useMemo(
      () => buildSearchInputFieldStyle(sizeConfig, theme),
      [sizeConfig, theme],
    );

    const clearBtnStyle = useMemo(
      () => buildSearchInputClearButtonStyle(theme),
      [theme],
    );

    // Debounced search
    useEffect(() => {
      if (debounceMs > 0 && onSearch && currentValue) {
        debounceRef.current = setTimeout(() => {
          onSearch(currentValue);
        }, debounceMs);
        return () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
        };
      }
    }, [currentValue, debounceMs, onSearch]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isControlled) setInternalValue(e.target.value);
        onChange?.(e);
      },
      [isControlled, onChange],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && onSearch) {
          onSearch(currentValue);
        }
        onKeyDown?.(e);
      },
      [currentValue, onSearch, onKeyDown],
    );

    const handleClear = useCallback(() => {
      if (!isControlled) setInternalValue('');
      onClear?.();
    }, [isControlled, onClear]);

    const showClear = currentValue.length > 0 && !loading;

    return (
      <div style={{ ...containerStyle, ...userStyle }} className={className}>
        <SearchIcon size={sizeConfig.iconSize} color={themeColors.text.muted} />
        <input
          ref={ref}
          type="text"
          value={currentValue}
          disabled={disabled}
          placeholder={placeholder}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={fieldStyle}
          {...rest}
        />
        {loading && <Spinner size="sm" />}
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            style={clearBtnStyle}
            tabIndex={-1}
            aria-label="Clear search"
          >
            <XIcon size={sizeConfig.iconSize - 4} color={themeColors.text.muted} />
          </button>
        )}
      </div>
    );
  },
);

SearchInput.displayName = 'SearchInput';
