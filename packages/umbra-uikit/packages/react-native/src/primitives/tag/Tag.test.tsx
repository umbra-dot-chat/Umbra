/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Tag } from './Tag';
import { WispProvider } from '../../providers';
import { tagSizes } from '@coexist/wisp-core/types/Tag.types';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering — label
// ---------------------------------------------------------------------------

describe('Tag — rendering', () => {
  it('renders label text', () => {
    render(
      <Wrapper>
        <Tag>Status</Tag>
      </Wrapper>,
    );
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders without crashing with defaults', () => {
    const { container } = render(
      <Wrapper>
        <Tag>Default</Tag>
      </Wrapper>,
    );
    expect(container.firstChild).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Variants (sizes)
// ---------------------------------------------------------------------------

describe('Tag — sizes', () => {
  tagSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(
        <Wrapper>
          <Tag size={size}>{size}</Tag>
        </Wrapper>,
      );
      expect(screen.getByText(size)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Selected state
// ---------------------------------------------------------------------------

describe('Tag — selected state', () => {
  it('renders in selected state without crashing', () => {
    render(
      <Wrapper>
        <Tag selected>Selected</Tag>
      </Wrapper>,
    );
    expect(screen.getByText('Selected')).toBeInTheDocument();
  });

  it('renders in unselected state without crashing', () => {
    render(
      <Wrapper>
        <Tag selected={false}>Unselected</Tag>
      </Wrapper>,
    );
    expect(screen.getByText('Unselected')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Dismissible (onRemove)
// ---------------------------------------------------------------------------

describe('Tag — dismissible', () => {
  it('renders a remove button when onRemove is provided', () => {
    render(
      <Wrapper>
        <Tag onRemove={() => {}}>Dismissible</Tag>
      </Wrapper>,
    );
    expect(screen.getByLabelText('Remove')).toBeInTheDocument();
  });

  it('does not render a remove button when onRemove is absent', () => {
    render(
      <Wrapper>
        <Tag>Not dismissible</Tag>
      </Wrapper>,
    );
    expect(screen.queryByLabelText('Remove')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// onDismiss (onRemove callback)
// ---------------------------------------------------------------------------

describe('Tag — onDismiss', () => {
  it('calls onRemove when the remove button is pressed', () => {
    const handleRemove = vi.fn();
    render(
      <Wrapper>
        <Tag onRemove={handleRemove}>Remove me</Tag>
      </Wrapper>,
    );
    fireEvent.click(screen.getByLabelText('Remove'));
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });

  it('does not call onRemove when disabled', () => {
    const handleRemove = vi.fn();
    render(
      <Wrapper>
        <Tag disabled onRemove={handleRemove}>
          Disabled remove
        </Tag>
      </Wrapper>,
    );
    fireEvent.click(screen.getByLabelText('Remove'));
    expect(handleRemove).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// onPress
// ---------------------------------------------------------------------------

describe('Tag — onPress', () => {
  it('calls onPress when the tag is pressed', () => {
    const handlePress = vi.fn();
    render(
      <Wrapper>
        <Tag onPress={handlePress}>Pressable</Tag>
      </Wrapper>,
    );
    fireEvent.click(screen.getByText('Pressable'));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const handlePress = vi.fn();
    render(
      <Wrapper>
        <Tag disabled onPress={handlePress}>
          Disabled
        </Tag>
      </Wrapper>,
    );
    fireEvent.click(screen.getByText('Disabled'));
    expect(handlePress).not.toHaveBeenCalled();
  });
});
