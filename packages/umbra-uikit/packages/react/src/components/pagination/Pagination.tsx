import React, { forwardRef, useMemo, useCallback, useState } from 'react';
import type { PaginationProps, PageItem } from '@coexist/wisp-core/types/Pagination.types';
import { paginationSizeMap } from '@coexist/wisp-core/types/Pagination.types';
import {
  buildNavStyle,
  buildActivePageStyle,
  buildInactivePageStyle,
  buildInactivePageHoverStyle,
  buildArrowStyle,
  buildArrowHoverStyle,
  buildEllipsisStyle,
} from '@coexist/wisp-core/styles/Pagination.styles';
import { useTheme } from '../../providers';

/**
 * Generates an array of {@link PageItem} entries representing the visible page
 * buttons, including ellipsis gaps when the range is truncated.
 *
 * @param currentPage - The 1-based index of the currently active page.
 * @param totalPages - Total number of pages available.
 * @param siblingCount - Number of page buttons to show on each side of the current page.
 * @returns An ordered list of page and ellipsis items to render.
 */
function generatePages(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
): PageItem[] {
  const items: PageItem[] = [];
  const leftSiblingStart = Math.max(2, currentPage - siblingCount);
  const rightSiblingEnd = Math.min(totalPages - 1, currentPage + siblingCount);
  const showLeftEllipsis = leftSiblingStart > 2;
  const showRightEllipsis = rightSiblingEnd < totalPages - 1;
  items.push({ type: 'page', page: 1 });
  if (showLeftEllipsis) {
    items.push({ type: 'ellipsis', key: 'left-ellipsis' });
  }
  for (let i = leftSiblingStart; i <= rightSiblingEnd; i++) {
    items.push({ type: 'page', page: i });
  }
  if (showRightEllipsis) {
    items.push({ type: 'ellipsis', key: 'right-ellipsis' });
  }
  if (totalPages > 1) {
    items.push({ type: 'page', page: totalPages });
  }
  return items;
}

/** Props shared by all internal chevron SVG icon components. */
interface IconProps {
  /** Icon width and height in pixels. */
  size: number;
  /** Stroke color applied to the SVG paths. */
  color: string;
}

/** Single left-pointing chevron icon (previous page). */
const ChevronLeft: React.FC<IconProps> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

/** Single right-pointing chevron icon (next page). */
const ChevronRight: React.FC<IconProps> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/** Double left-pointing chevron icon (first page). */
const ChevronsLeft: React.FC<IconProps> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="11 17 6 12 11 7" />
    <polyline points="18 17 13 12 18 7" />
  </svg>
);

/** Double right-pointing chevron icon (last page). */
const ChevronsRight: React.FC<IconProps> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="13 17 18 12 13 7" />
    <polyline points="6 17 11 12 6 7" />
  </svg>
);

