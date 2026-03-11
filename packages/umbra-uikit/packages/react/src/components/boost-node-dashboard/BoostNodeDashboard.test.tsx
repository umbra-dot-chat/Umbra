/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BoostNodeDashboard } from './BoostNodeDashboard';
import type { BoostNode } from '@coexist/wisp-core/types/BoostNodeDashboard.types';
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

const mockNodes: BoostNode[] = [
  {
    id: 'node-1',
    name: 'Home Server',
    nodeType: 'local',
    enabled: true,
    lastSeenAt: '2025-01-01T00:00:00Z',
    maxStorageBytes: 10737418240,
    usedStorageBytes: 5368709120,
    maxBandwidthMbps: 100,
    status: 'online',
  },
  {
    id: 'node-2',
    name: 'Cloud Node',
    nodeType: 'remote',
    enabled: false,
    maxStorageBytes: 53687091200,
    usedStorageBytes: 10737418240,
    maxBandwidthMbps: 500,
    status: 'offline',
  },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('BoostNodeDashboard -- rendering', () => {
  it('renders the default title', () => {
    render(<Dark><BoostNodeDashboard nodes={mockNodes} /></Dark>);
    expect(screen.getByText('Boost Nodes')).toBeInTheDocument();
  });

  it('renders a custom title', () => {
    render(<Dark><BoostNodeDashboard nodes={mockNodes} title="My Nodes" /></Dark>);
    expect(screen.getByText('My Nodes')).toBeInTheDocument();
  });

  it('renders node names', () => {
    render(<Dark><BoostNodeDashboard nodes={mockNodes} /></Dark>);
    expect(screen.getByText('Home Server')).toBeInTheDocument();
    expect(screen.getByText('Cloud Node')).toBeInTheDocument();
  });

  it('renders node type badges', () => {
    render(<Dark><BoostNodeDashboard nodes={mockNodes} /></Dark>);
    expect(screen.getByText('local')).toBeInTheDocument();
    expect(screen.getByText('remote')).toBeInTheDocument();
  });

  it('renders empty state when no nodes', () => {
    render(<Dark><BoostNodeDashboard nodes={[]} /></Dark>);
    expect(screen.getByText('No boost nodes registered yet.')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<Dark><BoostNodeDashboard nodes={[]} loading /></Dark>);
    expect(screen.getByText('Loading nodes...')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('BoostNodeDashboard -- skeleton', () => {
  it('renders skeleton placeholders', () => {
    const { container } = render(<Dark><BoostNodeDashboard nodes={[]} skeleton /></Dark>);
    const skeletons = container.querySelectorAll('[aria-hidden]');
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

describe('BoostNodeDashboard -- interactions', () => {
  it('calls onNodeClick when a node card is clicked', () => {
    const handleClick = vi.fn();
    render(<Dark><BoostNodeDashboard nodes={mockNodes} onNodeClick={handleClick} /></Dark>);
    fireEvent.click(screen.getByText('Home Server'));
    expect(handleClick).toHaveBeenCalledWith('node-1');
  });

  it('renders register button when onRegisterClick is provided', () => {
    const handleRegister = vi.fn();
    render(<Dark><BoostNodeDashboard nodes={[]} onRegisterClick={handleRegister} /></Dark>);
    const btn = screen.getByText('Register Node');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleRegister).toHaveBeenCalledTimes(1);
  });
});
