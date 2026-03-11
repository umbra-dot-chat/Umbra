/**
 * @module hooks/use-link-preview
 * @description Hook for fetching Open Graph metadata from a URL.
 *
 * Uses the Microlink API by default (free, no API key required) but
 * accepts a custom `fetcher` function for self-hosted solutions.
 */

import { useState, useEffect, useRef } from 'react';
import type { LinkPreviewData, LinkPreviewFetcher } from '@coexist/wisp-core/types/LinkPreviewCard.types';

// ---------------------------------------------------------------------------
// Default fetcher (Microlink API)
// ---------------------------------------------------------------------------

/**
 * Built-in fetcher using the Microlink API.
 * Free tier, no API key required, generous rate limits.
 *
 * @see https://microlink.io/docs/api/getting-started/overview
 */
async function defaultFetcher(url: string): Promise<LinkPreviewData> {
  const endpoint = `https://api.microlink.io?url=${encodeURIComponent(url)}`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`Failed to fetch link preview: ${response.status}`);
  }

  const json = await response.json();

  if (json.status !== 'success' || !json.data) {
    throw new Error('No preview data available');
  }

  const { data } = json;

  return {
    title: data.title || undefined,
    description: data.description || undefined,
    image: data.image?.url || data.screenshot?.url || undefined,
    siteName: data.publisher || undefined,
    favicon: data.logo?.url || undefined,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseLinkPreviewOptions {
  /** The URL to fetch metadata for. */
  url: string;
  /** Whether fetching is enabled. @default true */
  enabled?: boolean;
  /** Custom fetcher function. Falls back to Microlink API. */
  fetcher?: LinkPreviewFetcher;
}

export interface UseLinkPreviewResult {
  /** The fetched metadata (null while loading or on error). */
  data: LinkPreviewData | null;
  /** Whether the fetch is in progress. */
  loading: boolean;
  /** Error message if the fetch failed. */
  error: string | null;
}

/**
 * Fetches Open Graph / link preview metadata for a URL.
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useLinkPreview({
 *   url: 'https://github.com',
 * });
 *
 * if (loading) return <LinkPreviewCard skeleton url={url} />;
 * if (data) return <LinkPreviewCard url={url} {...data} />;
 * ```
 */
export function useLinkPreview({
  url,
  enabled = true,
  fetcher,
}: UseLinkPreviewOptions): UseLinkPreviewResult {
  const [data, setData] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const prevUrlRef = useRef<string>('');

  useEffect(() => {
    if (!enabled || !url) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Don't refetch if the URL hasn't changed
    if (url === prevUrlRef.current && data) {
      return;
    }
    prevUrlRef.current = url;

    // Abort any previous fetch
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let cancelled = false;

    setLoading(true);
    setError(null);

    const fetchFn = fetcher || defaultFetcher;

    fetchFn(url)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url, enabled, fetcher]);

  return { data, loading, error };
}
