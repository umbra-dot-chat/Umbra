/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AspectRatio } from './AspectRatio';
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

describe('AspectRatio — rendering', () => {
  it('renders children', () => {
    render(
      <Dark>
        <AspectRatio>
          <span data-testid="child">Content</span>
        </AspectRatio>
      </Dark>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('forwards ref to the outer div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <AspectRatio ref={ref}>
          <span>Content</span>
        </AspectRatio>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// Ratio
// ---------------------------------------------------------------------------

describe('AspectRatio — ratio', () => {
  it('applies default ratio of 1 (paddingBottom = 100%)', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <AspectRatio ref={ref}>
          <span>Square</span>
        </AspectRatio>
      </Dark>,
    );
    expect(ref.current?.style.paddingBottom).toBe('100%');
  });

  it('applies ratio=16/9 (paddingBottom = 56.25%)', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <AspectRatio ref={ref} ratio={16 / 9}>
          <span>Widescreen</span>
        </AspectRatio>
      </Dark>,
    );
    expect(ref.current?.style.paddingBottom).toBe('56.25%');
  });

  it('applies ratio=4/3 (paddingBottom = 75%)', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <AspectRatio ref={ref} ratio={4 / 3}>
          <span>Classic</span>
        </AspectRatio>
      </Dark>,
    );
    expect(ref.current?.style.paddingBottom).toBe('75%');
  });

  it('sets position relative on the outer container', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <AspectRatio ref={ref}>
          <span>Content</span>
        </AspectRatio>
      </Dark>,
    );
    expect(ref.current?.style.position).toBe('relative');
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('AspectRatio — className', () => {
  it('passes className to the root element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <AspectRatio ref={ref} className="custom-class">
          <span>Content</span>
        </AspectRatio>
      </Dark>,
    );
    expect(ref.current).toHaveClass('custom-class');
  });
});

// ---------------------------------------------------------------------------
// style merge
// ---------------------------------------------------------------------------

describe('AspectRatio — style merge', () => {
  it('merges user style with container style', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <AspectRatio ref={ref} style={{ backgroundColor: 'red' }}>
          <span>Styled</span>
        </AspectRatio>
      </Dark>,
    );
    expect(ref.current?.style.backgroundColor).toBe('red');
    // Container styles should still be applied
    expect(ref.current?.style.position).toBe('relative');
    expect(ref.current?.style.width).toBe('100%');
  });

  it('user style can override container defaults', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <AspectRatio ref={ref} style={{ width: '50%' }}>
          <span>Override</span>
        </AspectRatio>
      </Dark>,
    );
    expect(ref.current?.style.width).toBe('50%');
  });
});
