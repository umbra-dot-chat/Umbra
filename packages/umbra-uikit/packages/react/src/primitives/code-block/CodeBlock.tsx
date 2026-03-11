/**
 * @module CodeBlock
 */
import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type { CodeBlockProps } from '@coexist/wisp-core/types/CodeBlock.types';
import {
  buildCodeBlockWrapperStyle,
  buildCodeBlockHeaderStyle,
  buildCodeBlockPreStyle,
  buildCodeBlockLineStyle,
  buildCodeBlockLineNumberStyle,
  buildCodeBlockCopyButtonStyle,
} from '@coexist/wisp-core/styles/CodeBlock.styles';
import { useTheme } from '../../providers';
import { Text } from '../text';

/**
 * CodeBlock — Monospace code display primitive for the Wisp design system.
 *
 * @remarks
 * Renders a `<pre><code>` block with optional line numbers, line highlighting,
 * copy-to-clipboard button, and max-height scrolling.
 *
 * - Two variants: `default` (dark surface) and `outlined` (transparent + border).
 * - Optional syntax highlighting via the `highlighter` prop (library-agnostic).
 * - Copy button uses the Clipboard API.
 *
 * @module primitives/code-block
 *
 * @example
 * ```tsx
 * <CodeBlock code="const x = 42;" language="TypeScript" copyable />
 *
 * <CodeBlock
 *   code={multiLineCode}
 *   showLineNumbers
 *   highlightLines={[2, 5]}
 *   maxHeight={300}
 * />
 * ```
 */
export const CodeBlock = forwardRef<HTMLPreElement, CodeBlockProps>(
  function CodeBlock(
    {
      code,
      language,
      highlighter,
      showLineNumbers = false,
      highlightLines,
      copyable = true,
      maxHeight,
      variant = 'default',
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
  const themeColors = theme.colors;
    const [copied, setCopied] = useState(false);

    const highlightSet = useMemo(
      () => new Set(highlightLines ?? []),
      [highlightLines],
    );

    // Syntax highlighting — tokenise code when a highlighter is provided
    const tokenisedLines = useMemo(
      () => (highlighter ? highlighter(code, language ?? '') : null),
      [highlighter, code, language],
    );

    const wrapperStyle = useMemo(
      () => buildCodeBlockWrapperStyle(variant, theme, maxHeight),
      [variant, theme, maxHeight],
    );

    const headerStyle = useMemo(
      () => buildCodeBlockHeaderStyle(variant, theme),
      [variant, theme],
    );

    const preStyle = useMemo(
      () => buildCodeBlockPreStyle(theme, maxHeight),
      [theme, maxHeight],
    );

    const lineNumberStyle = useMemo(
      () => buildCodeBlockLineNumberStyle(variant, theme),
      [variant, theme],
    );

    const copyBtnStyle = useMemo(
      () => buildCodeBlockCopyButtonStyle(variant, theme),
      [variant, theme],
    );

    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback — silent fail
      }
    }, [code]);

    const lines = code.split('\n');
    const showHeader = language || copyable;

    return (
      <div style={{ ...wrapperStyle, ...userStyle }} className={className}>
        {showHeader && (
          <div style={headerStyle}>
            <Text color="inherit">{language ?? ''}</Text>
            {copyable && (
              <button
                type="button"
                onClick={handleCopy}
                style={copyBtnStyle}
                aria-label="Copy code"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            )}
          </div>
        )}
        <pre ref={ref} style={preStyle} {...rest}>
          <code>
            {lines.map((line: string, i: number) => {
              const lineNum = i + 1;
              const isHighlighted = highlightSet.has(lineNum);
              const lineStyle = buildCodeBlockLineStyle(isHighlighted, variant, theme);

              return (
                <div key={i} style={lineStyle}>
                  {showLineNumbers && (
                    <Text color="inherit" style={lineNumberStyle}>{lineNum}</Text>
                  )}
                  <span style={{ flex: 1 }}>
                    {tokenisedLines && tokenisedLines[i]
                      ? tokenisedLines[i].map((token, j) => (
                          <span key={j} style={token.color ? { color: token.color } : undefined}>
                            {token.content}
                          </span>
                        ))
                      : (line || '\n')}
                  </span>
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    );
  },
);

CodeBlock.displayName = 'CodeBlock';
