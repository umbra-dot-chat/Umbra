/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ListItem } from './ListItem';
import { listItemSizes, listItemSizeMap } from '@coexist/wisp-core/types/ListItem.types';
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

/**
 * Helper: render a ListItem with a data-testid and return the root element.
 * This avoids ambiguity from `.closest('div')` matching the inner content slot.
 */
function renderRoot(ui: React.ReactElement, testId = 'root') {
  render(ui);
  return screen.getByTestId(testId);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ListItem — rendering', () => {
  it('renders children text', () => {
    render(<Dark><ListItem>Item content</ListItem></Dark>);
    expect(screen.getByText('Item content')).toBeInTheDocument();
  });

  it('renders as a div by default', () => {
    const root = renderRoot(
      <Dark><ListItem data-testid="root">Default div</ListItem></Dark>,
    );
    expect(root.tagName).toBe('DIV');
  });

  it('always renders the content slot', () => {
    render(<Dark><ListItem>Content</ListItem></Dark>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('ListItem — sizes', () => {
  listItemSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Dark><ListItem size={size}>{size}</ListItem></Dark>);
      expect(screen.getByText(size)).toBeInTheDocument();
    });
  });

  listItemSizes.forEach((size) => {
    it(`size="${size}" applies correct minHeight`, () => {
      const root = renderRoot(
        <Dark><ListItem size={size} data-testid="root">sized-{size}</ListItem></Dark>,
      );
      const config = listItemSizeMap[size];
      expect(root.style.minHeight).toBe(`${config.minHeight}px`);
    });
  });

  listItemSizes.forEach((size) => {
    it(`size="${size}" applies correct gap`, () => {
      const root = renderRoot(
        <Dark><ListItem size={size} data-testid="root">gap-{size}</ListItem></Dark>,
      );
      const config = listItemSizeMap[size];
      expect(root.style.gap).toBe(`${config.gap}px`);
    });
  });

  listItemSizes.forEach((size) => {
    it(`size="${size}" applies correct padding`, () => {
      const root = renderRoot(
        <Dark><ListItem size={size} data-testid="root">pad-{size}</ListItem></Dark>,
      );
      const config = listItemSizeMap[size];
      expect(root.style.paddingLeft).toBe(`${config.paddingX}px`);
      expect(root.style.paddingRight).toBe(`${config.paddingX}px`);
      expect(root.style.paddingTop).toBe(`${config.paddingY}px`);
      expect(root.style.paddingBottom).toBe(`${config.paddingY}px`);
    });
  });
});

// ---------------------------------------------------------------------------
// Leading slot
// ---------------------------------------------------------------------------

