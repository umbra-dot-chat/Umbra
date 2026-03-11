import React, { forwardRef, useMemo } from 'react';
import type { StackProps } from '@coexist/wisp-core/types/Stack.types';
import { buildStackStyle, buildDividerStyle } from '@coexist/wisp-core/styles/Stack.styles';
import { useTheme } from '../../providers';

/**
 * Stack -- Arranges children in a vertical or horizontal line with consistent spacing.
 *
 * @remarks
 * Key features:
 * - Configurable direction via {@link StackProps.direction | direction} (`vertical` or `horizontal`).
 * - Theme-aware gap between children via {@link StackProps.gap | gap}.
 * - Cross-axis alignment and main-axis justification.
 * - Optional child wrapping and order reversal.
 * - Automatic divider insertion between children when {@link StackProps.divider | divider} is enabled.
 * - Polymorphic rendering via the {@link StackProps.as | as} prop.
 *
 * @see {@link HStack} for a horizontal convenience alias.
 * @see {@link VStack} for a vertical convenience alias.
 *
 * @module primitives/stack
 *
 * @example
 * ```tsx
 * <Stack gap="lg" direction="vertical">
 *   <Card>One</Card>
 *   <Card>Two</Card>
 *   <Card>Three</Card>
 * </Stack>
 * ```
 */
export const Stack = forwardRef<HTMLElement, StackProps>(function Stack(
  {
    children,
    direction = 'vertical',
    gap = 'md',
    align = 'stretch',
    justify = 'start',
    wrap = false,
    reverse = false,
    divider = false,
    as: Component = 'div',
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const stackStyle = useMemo(
    () => buildStackStyle({ direction, gap, align, justify, wrap, reverse, spacing: theme.spacing }),
    [direction, gap, align, justify, wrap, reverse, theme.spacing],
  );

  const dividerStyle = useMemo(
    () => (divider ? buildDividerStyle(direction, themeColors.border.subtle) : undefined),
    [divider, direction, themeColors.border.subtle],
  );

  // Insert dividers between children when divider prop is set
  let content = children;
  if (divider && dividerStyle) {
    const childArray = React.Children.toArray(children).filter(Boolean);
    const withDividers: React.ReactNode[] = [];

    childArray.forEach((child, i) => {
      withDividers.push(child);
      if (i < childArray.length - 1) {
        withDividers.push(
          <div key={`divider-${i}`} style={dividerStyle} aria-hidden="true" />,
        );
      }
    });

    content = withDividers;
  }

  const mergedStyle = useMemo(
    () => ({ ...stackStyle, ...userStyle }),
    [stackStyle, userStyle],
  );

  return (
    <Component ref={ref} style={mergedStyle} {...rest}>
      {content}
    </Component>
  );
});

Stack.displayName = 'Stack';

/**
 * HStack -- Convenience alias for a horizontal {@link Stack}.
 *
 * @remarks
 * Renders a {@link Stack} with `direction="horizontal"`. All other
 * {@link StackProps} (except `direction`) are forwarded transparently.
 *
 * @module primitives/stack
 *
 * @example
 * ```tsx
 * <HStack gap="sm" align="center">
 *   <Button>Left</Button>
 *   <Button>Right</Button>
 * </HStack>
 * ```
 */
export const HStack = forwardRef<HTMLElement, Omit<StackProps, 'direction'>>(
  function HStack(props, ref) {
    return <Stack ref={ref} direction="horizontal" {...props} />;
  },
);

HStack.displayName = 'HStack';

/**
 * VStack -- Convenience alias for a vertical {@link Stack}.
 *
 * @remarks
 * Renders a {@link Stack} with `direction="vertical"`. All other
 * {@link StackProps} (except `direction`) are forwarded transparently.
 *
 * @module primitives/stack
 *
 * @example
 * ```tsx
 * <VStack gap="lg">
 *   <Text>First</Text>
 *   <Text>Second</Text>
 * </VStack>
 * ```
 */
export const VStack = forwardRef<HTMLElement, Omit<StackProps, 'direction'>>(
  function VStack(props, ref) {
    return <Stack ref={ref} direction="vertical" {...props} />;
  },
);

VStack.displayName = 'VStack';
