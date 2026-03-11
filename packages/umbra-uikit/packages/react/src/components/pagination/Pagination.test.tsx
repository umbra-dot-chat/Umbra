/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from './Pagination';
import { WispProvider } from '../../providers';

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Pagination -- rendering', () => {
  it('renders page buttons', () => {
    render(<Dark><Pagination page={1} totalPages={5} onChange={() => {}} /></Dark>);
    expect(screen.getByLabelText('Page 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 5')).toBeInTheDocument();
  });

  it('renders as a nav element with aria-label', () => {
    render(<Dark><Pagination page={1} totalPages={3} onChange={() => {}} /></Dark>);
    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    expect(nav).toBeInTheDocument();
  });

  it('passes className through', () => {
    render(<Dark><Pagination page={1} totalPages={3} onChange={() => {}} className="custom" /></Dark>);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('custom');
  });
});

// ---------------------------------------------------------------------------
// Click changes page
// ---------------------------------------------------------------------------

describe('Pagination -- click', () => {
  it('calls onChange when a page button is clicked', () => {
    const onChange = vi.fn();
    render(<Dark><Pagination page={1} totalPages={5} onChange={onChange} /></Dark>);
    fireEvent.click(screen.getByLabelText('Page 2'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('does not call onChange when clicking the current page', () => {
    const onChange = vi.fn();
    render(<Dark><Pagination page={3} totalPages={5} onChange={onChange} /></Dark>);
    fireEvent.click(screen.getByLabelText('Page 3'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Prev / Next
// ---------------------------------------------------------------------------

describe('Pagination -- prev/next', () => {
  it('previous button calls onChange with page - 1', () => {
    const onChange = vi.fn();
    render(<Dark><Pagination page={3} totalPages={5} onChange={onChange} /></Dark>);
    fireEvent.click(screen.getByLabelText('Previous page'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('next button calls onChange with page + 1', () => {
    const onChange = vi.fn();
    render(<Dark><Pagination page={3} totalPages={5} onChange={onChange} /></Dark>);
    fireEvent.click(screen.getByLabelText('Next page'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('previous button is disabled on first page', () => {
    render(<Dark><Pagination page={1} totalPages={5} onChange={() => {}} /></Dark>);
    expect(screen.getByLabelText('Previous page')).toBeDisabled();
  });

  it('next button is disabled on last page', () => {
    render(<Dark><Pagination page={5} totalPages={5} onChange={() => {}} /></Dark>);
    expect(screen.getByLabelText('Next page')).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// First / Last
// ---------------------------------------------------------------------------

describe('Pagination -- first/last', () => {
  it('first button navigates to page 1', () => {
    const onChange = vi.fn();
    render(<Dark><Pagination page={5} totalPages={10} onChange={onChange} /></Dark>);
    fireEvent.click(screen.getByLabelText('First page'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('last button navigates to last page', () => {
    const onChange = vi.fn();
    render(<Dark><Pagination page={5} totalPages={10} onChange={onChange} /></Dark>);
    fireEvent.click(screen.getByLabelText('Last page'));
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('first button is disabled on page 1', () => {
    render(<Dark><Pagination page={1} totalPages={10} onChange={() => {}} /></Dark>);
    expect(screen.getByLabelText('First page')).toBeDisabled();
  });

  it('last button is disabled on last page', () => {
    render(<Dark><Pagination page={10} totalPages={10} onChange={() => {}} /></Dark>);
    expect(screen.getByLabelText('Last page')).toBeDisabled();
  });

  it('hides first/last buttons when showFirstLast is false', () => {
    render(<Dark><Pagination page={5} totalPages={10} onChange={() => {}} showFirstLast={false} /></Dark>);
    expect(screen.queryByLabelText('First page')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Last page')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Ellipsis
// ---------------------------------------------------------------------------

describe('Pagination -- ellipsis', () => {
  it('shows ellipsis when pages are truncated', () => {
    const { container } = render(<Dark><Pagination page={5} totalPages={10} onChange={() => {}} /></Dark>);
    const ellipses = container.querySelectorAll('span[aria-hidden]');
    expect(ellipses.length).toBeGreaterThan(0);
  });

  it('does not show ellipsis for few pages', () => {
    const { container } = render(<Dark><Pagination page={2} totalPages={3} onChange={() => {}} /></Dark>);
    const ellipses = container.querySelectorAll('span[aria-hidden]');
    expect(ellipses.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('Pagination -- disabled', () => {
  it('all buttons are disabled when disabled prop is true', () => {
    render(<Dark><Pagination page={3} totalPages={5} onChange={() => {}} disabled /></Dark>);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('does not call onChange when disabled', () => {
    const onChange = vi.fn();
    render(<Dark><Pagination page={3} totalPages={5} onChange={onChange} disabled /></Dark>);
    fireEvent.click(screen.getByLabelText('Page 2'));
    fireEvent.click(screen.getByLabelText('Next page'));
    fireEvent.click(screen.getByLabelText('Previous page'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Active page / ARIA
// ---------------------------------------------------------------------------

describe('Pagination -- active page and ARIA', () => {
  it('active page has aria-current=page', () => {
    render(<Dark><Pagination page={3} totalPages={5} onChange={() => {}} /></Dark>);
    const activeBtn = screen.getByLabelText('Page 3');
    expect(activeBtn).toHaveAttribute('aria-current', 'page');
  });

  it('inactive pages do not have aria-current', () => {
    render(<Dark><Pagination page={3} totalPages={5} onChange={() => {}} /></Dark>);
    const page1 = screen.getByLabelText('Page 1');
    expect(page1).not.toHaveAttribute('aria-current');
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Pagination -- sizes', () => {
  const sizes = ['sm', 'md', 'lg'] as const;
  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Dark><Pagination page={1} totalPages={5} onChange={() => {}} size={size} /></Dark>);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });
});
