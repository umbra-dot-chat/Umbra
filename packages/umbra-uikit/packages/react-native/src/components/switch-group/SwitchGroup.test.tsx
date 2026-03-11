/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SwitchGroup } from './SwitchGroup';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

const defaultOptions = [
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'bluetooth', label: 'Bluetooth' },
  { value: 'airdrop', label: 'AirDrop' },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('SwitchGroup — rendering', () => {
  it('renders all option labels', () => {
    render(
      <Wrapper>
        <SwitchGroup options={defaultOptions} />
      </Wrapper>,
    );
    expect(screen.getByText('Wi-Fi')).toBeInTheDocument();
    expect(screen.getByText('Bluetooth')).toBeInTheDocument();
    expect(screen.getByText('AirDrop')).toBeInTheDocument();
  });

  it('renders group label when provided', () => {
    render(
      <Wrapper>
        <SwitchGroup label="Connectivity" options={defaultOptions} />
      </Wrapper>,
    );
    expect(screen.getByText('Connectivity')).toBeInTheDocument();
  });

  it('renders group description when provided', () => {
    render(
      <Wrapper>
        <SwitchGroup
          label="Connectivity"
          description="Manage wireless connections"
          options={defaultOptions}
        />
      </Wrapper>,
    );
    expect(screen.getByText('Manage wireless connections')).toBeInTheDocument();
  });

  it('renders option descriptions when provided', () => {
    const options = [
      { value: 'wifi', label: 'Wi-Fi', description: 'Connect to networks' },
    ];
    render(
      <Wrapper>
        <SwitchGroup options={options} />
      </Wrapper>,
    );
    expect(screen.getByText('Connect to networks')).toBeInTheDocument();
  });

  it('renders error message when provided', () => {
    render(
      <Wrapper>
        <SwitchGroup options={defaultOptions} error="At least one required" />
      </Wrapper>,
    );
    expect(screen.getByText('At least one required')).toBeInTheDocument();
  });

  it('has correct displayName', () => {
    expect(SwitchGroup.displayName).toBe('SwitchGroup');
  });
});

// ---------------------------------------------------------------------------
// onChange callback
// ---------------------------------------------------------------------------

describe('SwitchGroup — onChange', () => {
  it('calls onChange with the toggled value added when selecting', () => {
    const onChange = vi.fn();
    render(
      <Wrapper>
        <SwitchGroup options={defaultOptions} onChange={onChange} />
      </Wrapper>,
    );
    // Click on the Wi-Fi option row to toggle it on
    fireEvent.click(screen.getByText('Wi-Fi'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(['wifi']);
  });

  it('calls onChange with the value removed when deselecting', () => {
    const onChange = vi.fn();
    render(
      <Wrapper>
        <SwitchGroup
          options={defaultOptions}
          defaultValue={['wifi', 'bluetooth']}
          onChange={onChange}
        />
      </Wrapper>,
    );
    // Click on Wi-Fi to deselect
    fireEvent.click(screen.getByText('Wi-Fi'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(['bluetooth']);
  });

  it('supports controlled value', () => {
    render(
      <Wrapper>
        <SwitchGroup options={defaultOptions} value={['bluetooth']} />
      </Wrapper>,
    );
    // The component renders — controlled mode should not crash
    expect(screen.getByText('Bluetooth')).toBeInTheDocument();
  });
});
