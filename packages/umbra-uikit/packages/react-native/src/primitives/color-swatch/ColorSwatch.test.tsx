/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ColorSwatch } from './ColorSwatch';
import { WispProvider } from '../../providers';
import {
  colorSwatchSizes,
  colorSwatchShapes,
} from '@coexist/wisp-core/types/ColorSwatch.types';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ColorSwatch — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <ColorSwatch color="#3B82F6" />
      </Wrapper>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with a testID', () => {
    render(
      <Wrapper>
        <ColorSwatch color="#3B82F6" testID="swatch" />
      </Wrapper>,
    );
    expect(screen.getByTestId('swatch')).toBeInTheDocument();
  });

  it('renders with bordered=true by default', () => {
    const { container } = render(
      <Wrapper>
        <ColorSwatch color="#10B981" />
      </Wrapper>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with bordered=false without crashing', () => {
    const { container } = render(
      <Wrapper>
        <ColorSwatch color="#EF4444" bordered={false} />
      </Wrapper>,
    );
    expect(container.firstChild).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('ColorSwatch — sizes', () => {
  colorSwatchSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(
        <Wrapper>
          <ColorSwatch color="#3B82F6" size={size} testID={`swatch-${size}`} />
        </Wrapper>,
      );
      expect(screen.getByTestId(`swatch-${size}`)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

describe('ColorSwatch — shapes', () => {
  colorSwatchShapes.forEach((shape) => {
    it(`renders shape="${shape}" without crashing`, () => {
      render(
        <Wrapper>
          <ColorSwatch color="#8B5CF6" shape={shape} testID={`swatch-${shape}`} />
        </Wrapper>,
      );
      expect(screen.getByTestId(`swatch-${shape}`)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Color prop
// ---------------------------------------------------------------------------

describe('ColorSwatch — color prop', () => {
  it('renders with a hex color', () => {
    const { container } = render(
      <Wrapper>
        <ColorSwatch color="#FF5733" />
      </Wrapper>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with an rgb color', () => {
    const { container } = render(
      <Wrapper>
        <ColorSwatch color="rgb(59, 130, 246)" />
      </Wrapper>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with a named color', () => {
    const { container } = render(
      <Wrapper>
        <ColorSwatch color="tomato" />
      </Wrapper>,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
