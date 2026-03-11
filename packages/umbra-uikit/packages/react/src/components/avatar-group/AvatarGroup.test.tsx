/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AvatarGroup } from './AvatarGroup';
import { Avatar } from '../../primitives/avatar/Avatar';
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

describe('AvatarGroup — rendering', () => {
  it('renders with role="group"', () => {
    render(
      <Dark>
        <AvatarGroup>
          <Avatar name="Alice" />
          <Avatar name="Bob" />
        </AvatarGroup>
      </Dark>,
    );
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  it('has aria-label "Avatar group"', () => {
    render(
      <Dark>
        <AvatarGroup>
          <Avatar name="Alice" />
        </AvatarGroup>
      </Dark>,
    );
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Avatar group');
  });

  it('renders all children when no max is set', () => {
    render(
      <Dark>
        <AvatarGroup>
          <Avatar name="Alice" />
          <Avatar name="Bob" />
          <Avatar name="Carol" />
        </AvatarGroup>
      </Dark>,
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Max / overflow
// ---------------------------------------------------------------------------

describe('AvatarGroup — max overflow', () => {
  it('shows overflow indicator when children exceed max', () => {
    render(
      <Dark>
        <AvatarGroup max={2}>
          <Avatar name="Alice" />
          <Avatar name="Bob" />
          <Avatar name="Carol" />
          <Avatar name="Dave" />
        </AvatarGroup>
      </Dark>,
    );
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('overflow indicator has correct aria-label', () => {
    render(
      <Dark>
        <AvatarGroup max={1}>
          <Avatar name="Alice" />
          <Avatar name="Bob" />
          <Avatar name="Carol" />
        </AvatarGroup>
      </Dark>,
    );
    expect(screen.getByLabelText('2 more')).toBeInTheDocument();
  });

  it('does not show overflow when max >= children count', () => {
    render(
      <Dark>
        <AvatarGroup max={5}>
          <Avatar name="Alice" />
          <Avatar name="Bob" />
        </AvatarGroup>
      </Dark>,
    );
    expect(screen.queryByText(/\+/)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('AvatarGroup — sizes', () => {
  (['xs', 'sm', 'md', 'lg', 'xl'] as const).forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(
        <Dark>
          <AvatarGroup size={size}>
            <Avatar name="Alice" />
          </AvatarGroup>
        </Dark>,
      );
      expect(screen.getByRole('group')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('AvatarGroup — className', () => {
  it('passes className through to the root element', () => {
    render(
      <Dark>
        <AvatarGroup className="custom-group">
          <Avatar name="Alice" />
        </AvatarGroup>
      </Dark>,
    );
    expect(screen.getByRole('group')).toHaveClass('custom-group');
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('AvatarGroup — ref forwarding', () => {
  it('forwards ref to the wrapper div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <AvatarGroup ref={ref}>
          <Avatar name="Alice" />
        </AvatarGroup>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
