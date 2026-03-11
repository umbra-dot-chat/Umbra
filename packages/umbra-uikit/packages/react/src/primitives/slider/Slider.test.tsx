/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Slider } from './Slider';
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

describe('Slider -- rendering', () => {
  it('renders slider with role="slider"', () => {
    render(
      <Dark>
        <Slider />
      </Dark>,
    );
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('sets aria-valuemin, aria-valuemax, aria-valuenow', () => {
    render(
      <Dark>
        <Slider min={10} max={200} defaultValue={50} />
      </Dark>,
    );
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', '10');
    expect(slider).toHaveAttribute('aria-valuemax', '200');
    expect(slider).toHaveAttribute('aria-valuenow', '50');
  });

  it('defaults to value 0, min 0, max 100', () => {
    render(
      <Dark>
        <Slider />
      </Dark>,
    );
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
    expect(slider).toHaveAttribute('aria-valuenow', '0');
  });
});

// ---------------------------------------------------------------------------
// Keyboard navigation
// ---------------------------------------------------------------------------

describe('Slider -- keyboard', () => {
  it('ArrowRight increases value by step', () => {
    const onChange = vi.fn();
    render(
      <Dark>
        <Slider defaultValue={50} step={1} onChange={onChange} />
      </Dark>,
    );
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith(51);
  });

  it('ArrowLeft decreases value by step', () => {
    const onChange = vi.fn();
    render(
      <Dark>
        <Slider defaultValue={50} step={1} onChange={onChange} />
      </Dark>,
    );
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith(49);
  });

  it('ArrowUp increases value by step', () => {
    const onChange = vi.fn();
    render(
      <Dark>
        <Slider defaultValue={50} step={5} onChange={onChange} />
      </Dark>,
    );
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowUp' });
    expect(onChange).toHaveBeenCalledWith(55);
  });

  it('ArrowDown decreases value by step', () => {
    const onChange = vi.fn();
    render(
      <Dark>
        <Slider defaultValue={50} step={5} onChange={onChange} />
      </Dark>,
    );
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowDown' });
    expect(onChange).toHaveBeenCalledWith(45);
  });

  it('Home sets value to min', () => {
    const onChange = vi.fn();
    render(
      <Dark>
        <Slider defaultValue={50} min={10} max={100} onChange={onChange} />
      </Dark>,
    );
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'Home' });
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('End sets value to max', () => {
    const onChange = vi.fn();
    render(
      <Dark>
        <Slider defaultValue={50} min={0} max={200} onChange={onChange} />
      </Dark>,
    );
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'End' });
    expect(onChange).toHaveBeenCalledWith(200);
  });

  it('does not exceed max', () => {
    const onChange = vi.fn();
    render(
      <Dark>
        <Slider defaultValue={99} max={100} step={5} onChange={onChange} />
      </Dark>,
    );
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith(100);
  });

  it('does not go below min', () => {
    const onChange = vi.fn();
    render(
      <Dark>
        <Slider defaultValue={2} min={0} step={5} onChange={onChange} />
      </Dark>,
    );
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith(0);
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('Slider -- disabled', () => {
  it('prevents keyboard interaction when disabled', () => {
    const onChange = vi.fn();
    render(
      <Dark>
        <Slider defaultValue={50} disabled onChange={onChange} />
      </Dark>,
    );
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('sets aria-disabled when disabled', () => {
    render(
      <Dark>
        <Slider disabled />
      </Dark>,
    );
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-disabled', 'true');
  });

  it('sets tabIndex to -1 when disabled', () => {
    render(
      <Dark>
        <Slider disabled />
      </Dark>,
    );
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('tabindex', '-1');
  });
});

// ---------------------------------------------------------------------------
// Step
// ---------------------------------------------------------------------------

describe('Slider -- step', () => {
  it('respects step prop for keyboard navigation', () => {
    const onChange = vi.fn();
    render(
      <Dark>
        <Slider defaultValue={50} step={10} onChange={onChange} />
      </Dark>,
    );
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith(60);
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Slider -- sizes', () => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(
        <Dark>
          <Slider size={size} />
        </Dark>,
      );
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('Slider -- skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(
      <Dark>
        <Slider skeleton />
      </Dark>,
    );
    const el = container.querySelector('div');
    expect(el).toHaveAttribute('aria-hidden');
  });

  it('does not render slider element when skeleton', () => {
    render(
      <Dark>
        <Slider skeleton />
      </Dark>,
    );
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

describe('Slider -- label', () => {
  it('renders label text when provided', () => {
    render(
      <Dark>
        <Slider label="Volume" />
      </Dark>,
    );
    expect(screen.getByText('Volume')).toBeInTheDocument();
  });

  it('sets aria-label on the thumb', () => {
    render(
      <Dark>
        <Slider label="Volume" />
      </Dark>,
    );
    expect(screen.getByRole('slider')).toHaveAttribute('aria-label', 'Volume');
  });
});

// ---------------------------------------------------------------------------
// Value display
// ---------------------------------------------------------------------------

describe('Slider -- value display', () => {
  it('shows value when showValue is true', () => {
    render(
      <Dark>
        <Slider showValue defaultValue={42} />
      </Dark>,
    );
    expect(screen.getByTestId('slider-value')).toHaveTextContent('42');
  });

  it('uses formatValue to format display', () => {
    render(
      <Dark>
        <Slider showValue defaultValue={75} formatValue={(v) => `${v}%`} />
      </Dark>,
    );
    expect(screen.getByTestId('slider-value')).toHaveTextContent('75%');
  });
});

// ---------------------------------------------------------------------------
// Controlled
// ---------------------------------------------------------------------------

describe('Slider -- controlled', () => {
  it('reflects controlled value', () => {
    const { rerender } = render(
      <Dark>
        <Slider value={30} />
      </Dark>,
    );
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '30');

    rerender(
      <Dark>
        <Slider value={70} />
      </Dark>,
    );
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '70');
  });

  it('calls onChange with new value on keyboard interaction', () => {
    const onChange = vi.fn();
    render(
      <Dark>
        <Slider value={50} onChange={onChange} />
      </Dark>,
    );
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith(51);
  });
});
