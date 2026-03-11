/**
 * Shared hook that lazily initialises a Shiki syntax highlighter and returns
 * a theme-bound {@link SyntaxHighlighter} compatible with the CodeBlock
 * `highlighter` prop.
 *
 * The Shiki instance is created once (module-level singleton) so multiple
 * CodeBlock instances share the same grammar & theme data.
 */
import { useState, useEffect } from 'react';
import { createShikiHighlighter } from '@wisp-ui/react';
import type { SyntaxHighlighter, ShikiHighlighterResult } from '@wisp-ui/react';

// ---------------------------------------------------------------------------
// Singleton promise — created once, shared across all consumers
// ---------------------------------------------------------------------------

let shikiPromise: Promise<ShikiHighlighterResult> | null = null;

function getShiki(): Promise<ShikiHighlighterResult> {
  if (!shikiPromise) {
    shikiPromise = createShikiHighlighter({
      themes: { dark: 'github-dark', light: 'github-light' },
      langs: [
        'typescript',
        'tsx',
        'jsx',
        'javascript',
        'html',
        'css',
        'json',
        'bash',
        'text',
      ],
    });
  }
  return shikiPromise;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns a `SyntaxHighlighter` bound to the active theme mode, or
 * `undefined` while Shiki is still loading.
 *
 * @param mode - `'dark'` or `'light'` — determines which Shiki theme to use.
 */
export function useShikiHighlighter(
  mode: 'dark' | 'light',
): SyntaxHighlighter | undefined {
  const [result, setResult] = useState<ShikiHighlighterResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    getShiki().then((r) => {
      if (!cancelled) setResult(r);
    });
    return () => { cancelled = true; };
  }, []);

  return result?.highlight(mode);
}
