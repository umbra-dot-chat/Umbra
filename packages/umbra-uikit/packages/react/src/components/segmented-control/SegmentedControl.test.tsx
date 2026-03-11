/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SegmentedControl } from './SegmentedControl';
import { segmentedControlSizeMap } from '@coexist/wisp-core/types/SegmentedControl.types';
import type { SegmentedControlSize } from '@coexist/wisp-core/types/SegmentedControl.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Default options
// ---------------------------------------------------------------------------

const defaultOptions = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'table', label: 'Table' },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('SegmentedControl — rendering', () => {
  it('renders all option labels', () => {
    render(
      <Dark>
        <SegmentedControl options={defaultOptions} defaultValue="list" />
      </Dark>,
    );
    expect(screen.getByText('List')).toBeInTheDocument();
    expect(screen.getByText('Grid')).toBeInTheDocument();
    expect(screen.getByText('Table')).toBeInTheDocument();
  });

  it('renders a radiogroup container', () => {
    render(
      <Dark>
        <SegmentedControl options={defaultOptions} defaultValue="list" />
      </Dark>,
    );
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('renders radio buttons for each option', () => {
    render(
      <Dark>
        <SegmentedControl options={defaultOptions} defaultValue="list" />
      </Dark>,
    );
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Uncontrolled selection
// ---------------------------------------------------------------------------

describe('SegmentedControl — uncontrolled selection', () => {
  it('selects the defaultValue on mount', () => {
    render(
      <Dark>
        <SegmentedControl options={defaultOptions} defaultValue="grid" />
      </Dark>,
    );
    const gridRadio = screen.getByText('Grid').closest('button');
    expect(gridRadio).toHaveAttribute('aria-checked', 'true');
  });

  it('switches selection on click', () => {
    render(
      <Dark>
        <SegmentedControl options={defaultOptions} defaultValue="list" />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Grid'));
    const gridRadio = screen.getByText('Grid').closest('button');
    expect(gridRadio).toHaveAttribute('aria-checked', 'true');
    const listRadio = screen.getByText('List').closest('button');
    expect(listRadio).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange on selection', () => {
    const handleChange = vi.fn();
    render(
      <Dark>
        <SegmentedControl options={defaultOptions} defaultValue="list" onChange={handleChange} />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Grid'));
    expect(handleChange).toHaveBeenCalledWith('grid');
  });
});

// ---------------------------------------------------------------------------
// Controlled usage
// ---------------------------------------------------------------------------

describe('SegmentedControl — controlled usage', () => {
  it('respects the controlled value prop', () => {
    render(
      <Dark>
        <SegmentedControl options={defaultOptions} value="table" />
      </Dark>,
    );
    const tableRadio = screen.getByText('Table').closest('button');
    expect(tableRadio).toHaveAttribute('aria-checked', 'true');
  });

  it('does not change internally when controlled', () => {
    const handleChange = vi.fn();
    render(
      <Dark>
        <SegmentedControl options={defaultOptions} value="list" onChange={handleChange} />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Grid'));
    expect(handleChange).toHaveBeenCalledWith('grid');
    // Still shows list as active because value is controlled
    const listRadio = screen.getByText('List').closest('button');
    expect(listRadio).toHaveAttribute('aria-checked', 'true');
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('SegmentedControl — sizes', () => {
  (Object.keys(segmentedControlSizeMap) as SegmentedControlSize[]).forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(
        <Dark>
          <SegmentedControl options={defaultOptions} defaultValue="list" size={size} />
        </Dark>,
      );
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('SegmentedControl — disabled', () => {
  it('disables all segments when disabled=true', () => {
    render(
      <Dark>
        <SegmentedControl options={defaultOptions} defaultValue="list" disabled />
      </Dark>,
    );
    const radios = screen.getAllByRole('radio');
    radios.forEach((radio) => {
      expect(radio).toBeDisabled();
    });
  });

  it('does not call onChange when disabled', () => {
    const handleChange = vi.fn();
    render(
      <Dark>
        <SegmentedControl options={defaultOptions} defaultValue="list" disabled onChange={handleChange} />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Grid'));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('disables an individual option', () => {
    const options = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
      { value: 'c', label: 'C' },
    ];
    render(
      <Dark>
        <SegmentedControl options={options} defaultValue="a" />
      </Dark>,
    );
    const bButton = screen.getByText('B').closest('button');
    expect(bButton).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Keyboard navigation
// ---------------------------------------------------------------------------

describe('SegmentedControl — keyboard navigation', () => {
  it('ArrowRight moves to the next segment', () => {
    const handleChange = vi.fn();
    render(
      <Dark>
        <SegmentedControl options={defaultOptions} defaultValue="list" onChange={handleChange} />
      </Dark>,
    );
    const listButton = screen.getByText('List').closest('button')!;
    fireEvent.keyDown(listButton, { key: 'ArrowRight' });
    expect(handleChange).toHaveBeenCalledWith('grid');
  });

  it('ArrowLeft moves to the previous segment', () => {
    const handleChange = vi.fn();
    render(
      <Dark>
        <SegmentedControl options={defaultOptions} defaultValue="grid" onChange={handleChange} />
      </Dark>,
    );
    const gridButton = screen.getByText('Grid').closest('button')!;
    fireEvent.keyDown(gridButton, { key: 'ArrowLeft' });
    expect(handleChange).toHaveBeenCalledWith('list');
  });

  it('Enter selects the current segment', () => {
    const handleChange = vi.fn();
    render(
      <Dark>
        <SegmentedControl options={defaultOptions} defaultValue="list" onChange={handleChange} />
      </Dark>,
    );
    const gridButton = screen.getByText('Grid').closest('button')!;
    fireEvent.keyDown(gridButton, { key: 'Enter' });
    expect(handleChange).toHaveBeenCalledWith('grid');
  });

  it('Space selects the current segment', () => {
    const handleChange = vi.fn();
    render(
      <Dark>
        <SegmentedControl options={defaultOptions} defaultValue="list" onChange={handleChange} />
      </Dark>,
    );
    const gridButton = screen.getByText('Grid').closest('button')!;
    fireEvent.keyDown(gridButton, { key: ' ' });
    expect(handleChange).toHaveBeenCalledWith('grid');
  });
});

// ---------------------------------------------------------------------------
// Icon support
// ---------------------------------------------------------------------------

describe('SegmentedControl — icon', () => {
  it('renders option icons', () => {
    const options = [
      { value: 'a', label: 'A', icon: <span data-testid="icon-a">I</span> },
      { value: 'b', label: 'B' },
    ];
    render(
      <Dark>
        <SegmentedControl options={options} defaultValue="a" />
      </Dark>,
    );
    expect(screen.getByTestId('icon-a')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// fullWidth
// ---------------------------------------------------------------------------

describe('SegmentedControl — fullWidth', () => {
  it('renders with fullWidth without crashing', () => {
    render(
      <Dark>
        <SegmentedControl options={defaultOptions} defaultValue="list" fullWidth />
      </Dark>,
    );
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('SegmentedControl — accessibility', () => {
  it('active segment has aria-checked=true', () => {
    render(
      <Dark>
        <SegmentedControl options={defaultOptions} defaultValue="list" />
      </Dark>,
    );
    const listButton = screen.getByText('List').closest('button');
    expect(listButton).toHaveAttribute('aria-checked', 'true');
  });

  it('inactive segments have aria-checked=false', () => {
    render(
      <Dark>
        <SegmentedControl options={defaultOptions} defaultValue="list" />
      </Dark>,
    );
    const gridButton = screen.getByText('Grid').closest('button');
    expect(gridButton).toHaveAttribute('aria-checked', 'false');
  });

  it('active segment has tabIndex=0, others have tabIndex=-1', () => {
    render(
      <Dark>
        <SegmentedControl options={defaultOptions} defaultValue="list" />
      </Dark>,
    );
    const listButton = screen.getByText('List').closest('button');
    const gridButton = screen.getByText('Grid').closest('button');
    expect(listButton).toHaveAttribute('tabindex', '0');
    expect(gridButton).toHaveAttribute('tabindex', '-1');
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('SegmentedControl — className passthrough', () => {
  it('passes className to the root element', () => {
    render(
      <Dark>
        <SegmentedControl
          options={defaultOptions}
          defaultValue="list"
          className="custom-sc"
        />
      </Dark>,
    );
    expect(screen.getByRole('radiogroup')).toHaveClass('custom-sc');
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('SegmentedControl — style merge', () => {
  it('merges user style onto the root element', () => {
    render(
      <Dark>
        <SegmentedControl
          options={defaultOptions}
          defaultValue="list"
          style={{ marginTop: 42 }}
        />
      </Dark>,
    );
    expect(screen.getByRole('radiogroup')).toHaveStyle({ marginTop: '42px' });
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('SegmentedControl — ref forwarding', () => {
  it('forwards ref to the root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <SegmentedControl options={defaultOptions} defaultValue="list" ref={ref} />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
