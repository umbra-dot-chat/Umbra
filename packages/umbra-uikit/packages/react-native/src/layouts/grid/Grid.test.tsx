/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Grid, GridItem } from './Grid';

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Grid — rendering', () => {
  it('renders children', () => {
    render(
      <Grid>
        <GridItem><span>Cell 1</span></GridItem>
        <GridItem><span>Cell 2</span></GridItem>
      </Grid>,
    );
    expect(screen.getByText('Cell 1')).toBeInTheDocument();
    expect(screen.getByText('Cell 2')).toBeInTheDocument();
  });

  it('renders without crashing when no children provided', () => {
    const { container } = render(<Grid />);
    expect(container).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

describe('Grid — columns', () => {
  it('renders with columns=1 (default) without crashing', () => {
    render(
      <Grid columns={1}>
        <GridItem><span>Single col</span></GridItem>
      </Grid>,
    );
    expect(screen.getByText('Single col')).toBeInTheDocument();
  });

  it('renders with columns=2 without crashing', () => {
    render(
      <Grid columns={2}>
        <GridItem><span>Col A</span></GridItem>
        <GridItem><span>Col B</span></GridItem>
      </Grid>,
    );
    expect(screen.getByText('Col A')).toBeInTheDocument();
    expect(screen.getByText('Col B')).toBeInTheDocument();
  });

  it('renders with columns=3 without crashing', () => {
    render(
      <Grid columns={3}>
        <GridItem><span>A</span></GridItem>
        <GridItem><span>B</span></GridItem>
        <GridItem><span>C</span></GridItem>
      </Grid>,
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Gap
// ---------------------------------------------------------------------------

describe('Grid — gap', () => {
  it('renders with custom gap without crashing', () => {
    render(
      <Grid gap={24}>
        <GridItem><span>Gapped</span></GridItem>
      </Grid>,
    );
    expect(screen.getByText('Gapped')).toBeInTheDocument();
  });

  it('renders with custom columnGap and rowGap without crashing', () => {
    render(
      <Grid columnGap={8} rowGap={16}>
        <GridItem><span>Custom gaps</span></GridItem>
      </Grid>,
    );
    expect(screen.getByText('Custom gaps')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ColSpan
// ---------------------------------------------------------------------------

describe('Grid — colSpan', () => {
  it('renders a GridItem spanning 2 columns in a 3-column grid', () => {
    render(
      <Grid columns={3}>
        <GridItem colSpan={2}><span>Wide</span></GridItem>
        <GridItem><span>Narrow</span></GridItem>
      </Grid>,
    );
    expect(screen.getByText('Wide')).toBeInTheDocument();
    expect(screen.getByText('Narrow')).toBeInTheDocument();
  });
});
