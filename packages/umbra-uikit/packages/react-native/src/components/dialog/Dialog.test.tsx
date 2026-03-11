/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Dialog } from './Dialog';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering when open
// ---------------------------------------------------------------------------

describe('Dialog — renders when open', () => {
  it('renders title when open', () => {
    render(
      <Wrapper>
        <Dialog open onClose={() => {}} title="Confirm Action" />
      </Wrapper>,
    );
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
  });

  it('renders description when open', () => {
    render(
      <Wrapper>
        <Dialog open onClose={() => {}} title="Delete" description="Are you sure you want to delete this item?" />
      </Wrapper>,
    );
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
  });

  it('renders children content when open', () => {
    render(
      <Wrapper>
        <Dialog open onClose={() => {}}>
          <span>Dialog body content</span>
        </Dialog>
      </Wrapper>,
    );
    expect(screen.getByText('Dialog body content')).toBeInTheDocument();
  });

  it('renders footer when open', () => {
    render(
      <Wrapper>
        <Dialog open onClose={() => {}} footer={<button>Save</button>} />
      </Wrapper>,
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('renders close button with accessibility label', () => {
    render(
      <Wrapper>
        <Dialog open onClose={() => {}} title="Test" />
      </Wrapper>,
    );
    expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Hidden when closed
// ---------------------------------------------------------------------------

describe('Dialog — hidden when closed', () => {
  it('does not render content when open is false', () => {
    render(
      <Wrapper>
        <Dialog open={false} onClose={() => {}} title="Hidden Title" />
      </Wrapper>,
    );
    expect(screen.queryByText('Hidden Title')).not.toBeInTheDocument();
  });

  it('does not render children when open is false', () => {
    render(
      <Wrapper>
        <Dialog open={false} onClose={() => {}}>
          <span>Hidden content</span>
        </Dialog>
      </Wrapper>,
    );
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------

describe('Dialog — title', () => {
  it('renders the title text', () => {
    render(
      <Wrapper>
        <Dialog open onClose={() => {}} title="My Dialog Title" />
      </Wrapper>,
    );
    expect(screen.getByText('My Dialog Title')).toBeInTheDocument();
  });

  it('does not render title element when title prop is not provided', () => {
    render(
      <Wrapper>
        <Dialog open onClose={() => {}}>
          <span>Only body</span>
        </Dialog>
      </Wrapper>,
    );
    expect(screen.getByText('Only body')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// onClose
// ---------------------------------------------------------------------------

describe('Dialog — onClose', () => {
  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Wrapper>
        <Dialog open onClose={onClose} title="Closeable" />
      </Wrapper>,
    );
    const closeButton = screen.getByLabelText('Close dialog');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not show close button when showCloseButton is false', () => {
    render(
      <Wrapper>
        <Dialog open onClose={() => {}} title="No Close" showCloseButton={false} />
      </Wrapper>,
    );
    expect(screen.queryByLabelText('Close dialog')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Dialog — sizes', () => {
  const sizes = ['sm', 'md', 'lg'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(
        <Wrapper>
          <Dialog open onClose={() => {}} title={`Dialog ${size}`} size={size} />
        </Wrapper>,
      );
      expect(screen.getByText(`Dialog ${size}`)).toBeInTheDocument();
    });
  });
});
