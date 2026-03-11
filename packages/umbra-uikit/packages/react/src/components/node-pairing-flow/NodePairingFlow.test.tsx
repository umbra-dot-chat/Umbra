/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NodePairingFlow } from './NodePairingFlow';
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

describe('NodePairingFlow -- rendering', () => {
  it('does not render when closed', () => {
    const { container } = render(
      <Dark><NodePairingFlow open={false} onClose={vi.fn()} /></Dark>,
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders dialog when open', () => {
    render(
      <Dark><NodePairingFlow open={true} onClose={vi.fn()} /></Dark>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Pair Remote Node')).toBeInTheDocument();
  });

  it('shows idle status by default', () => {
    render(
      <Dark><NodePairingFlow open={true} onClose={vi.fn()} /></Dark>,
    );
    expect(screen.getByText('Ready to pair')).toBeInTheDocument();
  });

  it('shows waiting status', () => {
    render(
      <Dark><NodePairingFlow open={true} onClose={vi.fn()} pairingStatus="waiting" /></Dark>,
    );
    expect(screen.getByText('Waiting for connection...')).toBeInTheDocument();
  });

  it('shows connected status', () => {
    render(
      <Dark><NodePairingFlow open={true} onClose={vi.fn()} pairingStatus="connected" /></Dark>,
    );
    expect(screen.getByText('Connected!')).toBeInTheDocument();
  });

  it('shows failed status', () => {
    render(
      <Dark><NodePairingFlow open={true} onClose={vi.fn()} pairingStatus="failed" /></Dark>,
    );
    expect(screen.getByText('Pairing failed')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Token display
// ---------------------------------------------------------------------------

describe('NodePairingFlow -- token', () => {
  it('renders token text when provided', () => {
    render(
      <Dark>
        <NodePairingFlow open={true} onClose={vi.fn()} pairingToken="tok_abc123" />
      </Dark>,
    );
    expect(screen.getByText('tok_abc123')).toBeInTheDocument();
  });

  it('renders copy button for token', () => {
    render(
      <Dark>
        <NodePairingFlow open={true} onClose={vi.fn()} pairingToken="tok_abc123" />
      </Dark>,
    );
    expect(screen.getByLabelText('Copy pairing token')).toBeInTheDocument();
  });

  it('renders QR placeholder when token provided', () => {
    render(
      <Dark>
        <NodePairingFlow open={true} onClose={vi.fn()} pairingToken="tok_abc123def456ghi789" />
      </Dark>,
    );
    expect(screen.getByTestId('qr-placeholder')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Generate token
// ---------------------------------------------------------------------------

describe('NodePairingFlow -- generate', () => {
  it('renders generate button when no token and handler provided', () => {
    const handleGenerate = vi.fn();
    render(
      <Dark>
        <NodePairingFlow open={true} onClose={vi.fn()} onGenerateToken={handleGenerate} />
      </Dark>,
    );
    const btn = screen.getByText('Generate Pairing Token');
    fireEvent.click(btn);
    expect(handleGenerate).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Manual input
// ---------------------------------------------------------------------------

describe('NodePairingFlow -- manual input', () => {
  it('renders manual input field', () => {
    render(
      <Dark><NodePairingFlow open={true} onClose={vi.fn()} /></Dark>,
    );
    expect(screen.getByPlaceholderText('Paste pairing token...')).toBeInTheDocument();
  });

  it('calls onVerifyPairing with entered token', () => {
    const handleVerify = vi.fn();
    render(
      <Dark>
        <NodePairingFlow open={true} onClose={vi.fn()} onVerifyPairing={handleVerify} />
      </Dark>,
    );
    const input = screen.getByPlaceholderText('Paste pairing token...');
    fireEvent.change(input, { target: { value: 'manual_token_123' } });
    fireEvent.click(screen.getByText('Verify'));
    expect(handleVerify).toHaveBeenCalledWith('manual_token_123');
  });
});

// ---------------------------------------------------------------------------
// Error display
// ---------------------------------------------------------------------------

describe('NodePairingFlow -- error', () => {
  it('renders error message', () => {
    render(
      <Dark>
        <NodePairingFlow open={true} onClose={vi.fn()} error="Connection timed out" />
      </Dark>,
    );
    expect(screen.getByText('Connection timed out')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Close
// ---------------------------------------------------------------------------

describe('NodePairingFlow -- close', () => {
  it('calls onClose when X is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Dark><NodePairingFlow open={true} onClose={handleClose} /></Dark>,
    );
    fireEvent.click(screen.getByLabelText('Close'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
