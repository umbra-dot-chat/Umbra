/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CodeBlock } from './CodeBlock';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('CodeBlock — rendering', () => {
  it('renders code content', () => {
    render(
      <Dark>
        <CodeBlock code="const x = 42;" />
      </Dark>,
    );
    expect(screen.getByText('const x = 42;')).toBeInTheDocument();
  });

  it('renders inside a <pre> element', () => {
    const { container } = render(
      <Dark>
        <CodeBlock code="hello" />
      </Dark>,
    );
    expect(container.querySelector('pre')).toBeInTheDocument();
  });

  it('renders inside a <code> element', () => {
    const { container } = render(
      <Dark>
        <CodeBlock code="hello" />
      </Dark>,
    );
    expect(container.querySelector('code')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Language label
// ---------------------------------------------------------------------------

describe('CodeBlock — language', () => {
  it('renders language label when provided', () => {
    render(
      <Dark>
        <CodeBlock code="const x = 1;" language="TypeScript" />
      </Dark>,
    );
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('CodeBlock — variants', () => {
  (['default', 'outlined'] as const).forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      render(
        <Dark>
          <CodeBlock code="test" variant={variant} />
        </Dark>,
      );
      expect(screen.getByText('test')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Line numbers
// ---------------------------------------------------------------------------

describe('CodeBlock — line numbers', () => {
  it('shows line numbers when showLineNumbers is true', () => {
    render(
      <Dark>
        <CodeBlock code={'line1\nline2\nline3'} showLineNumbers />
      </Dark>,
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not show line numbers by default', () => {
    render(
      <Dark>
        <CodeBlock code={'line1\nline2'} />
      </Dark>,
    );
    // Line numbers should not be present
    // The text "1" would exist as part of "line1", so check there's no standalone "1"
    const spans = screen.queryAllByText('1');
    // Should not have a standalone "1" span that is a line number
    expect(spans.every((el) => el.textContent !== '1' || el.closest('code'))).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Copy button
// ---------------------------------------------------------------------------

describe('CodeBlock — copy button', () => {
  it('renders copy button by default', () => {
    render(
      <Dark>
        <CodeBlock code="test" />
      </Dark>,
    );
    expect(screen.getByLabelText('Copy code')).toBeInTheDocument();
  });

  it('hides copy button when copyable is false', () => {
    render(
      <Dark>
        <CodeBlock code="test" copyable={false} language="JS" />
      </Dark>,
    );
    expect(screen.queryByLabelText('Copy code')).not.toBeInTheDocument();
  });

  it('calls clipboard API when copy button is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(
      <Dark>
        <CodeBlock code="const x = 1;" />
      </Dark>,
    );

    fireEvent.click(screen.getByLabelText('Copy code'));
    expect(writeText).toHaveBeenCalledWith('const x = 1;');
  });
});

// ---------------------------------------------------------------------------
// Syntax highlighting
// ---------------------------------------------------------------------------

describe('CodeBlock — syntax highlighting', () => {
  it('renders plain text when no highlighter is provided', () => {
    const { container } = render(
      <Dark>
        <CodeBlock code="const x = 1;" language="TypeScript" />
      </Dark>,
    );
    // The text should be present as-is, without extra coloured spans
    const codeEl = container.querySelector('code')!;
    const innerSpans = codeEl.querySelectorAll('span[style]');
    // Line wrapper spans exist, but none should have a color style
    const coloured = Array.from(innerSpans).filter((s) => (s as HTMLElement).style.color);
    expect(coloured.length).toBe(0);
  });

  it('renders coloured spans when highlighter is provided', () => {
    const mockHighlighter = vi.fn().mockReturnValue([
      [
        { content: 'const', color: '#ff0000' },
        { content: ' x = ', color: undefined },
        { content: '1', color: '#00ff00' },
        { content: ';' },
      ],
    ]);

    const { container } = render(
      <Dark>
        <CodeBlock code="const x = 1;" language="TypeScript" highlighter={mockHighlighter} />
      </Dark>,
    );

    const codeEl = container.querySelector('code')!;
    const colouredSpans = Array.from(codeEl.querySelectorAll('span')).filter(
      (s) => (s as HTMLElement).style.color,
    );
    expect(colouredSpans.length).toBeGreaterThanOrEqual(2);
    expect(colouredSpans[0].style.color).toBe('rgb(255, 0, 0)'); // #ff0000
  });

  it('passes code and language to the highlighter function', () => {
    const mockHighlighter = vi.fn().mockReturnValue([[{ content: 'test' }]]);

    render(
      <Dark>
        <CodeBlock code="test" language="css" highlighter={mockHighlighter} />
      </Dark>,
    );

    expect(mockHighlighter).toHaveBeenCalledWith('test', 'css');
  });

  it('passes empty string for language when not specified', () => {
    const mockHighlighter = vi.fn().mockReturnValue([[{ content: 'test' }]]);

    render(
      <Dark>
        <CodeBlock code="test" highlighter={mockHighlighter} />
      </Dark>,
    );

    expect(mockHighlighter).toHaveBeenCalledWith('test', '');
  });

  it('composes line numbers with syntax highlighting', () => {
    const mockHighlighter = vi.fn().mockReturnValue([
      [{ content: 'line1', color: '#ff0000' }],
      [{ content: 'line2', color: '#00ff00' }],
    ]);

    render(
      <Dark>
        <CodeBlock
          code={'line1\nline2'}
          language="tsx"
          highlighter={mockHighlighter}
          showLineNumbers
        />
      </Dark>,
    );

    // Line numbers should still render
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('CodeBlock — className', () => {
  it('passes className through to the wrapper', () => {
    const { container } = render(
      <Dark>
        <CodeBlock code="test" className="custom-code" />
      </Dark>,
    );
    expect(container.querySelector('.custom-code')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('CodeBlock — ref forwarding', () => {
  it('forwards ref to the <pre> element', () => {
    const ref = React.createRef<HTMLPreElement>();
    render(
      <Dark>
        <CodeBlock ref={ref} code="test" />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLPreElement);
  });
});
