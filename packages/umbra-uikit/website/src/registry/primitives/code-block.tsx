import React from 'react';
import { CodeBlock } from '@wisp-ui/react';
import type { SyntaxHighlighter, SyntaxToken } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const sampleCode = `import { Button, Card, Text } from '@wisp-ui/react';

function App() {
  return (
    <Card variant="elevated" padding="lg">
      <Text size="lg" weight="bold">
        Hello Wisp
      </Text>
      <Button variant="primary" size="md">
        Get Started
      </Button>
    </Card>
  );
}`;

const shortCode = `const greeting = 'Hello, Wisp!';
console.log(greeting);`;

// ---------------------------------------------------------------------------
// Simple keyword highlighter for demo purposes (no Shiki dependency)
// ---------------------------------------------------------------------------

const KEYWORD_COLOR = '#C586C0';
const STRING_COLOR = '#CE9178';
const COMMENT_COLOR = '#6A9955';
const TAG_COLOR = '#569CD6';
const ATTR_COLOR = '#9CDCFE';
const FUNC_COLOR = '#DCDCAA';
const IMPORT_COLOR = '#C586C0';
const NUMBER_COLOR = '#B5CEA8';

const KEYWORDS = new Set([
  'import', 'export', 'from', 'const', 'let', 'var', 'function', 'return',
  'if', 'else', 'for', 'while', 'class', 'new', 'this', 'typeof', 'true', 'false',
]);

