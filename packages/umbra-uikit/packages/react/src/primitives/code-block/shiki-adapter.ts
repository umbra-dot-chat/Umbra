/**
 * @module code-block/shiki-adapter
 * @description Shiki-based syntax highlighter adapter for the CodeBlock primitive.
 *
 * Provides {@link createShikiHighlighter}, an async factory that creates a
 * {@link SyntaxHighlighter} compatible with the CodeBlock `highlighter` prop.
 *
 * `shiki` is an **optional peer dependency** — consumers who never import this
 * module pay zero bundle cost.
 */
import type { SyntaxHighlighter, SyntaxToken } from '@coexist/wisp-core/types/CodeBlock.types';
import type { HighlighterGeneric, ThemedToken } from 'shiki';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Configuration for {@link createShikiHighlighter}.
 */
export interface ShikiHighlighterOptions {
  /**
   * Map of theme keys to Shiki theme names.
   *
   * @example
   * ```ts
   * { dark: 'github-dark', light: 'github-light' }
   * ```
   */
  themes: Record<string, string>;

  /**
   * Language IDs to register with the highlighter.
   *
   * @example
   * ```ts
   * ['typescript', 'tsx', 'css', 'json', 'bash']
   * ```
   */
  langs: string[];
}

/**
 * Return type of {@link createShikiHighlighter}.
 */
export interface ShikiHighlighterResult {
  /**
   * Returns a {@link SyntaxHighlighter} function bound to the given theme key.
   * Pass the result directly to `<CodeBlock highlighter={...} />`.
   *
   * @param themeKey - One of the keys provided in {@link ShikiHighlighterOptions.themes}.
   */
  highlight: (themeKey: string) => SyntaxHighlighter;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a Shiki-based syntax highlighter compatible with the CodeBlock
 * `highlighter` prop.
 *
 * @remarks
 * Uses a dynamic `import('shiki')` so the Shiki bundle is only loaded when
 * this function is actually called. The returned object caches the
 * highlighter instance — call `highlight(themeKey)` to get a
 * {@link SyntaxHighlighter} for a specific theme.
 *
 * @example
 * ```tsx
 * const shiki = await createShikiHighlighter({
 *   themes: { dark: 'github-dark', light: 'github-light' },
 *   langs: ['typescript', 'tsx', 'css', 'json', 'bash'],
 * });
 *
 * const { mode } = useTheme();
 * <CodeBlock code={code} language="tsx" highlighter={shiki.highlight(mode)} />
 * ```
 */
export async function createShikiHighlighter(
  options: ShikiHighlighterOptions,
): Promise<ShikiHighlighterResult> {
  // Dynamic import — tree-shaken when unused
  const { createHighlighter } = await import('shiki');

  const highlighter = await createHighlighter({
    themes: Object.values(options.themes),
    langs: options.langs,
  });

  const themeMap = options.themes;

  // Cache bound highlighters per theme key to preserve referential equality
  const cache = new Map<string, SyntaxHighlighter>();

  return {
    highlight(themeKey: string): SyntaxHighlighter {
      const cached = cache.get(themeKey);
      if (cached) return cached;

      const themeName = themeMap[themeKey];
      if (!themeName) {
        throw new Error(
          `[Wisp] Unknown theme key "${themeKey}". Available: ${Object.keys(themeMap).join(', ')}`,
        );
      }

      const fn: SyntaxHighlighter = (code: string, language: string): SyntaxToken[][] => {
        // Fall back to 'text' for unknown languages to avoid Shiki errors
        let lang = language;
        try {
          highlighter.getLanguage(lang);
        } catch {
          lang = 'text';
        }

        const result = highlighter.codeToTokens(code, {
          lang: lang as never,
          theme: themeName,
        });

        return result.tokens.map((line: ThemedToken[]) =>
          line.map((token: ThemedToken) => ({
            content: token.content,
            color: token.color ?? undefined,
          })),
        );
      };

      cache.set(themeKey, fn);
      return fn;
    },
  };
}
