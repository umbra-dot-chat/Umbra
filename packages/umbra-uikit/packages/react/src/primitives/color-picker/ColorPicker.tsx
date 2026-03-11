import React, { forwardRef, useMemo, useCallback, useState } from 'react';
import type { ColorPickerProps } from '@coexist/wisp-core/types/ColorPicker.types';
import { colorPickerSizeMap } from '@coexist/wisp-core/types/ColorPicker.types';
import {
  buildColorPickerContainerStyle,
  buildColorPickerPreviewRowStyle,
  buildColorPickerPreviewStyle,
  buildColorPickerInputStyle,
  buildColorPickerSwatchGridStyle,
  buildColorPickerSwatchStyle,
  buildColorPickerLabelStyle,
  getColorPickerSkeletonStyle,
} from '@coexist/wisp-core/styles/ColorPicker.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Default preset colours shown when no `presets` prop is provided.
 */
const DEFAULT_PRESETS: string[] = [
  '#000000',
  '#FFFFFF',
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#6B7280',
];

/**
 * Regex for validating a 3- or 6-character hex colour string (with `#` prefix).
 */
const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

/**
 * Normalise a short-form hex (`#abc`) to full form (`#aabbcc`).
 *
 * @param hex - A valid 3- or 6-char hex colour string.
 * @returns The 6-char hex colour string.
 */
function normalizeHex(hex: string): string {
  if (hex.length === 4) {
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return hex.toUpperCase();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ColorPicker -- Inline colour-picker primitive for the Wisp design system.
 *
 * Renders a colour preview swatch, an optional hex input, and a grid of
 * preset colour swatches. Supports controlled (`value` + `onChange`) and
 * uncontrolled (`defaultValue`) modes, three size tokens, skeleton loading,
 * and disabled state.
 *
 * @remarks
 * Key features:
 * - Three sizes via the {@link ColorPickerSize} token (`sm` | `md` | `lg`).
 * - Click a preset swatch to select that colour.
 * - Type a hex value into the input to update the colour.
 * - The selected swatch gets an accent border ring.
 * - Hover state highlights swatches with a strong border.
 * - `skeleton` mode renders a shimmer placeholder.
 * - Forwards a ref to the outermost `<div>` element.
 *
 * @module primitives/color-picker
 *
 * @example
 * ```tsx
 * // Uncontrolled
 * <ColorPicker defaultValue="#3B82F6" />
 *
 * // Controlled
 * <ColorPicker value={color} onChange={setColor} />
 *
 * // With label
 * <ColorPicker label="Background" />
 *
 * // Custom presets
 * <ColorPicker presets={['#FF0000', '#00FF00', '#0000FF']} />
 * ```
 */
export const ColorPicker = forwardRef<HTMLDivElement, ColorPickerProps>(function ColorPicker(
  {
    value: controlledValue,
    defaultValue = '#000000',
    onChange,
    size = 'md',
    presets,
    showInput = true,
    disabled = false,
    skeleton = false,
    label,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  // ---------------------------------------------------------------------------
  // Controlled / uncontrolled colour state
  // ---------------------------------------------------------------------------
  const [internalColor, setInternalColor] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const currentColor = isControlled ? controlledValue : internalColor;

  const updateColor = useCallback(
    (newColor: string) => {
      if (disabled) return;
      if (!isControlled) {
        setInternalColor(newColor);
      }
      onChange?.(newColor);
    },
    [disabled, isControlled, onChange],
  );

  // ---------------------------------------------------------------------------
  // Hex input state
  // ---------------------------------------------------------------------------
  const [inputValue, setInputValue] = useState(currentColor);
  const [inputFocused, setInputFocused] = useState(false);

  // Keep input in sync with external value when not focused
  const displayInput = inputFocused ? inputValue : currentColor;

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value;

      // Auto-prepend `#` if the user started typing without it
      if (raw.length > 0 && raw[0] !== '#') {
        raw = `#${raw}`;
      }

      setInputValue(raw);

      if (HEX_REGEX.test(raw)) {
        updateColor(normalizeHex(raw));
      }
    },
    [updateColor],
  );

  const handleInputFocus = useCallback(() => {
    setInputValue(currentColor);
    setInputFocused(true);
  }, [currentColor]);

  const handleInputBlur = useCallback(() => {
    setInputFocused(false);
    // Reset to current colour if the typed value is invalid
    if (!HEX_REGEX.test(inputValue)) {
      setInputValue(currentColor);
    }
  }, [inputValue, currentColor]);

  // ---------------------------------------------------------------------------
  // Swatch hover tracking
  // ---------------------------------------------------------------------------
  const [hoveredSwatch, setHoveredSwatch] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Resolve dimensions
  // ---------------------------------------------------------------------------
  const sizeConfig = useMemo(() => colorPickerSizeMap[size], [size]);
  const resolvedPresets = presets ?? DEFAULT_PRESETS;

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------
  if (skeleton) {
    const skeletonStyle = getColorPickerSkeletonStyle(sizeConfig, theme);
    return (
      <div
        aria-hidden
        className={className}
        style={{ ...skeletonStyle, ...userStyle }}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Build styles
  // ---------------------------------------------------------------------------
  const containerStyle = buildColorPickerContainerStyle(sizeConfig);
  const previewRowStyle = buildColorPickerPreviewRowStyle(sizeConfig);
  const previewStyle = buildColorPickerPreviewStyle(sizeConfig, currentColor, theme);
  const inputStyle = buildColorPickerInputStyle(sizeConfig, theme);
  const swatchGridStyle = buildColorPickerSwatchGridStyle(sizeConfig, theme);
  const labelStyle = label ? buildColorPickerLabelStyle(sizeConfig, theme) : undefined;

  // Disabled opacity
  const disabledStyle: React.CSSProperties | undefined = disabled
    ? { opacity: 0.5, pointerEvents: 'none' as const }
    : undefined;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      ref={ref}
      role="group"
      aria-label={label || 'Colour picker'}
      aria-disabled={disabled || undefined}
      className={className}
      style={{ ...containerStyle, ...disabledStyle, ...userStyle }}
      {...rest}
    >
      {/* Label */}
      {label && (
        <span style={labelStyle}>
          {label}
        </span>
      )}

      {/* Preview row: colour swatch + hex input */}
      <div style={previewRowStyle}>
        <div style={previewStyle} aria-hidden />
        {showInput && (
          <input
            type="text"
            value={displayInput}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            disabled={disabled}
            aria-label="Hex colour value"
            maxLength={7}
            spellCheck={false}
            autoComplete="off"
            style={inputStyle}
          />
        )}
      </div>

      {/* Preset swatch grid */}
      {resolvedPresets.length > 0 && (
        <div style={swatchGridStyle} role="group" aria-label="Colour presets">
          {resolvedPresets.map((presetColor) => {
            const normalised = normalizeHex(presetColor);
            const isSelected = currentColor.toUpperCase() === normalised;
            const isHovered = hoveredSwatch === presetColor;

            return (
              <button
                key={presetColor}
                type="button"
                aria-label={`Select colour ${presetColor}`}
                aria-pressed={isSelected}
                disabled={disabled}
                style={buildColorPickerSwatchStyle(
                  sizeConfig,
                  presetColor,
                  isSelected,
                  isHovered,
                  theme,
                )}
                onClick={() => updateColor(normalised)}
                onMouseEnter={() => setHoveredSwatch(presetColor)}
                onMouseLeave={() => setHoveredSwatch(null)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});

ColorPicker.displayName = 'ColorPicker';
