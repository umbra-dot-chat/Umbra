/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StickerPicker } from './StickerPicker';
import { WispProvider } from '../../providers';
import type { StickerPickerPack } from '@coexist/wisp-core/types/StickerPicker.types';
import { stickerPickerSizes } from '@coexist/wisp-core/types/StickerPicker.types';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const samplePacks: StickerPickerPack[] = [
  {
    id: 'pack-1',
    name: 'Animals',
    iconUrl: 'https://example.com/animals-icon.png',
    stickers: [
      { id: 's1', name: 'Cat', imageUrl: 'https://example.com/cat.png' },
      { id: 's2', name: 'Dog', imageUrl: 'https://example.com/dog.png' },
    ],
  },
  {
    id: 'pack-2',
    name: 'Emotes',
    stickers: [
      { id: 's3', name: 'Happy', imageUrl: 'https://example.com/happy.png' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('StickerPicker -- rendering', () => {
  it('renders sticker buttons for active pack', () => {
    render(
      <Dark>
        <StickerPicker packs={samplePacks} />
      </Dark>,
    );
    expect(screen.getByLabelText('Cat')).toBeInTheDocument();
    expect(screen.getByLabelText('Dog')).toBeInTheDocument();
  });

  it('renders pack tab buttons', () => {
    render(
      <Dark>
        <StickerPicker packs={samplePacks} />
      </Dark>,
    );
    expect(screen.getByLabelText('Animals')).toBeInTheDocument();
    expect(screen.getByLabelText('Emotes')).toBeInTheDocument();
  });

  it('passes className through', () => {
    const { container } = render(
      <Dark>
        <StickerPicker packs={samplePacks} className="custom" />
      </Dark>,
    );
    expect(container.firstChild).toHaveClass('custom');
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('StickerPicker -- sizes', () => {
  stickerPickerSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      const { container } = render(
        <Dark>
          <StickerPicker packs={samplePacks} size={size} />
        </Dark>,
      );
      expect(container.firstChild).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

describe('StickerPicker -- selection', () => {
  it('fires onSelect when sticker is clicked', () => {
    const handler = vi.fn();
    render(
      <Dark>
        <StickerPicker packs={samplePacks} onSelect={handler} />
      </Dark>,
    );
    fireEvent.click(screen.getByLabelText('Cat'));
    expect(handler).toHaveBeenCalledWith('s1', 'pack-1');
  });
});

// ---------------------------------------------------------------------------
// Tab switching
// ---------------------------------------------------------------------------

describe('StickerPicker -- tab switching', () => {
  it('switches pack when tab is clicked', () => {
    render(
      <Dark>
        <StickerPicker packs={samplePacks} />
      </Dark>,
    );
    fireEvent.click(screen.getByLabelText('Emotes'));
    expect(screen.getByLabelText('Happy')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('StickerPicker -- empty', () => {
  it('shows empty message when no packs', () => {
    render(
      <Dark>
        <StickerPicker packs={[]} />
      </Dark>,
    );
    expect(screen.getByText('No sticker packs available')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('StickerPicker -- skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(
      <Dark>
        <StickerPicker packs={[]} skeleton />
      </Dark>,
    );
    const el = container.querySelector('div');
    expect(el).toHaveAttribute('aria-hidden');
  });

  it('does not render sticker content when skeleton', () => {
    render(
      <Dark>
        <StickerPicker packs={samplePacks} skeleton />
      </Dark>,
    );
    expect(screen.queryByLabelText('Cat')).not.toBeInTheDocument();
  });
});
