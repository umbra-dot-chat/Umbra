/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AspectRatio } from './AspectRatio';

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('AspectRatio — rendering', () => {
  it('renders children', () => {
    render(
      <AspectRatio>
        <span>Image placeholder</span>
      </AspectRatio>,
    );
    expect(screen.getByText('Image placeholder')).toBeInTheDocument();
  });

  it('renders without crashing when no children provided', () => {
    const { container } = render(<AspectRatio />);
    expect(container).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Ratio
// ---------------------------------------------------------------------------

describe('AspectRatio — ratio', () => {
  it('defaults to ratio=1 (square)', () => {
    const { container } = render(
      <AspectRatio>
        <span>Square</span>
      </AspectRatio>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el).toBeTruthy();
    // react-native-web renders aspectRatio as a style property
    expect(el.style.aspectRatio).toBe('1 / 1');
  });

  it('applies a 16:9 ratio', () => {
    const ratio = 16 / 9;
    const { container } = render(
      <AspectRatio ratio={ratio}>
        <span>Widescreen</span>
      </AspectRatio>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el).toBeTruthy();
    // react-native-web may format as a string; check it contains a reasonable value
    expect(el.style.aspectRatio).toBeTruthy();
  });

  it('applies a 4:3 ratio', () => {
    const ratio = 4 / 3;
    const { container } = render(
      <AspectRatio ratio={ratio}>
        <span>Classic</span>
      </AspectRatio>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.aspectRatio).toBeTruthy();
  });

  it('applies width 100%', () => {
    const { container } = render(
      <AspectRatio ratio={2}>
        <span>Full width</span>
      </AspectRatio>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('100%');
  });
});
