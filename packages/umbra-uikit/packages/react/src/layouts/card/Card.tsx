import React, { forwardRef, useMemo, useCallback, useState } from 'react';
import type { CardProps } from '@coexist/wisp-core/types/Card.types';
import { buildCardStyle, getCardSkeletonStyle } from '@coexist/wisp-core/styles/Card.styles';
import { useTheme } from '../../providers';

/**
 * Card — A surface container for grouping related content.
 *
 * @remarks
 * Key features:
 * - Three visual variants: `elevated`, `outlined`, and `filled`.
 * - Configurable padding (`none`, `sm`, `md`, `lg`) and border radius.
 * - Interactive mode with hover, press, selected, and disabled states.
 * - Polymorphic `as` prop to render as any HTML element or component.
 * - Built-in skeleton loading state.
 * - Forwards a ref to the rendered root element.
 *
 * @module primitives/card
 * @example
 * ```tsx
 * <Card variant="elevated" padding="md">
 *   <h3>Title</h3>
 *   <p>Card body content.</p>
 * </Card>
 * <Card interactive onClick={handleClick} selected>
 *   Selectable card
 * </Card>
 * ```
 */
export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  {
    children,
    variant = 'elevated',
    padding = 'md',
    radius = 'md',
    interactive = false,
    selected = false,
    disabled = false,
    skeleton = false,
    as: Component = 'div',
    onClick,
    className,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (interactive && !disabled) setHovered(true);
  }, [interactive, disabled]);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    setPressed(false);
  }, []);

  const handleMouseDown = useCallback(() => {
    if (interactive && !disabled) setPressed(true);
  }, [interactive, disabled]);

  const handleMouseUp = useCallback(() => {
    setPressed(false);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    },
    [disabled, onClick],
  );

  if (skeleton) {
    const skeletonStyle = getCardSkeletonStyle(padding, radius, theme);
    return (
      <div
        aria-hidden
        data-testid="card-skeleton"
        className={className}
        style={{ ...skeletonStyle, ...userStyle }}
      />
    );
  }

  const computedStyle = useMemo(
    () =>
      buildCardStyle({
        variant,
        padding,
        radius,
        interactive,
        selected,
        disabled,
        hovered,
        pressed,
        theme,
      }),
    [variant, padding, radius, interactive, selected, disabled, hovered, pressed, theme],
  );

  const mergedStyle: React.CSSProperties = useMemo(
    () => ({ ...computedStyle, ...userStyle }),
    [computedStyle, userStyle],
  );

  return (
    <Component
      ref={ref}
      className={className}
      style={mergedStyle}
      onClick={onClick ? handleClick : undefined}
      aria-disabled={disabled || undefined}
      onMouseEnter={interactive ? handleMouseEnter : undefined}
      onMouseLeave={interactive ? handleMouseLeave : undefined}
      onMouseDown={interactive ? handleMouseDown : undefined}
      onMouseUp={interactive ? handleMouseUp : undefined}
      {...rest}
    >
      {children}
    </Component>
  );
});

Card.displayName = 'Card';