describe('ListItem — leading slot', () => {
  it('renders leading content when provided', () => {
    render(
      <Dark>
        <ListItem leading={<span data-testid="lead-icon">Icon</span>}>
          With leading
        </ListItem>
      </Dark>,
    );
    expect(screen.getByTestId('lead-icon')).toBeInTheDocument();
  });

  it('does not render leading wrapper when leading is not provided', () => {
    const root = renderRoot(
      <Dark><ListItem data-testid="root">No leading</ListItem></Dark>,
    );
    // Only one child div: the content slot
    const childDivs = root.querySelectorAll(':scope > div');
    expect(childDivs.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Trailing slot
// ---------------------------------------------------------------------------

describe('ListItem — trailing slot', () => {
  it('renders trailing content when provided', () => {
    render(
      <Dark>
        <ListItem trailing={<span data-testid="trail-action">Action</span>}>
          With trailing
        </ListItem>
      </Dark>,
    );
    expect(screen.getByTestId('trail-action')).toBeInTheDocument();
  });

  it('does not render trailing wrapper when trailing is not provided', () => {
    const root = renderRoot(
      <Dark><ListItem data-testid="root">No trailing</ListItem></Dark>,
    );
    const childDivs = root.querySelectorAll(':scope > div');
    expect(childDivs.length).toBe(1);
  });

  it('renders both leading and trailing when both provided', () => {
    const root = renderRoot(
      <Dark>
        <ListItem
          data-testid="root"
          leading={<span data-testid="both-lead">L</span>}
          trailing={<span data-testid="both-trail">T</span>}
        >
          Both slots
        </ListItem>
      </Dark>,
    );
    expect(screen.getByTestId('both-lead')).toBeInTheDocument();
    expect(screen.getByTestId('both-trail')).toBeInTheDocument();
    expect(screen.getByText('Both slots')).toBeInTheDocument();
    // Three child divs: leading, content, trailing
    const childDivs = root.querySelectorAll(':scope > div');
    expect(childDivs.length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Align
// ---------------------------------------------------------------------------

describe('ListItem — align', () => {
  it('defaults to center alignment', () => {
    const root = renderRoot(
      <Dark><ListItem data-testid="root">Centered</ListItem></Dark>,
    );
    expect(root.style.alignItems).toBe('center');
  });

  it('applies flex-start for align="start"', () => {
    const root = renderRoot(
      <Dark><ListItem data-testid="root" align="start">Top</ListItem></Dark>,
    );
    expect(root.style.alignItems).toBe('flex-start');
  });

  it('applies flex-end for align="end"', () => {
    const root = renderRoot(
      <Dark><ListItem data-testid="root" align="end">Bottom</ListItem></Dark>,
    );
    expect(root.style.alignItems).toBe('flex-end');
  });
});

// ---------------------------------------------------------------------------
// Interactive
// ---------------------------------------------------------------------------

describe('ListItem — interactive', () => {
  it('sets cursor to pointer when interactive', () => {
    const root = renderRoot(
      <Dark><ListItem data-testid="root" interactive>Clickable</ListItem></Dark>,
    );
    expect(root.style.cursor).toBe('pointer');
  });

  it('does not set cursor when not interactive', () => {
    const root = renderRoot(
      <Dark><ListItem data-testid="root">Not clickable</ListItem></Dark>,
    );
    expect(root.style.cursor).toBe('');
  });

  it('sets userSelect to none when interactive', () => {
    const root = renderRoot(
      <Dark><ListItem data-testid="root" interactive>No select</ListItem></Dark>,
    );
    expect(root.style.userSelect).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// Active state
// ---------------------------------------------------------------------------

describe('ListItem — active state', () => {
  it('applies a background color when active', () => {
    const root = renderRoot(
      <Dark><ListItem data-testid="root" active>Active item</ListItem></Dark>,
    );
    expect(root.style.backgroundColor).not.toBe('');
  });

  it('does not apply active background when not active', () => {
    const root = renderRoot(
      <Dark><ListItem data-testid="root">Inactive item</ListItem></Dark>,
    );
    expect(root.style.backgroundColor).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Disabled state
// ---------------------------------------------------------------------------

describe('ListItem — disabled state', () => {
  it('sets opacity to 0.5 when disabled', () => {
    const root = renderRoot(
      <Dark><ListItem data-testid="root" disabled>Disabled</ListItem></Dark>,
    );
    expect(root.style.opacity).toBe('0.5');
  });

  it('sets pointerEvents to none when disabled', () => {
    const root = renderRoot(
      <Dark><ListItem data-testid="root" disabled>Disabled pe</ListItem></Dark>,
    );
    expect(root.style.pointerEvents).toBe('none');
  });

  it('sets cursor to not-allowed when interactive and disabled', () => {
    const root = renderRoot(
      <Dark>
        <ListItem data-testid="root" interactive disabled>
          Disabled interactive
        </ListItem>
      </Dark>,
    );
    expect(root.style.cursor).toBe('not-allowed');
  });
});

// ---------------------------------------------------------------------------
// onClick handler
// ---------------------------------------------------------------------------

describe('ListItem — onClick handler', () => {
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    const root = renderRoot(
      <Dark>
        <ListItem data-testid="root" onClick={handleClick}>Click me</ListItem>
      </Dark>,
    );
    fireEvent.click(root);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Mouse events (interactive hover)
// ---------------------------------------------------------------------------

describe('ListItem — mouse events', () => {
  it('calls onMouseEnter passed by user when interactive', () => {
    const handleEnter = vi.fn();
    const root = renderRoot(
      <Dark>
        <ListItem data-testid="root" interactive onMouseEnter={handleEnter}>
          Hover me
        </ListItem>
      </Dark>,
    );
    fireEvent.mouseEnter(root);
    expect(handleEnter).toHaveBeenCalledTimes(1);
  });

  it('calls onMouseLeave passed by user when interactive', () => {
    const handleLeave = vi.fn();
    const root = renderRoot(
      <Dark>
        <ListItem data-testid="root" interactive onMouseLeave={handleLeave}>
          Leave me
        </ListItem>
      </Dark>,
    );
    fireEvent.mouseLeave(root);
    expect(handleLeave).toHaveBeenCalledTimes(1);
  });

  it('calls onMouseEnter directly when not interactive', () => {
    const handleEnter = vi.fn();
    const root = renderRoot(
      <Dark>
        <ListItem data-testid="root" onMouseEnter={handleEnter}>
          Non-interactive hover
        </ListItem>
      </Dark>,
    );
    fireEvent.mouseEnter(root);
    expect(handleEnter).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Polymorphic (as prop)
// ---------------------------------------------------------------------------

describe('ListItem — polymorphic', () => {
  it('renders as a li when as="li"', () => {
    const root = renderRoot(
      <Dark><ListItem data-testid="root" as="li">List element</ListItem></Dark>,
    );
    expect(root.tagName).toBe('LI');
  });

  it('renders as an anchor when as="a"', () => {
    const root = renderRoot(
      <Dark><ListItem data-testid="root" as="a" href="#">Link item</ListItem></Dark>,
    );
    expect(root.tagName).toBe('A');
  });

  it('renders as a button when as="button"', () => {
    const root = renderRoot(
      <Dark><ListItem data-testid="root" as="button">Button item</ListItem></Dark>,
    );
    expect(root.tagName).toBe('BUTTON');
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('ListItem — className passthrough', () => {
  it('passes className through to the root element', () => {
    const root = renderRoot(
      <Dark><ListItem data-testid="root" className="custom-class">Styled</ListItem></Dark>,
    );
    expect(root).toHaveClass('custom-class');
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('ListItem — style merge', () => {
  it('merges user style onto computed style', () => {
    const root = renderRoot(
      <Dark>
        <ListItem data-testid="root" style={{ border: '1px solid red' }}>Merged</ListItem>
      </Dark>,
    );
    expect(root.style.border).toBe('1px solid red');
    // Computed style should still be present
    expect(root.style.display).toBe('flex');
  });

  it('user style overrides computed style', () => {
    const root = renderRoot(
      <Dark>
        <ListItem data-testid="root" style={{ display: 'grid' }}>Override</ListItem>
      </Dark>,
    );
    expect(root.style.display).toBe('grid');
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('ListItem — accessibility', () => {
  it('passes aria-label through', () => {
    const root = renderRoot(
      <Dark>
        <ListItem data-testid="root" aria-label="User list item">Accessible</ListItem>
      </Dark>,
    );
    expect(root).toHaveAttribute('aria-label', 'User list item');
  });

  it('passes role through', () => {
    render(
      <Dark><ListItem role="listitem">Role item</ListItem></Dark>,
    );
    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });

  it('passes data-testid through', () => {
    render(
      <Dark><ListItem data-testid="my-item">Testable</ListItem></Dark>,
    );
    expect(screen.getByTestId('my-item')).toBeInTheDocument();
  });

  it('passes tabIndex through', () => {
    const root = renderRoot(
      <Dark><ListItem data-testid="root" tabIndex={0}>Focusable</ListItem></Dark>,
    );
    expect(root).toHaveAttribute('tabindex', '0');
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('ListItem — ref forwarding', () => {
  it('forwards ref to the root element', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark><ListItem ref={ref}>Ref test</ListItem></Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe('DIV');
  });

  it('forwards ref to polymorphic element', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark><ListItem ref={ref} as="li">Li ref</ListItem></Dark>,
    );
    expect(ref.current?.tagName).toBe('LI');
  });
});

// ---------------------------------------------------------------------------
// Theme modes
// ---------------------------------------------------------------------------

describe('ListItem — theme modes', () => {
  it('renders in dark mode without crashing', () => {
    render(<Dark><ListItem>Dark mode</ListItem></Dark>);
    expect(screen.getByText('Dark mode')).toBeInTheDocument();
  });

  it('renders in light mode without crashing', () => {
    render(<Light><ListItem>Light mode</ListItem></Light>);
    expect(screen.getByText('Light mode')).toBeInTheDocument();
  });
});
