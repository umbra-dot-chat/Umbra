/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Collapse } from './Collapse';
import { collapseDurations, collapseDurationMap } from '@coexist/wisp-core/types/Collapse.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Collapse — rendering', () => {
  it('renders children when open', () => {
    render(
      <Dark>
        <Collapse open>Visible content</Collapse>
      </Dark>,
    );
    expect(screen.getByText('Visible content')).toBeInTheDocument();
  });

  it('renders children in the DOM when closed (unmountOnClose=false)', () => {
    render(
      <Dark>
        <Collapse open={false}>Hidden content</Collapse>
      </Dark>,
    );
    // Content remains in DOM but wrapper has max-height 0
    expect(screen.getByText('Hidden content')).toBeInTheDocument();
  });

  it('renders as a div', () => {
    render(
      <Dark>
        <Collapse open data-testid="collapse">Content</Collapse>
      </Dark>,
    );
    const el = screen.getByTestId('collapse');
    expect(el.tagName).toBe('DIV');
  });
});

// ---------------------------------------------------------------------------
// Open / closed state
// ---------------------------------------------------------------------------

describe('Collapse — open / closed', () => {
  it('sets max-height to 0 when closed', () => {
    render(
      <Dark>
        <Collapse open={false} data-testid="collapse">Content</Collapse>
      </Dark>,
    );
    const el = screen.getByTestId('collapse');
    expect(el.style.maxHeight).toBe('0');
  });

  it('sets aria-hidden to true when closed', () => {
    render(
      <Dark>
        <Collapse open={false} data-testid="collapse">Content</Collapse>
      </Dark>,
    );
    const el = screen.getByTestId('collapse');
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });

  it('sets aria-hidden to false when open', () => {
    render(
      <Dark>
        <Collapse open data-testid="collapse">Content</Collapse>
      </Dark>,
    );
    const el = screen.getByTestId('collapse');
    expect(el).toHaveAttribute('aria-hidden', 'false');
  });

  it('has overflow hidden', () => {
    render(
      <Dark>
        <Collapse open data-testid="collapse">Content</Collapse>
      </Dark>,
    );
    const el = screen.getByTestId('collapse');
    expect(el.style.overflow).toBe('hidden');
  });
});

// ---------------------------------------------------------------------------
// unmountOnClose
// ---------------------------------------------------------------------------

