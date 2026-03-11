/**
 * @module types/LinkPreviewCard
 * @description Type definitions for the LinkPreviewCard component —
 * a URL preview card showing title, description, image, and domain.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

export const linkPreviewCardSizes = ['sm', 'md', 'lg'] as const;
export type LinkPreviewCardSize = (typeof linkPreviewCardSizes)[number];

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export const linkPreviewCardLayouts = ['horizontal', 'vertical'] as const;
export type LinkPreviewCardLayout = (typeof linkPreviewCardLayouts)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Fetched metadata
// ---------------------------------------------------------------------------

/**
 * Open Graph metadata resolved from a URL.
 */
export interface LinkPreviewData {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
}

/**
 * Custom fetcher function for resolving link preview metadata.
 * Receives the URL and should return the resolved metadata.
 */
export type LinkPreviewFetcher = (url: string) => Promise<LinkPreviewData>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the LinkPreviewCard component.
 *
 * @remarks
 * Renders a URL preview card with image, title, description, and domain —
 * similar to link previews in Telegram, Slack, and Discord.
 *
 * When `autoFetch` is enabled, the component automatically fetches Open Graph
 * metadata from the URL using the built-in fetcher or a custom `fetcher` prop.
 */
export interface LinkPreviewCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The URL being previewed. */
  url: string;

  /** Title text from the Open Graph / meta tags. */
  title?: string;

  /** Description text from the Open Graph / meta tags. */
  description?: string;

  /** Image URL for the preview thumbnail. */
  image?: string;

  /** Domain / site name (e.g. "github.com", "YouTube"). */
  siteName?: string;

  /** Favicon URL for the site. */
  favicon?: string;

  /** Size preset. @default 'md' */
  size?: LinkPreviewCardSize;

  /** Layout direction. @default 'vertical' */
  layout?: LinkPreviewCardLayout;

  /** Called when the card is clicked. */
  onPress?: () => void;

  /** Whether the card is loading. @default false */
  loading?: boolean;

  /** Show loading skeleton. @default false */
  skeleton?: boolean;

  /**
   * When true, automatically fetches Open Graph metadata from the URL.
   * Shows a skeleton while loading. Fetched data is overridden by
   * explicit props (title, description, image, etc.).
   * @default false
   */
  autoFetch?: boolean;

  /**
   * Custom fetcher function for resolving link preview metadata.
   * When not provided and `autoFetch` is true, uses the built-in
   * fetcher which calls `https://api.microlink.io`.
   */
  fetcher?: LinkPreviewFetcher;
}
