/**
 * @module CopyButton
 * @description A clipboard copy button for the Wisp design system.
 */

import React, { forwardRef, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import type { CopyButtonProps } from '@coexist/wisp-core/types/CopyButton.types';
import { copyButtonSizeMap } from '@coexist/wisp-core/types/CopyButton.types';
import { buildCopyButtonStyle, getCopyButtonSkeletonStyle } from '@coexist/wisp-core/styles/CopyButton.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

/** Props shared by all internal SVG icon components. */
interface IconProps {
  /** Icon width and height in pixels. */
  size: number;
  /** Stroke color applied to the SVG paths. */
  color: string;
}

/** Clipboard / copy icon -- two overlapping rectangles. */
const CopyIcon: React.FC<IconProps> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

/** Checkmark icon -- shown in the copied success state. */
const CheckIcon: React.FC<IconProps> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

// ---------------------------------------------------------------------------
// CopyButton
// ---------------------------------------------------------------------------

/**
 * CopyButton -- Copies a string value to the clipboard on click.
 *
 * @remarks
 * - Displays a clipboard icon by default; swaps to a checkmark with optional
 *   "Copied!" label for a configurable duration after a successful copy.
 * - Supports three visual variants: `outline` (bordered), `ghost` (borderless),
 *   and `minimal` (icon-only, no background or border).
 * - Theme-aware: reads accent and text colors from the current {@link useThemeColors} context.
 * - Fully accessible with `aria-label` attributes.
 *
 * @module components/copy-button
 * @example
 * ```tsx
 * <CopyButton value="npm install wisp" />
 * <CopyButton value={apiKey} label="Copy" variant="ghost" />
 * <CopyButton value={code} variant="minimal" size="sm" />
 * ```
 */
export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(function CopyButton(
  {
    value,
    size = 'md',
    label,
    variant = 'outline',
    copiedLabel = 'Copied!',
    copiedDuration = 2000,
    onCopy,
    disabled = false,
    skeleton = false,
    style: userStyle,
    className,
    type = 'button',
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = copyButtonSizeMap[size];

  const [isCopied, setIsCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isCopied) return;

      rest.onClick?.(e);

      try {
        await navigator.clipboard.writeText(value);
        setIsCopied(true);
        onCopy?.(value);

        timeoutRef.current = setTimeout(() => {
          setIsCopied(false);
          timeoutRef.current = null;
        }, copiedDuration);
      } catch {
        // Clipboard API may fail in insecure contexts; fail silently
      }
    },
    [disabled, isCopied, value, onCopy, copiedDuration, rest],
  );

  const handleMouseEnter = useCallback(() => {
    if (!disabled) setHovered(true);
  }, [disabled]);

  const handleMouseLeave = useCallback(() => setHovered(false), []);

  // Skeleton
  if (skeleton) {
    const skeletonStyle = getCopyButtonSkeletonStyle(sizeConfig, theme);
    return (
      <div aria-hidden data-testid="copy-button-skeleton" className={className} style={{ ...skeletonStyle, ...userStyle }} />
    );
  }

  const buttonStyle = useMemo(
    () => buildCopyButtonStyle(sizeConfig, theme, variant, isCopied, hovered, disabled),
    [sizeConfig, theme, variant, isCopied, hovered, disabled],
  );

  const mergedStyle: React.CSSProperties = { ...buttonStyle, ...userStyle };

  const iconSize = sizeConfig.iconSize;
  const iconColor = isCopied ? themeColors.accent.primary : 'currentColor';

  const displayLabel = isCopied ? copiedLabel : label;

  return (
    <button
      ref={ref}
      type={type}
      className={className}
      style={mergedStyle}
      disabled={disabled}
      aria-label={isCopied ? 'Copied to clipboard' : 'Copy to clipboard'}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 150ms ease, opacity 150ms ease',
        }}
      >
        {isCopied
          ? <CheckIcon size={iconSize} color={iconColor} />
          : <CopyIcon size={iconSize} color={iconColor} />
        }
      </span>
      {displayLabel && (
        <span style={{ transition: 'opacity 150ms ease' }}>
          {displayLabel}
        </span>
      )}
    </button>
  );
});

CopyButton.displayName = 'CopyButton';
