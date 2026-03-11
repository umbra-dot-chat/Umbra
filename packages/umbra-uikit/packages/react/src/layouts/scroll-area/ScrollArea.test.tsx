/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScrollArea } from './ScrollArea';
import { scrollAreaDirections, scrollbarWidths } from '@coexist/wisp-core/types/ScrollArea.types';
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

describe('ScrollArea — rendering', () => {
  it('renders children text', () => {
    render(<Dark><ScrollArea>Scroll content</ScrollArea></Dark>);
    expect(screen.getByText('Scroll content')).toBeInTheDocument();
  });

  it('renders as a div', () => {
    render(<Dark><ScrollArea>Default div</ScrollArea></Dark>);
    const el = screen.getByText('Default div');
    expect(el.closest('div')).toBeTruthy();
  });

  it('renders in light mode without crashing', () => {
    render(<Light><ScrollArea>Light content</ScrollArea></Light>);
    expect(screen.getByText('Light content')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Direction
// ---------------------------------------------------------------------------

describe('ScrollArea — direction', () => {
  scrollAreaDirections.forEach((direction) => {
    it(`renders direction="${direction}" without crashing`, () => {
      render(<Dark><ScrollArea direction={direction}>{direction}</ScrollArea></Dark>);
      expect(screen.getByText(direction)).toBeInTheDocument();
    });
  });

  it('applies vertical overflow by default (overflowY=auto, overflowX=hidden)', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref}>Vertical scroll</ScrollArea>
      </Dark>,
    );
    expect(ref.current?.style.overflowY).toBe('auto');
    expect(ref.current?.style.overflowX).toBe('hidden');
  });

  it('applies horizontal overflow (overflowX=auto, overflowY=hidden)', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref} direction="horizontal">Horizontal scroll</ScrollArea>
      </Dark>,
    );
    expect(ref.current?.style.overflowX).toBe('auto');
    expect(ref.current?.style.overflowY).toBe('hidden');
  });

  it('applies both overflow (overflowX=auto, overflowY=auto)', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref} direction="both">Both scroll</ScrollArea>
      </Dark>,
    );
    expect(ref.current?.style.overflowX).toBe('auto');
    expect(ref.current?.style.overflowY).toBe('auto');
  });
});

// ---------------------------------------------------------------------------
// Scrollbar width
// ---------------------------------------------------------------------------

describe('ScrollArea — scrollbarWidth', () => {
  scrollbarWidths.forEach((width) => {
    it(`renders scrollbarWidth="${width}" without crashing`, () => {
      render(
        <Dark>
          <ScrollArea scrollbarWidth={width}>{width}</ScrollArea>
        </Dark>,
      );
      expect(screen.getByText(width)).toBeInTheDocument();
    });
  });

  it('applies default scrollbarWidth="thin"', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref}>Thin scrollbar</ScrollArea>
      </Dark>,
    );
    expect(ref.current?.style.scrollbarWidth).toBe('thin');
  });

  it('applies scrollbarWidth="auto"', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref} scrollbarWidth="auto">Auto scrollbar</ScrollArea>
      </Dark>,
    );
    expect(ref.current?.style.scrollbarWidth).toBe('auto');
  });

  it('applies scrollbarWidth="none"', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref} scrollbarWidth="none">No scrollbar</ScrollArea>
      </Dark>,
    );
    expect(ref.current?.style.scrollbarWidth).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// hideScrollbar
// ---------------------------------------------------------------------------

describe('ScrollArea — hideScrollbar', () => {
  it('does not hide scrollbar by default', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref}>Visible scrollbar</ScrollArea>
      </Dark>,
    );
    expect(ref.current?.style.scrollbarWidth).toBe('thin');
  });

  it('hides scrollbar when hideScrollbar=true (scrollbarWidth=none)', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref} hideScrollbar>Hidden scrollbar</ScrollArea>
      </Dark>,
    );
    expect(ref.current?.style.scrollbarWidth).toBe('none');
  });

  it('removes scrollbarColor when hideScrollbar=true', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref} hideScrollbar>Hidden</ScrollArea>
      </Dark>,
    );
    expect(ref.current?.style.scrollbarColor).toBe('');
  });

  it('sets scrollbarColor when hideScrollbar=false', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref}>Visible</ScrollArea>
      </Dark>,
    );
    // scrollbarColor should contain "transparent" as the track color
    const scrollbarColor = ref.current?.style.scrollbarColor;
    expect(scrollbarColor).toBeTruthy();
    expect(scrollbarColor).toContain('transparent');
  });
});

// ---------------------------------------------------------------------------
// maxHeight / maxWidth
// ---------------------------------------------------------------------------