const demoHighlighter: SyntaxHighlighter = (code: string): SyntaxToken[][] => {
  return code.split('\n').map((line) => {
    const tokens: SyntaxToken[] = [];
    let remaining = line;

    while (remaining.length > 0) {
      // Comments
      const commentMatch = remaining.match(/^(\/\/.*)/);
      if (commentMatch) {
        tokens.push({ content: commentMatch[1], color: COMMENT_COLOR });
        remaining = remaining.slice(commentMatch[1].length);
        continue;
      }

      // Strings (single or double quoted)
      const stringMatch = remaining.match(/^(["'`](?:[^"'`\\]|\\.)*["'`])/);
      if (stringMatch) {
        tokens.push({ content: stringMatch[1], color: STRING_COLOR });
        remaining = remaining.slice(stringMatch[1].length);
        continue;
      }

      // JSX tags (opening/closing)
      const tagMatch = remaining.match(/^(<\/?[A-Z][A-Za-z]*)/);
      if (tagMatch) {
        tokens.push({ content: tagMatch[1], color: TAG_COLOR });
        remaining = remaining.slice(tagMatch[1].length);
        continue;
      }

      // JSX closing > or />
      const closeTagMatch = remaining.match(/^(\s*\/?>)/);
      if (closeTagMatch) {
        tokens.push({ content: closeTagMatch[1], color: TAG_COLOR });
        remaining = remaining.slice(closeTagMatch[1].length);
        continue;
      }

      // JSX attribute names (word followed by =)
      const attrMatch = remaining.match(/^([a-zA-Z][\w-]*)(?==)/);
      if (attrMatch) {
        tokens.push({ content: attrMatch[1], color: ATTR_COLOR });
        remaining = remaining.slice(attrMatch[1].length);
        continue;
      }

      // Numbers
      const numMatch = remaining.match(/^(\d+(?:\.\d+)?)/);
      if (numMatch) {
        tokens.push({ content: numMatch[1], color: NUMBER_COLOR });
        remaining = remaining.slice(numMatch[1].length);
        continue;
      }

      // Keywords and identifiers
      const wordMatch = remaining.match(/^([a-zA-Z_$][\w$]*)/);
      if (wordMatch) {
        const word = wordMatch[1];
        if (KEYWORDS.has(word)) {
          tokens.push({ content: word, color: KEYWORD_COLOR });
        } else if (remaining.slice(word.length).match(/^\s*\(/)) {
          tokens.push({ content: word, color: FUNC_COLOR });
        } else {
          tokens.push({ content: word });
        }
        remaining = remaining.slice(word.length);
        continue;
      }

      // Braces and operators — default color
      tokens.push({ content: remaining[0] });
      remaining = remaining.slice(1);
    }

    return tokens;
  });
};

export const codeBlockEntry: ComponentEntry = {
  slug: 'code-block',
  name: 'CodeBlock',
  category: 'primitives',
  subcategory: 'Text & Typography',
  description:
    'Monospace code display with optional syntax highlighting, line numbers, line highlighting, copy-to-clipboard, and max-height scrolling. Pass a SyntaxHighlighter function to enable coloured tokens. Two variants: default (dark surface) and outlined.',
  variantCount: 2,
  keywords: ['code', 'codeblock', 'pre', 'snippet', 'source', 'mono'],

  cardPreview: (
    <CodeBlock code={shortCode} language="JavaScript" copyable={false} highlighter={demoHighlighter} />
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <CodeBlock code={sampleCode} language="TypeScript" highlighter={demoHighlighter} />
      ),
      code: `import { CodeBlock } from '@wisp-ui/react';

<CodeBlock code={myCode} language="TypeScript" />`,
      rnCode: `// Not yet available in React Native`,
    },
    {
      title: 'Syntax Highlighting',
      render: (
        <CodeBlock
          code={sampleCode}
          language="TypeScript"
          showLineNumbers
          highlighter={demoHighlighter}
        />
      ),
      code: `import { CodeBlock, createShikiHighlighter } from '@wisp-ui/react';

// Create a Shiki highlighter (async, do once at app level)
const shiki = await createShikiHighlighter({
  themes: { dark: 'github-dark', light: 'github-light' },
  langs: ['typescript', 'tsx'],
});

// Use in your component
const { mode } = useTheme();
<CodeBlock
  code={myCode}
  language="typescript"
  showLineNumbers
  highlighter={shiki.highlight(mode)}
/>`,
      rnCode: `// Not yet available in React Native`,
    },
    {
      title: 'Outlined',
      render: (
        <CodeBlock code={sampleCode} language="TypeScript" variant="outlined" />
      ),
      code: `<CodeBlock code={myCode} language="TypeScript" variant="outlined" />`,
      rnCode: `// Not yet available in React Native`,
    },
    {
      title: 'Line Numbers',
      render: (
        <CodeBlock code={sampleCode} language="TypeScript" showLineNumbers />
      ),
      code: `<CodeBlock code={myCode} language="TypeScript" showLineNumbers />`,
      rnCode: `// Not yet available in React Native`,
    },
    {
      title: 'Highlighted Lines',
      render: (
        <CodeBlock
          code={sampleCode}
          language="TypeScript"
          showLineNumbers
          highlightLines={[3, 4, 5, 6, 7, 8]}
          highlighter={demoHighlighter}
        />
      ),
      code: `<CodeBlock
  code={myCode}
  showLineNumbers
  highlightLines={[3, 4, 5, 6, 7, 8]}
/>`,
      rnCode: `// Not yet available in React Native`,
    },
    {
      title: 'Max Height',
      render: (
        <CodeBlock
          code={sampleCode}
          language="TypeScript"
          showLineNumbers
          maxHeight={120}
        />
      ),
      code: `<CodeBlock code={myCode} showLineNumbers maxHeight={120} />`,
      rnCode: `// Not yet available in React Native`,
    },
  ],

  props: [
    { name: 'code', type: 'string', description: 'The code string to display.' },
    { name: 'language', type: 'string', description: 'Language identifier shown in the header and passed to the highlighter.' },
    { name: 'highlighter', type: 'SyntaxHighlighter', description: 'Optional function that tokenises code for syntax highlighting. Use createShikiHighlighter for a ready-made Shiki adapter.' },
    { name: 'showLineNumbers', type: 'boolean', default: 'false', description: 'Displays line numbers in a left gutter.' },
    { name: 'highlightLines', type: 'number[]', description: 'Array of 1-based line numbers to highlight.' },
    { name: 'copyable', type: 'boolean', default: 'true', description: 'Shows a copy-to-clipboard button.' },
    { name: 'maxHeight', type: 'number | string', description: 'Maximum height before scrolling.' },
    { name: 'variant', type: "'default' | 'outlined'", default: "'default'", description: 'Visual style variant.' },
  ],
};
