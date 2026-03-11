/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NotificationSettingsPanel } from './NotificationSettingsPanel';
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

const sampleTargets = [
  { id: 'c1', name: 'My Community', type: 'community' as const },
  { id: 's1', name: 'General Space', type: 'space' as const },
  { id: 'ch1', name: '#general', type: 'channel' as const },
];

const sampleSettings = [
  { targetId: 'c1', level: 'all' as const, muteUntil: null, suppressEveryone: false, suppressRoles: false },
  { targetId: 's1', level: 'mentions' as const, muteUntil: null, suppressEveryone: true, suppressRoles: false },
  { targetId: 'ch1', level: 'none' as const, muteUntil: null, suppressEveryone: false, suppressRoles: true },
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderPanel(props: Record<string, unknown> = {}) {
  const defaultProps = {
    targets: sampleTargets,
    settings: sampleSettings,
  };
  return render(
    <Dark>
      <NotificationSettingsPanel {...defaultProps} {...props} />
    </Dark>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('NotificationSettingsPanel -- rendering', () => {
  it('renders with default title', () => {
    renderPanel();
    expect(screen.getByText('Notification Settings')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    renderPanel({ title: 'Alerts Config' });
    expect(screen.getByText('Alerts Config')).toBeInTheDocument();
  });

  it('renders tab buttons', () => {
    renderPanel();
    expect(screen.getByText('Communities')).toBeInTheDocument();
    expect(screen.getByText('Spaces')).toBeInTheDocument();
    expect(screen.getByText('Channels')).toBeInTheDocument();
  });

  it('renders community targets by default', () => {
    renderPanel();
    expect(screen.getByText('My Community')).toBeInTheDocument();
  });

  it('renders Close button when onClose is provided', () => {
    renderPanel({ onClose: vi.fn() });
    expect(screen.getByText('Close')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

describe('NotificationSettingsPanel -- tabs', () => {
  it('switches to Spaces tab', () => {
    renderPanel();
    fireEvent.click(screen.getByText('Spaces'));
    expect(screen.getByText('General Space')).toBeInTheDocument();
  });

  it('switches to Channels tab', () => {
    renderPanel();
    fireEvent.click(screen.getByText('Channels'));
    expect(screen.getByText('#general')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Close
// ---------------------------------------------------------------------------

describe('NotificationSettingsPanel -- close', () => {
  it('calls onClose when Close is clicked', () => {
    const onClose = vi.fn();
    renderPanel({ onClose });
    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

describe('NotificationSettingsPanel -- loading', () => {
  it('shows loading message when loading=true', () => {
    renderPanel({ loading: true });
    expect(screen.getByText('Loading settings...')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('NotificationSettingsPanel -- empty state', () => {
  it('shows empty message when no targets match tab', () => {
    renderPanel({ targets: [] });
    expect(screen.getByText('No communities found.')).toBeInTheDocument();
  });
});
