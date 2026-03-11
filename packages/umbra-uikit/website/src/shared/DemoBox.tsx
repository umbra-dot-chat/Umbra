import React from 'react';
import { Box, useThemeColors } from '@wisp-ui/react';

interface DemoBoxProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  /** Opacity level for the fill. Defaults to 'medium'. */
  intensity?: 'subtle' | 'medium' | 'strong';
  /** Shorthand for Box padding. */
  p?: 'none' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  /** Shorthand for Box radius. */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Shorthand for Box display. */
  display?: 'block' | 'flex' | 'grid' | 'inline' | 'inline-flex' | 'none';
  /** Shorthand for Box position. */
  position?: 'relative' | 'absolute' | 'fixed' | 'sticky';
}

/**
 * Theme-aware placeholder box for registry previews.
 *
 * Uses `border.subtle` as a fill so the shape is visible in both
 * light and dark mode (unlike raw `rgba(255,255,255,X)`).
 */
export function DemoBox({
  children,
  style,
  intensity = 'medium',
  p,
  radius,
  display,
  position,
}: DemoBoxProps) {
  const colors = useThemeColors();

  const bg =
    intensity === 'subtle'
      ? colors.accent.highlight
      : intensity === 'strong'
        ? colors.border.strong
        : colors.border.subtle;

  return (
    <Box
      p={p}
      radius={radius}
      display={display}
      position={position}
      style={{ backgroundColor: bg, ...style }}
    >
      {children}
    </Box>
  );
}
