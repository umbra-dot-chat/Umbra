/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WebhookCreateDialog } from './WebhookCreateDialog';
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

const sampleChannels = [
  { id: 'c1', name: 'general' },
  { id: 'c2', name: 'dev' },
  { id: 'c3', name: 'random' },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('WebhookCreateDialog — rendering', () => {
  it('renders when open is true', () => {
    render(
      <Dark>
        <WebhookCreateDialog
          open={true}
          onClose={() => {}}
          channels={sampleChannels}
        />
      </Dark>,
    );
    expect(screen.getByText('Create Webhook')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(
      <Dark>
        <WebhookCreateDialog
          open={false}
          onClose={() => {}}
          channels={sampleChannels}
        />
      </Dark>,
    );
    expect(screen.queryByText('Create Webhook')).not.toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(
      <Dark>
        <WebhookCreateDialog
          open={true}
          onClose={() => {}}
          channels={sampleChannels}
          title="New Integration"
        />
      </Dark>,
    );
    expect(screen.getByText('New Integration')).toBeInTheDocument();
  });

  it('renders name input', () => {
    render(
      <Dark>
        <WebhookCreateDialog
          open={true}
          onClose={() => {}}
          channels={sampleChannels}
        />
      </Dark>,
    );
    expect(screen.getByLabelText('Webhook name')).toBeInTheDocument();
  });

  it('renders channel selector with all channels', () => {
    render(
      <Dark>
        <WebhookCreateDialog
          open={true}
          onClose={() => {}}
          channels={sampleChannels}
        />
      </Dark>,
    );
    expect(screen.getByLabelText('Webhook channel')).toBeInTheDocument();
    expect(screen.getByText('#general')).toBeInTheDocument();
    expect(screen.getByText('#dev')).toBeInTheDocument();
    expect(screen.getByText('#random')).toBeInTheDocument();
  });

  it('renders avatar file input', () => {
    render(
      <Dark>
        <WebhookCreateDialog
          open={true}
          onClose={() => {}}
          channels={sampleChannels}
        />
      </Dark>,
    );
    expect(screen.getByLabelText('Webhook avatar')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Close
// ---------------------------------------------------------------------------

describe('WebhookCreateDialog — close', () => {
  it('renders close button', () => {
    render(
      <Dark>
        <WebhookCreateDialog
          open={true}
          onClose={() => {}}
          channels={sampleChannels}
        />
      </Dark>,
    );
    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Dark>
        <WebhookCreateDialog
          open={true}
          onClose={onClose}
          channels={sampleChannels}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders cancel button that calls onClose', () => {
    const onClose = vi.fn();
    render(
      <Dark>
        <WebhookCreateDialog
          open={true}
          onClose={onClose}
          channels={sampleChannels}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------

describe('WebhookCreateDialog — submit', () => {
  it('calls onSubmit with form data', () => {
    const onSubmit = vi.fn();
    render(
      <Dark>
        <WebhookCreateDialog
          open={true}
          onClose={() => {}}
          onSubmit={onSubmit}
          channels={sampleChannels}
        />
      </Dark>,
    );
    fireEvent.change(screen.getByLabelText('Webhook name'), { target: { value: 'My Bot' } });
    fireEvent.click(screen.getByLabelText('Create'));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My Bot', channelId: 'c1' }),
    );
  });

  it('disables create button when name is empty', () => {
    render(
      <Dark>
        <WebhookCreateDialog
          open={true}
          onClose={() => {}}
          onSubmit={() => {}}
          channels={sampleChannels}
        />
      </Dark>,
    );
    const createButton = screen.getByLabelText('Create');
    expect(createButton).toBeDisabled();
  });

  it('shows submitting text when submitting', () => {
    render(
      <Dark>
        <WebhookCreateDialog
          open={true}
          onClose={() => {}}
          channels={sampleChannels}
          submitting
        />
      </Dark>,
    );
    expect(screen.getByText('Creating...')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

describe('WebhookCreateDialog — error', () => {
  it('renders error message when provided', () => {
    render(
      <Dark>
        <WebhookCreateDialog
          open={true}
          onClose={() => {}}
          channels={sampleChannels}
          error="Name is already taken"
        />
      </Dark>,
    );
    expect(screen.getByText('Name is already taken')).toBeInTheDocument();
  });

  it('does not render error message when not provided', () => {
    render(
      <Dark>
        <WebhookCreateDialog
          open={true}
          onClose={() => {}}
          channels={sampleChannels}
        />
      </Dark>,
    );
    expect(screen.queryByText('Name is already taken')).not.toBeInTheDocument();
  });
});
