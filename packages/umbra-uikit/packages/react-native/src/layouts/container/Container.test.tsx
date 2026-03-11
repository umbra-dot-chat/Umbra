/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Container } from './Container';
import type { ContainerSize } from './Container';

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Container — rendering', () => {
  it('renders children', () => {
    render(
      <Container>
        <span>Content</span>
      </Container>,
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders without crashing when no children provided', () => {
    const { container } = render(<Container />);
    expect(container).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

describe('Container — size', () => {
  const sizeMap: Record<ContainerSize, number> = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  };

  (Object.keys(sizeMap) as ContainerSize[]).forEach((size) => {
    it(`applies maxWidth for size="${size}"`, () => {
      const { container } = render(
        <Container size={size}>
          <span>{size}</span>
        </Container>,
      );
      const el = container.firstChild as HTMLElement;
      expect(el).toBeTruthy();
      expect(el.style.maxWidth).toBe(`${sizeMap[size]}px`);
    });
  });

  it('defaults to size="lg" (maxWidth 1024px)', () => {
    const { container } = render(
      <Container>
        <span>Default</span>
      </Container>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.maxWidth).toBe('1024px');
  });
});

// ---------------------------------------------------------------------------
// Center
// ---------------------------------------------------------------------------

describe('Container — center', () => {
  it('applies alignSelf center by default', () => {
    const { container } = render(
      <Container>
        <span>Centered</span>
      </Container>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.alignSelf).toBe('center');
  });

  it('does not apply alignSelf center when center=false', () => {
    const { container } = render(
      <Container center={false}>
        <span>Not centered</span>
      </Container>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.alignSelf).not.toBe('center');
  });
});
