/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemberStatusDisplay } from './MemberStatusDisplay';
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

describe('MemberStatusDisplay -- rendering', () => {
  it('renders text', () => {
    render(
      <Dark>
        <MemberStatusDisplay text="In a meeting" />
      </Dark>,
    );
    expect(screen.getByText('In a meeting')).toBeInTheDocument();
  });

  it('renders emoji', () => {
    const { container } = render(
      <Dark>
        <MemberStatusDisplay emoji={'\u{1F3AE}'} />
      </Dark>,
    );
    // The emoji span has aria-hidden="true", so use container query
    const emojiSpan = container.querySelector('[aria-hidden="true"]');
    expect(emojiSpan).toBeTruthy();
    expect(emojiSpan?.textContent?.codePointAt(0)).toBe(0x1F3AE);
  });

  it('renders both emoji and text', () => {
    const { container } = render(
      <Dark>
        <MemberStatusDisplay emoji={'\u{1F3AE}'} text="Playing" />
      </Dark>,
    );
    // The emoji span has aria-hidden="true", so use container query
    const emojiSpan = container.querySelector('[aria-hidden="true"]');
    expect(emojiSpan).toBeTruthy();
    expect(emojiSpan?.textContent?.codePointAt(0)).toBe(0x1F3AE);
    expect(screen.getByText('Playing')).toBeInTheDocument();
  });

  it('returns null when both text and emoji are empty', () => {
    const { container } = render(
      <Dark>
        <MemberStatusDisplay />
      </Dark>,
    );
    expect(container.querySelector('span')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Aria
// ---------------------------------------------------------------------------

describe('MemberStatusDisplay -- accessibility', () => {
  it('has aria-label combining emoji and text', () => {
    const { container } = render(
      <Dark>
        <MemberStatusDisplay emoji={'\u{1F3AE}'} text="Playing" />
      </Dark>,
    );
    const span = container.firstChild as HTMLElement;
    const ariaLabel = span.getAttribute('aria-label') ?? '';
    // Verify the aria-label contains the emoji (U+1F3AE) and text
    expect(ariaLabel.codePointAt(0)).toBe(0x1F3AE);
    expect(ariaLabel).toContain('Playing');
  });

  it('has aria-label with just text', () => {
    const { container } = render(
      <Dark>
        <MemberStatusDisplay text="Away" />
      </Dark>,
    );
    const span = container.firstChild as HTMLElement;
    expect(span.getAttribute('aria-label')).toBe('Away');
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('MemberStatusDisplay -- sizes', () => {
  (['xs', 'sm', 'md'] as const).forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(
        <Dark>
          <MemberStatusDisplay text="Status" size={size} />
        </Dark>,
      );
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('MemberStatusDisplay -- ref', () => {
  it('forwards ref to the wrapper span', () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(
      <Dark>
        <MemberStatusDisplay ref={ref} text="Status" />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('MemberStatusDisplay -- className', () => {
  it('passes className through', () => {
    const { container } = render(
      <Dark>
        <MemberStatusDisplay text="Status" className="custom-status" />
      </Dark>,
    );
    expect(container.querySelector('.custom-status')).toBeInTheDocument();
  });
});
