/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Image } from './Image';
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

describe('Image — rendering', () => {
  it('renders wrapper with role="img"', () => {
    const { container } = render(
      <Dark>
        <Image src="/photo.jpg" alt="Test image" />
      </Dark>,
    );
    const wrapper = container.querySelector('[role="img"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('uses alt as aria-label on wrapper', () => {
    const { container } = render(
      <Dark>
        <Image src="/photo.jpg" alt="Landscape" />
      </Dark>,
    );
    const wrapper = container.querySelector('[role="img"]');
    expect(wrapper).toHaveAttribute('aria-label', 'Landscape');
  });

  it('renders an <img> element when src is provided', () => {
    const { container } = render(
      <Dark>
        <Image src="/photo.jpg" alt="Test" />
      </Dark>,
    );
    expect(container.querySelector('img')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Radius
// ---------------------------------------------------------------------------

describe('Image — radius', () => {
  (['none', 'sm', 'md', 'lg', 'xl', 'full'] as const).forEach((radius) => {
    it(`renders radius="${radius}" without crashing`, () => {
      const { container } = render(
        <Dark>
          <Image src="/photo.jpg" alt="Test" radius={radius} />
        </Dark>,
      );
      expect(container.querySelector('[role="img"]')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Error fallback
// ---------------------------------------------------------------------------

describe('Image — error fallback', () => {
  it('shows default fallback on error', () => {
    const { container } = render(
      <Dark>
        <Image src="/bad.jpg" alt="Broken" />
      </Dark>,
    );

    const img = container.querySelector('img');
    if (img) fireEvent.error(img);

    // After error, the <img> should be gone
    expect(container.querySelector('img')).toBeNull();
  });

  it('shows custom fallback on error', () => {
    const { container } = render(
      <Dark>
        <Image src="/bad.jpg" alt="Broken" fallback={<span>No image</span>} />
      </Dark>,
    );

    const img = container.querySelector('img');
    if (img) fireEvent.error(img);

    expect(screen.getByText('No image')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('Image — skeleton', () => {
  it('renders skeleton overlay when skeleton=true and loading', () => {
    const { container } = render(
      <Dark>
        <Image src="/photo.jpg" alt="Test" skeleton />
      </Dark>,
    );
    const skeletonEl = container.querySelector('[aria-hidden]');
    expect(skeletonEl).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Lazy loading
// ---------------------------------------------------------------------------

describe('Image — lazy loading', () => {
  it('sets loading="lazy" by default', () => {
    const { container } = render(
      <Dark>
        <Image src="/photo.jpg" alt="Test" />
      </Dark>,
    );
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy');
  });

  it('omits loading attribute when lazy=false', () => {
    const { container } = render(
      <Dark>
        <Image src="/photo.jpg" alt="Test" lazy={false} />
      </Dark>,
    );
    expect(container.querySelector('img')).not.toHaveAttribute('loading');
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('Image — className', () => {
  it('passes className through to the wrapper', () => {
    const { container } = render(
      <Dark>
        <Image src="/photo.jpg" alt="Test" className="custom-image" />
      </Dark>,
    );
    expect(container.querySelector('.custom-image')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('Image — ref forwarding', () => {
  it('forwards ref to the wrapper div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Image ref={ref} src="/photo.jpg" alt="Test" />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
