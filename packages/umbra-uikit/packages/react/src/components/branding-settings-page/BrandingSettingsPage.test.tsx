/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrandingSettingsPage } from './BrandingSettingsPage';
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

describe('BrandingSettingsPage -- rendering', () => {
  it('renders the page title', () => {
    render(
      <Dark>
        <BrandingSettingsPage />
      </Dark>,
    );
    expect(screen.getByText('Branding Settings')).toBeInTheDocument();
  });

  it('renders section headings', () => {
    render(
      <Dark>
        <BrandingSettingsPage />
      </Dark>,
    );
    expect(screen.getByText('Images')).toBeInTheDocument();
    expect(screen.getByText('Colors')).toBeInTheDocument();
    expect(screen.getByText('Custom CSS')).toBeInTheDocument();
  });

  it('passes className through', () => {
    const { container } = render(
      <Dark>
        <BrandingSettingsPage className="custom" />
      </Dark>,
    );
    expect(container.firstChild).toHaveClass('custom');
  });
});

// ---------------------------------------------------------------------------
// Accent color presets
// ---------------------------------------------------------------------------

describe('BrandingSettingsPage -- accent color', () => {
  it('renders color preset buttons', () => {
    render(
      <Dark>
        <BrandingSettingsPage accentColor="#6366f1" />
      </Dark>,
    );
    const presetButtons = screen.getAllByRole('button', { name: /Select accent color/ });
    expect(presetButtons.length).toBeGreaterThanOrEqual(10);
  });

  it('fires onAccentColorChange when preset is clicked', () => {
    const handler = vi.fn();
    render(
      <Dark>
        <BrandingSettingsPage onAccentColorChange={handler} />
      </Dark>,
    );
    const presetButtons = screen.getAllByRole('button', { name: /Select accent color/ });
    fireEvent.click(presetButtons[0]);
    expect(handler).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

describe('BrandingSettingsPage -- save', () => {
  it('renders save button', () => {
    render(
      <Dark>
        <BrandingSettingsPage />
      </Dark>,
    );
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('shows saving state', () => {
    render(
      <Dark>
        <BrandingSettingsPage saving />
      </Dark>,
    );
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('fires onSave when save button is clicked', () => {
    const handler = vi.fn();
    render(
      <Dark>
        <BrandingSettingsPage onSave={handler} />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Save Changes'));
    expect(handler).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('BrandingSettingsPage -- skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(
      <Dark>
        <BrandingSettingsPage skeleton />
      </Dark>,
    );
    const el = container.querySelector('div');
    expect(el).toHaveAttribute('aria-hidden');
  });

  it('does not render content when skeleton', () => {
    render(
      <Dark>
        <BrandingSettingsPage skeleton />
      </Dark>,
    );
    expect(screen.queryByText('Branding Settings')).not.toBeInTheDocument();
  });
});
