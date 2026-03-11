/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SocialButton } from './SocialButton';
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

describe('SocialButton — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <SocialButton provider="google" />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders provider text for google', () => {
    render(
      <Wrapper>
        <SocialButton provider="google" />
      </Wrapper>,
    );
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('renders provider text for github', () => {
    render(
      <Wrapper>
        <SocialButton provider="github" />
      </Wrapper>,
    );
    expect(screen.getByText('Sign in with GitHub')).toBeInTheDocument();
  });

  it('renders custom action text', () => {
    render(
      <Wrapper>
        <SocialButton provider="apple" action="Continue with" />
      </Wrapper>,
    );
    expect(screen.getByText('Continue with Apple')).toBeInTheDocument();
  });

  it('renders without text when iconOnly is true', () => {
    const { container } = render(
      <Wrapper>
        <SocialButton provider="google" iconOnly />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
    expect(screen.queryByText('Sign in with Google')).toBeNull();
  });

  it('has correct displayName', () => {
    expect(SocialButton.displayName).toBe('SocialButton');
  });
});

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

describe('SocialButton — providers', () => {
  const providers = ['google', 'apple', 'facebook', 'github', 'x', 'microsoft', 'discord', 'slack'] as const;

  providers.forEach((provider) => {
    it(`renders provider="${provider}" without crashing`, () => {
      const { container } = render(
        <Wrapper>
          <SocialButton provider={provider} />
        </Wrapper>,
      );
      expect(container).toBeTruthy();
    });
  });
});
