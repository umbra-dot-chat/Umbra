/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Slider } from './Slider';
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

describe('Slider — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <Slider testID="slider" />
      </Wrapper>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with a label', () => {
    render(
      <Wrapper>
        <Slider label="Volume" />
      </Wrapper>,
    );
    expect(screen.getByText('Volume')).toBeInTheDocument();
  });

  it('renders the displayed value when showValue is true', () => {
    render(
      <Wrapper>
        <Slider value={42} showValue />
      </Wrapper>,
    );
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders formatted value when formatValue is provided', () => {
    render(
      <Wrapper>
        <Slider value={75} showValue formatValue={(v) => `${v}%`} />
      </Wrapper>,
    );
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('has correct displayName', () => {
    expect(Slider.displayName).toBe('Slider');
  });
});

// ---------------------------------------------------------------------------
// Default value
// ---------------------------------------------------------------------------

describe('Slider — default value', () => {
  it('uses defaultValue of 0 when not specified', () => {
    render(
      <Wrapper>
        <Slider showValue />
      </Wrapper>,
    );
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('uses the provided defaultValue', () => {
    render(
      <Wrapper>
        <Slider defaultValue={50} showValue />
      </Wrapper>,
    );
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('respects controlled value prop', () => {
    render(
      <Wrapper>
        <Slider value={30} showValue />
      </Wrapper>,
    );
    expect(screen.getByText('30')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Min / max props
// ---------------------------------------------------------------------------

describe('Slider — min/max props', () => {
  it('clamps defaultValue to min when below range', () => {
    render(
      <Wrapper>
        <Slider defaultValue={-10} min={0} max={100} showValue />
      </Wrapper>,
    );
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('clamps defaultValue to max when above range', () => {
    render(
      <Wrapper>
        <Slider defaultValue={200} min={0} max={100} showValue />
      </Wrapper>,
    );
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders with custom min/max range', () => {
    render(
      <Wrapper>
        <Slider defaultValue={50} min={10} max={90} showValue />
      </Wrapper>,
    );
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('snaps to step increments', () => {
    render(
      <Wrapper>
        <Slider defaultValue={7} min={0} max={100} step={5} showValue />
      </Wrapper>,
    );
    // 7 should snap to nearest step of 5 => 5
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('applies disabled opacity', () => {
    const { container } = render(
      <Wrapper>
        <Slider testID="slider" disabled />
      </Wrapper>,
    );
    // The root wrapper View has opacity 0.5 when disabled
    const root = container.firstChild as HTMLElement;
    expect(root.style.opacity).toBe('0.5');
  });
});