describe('ScrollArea — maxHeight / maxWidth', () => {
  it('applies maxHeight as number', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref} maxHeight={400}>Constrained height</ScrollArea>
      </Dark>,
    );
    expect(ref.current?.style.maxHeight).toBe('400px');
  });

  it('applies maxHeight as string', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref} maxHeight="50vh">Half viewport</ScrollArea>
      </Dark>,
    );
    expect(ref.current?.style.maxHeight).toBe('50vh');
  });

  it('applies maxWidth as number', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref} maxWidth={600}>Constrained width</ScrollArea>
      </Dark>,
    );
    expect(ref.current?.style.maxWidth).toBe('600px');
  });

  it('applies maxWidth as string', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref} maxWidth="80%">Percentage width</ScrollArea>
      </Dark>,
    );
    expect(ref.current?.style.maxWidth).toBe('80%');
  });

  it('does not set maxHeight when not provided', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref}>No max height</ScrollArea>
      </Dark>,
    );
    expect(ref.current?.style.maxHeight).toBe('');
  });

  it('does not set maxWidth when not provided', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref}>No max width</ScrollArea>
      </Dark>,
    );
    expect(ref.current?.style.maxWidth).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Position
// ---------------------------------------------------------------------------

describe('ScrollArea — position', () => {
  it('sets position to relative', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref}>Positioned</ScrollArea>
      </Dark>,
    );
    expect(ref.current?.style.position).toBe('relative');
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('ScrollArea — className passthrough', () => {
  it('passes className through to the root element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref} className="custom-scroll">Styled</ScrollArea>
      </Dark>,
    );
    expect(ref.current).toHaveClass('custom-scroll');
  });
});

// ---------------------------------------------------------------------------
// style merge
// ---------------------------------------------------------------------------

describe('ScrollArea — style merge', () => {
  it('merges user style with scroll area style', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref} style={{ backgroundColor: 'blue' }}>Styled</ScrollArea>
      </Dark>,
    );
    expect(ref.current?.style.backgroundColor).toBe('blue');
    // Scroll area styles should still be applied
    expect(ref.current?.style.position).toBe('relative');
    expect(ref.current?.style.overflowY).toBe('auto');
  });

  it('user style can override scroll area defaults', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref} style={{ position: 'absolute' }}>Override</ScrollArea>
      </Dark>,
    );
    expect(ref.current?.style.position).toBe('absolute');
  });

  it('user style can override overflow', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref} style={{ overflowY: 'scroll' }}>Forced scroll</ScrollArea>
      </Dark>,
    );
    expect(ref.current?.style.overflowY).toBe('scroll');
  });
});

// ---------------------------------------------------------------------------
// ref forwarding
// ---------------------------------------------------------------------------

describe('ScrollArea — ref forwarding', () => {
  it('forwards ref to the root div element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref}>Ref test</ScrollArea>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// HTML attribute passthrough
// ---------------------------------------------------------------------------

describe('ScrollArea — HTML attribute passthrough', () => {
  it('passes data-testid through', () => {
    render(
      <Dark>
        <ScrollArea data-testid="my-scroll">Testable</ScrollArea>
      </Dark>,
    );
    expect(screen.getByTestId('my-scroll')).toBeInTheDocument();
  });

  it('passes id through', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref} id="scroll-id">ID test</ScrollArea>
      </Dark>,
    );
    expect(ref.current?.id).toBe('scroll-id');
  });

  it('passes role through', () => {
    render(
      <Dark>
        <ScrollArea role="region">Region</ScrollArea>
      </Dark>,
    );
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('passes aria-label through', () => {
    render(
      <Dark>
        <ScrollArea role="region" aria-label="Scrollable content">Content</ScrollArea>
      </Dark>,
    );
    expect(screen.getByRole('region', { name: 'Scrollable content' })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Theme awareness
// ---------------------------------------------------------------------------

describe('ScrollArea — theme awareness', () => {
  it('applies theme-aware scrollbar colors in dark mode', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ScrollArea ref={ref}>Dark scroll</ScrollArea>
      </Dark>,
    );
    const scrollbarColor = ref.current?.style.scrollbarColor;
    expect(scrollbarColor).toBeTruthy();
    expect(scrollbarColor).toContain('transparent');
  });

  it('applies theme-aware scrollbar colors in light mode', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Light>
        <ScrollArea ref={ref}>Light scroll</ScrollArea>
      </Light>,
    );
    const scrollbarColor = ref.current?.style.scrollbarColor;
    expect(scrollbarColor).toBeTruthy();
    expect(scrollbarColor).toContain('transparent');
  });
});
