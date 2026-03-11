/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React, { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Stack, HStack, VStack } from './Stack';
import { stackDirections, stackAligns, stackJustifys } from '@coexist/wisp-core/types/Stack.types';
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

describe('Stack — rendering', () => {
  it('renders children text', () => {
    render(
      <Dark>
        <Stack>
          <span>Child A</span>
          <span>Child B</span>
        </Stack>
      </Dark>,
    );
    expect(screen.getByText('Child A')).toBeInTheDocument();
    expect(screen.getByText('Child B')).toBeInTheDocument();
  });

  it('renders as a div by default', () => {
    const { container } = render(
      <Dark>
        <Stack data-testid="stack">Content</Stack>
      </Dark>,
    );
    const el = screen.getByTestId('stack');
    expect(el.tagName).toBe('DIV');
  });

  it('renders in light mode without crashing', () => {
    render(
      <Light>
        <Stack data-testid="stack-light">Content</Stack>
      </Light>,
    );
    expect(screen.getByTestId('stack-light')).toBeInTheDocument();
  });

  it('renders with no children without crashing', () => {
    const { container } = render(
      <Dark>
        <Stack data-testid="empty-stack" />
      </Dark>,
    );
    expect(screen.getByTestId('empty-stack')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Direction
// ---------------------------------------------------------------------------

describe('Stack — direction', () => {
  it('defaults to vertical (flex-direction: column)', () => {
    render(
      <Dark>
        <Stack data-testid="stack">Content</Stack>
      </Dark>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.flexDirection).toBe('column');
  });

  it('renders horizontal (flex-direction: row)', () => {
    render(
      <Dark>
        <Stack data-testid="stack" direction="horizontal">Content</Stack>
      </Dark>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.flexDirection).toBe('row');
  });

  stackDirections.forEach((dir) => {
    it(`renders direction="${dir}" without crashing`, () => {
      render(
        <Dark>
          <Stack direction={dir} data-testid={`stack-${dir}`}>
            Content
          </Stack>
        </Dark>,
      );
      expect(screen.getByTestId(`stack-${dir}`)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Gap / Spacing
// ---------------------------------------------------------------------------

describe('Stack — gap', () => {
  it('defaults to md gap (12px)', () => {
    render(
      <Dark>
        <Stack data-testid="stack">Content</Stack>
      </Dark>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.gap).toBe('12px');
  });

  it('applies sm gap (8px)', () => {
    render(
      <Dark>
        <Stack data-testid="stack" gap="sm">Content</Stack>
      </Dark>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.gap).toBe('8px');
  });

  it('applies lg gap (16px)', () => {
    render(
      <Dark>
        <Stack data-testid="stack" gap="lg">Content</Stack>
      </Dark>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.gap).toBe('16px');
  });

  it('applies none gap (0px)', () => {
    render(
      <Dark>
        <Stack data-testid="stack" gap="none">Content</Stack>
      </Dark>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.gap).toBe('0');
  });

  it('applies xl gap (24px)', () => {
    render(
      <Dark>
        <Stack data-testid="stack" gap="xl">Content</Stack>
      </Dark>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.gap).toBe('24px');
  });
});

// ---------------------------------------------------------------------------
// Alignment
// ---------------------------------------------------------------------------

describe('Stack — align', () => {
  it('defaults to stretch', () => {
    render(
      <Dark>
        <Stack data-testid="stack">Content</Stack>
      </Dark>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.alignItems).toBe('stretch');
  });

  stackAligns.forEach((align) => {
    it(`renders align="${align}" without crashing`, () => {
      render(
        <Dark>
          <Stack align={align} data-testid={`stack-${align}`}>
            Content
          </Stack>
        </Dark>,
      );
      expect(screen.getByTestId(`stack-${align}`)).toBeInTheDocument();
    });
  });

  it('maps "start" to "flex-start"', () => {
    render(
      <Dark>
        <Stack align="start" data-testid="stack">Content</Stack>
      </Dark>,
    );
    expect(screen.getByTestId('stack').style.alignItems).toBe('flex-start');
  });

  it('maps "end" to "flex-end"', () => {
    render(
      <Dark>
        <Stack align="end" data-testid="stack">Content</Stack>
      </Dark>,
    );
    expect(screen.getByTestId('stack').style.alignItems).toBe('flex-end');
  });

  it('maps "center" to "center"', () => {
    render(
      <Dark>
        <Stack align="center" data-testid="stack">Content</Stack>
      </Dark>,
    );
    expect(screen.getByTestId('stack').style.alignItems).toBe('center');
  });

  it('maps "baseline" to "baseline"', () => {
    render(
      <Dark>
        <Stack align="baseline" data-testid="stack">Content</Stack>
      </Dark>,
    );
    expect(screen.getByTestId('stack').style.alignItems).toBe('baseline');
  });
});

// ---------------------------------------------------------------------------
// Justify
// ---------------------------------------------------------------------------

describe('Stack — justify', () => {
  it('defaults to start (flex-start)', () => {
    render(
      <Dark>
        <Stack data-testid="stack">Content</Stack>
      </Dark>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.justifyContent).toBe('flex-start');
  });

  stackJustifys.forEach((justify) => {
    it(`renders justify="${justify}" without crashing`, () => {
      render(
        <Dark>
          <Stack justify={justify} data-testid={`stack-${justify}`}>
            Content
          </Stack>
        </Dark>,
      );
      expect(screen.getByTestId(`stack-${justify}`)).toBeInTheDocument();
    });
  });

  it('maps "between" to "space-between"', () => {
    render(
      <Dark>
        <Stack justify="between" data-testid="stack">Content</Stack>
      </Dark>,
    );
    expect(screen.getByTestId('stack').style.justifyContent).toBe('space-between');
  });

  it('maps "around" to "space-around"', () => {
    render(
      <Dark>
        <Stack justify="around" data-testid="stack">Content</Stack>
      </Dark>,
    );
    expect(screen.getByTestId('stack').style.justifyContent).toBe('space-around');
  });

  it('maps "evenly" to "space-evenly"', () => {
    render(
      <Dark>
        <Stack justify="evenly" data-testid="stack">Content</Stack>
      </Dark>,
    );
    expect(screen.getByTestId('stack').style.justifyContent).toBe('space-evenly');
  });
});

// ---------------------------------------------------------------------------
// Wrap
// ---------------------------------------------------------------------------

describe('Stack — wrap', () => {
  it('defaults to nowrap', () => {
    render(
      <Dark>
        <Stack data-testid="stack">Content</Stack>
      </Dark>,
    );
    expect(screen.getByTestId('stack').style.flexWrap).toBe('nowrap');
  });

  it('applies wrap when wrap={true}', () => {
    render(
      <Dark>
        <Stack wrap data-testid="stack">Content</Stack>
      </Dark>,
    );
    expect(screen.getByTestId('stack').style.flexWrap).toBe('wrap');
  });
});

// ---------------------------------------------------------------------------
// Reverse
// ---------------------------------------------------------------------------

describe('Stack — reverse', () => {
  it('vertical + reverse produces column-reverse', () => {
    render(
      <Dark>
        <Stack reverse data-testid="stack">Content</Stack>
      </Dark>,
    );
    expect(screen.getByTestId('stack').style.flexDirection).toBe('column-reverse');
  });

  it('horizontal + reverse produces row-reverse', () => {
    render(
      <Dark>
        <Stack direction="horizontal" reverse data-testid="stack">Content</Stack>
      </Dark>,
    );
    expect(screen.getByTestId('stack').style.flexDirection).toBe('row-reverse');
  });
});

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------

describe('Stack — divider', () => {
  it('inserts dividers between children when divider={true}', () => {
    const { container } = render(
      <Dark>
        <Stack divider data-testid="stack">
          <span>A</span>
          <span>B</span>
          <span>C</span>
        </Stack>
      </Dark>,
    );
    const stack = screen.getByTestId('stack');
    // 3 children + 2 dividers = 5 elements
    expect(stack.children.length).toBe(5);
  });

  it('dividers have aria-hidden="true"', () => {
    const { container } = render(
      <Dark>
        <Stack divider data-testid="stack">
          <span>A</span>
          <span>B</span>
        </Stack>
      </Dark>,
    );
    const stack = screen.getByTestId('stack');
    const dividerEl = stack.children[1];
    expect(dividerEl).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not insert dividers when divider is not set', () => {
    render(
      <Dark>
        <Stack data-testid="stack">
          <span>A</span>
          <span>B</span>
          <span>C</span>
        </Stack>
      </Dark>,
    );
    const stack = screen.getByTestId('stack');
    expect(stack.children.length).toBe(3);
  });

  it('does not insert a divider when there is only one child', () => {
    render(
      <Dark>
        <Stack divider data-testid="stack">
          <span>Only</span>
        </Stack>
      </Dark>,
    );
    const stack = screen.getByTestId('stack');
    expect(stack.children.length).toBe(1);
  });

  it('vertical divider uses border-top', () => {
    const { container } = render(
      <Dark>
        <Stack divider direction="vertical" data-testid="stack">
          <span>A</span>
          <span>B</span>
        </Stack>
      </Dark>,
    );
    const stack = screen.getByTestId('stack');
    const dividerEl = stack.children[1] as HTMLElement;
    expect(dividerEl.style.borderTop).toBeTruthy();
  });

  it('horizontal divider uses border-left', () => {
    const { container } = render(
      <Dark>
        <Stack divider direction="horizontal" data-testid="stack">
          <span>A</span>
          <span>B</span>
        </Stack>
      </Dark>,
    );
    const stack = screen.getByTestId('stack');
    const dividerEl = stack.children[1] as HTMLElement;
    expect(dividerEl.style.borderLeft).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Polymorphic `as` prop
// ---------------------------------------------------------------------------

describe('Stack — as prop', () => {
  it('renders as a section when as="section"', () => {
    render(
      <Dark>
        <Stack as="section" data-testid="stack">Content</Stack>
      </Dark>,
    );
    expect(screen.getByTestId('stack').tagName).toBe('SECTION');
  });

  it('renders as a nav when as="nav"', () => {
    render(
      <Dark>
        <Stack as="nav" data-testid="stack">Content</Stack>
      </Dark>,
    );
    expect(screen.getByTestId('stack').tagName).toBe('NAV');
  });

  it('renders as a ul when as="ul"', () => {
    render(
      <Dark>
        <Stack as="ul" data-testid="stack">
          <li>Item</li>
        </Stack>
      </Dark>,
    );
    expect(screen.getByTestId('stack').tagName).toBe('UL');
  });
});

// ---------------------------------------------------------------------------
// className and style passthrough
// ---------------------------------------------------------------------------

describe('Stack — className and style passthrough', () => {
  it('passes className through', () => {
    render(
      <Dark>
        <Stack className="custom-class" data-testid="stack">Content</Stack>
      </Dark>,
    );
    expect(screen.getByTestId('stack')).toHaveClass('custom-class');
  });

  it('merges user style with computed style', () => {
    render(
      <Dark>
        <Stack style={{ opacity: 0.5 }} data-testid="stack">Content</Stack>
      </Dark>,
    );
    const el = screen.getByTestId('stack');
    // User style is merged (opacity)
    expect(el.style.opacity).toBe('0.5');
    // Computed style is still present (display: flex)
    expect(el.style.display).toBe('flex');
  });

  it('user style overrides computed style', () => {
    render(
      <Dark>
        <Stack style={{ display: 'grid' }} data-testid="stack">Content</Stack>
      </Dark>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.display).toBe('grid');
  });

  it('forwards additional HTML attributes', () => {
    render(
      <Dark>
        <Stack id="my-stack" data-testid="stack" aria-label="stack layout">
          Content
        </Stack>
      </Dark>,
    );
    const el = screen.getByTestId('stack');
    expect(el).toHaveAttribute('id', 'my-stack');
    expect(el).toHaveAttribute('aria-label', 'stack layout');
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('Stack — ref forwarding', () => {
  it('forwards ref to the root element', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Dark>
        <Stack ref={ref} data-testid="stack">Content</Stack>
      </Dark>,
    );
    expect(ref.current).toBe(screen.getByTestId('stack'));
  });
});

// ---------------------------------------------------------------------------
// Display name
// ---------------------------------------------------------------------------

describe('Stack — displayName', () => {
  it('Stack has correct displayName', () => {
    expect(Stack.displayName).toBe('Stack');
  });

  it('HStack has correct displayName', () => {
    expect(HStack.displayName).toBe('HStack');
  });

  it('VStack has correct displayName', () => {
    expect(VStack.displayName).toBe('VStack');
  });
});

// ---------------------------------------------------------------------------
// HStack
// ---------------------------------------------------------------------------

describe('HStack', () => {
  it('renders with horizontal direction (flex-direction: row)', () => {
    render(
      <Dark>
        <HStack data-testid="hstack">Content</HStack>
      </Dark>,
    );
    const el = screen.getByTestId('hstack');
    expect(el.style.flexDirection).toBe('row');
  });

  it('forwards gap prop', () => {
    render(
      <Dark>
        <HStack gap="lg" data-testid="hstack">Content</HStack>
      </Dark>,
    );
    expect(screen.getByTestId('hstack').style.gap).toBe('16px');
  });

  it('forwards align prop', () => {
    render(
      <Dark>
        <HStack align="center" data-testid="hstack">Content</HStack>
      </Dark>,
    );
    expect(screen.getByTestId('hstack').style.alignItems).toBe('center');
  });

  it('forwards justify prop', () => {
    render(
      <Dark>
        <HStack justify="between" data-testid="hstack">Content</HStack>
      </Dark>,
    );
    expect(screen.getByTestId('hstack').style.justifyContent).toBe('space-between');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Dark>
        <HStack ref={ref} data-testid="hstack">Content</HStack>
      </Dark>,
    );
    expect(ref.current).toBe(screen.getByTestId('hstack'));
  });

  it('forwards className', () => {
    render(
      <Dark>
        <HStack className="h-custom" data-testid="hstack">Content</HStack>
      </Dark>,
    );
    expect(screen.getByTestId('hstack')).toHaveClass('h-custom');
  });

  it('supports reverse', () => {
    render(
      <Dark>
        <HStack reverse data-testid="hstack">Content</HStack>
      </Dark>,
    );
    expect(screen.getByTestId('hstack').style.flexDirection).toBe('row-reverse');
  });
});

// ---------------------------------------------------------------------------
// VStack
// ---------------------------------------------------------------------------

describe('VStack', () => {
  it('renders with vertical direction (flex-direction: column)', () => {
    render(
      <Dark>
        <VStack data-testid="vstack">Content</VStack>
      </Dark>,
    );
    const el = screen.getByTestId('vstack');
    expect(el.style.flexDirection).toBe('column');
  });

  it('forwards gap prop', () => {
    render(
      <Dark>
        <VStack gap="xl" data-testid="vstack">Content</VStack>
      </Dark>,
    );
    expect(screen.getByTestId('vstack').style.gap).toBe('24px');
  });

  it('forwards align prop', () => {
    render(
      <Dark>
        <VStack align="center" data-testid="vstack">Content</VStack>
      </Dark>,
    );
    expect(screen.getByTestId('vstack').style.alignItems).toBe('center');
  });

  it('forwards justify prop', () => {
    render(
      <Dark>
        <VStack justify="end" data-testid="vstack">Content</VStack>
      </Dark>,
    );
    expect(screen.getByTestId('vstack').style.justifyContent).toBe('flex-end');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Dark>
        <VStack ref={ref} data-testid="vstack">Content</VStack>
      </Dark>,
    );
    expect(ref.current).toBe(screen.getByTestId('vstack'));
  });

  it('forwards className', () => {
    render(
      <Dark>
        <VStack className="v-custom" data-testid="vstack">Content</VStack>
      </Dark>,
    );
    expect(screen.getByTestId('vstack')).toHaveClass('v-custom');
  });

  it('supports reverse', () => {
    render(
      <Dark>
        <VStack reverse data-testid="vstack">Content</VStack>
      </Dark>,
    );
    expect(screen.getByTestId('vstack').style.flexDirection).toBe('column-reverse');
  });
});
