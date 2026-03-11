/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NodeRegistrationWizard } from './NodeRegistrationWizard';
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

describe('NodeRegistrationWizard -- rendering', () => {
  it('does not render when closed', () => {
    const { container } = render(
      <Dark><NodeRegistrationWizard open={false} onClose={vi.fn()} /></Dark>,
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders dialog when open', () => {
    render(
      <Dark><NodeRegistrationWizard open={true} onClose={vi.fn()} /></Dark>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Register Boost Node')).toBeInTheDocument();
  });

  it('shows step 1 (Choose Type) initially', () => {
    render(
      <Dark><NodeRegistrationWizard open={true} onClose={vi.fn()} /></Dark>,
    );
    expect(screen.getByText('Choose how your node will connect:')).toBeInTheDocument();
    // The type labels are lowercase in the DOM, styled with text-transform: capitalize
    expect(screen.getByText('local')).toBeInTheDocument();
    expect(screen.getByText('remote')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

describe('NodeRegistrationWizard -- navigation', () => {
  it('navigates to step 2 when Next is clicked', () => {
    render(
      <Dark><NodeRegistrationWizard open={true} onClose={vi.fn()} /></Dark>,
    );
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Node Name')).toBeInTheDocument();
  });

  it('navigates back from step 2', () => {
    render(
      <Dark><NodeRegistrationWizard open={true} onClose={vi.fn()} /></Dark>,
    );
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Choose how your node will connect:')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Close
// ---------------------------------------------------------------------------

describe('NodeRegistrationWizard -- close', () => {
  it('calls onClose when Cancel is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Dark><NodeRegistrationWizard open={true} onClose={handleClose} /></Dark>,
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when X button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Dark><NodeRegistrationWizard open={true} onClose={handleClose} /></Dark>,
    );
    fireEvent.click(screen.getByLabelText('Close'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Error display
// ---------------------------------------------------------------------------

describe('NodeRegistrationWizard -- error', () => {
  it('renders error message when provided', () => {
    render(
      <Dark>
        <NodeRegistrationWizard open={true} onClose={vi.fn()} error="Something went wrong" />
      </Dark>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Public key display
// ---------------------------------------------------------------------------

describe('NodeRegistrationWizard -- generated key', () => {
  it('renders generated public key on review step', () => {
    render(
      <Dark>
        <NodeRegistrationWizard
          open={true}
          onClose={vi.fn()}
          generatedPublicKey="abc123xyz"
        />
      </Dark>,
    );
    // Navigate to step 2
    fireEvent.click(screen.getByText('Next'));
    // Fill in name
    const input = screen.getByPlaceholderText('My Boost Node');
    fireEvent.change(input, { target: { value: 'Test Node' } });
    // Navigate to step 3
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('abc123xyz')).toBeInTheDocument();
  });
});
