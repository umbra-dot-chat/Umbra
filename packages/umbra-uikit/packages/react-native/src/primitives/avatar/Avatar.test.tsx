/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Avatar } from './Avatar';
import { WispProvider } from '../../providers';
import { avatarSizes } from '@coexist/wisp-core/types/Avatar.types';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Avatar — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <Avatar />
      </Wrapper>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with an accessible label defaulting to "Avatar"', () => {
    render(
      <Wrapper>
        <Avatar />
      </Wrapper>,
    );
    expect(screen.getByLabelText('Avatar')).toBeInTheDocument();
  });

  it('uses alt text as the accessible label when provided', () => {
    render(
      <Wrapper>
        <Avatar alt="Profile picture" />
      </Wrapper>,
    );
    expect(screen.getByLabelText('Profile picture')).toBeInTheDocument();
  });

  it('uses name as the accessible label when alt is absent', () => {
    render(
      <Wrapper>
        <Avatar name="Jane Doe" />
      </Wrapper>,
    );
    expect(screen.getByLabelText('Jane Doe')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Initials
// ---------------------------------------------------------------------------

describe('Avatar — initials', () => {
  it('renders single initial for a one-word name', () => {
    render(
      <Wrapper>
        <Avatar name="Alice" />
      </Wrapper>,
    );
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders two initials for a multi-word name', () => {
    render(
      <Wrapper>
        <Avatar name="John Doe" />
      </Wrapper>,
    );
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('extracts first and last initials from three-word name', () => {
    render(
      <Wrapper>
        <Avatar name="Mary Jane Watson" />
      </Wrapper>,
    );
    expect(screen.getByText('MW')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Avatar — sizes', () => {
  avatarSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      const { container } = render(
        <Wrapper>
          <Avatar size={size} name="Test User" />
        </Wrapper>,
      );
      expect(container.firstChild).toBeTruthy();
    });
  });
});
