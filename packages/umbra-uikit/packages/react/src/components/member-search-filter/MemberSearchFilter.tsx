/**
 * @module MemberSearchFilter
 * @description Search/filter input for the member list panel.
 */
import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type { MemberSearchFilterProps } from '@coexist/wisp-core/types/MemberSearchFilter.types';
import {
  resolveMemberSearchFilterColors,
  buildMemberSearchFilterContainerStyle,
  buildMemberSearchFilterInputWrapperStyle,
  buildMemberSearchFilterBadgeStyle,
  buildMemberSearchFilterSkeletonStyle,
} from '@coexist/wisp-core/styles/MemberSearchFilter.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function SearchIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function XIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Skeleton keyframes
// ---------------------------------------------------------------------------

let skeletonInjected = false;

function ensureSkeletonKeyframes() {
  if (skeletonInjected || typeof document === 'undefined') return;
  const s = document.createElement('style');
  s.textContent = `@keyframes wisp-skeleton-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.25; } }`;
  document.head.appendChild(s);
  skeletonInjected = true;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * MemberSearchFilter -- Search/filter input for the member list panel.
 *
 * @remarks
 * Wraps a search input with an optional result count badge.
 * Supports controlled and uncontrolled modes, loading state, and skeleton.
 *
 * @example
 * ```tsx
 * <MemberSearchFilter
 *   value={query}
 *   onChange={setQuery}
 *   resultCount={12}
 *   placeholder="Search members..."
 * />
 * ```
 */
export const MemberSearchFilter = forwardRef<HTMLDivElement, MemberSearchFilterProps>(
  function MemberSearchFilter(
    {
      value: controlledValue,
      defaultValue = '',
      onChange,
      onClear,
      placeholder = 'Search members...',
      size = 'sm',
      loading = false,
      resultCount,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const [internalValue, setInternalValue] = useState(defaultValue);
    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : internalValue;

    const colors = useMemo(
      () => resolveMemberSearchFilterColors(theme),
      [theme],
    );

    const containerStyle = useMemo(
      () => buildMemberSearchFilterContainerStyle(colors, theme),
      [colors, theme],
    );

    const inputWrapperStyle = useMemo(
      () => buildMemberSearchFilterInputWrapperStyle(),
      [],
    );

    const badgeStyle = useMemo(
      () => buildMemberSearchFilterBadgeStyle(colors, theme),
      [colors, theme],
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (!isControlled) setInternalValue(val);
        onChange?.(val);
      },
      [isControlled, onChange],
    );

    const handleClear = useCallback(() => {
      if (!isControlled) setInternalValue('');
      onChange?.('');
      onClear?.();
    }, [isControlled, onChange, onClear]);

    // -- Skeleton -----------------------------------------------------------

    if (skeleton) {
      ensureSkeletonKeyframes();
      const skelStyle = buildMemberSearchFilterSkeletonStyle(colors, theme);
      const barBase: React.CSSProperties = {
        backgroundColor: colors.border,
        borderRadius: 4,
        animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
      };
      return (
        <div
          aria-hidden
          className={className}
          style={{ ...skelStyle, ...userStyle }}
        >
          <div style={{ ...barBase, flex: 1, height: size === 'sm' ? 32 : 38 }} />
        </div>
      );
    }

    // -- Size config --------------------------------------------------------

    const isSm = size === 'sm';
    const inputHeight = isSm ? 32 : 38;
    const iconSize = isSm ? 14 : 16;
    const fontSize = isSm ? 13 : 14;

    const inputContainerStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      height: inputHeight,
      paddingLeft: 10,
      paddingRight: 10,
      backgroundColor: 'transparent',
      borderRadius: theme.radii.md,
      border: `1px solid ${colors.border}`,
      boxSizing: 'border-box',
      flex: 1,
      minWidth: 0,
    };

    const inputFieldStyle: React.CSSProperties = {
      border: 'none',
      outline: 'none',
      background: 'transparent',
      flex: 1,
      minWidth: 0,
      height: '100%',
      fontSize,
      color: colors.text,
      padding: 0,
      margin: 0,
    };

    const clearBtnStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 2,
      border: 'none',
      borderRadius: theme.radii.sm,
      background: 'transparent',
      color: colors.textMuted,
      cursor: 'pointer',
      flexShrink: 0,
    };

    return (
      <div
        ref={ref}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        <div style={inputContainerStyle}>
          <SearchIcon size={iconSize} color={colors.textMuted} />
          <input
            type="text"
            value={currentValue}
            onChange={handleChange}
            placeholder={placeholder}
            style={inputFieldStyle}
            aria-label={placeholder}
          />
          {loading && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
              aria-label="Loading"
            >
              <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                </path>
              </svg>
            </span>
          )}
          {currentValue && !loading && (
            <button
              type="button"
              onClick={handleClear}
              style={clearBtnStyle}
              aria-label="Clear search"
            >
              <XIcon size={iconSize} color={colors.textMuted} />
            </button>
          )}
        </div>
        {resultCount !== undefined && (
          <span style={badgeStyle} aria-label={`${resultCount} results`}>
            {resultCount}
          </span>
        )}
      </div>
    );
  },
);

MemberSearchFilter.displayName = 'MemberSearchFilter';
