/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CopyButton } from './CopyButton';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('CopyButton — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <CopyButton value="hello" />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders text content when label is provided', () => {
    render(
      <Wrapper>
        <CopyButton value="hello" label="Copy" />
      </Wrapper>,
    );
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('does not render text when label is omitted', () => {
    const { container } = render(
      <Wrapper>
        <CopyButton value="hello" />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
    // Without a label, only the icon is rendered
    expect(screen.queryByText('Copy')).toBeNull();
  });

  it('has button accessibility role', () => {
    const { container } = render(
      <Wrapper>
        <CopyButton value="hello" />
      </Wrapper>,
    );
    const button = container.querySelector('[role="button"]');
    expect(button).toBeTruthy();
  });

  it('has correct displayName', () => {
    expect(CopyButton.displayName).toBe('CopyButton');
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('CopyButton — variants', () => {
  const variants = ['outline', 'ghost', 'minimal'] as const;

  variants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      const { container } = render(
        <Wrapper>
          <CopyButton value="test" label="Copy" variant={variant} />
        </Wrapper>,
      );
      expect(container).toBeTruthy();
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });
  });
});
