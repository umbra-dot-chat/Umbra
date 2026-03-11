/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { E2EEKeyExchangeUI } from './E2EEKeyExchangeUI';
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

describe('E2EEKeyExchangeUI — rendering', () => {
  it('renders with active status', () => {
    render(
      <Dark>
        <E2EEKeyExchangeUI status="active" />
      </Dark>,
    );
    expect(screen.getByText('End-to-End Encrypted')).toBeInTheDocument();
  });

  it('renders with pending status', () => {
    render(
      <Dark>
        <E2EEKeyExchangeUI status="pending" />
      </Dark>,
    );
    expect(screen.getByText('Key Exchange Pending')).toBeInTheDocument();
  });

  it('renders with rotating status', () => {
    render(
      <Dark>
        <E2EEKeyExchangeUI status="rotating" />
      </Dark>,
    );
    expect(screen.getByText('Rotating Keys')).toBeInTheDocument();
  });

  it('renders with error status', () => {
    render(
      <Dark>
        <E2EEKeyExchangeUI status="error" />
      </Dark>,
    );
    expect(screen.getByText('Encryption Error')).toBeInTheDocument();
  });

  it('renders key version badge', () => {
    render(
      <Dark>
        <E2EEKeyExchangeUI status="active" keyVersion={5} />
      </Dark>,
    );
    expect(screen.getByText('v5')).toBeInTheDocument();
  });

  it('renders custom error message', () => {
    render(
      <Dark>
        <E2EEKeyExchangeUI status="error" errorMessage="Network timeout" />
      </Dark>,
    );
    expect(screen.getByText('Network timeout')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('E2EEKeyExchangeUI — skeleton', () => {
  it('renders skeleton with aria-label', () => {
    render(
      <Dark>
        <E2EEKeyExchangeUI status="active" skeleton />
      </Dark>,
    );
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading encryption status');
  });

  it('does not render title when skeleton', () => {
    render(
      <Dark>
        <E2EEKeyExchangeUI status="active" skeleton />
      </Dark>,
    );
    expect(screen.queryByText('End-to-End Encrypted')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

describe('E2EEKeyExchangeUI — actions', () => {
  it('shows Retry button on error', () => {
    render(
      <Dark>
        <E2EEKeyExchangeUI status="error" onRetry={() => {}} />
      </Dark>,
    );
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('calls onRetry when Retry is clicked', () => {
    const onRetry = vi.fn();
    render(
      <Dark>
        <E2EEKeyExchangeUI status="error" onRetry={onRetry} />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows Rotate Key button when active', () => {
    render(
      <Dark>
        <E2EEKeyExchangeUI status="active" onRotateKey={() => {}} />
      </Dark>,
    );
    expect(screen.getByText('Rotate Key')).toBeInTheDocument();
  });

  it('calls onRotateKey when clicked', () => {
    const onRotateKey = vi.fn();
    render(
      <Dark>
        <E2EEKeyExchangeUI status="active" onRotateKey={onRotateKey} />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Rotate Key'));
    expect(onRotateKey).toHaveBeenCalledOnce();
  });

  it('shows rotating text when rotating prop is true', () => {
    render(
      <Dark>
        <E2EEKeyExchangeUI status="active" onRotateKey={() => {}} rotating />
      </Dark>,
    );
    expect(screen.getByText('Rotating...')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Compact mode
// ---------------------------------------------------------------------------

describe('E2EEKeyExchangeUI — compact', () => {
  it('renders title in compact mode', () => {
    render(
      <Dark>
        <E2EEKeyExchangeUI status="active" compact />
      </Dark>,
    );
    expect(screen.getByText('End-to-End Encrypted')).toBeInTheDocument();
  });

  it('does not render description in compact mode', () => {
    render(
      <Dark>
        <E2EEKeyExchangeUI status="active" compact />
      </Dark>,
    );
    expect(
      screen.queryByText('Messages in this conversation are secured with end-to-end encryption.'),
    ).not.toBeInTheDocument();
  });
});
