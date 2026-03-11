/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Spacer } from './Spacer';
import { spacerSizes } from '@coexist/wisp-core/types/Spacer.types';
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
// Helper — get the root div
// ---------------------------------------------------------------------------

function renderSpacer(props: React.ComponentProps<typeof Spacer> = {}) {
  const ref = React.createRef<HTMLDivElement>();
  const result = render(
    <Dark>
      <Spacer ref={ref} {...props} />
    </Dark>,
  );
  return { ref, ...result };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Spacer — rendering', () => {
  it('renders without crashing', () => {
    const { ref } = renderSpacer();
    expect(ref.current).toBeInTheDocument();
  });

  it('renders a div element', () => {
    const { ref } = renderSpacer();
    expect(ref.current?.tagName).toBe('DIV');
  });

  it('renders in light mode without crashing', () => {
    const ref = React.createRef<HTMLDivElement>();
    const { container } = render(
      <Light>
        <Spacer ref={ref} />
      </Light>,
    );
    expect(ref.current).toBeInTheDocument();
  });

  it('renders aria-hidden="true"', () => {
    const { ref } = renderSpacer();
    expect(ref.current).toHaveAttribute('aria-hidden', 'true');
  });
});

// ---------------------------------------------------------------------------
// Default (no props) — fallback zero-size spacer
// ---------------------------------------------------------------------------

describe('Spacer — default (no props)', () => {
  it('has width: 0 when no size or flex is provided', () => {
    const { ref } = renderSpacer();
    expect(ref.current?.style.width).toBe('0px');
  });

  it('has height: 0 when no size or flex is provided', () => {
    const { ref } = renderSpacer();
    expect(ref.current?.style.height).toBe('0px');
  });

  it('has flexShrink: 0', () => {
    const { ref } = renderSpacer();
    expect(ref.current?.style.flexShrink).toBe('0');
  });
});

// ---------------------------------------------------------------------------
// Fixed size via theme spacing tokens
// ---------------------------------------------------------------------------

describe('Spacer — size prop', () => {
  const expectedSizes: Record<string, number> = {
    none: 0,
    '2xs': 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
    '4xl': 64,
  };

  spacerSizes.forEach((size) => {
    it(`renders size="${size}" with width and height of ${expectedSizes[size]}px`, () => {
      const { ref } = renderSpacer({ size });
      const px = `${expectedSizes[size]}px`;
      expect(ref.current?.style.width).toBe(px);
      expect(ref.current?.style.height).toBe(px);
    });
  });

  it('sets flexShrink: 0 for fixed-size spacers', () => {
    const { ref } = renderSpacer({ size: 'md' });
    expect(ref.current?.style.flexShrink).toBe('0');
  });
});

// ---------------------------------------------------------------------------
// Flexible spacer via flex prop
// ---------------------------------------------------------------------------

describe('Spacer — flex prop', () => {
  it('flex={true} produces flexGrow: 1', () => {
    const { ref } = renderSpacer({ flex: true });
    expect(ref.current?.style.flexGrow).toBe('1');
  });

  it('flex={2} produces flexGrow: 2', () => {
    const { ref } = renderSpacer({ flex: 2 });
    expect(ref.current?.style.flexGrow).toBe('2');
  });

  it('flex={3} produces flexGrow: 3', () => {
    const { ref } = renderSpacer({ flex: 3 });
    expect(ref.current?.style.flexGrow).toBe('3');
  });

  it('flex spacer has flexShrink: 0', () => {
    const { ref } = renderSpacer({ flex: true });
    expect(ref.current?.style.flexShrink).toBe('0');
  });

  it('flex spacer does not set width or height', () => {
    const { ref } = renderSpacer({ flex: true });
    expect(ref.current?.style.width).toBe('');
    expect(ref.current?.style.height).toBe('');
  });

  it('flex={false} does not activate flex mode (falls back to default)', () => {
    const { ref } = renderSpacer({ flex: false });
    // flexGrow should not be set (defaults to empty or 0)
    expect(ref.current?.style.flexGrow).toBe('');
    expect(ref.current?.style.width).toBe('0px');
    expect(ref.current?.style.height).toBe('0px');
  });
});

// ---------------------------------------------------------------------------
// Flex takes precedence over size
// ---------------------------------------------------------------------------

describe('Spacer — flex precedence over size', () => {
  it('when both flex and size are provided, flex takes precedence', () => {
    const { ref } = renderSpacer({ size: 'lg', flex: true });
    expect(ref.current?.style.flexGrow).toBe('1');
    // Should not have fixed width/height from size
    expect(ref.current?.style.width).toBe('');
    expect(ref.current?.style.height).toBe('');
  });

  it('when flex is a number and size is provided, flex takes precedence', () => {
    const { ref } = renderSpacer({ size: 'xl', flex: 2 });
    expect(ref.current?.style.flexGrow).toBe('2');
    expect(ref.current?.style.width).toBe('');
    expect(ref.current?.style.height).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('Spacer — style merge', () => {
  it('merges user style with computed spacer style', () => {
    const { ref } = renderSpacer({
      size: 'md',
      style: { backgroundColor: 'red' },
    });
    expect(ref.current?.style.backgroundColor).toBe('red');
    // Computed styles should still be present
    expect(ref.current?.style.width).toBe('12px');
    expect(ref.current?.style.height).toBe('12px');
  });

  it('user style takes precedence over computed style', () => {
    const { ref } = renderSpacer({
      size: 'lg',
      style: { width: '100px' },
    });
    expect(ref.current?.style.width).toBe('100px');
  });

  it('user style merges with flex spacer style', () => {
    const { ref } = renderSpacer({
      flex: true,
      style: { opacity: '0.5' },
    });
    expect(ref.current?.style.opacity).toBe('0.5');
    expect(ref.current?.style.flexGrow).toBe('1');
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('Spacer — ref forwarding', () => {
  it('forwards ref to the root div', () => {
    const { ref } = renderSpacer();
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('ref points to the correct DOM node', () => {
    const ref = React.createRef<HTMLDivElement>();
    const { container } = render(
      <Dark>
        <Spacer ref={ref} />
      </Dark>,
    );
    const spacerEl = container.querySelector('[aria-hidden="true"]');
    expect(ref.current).toBe(spacerEl);
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('Spacer — accessibility', () => {
  it('is hidden from the accessibility tree via aria-hidden', () => {
    const { ref } = renderSpacer();
    expect(ref.current).toHaveAttribute('aria-hidden', 'true');
  });

  it('remains aria-hidden with size prop', () => {
    const { ref } = renderSpacer({ size: 'lg' });
    expect(ref.current).toHaveAttribute('aria-hidden', 'true');
  });

  it('remains aria-hidden with flex prop', () => {
    const { ref } = renderSpacer({ flex: true });
    expect(ref.current).toHaveAttribute('aria-hidden', 'true');
  });
});
