/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Grid, GridItem } from './Grid';
import {
  gridAlignItems,
  gridJustifyItems,
  gridAlignContents,
  gridJustifyContents,
} from '@coexist/wisp-core/types/Grid.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ===========================================================================
// Grid
// ===========================================================================

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Grid — rendering', () => {
  it('renders children text', () => {
    render(<Dark><Grid>Grid content</Grid></Dark>);
    expect(screen.getByText('Grid content')).toBeInTheDocument();
  });

  it('renders as a div by default', () => {
    render(<Dark><Grid>Default div</Grid></Dark>);
    const el = screen.getByText('Default div');
    expect(el.tagName).toBe('DIV');
  });

  it('applies display: grid by default', () => {
    render(<Dark><Grid data-testid="grid">Cell</Grid></Dark>);
    const el = screen.getByTestId('grid');
    expect(el.style.display).toBe('grid');
  });
});

// ---------------------------------------------------------------------------
// Polymorphic
// ---------------------------------------------------------------------------

describe('Grid — polymorphic', () => {
  it('renders as a section when as="section"', () => {
    render(<Dark><Grid as="section">Section grid</Grid></Dark>);
    const el = screen.getByText('Section grid');
    expect(el.tagName).toBe('SECTION');
  });

  it('renders as a nav when as="nav"', () => {
    render(<Dark><Grid as="nav">Nav grid</Grid></Dark>);
    const el = screen.getByText('Nav grid');
    expect(el.tagName).toBe('NAV');
  });
});

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

describe('Grid — columns', () => {
  it('converts numeric columns to repeat(N, 1fr)', () => {
    render(<Dark><Grid columns={3} data-testid="grid">Cell</Grid></Dark>);
    const el = screen.getByTestId('grid');
    expect(el.style.gridTemplateColumns).toBe('repeat(3, 1fr)');
  });

  it('passes string columns through as raw CSS', () => {
    render(<Dark><Grid columns="200px 1fr" data-testid="grid">Cell</Grid></Dark>);
    const el = screen.getByTestId('grid');
    expect(el.style.gridTemplateColumns).toBe('200px 1fr');
  });
});

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

describe('Grid — rows', () => {
  it('converts numeric rows to repeat(N, 1fr)', () => {
    render(<Dark><Grid rows={2} data-testid="grid">Cell</Grid></Dark>);
    const el = screen.getByTestId('grid');
    expect(el.style.gridTemplateRows).toBe('repeat(2, 1fr)');
  });

  it('passes string rows through as raw CSS', () => {
    render(<Dark><Grid rows="100px auto" data-testid="grid">Cell</Grid></Dark>);
    const el = screen.getByTestId('grid');
    expect(el.style.gridTemplateRows).toBe('100px auto');
  });
});

// ---------------------------------------------------------------------------
// Gap
// ---------------------------------------------------------------------------

describe('Grid — gap', () => {
  it('applies default gap (md) when no gap prop is given', () => {
    render(<Dark><Grid data-testid="grid">Cell</Grid></Dark>);
    const el = screen.getByTestId('grid');
    // Default gap is 'md'; should have a gap value set
    expect(el.style.gap).not.toBe('');
  });

  it('applies gap from spacing token', () => {
    render(<Dark><Grid gap="lg" data-testid="grid">Cell</Grid></Dark>);
    const el = screen.getByTestId('grid');
    expect(el.style.gap).not.toBe('');
  });

  it('applies columnGap and rowGap separately', () => {
    render(<Dark><Grid columnGap="sm" rowGap="lg" data-testid="grid">Cell</Grid></Dark>);
    const el = screen.getByTestId('grid');
    expect(el.style.columnGap).not.toBe('');
    expect(el.style.rowGap).not.toBe('');
  });
});

// ---------------------------------------------------------------------------
// Areas
// ---------------------------------------------------------------------------

describe('Grid — areas', () => {
  it('sets gridTemplateAreas from the areas prop', () => {
    const areas = `"header header" "sidebar main"`;
    render(<Dark><Grid areas={areas} data-testid="grid">Cell</Grid></Dark>);
    const el = screen.getByTestId('grid');
    expect(el.style.gridTemplateAreas).toBe(areas);
  });
});

// ---------------------------------------------------------------------------
// Flow
// ---------------------------------------------------------------------------

describe('Grid — flow', () => {
  it('sets grid-auto-flow to column', () => {
    render(<Dark><Grid flow="column" data-testid="grid">Cell</Grid></Dark>);
    const el = screen.getByTestId('grid');
    expect(el.style.gridAutoFlow).toBe('column');
  });

  it('sets grid-auto-flow to dense', () => {
    render(<Dark><Grid flow="dense" data-testid="grid">Cell</Grid></Dark>);
    const el = screen.getByTestId('grid');
    expect(el.style.gridAutoFlow).toBe('dense');
  });
});

// ---------------------------------------------------------------------------
// Alignment — alignItems
// ---------------------------------------------------------------------------

