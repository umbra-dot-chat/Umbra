import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import type { BreadcrumbProps, BreadcrumbItemProps, BreadcrumbSeparatorProps } from '@coexist/wisp-core/types/Breadcrumb.types';
import { breadcrumbSizeMap } from '@coexist/wisp-core/types/Breadcrumb.types';
import {
  buildNavStyle,
  buildListStyle,
  buildItemStyle,
  buildLinkStyle,
  buildLinkHoverStyle,
  buildActiveStyle,
  buildSeparatorStyle,
} from '@coexist/wisp-core/styles/Breadcrumb.styles';
import { useTheme } from '../../providers';

/**
 * Breadcrumb -- Accessible navigation trail rendered as an ordered list inside a `nav`.
 *
 * @remarks
 * - Wraps children in a `nav` element with `aria-label="Breadcrumb"`.
 * - Automatically inserts a separator (default: `ChevronRight` icon) between each
 *   {@link BreadcrumbItem}.
 * - Supports three size presets via the `size` prop.
 *
 * @module primitives/breadcrumb
 * @example
 * ```tsx
 * <Breadcrumb size="md">
 *   <BreadcrumbItem href="/">Home</BreadcrumbItem>
 *   <BreadcrumbItem href="/docs">Docs</BreadcrumbItem>
 *   <BreadcrumbItem active>Current Page</BreadcrumbItem>
 * </Breadcrumb>
 * ```
 */
export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb(
  {
    separator,
    size = 'md',
    children,
    className,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = breadcrumbSizeMap[size];
  const navStyle = useMemo(() => buildNavStyle(), []);
  const listStyle = useMemo(() => buildListStyle(sizeConfig), [sizeConfig]);
  const separatorStyle = useMemo(() => buildSeparatorStyle(theme), [theme]);

  const items = React.Children.toArray(children);

  return (
    <nav ref={ref} aria-label="Breadcrumb" className={className} style={{ ...navStyle, ...userStyle }} {...rest}>
      <ol style={listStyle}>
        {items.map((child, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <li role="presentation" style={separatorStyle} aria-hidden>
                {separator || <ChevronRight size={sizeConfig.fontSize} />}
              </li>
            )}
            {child}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
});
Breadcrumb.displayName = 'Breadcrumb';

/**
 * BreadcrumbItem -- A single crumb in the breadcrumb trail.
 *
 * @remarks
 * - Renders as an `a` when `href` is provided, a `button` when only
 *   `onClick` is present, or a static `span` when `active` is `true`.
 * - The active item receives `aria-current="page"`.
 * - Supports an optional leading icon.
 *
 * @example
 * ```tsx
 * <BreadcrumbItem href="/settings" icon={<GearIcon />}>
 *   Settings
 * </BreadcrumbItem>
 * ```
 */
export const BreadcrumbItem = forwardRef<HTMLLIElement, BreadcrumbItemProps>(function BreadcrumbItem(
  { href, active = false, icon, children, onClick, className, style: userStyle, ...rest },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const [hovered, setHovered] = useState(false);
  const itemStyle = useMemo(() => buildItemStyle(), []);
  const linkStyle = useMemo(() => buildLinkStyle(theme), [theme]);
  const linkHoverStyleVal = useMemo(() => buildLinkHoverStyle(theme), [theme]);
  const activeStyle = useMemo(() => buildActiveStyle(theme), [theme]);

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  if (active) {
    return (
      <li ref={ref} className={className} style={{ ...itemStyle, ...userStyle }} aria-current="page" {...rest}>
        <span style={activeStyle}>
          {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
          {children}
        </span>
      </li>
    );
  }

  const resolvedLinkStyle = hovered ? { ...linkStyle, ...linkHoverStyleVal } : linkStyle;

  if (href) {
    return (
      <li ref={ref} className={className} style={{ ...itemStyle, ...userStyle }} {...rest}>
        <a
          href={href}
          style={resolvedLinkStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={onClick}
        >
          {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
          {children}
        </a>
      </li>
    );
  }

  return (
    <li ref={ref} className={className} style={{ ...itemStyle, ...userStyle }} {...rest}>
      <button
        type="button"
        style={resolvedLinkStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
      >
        {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
        {children}
      </button>
    </li>
  );
});
BreadcrumbItem.displayName = 'BreadcrumbItem';

/**
 * BreadcrumbSeparator -- Presentational separator between breadcrumb items.
 *
 * @remarks
 * The {@link Breadcrumb} component inserts separators automatically so this
 * component is only needed for advanced composition. Defaults to `'/'` when
 * no children are provided.
 *
 * @example
 * ```tsx
 * <BreadcrumbSeparator>/</BreadcrumbSeparator>
 * ```
 */
export const BreadcrumbSeparator = forwardRef<HTMLLIElement, BreadcrumbSeparatorProps>(function BreadcrumbSeparator(
  { children, ...rest },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const separatorStyle = useMemo(() => buildSeparatorStyle(theme), [theme]);
  return (
    <li ref={ref} role="presentation" style={separatorStyle} aria-hidden {...rest}>
      {children || '/'}
    </li>
  );
});
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';
