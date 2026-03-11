/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmojiManagementPanel } from './EmojiManagementPanel';
import { WispProvider } from '../../providers';
import type { CustomEmoji } from '@coexist/wisp-core/types/EmojiManagementPanel.types';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const sampleEmojis: CustomEmoji[] = [
  { id: '1', name: 'wave', imageUrl: 'https://example.com/wave.png', uploadedBy: 'admin', uploadedAt: '2025-01-01' },
  { id: '2', name: 'thumbsup', imageUrl: 'https://example.com/thumbsup.png', animated: true, uploadedBy: 'admin', uploadedAt: '2025-01-02' },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('EmojiManagementPanel -- rendering', () => {
  it('renders the panel title', () => {
    render(
      <Dark>
        <EmojiManagementPanel emojis={sampleEmojis} />
      </Dark>,
    );
    expect(screen.getByText('Custom Emoji')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(
      <Dark>
        <EmojiManagementPanel emojis={sampleEmojis} title="Server Emojis" />
      </Dark>,
    );
    expect(screen.getByText('Server Emojis')).toBeInTheDocument();
  });

  it('renders count badge', () => {
    render(
      <Dark>
        <EmojiManagementPanel emojis={sampleEmojis} maxEmojis={50} />
      </Dark>,
    );
    expect(screen.getByText('2/50')).toBeInTheDocument();
  });

  it('renders emoji names', () => {
    render(
      <Dark>
        <EmojiManagementPanel emojis={sampleEmojis} />
      </Dark>,
    );
    expect(screen.getByText(':wave:')).toBeInTheDocument();
    expect(screen.getByText(':thumbsup:')).toBeInTheDocument();
  });

  it('renders emoji images', () => {
    render(
      <Dark>
        <EmojiManagementPanel emojis={sampleEmojis} />
      </Dark>,
    );
    const images = screen.getAllByRole('img');
    expect(images.length).toBe(2);
  });

  it('passes className through', () => {
    const { container } = render(
      <Dark>
        <EmojiManagementPanel emojis={[]} className="custom" />
      </Dark>,
    );
    expect(container.firstChild).toHaveClass('custom');
  });
});

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

describe('EmojiManagementPanel -- delete', () => {
  it('renders delete buttons for each emoji', () => {
    render(
      <Dark>
        <EmojiManagementPanel emojis={sampleEmojis} onDelete={() => {}} />
      </Dark>,
    );
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
    expect(deleteButtons.length).toBe(2);
  });

  it('fires onDelete when delete button is clicked', () => {
    const handler = vi.fn();
    render(
      <Dark>
        <EmojiManagementPanel emojis={sampleEmojis} onDelete={handler} />
      </Dark>,
    );
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
    fireEvent.click(deleteButtons[0]);
    expect(handler).toHaveBeenCalledWith('1');
  });
});

// ---------------------------------------------------------------------------
// Upload section
// ---------------------------------------------------------------------------

describe('EmojiManagementPanel -- upload', () => {
  it('renders upload section when under max', () => {
    render(
      <Dark>
        <EmojiManagementPanel emojis={sampleEmojis} maxEmojis={50} />
      </Dark>,
    );
    expect(screen.getByText('Upload New Emoji')).toBeInTheDocument();
  });

  it('renders upload button', () => {
    render(
      <Dark>
        <EmojiManagementPanel emojis={[]} maxEmojis={50} onUpload={() => {}} />
      </Dark>,
    );
    expect(screen.getByText('Upload')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('EmojiManagementPanel -- skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(
      <Dark>
        <EmojiManagementPanel emojis={[]} skeleton />
      </Dark>,
    );
    const el = container.querySelector('div');
    expect(el).toHaveAttribute('aria-hidden');
  });

  it('does not render content when skeleton', () => {
    render(
      <Dark>
        <EmojiManagementPanel emojis={sampleEmojis} skeleton />
      </Dark>,
    );
    expect(screen.queryByText('Custom Emoji')).not.toBeInTheDocument();
  });
});
