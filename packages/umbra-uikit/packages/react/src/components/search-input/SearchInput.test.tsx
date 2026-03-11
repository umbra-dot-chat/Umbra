/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchInput } from './SearchInput';
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

describe('SearchInput — rendering', () => {
  it('renders an input element', () => {
    render(
      <Dark>
        <SearchInput />
      </Dark>,
    );
    expect(screen.getByPlaceholderText('Search…')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(
      <Dark>
        <SearchInput placeholder="Find items…" />
      </Dark>,
    );
    expect(screen.getByPlaceholderText('Find items…')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('SearchInput — sizes', () => {
  (['sm', 'md', 'lg'] as const).forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(
        <Dark>
          <SearchInput size={size} />
        </Dark>,
      );
      expect(screen.getByPlaceholderText('Search…')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Uncontrolled mode
// ---------------------------------------------------------------------------

describe('SearchInput — uncontrolled mode', () => {
  it('updates value on typing', () => {
    render(
      <Dark>
        <SearchInput />
      </Dark>,
    );
    const input = screen.getByPlaceholderText('Search…');
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(input).toHaveValue('hello');
  });

  it('shows clear button when value is non-empty', () => {
    render(
      <Dark>
        <SearchInput />
      </Dark>,
    );
    const input = screen.getByPlaceholderText('Search…');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('clears value when clear button is clicked', () => {
    const onClear = vi.fn();
    render(
      <Dark>
        <SearchInput onClear={onClear} />
      </Dark>,
    );
    const input = screen.getByPlaceholderText('Search…');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(screen.getByLabelText('Clear search'));
    expect(onClear).toHaveBeenCalledOnce();
    expect(input).toHaveValue('');
  });
});

// ---------------------------------------------------------------------------
// onSearch
// ---------------------------------------------------------------------------

describe('SearchInput — onSearch', () => {
  it('calls onSearch on Enter key', () => {
    const onSearch = vi.fn();
    render(
      <Dark>
        <SearchInput onSearch={onSearch} />
      </Dark>,
    );
    const input = screen.getByPlaceholderText('Search…');
    fireEvent.change(input, { target: { value: 'query' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSearch).toHaveBeenCalledWith('query');
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('SearchInput — disabled', () => {
  it('disables the input when disabled prop is true', () => {
    render(
      <Dark>
        <SearchInput disabled />
      </Dark>,
    );
    expect(screen.getByPlaceholderText('Search…')).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

describe('SearchInput — loading', () => {
  it('does not show clear button when loading', () => {
    render(
      <Dark>
        <SearchInput value="test" loading />
      </Dark>,
    );
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('SearchInput — className', () => {
  it('passes className through to the container', () => {
    const { container } = render(
      <Dark>
        <SearchInput className="custom-search" />
      </Dark>,
    );
    expect(container.querySelector('.custom-search')).toBeInTheDocument();
  });
});
