/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StickerManagementPanel } from './StickerManagementPanel';
import { WispProvider } from '../../providers';
import type { StickerPack } from '@coexist/wisp-core/types/StickerManagementPanel.types';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const samplePacks: StickerPack[] = [
  {
    id: 'pack-1',
    name: 'Cute Animals',
    stickers: [
      { id: 's1', name: 'Happy Cat', imageUrl: 'https://example.com/cat.png' },
      { id: 's2', name: 'Sad Dog', imageUrl: 'https://example.com/dog.png', animated: true },
    ],
  },
  {
    id: 'pack-2',
    name: 'Reactions',
    stickers: [
      { id: 's3', name: 'Thumbs Up', imageUrl: 'https://example.com/thumbsup.png' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('StickerManagementPanel -- rendering', () => {
  it('renders the panel title', () => {
    render(
      <Dark>
        <StickerManagementPanel packs={samplePacks} />
      </Dark>,
    );
    expect(screen.getByText('Sticker Packs')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(
      <Dark>
        <StickerManagementPanel packs={samplePacks} title="My Stickers" />
      </Dark>,
    );
    expect(screen.getByText('My Stickers')).toBeInTheDocument();
  });

  it('renders pack tabs', () => {
    render(
      <Dark>
        <StickerManagementPanel packs={samplePacks} />
      </Dark>,
    );
    expect(screen.getByText('Cute Animals')).toBeInTheDocument();
    expect(screen.getByText('Reactions')).toBeInTheDocument();
  });

  it('renders stickers in active pack', () => {
    render(
      <Dark>
        <StickerManagementPanel packs={samplePacks} />
      </Dark>,
    );
    expect(screen.getByText('Happy Cat')).toBeInTheDocument();
    expect(screen.getByText('Sad Dog')).toBeInTheDocument();
  });

  it('switches pack on tab click', () => {
    render(
      <Dark>
        <StickerManagementPanel packs={samplePacks} />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Reactions'));
    expect(screen.getByText('Thumbs Up')).toBeInTheDocument();
  });

  it('passes className through', () => {
    const { container } = render(
      <Dark>
        <StickerManagementPanel packs={[]} className="custom" />
      </Dark>,
    );
    expect(container.firstChild).toHaveClass('custom');
  });
});

// ---------------------------------------------------------------------------
// Create pack
// ---------------------------------------------------------------------------

describe('StickerManagementPanel -- create pack', () => {
  it('renders create pack button', () => {
    render(
      <Dark>
        <StickerManagementPanel packs={[]} onCreatePack={() => {}} />
      </Dark>,
    );
    expect(screen.getByText('Create Pack')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('StickerManagementPanel -- empty state', () => {
  it('shows empty message when no packs', () => {
    render(
      <Dark>
        <StickerManagementPanel packs={[]} />
      </Dark>,
    );
    expect(screen.getByText('No sticker packs yet. Create one above.')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('StickerManagementPanel -- skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(
      <Dark>
        <StickerManagementPanel packs={[]} skeleton />
      </Dark>,
    );
    const el = container.querySelector('div');
    expect(el).toHaveAttribute('aria-hidden');
  });

  it('does not render content when skeleton', () => {
    render(
      <Dark>
        <StickerManagementPanel packs={samplePacks} skeleton />
      </Dark>,
    );
    expect(screen.queryByText('Sticker Packs')).not.toBeInTheDocument();
  });
});