describe('Grid — alignItems', () => {
  gridAlignItems.forEach((value) => {
    it(`renders alignItems="${value}" without crashing`, () => {
      render(<Dark><Grid alignItems={value} data-testid="grid">{value}</Grid></Dark>);
      const el = screen.getByTestId('grid');
      expect(el.style.alignItems).toBe(value);
    });
  });
});

// ---------------------------------------------------------------------------
// Alignment — justifyItems
// ---------------------------------------------------------------------------

describe('Grid — justifyItems', () => {
  gridJustifyItems.forEach((value) => {
    it(`renders justifyItems="${value}" without crashing`, () => {
      render(<Dark><Grid justifyItems={value} data-testid="grid">{value}</Grid></Dark>);
      const el = screen.getByTestId('grid');
      expect(el.style.justifyItems).toBe(value);
    });
  });
});

// ---------------------------------------------------------------------------
// Alignment — alignContent
// ---------------------------------------------------------------------------

describe('Grid — alignContent', () => {
  gridAlignContents.forEach((value) => {
    it(`renders alignContent="${value}" without crashing`, () => {
      render(<Dark><Grid alignContent={value} data-testid="grid">{value}</Grid></Dark>);
      const el = screen.getByTestId('grid');
      // 'between', 'around', 'evenly' map to space-*
      const expected =
        value === 'between' ? 'space-between' :
        value === 'around' ? 'space-around' :
        value === 'evenly' ? 'space-evenly' :
        value;
      expect(el.style.alignContent).toBe(expected);
    });
  });
});

// ---------------------------------------------------------------------------
// Alignment — justifyContent
// ---------------------------------------------------------------------------

describe('Grid — justifyContent', () => {
  gridJustifyContents.forEach((value) => {
    it(`renders justifyContent="${value}" without crashing`, () => {
      render(<Dark><Grid justifyContent={value} data-testid="grid">{value}</Grid></Dark>);
      const el = screen.getByTestId('grid');
      const expected =
        value === 'between' ? 'space-between' :
        value === 'around' ? 'space-around' :
        value === 'evenly' ? 'space-evenly' :
        value;
      expect(el.style.justifyContent).toBe(expected);
    });
  });
});

// ---------------------------------------------------------------------------
// Auto rows / columns
// ---------------------------------------------------------------------------

describe('Grid — autoRows / autoColumns', () => {
  it('sets gridAutoRows', () => {
    render(<Dark><Grid autoRows="minmax(50px, auto)" data-testid="grid">Cell</Grid></Dark>);
    const el = screen.getByTestId('grid');
    expect(el.style.gridAutoRows).toBe('minmax(50px, auto)');
  });

  it('sets gridAutoColumns', () => {
    render(<Dark><Grid autoColumns="200px" data-testid="grid">Cell</Grid></Dark>);
    const el = screen.getByTestId('grid');
    expect(el.style.gridAutoColumns).toBe('200px');
  });
});

// ---------------------------------------------------------------------------
// Inline
// ---------------------------------------------------------------------------

