/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from './Pagination';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Pagination — rendering', () => {
  it('renders page numbers', () => {
    render(
      <Wrapper>
        <Pagination page={1} totalPages={5} onChange={() => {}} />
      </Wrapper>,
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders navigation buttons with accessibility labels', () => {
    render(
      <Wrapper>
        <Pagination page={3} totalPages={5} onChange={() => {}} />
      </Wrapper>,
    );
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    expect(screen.getByLabelText('First page')).toBeInTheDocument();
    expect(screen.getByLabelText('Last page')).toBeInTheDocument();
  });

  it('renders a single page without crashing', () => {
    const { container } = render(
      <Wrapper>
        <Pagination page={1} totalPages={1} onChange={() => {}} />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('marks the active page as selected via accessibility state', () => {
    render(
      <Wrapper>
        <Pagination page={3} totalPages={5} onChange={() => {}} />
      </Wrapper>,
    );
    const activePage = screen.getByLabelText('Page 3');
    expect(activePage).toHaveAttribute('aria-selected', 'true');
  });

  it('renders ellipsis for many pages', () => {
    render(
      <Wrapper>
        <Pagination page={5} totalPages={10} onChange={() => {}} />
      </Wrapper>,
    );
    // Ellipsis character
    const ellipses = screen.getAllByText('\u2026');
    expect(ellipses.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// onChange
// ---------------------------------------------------------------------------

describe('Pagination — onChange', () => {
  it('calls onChange with the clicked page number', () => {
    const onChange = vi.fn();
    render(
      <Wrapper>
        <Pagination page={1} totalPages={5} onChange={onChange} />
      </Wrapper>,
    );
    const page2 = screen.getByLabelText('Page 2');
    fireEvent.click(page2);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('calls onChange with page - 1 when previous is pressed', () => {
    const onChange = vi.fn();
    render(
      <Wrapper>
        <Pagination page={3} totalPages={5} onChange={onChange} />
      </Wrapper>,
    );
    fireEvent.click(screen.getByLabelText('Previous page'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('calls onChange with page + 1 when next is pressed', () => {
    const onChange = vi.fn();
    render(
      <Wrapper>
        <Pagination page={3} totalPages={5} onChange={onChange} />
      </Wrapper>,
    );
    fireEvent.click(screen.getByLabelText('Next page'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('calls onChange with 1 when first page button is pressed', () => {
    const onChange = vi.fn();
    render(
      <Wrapper>
        <Pagination page={3} totalPages={5} onChange={onChange} />
      </Wrapper>,
    );
    fireEvent.click(screen.getByLabelText('First page'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('calls onChange with totalPages when last page button is pressed', () => {
    const onChange = vi.fn();
    render(
      <Wrapper>
        <Pagination page={3} totalPages={5} onChange={onChange} />
      </Wrapper>,
    );
    fireEvent.click(screen.getByLabelText('Last page'));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('does not call onChange when disabled', () => {
    const onChange = vi.fn();
    render(
      <Wrapper>
        <Pagination page={3} totalPages={5} onChange={onChange} disabled />
      </Wrapper>,
    );
    fireEvent.click(screen.getByLabelText('Next page'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Pagination — sizes', () => {
  const sizes = ['sm', 'md', 'lg'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(
        <Wrapper>
          <Pagination page={1} totalPages={3} onChange={() => {}} size={size} />
        </Wrapper>,
      );
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });
});
