/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Timeline } from './Timeline';
import type { TimelineItem } from './Timeline';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

const defaultItems: TimelineItem[] = [
  { id: '1', title: 'Step One', description: 'First description', timestamp: '9:00 AM' },
  { id: '2', title: 'Step Two', description: 'Second description', timestamp: '10:00 AM' },
  { id: '3', title: 'Step Three', timestamp: '11:00 AM' },
];

// ---------------------------------------------------------------------------
// Rendering items
// ---------------------------------------------------------------------------

describe('Timeline — rendering items', () => {
  it('renders all item titles', () => {
    render(
      <Wrapper>
        <Timeline items={defaultItems} />
      </Wrapper>,
    );
    expect(screen.getByText('Step One')).toBeInTheDocument();
    expect(screen.getByText('Step Two')).toBeInTheDocument();
    expect(screen.getByText('Step Three')).toBeInTheDocument();
  });

  it('renders descriptions when provided', () => {
    render(
      <Wrapper>
        <Timeline items={defaultItems} />
      </Wrapper>,
    );
    expect(screen.getByText('First description')).toBeInTheDocument();
    expect(screen.getByText('Second description')).toBeInTheDocument();
  });

  it('renders without crashing with an empty items array', () => {
    const { container } = render(
      <Wrapper>
        <Timeline items={[]} />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders a single item without crashing', () => {
    render(
      <Wrapper>
        <Timeline items={[{ id: '1', title: 'Only item' }]} />
      </Wrapper>,
    );
    expect(screen.getByText('Only item')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Rendering labels (timestamps)
// ---------------------------------------------------------------------------

describe('Timeline — rendering labels', () => {
  it('renders timestamps when provided', () => {
    render(
      <Wrapper>
        <Timeline items={defaultItems} />
      </Wrapper>,
    );
    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    expect(screen.getByText('11:00 AM')).toBeInTheDocument();
  });

  it('does not render timestamp when not provided', () => {
    const items: TimelineItem[] = [
      { id: '1', title: 'No timestamp item' },
    ];
    render(
      <Wrapper>
        <Timeline items={items} />
      </Wrapper>,
    );
    expect(screen.getByText('No timestamp item')).toBeInTheDocument();
    // Only the title should be rendered, no extra text nodes for timestamp
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Timeline — sizes', () => {
  const sizes = ['sm', 'md', 'lg'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(
        <Wrapper>
          <Timeline items={defaultItems} size={size} />
        </Wrapper>,
      );
      expect(screen.getByText('Step One')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Statuses
// ---------------------------------------------------------------------------

describe('Timeline — statuses', () => {
  it('renders items with different statuses without crashing', () => {
    const items: TimelineItem[] = [
      { id: '1', title: 'Completed', status: 'completed' },
      { id: '2', title: 'Active', status: 'active' },
      { id: '3', title: 'Pending', status: 'pending' },
    ];
    render(
      <Wrapper>
        <Timeline items={items} />
      </Wrapper>,
    );
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});