describe('Grid — inline', () => {
  it('sets display to inline-grid when inline is true', () => {
    render(<Dark><Grid inline data-testid="grid">Cell</Grid></Dark>);
    const el = screen.getByTestId('grid');
    expect(el.style.display).toBe('inline-grid');
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('Grid — className passthrough', () => {
  it('passes className through to the root element', () => {
    render(<Dark><Grid className="custom-grid" data-testid="grid">Cell</Grid></Dark>);
    const el = screen.getByTestId('grid');
    expect(el).toHaveClass('custom-grid');
  });
});

// ---------------------------------------------------------------------------
// style merge
// ---------------------------------------------------------------------------

describe('Grid — style merge', () => {
  it('merges user style with computed grid style', () => {
    render(
      <Dark>
        <Grid style={{ backgroundColor: 'red' }} data-testid="grid">Cell</Grid>
      </Dark>,
    );
    const el = screen.getByTestId('grid');
    expect(el.style.backgroundColor).toBe('red');
    // Should still have grid display
    expect(el.style.display).toBe('grid');
  });

  it('user style overrides computed style when keys collide', () => {
    render(
      <Dark>
        <Grid style={{ display: 'flex' }} data-testid="grid">Cell</Grid>
      </Dark>,
    );
    const el = screen.getByTestId('grid');
    // userStyle is spread after computed, so it wins
    expect(el.style.display).toBe('flex');
  });
});

// ---------------------------------------------------------------------------
// ref forwarding
// ---------------------------------------------------------------------------

describe('Grid — ref forwarding', () => {
  it('forwards ref to the root element', () => {
    const ref = React.createRef<HTMLElement>();
    render(<Dark><Grid ref={ref}>Cell</Grid></Dark>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe('DIV');
  });
});

// ===========================================================================
// GridItem
// ===========================================================================

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('GridItem — rendering', () => {
  it('renders children text', () => {
    render(<Dark><Grid><GridItem>Item content</GridItem></Grid></Dark>);
    expect(screen.getByText('Item content')).toBeInTheDocument();
  });

  it('renders as a div by default', () => {
    render(<Dark><Grid><GridItem data-testid="item">Cell</GridItem></Grid></Dark>);
    const el = screen.getByTestId('item');
    expect(el.tagName).toBe('DIV');
  });
});

// ---------------------------------------------------------------------------
// Polymorphic
// ---------------------------------------------------------------------------

describe('GridItem — polymorphic', () => {
  it('renders as a section when as="section"', () => {
    render(
      <Dark>
        <Grid><GridItem as="section" data-testid="item">Section</GridItem></Grid>
      </Dark>,
    );
    const el = screen.getByTestId('item');
    expect(el.tagName).toBe('SECTION');
  });
});

// ---------------------------------------------------------------------------
// colSpan
// ---------------------------------------------------------------------------

describe('GridItem — colSpan', () => {
  it('sets gridColumn to span N', () => {
    render(
      <Dark>
        <Grid columns={4}>
          <GridItem colSpan={2} data-testid="item">Wide</GridItem>
        </Grid>
      </Dark>,
    );
    const el = screen.getByTestId('item');
    expect(el.style.gridColumn).toBe('span 2');
  });
});

// ---------------------------------------------------------------------------
// rowSpan
// ---------------------------------------------------------------------------

describe('GridItem — rowSpan', () => {
  it('sets gridRow to span N', () => {
    render(
      <Dark>
        <Grid rows={3}>
          <GridItem rowSpan={2} data-testid="item">Tall</GridItem>
        </Grid>
      </Dark>,
    );
    const el = screen.getByTestId('item');
    expect(el.style.gridRow).toBe('span 2');
  });
});

// ---------------------------------------------------------------------------
// column / row
// ---------------------------------------------------------------------------

describe('GridItem — column / row', () => {
  it('sets gridColumn from column prop', () => {
    render(
      <Dark>
        <Grid columns={4}>
          <GridItem column="1 / 3" data-testid="item">Cell</GridItem>
        </Grid>
      </Dark>,
    );
    const el = screen.getByTestId('item');
    expect(el.style.gridColumn).toBe('1 / 3');
  });

  it('sets gridRow from row prop', () => {
    render(
      <Dark>
        <Grid rows={4}>
          <GridItem row="2 / 4" data-testid="item">Cell</GridItem>
        </Grid>
      </Dark>,
    );
    const el = screen.getByTestId('item');
    expect(el.style.gridRow).toBe('2 / 4');
  });
});

// ---------------------------------------------------------------------------
// area
// ---------------------------------------------------------------------------

describe('GridItem — area', () => {
  it('sets gridArea from area prop', () => {
    render(
      <Dark>
        <Grid areas={`"header" "main"`}>
          <GridItem area="header" data-testid="item">Header</GridItem>
        </Grid>
      </Dark>,
    );
    const el = screen.getByTestId('item');
    expect(el.style.gridArea).toBe('header');
  });

  it('ignores column/row when area is set', () => {
    render(
      <Dark>
        <Grid areas={`"header" "main"`}>
          <GridItem area="header" column="1 / 3" row="2 / 4" data-testid="item">
            Header
          </GridItem>
        </Grid>
      </Dark>,
    );
    const el = screen.getByTestId('item');
    expect(el.style.gridArea).toBe('header');
    expect(el.style.gridColumn).toBe('');
    expect(el.style.gridRow).toBe('');
  });
});

// ---------------------------------------------------------------------------
// alignSelf / justifySelf
// ---------------------------------------------------------------------------

describe('GridItem — alignSelf / justifySelf', () => {
  it('sets alignSelf', () => {
    render(
      <Dark>
        <Grid><GridItem alignSelf="center" data-testid="item">Cell</GridItem></Grid>
      </Dark>,
    );
    const el = screen.getByTestId('item');
    expect(el.style.alignSelf).toBe('center');
  });

  it('sets justifySelf', () => {
    render(
      <Dark>
        <Grid><GridItem justifySelf="end" data-testid="item">Cell</GridItem></Grid>
      </Dark>,
    );
    const el = screen.getByTestId('item');
    expect(el.style.justifySelf).toBe('end');
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('GridItem — className passthrough', () => {
  it('passes className through to the root element', () => {
    render(
      <Dark>
        <Grid><GridItem className="custom-item" data-testid="item">Cell</GridItem></Grid>
      </Dark>,
    );
    const el = screen.getByTestId('item');
    expect(el).toHaveClass('custom-item');
  });
});

// ---------------------------------------------------------------------------
// style merge
// ---------------------------------------------------------------------------

describe('GridItem — style merge', () => {
  it('merges user style with computed grid-item style', () => {
    render(
      <Dark>
        <Grid>
          <GridItem colSpan={2} style={{ backgroundColor: 'blue' }} data-testid="item">
            Cell
          </GridItem>
        </Grid>
      </Dark>,
    );
    const el = screen.getByTestId('item');
    expect(el.style.backgroundColor).toBe('blue');
    expect(el.style.gridColumn).toBe('span 2');
  });
});

// ---------------------------------------------------------------------------
// ref forwarding
// ---------------------------------------------------------------------------

describe('GridItem — ref forwarding', () => {
  it('forwards ref to the root element', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Grid><GridItem ref={ref}>Cell</GridItem></Grid>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe('DIV');
  });
});
