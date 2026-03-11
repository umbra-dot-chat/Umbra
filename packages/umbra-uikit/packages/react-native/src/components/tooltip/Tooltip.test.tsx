/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Text } from 'react-native';
import { Tooltip } from './Tooltip';
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

describe('Tooltip — rendering', () => {
  it('renders children without crashing', () => {
    render(
      <Wrapper>
        <Tooltip content="Tip text">
          <Text>Hover target</Text>
        </Tooltip>
      </Wrapper>,
    );
    expect(screen.getByText('Hover target')).toBeInTheDocument();
  });

  it('does not show tooltip content by default', () => {
    render(
      <Wrapper>
        <Tooltip content="Hidden tip">
          <Text>Target</Text>
        </Tooltip>
      </Wrapper>,
    );
    expect(screen.queryByText('Hidden tip')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('Tooltip — disabled', () => {
  it('renders without crashing when disabled', () => {
    const { container } = render(
      <Wrapper>
        <Tooltip content="Disabled tip" disabled>
          <Text>Target</Text>
        </Tooltip>
      </Wrapper>,
    );
    expect(container).toBeTruthy();
    expect(screen.getByText('Target')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Placements
// ---------------------------------------------------------------------------

describe('Tooltip — placements', () => {
  const placements = ['top', 'bottom', 'left', 'right'] as const;

  placements.forEach((placement) => {
    it(`renders with placement="${placement}" without crashing`, () => {
      render(
        <Wrapper>
          <Tooltip content={`Tip ${placement}`} placement={placement}>
            <Text>{placement}</Text>
          </Tooltip>
        </Wrapper>,
      );
      expect(screen.getByText(placement)).toBeInTheDocument();
    });
  });
});
