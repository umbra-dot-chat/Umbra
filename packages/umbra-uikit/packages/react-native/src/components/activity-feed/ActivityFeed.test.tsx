/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ActivityFeed } from './ActivityFeed';
import type { ActivityFeedItem } from './ActivityFeed';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

const defaultItems: ActivityFeedItem[] = [
  { id: '1', content: 'Alice pushed a commit', timestamp: '2 hours ago', avatarInitials: 'AL' },
  { id: '2', content: 'Bob opened a pull request', timestamp: '3 hours ago', avatarInitials: 'BO' },
  { id: '3', content: 'Charlie merged a branch', timestamp: '5 hours ago', avatarInitials: 'CH' },
];

// ---------------------------------------------------------------------------
// Rendering items
// ---------------------------------------------------------------------------

describe('ActivityFeed — rendering items', () => {
  it('renders all item content', () => {
    render(
      <Wrapper>
        <ActivityFeed items={defaultItems} />
      </Wrapper>,
    );
    expect(screen.getByText('Alice pushed a commit')).toBeInTheDocument();
    expect(screen.getByText('Bob opened a pull request')).toBeInTheDocument();
    expect(screen.getByText('Charlie merged a branch')).toBeInTheDocument();
  });

  it('renders timestamps', () => {
    render(
      <Wrapper>
        <ActivityFeed items={defaultItems} />
      </Wrapper>,
    );
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    expect(screen.getByText('3 hours ago')).toBeInTheDocument();
    expect(screen.getByText('5 hours ago')).toBeInTheDocument();
  });

  it('renders avatar initials', () => {
    render(
      <Wrapper>
        <ActivityFeed items={defaultItems} />
      </Wrapper>,
    );
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByText('BO')).toBeInTheDocument();
    expect(screen.getByText('CH')).toBeInTheDocument();
  });

  it('renders a single item without crashing', () => {
    render(
      <Wrapper>
        <ActivityFeed items={[{ id: '1', content: 'Single event', timestamp: 'just now' }]} />
      </Wrapper>,
    );
    expect(screen.getByText('Single event')).toBeInTheDocument();
    expect(screen.getByText('just now')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('ActivityFeed — empty state', () => {
  it('renders without crashing when items is empty', () => {
    const { container } = render(
      <Wrapper>
        <ActivityFeed items={[]} />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('does not render any content text when items is empty', () => {
    const { container } = render(
      <Wrapper>
        <ActivityFeed items={[]} />
      </Wrapper>,
    );
    // The container should have the wrapper div but no activity items
    expect(container.textContent).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('ActivityFeed — sizes', () => {
  const sizes = ['sm', 'md'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(
        <Wrapper>
          <ActivityFeed items={defaultItems} size={size} />
        </Wrapper>,
      );
      expect(screen.getByText('Alice pushed a commit')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Connector
// ---------------------------------------------------------------------------

describe('ActivityFeed — showConnector', () => {
  it('renders with showConnector=false without crashing', () => {
    render(
      <Wrapper>
        <ActivityFeed items={defaultItems} showConnector={false} />
      </Wrapper>,
    );
    expect(screen.getByText('Alice pushed a commit')).toBeInTheDocument();
  });
});
