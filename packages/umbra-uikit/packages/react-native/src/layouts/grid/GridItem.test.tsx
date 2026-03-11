/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GridItem } from './Grid';

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('GridItem — rendering', () => {
  it('renders children', () => {
    render(
      <GridItem>
        <span>Item content</span>
      </GridItem>,
    );
    expect(screen.getByText('Item content')).toBeInTheDocument();
  });

  it('renders without crashing when no children provided', () => {
    const { container } = render(<GridItem />);
    expect(container).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// ColSpan
// ---------------------------------------------------------------------------

describe('GridItem — colSpan', () => {
  it('accepts colSpan=1 without crashing', () => {
    render(
      <GridItem colSpan={1}>
        <span>Span 1</span>
      </GridItem>,
    );
    expect(screen.getByText('Span 1')).toBeInTheDocument();
  });

  it('accepts colSpan=2 without crashing', () => {
    render(
      <GridItem colSpan={2}>
        <span>Span 2</span>
      </GridItem>,
    );
    expect(screen.getByText('Span 2')).toBeInTheDocument();
  });

  it('accepts colSpan=3 without crashing', () => {
    render(
      <GridItem colSpan={3}>
        <span>Span 3</span>
      </GridItem>,
    );
    expect(screen.getByText('Span 3')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AlignSelf
// ---------------------------------------------------------------------------

describe('GridItem — alignSelf', () => {
  const alignments = ['flex-start', 'center', 'flex-end', 'stretch'] as const;

  alignments.forEach((align) => {
    it(`renders with alignSelf="${align}" without crashing`, () => {
      render(
        <GridItem alignSelf={align}>
          <span>{align}</span>
        </GridItem>,
      );
      expect(screen.getByText(align)).toBeInTheDocument();
    });
  });
});
