/**
 * CodeBlock primitive -- public API surface.
 *
 * @module primitives/code-block
 */

export { CodeBlock } from './CodeBlock';
export type { CodeBlockProps, CodeBlockVariant, SyntaxToken, SyntaxHighlighter } from '@coexist/wisp-core/types/CodeBlock.types';
export { codeBlockVariants } from '@coexist/wisp-core/types/CodeBlock.types';
export { createShikiHighlighter } from './shiki-adapter';
export type { ShikiHighlighterOptions, ShikiHighlighterResult } from './shiki-adapter';
