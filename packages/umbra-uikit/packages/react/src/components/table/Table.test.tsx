/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
} from './Table';
import { tableSizes, tableVariants, tableCellAlignments } from '@coexist/wisp-core/types/Table.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Helper: minimal table
// ---------------------------------------------------------------------------

function MinimalTable(props: React.ComponentProps<typeof Table>) {
  return (
    <Table {...props}>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Alpha</TableCell>
          <TableCell>100</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Beta</TableCell>
          <TableCell>200</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

// ===========================================================================
// Table (root)
// ===========================================================================

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Table — rendering', () => {
  it('renders a table element with role="table"', () => {
    render(<Dark><MinimalTable /></Dark>);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders an HTML table element', () => {
    render(<Dark><MinimalTable /></Dark>);
    expect(screen.getByRole('table').tagName).toBe('TABLE');
  });

  it('renders header cells', () => {
    render(<Dark><MinimalTable /></Dark>);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('renders body cells', () => {
    render(<Dark><MinimalTable /></Dark>);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Table — sizes', () => {
  tableSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Dark><MinimalTable size={size} /></Dark>);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('Table — variants', () => {
  tableVariants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      render(<Dark><MinimalTable variant={variant} /></Dark>);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// className and style
// ---------------------------------------------------------------------------

describe('Table — className and style', () => {
  it('passes className to table element', () => {
    render(<Dark><MinimalTable className="custom" /></Dark>);
    expect(screen.getByRole('table')).toHaveClass('custom');
  });

  it('merges user style', () => {
    render(<Dark><MinimalTable style={{ marginTop: 88 }} /></Dark>);
    expect(screen.getByRole('table').style.marginTop).toBe('88px');
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('Table — ref forwarding', () => {
  it('forwards ref to table element', () => {
    const ref = React.createRef<HTMLTableElement>();
    render(
      <Dark>
        <Table ref={ref}>
          <TableBody>
            <TableRow><TableCell>X</TableCell></TableRow>
          </TableBody>
        </Table>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLTableElement);
  });
});

// ===========================================================================
// TableHeader
// ===========================================================================

describe('TableHeader — rendering', () => {
  it('renders a thead element', () => {
    const { container } = render(<Dark><MinimalTable /></Dark>);
    expect(container.querySelector('thead')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = React.createRef<HTMLTableSectionElement>();
    render(
      <Dark>
        <Table>
          <TableHeader ref={ref}>
            <TableRow><TableHead>H</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            <TableRow><TableCell>C</TableCell></TableRow>
          </TableBody>
        </Table>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
    expect(ref.current!.tagName).toBe('THEAD');
  });
});

// ===========================================================================
// TableBody
// ===========================================================================

describe('TableBody — rendering', () => {
  it('renders a tbody element', () => {
    const { container } = render(<Dark><MinimalTable /></Dark>);
    expect(container.querySelector('tbody')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = React.createRef<HTMLTableSectionElement>();
    render(
      <Dark>
        <Table>
          <TableBody ref={ref}>
            <TableRow><TableCell>C</TableCell></TableRow>
          </TableBody>
        </Table>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
    expect(ref.current!.tagName).toBe('TBODY');
  });
});

// ===========================================================================
// TableFooter
// ===========================================================================

describe('TableFooter — rendering', () => {
  it('renders a tfoot element', () => {
    const { container } = render(
      <Dark>
        <Table>
          <TableBody>
            <TableRow><TableCell>C</TableCell></TableRow>
          </TableBody>
          <TableFooter>
            <TableRow><TableCell>Total</TableCell></TableRow>
          </TableFooter>
        </Table>
      </Dark>,
    );
    expect(container.querySelector('tfoot')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = React.createRef<HTMLTableSectionElement>();
    render(
      <Dark>
        <Table>
          <TableBody>
            <TableRow><TableCell>C</TableCell></TableRow>
          </TableBody>
          <TableFooter ref={ref}>
            <TableRow><TableCell>Total</TableCell></TableRow>
          </TableFooter>
        </Table>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
    expect(ref.current!.tagName).toBe('TFOOT');
  });
});

// ===========================================================================
// TableRow
// ===========================================================================

describe('TableRow — rendering', () => {
  it('renders tr elements', () => {
    const { container } = render(<Dark><MinimalTable /></Dark>);
    const rows = container.querySelectorAll('tr');
    // 1 header row + 2 body rows
    expect(rows.length).toBe(3);
  });

  it('sets aria-selected when selected', () => {
    const { container } = render(
      <Dark>
        <Table>
          <TableBody>
            <TableRow selected><TableCell>Selected</TableCell></TableRow>
          </TableBody>
        </Table>
      </Dark>,
    );
    const row = container.querySelector('tr');
    expect(row).toHaveAttribute('aria-selected', 'true');
  });

  it('does not set aria-selected when not selected', () => {
    const { container } = render(
      <Dark>
        <Table>
          <TableBody>
            <TableRow><TableCell>Normal</TableCell></TableRow>
          </TableBody>
        </Table>
      </Dark>,
    );
    const row = container.querySelector('tr');
    expect(row).not.toHaveAttribute('aria-selected');
  });

  it('forwards ref', () => {
    const ref = React.createRef<HTMLTableRowElement>();
    render(
      <Dark>
        <Table>
          <TableBody>
            <TableRow ref={ref}><TableCell>X</TableCell></TableRow>
          </TableBody>
        </Table>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLTableRowElement);
  });
});

// ===========================================================================
// TableHead
// ===========================================================================

describe('TableHead — rendering', () => {
  it('renders th elements', () => {
    const { container } = render(<Dark><MinimalTable /></Dark>);
    const ths = container.querySelectorAll('th');
    expect(ths.length).toBe(2);
  });

  it('has scope="col"', () => {
    const { container } = render(<Dark><MinimalTable /></Dark>);
    const th = container.querySelector('th');
    expect(th).toHaveAttribute('scope', 'col');
  });

  it('forwards ref', () => {
    const ref = React.createRef<HTMLTableCellElement>();
    render(
      <Dark>
        <Table>
          <TableHeader>
            <TableRow><TableHead ref={ref}>H</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            <TableRow><TableCell>C</TableCell></TableRow>
          </TableBody>
        </Table>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLTableCellElement);
    expect(ref.current!.tagName).toBe('TH');
  });
});

// ---------------------------------------------------------------------------
// TableHead — align
// ---------------------------------------------------------------------------

describe('TableHead — alignment', () => {
  tableCellAlignments.forEach((align) => {
    it(`renders align="${align}" without crashing`, () => {
      render(
        <Dark>
          <Table>
            <TableHeader>
              <TableRow><TableHead align={align}>H</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell>C</TableCell></TableRow>
            </TableBody>
          </Table>
        </Dark>,
      );
      expect(screen.getByText('H')).toBeInTheDocument();
    });
  });
});

// ===========================================================================
// TableCell
// ===========================================================================

describe('TableCell — rendering', () => {
  it('renders td elements', () => {
    const { container } = render(<Dark><MinimalTable /></Dark>);
    const tds = container.querySelectorAll('td');
    expect(tds.length).toBe(4); // 2 rows x 2 cells
  });

  it('forwards ref', () => {
    const ref = React.createRef<HTMLTableCellElement>();
    render(
      <Dark>
        <Table>
          <TableBody>
            <TableRow><TableCell ref={ref}>Cell</TableCell></TableRow>
          </TableBody>
        </Table>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLTableCellElement);
    expect(ref.current!.tagName).toBe('TD');
  });
});

// ---------------------------------------------------------------------------
// TableCell — align
// ---------------------------------------------------------------------------

describe('TableCell — alignment', () => {
  tableCellAlignments.forEach((align) => {
    it(`renders align="${align}" without crashing`, () => {
      render(
        <Dark>
          <Table>
            <TableBody>
              <TableRow><TableCell align={align}>C</TableCell></TableRow>
            </TableBody>
          </Table>
        </Dark>,
      );
      expect(screen.getByText('C')).toBeInTheDocument();
    });
  });
});

// ===========================================================================
// Context requirement
// ===========================================================================

describe('Table — context', () => {
  it('sub-components throw outside of Table context', () => {
    // TableRow requires context, so rendering it alone should throw
    expect(() => {
      render(<Dark><table><tbody><TableRow><td>X</td></TableRow></tbody></table></Dark>);
    }).toThrow('[Wisp] Table sub-components must be used within <Table>.');
  });
});

// ===========================================================================
// Hoverable and stickyHeader props
// ===========================================================================

describe('Table — hoverable', () => {
  it('renders with hoverable enabled without crashing', () => {
    render(<Dark><MinimalTable hoverable /></Dark>);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});

describe('Table — stickyHeader', () => {
  it('renders with stickyHeader enabled without crashing', () => {
    render(<Dark><MinimalTable stickyHeader /></Dark>);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
