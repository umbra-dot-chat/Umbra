/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Sticky } from './Sticky';
import { stickyEdges } from '@coexist/wisp-core/types/Sticky.types';
import { WispProvider } from '../../providers';
import { zIndex as zIndexScale } from '@coexist/wisp-core/tokens/z-index';

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

describe('Sticky — rendering', () => {
  it('renders children', () => {
    render(
      <Dark>
        <Sticky>
          <span data-testid="child">Hello</span>
        </Sticky>
      </Dark>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders as a div by default', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Sticky ref={ref}>Content</Sticky>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('renders in light mode without crashing', () => {
    render(
      <Light>
        <Sticky data-testid="sticky-light">Content</Sticky>
      </Light>,
    );
    expect(screen.getByTestId('sticky-light')).toBeInTheDocument();
  });

  it('has displayName "Sticky"', () => {
    expect(Sticky.displayName).toBe('Sticky');
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('Sticky — ref forwarding', () => {
  it('forwards ref to the root element', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Sticky ref={ref}>Content</Sticky>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards ref when using a custom "as" element', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Sticky ref={ref} as="nav">
          Content
        </Sticky>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe('NAV');
  });
});

// ---------------------------------------------------------------------------
// Position sticky
// ---------------------------------------------------------------------------

describe('Sticky — position sticky', () => {
  it('applies position: sticky', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Sticky ref={ref}>Content</Sticky>
      </Dark>,
    );
    expect(ref.current?.style.position).toBe('sticky');
  });
});

// ---------------------------------------------------------------------------
// Edge prop
// ---------------------------------------------------------------------------

describe('Sticky — edge', () => {
  it('defaults to top edge with offset 0', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Sticky ref={ref}>Content</Sticky>
      </Dark>,
    );
    expect(ref.current?.style.top).toBe('0px');
  });

  it('applies top edge explicitly', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Sticky ref={ref} edge="top">
          Content
        </Sticky>
      </Dark>,
    );
    expect(ref.current?.style.top).toBe('0px');
  });

  it('applies bottom edge', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Sticky ref={ref} edge="bottom">
          Content
        </Sticky>
      </Dark>,
    );
    expect(ref.current?.style.bottom).toBe('0px');
  });

  it('exports stickyEdges constant with top and bottom', () => {
    expect(stickyEdges).toContain('top');
    expect(stickyEdges).toContain('bottom');
    expect(stickyEdges).toHaveLength(2);
  });

  stickyEdges.forEach((edge) => {
    it(`renders edge="${edge}" without crashing`, () => {
      render(
        <Dark>
          <Sticky edge={edge} data-testid={`sticky-${edge}`}>
            Content
          </Sticky>
        </Dark>,
      );
      expect(screen.getByTestId(`sticky-${edge}`)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Offset prop
// ---------------------------------------------------------------------------

describe('Sticky — offset', () => {
  it('defaults offset to 0', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Sticky ref={ref}>Content</Sticky>
      </Dark>,
    );
    expect(ref.current?.style.top).toBe('0px');
  });

  it('applies a custom top offset', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Sticky ref={ref} edge="top" offset={64}>
          Content
        </Sticky>
      </Dark>,
    );
    expect(ref.current?.style.top).toBe('64px');
  });

  it('applies a custom bottom offset', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Sticky ref={ref} edge="bottom" offset={32}>
          Content
        </Sticky>
      </Dark>,
    );
    expect(ref.current?.style.bottom).toBe('32px');
  });
});

// ---------------------------------------------------------------------------
// zIndex prop
// ---------------------------------------------------------------------------

describe('Sticky — zIndex', () => {
  it('defaults to the "sticky" z-index token (1100)', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Sticky ref={ref}>Content</Sticky>
      </Dark>,
    );
    expect(ref.current?.style.zIndex).toBe(String(zIndexScale.sticky));
  });

  it('applies a named zIndex token', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Sticky ref={ref} zIndex="overlay">
          Content
        </Sticky>
      </Dark>,
    );
    expect(ref.current?.style.zIndex).toBe(String(zIndexScale.overlay));
  });

  it('applies a custom zIndexValue (overrides zIndex token)', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Sticky ref={ref} zIndex="overlay" zIndexValue={9999}>
          Content
        </Sticky>
      </Dark>,
    );
    expect(ref.current?.style.zIndex).toBe('9999');
  });

  it('applies zIndexValue when zIndex token is not set', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Sticky ref={ref} zIndexValue={42}>
          Content
        </Sticky>
      </Dark>,
    );
    expect(ref.current?.style.zIndex).toBe('42');
  });
});

// ---------------------------------------------------------------------------
// Polymorphic "as" prop
// ---------------------------------------------------------------------------

describe('Sticky — as prop', () => {
  it('renders as a div by default', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Sticky ref={ref}>Content</Sticky>
      </Dark>,
    );
    expect(ref.current?.tagName).toBe('DIV');
  });

  it('renders as a nav element', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Sticky ref={ref} as="nav">
          Content
        </Sticky>
      </Dark>,
    );
    expect(ref.current?.tagName).toBe('NAV');
  });

  it('renders as a header element', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Sticky ref={ref} as="header">
          Content
        </Sticky>
      </Dark>,
    );
    expect(ref.current?.tagName).toBe('HEADER');
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('Sticky — className', () => {
  it('passes className to the root element', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Sticky ref={ref} className="my-sticky">
          Content
        </Sticky>
      </Dark>,
    );
    expect(ref.current).toHaveClass('my-sticky');
  });
});

// ---------------------------------------------------------------------------
// style merge
// ---------------------------------------------------------------------------

describe('Sticky — style merge', () => {
  it('merges user style with computed style', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Sticky ref={ref} style={{ backgroundColor: 'red' }}>
          Content
        </Sticky>
      </Dark>,
    );
    expect(ref.current?.style.backgroundColor).toBe('red');
    // Computed styles should still be present
    expect(ref.current?.style.position).toBe('sticky');
  });

  it('user style overrides computed defaults', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Sticky ref={ref} style={{ position: 'fixed' as React.CSSProperties['position'] }}>
          Content
        </Sticky>
      </Dark>,
    );
    // User style is merged after computed style, so it wins
    expect(ref.current?.style.position).toBe('fixed');
  });
});

// ---------------------------------------------------------------------------
// HTML attributes passthrough
// ---------------------------------------------------------------------------

describe('Sticky — HTML attributes', () => {
  it('forwards data-* attributes', () => {
    render(
      <Dark>
        <Sticky data-testid="sticky" data-custom="value">
          Content
        </Sticky>
      </Dark>,
    );
    const el = screen.getByTestId('sticky');
    expect(el).toHaveAttribute('data-custom', 'value');
  });

  it('forwards id attribute', () => {
    render(
      <Dark>
        <Sticky data-testid="sticky" id="my-sticky">
          Content
        </Sticky>
      </Dark>,
    );
    expect(screen.getByTestId('sticky')).toHaveAttribute('id', 'my-sticky');
  });

  it('forwards aria attributes', () => {
    render(
      <Dark>
        <Sticky data-testid="sticky" aria-label="Sticky header">
          Content
        </Sticky>
      </Dark>,
    );
    expect(screen.getByTestId('sticky')).toHaveAttribute('aria-label', 'Sticky header');
  });
});
