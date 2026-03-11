/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ActivityCircles } from './ActivityCircles';
import { activityCirclesSizes, activityCirclesSizeMap } from '.';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
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

describe('ActivityCircles — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Dark>
        <ActivityCircles rings={defaultRings} />
      </Dark>,
    );
    expect(container).toBeTruthy();
  });

  it('renders an SVG with circle elements', () => {
    const { container } = render(
      <Dark>
        <ActivityCircles rings={defaultRings} />
      </Dark>,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // 3 track + 3 progress circles = 6 total
    const circles = svg!.querySelectorAll('circle');
    expect(circles.length).toBe(6);
  });

  it('renders with role="img" and accessible aria-label', () => {
    render(
      <Dark>
        <ActivityCircles rings={defaultRings} />
      </Dark>,
    );
    const el = screen.getByRole('img');
    expect(el).toBeInTheDocument();
    expect(el.getAttribute('aria-label')).toContain('Move: 75%');
    expect(el.getAttribute('aria-label')).toContain('Exercise: 50%');
    expect(el.getAttribute('aria-label')).toContain('Stand: 83%');
  });

  it('forwards ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ActivityCircles ref={ref} rings={defaultRings} />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('passes className through', () => {
    const { container } = render(
      <Dark>
        <ActivityCircles className="my-class" rings={defaultRings} />
      </Dark>,
    );
    expect(container.firstChild).toHaveClass('my-class');
  });
});

// ---------------------------------------------------------------------------
// Size variants
// ---------------------------------------------------------------------------

describe('ActivityCircles — sizes', () => {
  it('exports all expected size values', () => {
    expect(activityCirclesSizes).toEqual(['sm', 'md', 'lg', 'xl']);
  });

  it.each(activityCirclesSizes)('renders at size="%s" without errors', (size) => {
    const { container } = render(
      <Dark>
        <ActivityCircles rings={defaultRings} size={size} />
      </Dark>,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    const config = activityCirclesSizeMap[size];
    expect(svg!.getAttribute('viewBox')).toBe(`0 0 ${config.diameter} ${config.diameter}`);
  });
});

// ---------------------------------------------------------------------------
// Labels / Legend
// ---------------------------------------------------------------------------

describe('ActivityCircles — labels', () => {
  it('does not render legend by default', () => {
    render(
      <Dark>
        <ActivityCircles rings={defaultRings} />
      </Dark>,
    );
    expect(screen.queryByText('Move')).not.toBeInTheDocument();
  });

  it('renders legend when showLabels is true', () => {
    render(
      <Dark>
        <ActivityCircles rings={defaultRings} showLabels />
      </Dark>,
    );
    expect(screen.getByText('Move')).toBeInTheDocument();
    expect(screen.getByText('Exercise')).toBeInTheDocument();
    expect(screen.getByText('Stand')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Centre content
// ---------------------------------------------------------------------------

describe('ActivityCircles — children', () => {
  it('renders custom centre content', () => {
    render(
      <Dark>
        <ActivityCircles rings={defaultRings}>
          <span data-testid="centre">1000</span>
        </ActivityCircles>
      </Dark>,
    );
    expect(screen.getByTestId('centre')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('ActivityCircles — edge cases', () => {
  it('handles a single ring', () => {
    const { container } = render(
      <Dark>
        <ActivityCircles rings={[{ value: 50, max: 100 }]} />
      </Dark>,
    );
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(2); // 1 track + 1 progress
  });

  it('clamps value above max', () => {
    render(
      <Dark>
        <ActivityCircles rings={[{ value: 200, max: 100, label: 'Over' }]} />
      </Dark>,
    );
    const el = screen.getByRole('img');
    expect(el.getAttribute('aria-label')).toContain('Over: 100%');
  });

  it('handles value of 0', () => {
    render(
      <Dark>
        <ActivityCircles rings={[{ value: 0, max: 100, label: 'Zero' }]} />
      </Dark>,
    );
    const el = screen.getByRole('img');
    expect(el.getAttribute('aria-label')).toContain('Zero: 0%');
  });
});
