/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Overlay } from './Overlay';
import { overlayBackdrops } from '@coexist/wisp-core/types/Overlay.types';
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

describe('Overlay — rendering', () => {
  it('renders children when open', () => {
    render(
      <Dark>
        <Overlay open>
          <span data-testid="child">Content</span>
        </Overlay>
      </Dark>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(
      <Dark>
        <Overlay open={false}>
          <span data-testid="child">Content</span>
        </Overlay>
      </Dark>,
    );
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('does not render when open is not provided (defaults to false)', () => {
    render(
      <Dark>
        <Overlay>
          <span data-testid="child">Content</span>
        </Overlay>
      </Dark>,
    );
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('renders in light mode without crashing', () => {
    render(
      <Light>
        <Overlay open>
          <span data-testid="child">Content</span>
        </Overlay>
      </Light>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('has displayName "Overlay"', () => {
    expect(Overlay.displayName).toBe('Overlay');
  });

  it('renders with role="presentation"', () => {
    render(
      <Dark>
        <Overlay open>Content</Overlay>
      </Dark>,
    );
    expect(screen.getByRole('presentation')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('Overlay — ref forwarding', () => {
  it('forwards ref to the root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Overlay ref={ref} open>
          Content
        </Overlay>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('ref is null when overlay is closed', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Overlay ref={ref} open={false}>
          Content
        </Overlay>
      </Dark>,
    );
    expect(ref.current).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Backdrop variants
// ---------------------------------------------------------------------------

describe('Overlay — backdrop', () => {
  it('exports overlayBackdrops constant', () => {
    expect(overlayBackdrops).toContain('dim');
    expect(overlayBackdrops).toContain('blur');
    expect(overlayBackdrops).toContain('transparent');
    expect(overlayBackdrops).toHaveLength(3);
  });

  overlayBackdrops.forEach((backdrop) => {
    it(`renders backdrop="${backdrop}" without crashing`, () => {
      render(
        <Dark>
          <Overlay open backdrop={backdrop} data-testid={`overlay-${backdrop}`}>
            Content
          </Overlay>
        </Dark>,
      );
      expect(screen.getByTestId(`overlay-${backdrop}`)).toBeInTheDocument();
    });
  });

  it('defaults to dim backdrop (rgba(0, 0, 0, 0.5))', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Overlay ref={ref} open>
          Content
        </Overlay>
      </Dark>,
    );
    expect(ref.current?.style.backgroundColor).toBe('rgba(0, 0, 0, 0.5)');
  });

  it('applies transparent backdrop', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Overlay ref={ref} open backdrop="transparent">
          Content
        </Overlay>
      </Dark>,
    );
    expect(ref.current?.style.backgroundColor).toBe('transparent');
  });

  it('applies blur backdrop with backdrop-filter', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Overlay ref={ref} open backdrop="blur">
          Content
        </Overlay>
      </Dark>,
    );
    expect(ref.current?.style.backgroundColor).toBe('rgba(0, 0, 0, 0.3)');
    expect(ref.current?.style.backdropFilter).toBe('blur(8px)');
  });

  it('dim and transparent produce different background colors', () => {
    const ref1 = React.createRef<HTMLDivElement>();
    const ref2 = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Overlay ref={ref1} open backdrop="dim">
          Dim
        </Overlay>
      </Dark>,
    );
    render(
      <Dark>
        <Overlay ref={ref2} open backdrop="transparent">
          Transparent
        </Overlay>
      </Dark>,
    );
    expect(ref1.current?.style.backgroundColor).not.toBe(
      ref2.current?.style.backgroundColor,
    );
  });
});

// ---------------------------------------------------------------------------
// Fixed positioning
// ---------------------------------------------------------------------------

describe('Overlay — fixed positioning', () => {
  it('applies position: fixed', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Overlay ref={ref} open>
          Content
        </Overlay>
      </Dark>,
    );
    expect(ref.current?.style.position).toBe('fixed');
  });

  it('covers the full viewport (top/right/bottom/left = 0)', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Overlay ref={ref} open>
          Content
        </Overlay>
      </Dark>,
    );
    expect(ref.current?.style.top).toBe('0px');
    expect(ref.current?.style.right).toBe('0px');
    expect(ref.current?.style.bottom).toBe('0px');
    expect(ref.current?.style.left).toBe('0px');
  });
});

// ---------------------------------------------------------------------------
// Center prop
// ---------------------------------------------------------------------------

describe('Overlay — center', () => {
  it('centers children by default (display: flex)', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Overlay ref={ref} open>
          Content
        </Overlay>
      </Dark>,
    );
    expect(ref.current?.style.display).toBe('flex');
    expect(ref.current?.style.alignItems).toBe('center');
    expect(ref.current?.style.justifyContent).toBe('center');
  });

  it('does not apply flex centering when center=false', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Overlay ref={ref} open center={false}>
          Content
        </Overlay>
      </Dark>,
    );
    expect(ref.current?.style.display).not.toBe('flex');
  });
});

// ---------------------------------------------------------------------------
// zIndex prop
// ---------------------------------------------------------------------------

describe('Overlay — zIndex', () => {
  it('defaults to the "overlay" z-index token (1200)', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Overlay ref={ref} open>
          Content
        </Overlay>
      </Dark>,
    );
    expect(ref.current?.style.zIndex).toBe(String(zIndexScale.overlay));
  });

  it('applies a named zIndex token', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Overlay ref={ref} open zIndex="modal">
          Content
        </Overlay>
      </Dark>,
    );
    expect(ref.current?.style.zIndex).toBe(String(zIndexScale.modal));
  });

  it('applies a custom zIndexValue (overrides zIndex token)', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Overlay ref={ref} open zIndex="modal" zIndexValue={5000}>
          Content
        </Overlay>
      </Dark>,
    );
    expect(ref.current?.style.zIndex).toBe('5000');
  });

  it('applies zIndexValue when zIndex token is not set', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Overlay ref={ref} open zIndexValue={99}>
          Content
        </Overlay>
      </Dark>,
    );
    expect(ref.current?.style.zIndex).toBe('99');
  });
});

