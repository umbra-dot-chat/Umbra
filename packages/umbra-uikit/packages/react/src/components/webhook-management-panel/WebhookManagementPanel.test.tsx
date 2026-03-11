/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WebhookManagementPanel } from './WebhookManagementPanel';
import { WispProvider } from '../../providers';
import type { WebhookEntry } from '@coexist/wisp-core/types/WebhookManagementPanel.types';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const sampleWebhooks: WebhookEntry[] = [
  {
    id: 'wh-1',
    name: 'GitHub Bot',
    channelName: 'dev',
    channelId: 'c1',
    createdBy: 'Admin',
    createdAt: '2024-01-15',
    lastUsedAt: '2024-03-01',
  },
  {
    id: 'wh-2',
    name: 'CI/CD Alerts',
    channelName: 'deployments',
    channelId: 'c2',
    createdBy: 'DevOps',
    createdAt: '2024-02-10',
  },
  {
    id: 'wh-3',
    name: 'Sentry Errors',
    channelName: 'bugs',
    channelId: 'c3',
    createdBy: 'Admin',
    createdAt: '2024-03-05',
    avatarUrl: 'https://example.com/sentry.png',
  },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('WebhookManagementPanel — rendering', () => {
  it('renders with default title', () => {
    render(
      <Dark>
        <WebhookManagementPanel webhooks={sampleWebhooks} />
      </Dark>,
    );
    expect(screen.getByText('Webhooks')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(
      <Dark>
        <WebhookManagementPanel webhooks={sampleWebhooks} title="My Webhooks" />
      </Dark>,
    );
    expect(screen.getByText('My Webhooks')).toBeInTheDocument();
  });

  it('renders all webhook entries', () => {
    render(
      <Dark>
        <WebhookManagementPanel webhooks={sampleWebhooks} />
      </Dark>,
    );
    expect(screen.getByText('GitHub Bot')).toBeInTheDocument();
    expect(screen.getByText('CI/CD Alerts')).toBeInTheDocument();
    expect(screen.getByText('Sentry Errors')).toBeInTheDocument();
  });

  it('renders channel names', () => {
    render(
      <Dark>
        <WebhookManagementPanel webhooks={sampleWebhooks} />
      </Dark>,
    );
    expect(screen.getByText('#dev')).toBeInTheDocument();
    expect(screen.getByText('#deployments')).toBeInTheDocument();
  });

  it('renders webhook count', () => {
    render(
      <Dark>
        <WebhookManagementPanel webhooks={sampleWebhooks} maxWebhooks={10} />
      </Dark>,
    );
    expect(screen.getByText('3/10')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Create button
// ---------------------------------------------------------------------------

describe('WebhookManagementPanel — create', () => {
  it('renders create button when onCreateClick is provided', () => {
    const onCreateClick = vi.fn();
    render(
      <Dark>
        <WebhookManagementPanel webhooks={sampleWebhooks} onCreateClick={onCreateClick} />
      </Dark>,
    );
    expect(screen.getByLabelText('Create webhook')).toBeInTheDocument();
  });

  it('calls onCreateClick when create button is clicked', () => {
    const onCreateClick = vi.fn();
    render(
      <Dark>
        <WebhookManagementPanel webhooks={sampleWebhooks} onCreateClick={onCreateClick} />
      </Dark>,
    );
    fireEvent.click(screen.getByLabelText('Create webhook'));
    expect(onCreateClick).toHaveBeenCalledTimes(1);
  });

  it('disables create button when at max webhooks', () => {
    const onCreateClick = vi.fn();
    render(
      <Dark>
        <WebhookManagementPanel
          webhooks={sampleWebhooks}
          onCreateClick={onCreateClick}
          maxWebhooks={3}
        />
      </Dark>,
    );
    const button = screen.getByLabelText('Create webhook');
    expect(button).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Webhook click
// ---------------------------------------------------------------------------

describe('WebhookManagementPanel — webhook click', () => {
  it('calls onWebhookClick with correct ID when a webhook card is clicked', () => {
    const onWebhookClick = vi.fn();
    render(
      <Dark>
        <WebhookManagementPanel webhooks={sampleWebhooks} onWebhookClick={onWebhookClick} />
      </Dark>,
    );
    fireEvent.click(screen.getByText('GitHub Bot'));
    expect(onWebhookClick).toHaveBeenCalledWith('wh-1');
  });
});

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

describe('WebhookManagementPanel — delete', () => {
  it('renders delete buttons when onDeleteWebhook is provided', () => {
    const onDeleteWebhook = vi.fn();
    render(
      <Dark>
        <WebhookManagementPanel webhooks={sampleWebhooks} onDeleteWebhook={onDeleteWebhook} />
      </Dark>,
    );
    // Use aria-label to specifically target delete buttons (not parent card role="button")
    const deleteButtons = screen.getAllByLabelText(/^Delete /);
    expect(deleteButtons).toHaveLength(sampleWebhooks.length);
  });

  it('calls onDeleteWebhook with correct ID', () => {
    const onDeleteWebhook = vi.fn();
    render(
      <Dark>
        <WebhookManagementPanel webhooks={sampleWebhooks} onDeleteWebhook={onDeleteWebhook} />
      </Dark>,
    );
    const deleteButtons = screen.getAllByLabelText(/^Delete /);
    fireEvent.click(deleteButtons[0]);
    expect(onDeleteWebhook).toHaveBeenCalledWith('wh-1');
  });

  it('does not render delete buttons when onDeleteWebhook is not provided', () => {
    render(
      <Dark>
        <WebhookManagementPanel webhooks={sampleWebhooks} />
      </Dark>,
    );
    expect(screen.queryByLabelText(/^Delete /)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('WebhookManagementPanel — empty state', () => {
  it('shows empty message when webhooks list is empty', () => {
    render(
      <Dark>
        <WebhookManagementPanel webhooks={[]} />
      </Dark>,
    );
    expect(screen.getByText('No webhooks created yet')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

describe('WebhookManagementPanel — loading', () => {
  it('shows loading message when loading is true', () => {
    render(
      <Dark>
        <WebhookManagementPanel webhooks={[]} loading />
      </Dark>,
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('does not show webhook entries when loading', () => {
    render(
      <Dark>
        <WebhookManagementPanel webhooks={sampleWebhooks} loading />
      </Dark>,
    );
    expect(screen.queryByText('GitHub Bot')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('WebhookManagementPanel — skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(
      <Dark>
        <WebhookManagementPanel webhooks={[]} skeleton />
      </Dark>,
    );
    const el = container.querySelector('div[aria-hidden]');
    expect(el).toBeInTheDocument();
  });

  it('does not render webhook entries in skeleton mode', () => {
    render(
      <Dark>
        <WebhookManagementPanel webhooks={sampleWebhooks} skeleton />
      </Dark>,
    );
    expect(screen.queryByText('GitHub Bot')).not.toBeInTheDocument();
  });
});
