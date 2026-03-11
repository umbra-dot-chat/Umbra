import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type { ListItemProps } from '@coexist/wisp-core/types/ListItem.types';
import { buildListItemStyle, buildLeadingStyle, buildContentStyle, buildTrailingStyle } from '@coexist/wisp-core/styles/ListItem.styles';
import { useTheme } from '../../providers';

/**
 * ListItem — Three-region horizontal layout primitive for the Wisp design system.
 *
 * @remarks
 * Provides a leading slot (icon/avatar), content slot (title/subtitle),
 * and trailing slot (actions/metadata). The building block for all list-based
 * components: UserCard, NotificationItem, FilePreview, DataList rows, etc.
 *
 * Key features:
 * - Three configurable slots: {@link ListItemProps.leading | leading},
 *   children (content), and {@link ListItemProps.trailing | trailing}.
 * - Size presets (`sm`, `md`, `lg`) controlling padding, gap, and min-height.
 * - Optional interactive hover/active/disabled states.
 * - Polymorphic `as` prop for rendering as any HTML element.
 *
 * @module primitives/list-item
 *
 * @example
 * ```tsx
 * <ListItem
 *   leading={<Avatar size="sm" name="Jane" />}
 *   trailing={<Badge>Admin</Badge>}
 * >
 *   <Text size="sm" weight="medium">Jane Doe</Text>
 *   <Text size="xs" color="secondary">jane@example.com</Text>
 * </ListItem>
 * ```
 */
export const ListItem = forwardRef<HTMLElement, ListItemProps>(function ListItem(
  {
    children,
    as: Component = 'div',
    size = 'md',
    leading,
    trailing,
    align = 'center',
    interactive = false,
    active = false,
    disabled = false,
    style: userStyle,
    onMouseEnter,
    onMouseLeave,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const [hovered, setHovered] = useState(false);

  const computedStyle = useMemo(
    () => buildListItemStyle({ size, align, interactive, active, disabled, theme }),
    [size, align, interactive, active, disabled, theme],
  );

  const leadingSlotStyle = useMemo(() => buildLeadingStyle(), [theme]);
  const contentSlotStyle = useMemo(() => buildContentStyle(), []);
  const trailingSlotStyle = useMemo(() => buildTrailingStyle(theme), [theme]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      setHovered(true);
      onMouseEnter?.(e);
    },
    [onMouseEnter],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      setHovered(false);
      onMouseLeave?.(e);
    },
    [onMouseLeave],
  );

  const hoverStyle: React.CSSProperties =
    interactive && hovered && !active && !disabled
      ? { backgroundColor: themeColors.background.surface }
      : {};

  const mergedStyle = userStyle
    ? { ...computedStyle, ...hoverStyle, ...userStyle }
    : { ...computedStyle, ...hoverStyle };

  return React.createElement(
    Component,
    {
      ref,
      style: mergedStyle,
      onMouseEnter: interactive ? handleMouseEnter : onMouseEnter,
      onMouseLeave: interactive ? handleMouseLeave : onMouseLeave,
      ...rest,
    },
    <>
      {leading && <div style={leadingSlotStyle}>{leading}</div>}
      <div style={contentSlotStyle}>{children}</div>
      {trailing && <div style={trailingSlotStyle}>{trailing}</div>}
    </>,
  );
});

ListItem.displayName = 'ListItem';
