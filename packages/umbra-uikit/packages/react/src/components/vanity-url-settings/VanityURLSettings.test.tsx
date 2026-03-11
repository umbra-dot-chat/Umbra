/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VanityURLSettings } from './VanityURLSettings';
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

describe('VanityURLSettings -- rendering', () => {
  it('renders the title', () => {
    render(
      <Dark>
        <VanityURLSettings />
      </Dark>,
    );
    expect(screen.getByText('Vanity URL')).toBeInTheDocument();
  });

  it('renders the base URL prefix', () => {
    render(
      <Dark>
        <VanityURLSettings baseUrl="example.com/" />
      </Dark>,
    );
    expect(screen.getByText('example.com/')).toBeInTheDocument();
  });

  it('renders default base URL', () => {
    render(
      <Dark>
        <VanityURLSettings />
      </Dark>,
    );
    expect(screen.getByText('umbra.app/c/')).toBeInTheDocument();
  });

  it('passes className through', () => {
    const { container } = render(
      <Dark>
        <VanityURLSettings className="custom" />
      </Dark>,
    );
    expect(container.firstChild).toHaveClass('custom');
  });
});

// ---------------------------------------------------------------------------
// Availability states
// ---------------------------------------------------------------------------

describe('VanityURLSettings -- availability', () => {
  it('shows available status', () => {
    render(
      <Dark>
        <VanityURLSettings availability="available" />
      </Dark>,
    );
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('shows taken status', () => {
    render(
      <Dark>
        <VanityURLSettings availability="taken" />
      </Dark>,
    );
    expect(screen.getByText('Taken')).toBeInTheDocument();
  });

  it('shows checking status', () => {
    render(
      <Dark>
        <VanityURLSettings availability="checking" />
      </Dark>,
    );
    expect(screen.getByText('Checking...')).toBeInTheDocument();
  });

  it('shows invalid status', () => {
    render(
      <Dark>
        <VanityURLSettings availability="invalid" />
      </Dark>,
    );
    expect(screen.getByText('Invalid')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

describe('VanityURLSettings -- actions', () => {
  it('fires onCheck when check button is clicked', () => {
    const handler = vi.fn();
    render(
      <Dark>
        <VanityURLSettings currentSlug="test" onCheck={handler} />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Check Availability'));
    expect(handler).toHaveBeenCalled();
  });

  it('renders save button', () => {
    render(
      <Dark>
        <VanityURLSettings availability="available" />
      </Dark>,
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('shows saving state', () => {
    render(
      <Dark>
        <VanityURLSettings saving availability="available" />
      </Dark>,
    );
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('VanityURLSettings -- skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(
      <Dark>
        <VanityURLSettings skeleton />
      </Dark>,
    );
    const el = container.querySelector('div');
    expect(el).toHaveAttribute('aria-hidden');
  });

  it('does not render content when skeleton', () => {
    render(
      <Dark>
        <VanityURLSettings skeleton />
      </Dark>,
    );
    expect(screen.queryByText('Vanity URL')).not.toBeInTheDocument();
  });
});