/**
 * Pagination -- Renders a navigable page selector with first/prev/next/last controls.
 *
 * @remarks
 * - Supports controlled `page` state with an `onChange` callback.
 * - Displays ellipsis when the page range is truncated beyond the visible siblings.
 * - Includes optional first/last page jump buttons via {@link PaginationProps.showFirstLast}.
 * - Fully accessible with `aria-label` and `aria-current` attributes on every button.
 * - Theme-aware: reads accent and text colors from the current {@link useThemeColors} context.
 *
 * @module primitives/pagination
 * @example
 * ```tsx
 * <Pagination
 *   page={currentPage}
 *   totalPages={10}
 *   onChange={setCurrentPage}
 *   size="md"
 *   siblingCount={1}
 * />
 * ```
 */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  {
    page,
    totalPages,
    onChange,
    siblingCount = 1,
    size = 'md',
    showFirstLast = true,
    disabled = false,
    className,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const pageItems = useMemo(
    () => generatePages(page, totalPages, siblingCount),
    [page, totalPages, siblingCount],
  );

  const navStyle = useMemo(() => buildNavStyle(disabled, theme), [disabled, theme]);
  const activeStyle = useMemo(() => buildActivePageStyle(size, theme), [size, theme]);
  const inactiveStyle = useMemo(() => buildInactivePageStyle(size, disabled, theme), [size, disabled, theme]);
  const inactiveHoverStyle = useMemo(() => buildInactivePageHoverStyle(size, theme), [size, theme]);
  const ellipsisStyle = useMemo(() => buildEllipsisStyle(size, theme), [size, theme]);

  const isAtFirst = page <= 1;
  const isAtLast = page >= totalPages;

  const prevArrowStyle = useMemo(
    () => buildArrowStyle(size, isAtFirst || disabled, theme),
    [size, isAtFirst, disabled, theme],
  );
  const nextArrowStyle = useMemo(
    () => buildArrowStyle(size, isAtLast || disabled, theme),
    [size, isAtLast, disabled, theme],
  );
  const arrowHoverStyle = useMemo(
    () => buildArrowHoverStyle(size, theme),
    [size, theme],
  );

  const iconSize = paginationSizeMap[size].iconSize;

  const handlePageClick = useCallback(
    (p: number) => {
      if (!disabled && p !== page) {
        onChange(p);
      }
    },
    [disabled, page, onChange],
  );

  const handlePrev = useCallback(() => {
    if (!disabled && !isAtFirst) onChange(page - 1);
  }, [disabled, isAtFirst, page, onChange]);

  const handleNext = useCallback(() => {
    if (!disabled && !isAtLast) onChange(page + 1);
  }, [disabled, isAtLast, page, onChange]);

  const handleFirst = useCallback(() => {
    if (!disabled && !isAtFirst) onChange(1);
  }, [disabled, isAtFirst, onChange]);

  const handleLast = useCallback(() => {
    if (!disabled && !isAtLast) onChange(totalPages);
  }, [disabled, isAtLast, totalPages, onChange]);

  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const mergedStyle: React.CSSProperties = { ...navStyle, ...userStyle };

  return (
    <nav
      ref={ref}
      aria-label="Pagination"
      className={className}
      style={mergedStyle}
    >
      {showFirstLast && (
        <button
          type="button"
          aria-label="First page"
          disabled={isAtFirst || disabled}
          onClick={handleFirst}
          onMouseEnter={() => !isAtFirst && !disabled && setHoveredKey('first')}
          onMouseLeave={() => setHoveredKey(null)}
          style={
            hoveredKey === 'first' && !isAtFirst && !disabled
              ? arrowHoverStyle
              : prevArrowStyle
          }
        >
          <ChevronsLeft size={iconSize} color="currentColor" />
        </button>
      )}

      <button
        type="button"
        aria-label="Previous page"
        disabled={isAtFirst || disabled}
        onClick={handlePrev}
        onMouseEnter={() => !isAtFirst && !disabled && setHoveredKey('prev')}
        onMouseLeave={() => setHoveredKey(null)}
        style={
          hoveredKey === 'prev' && !isAtFirst && !disabled
            ? arrowHoverStyle
            : prevArrowStyle
        }
      >
        <ChevronLeft size={iconSize} color="currentColor" />
      </button>

      {pageItems.map((item) => {
        if (item.type === 'ellipsis') {
          return (
            <span key={item.key} style={ellipsisStyle} aria-hidden>
              {'\u2026'}
            </span>
          );
        }

        const isActive = item.page === page;
        const hoverKey = `page-${item.page}`;

        if (isActive) {
          return (
            <button
              key={item.page}
              type="button"
              aria-label={`Page ${item.page}`}
              aria-current="page"
              style={activeStyle}
              disabled={disabled}
            >
              {item.page}
            </button>
          );
        }

        return (
          <button
            key={item.page}
            type="button"
            aria-label={`Page ${item.page}`}
            disabled={disabled}
            onClick={() => handlePageClick(item.page)}
            onMouseEnter={() => !disabled && setHoveredKey(hoverKey)}
            onMouseLeave={() => setHoveredKey(null)}
            style={
              hoveredKey === hoverKey && !disabled
                ? inactiveHoverStyle
                : inactiveStyle
            }
          >
            {item.page}
          </button>
        );
      })}

      <button
        type="button"
        aria-label="Next page"
        disabled={isAtLast || disabled}
        onClick={handleNext}
        onMouseEnter={() => !isAtLast && !disabled && setHoveredKey('next')}
        onMouseLeave={() => setHoveredKey(null)}
        style={
          hoveredKey === 'next' && !isAtLast && !disabled
            ? arrowHoverStyle
            : nextArrowStyle
        }
      >
        <ChevronRight size={iconSize} color="currentColor" />
      </button>

      {showFirstLast && (
        <button
          type="button"
          aria-label="Last page"
          disabled={isAtLast || disabled}
          onClick={handleLast}
          onMouseEnter={() => !isAtLast && !disabled && setHoveredKey('last')}
          onMouseLeave={() => setHoveredKey(null)}
          style={
            hoveredKey === 'last' && !isAtLast && !disabled
              ? arrowHoverStyle
              : nextArrowStyle
          }
        >
          <ChevronsRight size={iconSize} color="currentColor" />
        </button>
      )}
    </nav>
  );
});

Pagination.displayName = 'Pagination';
