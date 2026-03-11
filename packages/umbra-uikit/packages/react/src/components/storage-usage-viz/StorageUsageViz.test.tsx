/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StorageUsageViz } from './StorageUsageViz';
import type { StorageBar } from '@coexist/wisp-core/types/StorageUsageViz.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockBars: StorageBar[] = [
  { label: 'Home Server', usedBytes: 5368709120, totalBytes: 10737418240 },
  { label: 'Cloud Node', usedBytes: 1073741824, totalBytes: 53687091200, color: '#8b5cf6' },
  { label: 'Backup', usedBytes: 0, totalBytes: 5368709120 },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('StorageUsageViz -- rendering', () => {
  it('renders the default title', () => {
    render(<Dark><StorageUsageViz bars={mockBars} /></Dark>);
    expect(screen.getByText('Storage Usage')).toBeInTheDocument();
  });

  it('renders a custom title', () => {
    render(<Dark><StorageUsageViz bars={mockBars} title="Disk Usage" /></Dark>);
    expect(screen.getByText('Disk Usage')).toBeInTheDocument();
  });

  it('renders bar labels', () => {
    render(<Dark><StorageUsageViz bars={mockBars} /></Dark>);
    // Labels may appear in both the chart and the legend
    expect(screen.getAllByText('Home Server').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Cloud Node').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Backup').length).toBeGreaterThanOrEqual(1);
  });

  it('renders percentage values', () => {
    render(<Dark><StorageUsageViz bars={mockBars} /></Dark>);
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('2%')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

describe('StorageUsageViz -- legend', () => {
  it('renders legend by default', () => {
    render(<Dark><StorageUsageViz bars={mockBars} /></Dark>);
    // Legend items should duplicate the labels
    const homeLabels = screen.getAllByText('Home Server');
    expect(homeLabels.length).toBe(2); // bar label + legend
  });

  it('hides legend when showLegend is false', () => {
    render(<Dark><StorageUsageViz bars={mockBars} showLegend={false} /></Dark>);
    // Only one instance of each label (in the chart, not in the legend)
    const homeLabels = screen.getAllByText('Home Server');
    expect(homeLabels.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('StorageUsageViz -- skeleton', () => {
  it('renders skeleton placeholder', () => {
    const { container } = render(<Dark><StorageUsageViz bars={[]} skeleton /></Dark>);
    const el = container.querySelector('[aria-hidden]');
    expect(el).toBeTruthy();
  });

  it('does not render labels when skeleton', () => {
    render(<Dark><StorageUsageViz bars={mockBars} skeleton /></Dark>);
    expect(screen.queryByText('Home Server')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Custom height
// ---------------------------------------------------------------------------

describe('StorageUsageViz -- height', () => {
  it('passes className through', () => {
    const { container } = render(<Dark><StorageUsageViz bars={mockBars} className="custom-viz" /></Dark>);
    // The outermost div should have the className
    expect(container.querySelector('.custom-viz')).toBeInTheDocument();
  });
});