describe('Collapse — unmountOnClose', () => {
  it('returns null when closed and unmountOnClose is true', () => {
    const { container } = render(
      <Dark>
        <Collapse open={false} unmountOnClose data-testid="collapse">
          Should not exist
        </Collapse>
      </Dark>,
    );
    expect(screen.queryByText('Should not exist')).not.toBeInTheDocument();
    expect(container.querySelector('[data-testid="collapse"]')).toBeNull();
  });

  it('renders content when open and unmountOnClose is true', () => {
    render(
      <Dark>
        <Collapse open unmountOnClose>
          Should exist
        </Collapse>
      </Dark>,
    );
    expect(screen.getByText('Should exist')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Duration presets
// ---------------------------------------------------------------------------

describe('Collapse — duration presets', () => {
  collapseDurations.forEach((preset) => {
    it(`renders with duration="${preset}" without crashing`, () => {
      render(
        <Dark>
          <Collapse open duration={preset} data-testid="collapse">
            Content
          </Collapse>
        </Dark>,
      );
      const el = screen.getByTestId('collapse');
      const ms = collapseDurationMap[preset];
      if (ms > 0) {
        expect(el.style.transition).toContain(`max-height ${ms}ms`);
      } else {
        // instant: no transition
        expect(el.style.transition).toBe('');
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Custom durationMs
// ---------------------------------------------------------------------------

describe('Collapse — durationMs', () => {
  it('overrides duration preset with custom milliseconds', () => {
    render(
      <Dark>
        <Collapse open duration="slow" durationMs={500} data-testid="collapse">
          Content
        </Collapse>
      </Dark>,
    );
    const el = screen.getByTestId('collapse');
    expect(el.style.transition).toContain('500ms');
  });
});

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

describe('Collapse — easing', () => {
  it('applies default easing when not specified', () => {
    render(
      <Dark>
        <Collapse open data-testid="collapse">Content</Collapse>
      </Dark>,
    );
    const el = screen.getByTestId('collapse');
    expect(el.style.transition).toContain('cubic-bezier(0.4, 0, 0.2, 1)');
  });

  it('applies custom easing', () => {
    render(
      <Dark>
        <Collapse open easing="ease-in-out" data-testid="collapse">
          Content
        </Collapse>
      </Dark>,
    );
    const el = screen.getByTestId('collapse');
    expect(el.style.transition).toContain('ease-in-out');
  });
});

// ---------------------------------------------------------------------------
// onTransitionEnd
// ---------------------------------------------------------------------------

describe('Collapse — onTransitionEnd', () => {
  it('calls onTransitionEnd when max-height transition ends', () => {
    const handler = vi.fn();
    render(
      <Dark>
        <Collapse open onTransitionEnd={handler} data-testid="collapse">
          Content
        </Collapse>
      </Dark>,
    );
    const el = screen.getByTestId('collapse');
    const event = new Event('transitionend', { bubbles: true }) as any;
    event.propertyName = 'max-height';
    el.dispatchEvent(event);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not call onTransitionEnd for other property transitions', () => {
    const handler = vi.fn();
    render(
      <Dark>
        <Collapse open onTransitionEnd={handler} data-testid="collapse">
          Content
        </Collapse>
      </Dark>,
    );
    const el = screen.getByTestId('collapse');
    const event = new Event('transitionend', { bubbles: true }) as any;
    event.propertyName = 'opacity';
    el.dispatchEvent(event);
    expect(handler).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('Collapse — className passthrough', () => {
  it('passes className through to the root element', () => {
    render(
      <Dark>
        <Collapse open className="custom-collapse" data-testid="collapse">
          Content
        </Collapse>
      </Dark>,
    );
    const el = screen.getByTestId('collapse');
    expect(el).toHaveClass('custom-collapse');
  });
});

// ---------------------------------------------------------------------------
// style merge
// ---------------------------------------------------------------------------

describe('Collapse — style merge', () => {
  it('merges user style with computed collapse style', () => {
    render(
      <Dark>
        <Collapse open style={{ backgroundColor: 'red' }} data-testid="collapse">
          Content
        </Collapse>
      </Dark>,
    );
    const el = screen.getByTestId('collapse');
    expect(el.style.backgroundColor).toBe('red');
    expect(el.style.overflow).toBe('hidden');
  });

  it('user style overrides computed style when keys collide', () => {
    render(
      <Dark>
        <Collapse open style={{ overflow: 'visible' }} data-testid="collapse">
          Content
        </Collapse>
      </Dark>,
    );
    const el = screen.getByTestId('collapse');
    expect(el.style.overflow).toBe('visible');
  });
});

// ---------------------------------------------------------------------------
// ref forwarding
// ---------------------------------------------------------------------------

describe('Collapse — ref forwarding', () => {
  it('forwards ref to the root element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Collapse open ref={ref}>Content</Collapse>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.tagName).toBe('DIV');
  });
});

// ---------------------------------------------------------------------------
// Props passthrough (data-*, aria-*, etc.)
// ---------------------------------------------------------------------------

describe('Collapse — props passthrough', () => {
  it('passes data attributes through', () => {
    render(
      <Dark>
        <Collapse open data-testid="collapse" data-custom="value">
          Content
        </Collapse>
      </Dark>,
    );
    const el = screen.getByTestId('collapse');
    expect(el).toHaveAttribute('data-custom', 'value');
  });

  it('passes aria attributes through', () => {
    render(
      <Dark>
        <Collapse open data-testid="collapse" aria-label="collapsible section">
          Content
        </Collapse>
      </Dark>,
    );
    const el = screen.getByTestId('collapse');
    expect(el).toHaveAttribute('aria-label', 'collapsible section');
  });
});

// ---------------------------------------------------------------------------
// Default prop values
// ---------------------------------------------------------------------------

describe('Collapse — defaults', () => {
  it('defaults to closed (open=false)', () => {
    render(
      <Dark>
        <Collapse data-testid="collapse">Content</Collapse>
      </Dark>,
    );
    const el = screen.getByTestId('collapse');
    expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(el.style.maxHeight).toBe('0');
  });

  it('defaults to unmountOnClose=false (children stay in DOM when closed)', () => {
    render(
      <Dark>
        <Collapse>Still here</Collapse>
      </Dark>,
    );
    expect(screen.getByText('Still here')).toBeInTheDocument();
  });
});
