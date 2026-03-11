/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Card } from './Card';
import { cardVariants, cardPaddings, cardRadii } from '@coexist/wisp-core/types/Card.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

const Light = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="light">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Card — rendering', () => {
  it('renders children text', () => {
    render(<Dark><Card>Card content</Card></Dark>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders as a div by default', () => {
    render(<Dark><Card>Default div</Card></Dark>);
    const el = screen.getByText('Default div');
    expect(el.closest('div')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('Card — variants', () => {
  cardVariants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      render(<Dark><Card variant={variant}>{variant}</Card></Dark>);
      expect(screen.getByText(variant)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Padding
// ---------------------------------------------------------------------------

describe('Card — padding', () => {
  cardPaddings.forEach((padding) => {
    it(`renders padding="${padding}" without crashing`, () => {
      render(<Dark><Card padding={padding}>{padding}</Card></Dark>);
      expect(screen.getByText(padding)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Radius
// ---------------------------------------------------------------------------

describe('Card — radius', () => {
  cardRadii.forEach((radius) => {
    it(`renders radius="${radius}" without crashing`, () => {
      render(<Dark><Card radius={radius}>{radius}</Card></Dark>);
      expect(screen.getByText(radius)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Interactive + onClick
// ---------------------------------------------------------------------------

describe('Card — interactive + onClick', () => {
  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Dark><Card interactive onClick={handleClick}>Clickable</Card></Dark>);
    fireEvent.click(screen.getByText('Clickable'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disabled card prevents onClick from firing', () => {
    const handleClick = vi.fn();
    render(
      <Dark>
        <Card interactive disabled onClick={handleClick}>
          Disabled card
        </Card>
      </Dark>,
    );
    fireEvent.click(screen.getByText('Disabled card'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('Card — disabled', () => {
  it('sets aria-disabled when disabled', () => {
    render(<Dark><Card disabled>Disabled</Card></Dark>);
    const el = screen.getByText('Disabled').closest('div');
    expect(el).toHaveAttribute('aria-disabled');
  });

  it('does not set aria-disabled when not disabled', () => {
    render(<Dark><Card>Enabled</Card></Dark>);
    const el = screen.getByText('Enabled').closest('div');
    expect(el).not.toHaveAttribute('aria-disabled');
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('Card — skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(<Dark><Card skeleton>Hidden</Card></Dark>);
    const el = container.querySelector('[data-testid="card-skeleton"]');
    expect(el).toBeTruthy();
    expect(el).toHaveAttribute('aria-hidden');
  });

  it('has data-testid="card-skeleton"', () => {
    render(<Dark><Card skeleton>Hidden</Card></Dark>);
    expect(screen.getByTestId('card-skeleton')).toBeInTheDocument();
  });

  it('does not render children text when skeleton', () => {
    render(<Dark><Card skeleton>Should not appear</Card></Dark>);
    expect(screen.queryByText('Should not appear')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Polymorphic
// ---------------------------------------------------------------------------

describe('Card — polymorphic', () => {
  it('renders as a section when as="section"', () => {
    render(<Dark><Card as="section">Section card</Card></Dark>);
    const el = screen.getByText('Section card');
    expect(el.closest('section')).toBeTruthy();
  });

  it('renders as an article when as="article"', () => {
    render(<Dark><Card as="article">Article card</Card></Dark>);
    const el = screen.getByText('Article card');
    expect(el.closest('article')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('Card — className passthrough', () => {
  it('passes className through to the root element', () => {
    render(<Dark><Card className="custom-class">Styled</Card></Dark>);
    const el = screen.getByText('Styled').closest('div');
    expect(el).toHaveClass('custom-class');
  });
});
