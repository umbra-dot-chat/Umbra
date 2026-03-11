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
  url: string;
  enabled?: boolean;
  fetcher?: LinkPreviewFetcher;
}

export interface UseLinkPreviewResult {
  data: LinkPreviewData | null;
  loading: boolean;
  error: string | null;
}

export function useLinkPreview({
  url,
  enabled = true,
  fetcher,
}: UseLinkPreviewOptions): UseLinkPreviewResult {
  const [data, setData] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(enabled && !!url);
  const [error, setError] = useState<string | null>(null);
  const prevUrlRef = useRef<string>('');

  useEffect(() => {
    if (!enabled || !url) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    if (url === prevUrlRef.current && data) {
      return;
    }
    prevUrlRef.current = url;

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
    };
  }, [url, enabled, fetcher]);

  return { data, loading, error };
}
