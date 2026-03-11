/**
 * @module CodeBlock
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

/** Available code block visual variants. */
export const codeBlockVariants = ['default', 'outlined'] as const;

/** Union of valid code block variant values. */
export type CodeBlockVariant = (typeof codeBlockVariants)[number];

// ---------------------------------------------------------------------------
// Syntax highlighting
// ---------------------------------------------------------------------------

/**
 * A single syntax token within a highlighted line of code.
 */
export interface SyntaxToken {
  /** The text content of this token. */
  content: string;
  /** CSS color value. If omitted the token inherits the default code colour. */
  color?: string;
}

/**
 * A function that tokenises a code string into coloured spans per line.
 *
 * @remarks
 * The outer array represents lines; each inner array contains the tokens
 * within that line. Pass a function matching this signature to the CodeBlock
 * `highlighter` prop. Use {@link createShikiHighlighter} from
 * `@wisp-ui/react` for a ready-made Shiki-based implementation.
 */
export type SyntaxHighlighter = (
  code: string,
  language: string,
) => SyntaxToken[][];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link CodeBlock} component.
 *
 * @remarks
 * Renders a `<pre><code>` block with optional line numbers,
 * line highlighting, copy-to-clipboard button, and max-height scrolling.
 * Uses monospace font from the Wisp token system.
 */
export interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  /**
   * The code string to display.
   */
  code: string;

  /**
   * Language identifier shown in the header label and passed to the
   * {@link SyntaxHighlighter} when one is provided.
   */
  language?: string;

  /**
   * Optional syntax highlighter function. When provided, tokenises the code
   * string and renders coloured spans. When omitted, code renders as plain
   * monospace text (default behaviour).
   *
   * @see {@link SyntaxHighlighter}
   */
  highlighter?: SyntaxHighlighter;

  /**
   * When `true`, displays line numbers in a left gutter.
   * @default false
   */
  showLineNumbers?: boolean;

  /**
   * Array of 1-based line numbers to highlight with a subtle background tint.
   */
  highlightLines?: number[];

  /**
   * When `true`, shows a copy button in the top-right corner.
   * @default true
   */
  copyable?: boolean;

  /**
   * Maximum height before the code block becomes scrollable.
   */
  maxHeight?: number | string;

  /**
   * Visual variant.
   * @default 'default'
   */
  variant?: CodeBlockVariant;
}
