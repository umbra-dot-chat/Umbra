/**
 * @module ButtonGroup
 */
import React, { forwardRef, useState, useCallback, useMemo } from 'react';
import type { ButtonGroupProps } from '@coexist/wisp-core/types/ButtonGroup.types';
import type { CSSStyleObject } from '@coexist/wisp-core/types';
import { buttonGroupSizeMap } from '@coexist/wisp-core/types/ButtonGroup.types';
import {
  buildGroupContainerStyle,
  buildGroupItemStyle,
} from '@coexist/wisp-core/styles/ButtonGroup.styles';
import { useTheme } from '../../providers';
import { Text } from '../../primitives/text';

/**
 * ButtonGroup — Grouped toggle button primitive for the Wisp design system.
 *
 * @remarks
 * Renders a horizontal row of connected buttons where one is active at a time.
 * Supports `outline` and `ghost` variants, four sizes, icon + label items,
 * controlled and uncontrolled modes.
 *
 * @example
 * ```tsx
 * <ButtonGroup
 *   items={[
 *     { value: 'all', label: 'View all' },
 *     { value: 'active', label: 'Active' },
 *     { value: 'archived', label: 'Archived' },
 *   ]}
 *   defaultValue="all"
 * />
 * ```
 */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  {
    items,
    value: controlledValue,
    defaultValue,
    onChange,
    variant = 'outline',
    size = 'md',
    fullWidth = false,
    disabled = false,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = buttonGroupSizeMap[size];
  const [internalValue, setInternalValue] = useState(defaultValue ?? items[0]?.value);

  const isControlled = controlledValue !== undefined;
  const activeValue = isControlled ? controlledValue : internalValue;

  const handleItemClick = useCallback(
    (itemValue: string, itemDisabled?: boolean) => {
      if (disabled || itemDisabled) return;
      if (!isControlled) setInternalValue(itemValue);
      onChange?.(itemValue);
    },
    [disabled, isControlled, onChange],
  );

  const containerStyle = useMemo(
    () => buildGroupContainerStyle(theme, variant, fullWidth),
    [theme, variant, fullWidth],
  );

  // Hover state tracking per item
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const textSizeMap: Record<string, 'xs' | 'sm' | 'md'> = {
    xs: 'xs',
    sm: 'xs',
    md: 'sm',
    lg: 'sm',
  };

  return (
    <div
      ref={ref}
      role="group"
      className={className}
      style={{ ...containerStyle, ...userStyle }}
      {...rest}
    >
      {items.map((item, i) => {
        const isActive = activeValue === item.value;
        const isItemDisabled = disabled || !!item.disabled;
        const isHovered = hoveredIndex === i && !isItemDisabled && !isActive;
        const Icon = item.icon;

        const itemStyle = buildGroupItemStyle(
          sizeConfig,
          theme,
          variant,
          isActive,
          isItemDisabled,
          i === 0,
          i === items.length - 1,
          fullWidth,
        );

        // Apply hover bg
        const finalStyle: CSSStyleObject = {
          ...itemStyle,
          backgroundColor: isHovered
            ? themeColors.accent.highlight
            : itemStyle.backgroundColor,
        };

        return (
          <button
            key={item.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-disabled={isItemDisabled || undefined}
            disabled={isItemDisabled}
            style={finalStyle}
            onClick={() => handleItemClick(item.value, item.disabled)}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {Icon && <Icon size={sizeConfig.iconSize} color="currentColor" strokeWidth={2} />}
            <Text size={textSizeMap[size]} weight="medium" color="currentColor">
              {item.label}
            </Text>
          </button>
        );
      })}
    </div>
  );
});

ButtonGroup.displayName = 'ButtonGroup';
