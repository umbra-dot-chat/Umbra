/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Container } from './Container';
import { containerSizes, containerSizeMap } from '@coexist/wisp-core/types/Container.types';
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

describe('Container — rendering', () => {
  it('renders children text', () => {
    render(<Dark><Container>Hello world</Container></Dark>);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders as a div by default', () => {
    render(<Dark><Container>Default div</Container></Dark>);
    const el = screen.getByText('Default div');
    expect(el.closest('div')).toBeTruthy();
  });

  it('renders in light mode without crashing', () => {
    render(<Light><Container>Light content</Container></Light>);
    expect(screen.getByText('Light content')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes / maxWidth
// ---------------------------------------------------------------------------

describe('Container — sizes', () => {
  containerSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Dark><Container size={size}>{size}</Container></Dark>);
      expect(screen.getByText(size)).toBeInTheDocument();
    });
  });

  it('applies default size "lg" with maxWidth 1024px', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Container ref={ref}>Default size</Container>
      </Dark>,
    );
    expect(ref.current?.style.maxWidth).toBe('1024px');
  });

  containerSizes.forEach((size) => {
    it(`applies correct maxWidth for size="${size}"`, () => {
      const ref = React.createRef<HTMLElement>();
      render(
        <Dark>
          <Container ref={ref} size={size}>Content</Container>
        </Dark>,
      );
      const expected = containerSizeMap[size];
      if (typeof expected === 'number') {
        expect(ref.current?.style.maxWidth).toBe(`${expected}px`);
      } else {
        expect(ref.current?.style.maxWidth).toBe(expected);
      }
    });
  });

  it('sets width to 100%', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Container ref={ref}>Full width</Container>
      </Dark>,
    );
    expect(ref.current?.style.width).toBe('100%');
  });
});

// ---------------------------------------------------------------------------
// Centering
// ---------------------------------------------------------------------------

describe('Container — centering', () => {
  it('centers by default with auto margins', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Container ref={ref}>Centered</Container>
      </Dark>,
    );
    expect(ref.current?.style.marginLeft).toBe('auto');
    expect(ref.current?.style.marginRight).toBe('auto');
  });

  it('does not apply auto margins when center=false', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Container ref={ref} center={false}>Left aligned</Container>
      </Dark>,
    );
    expect(ref.current?.style.marginLeft).not.toBe('auto');
    expect(ref.current?.style.marginRight).not.toBe('auto');
  });
});

// ---------------------------------------------------------------------------
// Padding (px prop)
// ---------------------------------------------------------------------------

describe('Container — px (horizontal padding)', () => {
  it('applies default px="lg" padding (16px)', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Container ref={ref}>Padded</Container>
      </Dark>,
    );
    expect(ref.current?.style.paddingLeft).toBe('16px');
    expect(ref.current?.style.paddingRight).toBe('16px');
  });

  it('applies px="none" padding (0px)', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Container ref={ref} px="none">No padding</Container>
      </Dark>,
    );
    expect(ref.current?.style.paddingLeft).toBe('0px');
    expect(ref.current?.style.paddingRight).toBe('0px');
  });

  it('applies px="xl" padding (24px)', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Container ref={ref} px="xl">XL padding</Container>
      </Dark>,
    );
    expect(ref.current?.style.paddingLeft).toBe('24px');
    expect(ref.current?.style.paddingRight).toBe('24px');
  });

  it('applies px="sm" padding (8px)', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Container ref={ref} px="sm">SM padding</Container>
      </Dark>,
    );
    expect(ref.current?.style.paddingLeft).toBe('8px');
    expect(ref.current?.style.paddingRight).toBe('8px');
  });
});

// ---------------------------------------------------------------------------
// Box-sizing
// ---------------------------------------------------------------------------

describe('Container — box-sizing', () => {
  it('sets box-sizing to border-box', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Container ref={ref}>Box sizing</Container>
      </Dark>,
    );
    expect(ref.current?.style.boxSizing).toBe('border-box');
  });
});

// ---------------------------------------------------------------------------
// Polymorphic (as prop)
// ---------------------------------------------------------------------------

describe('Container — polymorphic', () => {
  it('renders as a section when as="section"', () => {
    render(<Dark><Container as="section">Section container</Container></Dark>);
    const el = screen.getByText('Section container');
    expect(el.closest('section')).toBeTruthy();
  });

  it('renders as a main when as="main"', () => {
    render(<Dark><Container as="main">Main container</Container></Dark>);
    const el = screen.getByText('Main container');
    expect(el.closest('main')).toBeTruthy();
  });

  it('renders as an article when as="article"', () => {
    render(<Dark><Container as="article">Article container</Container></Dark>);
    const el = screen.getByText('Article container');
    expect(el.closest('article')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('Container — className passthrough', () => {
  it('passes className through to the root element', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Container ref={ref} className="custom-class">Styled</Container>
      </Dark>,
    );
    expect(ref.current).toHaveClass('custom-class');
  });
});

// ---------------------------------------------------------------------------
// style merge
// ---------------------------------------------------------------------------

describe('Container — style merge', () => {
  it('merges user style with container style', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Container ref={ref} style={{ backgroundColor: 'red' }}>Styled</Container>
      </Dark>,
    );
    expect(ref.current?.style.backgroundColor).toBe('red');
    // Container styles should still be applied
    expect(ref.current?.style.width).toBe('100%');
    expect(ref.current?.style.maxWidth).toBe('1024px');
  });

  it('user style can override container defaults', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Container ref={ref} style={{ width: '50%' }}>Override</Container>
      </Dark>,
    );
    expect(ref.current?.style.width).toBe('50%');
  });

  it('user style can override maxWidth', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Container ref={ref} style={{ maxWidth: '500px' }}>Narrow</Container>
      </Dark>,
    );
    expect(ref.current?.style.maxWidth).toBe('500px');
  });
});

// ---------------------------------------------------------------------------
// ref forwarding
// ---------------------------------------------------------------------------

describe('Container — ref forwarding', () => {
  it('forwards ref to the root element', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Container ref={ref}>Ref test</Container>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards ref to the correct polymorphic element', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Container ref={ref} as="section">Section ref</Container>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe('SECTION');
  });
});

// ---------------------------------------------------------------------------
// HTML attribute passthrough
// ---------------------------------------------------------------------------

describe('Container — HTML attribute passthrough', () => {
  it('passes data-testid through', () => {
    render(
      <Dark>
        <Container data-testid="my-container">Testable</Container>
      </Dark>,
    );
    expect(screen.getByTestId('my-container')).toBeInTheDocument();
  });

  it('passes id through', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Container ref={ref} id="container-id">ID test</Container>
      </Dark>,
    );
    expect(ref.current?.id).toBe('container-id');
  });

  it('passes role through', () => {
    render(
      <Dark>
        <Container role="region">Region</Container>
      </Dark>,
    );
    expect(screen.getByRole('region')).toBeInTheDocument();
  });
});
