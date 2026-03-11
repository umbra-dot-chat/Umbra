/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton } from './Skeleton';
import { WispProvider } from '../../providers';

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

describe('Skeleton - rendering', () => {
  it('renders a div element', () => {
    const { container } = render(<Wrap><Skeleton /></Wrap>);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeTruthy();
    expect(el.tagName).toBe('DIV');
  });

  it('always has aria-hidden="true"', () => {
    const { container } = render(<Wrap><Skeleton /></Wrap>);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('spreads additional HTML attributes', () => {
    const { container } = render(<Wrap><Skeleton data-testid="skel" /></Wrap>);
    expect(container.querySelector('[data-testid="skel"]')).toBeTruthy();
  });

  it('merges user style', () => {
    const { container } = render(<Wrap><Skeleton style={{ marginTop: 20 }} /></Wrap>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.marginTop).toBe('20px');
  });
});

describe('Skeleton - variants', () => {
  it('renders rectangular by default', () => {
    const { container } = render(<Wrap><Skeleton width={200} height={100} /></Wrap>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('200px');
    expect(el.style.height).toBe('100px');
    expect(el.style.borderRadius).toBe('8px');
  });

  it('renders circular with 50% border-radius', () => {
    const { container } = render(<Wrap><Skeleton variant="circular" width={48} /></Wrap>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.borderRadius).toBe('50%');
    expect(el.style.width).toBe('48px');
    expect(el.style.height).toBe('48px');
  });

  it('renders text variant with multiple line divs', () => {
    const { container } = render(<Wrap><Skeleton variant="text" lines={4} /></Wrap>);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.children.length).toBe(4);
  });
});

describe('Skeleton - dimensions', () => {
  it('accepts string width/height', () => {
    const { container } = render(<Wrap><Skeleton width="50%" height="10rem" /></Wrap>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('50%');
    expect(el.style.height).toBe('10rem');
  });

  it('accepts numeric width/height', () => {
    const { container } = render(<Wrap><Skeleton width={120} height={60} /></Wrap>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('120px');
    expect(el.style.height).toBe('60px');
  });
});

describe('Skeleton - text lines', () => {
  it('renders default 3 lines', () => {
    const { container } = render(<Wrap><Skeleton variant="text" /></Wrap>);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.children.length).toBe(3);
  });

  it('last line of multi-line text is 60% width', () => {
    const { container } = render(<Wrap><Skeleton variant="text" lines={3} /></Wrap>);
    const wrapper = container.firstChild as HTMLElement;
    const lastLine = wrapper.children[2] as HTMLElement;
    expect(lastLine.style.width).toBe('60%');
  });

  it('single text line is 100% width', () => {
    const { container } = render(<Wrap><Skeleton variant="text" lines={1} /></Wrap>);
    const wrapper = container.firstChild as HTMLElement;
    const line = wrapper.children[0] as HTMLElement;
    expect(line.style.width).toBe('100%');
  });

  it('applies custom lineHeight', () => {
    const { container } = render(<Wrap><Skeleton variant="text" lines={2} lineHeight={24} /></Wrap>);
    const wrapper = container.firstChild as HTMLElement;
    const line = wrapper.children[0] as HTMLElement;
    expect(line.style.height).toBe('24px');
  });

  it('applies custom lineSpacing', () => {
    const { container } = render(<Wrap><Skeleton variant="text" lines={2} lineSpacing={12} /></Wrap>);
    const wrapper = container.firstChild as HTMLElement;
    const firstLine = wrapper.children[0] as HTMLElement;
    expect(firstLine.style.marginBottom).toBe('12px');
  });
});

describe('Skeleton - animation', () => {
  it('applies pulse animation by default', () => {
    const { container } = render(<Wrap><Skeleton /></Wrap>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.animation).toContain('wisp-skeleton-pulse');
  });

  it('applies wave animation', () => {
    const { container } = render(<Wrap><Skeleton animation="wave" /></Wrap>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.overflow).toBe('hidden');
    const shimmer = el.querySelector('div');
    expect(shimmer).toBeTruthy();
    expect(shimmer!.style.animation).toContain('wisp-skeleton-wave');
  });

  it('applies no animation when set to none', () => {
    const { container } = render(<Wrap><Skeleton animation="none" /></Wrap>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.animation).toBe('');
  });
});

describe('Skeleton - aria-hidden', () => {
  it('rectangular has aria-hidden', () => {
    const { container } = render(<Wrap><Skeleton /></Wrap>);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('circular has aria-hidden', () => {
    const { container } = render(<Wrap><Skeleton variant="circular" /></Wrap>);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('text has aria-hidden', () => {
    const { container } = render(<Wrap><Skeleton variant="text" /></Wrap>);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});
