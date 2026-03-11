/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThemePreview } from './ThemePreview';
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

describe('ThemePreview -- rendering', () => {
  it('renders the community name', () => {
    render(
      <Dark>
        <ThemePreview communityName="Test Community" />
      </Dark>,
    );
    expect(screen.getByText('Test Community')).toBeInTheDocument();
  });

  it('renders default community name', () => {
    render(
      <Dark>
        <ThemePreview />
      </Dark>,
    );
    expect(screen.getByText('My Community')).toBeInTheDocument();
  });

  it('renders sample channels', () => {
    render(
      <Dark>
        <ThemePreview />
      </Dark>,
    );
    expect(screen.getByText('# general')).toBeInTheDocument();
    expect(screen.getByText('# announcements')).toBeInTheDocument();
  });

  it('renders sample messages', () => {
    render(
      <Dark>
        <ThemePreview />
      </Dark>,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('passes className through', () => {
    const { container } = render(
      <Dark>
        <ThemePreview className="custom" />
      </Dark>,
    );
    expect(container.firstChild).toHaveClass('custom');
  });
});

// ---------------------------------------------------------------------------
// Custom CSS
// ---------------------------------------------------------------------------

describe('ThemePreview -- custom CSS', () => {
  it('renders a style tag when customCss is provided', () => {
    const { container } = render(
      <Dark>
        <ThemePreview customCss=".header { font-size: 20px; }" />
      </Dark>,
    );
    const styleTag = container.querySelector('style');
    expect(styleTag).toBeTruthy();
  });

  it('does not render a style tag when no customCss', () => {
    const { container } = render(
      <Dark>
        <ThemePreview />
      </Dark>,
    );
    const styleTag = container.querySelector('style');
    expect(styleTag).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// Community icon
// ---------------------------------------------------------------------------

describe('ThemePreview -- community icon', () => {
  it('renders custom community icon', () => {
    render(
      <Dark>
        <ThemePreview communityIcon={<span data-testid="custom-icon">IC</span>} />
      </Dark>,
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders default icon letter when no communityIcon', () => {
    render(
      <Dark>
        <ThemePreview communityName="Wisp" />
      </Dark>,
    );
    expect(screen.getByText('W')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Light mode
// ---------------------------------------------------------------------------

describe('ThemePreview -- light mode', () => {
  it('renders in light mode without crashing', () => {
    render(
      <Light>
        <ThemePreview communityName="Light Community" />
      </Light>,
    );
    expect(screen.getByText('Light Community')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('ThemePreview -- skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(
      <Dark>
        <ThemePreview skeleton />
      </Dark>,
    );
    const el = container.querySelector('div');
    expect(el).toHaveAttribute('aria-hidden');
  });

  it('does not render content when skeleton', () => {
    render(
      <Dark>
        <ThemePreview skeleton communityName="Hidden" />
      </Dark>,
    );
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });
});
