/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ListItem } from './ListItem';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ListItem — rendering', () => {
  it('renders title text', () => {
    render(
      <Wrapper>
        <ListItem>
          <span>My Title</span>
        </ListItem>
      </Wrapper>,
    );
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(
      <Wrapper>
        <ListItem>
          <span>Title</span>
          <span>Description text</span>
        </ListItem>
      </Wrapper>,
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('renders leading and trailing slots', () => {
    render(
      <Wrapper>
        <ListItem
          leading={<span data-testid="leading">L</span>}
          trailing={<span data-testid="trailing">T</span>}
        >
          <span>Content</span>
        </ListItem>
      </Wrapper>,
    );
    expect(screen.getByTestId('leading')).toBeInTheDocument();
    expect(screen.getByTestId('trailing')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Press handling
// ---------------------------------------------------------------------------

describe('ListItem — press', () => {
  it('calls onPress when interactive and pressed', () => {
    const onPress = vi.fn();
    const { container } = render(
      <Wrapper>
        <ListItem interactive onPress={onPress}>
          <span>Pressable item</span>
        </ListItem>
      </Wrapper>,
    );
    // RN Pressable renders as a div in react-native-web; find the outermost element
    const pressable =
      screen.getByText('Pressable item').closest('[role="button"]') ||
      container.firstChild;
    fireEvent.click(pressable!);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = vi.fn();
    const { container } = render(
      <Wrapper>
        <ListItem interactive disabled onPress={onPress}>
          <span>Disabled item</span>
        </ListItem>
      </Wrapper>,
    );
    const pressable =
      screen.getByText('Disabled item').closest('[role="button"]') ||
      container.firstChild;
    fireEvent.click(pressable!);
    expect(onPress).not.toHaveBeenCalled();
  });
});
