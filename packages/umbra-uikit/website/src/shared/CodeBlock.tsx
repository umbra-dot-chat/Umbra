import React, { useState, useCallback } from 'react';
import { useTheme } from '@wisp-ui/react';
import { Copy, Check } from 'lucide-react';
import { useShikiHighlighter } from './useShikiHighlighter';

interface CodeBlockProps {
  code: string;
  language?: string;
  style?: React.CSSProperties;
}

/**
 * Website-specific CodeBlock with Shiki syntax highlighting.
 *
 * Uses the shared {@link useShikiHighlighter} hook to lazily load Shiki
 * once, then renders highlighted code via coloured spans. Falls back to
 * plain text while Shiki is loading.
 */
export function CodeBlock({ code, language = 'tsx', style: userStyle }: CodeBlockProps) {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const highlighter = useShikiHighlighter(mode as 'dark' | 'light');

  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  // Tokenise code when Shiki is ready; fall back to plain lines
  const lines = code.split('\n');
  const tokenisedLines = highlighter ? highlighter(code, language) : null;

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.03)',
        borderRadius: 10,
        padding: '16px 20px',
        overflow: 'auto',
        border: isDark ? undefined : '1px solid rgba(0, 0, 0, 0.08)',
        ...userStyle,
      }}
    >
      {/* Copy button */}
      <div
        onClick={handleCopy}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          cursor: 'pointer',
          padding: 6,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
        }}
        title="Copy to clipboard"
      >
        {copied ? (
          <Check size={14} color={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)'} />
        ) : (
          <Copy size={14} color={isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.35)'} />
        )}
      </div>

      <pre
        style={{
          margin: 0,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          lineHeight: 1.6,
          color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.9)',
          whiteSpace: 'pre',
          overflowX: 'auto',
        }}
      >
        {lines.map((line, lineIdx) => {
          const tokens = tokenisedLines?.[lineIdx];
          return (
            <React.Fragment key={lineIdx}>
              {lineIdx > 0 && '\n'}
              {tokens
                ? tokens.map((token, tokenIdx) => (
                    <span key={tokenIdx} style={token.color ? { color: token.color } : undefined}>
                      {token.content}
                    </span>
                  ))
                : line}
            </React.Fragment>
          );
        })}
      </pre>
    </div>
  );
}
