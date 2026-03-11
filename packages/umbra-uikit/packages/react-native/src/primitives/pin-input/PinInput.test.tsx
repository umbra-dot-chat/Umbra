/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PinInput } from './PinInput';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCells() {
  return screen.getAllByRole('textbox');
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('PinInput — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <PinInput />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders the correct number of inputs (default 6)', () => {
    render(
      <Wrapper>
        <PinInput />
      </Wrapper>,
    );
    expect(getCells()).toHaveLength(6);
  });

  it('renders custom length', () => {
    render(
      <Wrapper>
        <PinInput length={4} />
      </Wrapper>,
    );
    expect(getCells()).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// Masked mode
// ---------------------------------------------------------------------------

describe('PinInput — masked mode', () => {
  it('displays bullet character when mask is true and value is set', () => {
    render(
      <Wrapper>
        <PinInput mask value="123" length={4} />
      </Wrapper>,
    );
    const cells = getCells();
    // Masked cells should show the bullet character U+2022
    expect(cells[0]).toHaveValue('\u2022');
    expect(cells[1]).toHaveValue('\u2022');
    expect(cells[2]).toHaveValue('\u2022');
    // Empty cell remains empty
    expect(cells[3]).toHaveValue('');
  });

  it('does not mask when mask is false', () => {
    render(
      <Wrapper>
        <PinInput mask={false} value="12" length={4} />
      </Wrapper>,
    );
    const cells = getCells();
    expect(cells[0]).toHaveValue('1');
    expect(cells[1]).toHaveValue('2');
  });
});

// ---------------------------------------------------------------------------
// Label and hint
// ---------------------------------------------------------------------------

describe('PinInput — label and hint', () => {
  it('renders label text', () => {
    render(
      <Wrapper>
        <PinInput label="Enter Code" />
      </Wrapper>,
    );
    expect(screen.getByText('Enter Code')).toBeInTheDocument();
  });

  it('renders hint text', () => {
    render(
      <Wrapper>
        <PinInput hint="Check your phone" />
      </Wrapper>,
    );
    expect(screen.getByText('Check your phone')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(
      <Wrapper>
        <PinInput error="Invalid code" />
      </Wrapper>,
    );
    expect(screen.getByText('Invalid code')).toBeInTheDocument();
  });
});
