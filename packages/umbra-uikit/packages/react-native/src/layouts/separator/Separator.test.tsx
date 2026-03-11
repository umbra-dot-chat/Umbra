/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Separator } from './Separator';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Separator — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <Separator />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders with testID', () => {
    render(
      <Wrapper>
        <Separator testID="sep" />
      </Wrapper>,
    );
    expect(screen.getByTestId('sep')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Orientation
// ---------------------------------------------------------------------------

describe('Separator — orientation', () => {
  it('defaults to horizontal (height: 1px)', () => {
    render(
      <Wrapper>
        <Separator testID="sep" />
      </Wrapper>,
    );
    const el = screen.getByTestId('sep');
    expect(el.style.height).toBe('1px');
    expect(el.style.alignSelf).toBe('stretch');
  });

  it('applies orientation="horizontal"', () => {
    render(
      <Wrapper>
        <Separator orientation="horizontal" testID="sep" />
      </Wrapper>,
    );
    const el = screen.getByTestId('sep');
    expect(el.style.height).toBe('1px');
  });

  it('applies orientation="vertical" (width: 1px)', () => {
    render(
      <Wrapper>
        <Separator orientation="vertical" testID="sep" />
      </Wrapper>,
    );
    const el = screen.getByTestId('sep');
    expect(el.style.width).toBe('1px');
    expect(el.style.alignSelf).toBe('stretch');
  });
});

// ---------------------------------------------------------------------------
// Variant
// ---------------------------------------------------------------------------

describe('Separator — variant', () => {
  it('renders variant="subtle" without crashing', () => {
    render(
      <Wrapper>
        <Separator variant="subtle" testID="sep" />
      </Wrapper>,
    );
    expect(screen.getByTestId('sep')).toBeInTheDocument();
  });

  it('renders variant="strong" without crashing', () => {
    render(
      <Wrapper>
        <Separator variant="strong" testID="sep" />
      </Wrapper>,
    );
    expect(screen.getByTestId('sep')).toBeInTheDocument();
  });

  it('applies a background color for both variants', () => {
    const { rerender } = render(
      <Wrapper>
        <Separator variant="subtle" testID="sep" />
      </Wrapper>,
    );
    const subtleColor = screen.getByTestId('sep').style.backgroundColor;
    expect(subtleColor).toBeTruthy();

    rerender(
      <Wrapper>
        <Separator variant="strong" testID="sep" />
      </Wrapper>,
    );
    const strongColor = screen.getByTestId('sep').style.backgroundColor;
    expect(strongColor).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

describe('Separator — spacing', () => {
  it('applies spacing="none" (0px margin)', () => {
    render(
      <Wrapper>
        <Separator spacing="none" testID="sep" />
      </Wrapper>,
    );
    const el = screen.getByTestId('sep');
    const mv = el.style.marginTop || el.style.marginBottom;
    expect(mv === '' || mv === '0px' || mv === '0').toBe(true);
  });

  it('applies spacing="sm" (8px margin)', () => {
    render(
      <Wrapper>
        <Separator spacing="sm" testID="sep" />
      </Wrapper>,
    );
    const el = screen.getByTestId('sep');
    // Horizontal separator uses marginVertical which maps to marginTop + marginBottom
    // react-native-web may expand to marginTop/marginBottom or use a shorthand
    const hasMargin =
      el.style.marginTop === '8px' ||
      el.style.marginBottom === '8px';
    expect(hasMargin).toBe(true);
  });

  it('applies spacing="lg" (24px margin)', () => {
    render(
      <Wrapper>
        <Separator spacing="lg" testID="sep" />
      </Wrapper>,
    );
    const el = screen.getByTestId('sep');
    const hasMargin =
      el.style.marginTop === '24px' ||
      el.style.marginBottom === '24px';
    expect(hasMargin).toBe(true);
  });

  it('applies horizontal margin for vertical orientation', () => {
    render(
      <Wrapper>
        <Separator orientation="vertical" spacing="md" testID="sep" />
      </Wrapper>,
    );
    const el = screen.getByTestId('sep');
    const hasMargin =
      el.style.marginLeft === '16px' ||
      el.style.marginRight === '16px';
    expect(hasMargin).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Display name
// ---------------------------------------------------------------------------

describe('Separator — displayName', () => {
  it('has correct displayName', () => {
    expect(Separator.displayName).toBe('Separator');
  });
});
