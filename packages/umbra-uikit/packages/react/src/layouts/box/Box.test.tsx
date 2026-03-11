/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React, { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Box } from './Box';
import { spacingKeys, radiiKeys } from '@coexist/wisp-core/types/Box.types';
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

describe('Box — rendering', () => {
  it('renders children text', () => {
    render(
      <Dark>
        <Box>Hello Box</Box>
      </Dark>,
    );
    expect(screen.getByText('Hello Box')).toBeInTheDocument();
  });

  it('renders as a div by default', () => {
    render(
      <Dark>
        <Box data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').tagName).toBe('DIV');
  });

  it('renders in light mode without crashing', () => {
    render(
      <Light>
        <Box data-testid="box-light">Content</Box>
      </Light>,
    );
    expect(screen.getByTestId('box-light')).toBeInTheDocument();
  });

  it('renders with no children without crashing', () => {
    render(
      <Dark>
        <Box data-testid="empty-box" />
      </Dark>,
    );
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Polymorphic `as` prop
// ---------------------------------------------------------------------------

describe('Box — as prop', () => {
  it('renders as a section when as="section"', () => {
    render(
      <Dark>
        <Box as="section" data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').tagName).toBe('SECTION');
  });

  it('renders as a nav when as="nav"', () => {
    render(
      <Dark>
        <Box as="nav" data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').tagName).toBe('NAV');
  });

  it('renders as a span when as="span"', () => {
    render(
      <Dark>
        <Box as="span" data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').tagName).toBe('SPAN');
  });

  it('renders as an article when as="article"', () => {
    render(
      <Dark>
        <Box as="article" data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').tagName).toBe('ARTICLE');
  });
});

// ---------------------------------------------------------------------------
// Padding — shorthand `p`
// ---------------------------------------------------------------------------

describe('Box — padding (p shorthand)', () => {
  it('applies p="md" (12px) to all sides', () => {
    render(
      <Dark>
        <Box p="md" data-testid="box">Content</Box>
      </Dark>,
    );
    const el = screen.getByTestId('box');
    expect(el.style.paddingTop).toBe('12px');
    expect(el.style.paddingRight).toBe('12px');
    expect(el.style.paddingBottom).toBe('12px');
    expect(el.style.paddingLeft).toBe('12px');
  });

  it('applies p="none" (0px) to all sides', () => {
    render(
      <Dark>
        <Box p="none" data-testid="box">Content</Box>
      </Dark>,
    );
    const el = screen.getByTestId('box');
    expect(el.style.paddingTop).toBe('0px');
    expect(el.style.paddingRight).toBe('0px');
    expect(el.style.paddingBottom).toBe('0px');
    expect(el.style.paddingLeft).toBe('0px');
  });

  it('applies p="lg" (16px) to all sides', () => {
    render(
      <Dark>
        <Box p="lg" data-testid="box">Content</Box>
      </Dark>,
    );
    const el = screen.getByTestId('box');
    expect(el.style.paddingTop).toBe('16px');
    expect(el.style.paddingRight).toBe('16px');
    expect(el.style.paddingBottom).toBe('16px');
    expect(el.style.paddingLeft).toBe('16px');
  });

  spacingKeys.forEach((key) => {
    it(`renders p="${key}" without crashing`, () => {
      render(
        <Dark>
          <Box p={key} data-testid={`box-${key}`}>Content</Box>
        </Dark>,
      );
      expect(screen.getByTestId(`box-${key}`)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Padding — axis (px, py)
// ---------------------------------------------------------------------------

describe('Box — padding (px, py)', () => {
  it('applies px="lg" (16px) to left and right', () => {
    render(
      <Dark>
        <Box px="lg" data-testid="box">Content</Box>
      </Dark>,
    );
    const el = screen.getByTestId('box');
    expect(el.style.paddingLeft).toBe('16px');
    expect(el.style.paddingRight).toBe('16px');
    // Top and bottom should not be set
    expect(el.style.paddingTop).toBe('');
    expect(el.style.paddingBottom).toBe('');
  });

  it('applies py="xl" (24px) to top and bottom', () => {
    render(
      <Dark>
        <Box py="xl" data-testid="box">Content</Box>
      </Dark>,
    );
    const el = screen.getByTestId('box');
    expect(el.style.paddingTop).toBe('24px');
    expect(el.style.paddingBottom).toBe('24px');
    // Left and right should not be set
    expect(el.style.paddingLeft).toBe('');
    expect(el.style.paddingRight).toBe('');
  });

  it('px and py can be combined', () => {
    render(
      <Dark>
        <Box px="sm" py="lg" data-testid="box">Content</Box>
      </Dark>,
    );
    const el = screen.getByTestId('box');
    expect(el.style.paddingLeft).toBe('8px');
    expect(el.style.paddingRight).toBe('8px');
    expect(el.style.paddingTop).toBe('16px');
    expect(el.style.paddingBottom).toBe('16px');
  });
});

// ---------------------------------------------------------------------------
// Padding — side-specific (pt, pr, pb, pl)
// ---------------------------------------------------------------------------

describe('Box — padding (side-specific)', () => {
  it('applies pt="xl" (24px) only to top', () => {
    render(
      <Dark>
        <Box pt="xl" data-testid="box">Content</Box>
      </Dark>,
    );
    const el = screen.getByTestId('box');
    expect(el.style.paddingTop).toBe('24px');
    expect(el.style.paddingRight).toBe('');
    expect(el.style.paddingBottom).toBe('');
    expect(el.style.paddingLeft).toBe('');
  });

  it('applies pr="sm" (8px) only to right', () => {
    render(
      <Dark>
        <Box pr="sm" data-testid="box">Content</Box>
      </Dark>,
    );
    const el = screen.getByTestId('box');
    expect(el.style.paddingRight).toBe('8px');
  });

  it('applies pb="lg" (16px) only to bottom', () => {
    render(
      <Dark>
        <Box pb="lg" data-testid="box">Content</Box>
      </Dark>,
    );
    const el = screen.getByTestId('box');
    expect(el.style.paddingBottom).toBe('16px');
  });

  it('applies pl="xs" (4px) only to left', () => {
    render(
      <Dark>
        <Box pl="xs" data-testid="box">Content</Box>
      </Dark>,
    );
    const el = screen.getByTestId('box');
    expect(el.style.paddingLeft).toBe('4px');
  });
});

// ---------------------------------------------------------------------------
// Padding — resolution order (specific > axis > shorthand)
// ---------------------------------------------------------------------------

describe('Box — padding resolution order', () => {
  it('side-specific overrides axis', () => {
    render(
      <Dark>
        <Box py="sm" pt="xl" data-testid="box">Content</Box>
      </Dark>,
    );
    const el = screen.getByTestId('box');
    // pt overrides py for top
    expect(el.style.paddingTop).toBe('24px');
    // py still applies for bottom
    expect(el.style.paddingBottom).toBe('8px');
  });

  it('axis overrides shorthand', () => {
    render(
      <Dark>
        <Box p="sm" px="xl" data-testid="box">Content</Box>
      </Dark>,
    );
    const el = screen.getByTestId('box');
    // px overrides p for left/right
    expect(el.style.paddingLeft).toBe('24px');
    expect(el.style.paddingRight).toBe('24px');
    // p still applies for top/bottom
    expect(el.style.paddingTop).toBe('8px');
    expect(el.style.paddingBottom).toBe('8px');
  });

  it('side-specific overrides shorthand', () => {
    render(
      <Dark>
        <Box p="sm" pl="xl" data-testid="box">Content</Box>
      </Dark>,
    );
    const el = screen.getByTestId('box');
    // pl overrides p for left
    expect(el.style.paddingLeft).toBe('24px');
    // p still applies for the rest
    expect(el.style.paddingTop).toBe('8px');
    expect(el.style.paddingRight).toBe('8px');
    expect(el.style.paddingBottom).toBe('8px');
  });

  it('full cascade: p < px < pl', () => {
    render(
      <Dark>
        <Box p="xs" px="lg" pl="xl" data-testid="box">Content</Box>
      </Dark>,
    );
    const el = screen.getByTestId('box');
    // pl wins over px for left
    expect(el.style.paddingLeft).toBe('24px');
    // px wins over p for right
    expect(el.style.paddingRight).toBe('16px');
    // p applies for top/bottom (no py or pt/pb)
    expect(el.style.paddingTop).toBe('4px');
    expect(el.style.paddingBottom).toBe('4px');
  });
});

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

describe('Box — display', () => {
  it('does not set display when not specified', () => {
    render(
      <Dark>
        <Box data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.display).toBe('');
  });

  it('applies display="flex"', () => {
    render(
      <Dark>
        <Box display="flex" data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.display).toBe('flex');
  });

  it('applies display="grid"', () => {
    render(
      <Dark>
        <Box display="grid" data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.display).toBe('grid');
  });

  it('applies display="none"', () => {
    render(
      <Dark>
        <Box display="none" data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.display).toBe('none');
  });

  it('applies display="inline-flex"', () => {
    render(
      <Dark>
        <Box display="inline-flex" data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.display).toBe('inline-flex');
  });

  it('applies display="inline"', () => {
    render(
      <Dark>
        <Box display="inline" data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.display).toBe('inline');
  });

  it('applies display="block"', () => {
    render(
      <Dark>
        <Box display="block" data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.display).toBe('block');
  });
});

// ---------------------------------------------------------------------------
// Position
// ---------------------------------------------------------------------------

describe('Box — position', () => {
  it('does not set position when not specified', () => {
    render(
      <Dark>
        <Box data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.position).toBe('');
  });

  it('applies position="relative"', () => {
    render(
      <Dark>
        <Box position="relative" data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.position).toBe('relative');
  });

  it('applies position="absolute"', () => {
    render(
      <Dark>
        <Box position="absolute" data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.position).toBe('absolute');
  });

  it('applies position="fixed"', () => {
    render(
      <Dark>
        <Box position="fixed" data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.position).toBe('fixed');
  });

  it('applies position="sticky"', () => {
    render(
      <Dark>
        <Box position="sticky" data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.position).toBe('sticky');
  });
});

// ---------------------------------------------------------------------------
// Sizing
// ---------------------------------------------------------------------------

describe('Box — sizing', () => {
  it('applies width as number (pixels)', () => {
    render(
      <Dark>
        <Box width={200} data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.width).toBe('200px');
  });

  it('applies width as string', () => {
    render(
      <Dark>
        <Box width="50%" data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.width).toBe('50%');
  });

  it('applies height as number (pixels)', () => {
    render(
      <Dark>
        <Box height={100} data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.height).toBe('100px');
  });

  it('applies height as string', () => {
    render(
      <Dark>
        <Box height="100vh" data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.height).toBe('100vh');
  });

  it('applies minWidth as number', () => {
    render(
      <Dark>
        <Box minWidth={100} data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.minWidth).toBe('100px');
  });

  it('applies maxWidth as string', () => {
    render(
      <Dark>
        <Box maxWidth="800px" data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.maxWidth).toBe('800px');
  });

  it('applies minHeight as number', () => {
    render(
      <Dark>
        <Box minHeight={50} data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.minHeight).toBe('50px');
  });

  it('applies maxHeight as string', () => {
    render(
      <Dark>
        <Box maxHeight="600px" data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.maxHeight).toBe('600px');
  });

  it('does not set sizing props when not specified', () => {
    render(
      <Dark>
        <Box data-testid="box">Content</Box>
      </Dark>,
    );
    const el = screen.getByTestId('box');
    expect(el.style.width).toBe('');
    expect(el.style.height).toBe('');
    expect(el.style.minWidth).toBe('');
    expect(el.style.maxWidth).toBe('');
    expect(el.style.minHeight).toBe('');
    expect(el.style.maxHeight).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Border radius
// ---------------------------------------------------------------------------

describe('Box — radius', () => {
  it('does not set border-radius when not specified', () => {
    render(
      <Dark>
        <Box data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.borderRadius).toBe('');
  });

  it('applies radius="md" (8px)', () => {
    render(
      <Dark>
        <Box radius="md" data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.borderRadius).toBe('8px');
  });

  it('applies radius="full" (9999px)', () => {
    render(
      <Dark>
        <Box radius="full" data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box').style.borderRadius).toBe('9999px');
  });

  it('applies radius="none" (0px)', () => {
    render(
      <Dark>
        <Box radius="none" data-testid="box">Content</Box>
      </Dark>,
    );
    // 0 may render as '0' or '0px'
    const br = screen.getByTestId('box').style.borderRadius;
    expect(br === '0' || br === '0px').toBe(true);
  });

  radiiKeys.forEach((key) => {
    it(`renders radius="${key}" without crashing`, () => {
      render(
        <Dark>
          <Box radius={key} data-testid={`box-${key}`}>Content</Box>
        </Dark>,
      );
      expect(screen.getByTestId(`box-${key}`)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// className and style passthrough
// ---------------------------------------------------------------------------

describe('Box — className and style passthrough', () => {
  it('passes className through', () => {
    render(
      <Dark>
        <Box className="custom-class" data-testid="box">Content</Box>
      </Dark>,
    );
    expect(screen.getByTestId('box')).toHaveClass('custom-class');
  });

  it('merges user style with computed style', () => {
    render(
      <Dark>
        <Box p="md" style={{ opacity: 0.5 }} data-testid="box">Content</Box>
      </Dark>,
    );
    const el = screen.getByTestId('box');
    // User style is merged
    expect(el.style.opacity).toBe('0.5');
    // Computed padding is still present
    expect(el.style.paddingTop).toBe('12px');
  });

  it('user style overrides computed style', () => {
    render(
      <Dark>
        <Box p="md" style={{ paddingTop: '999px' }} data-testid="box">Content</Box>
      </Dark>,
    );
    const el = screen.getByTestId('box');
    // User style wins
    expect(el.style.paddingTop).toBe('999px');
  });

  it('forwards additional HTML attributes', () => {
    render(
      <Dark>
        <Box id="my-box" data-testid="box" aria-label="box layout">
          Content
        </Box>
      </Dark>,
    );
    const el = screen.getByTestId('box');
    expect(el).toHaveAttribute('id', 'my-box');
    expect(el).toHaveAttribute('aria-label', 'box layout');
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('Box — ref forwarding', () => {
  it('forwards ref to the root element', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Dark>
        <Box ref={ref} data-testid="box">Content</Box>
      </Dark>,
    );
    expect(ref.current).toBe(screen.getByTestId('box'));
  });

  it('forwards ref with polymorphic as', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Dark>
        <Box as="section" ref={ref} data-testid="box">Content</Box>
      </Dark>,
    );
    expect(ref.current).toBe(screen.getByTestId('box'));
    expect(ref.current?.tagName).toBe('SECTION');
  });
});

// ---------------------------------------------------------------------------
// Display name
// ---------------------------------------------------------------------------

describe('Box — displayName', () => {
  it('has correct displayName', () => {
    expect(Box.displayName).toBe('Box');
  });
});
