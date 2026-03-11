/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RadarChart } from './RadarChart';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

const defaultAxes = ['Speed', 'Power', 'Range', 'Durability', 'Precision'];
const defaultSeries = [
  { label: 'Hero A', values: [90, 60, 80, 70, 95] },
  { label: 'Hero B', values: [70, 85, 60, 90, 50] },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('RadarChart (RN) — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <RadarChart axes={defaultAxes} series={defaultSeries} />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders an SVG element', () => {
    const { container } = render(
      <Wrapper>
        <RadarChart axes={defaultAxes} series={defaultSeries} />
      </Wrapper>,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders grid polygons and data polygons', () => {
    const { container } = render(
      <Wrapper>
        <RadarChart axes={defaultAxes} series={defaultSeries} levels={4} />
      </Wrapper>,
    );
    const svg = container.querySelector('svg')!;
    // 4 grid + 2 fill + 2 outline = 8
    const polygons = svg.querySelectorAll('polygon');
    expect(polygons.length).toBe(8);
  });

  it('renders axis lines', () => {
    const { container } = render(
      <Wrapper>
        <RadarChart axes={defaultAxes} series={defaultSeries} />
      </Wrapper>,
    );
    const svg = container.querySelector('svg')!;
    const lines = svg.querySelectorAll('line');
    expect(lines.length).toBe(5);
  });

  it('renders data dots', () => {
    const { container } = render(
      <Wrapper>
        <RadarChart axes={defaultAxes} series={defaultSeries} showDots />
      </Wrapper>,
    );
    const svg = container.querySelector('svg')!;
    const circles = svg.querySelectorAll('circle');
    expect(circles.length).toBe(10);
  });

  it('renders legend by default', () => {
    render(
      <Wrapper>
        <RadarChart axes={defaultAxes} series={defaultSeries} />
      </Wrapper>,
    );
    expect(screen.getByText('Hero A')).toBeInTheDocument();
    expect(screen.getByText('Hero B')).toBeInTheDocument();
  });

  it('hides legend when showLegend is false', () => {
    render(
      <Wrapper>
        <RadarChart axes={defaultAxes} series={defaultSeries} showLegend={false} />
      </Wrapper>,
    );
    expect(screen.queryByText('Hero A')).not.toBeInTheDocument();
  });

  it('handles a single series', () => {
    const { container } = render(
      <Wrapper>
        <RadarChart axes={defaultAxes} series={[defaultSeries[0]]} />
      </Wrapper>,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