// ---------------------------------------------------------------------------
// onBackdropClick
// ---------------------------------------------------------------------------

describe('Overlay — onBackdropClick', () => {
  it('calls onBackdropClick when clicking the backdrop itself', () => {
    const handleClick = vi.fn();
    render(
      <Dark>
        <Overlay open onBackdropClick={handleClick}>
          <span data-testid="child">Content</span>
        </Overlay>
      </Dark>,
    );
    const overlay = screen.getByRole('presentation');
    fireEvent.click(overlay);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onBackdropClick when clicking children', () => {
    const handleClick = vi.fn();
    render(
      <Dark>
        <Overlay open onBackdropClick={handleClick}>
          <span data-testid="child">Content</span>
        </Overlay>
      </Dark>,
    );
    fireEvent.click(screen.getByTestId('child'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('also calls the original onClick handler when backdrop is clicked', () => {
    const handleBackdropClick = vi.fn();
    const handleClick = vi.fn();
    render(
      <Dark>
        <Overlay open onBackdropClick={handleBackdropClick} onClick={handleClick}>
          <span>Content</span>
        </Overlay>
      </Dark>,
    );
    const overlay = screen.getByRole('presentation');
    fireEvent.click(overlay);
    expect(handleBackdropClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Escape key
// ---------------------------------------------------------------------------

describe('Overlay — closeOnEscape', () => {
  it('calls onBackdropClick on Escape key press by default', () => {
    const handleClick = vi.fn();
    render(
      <Dark>
        <Overlay open onBackdropClick={handleClick}>
          Content
        </Overlay>
      </Dark>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onBackdropClick on Escape when closeOnEscape=false', () => {
    const handleClick = vi.fn();
    render(
      <Dark>
        <Overlay open onBackdropClick={handleClick} closeOnEscape={false}>
          Content
        </Overlay>
      </Dark>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not call onBackdropClick on Escape when overlay is closed', () => {
    const handleClick = vi.fn();
    render(
      <Dark>
        <Overlay open={false} onBackdropClick={handleClick}>
          Content
        </Overlay>
      </Dark>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not fire on non-Escape keys', () => {
    const handleClick = vi.fn();
    render(
      <Dark>
        <Overlay open onBackdropClick={handleClick}>
          Content
        </Overlay>
      </Dark>,
    );
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(handleClick).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Portal
// ---------------------------------------------------------------------------

describe('Overlay — portal', () => {
  it('renders into document.body by default (portal)', () => {
    render(
      <Dark>
        <Overlay open data-testid="portal-overlay">
          Content
        </Overlay>
      </Dark>,
    );
    const overlay = screen.getByTestId('portal-overlay');
    expect(overlay.parentElement).toBe(document.body);
  });

  it('renders into a custom portalContainer', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    render(
      <Dark>
        <Overlay open portalContainer={container} data-testid="custom-portal">
          Content
        </Overlay>
      </Dark>,
    );
    const overlay = screen.getByTestId('custom-portal');
    expect(overlay.parentElement).toBe(container);
    document.body.removeChild(container);
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('Overlay — className', () => {
  it('passes className to the root element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Overlay ref={ref} open className="my-overlay">
          Content
        </Overlay>
      </Dark>,
    );
    expect(ref.current).toHaveClass('my-overlay');
  });
});

// ---------------------------------------------------------------------------
// style merge
// ---------------------------------------------------------------------------

describe('Overlay — style merge', () => {
  it('merges user style with computed style', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Overlay ref={ref} open style={{ opacity: 0.8 }}>
          Content
        </Overlay>
      </Dark>,
    );
    expect(ref.current?.style.opacity).toBe('0.8');
    // Computed styles should still be present
    expect(ref.current?.style.position).toBe('fixed');
  });

  it('user style can override computed defaults', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Overlay ref={ref} open style={{ position: 'absolute' as React.CSSProperties['position'] }}>
          Content
        </Overlay>
      </Dark>,
    );
    expect(ref.current?.style.position).toBe('absolute');
  });
});

// ---------------------------------------------------------------------------
// HTML attributes passthrough
// ---------------------------------------------------------------------------

describe('Overlay — HTML attributes', () => {
  it('forwards data-* attributes', () => {
    render(
      <Dark>
        <Overlay open data-testid="overlay" data-custom="value">
          Content
        </Overlay>
      </Dark>,
    );
    expect(screen.getByTestId('overlay')).toHaveAttribute('data-custom', 'value');
  });

  it('forwards id attribute', () => {
    render(
      <Dark>
        <Overlay open data-testid="overlay" id="my-overlay">
          Content
        </Overlay>
      </Dark>,
    );
    expect(screen.getByTestId('overlay')).toHaveAttribute('id', 'my-overlay');
  });

  it('forwards aria attributes', () => {
    render(
      <Dark>
        <Overlay open data-testid="overlay" aria-label="Modal backdrop">
          Content
        </Overlay>
      </Dark>,
    );
    expect(screen.getByTestId('overlay')).toHaveAttribute('aria-label', 'Modal backdrop');
  });
});
