/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PinInput } from './PinInput';
import { componentSizes } from '@coexist/wisp-core/tokens/shared';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCells() {
  return screen.getAllByRole('textbox') as HTMLInputElement[];
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('PinInput — rendering', () => {
  it('renders the correct number of cells (default 6)', () => {
    render(<Dark><PinInput /></Dark>);
    expect(getCells()).toHaveLength(6);
  });

  it('renders custom length', () => {
    render(<Dark><PinInput length={4} /></Dark>);
    expect(getCells()).toHaveLength(4);
  });

  it('renders as input elements', () => {
    render(<Dark><PinInput /></Dark>);
    const cells = getCells();
    cells.forEach((cell) => {
      expect(cell.tagName).toBe('INPUT');
    });
  });

  it('passes className through', () => {
    const { container } = render(<Dark><PinInput className="custom" /></Dark>);
    const wrapper = container.querySelector('.custom');
    expect(wrapper).toBeTruthy();
  });

  it('renders with maxLength=1 on each cell', () => {
    render(<Dark><PinInput /></Dark>);
    getCells().forEach((cell) => {
      expect(cell).toHaveAttribute('maxLength', '1');
    });
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('PinInput — sizes', () => {
  componentSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Dark><PinInput size={size} /></Dark>);
      expect(getCells()).toHaveLength(6);
    });
  });
});

// ---------------------------------------------------------------------------
// Input type
// ---------------------------------------------------------------------------

describe('PinInput — input type', () => {
  it('sets inputMode="numeric" for type="number"', () => {
    render(<Dark><PinInput type="number" /></Dark>);
    getCells().forEach((cell) => {
      expect(cell).toHaveAttribute('inputMode', 'numeric');
    });
  });

  it('sets inputMode="text" for type="text"', () => {
    render(<Dark><PinInput type="text" /></Dark>);
    getCells().forEach((cell) => {
      expect(cell).toHaveAttribute('inputMode', 'text');
    });
  });
});

// ---------------------------------------------------------------------------
// Controlled
// ---------------------------------------------------------------------------

describe('PinInput — controlled', () => {
  it('reflects controlled value', () => {
    render(<Dark><PinInput value="123" length={4} /></Dark>);
    const cells = getCells();
    expect(cells[0]).toHaveValue('1');
    expect(cells[1]).toHaveValue('2');
    expect(cells[2]).toHaveValue('3');
    expect(cells[3]).toHaveValue('');
  });

  it('calls onChange with full string', () => {
    const onChange = vi.fn();
    render(<Dark><PinInput value="" onChange={onChange} length={4} /></Dark>);
    const cells = getCells();
    fireEvent.input(cells[0], { target: { value: '5' } });
    expect(onChange).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Uncontrolled
// ---------------------------------------------------------------------------

describe('PinInput — uncontrolled', () => {
  it('respects defaultValue', () => {
    render(<Dark><PinInput defaultValue="42" length={4} /></Dark>);
    const cells = getCells();
    expect(cells[0]).toHaveValue('4');
    expect(cells[1]).toHaveValue('2');
    expect(cells[2]).toHaveValue('');
  });
});

// ---------------------------------------------------------------------------
// Label and hint
// ---------------------------------------------------------------------------

describe('PinInput — label and hint', () => {
  it('renders label text', () => {
    render(<Dark><PinInput label="Enter Code" /></Dark>);
    expect(screen.getByText('Enter Code')).toBeInTheDocument();
  });

  it('renders hint text', () => {
    render(<Dark><PinInput hint="Check your phone" /></Dark>);
    expect(screen.getByText('Check your phone')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Dark><PinInput error="Invalid code" /></Dark>);
    expect(screen.getByText('Invalid code')).toBeInTheDocument();
  });

  it('error replaces hint', () => {
    render(<Dark><PinInput hint="Helpful hint" error="Error message" /></Dark>);
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('Helpful hint')).not.toBeInTheDocument();
  });

  it('shows warning message', () => {
    render(<Dark><PinInput warning="Code expires soon" /></Dark>);
    expect(screen.getByText('Code expires soon')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('PinInput — disabled', () => {
  it('sets disabled on all cells', () => {
    render(<Dark><PinInput disabled /></Dark>);
    getCells().forEach((cell) => {
      expect(cell).toBeDisabled();
    });
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('PinInput — skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(<Dark><PinInput skeleton /></Dark>);
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveAttribute('aria-hidden');
  });

  it('does not render input cells when skeleton', () => {
    render(<Dark><PinInput skeleton /></Dark>);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });

  it('renders correct number of skeleton placeholders', () => {
    const { container } = render(<Dark><PinInput skeleton length={4} /></Dark>);
    // The skeleton renders divs inside the cell container
    const cellContainer = container.querySelector('[aria-hidden]')?.firstElementChild;
    expect(cellContainer?.children).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// onComplete
// ---------------------------------------------------------------------------

describe('PinInput — onComplete', () => {
  it('fires when all cells are filled', () => {
    const onComplete = vi.fn();
    render(<Dark><PinInput length={3} onComplete={onComplete} /></Dark>);
    const cells = getCells();

    fireEvent.input(cells[0], { target: { value: '1' } });
    fireEvent.input(cells[1], { target: { value: '2' } });
    fireEvent.input(cells[2], { target: { value: '3' } });

    expect(onComplete).toHaveBeenCalledWith('123');
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('PinInput — accessibility', () => {
  it('sets aria-label on each cell', () => {
    render(<Dark><PinInput label="Code" length={4} /></Dark>);
    const cells = getCells();
    expect(cells[0]).toHaveAttribute('aria-label', 'Code digit 1 of 4');
    expect(cells[3]).toHaveAttribute('aria-label', 'Code digit 4 of 4');
  });

  it('sets aria-invalid when error is present', () => {
    render(<Dark><PinInput error /></Dark>);
    getCells().forEach((cell) => {
      expect(cell).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('has role="group" on cell container', () => {
    render(<Dark><PinInput label="Code" /></Dark>);
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  it('error message has role="alert"', () => {
    render(<Dark><PinInput error="Bad code" /></Dark>);
    expect(screen.getByRole('alert')).toHaveTextContent('Bad code');
  });
});
