/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RadarChart } from './RadarChart';
import { radarChartSizes, radarChartSizeMap } from '.';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
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

describe('RadarChart — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Dark>
        <RadarChart axes={defaultAxes} series={defaultSeries} />
      </Dark>,
    );
    expect(container).toBeTruthy();
  });

  it('renders an SVG element', () => {
    const { container } = render(
      <Dark>
        <RadarChart axes={defaultAxes} series={defaultSeries} />
      </Dark>,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders grid polygons', () => {
    const { container } = render(
      <Dark>
        <RadarChart axes={defaultAxes} series={defaultSeries} levels={4} />
      </Dark>,
    );
    const svg = container.querySelector('svg')!;
    // 4 grid levels + 2 fill + 2 outline = 8 polygons
    const polygons = svg.querySelectorAll('polygon');
    expect(polygons.length).toBe(8);
  });

  it('renders axis lines', () => {
    const { container } = render(
      <Dark>
        <RadarChart axes={defaultAxes} series={defaultSeries} />
      </Dark>,
    );
    const svg = container.querySelector('svg')!;
    const lines = svg.querySelectorAll('line');
    expect(lines.length).toBe(5); // one per axis
  });

  it('renders data dots when showDots is true', () => {
    const { container } = render(
      <Dark>
        <RadarChart axes={defaultAxes} series={defaultSeries} showDots />
      </Dark>,
    );
    const svg = container.querySelector('svg')!;
    // 2 series × 5 axes = 10 dots
    const circles = svg.querySelectorAll('circle');
    expect(circles.length).toBe(10);
  });

  it('does not render dots when showDots is false', () => {
    const { container } = render(
      <Dark>
        <RadarChart axes={defaultAxes} series={defaultSeries} showDots={false} />
      </Dark>,
    );
    const svg = container.querySelector('svg')!;
    const circles = svg.querySelectorAll('circle');
    expect(circles.length).toBe(0);
  });

  it('renders with role="img" and accessible aria-label', () => {
    render(
      <Dark>
        <RadarChart axes={defaultAxes} series={defaultSeries} />
      </Dark>,
    );
    const el = screen.getByRole('img');
    expect(el).toBeInTheDocument();
    expect(el.getAttribute('aria-label')).toContain('5 axes');
    expect(el.getAttribute('aria-label')).toContain('Speed');
  });

  it('forwards ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <RadarChart ref={ref} axes={defaultAxes} series={defaultSeries} />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('passes className through', () => {
    const { container } = render(
      <Dark>
        <RadarChart className="my-chart" axes={defaultAxes} series={defaultSeries} />
      </Dark>,
    );
    expect(container.firstChild).toHaveClass('my-chart');
  });
});

// ---------------------------------------------------------------------------
// Size variants
// ---------------------------------------------------------------------------

describe('RadarChart — sizes', () => {
  it('exports all expected size values', () => {
    expect(radarChartSizes).toEqual(['sm', 'md', 'lg', 'xl']);
  });

  it.each(radarChartSizes)('renders at size="%s" without errors', (size) => {
    const { container } = render(
      <Dark>
        <RadarChart axes={defaultAxes} series={defaultSeries} size={size} />
      </Dark>,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    const config = radarChartSizeMap[size];
    expect(svg!.getAttribute('viewBox')).toBe(`0 0 ${config.size} ${config.size}`);
  });
});

// ---------------------------------------------------------------------------
// Labels & Legend
// ---------------------------------------------------------------------------

describe('RadarChart — labels & legend', () => {
  it('renders axis labels by default', () => {
    const { container } = render(
      <Dark>
        <RadarChart axes={defaultAxes} series={defaultSeries} />
      </Dark>,
    );
    const svg = container.querySelector('svg')!;
    const texts = svg.querySelectorAll('text');
    expect(texts.length).toBe(5);
  });

  it('hides axis labels when showLabels is false', () => {
    const { container } = render(
      <Dark>
        <RadarChart axes={defaultAxes} series={defaultSeries} showLabels={false} />
      </Dark>,
    );
    const svg = container.querySelector('svg')!;
    const texts = svg.querySelectorAll('text');
    expect(texts.length).toBe(0);
  });

  it('renders legend by default', () => {
    render(
      <Dark>
        <RadarChart axes={defaultAxes} series={defaultSeries} />
      </Dark>,
    );
    expect(screen.getByText('Hero A')).toBeInTheDocument();
    expect(screen.getByText('Hero B')).toBeInTheDocument();
  });

  it('hides legend when showLegend is false', () => {
    render(
      <Dark>
        <RadarChart axes={defaultAxes} series={defaultSeries} showLegend={false} />
      </Dark>,
    );
    expect(screen.queryByText('Hero A')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('RadarChart — edge cases', () => {
  it('renders with a single series', () => {
    const { container } = render(
      <Dark>
        <RadarChart axes={defaultAxes} series={[defaultSeries[0]]} />
      </Dark>,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with 3 axes (triangle)', () => {
    const { container } = render(
      <Dark>
        <RadarChart
          axes={['A', 'B', 'C']}
          series={[{ label: 'Test', values: [50, 75, 100] }]}
        />
      </Dark>,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('clamps values above max', () => {
    const { container } = render(
      <Dark>
        <RadarChart
          axes={['A', 'B']}
          series={[{ label: 'Over', values: [200, 300] }]}
          max={100}
        />
      </Dark>,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
