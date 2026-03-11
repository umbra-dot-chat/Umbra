/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ActivityCircles } from './ActivityCircles';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

const defaultRings = [
  { value: 75, max: 100, label: 'Move' },
  { value: 30, max: 60, label: 'Exercise' },
  { value: 10, max: 12, label: 'Stand' },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ActivityCircles (RN) — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <ActivityCircles rings={defaultRings} />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders an SVG with circle elements', () => {
    const { container } = render(
      <Wrapper>
        <ActivityCircles rings={defaultRings} />
      </Wrapper>,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    const circles = svg!.querySelectorAll('circle');
    expect(circles.length).toBe(6);
  });

  it('renders legend when showLabels is true', () => {
    render(
      <Wrapper>
        <ActivityCircles rings={defaultRings} showLabels />
      </Wrapper>,
    );
    expect(screen.getByText('Move')).toBeInTheDocument();
    expect(screen.getByText('Exercise')).toBeInTheDocument();
    expect(screen.getByText('Stand')).toBeInTheDocument();
  });

  it('does not render legend by default', () => {
    render(
      <Wrapper>
        <ActivityCircles rings={defaultRings} />
      </Wrapper>,
    );
    expect(screen.queryByText('Move')).not.toBeInTheDocument();
  });

  it('renders custom centre content', () => {
    render(
      <Wrapper>
        <ActivityCircles rings={defaultRings}>
          <span data-testid="centre">1000</span>
        </ActivityCircles>
      </Wrapper>,
    );
    expect(screen.getByTestId('centre')).toBeInTheDocument();
  });

  it('handles a single ring', () => {
    const { container } = render(
      <Wrapper>
        <ActivityCircles rings={[{ value: 50, max: 100 }]} />
      </Wrapper>,
    );
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(2);
  });
});
