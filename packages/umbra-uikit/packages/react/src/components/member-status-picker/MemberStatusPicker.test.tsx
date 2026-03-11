/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemberStatusPicker } from './MemberStatusPicker';
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

describe('MemberStatusPicker -- rendering', () => {
  it('renders dialog when open is true', () => {
    render(
      <Dark>
        <MemberStatusPicker open onClose={() => {}} />
      </Dark>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(
      <Dark>
        <MemberStatusPicker open={false} onClose={() => {}} />
      </Dark>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders default title', () => {
    render(
      <Dark>
        <MemberStatusPicker open onClose={() => {}} />
      </Dark>,
    );
    expect(screen.getByText('Set Status')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(
      <Dark>
        <MemberStatusPicker open onClose={() => {}} title="Update Status" />
      </Dark>,
    );
    expect(screen.getByText('Update Status')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Text input
// ---------------------------------------------------------------------------

describe('MemberStatusPicker -- text input', () => {
  it('renders a text input for status', () => {
    render(
      <Dark>
        <MemberStatusPicker open onClose={() => {}} />
      </Dark>,
    );
    expect(screen.getByLabelText('Status text')).toBeInTheDocument();
  });

  it('pre-populates from currentStatus', () => {
    render(
      <Dark>
        <MemberStatusPicker
          open
          onClose={() => {}}
          currentStatus={{ text: 'In a meeting', emoji: '\u{1F4BB}' }}
        />
      </Dark>,
    );
    expect(screen.getByLabelText('Status text')).toHaveValue('In a meeting');
  });
});

// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------

describe('MemberStatusPicker -- submit', () => {
  it('calls onSubmit with status data when Save is clicked', () => {
    const onSubmit = vi.fn();
    render(
      <Dark>
        <MemberStatusPicker
          open
          onClose={() => {}}
          onSubmit={onSubmit}
        />
      </Dark>,
    );
    const input = screen.getByLabelText('Status text');
    fireEvent.change(input, { target: { value: 'Working' } });
    fireEvent.click(screen.getByText('Save'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Working' }),
    );
  });

  it('disables Save button when submitting', () => {
    render(
      <Dark>
        <MemberStatusPicker open onClose={() => {}} submitting />
      </Dark>,
    );
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Close
// ---------------------------------------------------------------------------

describe('MemberStatusPicker -- close', () => {
  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <Dark>
        <MemberStatusPicker open onClose={onClose} />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Clear
// ---------------------------------------------------------------------------

describe('MemberStatusPicker -- clear', () => {
  it('shows Clear Status button when currentStatus exists', () => {
    render(
      <Dark>
        <MemberStatusPicker
          open
          onClose={() => {}}
          currentStatus={{ text: 'Busy' }}
        />
      </Dark>,
    );
    expect(screen.getByLabelText('Clear status')).toBeInTheDocument();
  });

  it('calls onClear when Clear Status is clicked', () => {
    const onClear = vi.fn();
    render(
      <Dark>
        <MemberStatusPicker
          open
          onClose={() => {}}
          onClear={onClear}
          currentStatus={{ text: 'Busy' }}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByLabelText('Clear status'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Emoji picker
// ---------------------------------------------------------------------------

describe('MemberStatusPicker -- emoji picker', () => {
  it('toggles emoji grid when emoji button is clicked', () => {
    render(
      <Dark>
        <MemberStatusPicker open onClose={() => {}} />
      </Dark>,
    );
    const emojiBtn = screen.getByLabelText('Select emoji');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    fireEvent.click(emojiBtn);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('MemberStatusPicker -- ref', () => {
  it('forwards ref to the dialog div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <MemberStatusPicker ref={ref} open onClose={() => {}} />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
