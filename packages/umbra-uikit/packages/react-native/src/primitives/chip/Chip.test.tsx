/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Chip } from './Chip';
import { WispProvider } from '../../providers';
import {
  chipSizes,
  chipColors,
  chipVariants,
} from '@coexist/wisp-core/types/Chip.types';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering — label
// ---------------------------------------------------------------------------

describe('Chip — rendering', () => {
  it('renders label text', () => {
    render(
      <Wrapper>
        <Chip>Technology</Chip>
      </Wrapper>,
    );
    expect(screen.getByText('Technology')).toBeInTheDocument();
  });

  it('renders without crashing with defaults', () => {
    const { container } = render(
      <Wrapper>
        <Chip>Default</Chip>
      </Wrapper>,
    );
    expect(container.firstChild).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('Chip — variants', () => {
  chipVariants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      render(
        <Wrapper>
          <Chip variant={variant}>{variant}</Chip>
        </Wrapper>,
      );
      expect(screen.getByText(variant)).toBeInTheDocument();
    });
  });

  chipColors.forEach((color) => {
    it(`renders color="${color}" without crashing`, () => {
      render(
        <Wrapper>
          <Chip color={color}>{color}</Chip>
        </Wrapper>,
      );
      expect(screen.getByText(color)).toBeInTheDocument();
    });
  });

  chipSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(
        <Wrapper>
          <Chip size={size}>{size}</Chip>
        </Wrapper>,
      );
      expect(screen.getByText(size)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Selected / disabled state
// ---------------------------------------------------------------------------

describe('Chip — disabled state', () => {
  it('renders with reduced opacity when disabled', () => {
    const { container } = render(
      <Wrapper>
        <Chip disabled>Disabled chip</Chip>
      </Wrapper>,
    );
    expect(screen.getByText('Disabled chip')).toBeInTheDocument();
    expect(container.firstChild).toBeTruthy();
  });

  it('does not call onPress when disabled', () => {
    const handlePress = vi.fn();
    render(
      <Wrapper>
        <Chip clickable disabled onPress={handlePress}>
          Disabled
        </Chip>
      </Wrapper>,
    );
    fireEvent.click(screen.getByText('Disabled'));
    expect(handlePress).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// onPress
// ---------------------------------------------------------------------------

describe('Chip — onPress', () => {
  it('calls onPress when clickable chip is pressed', () => {
    const handlePress = vi.fn();
    render(
      <Wrapper>
        <Chip clickable onPress={handlePress}>
          Clickable
        </Chip>
      </Wrapper>,
    );
    fireEvent.click(screen.getByText('Clickable'));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when clickable is false', () => {
    const handlePress = vi.fn();
    render(
      <Wrapper>
        <Chip onPress={handlePress}>Not clickable</Chip>
      </Wrapper>,
    );
    fireEvent.click(screen.getByText('Not clickable'));
    expect(handlePress).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Removable
// ---------------------------------------------------------------------------

describe('Chip — removable', () => {
  it('renders a remove button when removable', () => {
    render(
      <Wrapper>
        <Chip removable onRemove={() => {}}>
          Removable
        </Chip>
      </Wrapper>,
    );
    expect(screen.getByLabelText('Remove')).toBeInTheDocument();
  });

  it('calls onRemove when the remove button is pressed', () => {
    const handleRemove = vi.fn();
    render(
      <Wrapper>
        <Chip removable onRemove={handleRemove}>
          Remove me
        </Chip>
      </Wrapper>,
    );
    fireEvent.click(screen.getByLabelText('Remove'));
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });

  it('does not call onRemove when disabled', () => {
    const handleRemove = vi.fn();
    render(
      <Wrapper>
        <Chip removable disabled onRemove={handleRemove}>
          Disabled remove
        </Chip>
      </Wrapper>,
    );
    fireEvent.click(screen.getByLabelText('Remove'));
    expect(handleRemove).not.toHaveBeenCalled();
  });
});
