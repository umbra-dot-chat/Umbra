/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Center } from './Center';
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

describe('Center — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Dark>
        <Center>Hello</Center>
      </Dark>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <Dark>
        <Center>
          <span data-testid="child">Content</span>
        </Center>
      </Dark>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders in light mode without crashing', () => {
    render(
      <Light>
        <Center>
          <span data-testid="light-child">Light</span>
        </Center>
      </Light>,
    );
    expect(screen.getByTestId('light-child')).toBeInTheDocument();
  });

  it('renders a div by default', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Center ref={ref}>Content</Center>
      </Dark>,
    );
    expect(ref.current?.tagName).toBe('DIV');
  });
});

// ---------------------------------------------------------------------------
// Flexbox centering
// ---------------------------------------------------------------------------

describe('Center — flexbox centering', () => {
  it('applies display: flex by default', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Center ref={ref}>Content</Center>
      </Dark>,
    );
    expect(ref.current?.style.display).toBe('flex');
  });

  it('applies alignItems: center', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Center ref={ref}>Content</Center>
      </Dark>,
    );
    expect(ref.current?.style.alignItems).toBe('center');
  });

  it('applies justifyContent: center', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Center ref={ref}>Content</Center>
      </Dark>,
    );
    expect(ref.current?.style.justifyContent).toBe('center');
  });
});

// ---------------------------------------------------------------------------
// Inline prop
// ---------------------------------------------------------------------------

describe('Center — inline prop', () => {
  it('uses display: flex when inline is false (default)', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Center ref={ref}>Content</Center>
      </Dark>,
    );
    expect(ref.current?.style.display).toBe('flex');
  });

  it('uses display: inline-flex when inline is true', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Center ref={ref} inline>Content</Center>
      </Dark>,
    );
    expect(ref.current?.style.display).toBe('inline-flex');
  });

  it('uses display: flex when inline is explicitly false', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Center ref={ref} inline={false}>Content</Center>
      </Dark>,
    );
    expect(ref.current?.style.display).toBe('flex');
  });
});

// ---------------------------------------------------------------------------
// Polymorphic "as" prop
// ---------------------------------------------------------------------------

describe('Center — as prop', () => {
  it('renders as a span when as="span"', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Center ref={ref} as="span">Content</Center>
      </Dark>,
    );
    expect(ref.current?.tagName).toBe('SPAN');
  });

  it('renders as a section when as="section"', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Center ref={ref} as="section">Content</Center>
      </Dark>,
    );
    expect(ref.current?.tagName).toBe('SECTION');
  });

  it('still applies centering styles with a custom element', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Center ref={ref} as="nav">Content</Center>
      </Dark>,
    );
    expect(ref.current?.style.display).toBe('flex');
    expect(ref.current?.style.alignItems).toBe('center');
    expect(ref.current?.style.justifyContent).toBe('center');
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('Center — className', () => {
  it('passes className to the root element', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Center ref={ref} className="custom-class">Content</Center>
      </Dark>,
    );
    expect(ref.current).toHaveClass('custom-class');
  });

  it('supports multiple class names', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Center ref={ref} className="foo bar">Content</Center>
      </Dark>,
    );
    expect(ref.current).toHaveClass('foo');
    expect(ref.current).toHaveClass('bar');
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('Center — style merge', () => {
  it('merges user style with computed centering style', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Center ref={ref} style={{ backgroundColor: 'red' }}>Content</Center>
      </Dark>,
    );
    expect(ref.current?.style.backgroundColor).toBe('red');
    // Centering styles should still be applied
    expect(ref.current?.style.display).toBe('flex');
    expect(ref.current?.style.alignItems).toBe('center');
    expect(ref.current?.style.justifyContent).toBe('center');
  });

  it('user style takes precedence over computed style', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Center ref={ref} style={{ display: 'grid' }}>Content</Center>
      </Dark>,
    );
    expect(ref.current?.style.display).toBe('grid');
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('Center — ref forwarding', () => {
  it('forwards ref to the root element', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Center ref={ref}>Content</Center>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it('ref points to correct DOM node', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Center ref={ref} data-testid="center-root">Content</Center>
      </Dark>,
    );
    expect(ref.current).toBe(screen.getByTestId('center-root'));
  });
});

// ---------------------------------------------------------------------------
// HTML attribute passthrough
// ---------------------------------------------------------------------------

describe('Center — HTML attribute passthrough', () => {
  it('forwards data-testid', () => {
    render(
      <Dark>
        <Center data-testid="my-center">Content</Center>
      </Dark>,
    );
    expect(screen.getByTestId('my-center')).toBeInTheDocument();
  });

  it('forwards id attribute', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Center ref={ref} id="center-id">Content</Center>
      </Dark>,
    );
    expect(ref.current).toHaveAttribute('id', 'center-id');
  });

  it('forwards aria attributes', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Center ref={ref} aria-label="centered content">Content</Center>
      </Dark>,
    );
    expect(ref.current).toHaveAttribute('aria-label', 'centered content');
  });
});
