import React, { forwardRef, useMemo } from 'react';
import type { SeparatorProps } from '@coexist/wisp-core/types/Separator.types';
import {
  buildSeparatorStyle,
  buildLineStyle,
  buildLabelStyle,
  resolveSeparatorColor,
} from '@coexist/wisp-core/styles/Separator.styles';
import { useTheme } from '../../providers';
import { thicknessValues } from '@coexist/wisp-core/tokens/shared';

/**
 * Separator — Horizontal or vertical divider primitive for the Wisp design system.
 *
 * @remarks
 * Renders a thin dividing line to visually separate content. Supports an
 * optional centered label that "breaks" the line, two color variants
 * (subtle/strong), configurable spacing, and thickness override.
 *
 * Key features:
 * - Horizontal and vertical orientations via {@link SeparatorProps.orientation}.
 * - Optional centered label that splits the line into two segments.
 * - `subtle` and `strong` color variants mapped to theme border tokens.
 * - Configurable spacing (`none`, `sm`, `md`, `lg`) around the line.
 * - Thickness override using shared {@link Thickness} tokens.
 * - Renders with `role="separator"` and the appropriate `aria-orientation`.
 *
 * @module primitives/separator
 *
 * @example
 * ```tsx
 * <Separator />
 * <Separator variant="strong" spacing="lg" />
 * <Separator label="OR" />
 * <Separator orientation="vertical" />
 * ```
 */
export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(function Separator(
  {
    orientation = 'horizontal',
    variant = 'subtle',
    label,
    spacing = 'md',
    thickness,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const hasLabel = label != null;
  const thicknessPx = thickness ? thicknessValues[thickness] : 1;

  // Resolve the line color from variant
  const lineColor = useMemo(
    () => resolveSeparatorColor(variant, theme),
    [variant, theme],
  );

  // Build the root container style
  const separatorStyle = useMemo(
    () => buildSeparatorStyle(orientation, lineColor, spacing, hasLabel, thicknessPx),
    [orientation, lineColor, spacing, hasLabel, thicknessPx],
  );

  // Build line segment styles (for labeled horizontal separators)
  const lineStyle = useMemo(
    () => (hasLabel ? buildLineStyle(lineColor, thicknessPx) : undefined),
    [hasLabel, lineColor, thicknessPx],
  );

  // Build label style
  const labelStyle = useMemo(
    () => (hasLabel ? buildLabelStyle(theme) : undefined),
    [hasLabel, theme],
  );

  // Vertical separator never shows a label
  if (orientation === 'vertical') {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="vertical"
        className={className}
        style={{ ...separatorStyle, ...userStyle }}
        {...rest}
      />
    );
  }

  // Horizontal with label
  if (hasLabel) {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="horizontal"
        className={className}
        style={{ ...separatorStyle, ...userStyle }}
        {...rest}
      >
        <div style={lineStyle} />
        <span style={labelStyle}>{label}</span>
        <div style={lineStyle} />
      </div>
    );
  }

  // Horizontal without label
  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation="horizontal"
      className={className}
      style={{ ...separatorStyle, ...userStyle }}
      {...rest}
    />
  );
});

Separator.displayName = 'Separator';
