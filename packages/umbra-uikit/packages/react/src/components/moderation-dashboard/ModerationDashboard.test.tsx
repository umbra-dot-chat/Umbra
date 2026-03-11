/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ModerationDashboard } from './ModerationDashboard';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const sampleStats = [
  { label: 'Total Warnings', value: 42, change: 5 },
  { label: 'Active Bans', value: 7, change: -2, color: 'danger' as const },
];

const sampleActions = [
  {
    id: 'a1',
    type: 'warning' as const,
    actorName: 'Admin',
    targetName: 'BadUser',
    reason: 'Spam',
    timestamp: '2 hours ago',
  },
  {
    id: 'a2',
    type: 'ban' as const,
    actorName: 'Moderator',
    targetName: 'Troll',
    reason: 'Repeated violations',
    timestamp: '5 hours ago',
  },
];

const sampleAlerts = [
  {
    id: 'e1',
    suspectedMemberName: 'NewAccount123',
    matchedBanName: 'Troll',
    matchType: 'ip_pattern' as const,
    confidence: 'high' as const,
    timestamp: '1 hour ago',
  },
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderDashboard(props: Record<string, unknown> = {}) {
  const defaultProps = {
    stats: sampleStats,
    recentActions: sampleActions,
    banEvasionAlerts: sampleAlerts,
  };
  return render(
    <Dark>
      <ModerationDashboard {...defaultProps} {...props} />
    </Dark>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ModerationDashboard -- rendering', () => {
  it('renders the dashboard title', () => {
    renderDashboard();
    expect(screen.getByText('Moderation')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    renderDashboard({ title: 'Mod Panel' });
    expect(screen.getByText('Mod Panel')).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    renderDashboard();
    expect(screen.getByText('Total Warnings')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('+5')).toBeInTheDocument();
    expect(screen.getByText('Active Bans')).toBeInTheDocument();
  });

  it('renders tab buttons', () => {
    renderDashboard();
    expect(screen.getByText('Recent Actions')).toBeInTheDocument();
    expect(screen.getByText(/Ban Evasion/)).toBeInTheDocument();
  });

  it('renders recent actions by default', () => {
    renderDashboard();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('BadUser')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tab switching
// ---------------------------------------------------------------------------

describe('ModerationDashboard -- tabs', () => {
  it('switches to Ban Evasion tab', () => {
    renderDashboard();
    fireEvent.click(screen.getByText(/Ban Evasion/));
    expect(screen.getByText('NewAccount123')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

describe('ModerationDashboard -- interactions', () => {
  it('calls onActionClick when an action row is clicked', () => {
    const onActionClick = vi.fn();
    renderDashboard({ onActionClick });
    fireEvent.click(screen.getByTestId('action-a1'));
    expect(onActionClick).toHaveBeenCalledWith('a1');
  });

  it('calls onAlertInvestigate when Investigate is clicked', () => {
    const onAlertInvestigate = vi.fn();
    renderDashboard({ onAlertInvestigate });
    fireEvent.click(screen.getByText(/Ban Evasion/));
    fireEvent.click(screen.getByText('Investigate'));
    expect(onAlertInvestigate).toHaveBeenCalledWith('e1');
  });

  it('calls onAlertDismiss when Dismiss is clicked', () => {
    const onAlertDismiss = vi.fn();
    renderDashboard({ onAlertDismiss });
    fireEvent.click(screen.getByText(/Ban Evasion/));
    fireEvent.click(screen.getByText('Dismiss'));
    expect(onAlertDismiss).toHaveBeenCalledWith('e1');
  });
});

// ---------------------------------------------------------------------------
// Empty states
// ---------------------------------------------------------------------------

describe('ModerationDashboard -- empty states', () => {
  it('shows empty message for no recent actions', () => {
    renderDashboard({ recentActions: [] });
    expect(screen.getByText('No recent actions.')).toBeInTheDocument();
  });

  it('shows empty message for no ban evasion alerts', () => {
    renderDashboard({ banEvasionAlerts: [] });
    fireEvent.click(screen.getByText(/Ban Evasion/));
    expect(screen.getByText('No ban evasion alerts.')).toBeInTheDocument();
  });
});
