/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Toolbar, ToolbarGroup, ToolbarSeparator } from './Toolbar';
import { toolbarSizes, toolbarVariants } from '@coexist/wisp-core/types/Toolbar.types';
import type { ToolbarSize, ToolbarVariant } from '@coexist/wisp-core/types/Toolbar.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderToolbar(props: Record<string, unknown> = {}) {
  return render(
    <Dark>
      <Toolbar {...props}>
        <ToolbarGroup>
          <button>Bold</button>
          <button>Italic</button>
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup>
          <button>Save</button>
        </ToolbarGroup>
      </Toolbar>
    </Dark>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Toolbar — rendering', () => {
  it('renders children buttons', () => {
    renderToolbar();
    expect(screen.getByText('Bold')).toBeInTheDocument();
    expect(screen.getByText('Italic')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('renders a toolbar element with role="toolbar"', () => {
    renderToolbar();
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
  });

  it('renders groups with role="group"', () => {
    renderToolbar();
    const groups = screen.getAllByRole('group');
    expect(groups).toHaveLength(2);
  });

  it('renders separator with role="separator"', () => {
    renderToolbar();
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Toolbar — sizes', () => {
  (toolbarSizes as readonly ToolbarSize[]).forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      renderToolbar({ size });
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('Toolbar — variants', () => {
  (toolbarVariants as readonly ToolbarVariant[]).forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      renderToolbar({ variant });
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// ToolbarGroup gap
// ---------------------------------------------------------------------------

describe('Toolbar — ToolbarGroup gap', () => {
  it('renders with default gap', () => {
    renderToolbar();
    const groups = screen.getAllByRole('group');
    expect(groups.length).toBeGreaterThan(0);
  });

  it('renders with gap="md"', () => {
    render(
      <Dark>
        <Toolbar>
          <ToolbarGroup gap="md">
            <button>A</button>
            <button>B</button>
          </ToolbarGroup>
        </Toolbar>
      </Dark>,
    );
    expect(screen.getByRole('group')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('Toolbar — accessibility', () => {
  it('separator has aria-orientation="vertical"', () => {
    renderToolbar();
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('Toolbar — className passthrough', () => {
  it('passes className to the root toolbar', () => {
    render(
      <Dark>
        <Toolbar className="toolbar-custom">
          <button>A</button>
        </Toolbar>
      </Dark>,
    );
    expect(screen.getByRole('toolbar')).toHaveClass('toolbar-custom');
  });

  it('passes className to ToolbarGroup', () => {
    render(
      <Dark>
        <Toolbar>
          <ToolbarGroup className="group-custom">
            <button>A</button>
          </ToolbarGroup>
        </Toolbar>
      </Dark>,
    );
    expect(screen.getByRole('group')).toHaveClass('group-custom');
  });

  it('passes className to ToolbarSeparator', () => {
    render(
      <Dark>
        <Toolbar>
          <ToolbarSeparator className="sep-custom" />
        </Toolbar>
      </Dark>,
    );
    expect(screen.getByRole('separator')).toHaveClass('sep-custom');
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('Toolbar — style merge', () => {
  it('merges user style onto root toolbar', () => {
    render(
      <Dark>
        <Toolbar style={{ marginTop: 42 }}>
          <button>A</button>
        </Toolbar>
      </Dark>,
    );
    expect(screen.getByRole('toolbar')).toHaveStyle({ marginTop: '42px' });
  });

  it('merges user style onto ToolbarGroup', () => {
    render(
      <Dark>
        <Toolbar>
          <ToolbarGroup style={{ padding: 10 }}>
            <button>A</button>
          </ToolbarGroup>
        </Toolbar>
      </Dark>,
    );
    expect(screen.getByRole('group')).toHaveStyle({ padding: '10px' });
  });

  it('merges user style onto ToolbarSeparator', () => {
    render(
      <Dark>
        <Toolbar>
          <ToolbarSeparator style={{ marginLeft: 8 }} />
        </Toolbar>
      </Dark>,
    );
    expect(screen.getByRole('separator')).toHaveStyle({ marginLeft: '8px' });
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('Toolbar — ref forwarding', () => {
  it('forwards ref to root toolbar div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Toolbar ref={ref}>
          <button>A</button>
        </Toolbar>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards ref to ToolbarGroup div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Toolbar>
          <ToolbarGroup ref={ref}>
            <button>A</button>
          </ToolbarGroup>
        </Toolbar>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards ref to ToolbarSeparator div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Toolbar>
          <ToolbarSeparator ref={ref} />
        </Toolbar>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
