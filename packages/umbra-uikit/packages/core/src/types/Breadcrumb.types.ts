import { defaultTypography } from '../theme/create-theme';
import type React from 'react';

// ---------------------------------------------------------------------------
// Breadcrumb Sizes
// ---------------------------------------------------------------------------

/** Tuple of all valid breadcrumb size keys. */
export const breadcrumbSizes = ['sm', 'md', 'lg'] as const;

/** Union of valid breadcrumb size keys derived from {@link breadcrumbSizes}. */
export type BreadcrumbSize = (typeof breadcrumbSizes)[number];

// ---------------------------------------------------------------------------
// Size dimensions map
// ---------------------------------------------------------------------------

/** Pixel dimensions derived from a {@link BreadcrumbSize} preset. */
export interface BreadcrumbSizeConfig {
  /** Font size in pixels. */
  fontSize: number;
}

/**
 * Maps each {@link BreadcrumbSize} to its corresponding
 * {@link BreadcrumbSizeConfig}.
 */
export const breadcrumbSizeMap: Record<BreadcrumbSize, BreadcrumbSizeConfig> = {
  sm: { fontSize: defaultTypography.sizes.xs.fontSize },
  md: { fontSize: defaultTypography.sizes.sm.fontSize },
  lg: { fontSize: defaultTypography.sizes.base.fontSize },
};

// ---------------------------------------------------------------------------
// Breadcrumb (nav wrapper) Props
// ---------------------------------------------------------------------------

/**
 * Props for the root {@link Breadcrumb} navigation wrapper.
 *
 * @remarks
 * Renders a `nav` element with an ordered list of {@link BreadcrumbItem}
 * children. Separators are inserted automatically between items.
 */
export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  /** Custom separator element rendered between items. Defaults to a `ChevronRight` icon. */
  separator?: React.ReactNode;
  /**
   * Size preset controlling font size.
   * @default 'md'
   */
  size?: BreadcrumbSize;
  /** One or more {@link BreadcrumbItem} elements. */
  children: React.ReactNode;
  /** Optional CSS class applied to the `nav` element. */
  className?: string;
  /** Optional inline styles merged onto the `nav` element. */
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// BreadcrumbItem Props
// ---------------------------------------------------------------------------

/**
 * Props for an individual {@link BreadcrumbItem}.
 *
 * @remarks
 * When `href` is provided the item renders as an anchor (`a`).
 * When `active` is `true` the item renders as a non-interactive `span`
 * with `aria-current="page"`. Otherwise it renders as a `button`.
 */
export interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLLIElement> {
  /** URL for link-based breadcrumb items. When set, an `a` tag is rendered. */
  href?: string;
  /**
   * Marks this item as the current page. Renders with `aria-current="page"`.
   * @default false
   */
  active?: boolean;
  /** Optional icon displayed before the label text. */
  icon?: React.ReactNode;
  /** Item label content. */
  children: React.ReactNode;
  /** Click handler forwarded to the inner `a` or `button` element. */
  onClick?: React.MouseEventHandler<HTMLElement>;
}

// ---------------------------------------------------------------------------
// BreadcrumbSeparator Props
// ---------------------------------------------------------------------------

/**
 * Props for a standalone {@link BreadcrumbSeparator}.
 *
 * @remarks
 * Typically not used directly -- the {@link Breadcrumb} component inserts
 * separators automatically. This component is exported for advanced
 * composition use cases.
 */
export interface BreadcrumbSeparatorProps extends React.HTMLAttributes<HTMLLIElement> {
  /** Custom separator content. Defaults to `'/'` when omitted. */
  children?: React.ReactNode;
}
