/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemberSearchFilter } from './MemberSearchFilter';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('MemberSearchFilter -- rendering', () => {
  it('renders with default placeholder', () => {
    render(
      <Dark>
        <MemberSearchFilter />
      </Dark>,
    );
    expect(screen.getByPlaceholderText('Search members...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(
      <Dark>
        <MemberSearchFilter placeholder="Find people..." />
      </Dark>,
    );
    expect(screen.getByPlaceholderText('Find people...')).toBeInTheDocument();
  });

  it('renders result count badge when provided', () => {
    render(
      <Dark>
        <MemberSearchFilter resultCount={42} />
      </Dark>,
    );
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Controlled mode
// ---------------------------------------------------------------------------

describe('MemberSearchFilter -- controlled', () => {
  it('fires onChange when typing', () => {
    const onChange = vi.fn();
    render(
      <Dark>
        <MemberSearchFilter value="" onChange={onChange} />
      </Dark>,
    );
    const input = screen.getByPlaceholderText('Search members...');
    fireEvent.change(input, { target: { value: 'Alice' } });
    expect(onChange).toHaveBeenCalledWith('Alice');
  });
});

// ---------------------------------------------------------------------------
// Clear
// ---------------------------------------------------------------------------

describe('MemberSearchFilter -- clear', () => {
  it('shows clear button when there is a value', () => {
    render(
      <Dark>
        <MemberSearchFilter value="test" onChange={() => {}} />
      </Dark>,
    );
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('calls onClear when clear button is clicked', () => {
    const onClear = vi.fn();
    const onChange = vi.fn();
    render(
      <Dark>
        <MemberSearchFilter value="test" onChange={onChange} onClear={onClear} />
      </Dark>,
    );
    fireEvent.click(screen.getByLabelText('Clear search'));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('');
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('MemberSearchFilter -- skeleton', () => {
  it('renders skeleton placeholder when skeleton is true', () => {
    const { container } = render(
      <Dark>
        <MemberSearchFilter skeleton />
      </Dark>,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('MemberSearchFilter -- ref', () => {
  it('forwards ref to the wrapper div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <MemberSearchFilter ref={ref} />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('MemberSearchFilter -- className', () => {
  it('passes className through', () => {
    const { container } = render(
      <Dark>
        <MemberSearchFilter className="custom-filter" />
      </Dark>,
    );
    expect(container.querySelector('.custom-filter')).toBeInTheDocument();
  });
});
