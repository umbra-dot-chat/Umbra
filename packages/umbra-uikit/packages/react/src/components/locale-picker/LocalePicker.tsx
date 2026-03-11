import React, { forwardRef, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import type { LocalePickerProps, LocaleOption } from '@coexist/wisp-core/types/LocalePicker.types';
import { localePickerSizeMap } from '@coexist/wisp-core/types/LocalePicker.types';
import {
  resolveLocalePickerColors,
  buildWrapperStyle,
  buildLabelStyle,
  buildTriggerStyle,
  buildTriggerTextStyle,
  buildDropdownStyle,
  buildSearchInputStyle,
  buildGroupHeaderStyle,
  buildOptionStyle,
  buildOptionsListStyle,
  buildSkeletonStyle,
} from '@coexist/wisp-core/styles/LocalePicker.styles';
import { useTheme } from '../../providers';
import { Text } from '../../primitives/text';
import { fontFamilyStacks } from '@coexist/wisp-core/tokens/shared';

// ---------------------------------------------------------------------------
// Default locale options
// ---------------------------------------------------------------------------

/** Built-in set of common locale options used when no `options` prop is provided. */
export const DEFAULT_LOCALE_OPTIONS: LocaleOption[] = [
  { code: 'en-US', label: 'English (US)', nativeLabel: 'English', region: 'Americas' },
  { code: 'es-ES', label: 'Spanish (Spain)', nativeLabel: 'Español', region: 'Europe' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)', nativeLabel: 'Português', region: 'Americas' },
  { code: 'fr-FR', label: 'French (France)', nativeLabel: 'Français', region: 'Europe' },
  { code: 'de-DE', label: 'German (Germany)', nativeLabel: 'Deutsch', region: 'Europe' },
  { code: 'it-IT', label: 'Italian (Italy)', nativeLabel: 'Italiano', region: 'Europe' },
  { code: 'nl-NL', label: 'Dutch (Netherlands)', nativeLabel: 'Nederlands', region: 'Europe' },
  { code: 'sv-SE', label: 'Swedish (Sweden)', nativeLabel: 'Svenska', region: 'Europe' },
  { code: 'ru-RU', label: 'Russian (Russia)', nativeLabel: 'Русский', region: 'Europe' },
  { code: 'ja-JP', label: 'Japanese (Japan)', nativeLabel: '日本語', region: 'Asia' },
  { code: 'ko-KR', label: 'Korean (South Korea)', nativeLabel: '한국어', region: 'Asia' },
  { code: 'zh-CN', label: 'Chinese (Simplified)', nativeLabel: '中文(简体)', region: 'Asia' },
  { code: 'zh-TW', label: 'Chinese (Traditional)', nativeLabel: '中文(繁體)', region: 'Asia' },
  { code: 'hi-IN', label: 'Hindi (India)', nativeLabel: 'हिन्दी', region: 'Asia' },
  { code: 'ar-SA', label: 'Arabic (Saudi Arabia)', nativeLabel: 'العربية', region: 'Middle East' },
];

// ---------------------------------------------------------------------------
// Region ordering
// ---------------------------------------------------------------------------

const REGION_ORDER = ['Americas', 'Europe', 'Asia', 'Middle East'];

// ---------------------------------------------------------------------------
// Globe SVG icon component
// ---------------------------------------------------------------------------

function GlobeIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
      <path d="M3.6 9h16.8" />
      <path d="M3.6 15h16.8" />
      <path d="M12 3a15 15 0 014 18" />
      <path d="M12 3a15 15 0 00-4 18" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Chevron SVG icon component
// ---------------------------------------------------------------------------

function ChevronIcon({ size, color, isOpen }: { size: number; color: string; isOpen: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        flexShrink: 0,
        transition: 'transform 150ms ease',
        transform: isOpen ? 'rotate(180deg)' : undefined,
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Check SVG icon component
// ---------------------------------------------------------------------------

function CheckIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// LocalePicker component
// ---------------------------------------------------------------------------

/**
 * LocalePicker -- A locale / language selection dropdown with optional search
 * and region grouping.
 *
 * @remarks
 * Key features:
 * - Controlled and uncontrolled usage via {@link LocalePickerProps.value} / {@link LocalePickerProps.defaultValue}.
 * - Built-in default locale options (15+ common languages).
 * - Optional search filtering by label or native label.
 * - Optional region-based grouping (Americas, Europe, Asia, Middle East).
 * - Globe icon trigger with inline selected locale display.
 * - Closes on outside click and Escape key.
 * - Skeleton loading state.
 *
 * @module components/locale-picker
 * @example
 * ```tsx
 * <LocalePicker
 *   size="md"
 *   label="Language"
 *   placeholder="Select language"
 *   onChange={(code) => console.log(code)}
 * />
 * ```
 */
export const LocalePicker = forwardRef<HTMLDivElement, LocalePickerProps>(function LocalePicker(
  {
    value: controlledValue,
    defaultValue,
    onChange,
    options: optionsProp,
    size = 'md',
    placeholder = 'Select language',
    searchable = true,
    disabled = false,
    skeleton = false,
    label,
    groupByRegion = true,
    className,
    style: userStyle,
    ...restProps
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = localePickerSizeMap[size];
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const options = optionsProp ?? DEFAULT_LOCALE_OPTIONS;

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);
  const selectedValue = isControlled ? controlledValue : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Resolve colors
  const colors = useMemo(
    () => resolveLocalePickerColors(isOpen, disabled, theme),
    [isOpen, disabled, theme],
  );

  // Memoised styles
  const wrapperStyle = useMemo(() => buildWrapperStyle(sizeConfig), [sizeConfig, theme]);
  const labelStyle = useMemo(() => buildLabelStyle(sizeConfig, colors, theme), [sizeConfig, colors, theme]);
  const triggerStyle = useMemo(() => buildTriggerStyle(sizeConfig, colors, disabled, theme), [sizeConfig, colors, disabled, theme]);
  const dropdownStyle = useMemo(() => buildDropdownStyle(theme), [theme]);
  const searchInputStyle = useMemo(() => buildSearchInputStyle(sizeConfig, theme), [sizeConfig, theme]);
  const optionsListStyle = useMemo(() => buildOptionsListStyle(theme), [theme]);

  const selectedOption = options.find((opt) => opt.code === selectedValue);
  const triggerTextStyle = useMemo(
    () => buildTriggerTextStyle(colors, !selectedOption),
    [colors, selectedOption],
  );

  // Filter options by search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.nativeLabel && opt.nativeLabel.toLowerCase().includes(q)) ||
        opt.code.toLowerCase().includes(q),
    );
  }, [options, searchQuery]);

  // Group filtered options by region
  const groupedOptions = useMemo(() => {
    if (!groupByRegion) return null;

    const groups: Record<string, LocaleOption[]> = {};
    const ungrouped: LocaleOption[] = [];

    for (const opt of filteredOptions) {
      if (opt.region) {
        if (!groups[opt.region]) groups[opt.region] = [];
        groups[opt.region].push(opt);
      } else {
        ungrouped.push(opt);
      }
    }

    // Sort regions according to REGION_ORDER
    const sortedRegions = Object.keys(groups).sort((a, b) => {
      const ai = REGION_ORDER.indexOf(a);
      const bi = REGION_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    return { groups, sortedRegions, ungrouped };
  }, [filteredOptions, groupByRegion]);

  // Toggle dropdown
  const handleToggle = useCallback(() => {
    if (disabled) return;
    setIsOpen((prev) => {
      if (!prev) {
        setSearchQuery('');
        setHighlightedCode(null);
      }
      return !prev;
    });
  }, [disabled]);

  // Select option
  const handleSelect = useCallback(
    (code: string) => {
      if (!isControlled) setInternalValue(code);
      onChange?.(code);
      setIsOpen(false);
      setSearchQuery('');
      triggerRef.current?.focus();
    },
    [isControlled, onChange],
  );

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Keyboard navigation on trigger
  const handleTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        setIsOpen(true);
        setSearchQuery('');
        setHighlightedCode(null);
      }
    },
    [disabled, isOpen],
  );

  // Skeleton
  if (skeleton) {
    const skeletonStyle = buildSkeletonStyle(sizeConfig, theme);
    return (
      <div
        aria-hidden
        data-testid="locale-picker-skeleton"
        className={className}
        style={{ ...skeletonStyle, ...userStyle }}
      />
    );
  }

  // Render a single option row
  const renderOption = (option: LocaleOption) => {
    const isSelected = option.code === selectedValue;
    const isHighlighted = option.code === highlightedCode;
    const optStyle = buildOptionStyle(sizeConfig, theme, isSelected, isHighlighted);

    return (
      <div
        key={option.code}
        role="option"
        aria-selected={isSelected}
        style={optStyle}
        onClick={() => handleSelect(option.code)}
        onMouseEnter={() => setHighlightedCode(option.code)}
        onMouseLeave={() => setHighlightedCode(null)}
      >
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {option.label}
        </span>
        {option.nativeLabel && option.nativeLabel !== option.label && (
          <span
            style={{
              flexShrink: 0,
              color: themeColors.text.onRaisedSecondary,
              fontSize: sizeConfig.fontSize - 1,
              fontFamily: fontFamilyStacks.sans,
            }}
          >
            {option.nativeLabel}
          </span>
        )}
        {isSelected && <CheckIcon size={14} color={themeColors.accent.primary} />}
      </div>
    );
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...wrapperStyle, ...userStyle }}
      {...restProps}
    >
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
        onKeyDown={handleTriggerKeyDown}
      >
        <GlobeIcon size={sizeConfig.iconSize} color={colors.icon} />
        <span style={triggerTextStyle}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronIcon size={sizeConfig.iconSize} color={colors.icon} isOpen={isOpen} />
      </button>

      {isOpen && (
        <div ref={dropdownRef} role="listbox" style={dropdownStyle}>
          {searchable && (
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              style={searchInputStyle}
              aria-label="Search locales"
            />
          )}

          <div style={optionsListStyle}>
            {filteredOptions.length === 0 && (
              <div
                style={{
                  padding: '12px ' + sizeConfig.paddingX + 'px',
                  fontFamily: fontFamilyStacks.sans,
                  fontSize: sizeConfig.fontSize,
                  color: themeColors.text.onRaisedSecondary,
                  textAlign: 'center',
                }}
              >
                No results found
              </div>
            )}

            {groupByRegion && groupedOptions ? (
              <>
                {groupedOptions.sortedRegions.map((region) => (
                  <div key={region}>
                    <div style={buildGroupHeaderStyle(sizeConfig, theme)}>
                      {region}
                    </div>
                    {groupedOptions.groups[region].map(renderOption)}
                  </div>
                ))}
                {groupedOptions.ungrouped.map(renderOption)}
              </>
            ) : (
              filteredOptions.map(renderOption)
            )}
          </div>
        </div>
      )}
    </div>
  );
});

LocalePicker.displayName = 'LocalePicker';
