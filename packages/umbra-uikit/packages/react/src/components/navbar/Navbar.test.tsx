/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from './Navbar';
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

describe('Navbar — rendering', () => {
  it('renders as a <nav> element', () => {
    render(
      <Dark>
        <Navbar>
          <NavbarBrand>Logo</NavbarBrand>
        </Navbar>
      </Dark>,
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <Dark>
        <Navbar>
          <NavbarBrand>My App</NavbarBrand>
        </Navbar>
      </Dark>,
    );
    expect(screen.getByText('My App')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('Navbar — variants', () => {
  (['solid', 'bordered', 'floating'] as const).forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      render(
        <Dark>
          <Navbar variant={variant}>
            <NavbarBrand>Brand</NavbarBrand>
          </Navbar>
        </Dark>,
      );
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

describe('Navbar — sub-components', () => {
  it('renders NavbarBrand', () => {
    render(
      <Dark>
        <Navbar>
          <NavbarBrand>Brand Text</NavbarBrand>
        </Navbar>
      </Dark>,
    );
    expect(screen.getByText('Brand Text')).toBeInTheDocument();
  });

  it('renders NavbarContent', () => {
    render(
      <Dark>
        <Navbar>
          <NavbarContent>
            <span>Nav Link</span>
          </NavbarContent>
        </Navbar>
      </Dark>,
    );
    expect(screen.getByText('Nav Link')).toBeInTheDocument();
  });

  it('renders NavbarItem', () => {
    render(
      <Dark>
        <Navbar>
          <NavbarContent>
            <NavbarItem>Home</NavbarItem>
            <NavbarItem active>About</NavbarItem>
          </NavbarContent>
        </Navbar>
      </Dark>,
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('Navbar — className', () => {
  it('passes className through to the <nav> element', () => {
    render(
      <Dark>
        <Navbar className="custom-nav">
          <NavbarBrand>Brand</NavbarBrand>
        </Navbar>
      </Dark>,
    );
    expect(screen.getByRole('navigation')).toHaveClass('custom-nav');
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('Navbar — ref forwarding', () => {
  it('forwards ref to the <nav> element', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Dark>
        <Navbar ref={ref}>
          <NavbarBrand>Brand</NavbarBrand>
        </Navbar>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe('NAV');
  });
});
