/**
 * Pagination -- Pure state logic for page navigation controls.
 *
 * Extracted from the Pagination React component. Contains zero framework
 * dependencies -- every function is a pure transformation of its arguments.
 *
 * @module logic/pagination
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single item in the generated page list -- either a page number or an ellipsis gap. */
export type PageItem =
  | { type: 'page'; page: number }
  | { type: 'ellipsis'; key: string };

/** Configuration for page-range generation. */
export interface PaginationConfig {
  /** The 1-based index of the currently active page. */
  currentPage: number;
  /** Total number of pages available. */
  totalPages: number;
  /** Number of page buttons to show on each side of the current page. */
  siblingCount: number;
}

/** Boundary flags for the current page position. */
export interface PaginationBounds {
  /** Whether the current page is the first page. */
  isAtFirst: boolean;
  /** Whether the current page is the last page. */
  isAtLast: boolean;
}

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

/**
 * Generates an array of {@link PageItem} entries representing the visible
 * page buttons, including ellipsis gaps when the range is truncated.
 *
 * Algorithm (mirrors the Pagination component):
 * 1. Always show page 1.
 * 2. Show a left ellipsis if the sibling range starts past page 2.
 * 3. Show sibling pages around the current page.
 * 4. Show a right ellipsis if the sibling range ends before the second-to-last page.
 * 5. Always show the last page (when `totalPages > 1`).
 *
 * @param config - The pagination configuration.
 * @returns An ordered list of page and ellipsis items to render.
 */
export function generatePages(config: PaginationConfig): PageItem[] {
  const { currentPage, totalPages, siblingCount } = config;
  const items: PageItem[] = [];

  const leftSiblingStart = Math.max(2, currentPage - siblingCount);
  const rightSiblingEnd = Math.min(totalPages - 1, currentPage + siblingCount);

  const showLeftEllipsis = leftSiblingStart > 2;
  const showRightEllipsis = rightSiblingEnd < totalPages - 1;

  // Always include the first page
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

/**
 * Returns the boundary flags for the current page position.
 *
 * @param currentPage - The 1-based active page.
 * @param totalPages  - Total number of pages.
 * @returns A {@link PaginationBounds} object.
 */
export function getPaginationBounds(
  currentPage: number,
  totalPages: number,
): PaginationBounds {
  return {
    isAtFirst: currentPage <= 1,
    isAtLast: currentPage >= totalPages,
  };
}

/**
 * Clamps a page number to the valid range `[1, totalPages]`.
 *
 * @param page       - The desired page number.
 * @param totalPages - Total number of pages.
 * @returns The clamped page number.
 */
export function clampPage(page: number, totalPages: number): number {
  return Math.min(Math.max(1, page), totalPages);
}

/**
 * Returns the page number for a "go to next page" action.
 *
 * @param currentPage - The current page.
 * @param totalPages  - Total number of pages.
 * @returns The next page number (clamped to `totalPages`).
 */
export function getNextPage(currentPage: number, totalPages: number): number {
  return clampPage(currentPage + 1, totalPages);
}

/**
 * Returns the page number for a "go to previous page" action.
 *
 * @param currentPage - The current page.
 * @param totalPages  - Total number of pages.
 * @returns The previous page number (clamped to `1`).
 */
export function getPreviousPage(currentPage: number, totalPages: number): number {
  return clampPage(currentPage - 1, totalPages);
}

/**
 * Returns the first page (always `1`).
 */
export function getFirstPage(): number {
  return 1;
}

/**
 * Returns the last page.
 *
 * @param totalPages - Total number of pages.
 */
export function getLastPage(totalPages: number): number {
  return totalPages;
}
