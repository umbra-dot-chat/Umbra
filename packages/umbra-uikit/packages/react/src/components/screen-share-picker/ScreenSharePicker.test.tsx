/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ScreenSharePicker } from './ScreenSharePicker';
import { WispProvider } from '../../providers';
import type { ScreenShareSource } from '@coexist/wisp-core/types/ScreenSharePicker.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const wrap = (ui: React.ReactElement) =>
  render(<WispProvider mode="dark">{ui}</WispProvider>);

const mockSources: ScreenShareSource[] = [
  { id: 's1', name: 'Main Display', type: 'screen' },
  { id: 's2', name: 'Secondary Monitor', type: 'screen' },
  { id: 'w1', name: 'VS Code', type: 'window' },
  { id: 'w2', name: 'Chrome Browser', type: 'window' },
  { id: 't1', name: 'GitHub Tab', type: 'tab' },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ScreenSharePicker -- rendering', () => {
  it('renders when open', () => {
    wrap(
      <ScreenSharePicker
        open={true}
        onClose={() => {}}
        sources={mockSources}
      />,
    );
    expect(screen.getByTestId('screen-share-picker')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    wrap(
      <ScreenSharePicker
        open={false}
        onClose={() => {}}
        sources={mockSources}
      />,
    );
    expect(screen.queryByTestId('screen-share-picker')).not.toBeInTheDocument();
  });

  it('renders default title', () => {
    wrap(
      <ScreenSharePicker
        open={true}
        onClose={() => {}}
        sources={mockSources}
      />,
    );
    expect(screen.getByText('Share Your Screen')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    wrap(
      <ScreenSharePicker
        open={true}
        onClose={() => {}}
        sources={mockSources}
        title="Pick a Source"
      />,
    );
    expect(screen.getByText('Pick a Source')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

describe('ScreenSharePicker -- tabs', () => {
  it('renders tabs for available source types', () => {
    wrap(
      <ScreenSharePicker
        open={true}
        onClose={() => {}}
        sources={mockSources}
      />,
    );
    expect(screen.getByText('Screens')).toBeInTheDocument();
    expect(screen.getByText('Windows')).toBeInTheDocument();
    expect(screen.getByText('Tabs')).toBeInTheDocument();
  });

  it('filters sources by active tab', () => {
    wrap(
      <ScreenSharePicker
        open={true}
        onClose={() => {}}
        sources={mockSources}
      />,
    );
    // Default tab is 'screen'
    expect(screen.getByText('Main Display')).toBeInTheDocument();
    expect(screen.getByText('Secondary Monitor')).toBeInTheDocument();
  });

  it('switches tabs on click', () => {
    wrap(
      <ScreenSharePicker
        open={true}
        onClose={() => {}}
        sources={mockSources}
      />,
    );
    fireEvent.click(screen.getByText('Windows'));
    expect(screen.getByText('VS Code')).toBeInTheDocument();
    expect(screen.getByText('Chrome Browser')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

describe('ScreenSharePicker -- selection', () => {
  it('calls onSelect when a source is clicked', () => {
    const onSelect = vi.fn();
    wrap(
      <ScreenSharePicker
        open={true}
        onClose={() => {}}
        sources={mockSources}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByLabelText('Main Display'));
    expect(onSelect).toHaveBeenCalledWith('s1');
  });
});

// ---------------------------------------------------------------------------
// Close
// ---------------------------------------------------------------------------

describe('ScreenSharePicker -- close', () => {
  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    wrap(
      <ScreenSharePicker
        open={true}
        onClose={onClose}
        sources={mockSources}
      />,
    );
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    wrap(
      <ScreenSharePicker
        open={true}
        onClose={onClose}
        sources={mockSources}
      />,
    );
    fireEvent.click(screen.getByTestId('screen-share-picker'));
    expect(onClose).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

describe('ScreenSharePicker -- loading', () => {
  it('shows loading text when loading', () => {
    wrap(
      <ScreenSharePicker
        open={true}
        onClose={() => {}}
        loading={true}
      />,
    );
    expect(screen.getByText('Loading available sources...')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('ScreenSharePicker -- skeleton', () => {
  it('renders skeleton cards when skeleton is true', () => {
    const { container } = wrap(
      <ScreenSharePicker
        open={true}
        onClose={() => {}}
        skeleton={true}
      />,
    );
    // Should render 6 skeleton cards
    expect(container.querySelectorAll('[style*="animation"]').length).toBeGreaterThanOrEqual(1);
  });
});
