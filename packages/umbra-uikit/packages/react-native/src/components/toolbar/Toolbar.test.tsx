/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Toolbar, ToolbarGroup, ToolbarSeparator } from './Toolbar';
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

describe('Toolbar — rendering', () => {
  it('renders children', () => {
    render(
      <Wrapper>
        <Toolbar>
          <span>Bold</span>
          <span>Italic</span>
        </Toolbar>
      </Wrapper>,
    );
    expect(screen.getByText('Bold')).toBeInTheDocument();
    expect(screen.getByText('Italic')).toBeInTheDocument();
  });

  it('has toolbar accessibility role', () => {
    const { container } = render(
      <Wrapper>
        <Toolbar>
          <span>Tool</span>
        </Toolbar>
      </Wrapper>,
    );
    const toolbar = container.querySelector('[role="toolbar"]');
    expect(toolbar).toBeTruthy();
  });

  it('has correct displayName', () => {
    expect(Toolbar.displayName).toBe('Toolbar');
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('Toolbar — variants', () => {
  const variants = ['elevated', 'pill', 'transparent'] as const;

  variants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      render(
        <Wrapper>
          <Toolbar variant={variant}>
            <span>Content</span>
          </Toolbar>
        </Wrapper>,
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// ToolbarGroup
// ---------------------------------------------------------------------------

describe('ToolbarGroup — rendering', () => {
  it('renders children inside a group', () => {
    render(
      <Wrapper>
        <Toolbar>
          <ToolbarGroup>
            <span>Grouped item</span>
          </ToolbarGroup>
        </Toolbar>
      </Wrapper>,
    );
    expect(screen.getByText('Grouped item')).toBeInTheDocument();
  });

  it('has correct displayName', () => {
    expect(ToolbarGroup.displayName).toBe('ToolbarGroup');
  });
});

// ---------------------------------------------------------------------------
// ToolbarSeparator
// ---------------------------------------------------------------------------

describe('ToolbarSeparator — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <Toolbar>
          <span>A</span>
          <ToolbarSeparator />
          <span>B</span>
        </Toolbar>
      </Wrapper>,
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    // Separator renders as a View (div) — toolbar should have at least 3 child elements
    const toolbar = container.querySelector('[role="toolbar"]');
    expect(toolbar).toBeTruthy();
    expect(toolbar!.children.length).toBeGreaterThanOrEqual(3);
  });

  it('has correct displayName', () => {
    expect(ToolbarSeparator.displayName).toBe('ToolbarSeparator');
  });
});
