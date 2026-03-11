/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScrollArea } from './ScrollArea';
import type { ScrollAreaDirection } from './ScrollArea';

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ScrollArea — rendering', () => {
  it('renders children', () => {
    render(
      <ScrollArea>
        <span>Scrollable content</span>
      </ScrollArea>,
    );
    expect(screen.getByText('Scrollable content')).toBeInTheDocument();
  });

  it('renders without crashing when no children provided', () => {
    const { container } = render(<ScrollArea />);
    expect(container).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Direction
// ---------------------------------------------------------------------------

describe('ScrollArea — direction', () => {
  const directions: ScrollAreaDirection[] = ['vertical', 'horizontal', 'both'];

  directions.forEach((direction) => {
    it(`renders with direction="${direction}" without crashing`, () => {
      render(
        <ScrollArea direction={direction}>
          <span>{direction}</span>
        </ScrollArea>,
      );
      expect(screen.getByText(direction)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Constraints
// ---------------------------------------------------------------------------

describe('ScrollArea — constraints', () => {
  it('applies maxHeight style', () => {
    const { container } = render(
      <ScrollArea maxHeight={300}>
        <span>Constrained</span>
      </ScrollArea>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.maxHeight).toBe('300px');
  });

  it('applies maxWidth style', () => {
    const { container } = render(
      <ScrollArea maxWidth={500}>
        <span>Constrained</span>
      </ScrollArea>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.maxWidth).toBe('500px');
  });
});
